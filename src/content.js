/*!
 * Side Tabs for YouTube
 * Tabs for Recommended / Info / Comments in the right sidebar of the watch page.
 * MIT License – see LICENSE.
 */
(() => {
  'use strict';

  // All YouTube selectors live here. When YouTube changes its markup, this is usually
  // the only place that needs a fix. Each entry is a list: the first match wins.
  const SELECTORS = {
    flexy: 'ytd-watch-flexy',
    related: ['#secondary #related'],
    description: ['ytd-watch-metadata #bottom-row > #description'],
    comments: ['#below #comments', 'ytd-comments#comments'],
    // Comment count, sorting and "Add a comment…" box at the top of the comment section.
    commentsHeader: ['ytd-comments#comments ytd-item-section-renderer#sections > #header'],
    // Hover preview: YouTube renders it once, absolutely positioned in page coordinates.
    previewRoot: '#video-preview',
    previewBox: ['.ytdVideoPreviewLoaderVideoPreviewContainer', '.ytdVideoPreviewPortalPreviewContainer'],
  };

  // Labels come from _locales/<lang>/messages.json (browser language), English fallback.
  const t = (id, fallback) => {
    try { return globalThis.chrome?.i18n?.getMessage(id) || fallback; } catch (_) { return fallback; }
  };

  // To add a tab: add an entry here, a selector list in SELECTORS and a label in _locales.
  const TABS = [
    { key: 'related', label: t('tabRelated', 'Recommended') },
    { key: 'description', label: t('tabDescription', 'Info') },
    { key: 'comments', label: t('tabComments', 'Comments') },
  ];

  // Parts that stay pinned between the tab bar and the scrolling list of a tab.
  // They are moved out of the list into their own slot, so nothing scrolls behind them.
  const PINNED = [
    { key: 'commentsHeader', tab: 'comments' },
  ];

  const STORAGE_KEY = 'ytsActiveTab';
  const store = globalThis.chrome?.storage?.local;

  const state = {
    panel: null,
    panes: {},   // key -> pane element
    slots: {},   // pinned key -> slot element
    buttons: {}, // key -> tab button
    moved: {},   // key -> { el, placeholder, container }
    scroll: {},  // key -> saved scrollTop
    active: 'related',
  };

  // ---------- Helpers ----------

  // First match that is not already where we put it (`exclude`, by default the whole panel).
  function findCandidate(flexy, selectors, exclude = state.panel) {
    for (const sel of selectors) {
      for (const el of flexy.querySelectorAll(sel)) {
        if (!exclude || !exclude.contains(el)) return el;
      }
    }
    return null;
  }

  // The panel only makes sense in the default two-column layout.
  // In theater mode, fullscreen and narrow windows YouTube rearranges the page itself.
  function shouldMount(flexy) {
    return (
      location.pathname === '/watch' &&
      flexy &&
      !flexy.hidden &&
      flexy.hasAttribute('is-two-columns_') &&
      !flexy.hasAttribute('theater') &&
      !flexy.hasAttribute('fullscreen')
    );
  }

  // ---------- Panel ----------

  function buildPanel() {
    const panel = document.createElement('div');
    panel.id = 'yts-panel';

    const bar = document.createElement('div');
    bar.id = 'yts-tabs';
    bar.setAttribute('role', 'tablist');
    panel.appendChild(bar);

    for (const { key, label } of TABS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'yts-tab';
      btn.textContent = label;
      btn.setAttribute('role', 'tab');
      btn.addEventListener('click', () => {
        selectTab(key);
        btn.blur(); // keep YouTube keyboard shortcuts (space, k, j, l …) working
      });
      bar.appendChild(btn);
      state.buttons[key] = btn;

      for (const pin of PINNED.filter((p) => p.tab === key)) {
        const slot = document.createElement('div');
        slot.className = 'yts-pinned';
        slot.id = `yts-pinned-${pin.key}`;
        slot.hidden = true;
        panel.appendChild(slot);
        state.slots[pin.key] = slot;
      }

      const pane = document.createElement('div');
      pane.className = 'yts-pane';
      pane.id = `yts-pane-${key}`;
      pane.setAttribute('role', 'tabpanel');
      pane.hidden = true;
      pane.addEventListener('scroll', () => onPaneScroll(pane), { passive: true });
      panel.appendChild(pane);
      state.panes[key] = pane;
    }
    return panel;
  }

  function onPaneScroll(pane) {
    followPreview(pane);
    markScrolled(pane);
  }

  // Lets CSS draw a divider under a pinned slot once its list is scrolled.
  function markScrolled(pane) {
    const scrolled = pane.scrollTop > 4;
    for (const pin of PINNED) {
      if (state.panes[pin.tab] === pane) state.slots[pin.key]?.classList.toggle('yts-scrolled', scrolled);
    }
  }

  // ---------- Hover preview follows the panel ----------
  // YouTube places the hover preview at the thumbnail's position in *page* coordinates.
  // That works when the whole page scrolls, but our panes scroll on their own, so the
  // preview would stay put while the list moves under it. We remember the pane's scroll
  // position at the moment YouTube places the preview and shift the preview by the
  // difference. The shift is a CSS variable on #video-preview that styles.css applies
  // via `translate`, so YouTube's own inline styles are never touched.

  const preview = { root: null, observer: null, baseline: 0 };

  function previewBox() {
    if (!preview.root) return null;
    for (const sel of SELECTORS.previewBox) {
      const el = preview.root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function setPreviewShift(dy, clipTop = 0, clipBottom = 0) {
    if (!preview.root) return;
    preview.root.style.setProperty('--yts-preview-dy', `${dy}px`);
    // Only clip top and bottom; the preview may grow sideways like it does on YouTube.
    preview.root.style.setProperty(
      '--yts-preview-clip',
      clipTop || clipBottom ? `inset(${clipTop}px -9999px ${clipBottom}px -9999px)` : 'none'
    );
  }

  function watchPreview() {
    const root = document.querySelector(SELECTORS.previewRoot);
    if (!root || root === preview.root) return;
    preview.observer?.disconnect();
    preview.root = root;
    // A style/class change on the preview box means YouTube (re)placed or hid the
    // preview: start counting from the current scroll position again.
    preview.observer = new MutationObserver((mutations) => {
      const box = previewBox();
      if (!box || !mutations.some((m) => m.target === box)) return;
      const pane = state.panes[state.active];
      preview.baseline = pane ? pane.scrollTop : 0;
      setPreviewShift(0);
      // YouTube draws the preview larger than the thumbnail, so near the top of the
      // pane it would cover the tab bar. Clip it to the pane right away.
      if (pane) followPreview(pane);
    });
    preview.observer.observe(root, {
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }

  function followPreview(pane) {
    if (pane.hidden) return;
    const box = previewBox();
    if (!box || box.getClientRects().length === 0) return; // no preview showing
    const dy = preview.baseline - pane.scrollTop;
    const r = box.getBoundingClientRect();
    const p = pane.getBoundingClientRect();
    // Leave previews alone that don't belong to our pane (no horizontal overlap).
    if (r.right <= p.left || r.left >= p.right) {
      setPreviewShift(0);
      return;
    }
    // Where the box will be after the new shift, then clip everything outside the pane:
    // that keeps the tab bar uncovered and hides the preview once it scrolls out.
    const currentDy = parseFloat(preview.root.style.getPropertyValue('--yts-preview-dy')) || 0;
    const top = r.top - currentDy + dy;
    const bottom = top + r.height;
    const clipTop = Math.min(r.height, Math.max(0, Math.ceil(p.top - top)));
    const clipBottom = Math.min(r.height, Math.max(0, Math.ceil(bottom - p.bottom)));
    setPreviewShift(dy, clipTop, clipBottom);
  }

  // ---------- Mouse wheel over the panel always scrolls the active tab ----------
  // Inside a pane the browser scrolls it natively. But the hover preview lies *on top*
  // of the pane and belongs to the page, and the tab bar and pinned slots don't scroll.
  // A wheel there would scroll the main page instead (often already at its top or
  // bottom, so nothing seems to happen). We forward those wheels to the active pane.

  function canScrollItself(el, stop, dy) {
    for (let n = el; n && n !== stop; n = n.parentElement) {
      const oy = getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight) {
        if (dy < 0 ? n.scrollTop > 0 : n.scrollTop + n.clientHeight < n.scrollHeight) return true;
      }
    }
    return false;
  }

  function previewBelongsToPane(pane) {
    const box = previewBox();
    if (!box || box.getClientRects().length === 0) return false;
    const r = box.getBoundingClientRect();
    const p = pane.getBoundingClientRect();
    return r.right > p.left && r.left < p.right;
  }

  function onWheel(e) {
    if (!state.panel || e.defaultPrevented || e.ctrlKey) return; // ctrl+wheel = zoom
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;         // horizontal scrolling
    const pane = state.panes[state.active];
    const target = e.target instanceof Element ? e.target : null;
    if (!pane || !target || pane.contains(target)) return;       // native scrolling works

    const overPreview = preview.root?.contains(target) && previewBelongsToPane(pane);
    const overPanel = state.panel.contains(target);
    if (!overPreview && !overPanel) return;
    // Something inside the tab bar or a pinned slot that scrolls itself
    // (e.g. a long comment draft) keeps its own scrolling.
    if (overPanel && canScrollItself(target, state.panel, e.deltaY)) return;

    const max = pane.scrollHeight - pane.clientHeight;
    if (max <= 0) return; // nothing to scroll in this tab, let the page scroll
    e.preventDefault();
    const line = 40;
    const dy = e.deltaMode === 1 ? e.deltaY * line : e.deltaMode === 2 ? e.deltaY * pane.clientHeight : e.deltaY;
    // Mouse wheels send big steps, trackpads many small ones: smooth only the big ones.
    pane.scrollBy({ top: dy, behavior: Math.abs(dy) >= 50 ? 'smooth' : 'instant' });
  }

  function selectTab(key) {
    const prev = state.active;
    if (state.panes[prev] && !state.panes[prev].hidden) {
      state.scroll[prev] = state.panes[prev].scrollTop;
    }
    state.active = key;
    for (const { key: k } of TABS) {
      const on = k === key;
      state.panes[k].hidden = !on;
      state.buttons[k].setAttribute('aria-selected', String(on));
    }
    for (const pin of PINNED) {
      if (state.slots[pin.key]) state.slots[pin.key].hidden = pin.tab !== key;
    }
    const pane = state.panes[key];
    pane.scrollTop = state.scroll[key] || 0;
    markScrolled(pane);
    preview.baseline = pane.scrollTop;
    setPreviewShift(0);
    nudgeLazyLoad(pane);
    try { store?.set({ [STORAGE_KEY]: key }); } catch (_) { /* extension was reloaded */ }
  }

  // YouTube lazy-loads comments and recommendations once they become visible.
  // A tiny nudge makes sure its loading logic fires after a tab switch.
  function nudgeLazyLoad(pane) {
    requestAnimationFrame(() => {
      pane.scrollTop += 1;
      pane.scrollTop -= 1;
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
    });
  }

  // ---------- Moving and restoring nodes ----------
  // We move YouTube's own elements instead of cloning them, so replies, likes,
  // sorting, lazy loading and timestamp links keep working. A comment node marks
  // the original spot so everything can be put back.

  function moveIn(key, el, container) {
    if (state.moved[key]) restoreOne(key);
    const placeholder = document.createComment(`yts-placeholder-${key}`);
    el.parentNode.insertBefore(placeholder, el);
    container.appendChild(el);
    state.moved[key] = { el, placeholder, container };
  }

  function restoreOne(key) {
    const entry = state.moved[key];
    if (!entry) return;
    const { el, placeholder } = entry;
    // Only put it back if it is still ours. If YouTube moved it somewhere else
    // on its own (e.g. single-column layout), leave it there.
    if (state.panel && state.panel.contains(el)) {
      if (placeholder.isConnected) {
        placeholder.parentNode.insertBefore(el, placeholder);
      } else {
        el.remove();
      }
    }
    placeholder.remove();
    delete state.moved[key];
  }

  function unmount() {
    if (!state.panel) return;

    // On layout changes YouTube rearranges nodes itself; in the single-column layout it
    // inserts #related right next to #comments. If both are in our panel at that moment,
    // #related ends up inside the comments pane. Such a "displaced" node must go back
    // next to the neighbour YouTube chose, not to its old placeholder.
    const movedEls = new Set(Object.values(state.moved).map((m) => m.el));
    const displaced = [];
    for (const [key, { el, container }] of Object.entries(state.moved)) {
      if (!state.panel.contains(el) || el.parentElement === container) continue;
      const anchor = [...el.parentElement.children].find((c) => c !== el && movedEls.has(c));
      if (!anchor) continue;
      const before = Boolean(el.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING);
      displaced.push({ key, el, anchor, before });
    }

    for (const key of Object.keys(state.moved)) {
      if (!displaced.some((d) => d.key === key)) restoreOne(key);
    }
    for (const { key, el, anchor, before } of displaced) {
      if (!state.panel.contains(anchor)) {
        if (before) anchor.before(el);
        else anchor.after(el);
      }
      restoreOne(key); // only drops the placeholder unless el is still in the panel
    }

    state.panel.remove();
    state.panel = null;
    state.panes = {};
    state.slots = {};
    state.buttons = {};
    state.scroll = {};
    setPreviewShift(0);
    document.documentElement.classList.remove('yts-active');
  }

  function mount(flexy) {
    const related = findCandidate(flexy, SELECTORS.related);
    if (!related) return; // page not ready yet, the next sync tries again

    state.panel = buildPanel();
    related.parentNode.insertBefore(state.panel, related);
    document.documentElement.classList.add('yts-active');
    selectTab(state.active);
  }

  // ---------- Sync ----------
  // YouTube is a single-page app: elements appear late, get re-created and moved.
  // sync() is idempotent and simply brings the page into the desired state.

  function sync() {
    const flexy = document.querySelector(SELECTORS.flexy);

    if (!shouldMount(flexy)) {
      unmount();
      return;
    }

    if (state.panel && !state.panel.isConnected) unmount();
    if (!state.panel) mount(flexy);
    if (!state.panel) return;
    watchPreview();

    for (const { key } of TABS) {
      const candidate = findCandidate(flexy, SELECTORS[key]);
      if (candidate) moveIn(key, candidate, state.panes[key]);
    }
    for (const { key } of PINNED) {
      const slot = state.slots[key];
      const candidate = findCandidate(flexy, SELECTORS[key], slot);
      if (candidate) moveIn(key, candidate, slot);
    }
  }

  let scheduled = false;
  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      sync();
    });
  }

  // ---------- Start ----------

  function start() {
    new MutationObserver(scheduleSync).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['theater', 'fullscreen', 'is-two-columns_', 'hidden'],
    });
    window.addEventListener('yt-navigate-finish', scheduleSync);
    // Capture phase + passive:false so we can take over the wheel before the page scrolls.
    document.addEventListener('wheel', onWheel, { capture: true, passive: false });
    scheduleSync();
  }

  try {
    if (store) {
      store.get(STORAGE_KEY, (res) => {
        if (TABS.some((tab) => tab.key === res?.[STORAGE_KEY])) state.active = res[STORAGE_KEY];
        start();
      });
    } else {
      start();
    }
  } catch (_) {
    start();
  }
})();
