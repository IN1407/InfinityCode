#!/bin/bash

# Start the InfinityCode backend.
#
# It has to be launched from the project root, not from backend/: app.py opens
# its instruction files by bare relative path ("tool_instructions/command.md"),
# so they resolve against the working directory. From anywhere else it dies at
# import with FileNotFoundError.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

if [ ! -d "$ROOT" ] || [ ! -f "$ROOT/backend/app.py" ]; then
  echo "infinitycode: project folder not found:" >&2
  echo "  $ROOT" >&2
  echo "run setup.sh again from the InfinityCode project folder." >&2
  exit 1
fi

cd "$ROOT"

# Use the interpreter setup.sh prepared when it exists. Otherwise leave the
# command usable for someone who installed the core packages with python3.
PYTHON="$ROOT/.venv/bin/python"
if [ ! -x "$PYTHON" ]; then
  PYTHON="python3"
fi

# python -m rather than the uvicorn binary, so it always runs under the
# interpreter that actually has FastAPI and the rest installed.
exec "$PYTHON" -m uvicorn backend.app:app --reload "$@"
