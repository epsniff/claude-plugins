#!/usr/bin/env bun
import { program } from "commander";
import { render } from "ink";
import React from "react";
import { detectTerminal, spawnCanvas } from "./terminal";
import { LogSummarizer } from "./canvas/log-summarizer";
import type { LogSummarizerConfig } from "./canvas/types";
import { getSocketPath } from "./ipc/types";

// Set window title via ANSI escape codes
function setWindowTitle(title: string) {
  process.stdout.write(`\x1b]0;${title}\x07`);
}

// Hide cursor
function hideCursor() {
  process.stdout.write("\x1b[?25l");
}

// Show cursor
function showCursor() {
  process.stdout.write("\x1b[?25h");
}

// Clear screen
function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H");
}

program
  .name("log-summarizer")
  .description("Terminal canvas for pasting and summarizing logs")
  .version("0.1.0");

program
  .command("show")
  .description("Show the log summarizer canvas in the current terminal")
  .option("--id <id>", "Canvas ID", "log-1")
  .option("--config <json>", "Canvas configuration (JSON)")
  .option("--socket <path>", "Unix socket path for IPC")
  .action(async (options) => {
    const id = options.id;
    const config: LogSummarizerConfig | undefined = options.config
      ? JSON.parse(options.config)
      : undefined;
    const socketPath = options.socket || getSocketPath(id);

    // Set window title
    setWindowTitle("Log Summarizer");

    // Clear screen and hide cursor
    clearScreen();
    hideCursor();

    // Render the canvas
    const { waitUntilExit } = render(
      React.createElement(LogSummarizer, {
        id,
        config,
        socketPath,
      }),
      {
        exitOnCtrlC: true,
      }
    );

    // Wait for exit and restore cursor
    try {
      await waitUntilExit();
    } finally {
      showCursor();
    }
  });

program
  .command("spawn")
  .description("Spawn the log summarizer canvas in a new terminal pane")
  .option("--id <id>", "Canvas ID", "log-1")
  .option("--config <json>", "Canvas configuration (JSON)")
  .option("--socket <path>", "Unix socket path for IPC")
  .action(async (options) => {
    const id = options.id;
    try {
      const result = await spawnCanvas(id, options.config, {
        socketPath: options.socket,
      });
      console.log(`Spawned log-summarizer canvas '${id}' via ${result.method}`);
    } catch (error) {
      console.error("Failed to spawn canvas:", error);
      process.exit(1);
    }
  });

program
  .command("env")
  .description("Show detected terminal environment")
  .action(() => {
    const env = detectTerminal();
    console.log("Terminal Environment:");
    console.log(`  In tmux: ${env.inTmux}`);
    console.log(`  In iTerm2: ${env.inITerm2}`);
    console.log(`  In Apple Terminal: ${env.inAppleTerminal}`);
    console.log(`  Terminal type: ${env.terminalType}`);
    console.log(`\nSummary: ${env.summary}`);

    if (env.terminalType === "apple-terminal") {
      console.log(
        "\nApple Terminal detected - canvas will open in a new window."
      );
      console.log(
        "   The window will be positioned on the right side of your screen."
      );
    } else if (env.terminalType === "none") {
      console.log("\nNo supported terminal detected.");
      console.log("   Supported: iTerm2, tmux, Apple Terminal");
    }
  });

program.parse();
