import { useEffect, useState } from "react";
import { ipcRenderer } from "../../electronBridge";

// Status of the bundled Wcash node (all-in-one build), reported by the main
// process from public/wcashNode.js. `enabled` is false in builds without a
// bundled node, and the line then shows the server as upstream does.
export type WcashNodeStatus = {
  enabled: boolean;
  state: "idle" | "starting" | "syncing" | "synced" | "external" | "stopped" | "error";
  height: number | null;
  percent: number | null;
  remaining: number | null;
  error: string | null;
  initialSyncDone?: boolean;
};

const POLL_MS = 3000;

export function useWcashNodeStatus(): WcashNodeStatus | null {
  const [status, setStatus] = useState<WcashNodeStatus | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const next = (await ipcRenderer.invoke("wcashNode:status")) as WcashNodeStatus;
        if (alive) setStatus(next && next.enabled ? next : null);
      } catch {
        if (alive) setStatus(null);
      }
    };
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return status;
}

export function describeWcashNode(status: WcashNodeStatus): { text: string; level: "unknown" | "ok" | "unstable" | "down"; tooltip: string } {
  const block = status.height !== null ? ` · block ${status.height.toLocaleString()}` : "";
  switch (status.state) {
    case "synced":
      return { text: `Wcash node · synced${block}`, level: "ok", tooltip: "Your built-in Wcash node is up to date." };
    case "syncing": {
      if (status.initialSyncDone) {
        return {
          text: `Wcash node · catching up${block}`,
          level: "unstable",
          tooltip:
            status.error ||
            "Your built-in Wcash node is fetching the blocks mined since it last ran. New transactions show up once it has caught up.",
        };
      }
      const pct = status.percent !== null ? ` ${status.percent.toFixed(1)}%` : "";
      return {
        text: `Wcash node · syncing${pct}${block}`,
        level: "unstable",
        tooltip: "Your built-in Wcash node is still downloading the chain. Balances and history are complete once it has synced.",
      };
    }
    case "external":
      return { text: "Wcash node · using the node already running on this PC", level: "ok", tooltip: "Another Wcash node is serving 127.0.0.1:48234, so the built-in node was not started." };
    case "error":
    case "stopped":
      return { text: "Wcash node · not running", level: "down", tooltip: status.error || "The built-in Wcash node is not running." };
    default:
      return { text: "Wcash node · starting", level: "unknown", tooltip: status.error || "Starting the built-in Wcash node." };
  }
}
