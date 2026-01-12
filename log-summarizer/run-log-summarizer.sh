#!/bin/bash
# Run the log-summarizer canvas

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if bun is available
if ! command -v bun &> /dev/null; then
    echo "Error: bun is required but not installed."
    exit 1
fi

# Run the CLI with all arguments
exec bun run src/cli.ts "$@"
