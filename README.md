<p align="center">
  <img src="icons/icon128.png" width="96" alt="Side Tabs for YouTube icon">
</p>

<h1 align="center">Side Tabs for YouTube</h1>

<p align="center">
  Read the comments while the video keeps playing.<br>
  A browser extension that turns YouTube's right sidebar into three tabs:
  <b>Recommended · Info · Comments</b>.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="Manifest V3" src="https://img.shields.io/badge/manifest-v3-4f46e5.svg">
  <img alt="No tracking" src="https://img.shields.io/badge/tracking-none-brightgreen.svg">
</p>

---

## Why

On a YouTube watch page, the comments and the full description sit *below* the video. To read them you have to scroll down, and the video scrolls out of view. YouTube once tested a sidebar with tabs for exactly this, then removed it. This extension brings it back.

<!-- Add a screenshot here, e.g. docs/screenshot.png (1280×800 works for the Chrome Web Store too) -->
<!-- ![Screenshot](docs/screenshot.png) -->

## Features

- **Three tabs in the right sidebar:** Recommended, Info (description) and Comments.
- **The video stays visible.** The sidebar is as tall as the window and scrolls on its own.
- **Everything still works.** Replies, likes, sorting, "load more" and timestamp links behave as usual, because the extension uses YouTube's own elements instead of copies.
- **Remembers your tab** and the scroll position of each tab.
- **Stays out of the way:** in theater mode, fullscreen and narrow windows it switches off and YouTube looks exactly as normal.
- **Light and dark theme.**
- **English and German UI**, easy to translate.
- **No tracking, no network requests, no external code.** Only one permission: `storage`, to remember the last tab.

## Install

### From source (Chrome, Brave, Edge, Arc, Opera, Vivaldi)

1. Download this repository (**Code → Download ZIP**, then unzip) or clone it:
   ```bash
   git clone https://github.com/sebstinK/side-tabs-for-youtube.git
   ```
2. Open `chrome://extensions` (Brave: `brave://extensions`, Edge: `edge://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the repository folder (the one containing `manifest.json`).
5. Reload any open YouTube tab.

### Chrome Web Store

*Coming soon.*

## How it works

YouTube is a single-page app built from Polymer web components. The extension is one content script (`src/content.js`) plus one stylesheet (`src/styles.css`):

1. It waits until the watch page (`ytd-watch-flexy`) has rendered the recommendations (`#related`), the description (`#description`) and the comments (`#comments`).
2. It inserts a panel with a tab bar at the top of the right column.
3. It **moves** those three elements into the tabs. A placeholder comment node remembers each original spot.
4. A `MutationObserver` plus YouTube's `yt-navigate-finish` event trigger an idempotent `sync()`, which handles navigation between videos, late-loading elements and layout changes.
5. When the layout is not the default two-column view (theater, fullscreen, narrow window), everything is put back where YouTube expects it.

Moving instead of cloning is the important idea: YouTube's components keep their state and event handlers, so nothing has to be re-implemented.

## Project structure

```
├── manifest.json          Extension manifest (Manifest V3)
├── src/
│   ├── content.js         All logic: panel, tabs, moving nodes, sync
│   └── styles.css         Panel and tab styles (light and dark)
├── _locales/
│   ├── en/messages.json   English strings (default)
│   └── de/messages.json   German strings
├── icons/                 16, 32, 48, 128 px icons
├── scripts/
│   ├── package.sh         Builds the ZIP for the Chrome Web Store
│   └── make_icons.py      Re-generates the icons (no dependencies)
└── docs/
    └── store-listing.md   Texts for the Chrome Web Store listing
```

## Development

There is no build step. Edit the files, then:

1. Click the reload icon on the extension's card in `chrome://extensions`.
2. Reload the YouTube tab.

Useful places to start:

| You want to… | Look at |
|---|---|
| Fix the extension after a YouTube update | `SELECTORS` at the top of `src/content.js` |
| Add a new tab | `TABS` and `SELECTORS` in `src/content.js`, plus a label in `_locales/*/messages.json` |
| Change colours or sizes | CSS variables at the top of `src/styles.css` |
| Add a language | Copy `_locales/en` to `_locales/<code>` and translate |

Build the store package:

```bash
./scripts/package.sh
```

This creates `dist/side-tabs-for-youtube-<version>.zip` with only the files the extension needs.

Re-generate the icons after changing their colours or shapes in the script:

```bash
python3 scripts/make_icons.py icons
```

## Contributing

Contributions are welcome: bug reports, fixes for YouTube changes, new tabs, translations. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## Privacy

The extension does not collect, store or send any personal data. See [PRIVACY.md](PRIVACY.md).

## License

[MIT](LICENSE) © 2026 Sebastian Kubik

---

*This project is not affiliated with, endorsed by or sponsored by YouTube or Google LLC. YouTube is a trademark of Google LLC.*
