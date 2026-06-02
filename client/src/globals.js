
import ChatConnection from './ChatConnection';

export const USER_ID = crypto.randomUUID();
export const TODAY = new Date();

export const CHAT_CONNECTION = new ChatConnection({ url: 'ws://localhost:8082', userId: USER_ID });

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

