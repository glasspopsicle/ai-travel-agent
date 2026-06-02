
import ChatConnection from './ChatConnection';

export const USER_ID = crypto.randomUUID();
export const TODAY = new Date();

const HOST = process.env.REACT_APP_WS_HOST ?? 'localhost';
const PORT = process.env.REACT_APP_WS_PORT ?? 8081;
export const CHAT_CONNECTION = new ChatConnection({ url: `ws://${HOST}:${PORT}`, userId: USER_ID });

export const MONTH_NAMES = [
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

