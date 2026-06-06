import { WebSocketServer } from 'ws';
import * as http from 'node:http';
import ollama from 'ollama';
import tools from './tools.js';
import * as process from 'node:process';
import updateFromArgv from './update-from-argv.js';
import modelConfig from './model.config.js';

const args = {
  model: undefined,
  'show-thinking': undefined,
  'use-web': undefined,
};

try {
  updateFromArgv(args);
} catch (err) {
  console.error(err.message);
}

const MODEL = String(args.model ?? 'qwen3.5:9b');
const HOST = process.env.REACT_APP_WS_HOST ?? 'localhost';
const PORT = process.env.REACT_APP_WS_PORT ?? 8081;
const SHOW_THINKING = args['show-thinking'] != null ? args['show-thinking'] : true;
const USE_WEB = args['use-web'] != null ? args['use-web'] : true;
const THINKING = USE_WEB; // Enable thinking if web tool calls available

const CANCEL_REQUESTS_SET = new Set();

const CHAT_PARAMS = {
  model: MODEL,
  think: THINKING,
  tools: USE_WEB ? Object.values(tools) : undefined,
  options: modelConfig
};

async function agent(userId, systemPrompt, userPrompt, onResponse = null) {
  const messages = [];
  messages.push(
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  );
  while (true) {
    const stream = await ollama.chat({
      ...CHAT_PARAMS,
      stream: true,
      messages,
    });
    let thinking, content, toolCalls = [], finishedThinking = false;
    for await (const chunk of stream) {
      if (chunk.message.thinking) {
        if (SHOW_THINKING) {
          process.stdout.write(chunk.message.thinking);
        }
        thinking += chunk.message.thinking;
      }
      if (chunk.message.content) {
        if (finishedThinking === false) {
          finishedThinking = true;
          if (SHOW_THINKING) {
            process.stdout.write('\nEOT\n');
          }
        }
        content += chunk.message.content;
        onResponse && onResponse(chunk.message.content);
      }
      if (chunk.message.tool_calls?.length > 0) {
        toolCalls.push(...chunk.message.tool_calls);
      }
      if (CANCEL_REQUESTS_SET.has(userId)) {
        return;
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
    if (SHOW_THINKING) {
      console.log();
    }
    for (const toolCall of toolCalls) {
      if (toolCall.function.name in tools) {
        let res;
        try {
          if (SHOW_THINKING) {
            console.log(`\nCalling ${toolCall.function.name}`);
            console.log(toolCall.function.arguments);
          }
          if (CANCEL_REQUESTS_SET.has(userId)) {
            return;
          }
          res = await tools[toolCall.function.name].method(toolCall.function.arguments);
        } catch (ex) {
          console.error(ex.message);
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
const SPECIALIZED_PROMPTS = {
  'activities': `
(You may list one to four activities.)
Message: Here are some activities you can try: 
- ___________________________
- ___________________________
- ___________________________
DONE
`,
  'weather': `
Message: You can expect the weather in ________ to be ______________. Low will be __________ and high will be __________.
DONE
`,
  'flights': `
Message: The best option for you is with ____________. ### URL_for_booking_for_flight: ______________________
DONE
`,
  'hotel': `
Message: We recommend you stay at the ________ in _________. ### URL_for_booking_for_hotel: ______________________
DONE
`,
};
const SPECIALIZED_PROMPT_IDS = Object.keys(SPECIALIZED_PROMPTS);

function computeSystemPrompt(specializedPromptId = null) {
  return `
You will receive input as JSON from the user.
The user is planning to travel, you will be given the user constraints in JSON in the following keys:
- \`number_of_travellers\`,
- \`flying_from\`,
- \`flying_to\`,
- \`from_date\`,
- \`to_date\`, and, lastly,
- \`budget\`.
The user expects you to reply strictly in the following format in the case of a successful query:
${SPECIALIZED_PROMPTS[specializedPromptId] || ''}
Otherwise, strictly use the following format:
Message: Sorry, but ________________________________.
DONE
`;
}

const httpServer = http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end();
});

const socketServer = new WebSocketServer({ server: httpServer });

httpServer.listen(PORT, () => {
  console.log(`Server listening on ws://${HOST}:${PORT}`);
});

socketServer.on('connection', socket => {
  console.log('Client connected');
  socket.on('message', async data => {
    console.log(`Received: ${data}`);
    try {
      const { user_id: userId, prompt_id: promptId, prompt_message: prompt, action } = JSON.parse(data);
      if (action === 'CANCEL') {
        CANCEL_REQUESTS_SET.add(userId);
        return;
      } else if (action === 'INIT') {
        CANCEL_REQUESTS_SET.delete(userId);
        socket.send(JSON.stringify({ 'user_id': userId, 'state': 'OK' }));
        return;
      }
      if ('budget' in prompt) {
        const budget = prompt.budget.trim();
        if (budget === '$' || isNaN(budget?.replace('$', ''))) {
          prompt.budget = 'Infinite';
        }
      }
      if (SPECIALIZED_PROMPT_IDS.includes(promptId)) {
        await agent(userId, computeSystemPrompt(promptId), JSON.stringify(prompt), (msg) => {
          if (SHOW_THINKING) process.stdout.write(msg);
          socket.send(JSON.stringify({ 'user_id': userId, [promptId]: msg }));
        });
      }
    } catch (ex) {
      // TO-DO handle bad input
      console.error(ex.message);
    }
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});
