import { argv } from 'node:process';

const args = {
  model: undefined,
  debug: undefined,
  'use-web': undefined,
  thinking: undefined,
};

export default function readArgv() {
  for (const argStr of argv.splice(1)) {
    if (key != null) {
      if (argStr.startsWith('--')) {
        console.error('Missing value for argument ' + key);
        process.exit(1);
      }
      args[key] = argStr;
      key = null;
      continue;
    }
    const potentialKey = argStr.substring(2);
    if (argStr.startsWith('--')) {
      if (potentialKey in args) {
        key = potentialKey;
      } else {
        console.error('Unknown flag ' + potentialKey);
        process.exit(1);
      }
    }
  }
  if (key != null) {
    console.error('Missing value for argument ' + key);
    process.exit(1);
  }
}
