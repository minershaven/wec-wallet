"use strict";

// Wcash Wallet all-in-one for Windows: the Mainnet wallet plus a bundled Wcash
// node (resources/node/wcash-zebrad.exe). Same product name and look as the
// upstream Wcash Wallet; the differences are the bundled node and the wallet
// endpoint, which points at that node on 127.0.0.1:48234.

const base = require("../package.json").build;

module.exports = {
  ...base,
  // Kept distinct from the upstream Mainnet candidate so both can be installed.
  appId: "com.wcashwallet.wallet.mainnet.allinone",
  buildVersion: "181",
  artifactName: "Wcash-Wallet-AllInOne-${version}-win-${arch}.${ext}",
  forceCodeSigning: false,
  afterPack: "./scripts/verify-wcash-allinone-after-pack.js",
  extraMetadata: {
    main: "build/electron.js",
    wcashPackagedProfile: "mainnet",
  },
  directories: {
    ...base.directories,
    output: "dist/allinone",
  },
  extraResources: [
    ...base.extraResources,
    { from: "node-bin/wcash-zebrad.exe", to: "node/wcash-zebrad.exe" },
    { from: "node-bin/WOLF-LICENSE-APACHE", to: "node/LICENSE-APACHE" },
    { from: "node-bin/WOLF-LICENSE-MIT", to: "node/LICENSE-MIT" },
    { from: "node-bin/NODE-SOURCE.txt", to: "node/SOURCE.txt" },
  ],
  win: {
    ...base.win,
    target: ["nsis", "zip"],
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Wcash Wallet",
    // Wallet files and node data stay on uninstall; removing a wallet is the user's call.
    deleteAppDataOnUninstall: false,
    artifactName: "Wcash-Wallet-AllInOne-Setup-${version}-win-${arch}.${ext}",
  },
};
