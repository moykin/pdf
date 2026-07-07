# Release, signing & auto-update

`git tag vX.Y.Z && git push --tags` triggers [`.github/workflows/release.yml`](../.github/workflows/release.yml),
which builds, signs and publishes installers for all three desktop OSes in one
run (a **draft** GitHub Release you then publish).

## What gets built

| OS | Artifacts |
| --- | --- |
| macOS | `.dmg` + `.app` — **universal** (Apple Silicon + Intel) |
| Windows | `.exe` (NSIS) + `.msi` |
| Linux | `.AppImage`, `.deb`, `.rpm` |

Plus updater artifacts (`.sig` + `latest.json`) because `bundle.createUpdaterArtifacts`
is on.

## One-time setup

### 1. Auto-updater keypair (required for updates)

```bash
pnpm tauri signer generate -w ~/.tauri/pdfcheap.key
```

- Put the **public** key in `tauri.conf.json` → `plugins.updater.pubkey`, and add
  the updater endpoint(s) there too.
- Add the **private** key + password as CI secrets
  `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

### 2. macOS — Developer ID + notarization ($99/yr Apple Developer)

Export your *Developer ID Application* cert as base64 and add secrets:
`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`,
`APPLE_ID`, `APPLE_PASSWORD` (app-specific password), `APPLE_TEAM_ID`.
tauri-action signs, notarizes and staples automatically. Without this, Gatekeeper
blocks the app ("unidentified developer").

### 3. Windows — code signing (kills SmartScreen "Unknown publisher")

Recommended: **Azure Trusted Signing** (cloud, cheap, no hardware token). Add a
`signCommand` under `bundle.windows` in `tauri.conf.json` and its secrets. An
**EV** certificate gives instant SmartScreen reputation.

### 4. Linux

No signing required. Optionally GPG-sign the repo or publish to Flathub.

## Secrets summary

| Secret | For |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` / `..._PASSWORD` | auto-updater |
| `APPLE_CERTIFICATE` / `..._PASSWORD` / `APPLE_SIGNING_IDENTITY` | macOS sign |
| `APPLE_ID` / `APPLE_PASSWORD` / `APPLE_TEAM_ID` | macOS notarize |
| `APRYSE_LICENSE_KEY` | commercial engine (injected as `VITE_APRYSE_LICENSE_KEY`) |

## Auto-update flow

App start → checks `plugins.updater.endpoints` → compares versions → downloads the
minisign-verified update → installs. Host `latest.json` + artifacts on GitHub
Releases, S3, or your own server. The update signature is **independent** of OS
code signing.

## Distribution channels

- **Direct download** from your site (primary, most control).
- **Mac App Store** — separate provisioning + **sandbox**; verify the commercial
  SDK works sandboxed before committing.
- **Microsoft Store** — optional MSIX.
