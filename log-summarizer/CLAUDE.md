# Log Summarizer Plugin Development

Use Bun for all development:

- `bun run src/cli.ts` - Run CLI
- `bun install` - Install dependencies

## Quick Commands

```bash
# Check terminal environment
bun run src/cli.ts env

# Show canvas in current terminal (for testing)
bun run src/cli.ts show

# Spawn canvas (opens split pane)
bun run src/cli.ts spawn
```

## Project Structure

```
log-summarizer/
├── src/
│   ├── cli.ts                # CLI entry point (commander.js)
│   ├── terminal.ts           # Terminal detection + spawning (iTerm2/tmux/Apple Terminal)
│   ├── ipc/
│   │   ├── types.ts          # IPC message types
│   │   ├── server.ts         # Unix socket server
│   │   └── server-hook.ts    # React hook for IPC
│   └── canvas/
│       ├── log-summarizer.tsx # Main canvas component
│       ├── types.ts          # Canvas type definitions
│       ├── components/
│       │   ├── log-line.tsx  # Individual log line with highlighting
│       │   ├── log-viewer.tsx # Scrollable log display
│       │   └── status-bar.tsx # Bottom status bar
│       └── utils/
│           └── log-parser.ts # Log format detection & parsing
├── skills/
│   └── log-summarizer/
│       └── SKILL.md          # Skill documentation for Claude
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest
├── run-log-summarizer.sh     # Shell wrapper for spawning
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript config
```

## Architecture

1. User invokes `/log-summarizer` skill
2. Claude spawns canvas via `run-log-summarizer.sh spawn`
3. Canvas opens in iTerm2/tmux split pane
4. User pastes logs, views with syntax highlighting
5. User presses Enter to submit
6. Canvas writes logs to `/tmp/log-summarizer-{id}.log`
7. Canvas sends file path via IPC and exits
8. Claude spawns subagent to analyze the log file
9. Subagent returns summary to primary agent
10. Primary agent presents summary (raw logs never enter context)

## Key Design Decisions

### Temp File Instead of IPC Content

We write logs to a temp file and only send the file path via IPC. This:
- Avoids IPC buffer size limits
- Keeps the primary agent's context clean
- Allows subagent to read logs without context pollution

### Subagent Summarization

Raw logs go to a subagent, not the primary agent. Benefits:
- Primary context stays clean
- Can handle very large logs
- Focused analysis by specialized agent
- Only summary enters main conversation

### Paste Detection

Terminal paste comes as rapid character input. We:
- Accumulate input in a buffer
- Use 50ms debounce to detect paste completion
- Process buffer after debounce

## Terminal Support

| Terminal | Method | Notes |
|----------|--------|-------|
| iTerm2 | AppleScript `split vertically` | Side-by-side pane |
| tmux | `tmux split-window -h -p 67` | 67% width split |
| Apple Terminal | New window | Positioned on right half |

Session IDs are tracked in `/tmp/log-summarizer-*` files for pane reuse.

## IPC Protocol

Canvas → Controller messages:
- `{ type: "ready", scenario }` - Canvas initialized
- `{ type: "selected", data: LogSubmissionResult }` - User submitted
- `{ type: "cancelled", reason }` - User cancelled

Socket path: `/tmp/log-summarizer-{id}.sock`
Log file path: `/tmp/log-summarizer-{id}.log`

## Testing

1. `bun install` - Install dependencies
2. `bun run src/cli.ts env` - Check terminal detection
3. `bun run src/cli.ts show` - Test canvas in current terminal
4. `bun run src/cli.ts spawn` - Test split pane spawning
5. Paste logs and verify highlighting
6. Press Enter and check `/tmp/log-summarizer-log-1.log` exists
