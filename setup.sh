#!/bin/bash

# Prepare InfinityCode in the folder that the user chose to keep it in.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
CURRENT_DIR="$(pwd -P)"

case "$(uname -s)" in
  Darwin) OS_NAME="macOS" ;;
  Linux) OS_NAME="Linux" ;;
  MINGW*|MSYS*|CYGWIN*) OS_NAME="Windows (Git Bash)" ;;
  *)
    echo "InfinityCode setup does not support this operating system: $(uname -s)" >&2
    exit 1
    ;;
esac

echo "InfinityCode setup — $OS_NAME detected"

if [ "$CURRENT_DIR" != "$PROJECT_DIR" ]; then
  echo "Please run setup from the InfinityCode project folder:" >&2
  echo "  cd \"$PROJECT_DIR\" && ./setup.sh" >&2
  exit 1
fi

echo
echo "InfinityCode will stay here:"
echo "  $PROJECT_DIR"
read -r "answer?Is this where you want to keep InfinityCode? [Y/n] "
case "${answer:-Y}" in
  Y|y|Yes|yes)
    ;;
  *)
    echo "Setup stopped without moving or changing InfinityCode."
    echo "Move or clone the project to the directory you want, open a terminal there,"
    echo "and run ./setup.sh again."
    exit 0
    ;;
esac

if [ ! -f "$PROJECT_DIR/backend/app.py" ] || [ ! -d "$PROJECT_DIR/tool_instructions" ]; then
  echo "This does not look like a complete InfinityCode project folder." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3.10 or newer is required. Install Python 3, then run setup again." >&2
  exit 1
fi

if ! python3 -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)'; then
  echo "Python 3.10 or newer is required. Install a newer Python, then run setup again." >&2
  exit 1
fi

if [ ! -x "$PROJECT_DIR/.venv/bin/python" ]; then
  echo "Creating Python environment…"
  python3 -m venv "$PROJECT_DIR/.venv"
fi

echo "Installing InfinityCode core packages…"
"$PROJECT_DIR/.venv/bin/python" -m pip install --upgrade pip
"$PROJECT_DIR/.venv/bin/python" -m pip install -r "$PROJECT_DIR/requirements.txt"

# Keep the Finder launcher identical to the shell launcher’s current behavior.
cp "$PROJECT_DIR/infinitycode.sh" "$PROJECT_DIR/infinitycode.command"
chmod +x "$PROJECT_DIR/setup.sh" "$PROJECT_DIR/infinitycode.sh" "$PROJECT_DIR/infinitycode.command"

echo
echo "Setup complete. Start InfinityCode with:"
echo "  ./infinitycode.sh"
if [ "$OS_NAME" = "macOS" ]; then
  echo "Or double-click infinitycode.command in Finder."
fi
