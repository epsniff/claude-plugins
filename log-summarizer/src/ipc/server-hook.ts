// IPC hook for canvas running as server (standalone CLI mode)

import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "ink";
import { createIPCServer, type IPCServer } from "./server";
import type { ControllerMessage } from "./types";

export interface UseIPCServerOptions {
  socketPath: string | undefined;
  scenario: string;
  onClose?: () => void;
  onUpdate?: (config: unknown) => void;
}

export interface IPCServerHandle {
  isConnected: boolean;
  sendReady: () => void;
  sendSelected: (data: unknown) => void;
  sendCancelled: (reason?: string) => void;
  sendError: (message: string) => void;
}

export function useIPCServer(options: UseIPCServerOptions): IPCServerHandle {
  const { socketPath, scenario, onClose, onUpdate } = options;
  const { exit } = useApp();
  const [isConnected, setIsConnected] = useState(false);
  const serverRef = useRef<IPCServer | null>(null);
  const onCloseRef = useRef(onClose);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onCloseRef.current = onClose;
    onUpdateRef.current = onUpdate;
  }, [onClose, onUpdate]);

  // Start server on mount
  useEffect(() => {
    if (!socketPath) return;

    let mounted = true;

    const startServer = async () => {
      try {
        const server = await createIPCServer({
          socketPath,
          onMessage: (msg: ControllerMessage) => {
            switch (msg.type) {
              case "close":
                onCloseRef.current?.();
                exit();
                break;
              case "update":
                onUpdateRef.current?.(msg.config);
                break;
              case "ping":
                server.broadcast({ type: "pong" });
                break;
            }
          },
          onClientConnect: () => {
            if (mounted) {
              setIsConnected(true);
            }
          },
          onClientDisconnect: () => {
            if (mounted) {
              setIsConnected(false);
            }
          },
          onError: (err) => {
            console.error("IPC error:", err);
          },
        });

        if (mounted) {
          serverRef.current = server;
        } else {
          server.close();
        }
      } catch (err) {
        console.error("Failed to start IPC server:", err);
      }
    };

    startServer();

    return () => {
      mounted = false;
      serverRef.current?.close();
      serverRef.current = null;
    };
  }, [socketPath, scenario, exit]);

  const sendReady = useCallback(() => {
    serverRef.current?.broadcast({ type: "ready", scenario });
  }, [scenario]);

  const sendSelected = useCallback((data: unknown) => {
    serverRef.current?.broadcast({ type: "selected", data });
  }, []);

  const sendCancelled = useCallback((reason?: string) => {
    serverRef.current?.broadcast({ type: "cancelled", reason });
  }, []);

  const sendError = useCallback((message: string) => {
    serverRef.current?.broadcast({ type: "error", message });
  }, []);

  return {
    isConnected,
    sendReady,
    sendSelected,
    sendCancelled,
    sendError,
  };
}
