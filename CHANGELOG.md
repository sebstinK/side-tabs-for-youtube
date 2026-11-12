# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [1.1.2] - 2026-11-12

### Added
- Everything YouTube shows in the right sidebar now gets its own tab, automatically: a playlist or mix, the queue ("Add to queue"), the live chat or chat replay, and side panels like the transcript, chapters or products. Before, they sat above the tabs and pushed them down. The tab appears and opens when the content shows up (e.g. when you start a playlist), stays while you watch the next videos of it and disappears when the content is gone. If there are more tabs than fit, the tab bar scrolls sideways.

## [1.1.1] - 2026-11-11

### Fixed
- The page no longer scrolls into empty space below the video. YouTube's ambient mode glow reaches far below the player; without the comments underneath, it made the whole page scrollable.

## [1.1.0] - 2026-11-09

### Added
- Comments tab: the header with comment count, sorting and the "Add a comment…" box stays pinned below the tabs, so you can write a comment at any time. It sits in its own non-scrolling area, so it blends in with YouTube's background (including ambient mode).

### Fixed
- Scrolling with the mouse wheel over the hover preview, the tab bar or the pinned comment header now scrolls the sidebar. Before, it tried to scroll the main page, so often nothing happened.
- The sidebar now stays in view when the whole page is scrolled (e.g. with a large player), instead of scrolling away and leaving an empty column.
- The hover preview of a recommended video now moves along when the sidebar is scrolled, instead of staying in place over a different video. It is clipped to the sidebar, so it no longer covers the tab bar, and hides once its thumbnail has scrolled out.

## [1.0.0] - 2026-11-09

### Added
- Tabs for Recommended, Info and Comments in the right sidebar of YouTube watch pages.
- Sidebar as tall as the window, scrolling independently of the page.
- Remembers the last selected tab and the scroll position per tab.
- Switches off automatically in theater mode, fullscreen and the single-column layout.
- Light and dark theme.
- English and German UI.
