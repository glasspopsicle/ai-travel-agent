import * as process from 'node:process';

export default function writeFromArgv(args, argv = process.argv) {
  if (args == null) {
    return;
  }
  const out = {};
  let key;
  let error;
  for (const argStr of argv.splice(1)) {
    if (key != null) {
      if (argStr.startsWith('--')) {
        error = new Error('Missing value for argument "' + key + '"');
        key = null;
        break;
      }
      const lcArgStr = argStr.toLowerCase();
      if (key in out) {
        error = new Error('Duplicate flag "' + key + '"');
        key = null;
        break;
      }
      if (lcArgStr === 'yes') {
        out[key] = true;
      } else if (lcArgStr === 'no') {
        out[key] = false;
      } else {
        out[key] = argStr;
      }
      key = null;
      continue;
    }
    const potentialKey = argStr.substring(2);
    if (argStr.startsWith('--')) {
      if (potentialKey in args) {
        key = potentialKey;
      } else {
        error = new Error('Unknown flag "' + potentialKey + '"');
        continue;
      }
    }
  }
  if (key != null) {
    error = new Error('Missing value for argument ' + key);
  }
  for (const key in out) {
    args[key] = out[key];
  }
  if (error != null) {
    throw error;
  }
}
