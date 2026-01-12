# epsniff Claude Plugins

Custom plugins for Claude Code.

## Installation

Add this marketplace to Claude Code:

```bash
claude mcp add-marketplace github:epsniff/claude-plugins
```

Then install plugins:

```bash
claude plugin install log-summarizer@epsniff/claude-plugins
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
1. Invoke `/log-summarizer` skill
2. Paste logs into the canvas (Cmd+V)
3. Press Enter to submit
4. Claude spawns a subagent to analyze and summarize
5. You receive a clean summary (raw logs never enter your conversation context)
