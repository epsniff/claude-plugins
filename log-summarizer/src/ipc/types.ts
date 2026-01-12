// IPC Message Types for Log Summarizer Canvas Communication

// Messages sent from Controller (Claude) to Canvas
export type ControllerMessage =
  | { type: "close" }
  | { type: "update"; config: unknown }
  | { type: "ping" };

// Messages sent from Canvas to Controller (Claude)
export type CanvasMessage =
  | { type: "ready"; scenario: string }
  | { type: "selected"; data: unknown }
  | { type: "cancelled"; reason?: string }
  | { type: "error"; message: string }
  | { type: "pong" };

// Socket path convention
export function getSocketPath(id: string): string {
  return `/tmp/log-summarizer-${id}.sock`;
}

// Log file path convention
export function getLogFilePath(id: string): string {
  return `/tmp/log-summarizer-${id}.log`;
}
