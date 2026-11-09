# Contributing

Thanks for helping out. This is a small project, so the process is simple.

## Reporting a bug

YouTube changes its page markup from time to time, and that is the most common reason this extension breaks. When you open an issue, please include:

- Browser and version (e.g. Chrome 131, Brave 1.73)
- Extension version (shown in `chrome://extensions`)
- The URL of a video where it happens
- What you expected and what happened
- Any errors from the DevTools console (F12 → Console)

## Making a change

1. Fork the repository and create a branch: `git checkout -b fix/comments-selector`
2. Load the folder as an unpacked extension (see the README) and make your change.
3. Test it manually (checklist below).
4. Open a pull request that says what you changed and why. Screenshots help for visual changes.

## Manual test checklist

There are no automated tests yet, because the extension runs against the live YouTube site. Before opening a pull request, check:

- [ ] Open a video: the three tabs appear in the right column.
- [ ] **Comments** tab: comments load, more load when you scroll down, replies expand, sorting works.
- [ ] **Comments** tab: the header with "Add a comment…" stays pinned at the top while scrolling.
- [ ] **Recommended** tab: hover a thumbnail until the preview plays, then scroll the sidebar: the preview moves with its thumbnail.
- [ ] **Info** tab: the description expands, timestamp links jump in the video.
- [ ] With a large window, scroll the whole page down: the tabs stay at the top of the window.
- [ ] Scroll with the mouse over a playing hover preview and over the tab bar: the sidebar scrolls, not the page.
- [ ] Click a recommended video: the tabs show the new video's content.
- [ ] Theater mode on and off: the layout is correct both ways.
- [ ] Fullscreen on and off.
- [ ] Make the window narrow (single column) and wide again: recommendations and comments are visible below the video when narrow, back in the tabs when wide.
- [ ] Go to the YouTube home page: no panel, no console errors.
- [ ] Light and dark theme.

## Code guidelines

- Plain JavaScript and CSS, no build step and no dependencies. Please keep it that way unless there is a strong reason.
- Put every YouTube selector in `SELECTORS` in `src/content.js`, never inline.
- Prefix every id, class and CSS variable the extension adds with `yts-`, so nothing clashes with YouTube.
- Move YouTube's own elements, don't clone or re-render them.
- Keep `sync()` idempotent: running it twice must give the same result as running it once.
- New user-facing text goes into `_locales/en/messages.json` (and ideally `de`).
- No tracking, no analytics, no remote code. New permissions need a good reason in the pull request.

## Adding a translation

1. Copy `_locales/en/` to `_locales/<language-code>/` (e.g. `fr`, `es`, `pt_BR`).
2. Translate the `message` values. Keep the keys and leave out the `description` fields if you like.
3. Open a pull request.

## Releasing (maintainers)

1. Bump `version` in `manifest.json` and add an entry to `CHANGELOG.md`.
2. Run `./scripts/package.sh`.
3. Upload `dist/side-tabs-for-youtube-<version>.zip` in the Chrome Web Store developer dashboard.
4. Tag the release: `git tag v<version> && git push --tags`.
