import React from "react";
import { Box, Text } from "ink";
import type { LogFormat } from "../types";

interface Props {
  width: number;
  mode: "paste" | "review";
  format: LogFormat;
  lineCount: number;
  scrollInfo: string;
}

const FORMAT_LABELS: Record<LogFormat, string> = {
  json: "JSON",
  syslog: "Syslog",
  generic: "Generic",
  unknown: "Text",
};

export function StatusBar({
  width,
  mode,
  format,
  lineCount,
  scrollInfo,
}: Props) {
  return (
    <Box justifyContent="center">
      <Box width={width} justifyContent="space-between">
        <Text color="gray" dimColor>
          {mode === "paste"
            ? "Paste logs (Cmd+V) then Enter to submit"
            : "Scroll: arrows/PgUp/PgDn | Enter: submit | Esc: cancel"}
        </Text>
        <Text color="gray" dimColor>
          {mode === "review" && (
            <>
              <Text color="cyan">{FORMAT_LABELS[format]}</Text>
              <Text> | </Text>
              <Text>{lineCount} lines</Text>
              <Text> | </Text>
              <Text>{scrollInfo}</Text>
            </>
          )}
        </Text>
      </Box>
    </Box>
  );
}
