import { Ollama } from 'ollama';
import * as dotenv from 'dotenv';

const client = new Ollama();

// Gets the OLLAMA_API_KEY from ~/.env if defined there
dotenv.config({ quiet: true });

export default {
  'web_search': {
    type: 'function',
    method: async ({ query }) => {
      const res = await client.webSearch({ query });
      return JSON.stringify(res);
    },
    function: {
      name: 'web_search',
      parameters: {
        type: 'object',
        required: ['query'],
        properties: {
          'query': {
            type: 'string',
          },
        },
      },
    },
  },
  'web_fetch': {
    type: 'function',
    method: async ({ url }) => {
      const res = await client.webFetch({ url });
      return JSON.stringify(res);
    },
    function: {
      name: 'web_fetch',
      parameters: {
        type: 'object',
        properties: {
          'url': {
            type: 'string',
          },
        },
      },
    },
  },
}
