# Chrome Web Store listing

Copy these texts into the Chrome Web Store developer dashboard
(https://chrome.google.com/webstore/devconsole). Fields marked *required* must be filled before you can submit.

## Store listing

**Name** (comes from `_locales/*/messages.json`): Side Tabs for YouTube

**Summary** (from the manifest, max. 132 characters)
- EN: Switch between Recommended, Info and Comments in the right sidebar while the video keeps playing. No scrolling down.
- DE: Wechsle in der rechten Spalte zwischen Empfohlen, Infos und Kommentaren, während das Video weiterläuft. Kein Runterscrollen.

**Category:** Productivity *(alternative: Tools)*

**Language:** English (add German as a second language in the dashboard)

### Description (EN)

Read the comments without losing the video.

On YouTube, the comments and the full description sit below the video. To read them you scroll down, and the video disappears. Side Tabs for YouTube puts them right next to the video instead: the right sidebar gets three tabs.

• Recommended – the usual suggested videos
• Info – the full video description
• Comments – the complete comment section

The sidebar is as tall as your window and scrolls on its own, so the video always stays in view.

Everything keeps working: replies, likes, sorting, loading more comments and timestamp links. The extension uses YouTube's own page elements instead of copies.

• Remembers your last tab
• Light and dark theme
• Switches off in theater mode, fullscreen and narrow windows
• No tracking, no ads, no data collection
• Open source (MIT): https://github.com/sebstinK/side-tabs-for-youtube

Not affiliated with YouTube or Google.

### Beschreibung (DE)

Kommentare lesen, ohne das Video aus den Augen zu verlieren.

Auf YouTube stehen Kommentare und die vollständige Beschreibung unter dem Video. Um sie zu lesen, scrollst du nach unten – und das Video ist weg. Side Tabs for YouTube holt sie direkt neben das Video: Die rechte Spalte bekommt drei Tabs.

• Empfohlen – die üblichen Videovorschläge
• Infos – die vollständige Videobeschreibung
• Kommentare – der komplette Kommentarbereich

Die Spalte ist so hoch wie dein Fenster und scrollt für sich, das Video bleibt immer sichtbar.

Alles funktioniert weiter: Antworten, Likes, Sortierung, Nachladen und Zeitstempel-Links. Die Erweiterung nutzt YouTubes eigene Seitenelemente statt Kopien.

• Merkt sich den zuletzt gewählten Tab
• Helles und dunkles Design
• Schaltet sich im Kinomodus, Vollbild und bei schmalem Fenster ab
• Kein Tracking, keine Werbung, keine Datensammlung
• Open Source (MIT): https://github.com/sebstinK/side-tabs-for-youtube

Keine Verbindung zu YouTube oder Google.

### Graphic assets

| Asset | Size | Required |
|---|---|---|
| Store icon | 128×128 | yes – use `icons/icon128.png` |
| Screenshots | 1280×800 or 640×400, 1–5 images | yes, at least one – `store-assets/1-comments-dark.jpg`, `2-info-light.jpg`, `3-recommended-dark.jpg` |
| Small promo tile | 440×280 | yes – `store-assets/promo-small-440x280.jpg` |
| Marquee promo tile | 1400×560 | no – `store-assets/promo-marquee-1400x560.jpg` |

The screenshots show "Big Buck Bunny" (Blender Foundation, CC BY), so they may be shown publicly. When you retake them, use a video you're allowed to show (your own upload or a Creative Commons video) and save them as JPEG or 24-bit PNG without alpha.

## Privacy practices tab

**Single purpose** *(required)*
> Shows the recommended videos, the video description and the comments of a YouTube watch page as tabs in the right sidebar, so they can be read while the video keeps playing.

**Permission justification: `storage`** *(required)*
> Stores the name of the last selected tab locally, so the same tab opens on the next video. Nothing else is stored.

**Permission justification: host access to `www.youtube.com`** *(required — the content script match counts as host access)*
> The extension only rearranges elements on YouTube watch pages. It needs to run on www.youtube.com to show the tabs.

**Remote code:** No, I am not using remote code.

**Data usage:** tick nothing in the list of collected data. Then confirm all three statements:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** link to `PRIVACY.md` in your GitHub repository, e.g.
`https://github.com/sebstinK/side-tabs-for-youtube/blob/main/PRIVACY.md`
