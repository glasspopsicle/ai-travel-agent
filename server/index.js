import * as ws from 'ws';
import * as http from 'http';
import ollama, { Ollama } from 'ollama';
import * as process from 'node:process';
import * as dotenv from 'dotenv';

const DEBUG = false;
const USE_WEB = true;

const ollamaClient = new Ollama();

dotenv.config({ quiet: true });

const toolsObj = {
  'web_search': {
    type: 'function',
    method: async ({ query }) => {
      const res = await ollamaClient.webSearch({ query });
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
      const res = await ollamaClient.webFetch({ url });
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
};

const chatParams = {
  model: USE_WEB ? 'travel_agent' : 'travel_agent_offline',
  think: USE_WEB,
  tools: USE_WEB ? Object.values(toolsObj) : undefined,
};

async function agent(systemPrompt, userPrompt, onResponse = null) {
  const messages = [];
  messages.push(
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  );
  while (true) {
    const stream = await ollama.chat({
      ...chatParams,
      stream: true,
      messages,
    });
    let thinking, content, toolCalls = [], finishedThinking = false;
    for await (const chunk of stream) {
      if (chunk.message.thinking) {
        process.stdout.write(chunk.message.thinking);
        thinking += chunk.message.thinking;
      }
      if (chunk.message.content) {
        if (finishedThinking === false) {
          finishedThinking = true;
          process.stdout.write('\nEOT\n');
        }
        content += chunk.message.content;
        onResponse && onResponse(chunk.message.content);
      }
      if (chunk.message.tool_calls?.length > 0) {
        toolCalls.push(...chunk.message.tool_calls);
      }
    }
    if (thinking || content || toolCalls.length > 0) {
      messages.push({
        role: 'assistant',
        thinking,
        content,
        tool_calls: toolCalls,
      });
    } else {
      break;
    }
    for (const toolCall of toolCalls) {
      if (toolCall.function.name in toolsObj) {
        let res;
        try {
          console.log(`Calling ${toolCall.function.name}`);
          console.log(toolCall.function.arguments);
          res = await toolsObj[toolCall.function.name].method(toolCall.function.arguments);
        } catch (ex) {
          res = JSON.stringify(ex);
        } finally {
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: res,
          });
        }
      } else {
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: 'Unknown tool',
        });
      }
    }
  }
}
function computeSystemPrompt(specializedPromptId = null) {
  const specializedPrompts = {
    'weather': `
Message: You can expect the weather to be ______________. Low will be __________ and high will be __________.
DONE
`,
    'flights': `
Message: The best option for you is with ____________. ###
URL_for_booking_for_flight: ______________________
DONE
`,
    'hotel': `
Message: We recommend you stay at the ________ in _________. ###
URL_for_booking_for_hotel: ______________________
DONE
`,
  };
  return `
You will receive input as JSON from the user.
The user is planning to travel, you will be given the user constraints in JSON in the following keys:
- \`number_of_travellers\`,
- \`flying_from\`,
- \`flying_to\`,
- \`from_date\`,
- \`to_date\`, and, lastly,
- \`budget\`.
The user expects you to reply strictly in the following format:
  ${specializedPrompts[specializedPromptId] || ''}
${USE_WEB ? "" : "You have only 1 minute at most! You may hallucinate your response. :)"}
`;
}

const inputPrompt = {
  "number_of_travellers": 1,
  "flying_from": "New York",
  "flying_to": "Paris",
  "from_date": "2026-11-24",
  "to_date": "2026-12-05",
  "budget": "$500",
};
if (DEBUG) {
  await agent(computeSystemPrompt('weather'), JSON.stringify(inputPrompt), (msg) => process.stdout.write(msg));
  await agent(computeSystemPrompt('flights'), JSON.stringify(inputPrompt), (msg) => process.stdout.write(msg));
  await agent(computeSystemPrompt('hotel'), JSON.stringify(inputPrompt), (msg) => process.stdout.write(msg));
  process.exit(0);
}
const port = 8082;

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server running');
});

const wsServer = new ws.WebSocketServer({ server: httpServer });

httpServer.listen(port, () => {
  console.log(`Server listening on ws://localhost:${port}`);
});

wsServer.on('connection', socket => {
  console.log('Client connected');
  socket.on('message', async data => {
    console.log(`Received: ${data}`);
    try {
      const { prompt_id: promptId, prompt_message: promptJSON } = JSON.parse(data);
      if (['weather', 'flights', 'hotel'].includes(promptId)) {
        await agent(computeSystemPrompt(promptId), JSON.stringify(promptJSON), (msg) => {
          process.stdout.write(msg);
          socket.send(JSON.stringify({ [promptId]: msg }));
        });
      }
    } catch (ex) {
      // TO-DO handle bad input
      console.log(ex);
      console.assert(false);
    }
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});
