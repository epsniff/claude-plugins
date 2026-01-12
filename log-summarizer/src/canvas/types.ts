// Log Summarizer Canvas Types

// Configuration passed from Claude when spawning canvas
export interface LogSummarizerConfig {
  title?: string; // Optional title for the canvas
  maxLines?: number; // Maximum lines to accept (default: 10000)
}

// Result sent back to Claude via IPC (file path, not raw content!)
export interface LogSubmissionResult {
  logFilePath: string; // Path to temp file with logs
  lineCount: number; // Number of lines submitted
  detectedFormat: LogFormat; // Detected log format for context
  sizeBytes: number; // Size of logs in bytes
}

// Supported log formats for highlighting
export type LogFormat =
  | "json" // JSON structured logs
  | "syslog" // Standard syslog format
  | "generic" // Generic timestamped logs
  | "unknown"; // No format detected

// Log level for syntax highlighting
export type LogLevel =
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "trace"
  | "unknown";

// Parsed log line for rendering
export interface ParsedLogLine {
  raw: string; // Original line text
  lineNumber: number; // 1-based line number
  level: LogLevel; // Detected log level
  timestamp?: string; // Extracted timestamp if present
  message?: string; // Extracted message portion
  isJson: boolean; // Whether line is valid JSON
}

// Syntax highlighting color scheme
export const LOG_COLORS = {
  // Log levels
  error: "red",
  warn: "yellow",
  info: "cyan",
  debug: "gray",
  trace: "gray",
  unknown: "white",

  // Structural elements
  timestamp: "green",
  lineNumber: "gray",

  // JSON elements
  jsonKey: "magenta",
  jsonString: "green",
  jsonNumber: "yellow",
  jsonBoolean: "cyan",
  jsonNull: "gray",

  // UI elements
  border: "gray",
  title: "white",
  statusBar: "gray",
  scrollIndicator: "cyan",
} as const;
