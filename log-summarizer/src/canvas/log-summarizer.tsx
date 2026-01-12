// Log Summarizer Canvas - Paste logs and submit for summarization

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { useIPCServer } from "../ipc/server-hook";
import { LogViewer } from "./components/log-viewer";
import { StatusBar } from "./components/status-bar";
import type { LogSummarizerConfig, LogSubmissionResult, LogFormat } from "./types";
import { detectLogFormat, countAllLines } from "./utils/log-parser";
import { getLogFilePath } from "../ipc/types";

interface Props {
  id: string;
  config?: LogSummarizerConfig;
  socketPath?: string;
}

export function LogSummarizer({
  id,
  config: initialConfig,
  socketPath,
}: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // Terminal dimensions
  const [dimensions, setDimensions] = useState({
    width: stdout?.columns || 120,
    height: stdout?.rows || 40,
  });

  // Log content state (populated via paste)
  const [logContent, setLogContent] = useState<string>("");

  // Scroll state
  const [scrollOffset, setScrollOffset] = useState(0);

  // Input mode: "paste" (waiting for paste) or "review" (reviewing pasted logs)
  const [mode, setMode] = useState<"paste" | "review">("paste");

  // Detected format
  const [detectedFormat, setDetectedFormat] = useState<LogFormat>("unknown");

  // Paste accumulator for rapid input
  const pasteBufferRef = useRef<string>("");
  const pasteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Config
  const maxLines = initialConfig?.maxLines || 10000;

  // IPC server for communication with Claude
  const ipc = useIPCServer({
    socketPath,
    scenario: "summarize",
    onClose: () => exit(),
    onUpdate: () => {},
  });

  // Listen for terminal resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: stdout?.columns || 120,
        height: stdout?.rows || 40,
      });
    };
    stdout?.on("resize", updateDimensions);
    updateDimensions();
    return () => {
      stdout?.off("resize", updateDimensions);
    };
  }, [stdout]);

  // Calculate layout
  const termWidth = dimensions.width;
  const termHeight = dimensions.height;
  const viewerWidth = Math.min(termWidth - 4, 120);
  const headerHeight = 3;
  const footerHeight = 2;
  const viewportHeight = termHeight - headerHeight - footerHeight - 2;

  // Line counts for scroll calculation
  const totalLines = countAllLines(logContent);
  const maxScroll = Math.max(0, totalLines - viewportHeight);

  // Process accumulated paste input
  const processPasteBuffer = useCallback(() => {
    const content = pasteBufferRef.current;
    pasteBufferRef.current = "";

    if (content) {
      setLogContent((prev) => {
        const newContent = prev + content;
        // Limit lines
        const lines = newContent.split("\n");
        if (lines.length > maxLines) {
          return lines.slice(-maxLines).join("\n");
        }
        return newContent;
      });

      // Detect format after paste
      setLogContent((current) => {
        if (current.trim()) {
          setDetectedFormat(detectLogFormat(current));
          setMode("review");
        }
        return current;
      });
    }
  }, [maxLines]);

  // Handle paste input (accumulate characters with debounce)
  const handlePasteInput = useCallback(
    (input: string) => {
      pasteBufferRef.current += input;

      // Clear existing timeout
      if (pasteTimeoutRef.current) {
        clearTimeout(pasteTimeoutRef.current);
      }

      // Process after short delay (allows paste to complete)
      pasteTimeoutRef.current = setTimeout(processPasteBuffer, 50);
    },
    [processPasteBuffer]
  );

  // Handle submit - write logs to temp file and exit
  const handleSubmit = useCallback(async () => {
    if (!logContent.trim()) {
      ipc.sendCancelled("No logs to submit");
      exit();
      return;
    }

    // Write logs to temp file
    const logFilePath = getLogFilePath(id);
    await Bun.write(logFilePath, logContent);

    // Send result via IPC
    const result: LogSubmissionResult = {
      logFilePath,
      lineCount: countAllLines(logContent),
      detectedFormat,
      sizeBytes: new TextEncoder().encode(logContent).length,
    };

    ipc.sendSelected(result);
    exit();
  }, [logContent, detectedFormat, id, ipc, exit]);

  // Keyboard controls
  useInput((input, key) => {
    // Ignore mouse escape sequence fragments
    if (input && /^[<\[\];Mm\d]+$/.test(input)) {
      return;
    }

    // Escape to quit
    if (key.escape) {
      ipc.sendCancelled("User cancelled");
      exit();
      return;
    }

    // Enter to submit (when we have content)
    if (key.return && logContent.trim()) {
      handleSubmit();
      return;
    }

    // Scrolling (when in review mode with content)
    if (mode === "review" && logContent) {
      if (key.upArrow) {
        setScrollOffset((o) => Math.max(0, o - 1));
        return;
      }
      if (key.downArrow) {
        setScrollOffset((o) => Math.min(maxScroll, o + 1));
        return;
      }
      if (key.pageUp) {
        setScrollOffset((o) => Math.max(0, o - viewportHeight));
        return;
      }
      if (key.pageDown) {
        setScrollOffset((o) => Math.min(maxScroll, o + viewportHeight));
        return;
      }
    }

    // Any other input is treated as paste
    if (input && !key.ctrl && !key.meta) {
      handlePasteInput(input);
    }
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pasteTimeoutRef.current) {
        clearTimeout(pasteTimeoutRef.current);
      }
    };
  }, []);

  // Scroll indicator
  const scrollPercent =
    maxScroll > 0 ? Math.round((scrollOffset / maxScroll) * 100) : 100;

  const scrollInfo =
    totalLines > viewportHeight
      ? `${scrollOffset + 1}-${Math.min(scrollOffset + viewportHeight, totalLines)} of ${totalLines}`
      : `${totalLines} lines`;

  return (
    <Box flexDirection="column" width={termWidth} height={termHeight}>
      {/* Title bar */}
      <Box justifyContent="center" marginBottom={1}>
        <Box width={viewerWidth}>
          <Text bold color="white">
            Log Summarizer
          </Text>
          <Box flexGrow={1} />
          <Text color="gray" dimColor>
            {mode === "paste"
              ? "Waiting for paste..."
              : `${totalLines} lines | ${scrollPercent}%`}
          </Text>
        </Box>
      </Box>

      {/* Main content area */}
      <Box justifyContent="center" flexGrow={1}>
        <Box
          width={viewerWidth}
          flexDirection="column"
          borderStyle="round"
          borderColor={mode === "paste" ? "yellow" : "green"}
          paddingX={2}
          paddingY={1}
        >
          {mode === "paste" && !logContent ? (
            <Box
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height={viewportHeight}
            >
              <Text color="yellow" bold>
                Paste your logs here
              </Text>
              <Text color="gray" dimColor>
                (Cmd+V or Ctrl+Shift+V)
              </Text>
              <Text> </Text>
              <Text color="gray" dimColor>
                Press Enter to submit | Esc to cancel
              </Text>
            </Box>
          ) : (
            <LogViewer
              content={logContent}
              scrollOffset={scrollOffset}
              viewportHeight={viewportHeight}
              terminalWidth={viewerWidth - 6}
              format={detectedFormat}
            />
          )}
        </Box>
      </Box>

      {/* Status bar */}
      <StatusBar
        width={viewerWidth}
        mode={mode}
        format={detectedFormat}
        lineCount={totalLines}
        scrollInfo={scrollInfo}
      />
    </Box>
  );
}
