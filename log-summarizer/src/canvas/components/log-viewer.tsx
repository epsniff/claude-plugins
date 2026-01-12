import React from "react";
import { Box, Text } from "ink";
import { LogLine } from "./log-line";
import { parseLogLines } from "../utils/log-parser";
import type { LogFormat } from "../types";

interface Props {
  content: string;
  scrollOffset: number;
  viewportHeight: number;
  terminalWidth: number;
  format: LogFormat;
}

export function LogViewer({
  content,
  scrollOffset,
  viewportHeight,
  terminalWidth,
  format,
}: Props) {
  const lines = content.split("\n");
  const totalLines = lines.length;
  const visibleLines = lines.slice(scrollOffset, scrollOffset + viewportHeight);
  const parsedLines = parseLogLines(visibleLines, scrollOffset, format);

  // If no content, show placeholder
  if (!content.trim()) {
    return (
      <Box
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height={viewportHeight}
      >
        <Text color="gray" dimColor>
          No logs yet
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {parsedLines.map((line, idx) => (
        <LogLine
          key={scrollOffset + idx}
          line={line}
          width={terminalWidth}
          showLineNumbers={true}
          totalLines={totalLines}
        />
      ))}
      {/* Fill remaining viewport with empty lines for consistent height */}
      {parsedLines.length < viewportHeight &&
        Array(viewportHeight - parsedLines.length)
          .fill(0)
          .map((_, idx) => (
            <Box key={`empty-${idx}`} height={1}>
              <Text> </Text>
            </Box>
          ))}
    </Box>
  );
}
