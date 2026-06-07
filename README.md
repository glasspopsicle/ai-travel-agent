# AI Travel Agent (Ollama Implementation)



https://github.com/user-attachments/assets/09e2d66c-de61-4bdf-8ab7-5b61c01674ae



This project is based on the "AI Travel Agent" solo project from the Scrimba course Learn AI Agents.
It replaces direct OpenAI API calls (and other API calls) with a custom implementation using the Ollama API and a WebSocket connection.


## Prerequisites
- [Node.js](https://nodejs.org/) (v22.15+)
- [Ollama](https://ollama.ai/) (v0.17.1+) installed and running
- Sufficient Disk space if you want to run a local model (e.g., 6.6 GB for the `qwen3.5:9b` model)

### Obtain an Ollama API Key (Free)
- [Sign up for Ollama](https://signin.ollama.com/)
- [Generate an Ollama API key](https://ollama.com/settings/keys)

## Before Running
### Download the Project Source and Install Project Dependencies
Clone the source code and install the project dependencies.
```bash
git clone https://github.com/glasspopsicle/ai-travel-agent
cd ai-travel-agent
npm install
```

## Quick Start
### How to Run with a Thinking Model
Download The Qwen 3.5 Model `qwen3.5:9b` then run the project:
```bash
ollama pull qwen3.5:9b
OLLAMA_API_KEY=XXXXXXXXXXXXXX npm run
```

### How to Run with a Non-thinking Model
For non-thinking models, tool calls need to be disabled.
This limits the response capability significantly and can lead to hallucinations. (Also note that smaller and older models can ignore instructions and then lead to erroneous formatting.) It nevertheless can be done.
```bash
ollama pull llama3.2:3b
OLLAMA_API_KEY=XXXXXXXXXXXXXX npm run -- --model ollama3.2:3b --use-web no
```

## Customization
To configure the WebSocket server that connects to the Ollama chat API, you can update the `REACT_APP_WS_HOST` (defaults to `localhost`) and `REACT_APP_WS_PORT` (defaults to `8081`) environment variables. For example:
```bash
REACT_APP_WS_HOST=localhost REACT_APP_WS_PORT=9999 npm run
```

You can disable `stdout` for the thinking stream on the server with the `--show-thinking` flag. For example,
```bash
npm run -- --show-thinking no # hides thinking and tool calls from console output
```

### Storing the Ollama API key
You can store the Ollama API key in the `./server/.env` file.
### How to Run with All Flags
The following runs exactly as `npm run`:
```bash
REACT_APP_WS_HOST=localhost REACT_APP_WS_PORT=8081 npm run -- --model qwen3.5:9b --show-thinking yes --use-web yes
```

### Modifying the Model Parameters
You can modify the model parameters in the `./server/model.config.js` file.
