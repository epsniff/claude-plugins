import type { LogFormat, LogLevel, ParsedLogLine } from "../types";

// Timestamp patterns for various log formats
const TIMESTAMP_PATTERNS = [
  // ISO 8601: 2024-01-15T10:30:45.123Z
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?/,
  // Common log format: 15/Jan/2024:10:30:45 +0000
  /^\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}\s*[+-]\d{4}/,
  // Syslog: Jan 15 10:30:45
  /^[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/,
  // Bracket timestamp: [2024-01-15 10:30:45]
  /^\[\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\]/,
  // Unix timestamp in brackets: [1705312245]
  /^\[\d{10}\]/,
  // Date with time: 2024-01-15 10:30:45
  /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/,
];

// Log level patterns
const LEVEL_PATTERNS: Array<[LogLevel, RegExp]> = [
  ["error", /\b(ERROR|ERR|FATAL|CRITICAL|CRIT|FAILURE|FAILED)\b/i],
  ["warn", /\b(WARN|WARNING)\b/i],
  ["info", /\b(INFO|NOTICE)\b/i],
  ["debug", /\b(DEBUG|DBG)\b/i],
  ["trace", /\b(TRACE|VERBOSE)\b/i],
];

/**
 * Detect the format of log content
 */
export function detectLogFormat(content: string): LogFormat {
  const lines = content.split("\n").slice(0, 50); // Sample first 50 lines

  let jsonCount = 0;
  let syslogCount = 0;
  let timestampCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for JSON
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        JSON.parse(trimmed);
        jsonCount++;
      } catch {
        // Not valid JSON
      }
    }

    // Check for syslog format
    if (/^[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/.test(trimmed)) {
      syslogCount++;
    }

    // Check for any timestamp
    if (TIMESTAMP_PATTERNS.some((p) => p.test(trimmed))) {
      timestampCount++;
    }
  }

  const total = lines.filter((l) => l.trim()).length;

  if (total === 0) return "unknown";
  if (jsonCount > total * 0.5) return "json";
  if (syslogCount > total * 0.5) return "syslog";
  if (timestampCount > total * 0.3) return "generic";

  return "unknown";
}

/**
 * Detect log level from a line
 */
export function detectLogLevel(line: string): LogLevel {
  for (const [level, pattern] of LEVEL_PATTERNS) {
    if (pattern.test(line)) {
      return level;
    }
  }
  return "unknown";
}

/**
 * Extract timestamp from a line
 */
export function extractTimestamp(line: string): string | undefined {
  for (const pattern of TIMESTAMP_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return undefined;
}

/**
 * Parse a line of log content
 */
export function parseLogLine(
  raw: string,
  lineNumber: number,
  format: LogFormat
): ParsedLogLine {
  const trimmed = raw.trim();

  // Check if JSON
  let isJson = false;
  if (format === "json" || trimmed.startsWith("{")) {
    try {
      JSON.parse(trimmed);
      isJson = true;
    } catch {
      // Not JSON
    }
  }

  // Extract timestamp and level
  const timestamp = extractTimestamp(raw);
  const level = detectLogLevel(raw);

  // Extract message (content after timestamp and level)
  let message = raw;
  if (timestamp) {
    message = raw.slice(raw.indexOf(timestamp) + timestamp.length).trim();
  }
  // Remove level from message if present
  message = message.replace(
    /^\s*\[?(ERROR|WARN|WARNING|INFO|DEBUG|TRACE)\]?\s*/i,
    ""
  );

  return {
    raw,
    lineNumber,
    level,
    timestamp,
    message,
    isJson,
  };
}

/**
 * Parse multiple lines of log content
 */
export function parseLogLines(
  lines: string[],
  startLine: number,
  format: LogFormat
): ParsedLogLine[] {
  return lines.map((line, idx) =>
    parseLogLine(line, startLine + idx + 1, format)
  );
}

/**
 * Count non-empty lines
 */
export function countLines(content: string): number {
  return content.split("\n").filter((l) => l.trim()).length;
}

/**
 * Count all lines including empty
 */
export function countAllLines(content: string): number {
  return content.split("\n").length;
}
