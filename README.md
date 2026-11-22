# Wcash Wallet — all-in-one for Windows (wallet + node)

This repository builds **Wcash Wallet** for Windows with its own **Wcash node built in**.
Install it, open it, and it runs a Wcash Mainnet node in the background and syncs the
wallet from that node. No server, command line or Linux needed.


## How the bundled node runs

- Started hidden by the wallet (`public/wcashNode.js`) and stopped when the wallet closes.
- Node data: `%LOCALAPPDATA%\Wcash Wallet\node-mainnet` (log: `zebrad.log` there).
- The wallet syncs from the node's light-wallet feed on `127.0.0.1:48234` only. The node's JSON-RPC
  (admin/mining) server is not enabled, and the P2P port listens on loopback, so Windows never asks to
  open a firewall port. Outbound connections to Wcash peers work normally.
- The first start downloads the Wcash chain; the wallet's balance is complete once the node has synced.
- If something is already serving `127.0.0.1:48234`, the wallet uses it and does not start a second node.

## Downloads

Every push to `main` builds the installer in GitHub Actions (**Actions → Windows all-in-one**).
Tagging `vX.Y.Z` publishes it as a GitHub release with `SHA256SUMS.txt`.
The installer is not code-signed, so Windows SmartScreen shows a warning on first run.

Both upstream projects describe themselves as experimental software. Use small amounts and keep your
24-word recovery phrase safe.

---

# Wcash Wallet desktop

Wcash Wallet desktop is an experimental desktop client for Wcash (WEC). It
preserves the upstream Zingo PC 2.0.25 user interface and routes wallet
operations through the Wcash core adapter.


## Current published candidate

The current prerelease is
[`wcash-desktop-2.0.25-181`](https://github.com/w-cash/wallet-desktop/releases/tag/wcash-desktop-2.0.25-181),
built from source commit
[`6687e56a30d5477f6e70375fda0666f966cd6118`](https://github.com/w-cash/wallet-desktop/commit/6687e56a30d5477f6e70375fda0666f966cd6118).
Its published
[`MANIFEST.json`](https://github.com/w-cash/wallet-desktop/releases/download/wcash-desktop-2.0.25-181/MANIFEST.json)
records Wcash Mainnet, the endpoint `http://mainnet.zecwec.com:48234`,
`tls: false`, and `signing: "unsigned candidate"`.




Prerequisites are Node.js 22, Yarn 1.22.22, Rust 1.91, CMake, OpenSSL, and
protoc 36.1.

```bash
git clone https://github.com/w-cash/wallet-desktop.git
cd wallet-desktop
yarn install --frozen-lockfile
yarn test:public-docs
yarn verify:upstream-ui-parity
yarn test:run
```

The Local Regtest QA packages are separate from the published Mainnet
prerelease. They connect to `http://127.0.0.1:48234`, use the isolated
`wcashregtest-v5` wallet namespace, and handle funds with no monetary value:

```bash
yarn package:local-regtest-qa:mac-arm64
yarn package:local-regtest-qa:linux-x64
yarn package:local-regtest-qa:windows-x64
yarn package:local-regtest-qa:windows-arm64
```

The native profiles are explicit Cargo features. Candidate commands use Cargo
`--locked` with a selected Wcash network feature so a package cannot silently
fall back to another network. Linux and Windows packages must be built and
tested on their target operating systems.

Production signing, macOS notarization, store packaging, and supported-release
promotion have not been completed. See
[`docs/WCASH_DESKTOP_NEXT_PLATFORMS.md`](docs/WCASH_DESKTOP_NEXT_PLATFORMS.md)
for the exact candidate matrix and remaining release gates.

## Linux package integration

The Debian candidate uses Wcash-owned system names:

- executable and PATH link: `wcash-wallet`
- install path: `/opt/Wcash Wallet/wcash-wallet`
- polkit action: `com.wcashwallet.wallet.authenticate`
- AppArmor profile: `/etc/apparmor.d/wcash-wallet`
- payment scheme: `wcash:`

The `.deb` installs the polkit and AppArmor files. The AppImage cannot install
system policy, so device authentication reports unavailable and the trusted
main process uses the tested unavailable-platform behavior.

## Upstream attribution

Wcash Wallet desktop is adapted from Zingo PC. ZingoLabs does not provide Wcash
security reporting, release support, or wallet-service operation. The upstream
project identity must not be used as the support identity for this repository.

The upstream MIT copyright and source credit remain in [`LICENSE`](LICENSE) and
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Keep both files with source
or binary redistributions.
