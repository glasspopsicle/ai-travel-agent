import { argv } from 'node:process';

const args = {
  model: undefined,
  debug: undefined,
  'use-web': undefined,
  thinking: undefined,
};

export default function writeFromArgv(args) {
  const out = {};
  let key;
  for (const argStr of argv.splice(1)) {
    if (key != null) {
      if (argStr.startsWith('--')) {
        throw new Error('Missing value for argument ' + key);
      }
      out[key] = argStr;
      key = null;
      continue;
    }
    const potentialKey = argStr.substring(2);
    if (argStr.startsWith('--')) {
      if (potentialKey in args) {
        key = potentialKey;
      } else {
        throw new Error('Unknown flag ' + potentialKey);
      }
    }
  }
  if (key != null) {
    throw new Error('Missing value for argument ' + key);
  }
  for (const key in out) {
    args[key] = out[key];
  }
}
