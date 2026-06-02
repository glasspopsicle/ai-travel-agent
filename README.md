# AI Travel Agent (Ollama Implementation)
This project is based on the "AI Travel Agent" solo project from the Scrimba course Learn AI Agents.
It replaces direct OpenAI API calls with a custom implementation using Ollama and a WebSocket connection.


## Prerequisites
- [Node.js](https://nodejs.org/) (v22.15+)
- [Ollama](https://ollama.ai/) (v0.17.1+) installed and running

## How to Obtain an API key
- [Sign up for Ollama](https://signin.ollama.com/signup)
- [Generate an API key](https://ollama.com/settings/keys)

## How to Run
After you have Node.js and Ollama installed, you can download any of the 
Ollama models (preferably with thinking capability.)

For example:
```bash
ollama pull qwen3.5:9b
```

```bash
npm run -- --model qwen3.5:9b
```
