import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const WS_URL = 'ws://localhost:8082';

const CHAT_LABEL_POSTFIX = ':';
const CHAT_MESSAGE_POSTFIX = '###';
class ChatConnection {
  _init(url) {
    this._url = url;
    this._isConnected = false;
    this._messageHandlers = {};
    this._labelToSetters = {};
    this._bufferStates = {};
    this._retryTimeout = null;
  }
  constructor(url) {
    this._init(url);
  }
  async connect({ maxRetries = 5 } = {}) {
    this._init(this._url);
    this._socket = new WebSocket(this._url);
    this._socket.addEventListener('open', () => {
      this._messageHandlers = {};
      this._isConnected = true;
    });
    this._socket.addEventListener('close', () => {
      this._isConnected = false;
    });
    this._socket.addEventListener('message', ({ data }) => {
      for (const handler of Object.values(this._messageHandlers)) {
        handler(data);
      }
    });
    return new Promise((resolve, reject) => {
      const retry = (counter) => {
        clearTimeout(this._retryTimeout);
        if (!this._isConnected && counter > 0) {
          const fn = () => retry(counter - 1);
          this._retryTimeout = setTimeout(fn, 5000);
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
    if (id in this._messageHandlers) return;
    this._labelToSetters[id] = labelToSetters;
    this._messageHandlers[id] = this._createMessageHandlerForID(id);
  }
  _createMessageHandlerForID(id) {
    return (
      data => {
        data = JSON.parse(data);
        if (!(id in data)) {
          return;
        }
        const token = data[id];
        const trimmedToken = token.trim();
        if (!(id in this._bufferStates)) {
          this._bufferStates[id] = {
            label: null,
            tmp: '',
            counter: -1,
          };
        }
        const bufferState = this._bufferStates[id];
        if (trimmedToken === 'DONE') {
          bufferState.label = null;
          bufferState.tmp = '';
          bufferState.counter = -1;
          return;
        }
        if (bufferState.label === null) {
          if (trimmedToken !== ':') {
            bufferState.tmp += trimmedToken;
          } else {
            bufferState.label = bufferState.tmp;
            bufferState.tmp = '';
            bufferState.counter = -1;
            return;
          }
        } else {
          const { label } = bufferState;
          const labelToSetters = this._labelToSetters[id];
          const setState = labelToSetters[label];
          if (trimmedToken !== '###') {
            bufferState.counter++;
            setState(token, bufferState.counter);
          } else {
            // reset buffer state
            bufferState.label = null;
            bufferState.tmp = '';
            bufferState.counter = -1;
          }
        }
      }
    );
  }
}

const CHAT_CONNECTION = new ChatConnection(WS_URL);

function useLocationHashName() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => {
      setHash(
        window.location.hash.substring(
          window.location.hash.lastIndexOf("#") + 1,
        ),
      );
    };
    window.addEventListener("hashchange", onHashChange);
    onHashChange();
    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);
  useEffect(() => {
    window.location.hash = "#" + hash.substring(hash.lastIndexOf("#") + 1);
  }, [hash]);
  return [hash, setHash];
}

function OnboardingPage({ onBeginClick }) {
  return (
    <div className="onboarding">
      <img src="./logo.png" className="logo" alt="" />
      <button
        onClick={() => onBeginClick()}
        className="input-base button primary begin-button"
      >
        Let’s Begin
      </button>
    </div>
  );
}
function FormField({
  label,
  required,
  className,
  value,
  setValue,
  id,
  children: inputField,
}) {
  const onChange = (evt) => {
    setValue(evt.currentTarget.value);
  };
  return (
    <div className="form-field">
      <label className="label" htmlFor={id}>
        {label}{" "}
      </label>
      {React.cloneElement(inputField, {
        ...inputField.props,
        value,
        setValue,
        id,
        name: id,
        required,
        className: `${className ? className + " " : ""}input input-base`,
        onChange,
      })}
    </div>
  );
}

function toNum(val) {
  if (typeof val === "number") {
    return val;
  }
  return parseInt(val);
}

let handleValidityTimeout;
function handleValidityFeedback(elem, inputElem) {
  elem.style.background = "pink none";
  inputElem.style.caretColor = "#000";
  clearTimeout(handleValidityTimeout);
  handleValidityTimeout = setTimeout(() => {
    elem.style.background = "";
    inputElem.style.caretColor = "";
  }, 500);
}

function NumberInput({
  value = "",
  setValue,
  specialControls = null,
  className,
  disabled,
  min = null,
  max = null,
  onChange = undefined,
  ...rest
}) {
  const fieldRef = useRef(null);
  const [width, setWidth] = useState("2ch");
  const onChangeHandler = (evt) => {
    let val = String(evt.currentTarget.value);
    if (!evt.currentTarget.checkValidity()) {
      setValue((prev) => (prev.length === 0 ? 0 : prev));
      evt.preventDefault();
      handleValidityFeedback(
        evt.currentTarget.parentElement,
        evt.currentTarget,
      );
      return;
    }
    const isZeroOnAddChar = val.length === 2 && val[0] === "0";
    if (isZeroOnAddChar) {
      setValue(val.toString().substring(1));
    } else if (!isZeroOnAddChar) {
      setValue(val);
    } else if (onChange) {
      onChange(evt);
    }
  };
  useEffect(() => {
    if (specialControls === "currency") {
      const len = Math.max(1.5, value.length);
      setWidth(len.toString() + "ch");
    }
  }, [value, specialControls]);
  const incrementHandler = (type) => {
    return (evt) => {
      if (type === "increase") {
        setValue((old) => Math.min(max ?? Infinity, Math.max(min ?? 0, toNum(old || 0) + 1)));
      } else if (type === "decrease") {
        setValue((old) => Math.min(max ?? Infinity, Math.max(min ?? 0, toNum(old || 0) - 1)));
      } else {
        throw new Error("Bad type");
      }
      evt.preventDefault();
      evt.stopPropagation();
    };
  };
  const inputEl = (
    <input
      ref={fieldRef}
      {...rest}
      disabled={disabled}
      className=""
      type="number"
      value={value}
      onChange={onChangeHandler}
      onInput={onChangeHandler}
    />
  );
  const parentProps = { onClick: () => fieldRef.current.focus(), className };
  if (specialControls === "increment-buttons") {
    return (
      <div {...parentProps}>
        <button
          onClick={incrementHandler("decrease")}
          disabled={disabled}
          className="input-base button increment-button"
        >
          -
        </button>
        {inputEl}
        <button
          onClick={incrementHandler("increase")}
          disabled={disabled}
          className="input-base button increment-button"
        >
          +
        </button>
      </div>
    );
  } else if (specialControls === "currency") {
    return (
      <div {...parentProps}>
        ${React.cloneElement(inputEl, { ...inputEl.props, style: { width } })}
      </div>
    );
  } else {
    console.assert(false);
  }
}

function DateField(props) {
  const dateInputRef = useRef(null);
  return (
    <div onClick={() => dateInputRef.current.focus()} className="input input-base">
      <input ref={dateInputRef} {...props} className="" type="date" />
    </div>
  );
}

function InfoSection({ title, id, hasAction, inputData }) {
  const [body, setBody] = useState('');
  const [bookAction, setBookAction] = useState('');
  const isSentRef = useRef(false);
  useEffect(() => {
    if (!inputData) {
      console.assert(false);
      return;
    }
    if (isSentRef.current) {
      return;
    }
    const conn = CHAT_CONNECTION;
    const addBodyTokenEl = (token, counter) => {
      return (prev) => 
        (<>{prev}<span className="token-in"
          style={{ '--inc-factor': counter }}>{token}</span></>);
    };
    const addToken = token => {
      return (prev) => prev + token;
    };
    conn.initMessageHandler(id, {
      'Message': (token, counter) => setBody(addBodyTokenEl(token, counter)),
      'URL_for_booking_for_flight': token => setBookAction(addToken(token)),
      'URL_for_booking_for_hotel': token => setBookAction(addToken(token)),
    });
    const prompt = JSON.stringify({
      prompt_id: id,
      prompt_message: inputData,
    });
    isSentRef.current = true;
    conn.socket.send(prompt);
  }, [inputData]);
  return (
    <section
      className="section"
    >
      <h2 className="subheading">{title}</h2>
        <div className={`group${!body || (hasAction && !bookAction) ? ' loading' : ''}`}>
          <p>{body ? body : (<>&nbsp;</>)}</p>
          {hasAction && <a
            hidden={!bookAction}
            aria-hidden={bookAction ? "false" : "true"}
            href={bookAction}
            target="_blank"
            rel="noopener noreferrer"
            className={`input-base button primary${bookAction ? ' fly-in' : ''}`}
          >
            Book
          </a>}
        </div>
    </section>
  );
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatDate(date) {
  const day = date.getDate();
  let dayPostfix = 'th';
  if (day === 1) dayPostfix = 'st';
  else if (day === 2) dayPostfix = 'nd';
  else if (day === 3) dayPostfix = 'rd';
  const monthName = MONTH_NAMES[date.getMonth()];
  let year = date.getFullYear().toString();
  year = year.substring(year.length - 2);
  return `${day}${dayPostfix} ${monthName} ${year}`;
}

function App() {
  const [curPageName, setCurPageName] = useLocationHashName();
  const [numTravellers, setNumTravellers] = useState(1);
  const [flyingFrom, setFlyingFrom] = useState('New York');
  const [flyingTo, setFlyingTo] = useState('Paris');
  const [fromDate, setFromDate] = useState('2026-06-01');
  const [toDate, setToDate] = useState('2026-06-30');
  const [budget, setBudget] = useState(0);
  const [submitData, setSubmitData] = useState(null);
  const [isFormDisabled, setSubmitDisabled] = useState(false);
  if (curPageName === "") {
    return <OnboardingPage onBeginClick={() => setCurPageName("form")} />;
  } else if (curPageName === "form") {
    const submitHandler = (evt) => {
      setSubmitDisabled(true);
      setSubmitData({
        "number_of_travellers": numTravellers,
        "flying_from": flyingFrom,
        "flying_to": flyingTo,
        "from_date": fromDate,
        "to_date": toDate,
        "budget": '$' + budget,
      });
      (async () => {
        try {
          await CHAT_CONNECTION.connect();
          setCurPageName("results");
        } catch (ex) {
          // TO-DO error handling
          throw ex;
          console.assert(false);
        } finally {
          setSubmitDisabled(false);
        }
      })();
      evt.preventDefault();
    };
    return (
      <form onSubmit={submitHandler} action="#" className="form">
        <FormField
          required
          label="Number of Travellers"
          value={numTravellers}
          setValue={setNumTravellers}
          id="numTravelers"
        >
          <NumberInput
            autoFocus
            disabled={isFormDisabled}
            tabIndex={1}
            min={1}
            specialControls={"increment-buttons"}
          />
        </FormField>
        <FormField value={flyingFrom} setValue={setFlyingFrom} required label="Flying From" id="flyingFrom">
          <input disabled={isFormDisabled} tabIndex={2} type="text" />
        </FormField>
        <FormField value={flyingTo} setValue={setFlyingTo} required label="Flying To" id="flyingTo">
          <input disabled={isFormDisabled} tabIndex={3} type="text" />
        </FormField>
        <FormField value={fromDate} setValue={setFromDate} required label="From Date" id="fromDate">
          <DateField disabled={isFormDisabled} tabIndex={4} />
        </FormField>
        <FormField value={toDate} setValue={setToDate} required label="To Date" id="toDate">
          <DateField disabled={isFormDisabled} tabIndex={5} />
        </FormField>
        <FormField
          value={budget}
          setValue={setBudget}
          required={false}
          label="Budget"
          id="budget"
          className="with-currency"
        >
          <NumberInput disabled={isFormDisabled} specialControls="currency" min={0} tabIndex={6} />
        </FormField>
        <button disabled={isFormDisabled} type="submit" className="input-base primary button">
      {isFormDisabled ? 'One Sec…' : 'Plan my Trip!'}
        </button>
      </form>
    );
  } else if (curPageName === "results") {
    return (
      <div className="results">
        <h1 className="heading">Your Trip</h1>
        <header className="section trip-info">
          <div className="group date">→ {formatDate(new Date(fromDate))}</div>
          <div className="group date">{formatDate(new Date(toDate))} ←</div>
          <div className="group destination">
            {flyingFrom} → {flyingTo}
          </div>
        </header>
        <InfoSection hasAction={false} inputData={submitData} title="Weather" id="weather" />
        <InfoSection hasAction={true} inputData={submitData} title="Flights" id="flights" />
        <InfoSection hasAction={true} inputData={submitData} title="Hotel" id="hotel" />
      </div>
    );
  }
}

export default App;
