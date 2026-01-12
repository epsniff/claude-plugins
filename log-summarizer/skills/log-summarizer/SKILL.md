---
name: log-summarizer
description: |
  Log summarizer canvas for pasting logs. Opens a terminal canvas
  where users paste logs, then spawns a subagent to summarize them.
  The primary agent receives only the clean summary, not raw logs.
---

# Log Summarizer Canvas

A terminal canvas for pasting log content and submitting it to Claude for summarization. The architecture keeps your context window clean by using a subagent for the actual log analysis.

## Usage Flow

When the user wants to paste and summarize logs, follow these steps:

### Step 1: Spawn the Canvas

Run this command to open the log summarizer in a split pane:

```bash
~/.claude/plugins/local/log-summarizer/run-log-summarizer.sh spawn
```

### Step 2: Inform the User

Tell the user:
> "I've opened a log viewer in a split pane. Paste your logs there using Cmd+V, then press Enter when ready. The canvas will highlight errors, warnings, and timestamps for easier reading."

### Step 3: Wait for Submission

The canvas will:
1. Accept pasted log content
2. Show syntax highlighting (errors in red, warnings in yellow, timestamps in green)
3. Allow scrolling through large logs
4. Write logs to a temp file when user presses Enter
5. Exit automatically after submission

The log file will be saved at: `/tmp/log-summarizer-{id}.log`

### Step 4: Spawn a Subagent to Summarize

After the canvas exits, use the **Task tool** to spawn a subagent for summarization:

```
Read the log file at /tmp/log-summarizer-log-1.log and provide a structured summary.

Analyze the logs and report:

1. **Overview**: What type of logs are these? (application logs, server logs, build output, etc.)

2. **Error Analysis**:
   - Count of errors by type
   - Most critical errors with line numbers
   - Root cause patterns if identifiable

3. **Warning Analysis**:
   - Key warnings that may indicate problems
   - Patterns of recurring warnings

4. **Timeline**:
   - Time range of logs (if timestamps present)
   - Key events in chronological order

5. **Recommendations**:
   - Immediate actions needed
   - Investigation suggestions

Keep the summary under 500 words. Focus on actionable insights.
```

### Step 5: Present Summary to User

Share the subagent's summary with the user. The raw logs stay in the temp file and never enter the primary conversation context.

## Why Use a Subagent?

- **Context Preservation**: Raw logs (potentially thousands of lines) don't pollute your context window
- **Large Log Support**: Can analyze very large logs without hitting context limits
- **Focused Analysis**: Subagent specializes in log parsing
- **Clean Handoff**: You only see the actionable summary

## Canvas Controls (for user reference)

| Key | Action |
|-----|--------|
| Cmd+V / Ctrl+Shift+V | Paste logs |
| ↑/↓ | Scroll one line |
| PgUp/PgDn | Scroll one page |
| Enter | Submit logs for summarization |
| Esc | Cancel and close |

## Syntax Highlighting

The canvas automatically detects and highlights:
- **Errors** (ERROR, FATAL, CRITICAL): Red
- **Warnings** (WARN, WARNING): Yellow
- **Info** (INFO, NOTICE): Cyan
- **Debug/Trace**: Gray
- **Timestamps**: Green
- **JSON keys**: Magenta
- **JSON values**: Colored by type

## Supported Log Formats

- JSON structured logs
- Syslog format
- Generic timestamped logs
- Plain text

## Configuration (optional)

```typescript
interface LogSummarizerConfig {
  title?: string;       // Custom canvas title
  maxLines?: number;    // Max lines to accept (default: 10000)
}
```

## Result Format

The canvas sends this data via IPC (you don't need to parse this directly - just check the temp file exists):

```typescript
interface LogSubmissionResult {
  logFilePath: string;     // Path to temp file: /tmp/log-summarizer-{id}.log
  lineCount: number;       // Number of lines
  detectedFormat: string;  // "json" | "syslog" | "generic" | "unknown"
  sizeBytes: number;       // Size in bytes
}
```

## Example Conversation

**User**: "I have some error logs I need help with"

**Assistant**: "I'll open a log viewer for you."
*Runs: `~/.claude/plugins/local/log-summarizer/run-log-summarizer.sh spawn`*

"I've opened a log viewer in a split pane. Paste your logs there using Cmd+V, then press Enter when ready."

*User pastes logs and presses Enter*

*Spawns subagent to analyze /tmp/log-summarizer-log-1.log*

**Assistant**: "Here's what I found in your logs:

**Overview**: Application server logs from a Node.js service

**Errors** (12 total):
- `ECONNREFUSED` on database connection (8 occurrences, lines 45-120)
- `TypeError: Cannot read property 'id' of undefined` (4 occurrences, lines 200-250)

**Root Cause**: The database connection failures started at 10:45:23, causing the TypeError errors downstream when queries returned null.

**Recommendations**:
1. Check database server status and connectivity
2. Add null checks in the user service (around line 200)
3. Implement connection retry logic with exponential backoff"
