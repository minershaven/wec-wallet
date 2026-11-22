"use strict";

// After-pack checks for the all-in-one Windows build: the wallet selects Wcash
// Mainnet, syncs from the bundled node on loopback, and the node is present and
// is a Windows x64 executable.

const fs = require("fs");
const path = require("path");
const asar = require("@electron/asar");
const { peArch } = require("./pe-arch");

module.exports = async (context) => {
  const resources = path.join(context.appOutDir, "resources");
  const archive = path.join(resources, "app.asar");
  if (!fs.existsSync(archive) || context.packager.appInfo.id !== "com.wcashwallet.wallet.mainnet.allinone") {
    throw new Error("All-in-one package identity is invalid");
  }

  const metadata = JSON.parse(asar.extractFile(archive, "package.json").toString());
  if (metadata.wcashPackagedProfile !== "mainnet" || metadata.main !== "build/electron.js") {
    throw new Error("The packaged wallet does not select Wcash Mainnet");
  }

  const profile = asar.extractFile(archive, "build/wcashRuntimeProfile.js").toString();
  if (!profile.includes("http://127.0.0.1:48234") || !profile.includes("d9c6a7ee")) {
    throw new Error("The packaged Mainnet profile does not use the bundled node endpoint");
  }
  if (!asar.extractFile(archive, "build/wcashNode.js").toString().includes("wcash-zebrad.exe")) {
    throw new Error("The node manager is missing from the package");
  }

  const binding = path.join(resources, "app.asar.unpacked", "build", "native.node");
  const bindingBytes = fs.existsSync(binding) ? fs.readFileSync(binding) : Buffer.alloc(0);
  if (!bindingBytes.includes(Buffer.from("wcashmainnet-v1")) || !bindingBytes.includes(Buffer.from("http://127.0.0.1:48234"))) {
    throw new Error("The native wallet binding is not the Mainnet build for the bundled node");
  }

  const node = path.join(resources, "node", "wcash-zebrad.exe");
  if (!fs.existsSync(node) || fs.statSync(node).size < 10 * 1024 * 1024) {
    throw new Error("The bundled Wcash node is missing");
  }
  if (peArch(node) !== "x64") {
    throw new Error("The bundled Wcash node is not a Windows x64 executable");
  }
};
