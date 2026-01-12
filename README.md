# epsniff Claude Plugins

Custom plugins for Claude Code.

## Installation

Add this marketplace to Claude Code:

```bash
claude plugin marketplace add epsniff/claude-plugins
```

Then install plugins:

```bash
claude plugin install log-summarizer@epsniff-claude-plugins
```

## Available Plugins

### log-summarizer

A terminal canvas for pasting and summarizing logs with Claude.

**Features:**
- Opens in iTerm2/tmux split pane
- Syntax highlighting for errors, warnings, timestamps, JSON
- Scrollable log viewer
- Subagent-based summarization (keeps primary context clean)

**Usage:**
1. Invoke `/log-summarizer` skill in Claude Code
2. Paste logs into the canvas (Cmd+V)
3. Scroll with arrow keys or PgUp/PgDn
4. Press Enter to submit
5. Claude spawns a subagent to analyze and summarize
6. You receive a clean summary (raw logs never enter your conversation context)

**Controls:**
| Key | Action |
|-----|--------|
| Cmd+V | Paste logs |
| ↑/↓ | Scroll one line |
| PgUp/PgDn | Scroll one page |
| Enter | Submit for summarization |
| Esc | Cancel |

## Development

Each plugin is a subdirectory with its own `package.json`. To develop locally:

```bash
cd log-summarizer
bun install
bun run src/cli.ts env    # Check terminal detection
bun run src/cli.ts show   # Test canvas in current terminal
bun run src/cli.ts spawn  # Test split pane spawning
```

## Adding New Plugins

1. Create a new directory for your plugin
2. Add a `.claude-plugin/plugin.json` manifest
3. Add skill documentation in `skills/<skill-name>/SKILL.md`
4. Update `.claude-plugin/marketplace.json` to include your plugin
5. Push and run `claude plugin marketplace update epsniff-claude-plugins`
