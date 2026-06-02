
const CHAT_LABEL_POSTFIX = ':';
const CHAT_MESSAGE_POSTFIX = '###';

export default class ChatConnection {
  _init() {
    this._isConnected = false;
    this._messageHandlers = new Map();
    this._labelToSetters = new Map();
    this._bufferStates = new Map();
    this._retryTimeout = null;
  }
  constructor({ url, userId }) {
    this._USER_ID = userId;
    this._URL = url;
    this._init(url);
  }
  _createWebSocket() {
    this._init();
    this._socket = new WebSocket(this._URL);
    this._socket.addEventListener('open', () => {
      this._messageHandlers.clear();
      this._isConnected = true;
    });
    this._socket.addEventListener('close', () => {
      this._isConnected = false;
    });
    this._socket.addEventListener('message', ({ data }) => {
      for (const handler of this._messageHandlers.values()) {
        handler(data);
      }
    });
  }
  async connect({ maxRetries = 5, retryDelay = 5000 } = {}) {
    this._createWebSocket();
    return new Promise((resolve, reject) => {
      const retry = (counter) => {
        clearTimeout(this._retryTimeout);
        if (!this._isConnected && counter > 0) {
          if (!this._socket || this._socket.readyState === WebSocket.CLOSED) {
            this._createWebSocket();
          }
          const fn = () => retry(counter - 1);
          this._retryTimeout = setTimeout(fn, retryDelay);
        } else if (this._isConnected) {
          resolve(this._socket);
        } else {
          reject(this._socket);
        }
      };
      retry(maxRetries);
    });
  }
  get socket() {
    return this._socket;
  }
  initMessageHandler(id, labelToSetters) {
    if (this._messageHandlers.has(id)) return;
    this._labelToSetters.set(id, labelToSetters);
    this._messageHandlers.set(id, this._createMessageHandlerForID(id));
  }
  _resetBufferState(id) {
    const bufferState = this._bufferStates.get(id);
    bufferState.label = null;
    bufferState.content = '';
    bufferState.counter = -1;
  }
  _createMessageHandlerForID(id) {
    return (
      data => {
        data = JSON.parse(data);
        if (data.user_id !== this._USER_ID || !(id in data)) {
          return;
        }
        const token = data[id];
        const trimmedToken = token.trim();
        if (!this._bufferStates.has(id)) {
          this._bufferStates.set(id, {});
          this._resetBufferState(id);
        }
        const bufferState = this._bufferStates.get(id);
        if (trimmedToken === 'DONE') {
          this._resetBufferState(id);
          return;
        }
        if (bufferState.label === null) {
          if (trimmedToken !== CHAT_LABEL_POSTFIX) {
            bufferState.content += trimmedToken;
          } else {
            bufferState.label = bufferState.content;
            bufferState.content = '';
            bufferState.counter = -1;
          }
        } else {
          const { label } = bufferState;
          const labelToSetters = this._labelToSetters.get(id);
          const setState = label in labelToSetters ? labelToSetters[label] : undefined;
          if (trimmedToken !== CHAT_MESSAGE_POSTFIX) {
            bufferState.counter++;
            setState && setState(token, bufferState.counter);
          } else {
            this._resetBufferState(id);
          }
        }
      }
    );
  }
  sendCancelRequest(userId) {
    this._socket?.send(`{"user_id":"${userId}","action":"CANCEL"}`);
  }
  sendInitRequest({ userId: targetUserId, maxRetries = 5, retryDelay = 1000 } = {}) {
    return new Promise((resolve, reject) => {
      const socket = this._socket;
      let successReceived = false;
      let timeout;
      if (!socket) reject(new Error('Socket is undefined!'));
      socket?.send(`{"user_id":"${targetUserId}","action":"INIT"}`);
      const handler = ({ data }) => {
        const { user_id: userId, state } = JSON.parse(data);
        if (userId === targetUserId && state === 'OK') {
          resolve();
          clearTimeout(timeout);
          successReceived = true;
          socket?.removeEventListener('message', handler);
        }
      };
      socket?.addEventListener('message', handler);
      (function retry(retries) {
        if (successReceived) {
          return;
        }
        if (retries > 0) {
          timeout = setTimeout(() => retry(retries - 1), retryDelay);
        } else if (!successReceived) {
          reject(new Error('Did not get init response!'));
          socket?.removeEventListener('message', handler);
        } else {
          resolve();
        }
      })(maxRetries);
    });
  }
}

