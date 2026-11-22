"use strict";

// "Syncing the Wcash node" window for the all-in-one build.
//
// The wallet syncs from the bundled node, so opening it while the node is still
// downloading the chain makes the wallet sync against a partial chain and show
// errors. This small window shows the node's progress and opens the wallet once
// the node reports it has finished its initial sync. "Open wallet now" skips the
// wait; closing the window quits the app (and stops the node).

const { BrowserWindow } = require("electron");

const OPEN_NOW_URL = "about:blank#open-wallet-now";

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><title>Wcash Wallet</title>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'">
<style>
  html,body{margin:0;height:100%;background:#101418;color:#e8edf2;font:14px/1.45 "Segoe UI",system-ui,sans-serif}
  .wrap{box-sizing:border-box;height:100%;padding:28px 32px;display:flex;flex-direction:column;gap:14px}
  h1{font-size:18px;margin:0;font-weight:600}
  .muted{color:#9aa7b4;font-size:13px}
  .bar{height:10px;border-radius:6px;background:#26303a;overflow:hidden}
  .fill{height:100%;width:0;background:#f4b728;transition:width .6s ease}
  .row{display:flex;justify-content:space-between;font-variant-numeric:tabular-nums}
  .err{color:#ff8a80;font-size:13px;min-height:1em}
  button{margin-top:auto;align-self:flex-end;background:none;border:1px solid #3a4652;color:#c9d3dc;border-radius:8px;padding:8px 14px;font:inherit;cursor:pointer}
  button:hover{border-color:#f4b728;color:#fff}
</style></head>
<body><div class="wrap">
  <h1>Syncing the Wcash node</h1>
  <div class="muted">Wcash Wallet runs its own Wcash node and syncs your wallet from it. The first start downloads the
  Wcash chain, which takes about 15–30 minutes. Later starts only catch up on new blocks.</div>
  <div class="bar"><div class="fill" id="fill"></div></div>
  <div class="row"><span id="state">Starting the node…</span><span id="pct"></span></div>
  <div class="err" id="err"></div>
  <button id="open" type="button">Open wallet now</button>
</div>
<script>
  window.update = function (s) {
    var pct = typeof s.percent === "number" ? Math.max(0, Math.min(100, s.percent)) : 0;
    document.getElementById("fill").style.width = pct + "%";
    document.getElementById("pct").textContent = typeof s.percent === "number" ? pct.toFixed(1) + "%" : "";
    var block = typeof s.height === "number" ? "block " + s.height.toLocaleString() : "";
    document.getElementById("state").textContent =
      s.state === "syncing" ? "Downloading the chain" + (block ? " · " + block : "") :
      s.state === "synced" ? "Up to date" + (block ? " · " + block : "") :
      "Starting the node…";
    document.getElementById("err").textContent = s.error || "";
  };
  document.getElementById("open").addEventListener("click", function () {
    location.href = ${JSON.stringify(OPEN_NOW_URL)};
  });
</script></body></html>`;

/**
 * Resolves when the wallet should open: the node finished its initial sync, the
 * user chose "Open wallet now", or the node is not ours to wait for. Resolves
 * to false if the user closed the window (the caller then quits).
 */
function waitForWcashNode({ status, appendLog = () => {} }) {
  const initial = status();
  if (!initial.enabled || initial.state === "external" || initial.state === "synced") {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let done = false;
    const win = new BrowserWindow({
      width: 560,
      height: 330,
      resizable: false,
      maximizable: false,
      fullscreenable: false,
      title: "Wcash Wallet",
      backgroundColor: "#101418",
      autoHideMenuBar: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
    });
    win.setMenu(null);
    appendLog("waiting for the bundled Wcash node to sync");

    const finish = (open, why) => {
      if (done) return;
      done = true;
      clearInterval(timer);
      appendLog(`node wait finished: ${why}`);
      resolve(open);
      // Close only after the caller has created the wallet window: the app quits
      // when its last window closes ("window-all-closed").
      setTimeout(() => {
        if (!win.isDestroyed()) {
          win.removeAllListeners("closed");
          win.destroy();
        }
      }, open ? 1500 : 0);
    };

    win.webContents.on("will-navigate", (event, url) => {
      event.preventDefault();
      if (url === OPEN_NOW_URL) finish(true, "user chose Open wallet now");
    });
    win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    win.on("closed", () => finish(false, "window closed"));

    const timer = setInterval(() => {
      const s = status();
      if (s.state === "synced" || s.state === "external") {
        finish(true, `node ${s.state}`);
        return;
      }
      if (!win.isDestroyed()) {
        win.webContents.executeJavaScript(`window.update && window.update(${JSON.stringify(s)})`).catch(() => {});
      }
    }, 1000);

    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(PAGE)}`);
  });
}

module.exports = { waitForWcashNode };
