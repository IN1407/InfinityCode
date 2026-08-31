#!/bin/bash

# macOS Finder launcher for InfinityCode. Keep this file beside
# infinitycode.sh; setup.sh refreshes it from that launcher.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
exec "$SCRIPT_DIR/infinitycode.sh" "$@"
