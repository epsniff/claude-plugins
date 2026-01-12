import React from "react";
import { Box, Text } from "ink";
import type { ParsedLogLine, LogLevel } from "../types";
import { LOG_COLORS } from "../types";

interface Props {
  line: ParsedLogLine;
  width: number;
  showLineNumbers: boolean;
  totalLines: number;
}

// Get color for log level
function getLevelColor(level: LogLevel): string {
  return LOG_COLORS[level] || "white";
}

// Render JSON with syntax highlighting
function renderJsonHighlighted(jsonStr: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  // Simple regex-based JSON highlighting
  const pattern =
    /("(?:\\.|[^"\\])*")\s*(:)?|(-?\d+\.?\d*)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}\[\],])/g;
  let lastIndex = 0;
  let match;
  let keyIdx = 0;

  while ((match = pattern.exec(jsonStr)) !== null) {
    // Add any text before this match
    if (match.index > lastIndex) {
      result.push(
        <Text key={`gap-${keyIdx++}`}>
          {jsonStr.slice(lastIndex, match.index)}
        </Text>
      );
    }

    const [full, str, colon, num, bool, nul, bracket] = match;

    if (str) {
      const color = colon ? LOG_COLORS.jsonKey : LOG_COLORS.jsonString;
      result.push(
        <Text key={`str-${keyIdx++}`} color={color}>
          {str}
        </Text>
      );
      if (colon) {
        result.push(<Text key={`colon-${keyIdx++}`}>{colon}</Text>);
      }
    } else if (num) {
      result.push(
        <Text key={`num-${keyIdx++}`} color={LOG_COLORS.jsonNumber}>
          {num}
        </Text>
      );
    } else if (bool) {
      result.push(
        <Text key={`bool-${keyIdx++}`} color={LOG_COLORS.jsonBoolean}>
          {bool}
        </Text>
      );
    } else if (nul) {
      result.push(
        <Text key={`null-${keyIdx++}`} color={LOG_COLORS.jsonNull}>
          {nul}
        </Text>
      );
    } else if (bracket) {
      result.push(<Text key={`brk-${keyIdx++}`}>{bracket}</Text>);
    }

    lastIndex = match.index + full.length;
  }

  if (lastIndex < jsonStr.length) {
    result.push(<Text key={`end-${keyIdx}`}>{jsonStr.slice(lastIndex)}</Text>);
  }

  return result;
}

export function LogLine({ line, width, showLineNumbers, totalLines }: Props) {
  const lineNumWidth = Math.max(4, String(totalLines).length);
  const contentWidth = width - lineNumWidth - 3; // 3 for " | "

  // Truncate if needed
  const displayContent =
    line.raw.length > contentWidth
      ? line.raw.slice(0, contentWidth - 3) + "..."
      : line.raw;

  return (
    <Box>
      {/* Line number */}
      {showLineNumbers && (
        <>
          <Text color={LOG_COLORS.lineNumber} dimColor>
            {String(line.lineNumber).padStart(lineNumWidth)}
          </Text>
          <Text color={LOG_COLORS.lineNumber} dimColor>
            {" "}
            |{" "}
          </Text>
        </>
      )}

      {/* Log content with highlighting */}
      {line.isJson ? (
        <Text>{renderJsonHighlighted(displayContent)}</Text>
      ) : line.timestamp ? (
        <Text>
          <Text color={LOG_COLORS.timestamp}>{line.timestamp}</Text>
          <Text> </Text>
          <Text color={getLevelColor(line.level)}>
            {displayContent.slice(line.timestamp.length).trim()}
          </Text>
        </Text>
      ) : (
        <Text color={getLevelColor(line.level)}>{displayContent}</Text>
      )}
    </Box>
  );
}
