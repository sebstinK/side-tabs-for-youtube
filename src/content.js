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

  const STORAGE_KEY = 'ytsActiveTab';
  const store = globalThis.chrome?.storage?.local;

  const state = {
    panel: null,
    panes: {},   // key -> pane element
    buttons: {}, // key -> tab button
    moved: {},   // key -> { el, placeholder }
    scroll: {},  // key -> saved scrollTop
    active: 'related',
  };

  // ---------- Helpers ----------

  function findCandidate(flexy, selectors) {
    for (const sel of selectors) {
      for (const el of flexy.querySelectorAll(sel)) {
        if (!state.panel || !state.panel.contains(el)) return el;
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

      const pane = document.createElement('div');
      pane.className = 'yts-pane';
      pane.id = `yts-pane-${key}`;
      pane.setAttribute('role', 'tabpanel');
      pane.hidden = true;
      panel.appendChild(pane);
      state.panes[key] = pane;
    }
    return panel;
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
    const pane = state.panes[key];
    pane.scrollTop = state.scroll[key] || 0;
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

  function moveIn(key, el) {
    if (state.moved[key]) restoreOne(key);
    const placeholder = document.createComment(`yts-placeholder-${key}`);
    el.parentNode.insertBefore(placeholder, el);
    state.panes[key].appendChild(el);
    state.moved[key] = { el, placeholder };
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
    for (const [key, { el }] of Object.entries(state.moved)) {
      if (!state.panel.contains(el) || el.parentElement === state.panes[key]) continue;
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
    state.buttons = {};
    state.scroll = {};
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

    for (const { key } of TABS) {
      const candidate = findCandidate(flexy, SELECTORS[key]);
      if (candidate) moveIn(key, candidate);
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
