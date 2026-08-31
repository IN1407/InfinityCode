# InfinityCode

InfinityCode is a local, browser-based coding agent. It runs a FastAPI backend
from this project folder, streams model responses to a vanilla HTML/CSS/JS
interface, and can use the tools you enable for a chat: file reads and edits,
commands, web search, browser automation, MCP servers, and subagents.

GitHub: [@IN1407](https://github.com/IN1407) · [InfinityCode](https://github.com/IN1407/InfinityCode)

## What is in this project

- `backend/app.py` — the active InfinityCode server and browser API.
- `frontend/` — the web interface served by the backend.
- `tool_instructions/` — model-facing instructions for each built-in tool.
- `backend/mcp.json` — optional MCP server configuration.
- `infinitycode.sh` / `infinitycode.command` — launchers generated or refreshed by `setup.sh`.

`backend/app.py` reads `tool_instructions/` using paths relative to the
project root. Start it through one of the launchers, or run the Uvicorn command
below from the project root; starting it from `backend/` will fail.

## Setup

Requirements: Python 3.10 or newer and an internet connection the first time
the Python packages are installed. macOS and Linux are supported directly;
Windows users can run the shell setup from WSL or Git Bash.

1. Put the `InfinityCode` folder where you want to keep it permanently, then
   open a terminal in that folder.
2. Run:

   ```bash
   ./setup.sh
   ```

   The script identifies the operating system, confirms that this is the
   chosen installation folder, creates `.venv`, installs the core runtime
   packages, and makes both launchers executable. If you answer that this is
   not the folder you want, it stops without moving anything; move or clone
   the project to the preferred folder, open that folder, and run it again.

3. Start InfinityCode:

   ```bash
   ./infinitycode.sh
   ```

   On macOS, double-click `infinitycode.command` in Finder if you prefer. The
   server starts at [http://127.0.0.1:8000](http://127.0.0.1:8000); open that
   address in a browser.

To stop the server, press `Control-C` in the terminal that launched it.

## DeepSeek V4 Pro through xkiro

During the first browser setup, select **Custom OpenAI-compatible endpoint**.
Enter the xkiro base URL, API key, and the exact DeepSeek V4 Pro model ID shown
by your xkiro account. The endpoint normally needs its `/v1` suffix. These
values are account-specific: do not commit the API key or paste it into issues.

This route uses the same OpenAI-compatible chat-completions interface as the
other hosted providers, so it also supports compatible local servers.
DeepSeek build a html snake game that increases speed each time you score
link: [Snake Game by DeepSeek in InfinityCode](https://github.com/IN1407/InfinityCode-first-vibe-coded-project) 

## Manual start

The launchers run this command from the project root:

```bash
python3 -m uvicorn backend.app:app --reload
```

They prefer the project’s `.venv` interpreter when setup has created one. The
`--reload` flag is intended for development and automatically restarts after
backend changes.

## Optional capabilities

InfinityCode loads heavier local-model and integration libraries only when you
select their related features. Install the matching package in `.venv` as
needed—for example `transformers` for local Hugging Face models,
`llama-cpp-python` for GGUF, `playwright` for browser automation, or `mcp` for
MCP servers. The browser setup identifies the provider and tool configuration
for each chat.

## Safety

Tools that can change files, execute commands, open browsers, or invoke MCP
servers require explicit configuration and may request permission. Enable only
the tools you expect the active model to use, and review generated commands
before approving them.
