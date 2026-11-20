// Router and boot. Hash routes, one view at a time, cleanup between views.

import { board } from './api.js';
import { isEnabled, setEnabled, sfx } from './sound.js';
import { guideView } from './views/guide.js';
import { homeView } from './views/home.js';
import { playView } from './views/play.js';
import { proofView } from './views/proof.js';
import { watchView } from './views/watch.js';

const ROUTES = {
  '': { view: homeView, nav: null, title: 'Forge Fair — a board game you can prove' },
  play: { view: playView, nav: 'play', title: 'Play · Forge Fair' },
  watch: { view: watchView, nav: 'watch', title: 'Watch a bot · Forge Fair' },
  guide: { view: guideView, nav: 'guide', title: 'Rules · Forge Fair' },
  proof: { view: proofView, nav: 'proof', title: 'The proof · Forge Fair' },
};

let tiles = [];
let cleanups = [];
let seq = 0;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, anchor] = raw.split('#');
  const [name] = path.split('?');
  return { name: name || '', anchor: anchor || '' };
}

async function render() {
  const { name, anchor } = parseHash();
  const route = ROUTES[name] ?? ROUTES[''];
  const view = document.getElementById('view');
  const token = (seq += 1);

  cleanups.forEach((fn) => {
    try {
      fn();
    } catch {
      /* a broken cleanup must not block the next view */
    }
  });
  cleanups = [];

  document.title = route.title;
  document.querySelectorAll('.site-nav a').forEach((link) => {
    if (route.nav && link.dataset.nav === route.nav) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  view.innerHTML = `
    <div class="panel stack">
      <span class="eyebrow">Loading</span>
      <p class="muted">Warming the table…</p>
    </div>`;

  try {
    const node = await route.view({
      tiles,
      rerender: render,
      onCleanup: (fn) => cleanups.push(fn),
    });
    if (token !== seq) return;
    view.replaceChildren(node);

    if (anchor) {
      const target = document.getElementById(anchor);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  } catch (error) {
    if (token !== seq) return;
    view.innerHTML = `
      <div class="panel stack">
        <span class="eyebrow">Something broke</span>
        <h2>That table did not open.</h2>
        <p class="muted">${String(error.message ?? error)}</p>
        <div class="row"><a class="btn ghost" href="#/">Back home</a><a class="btn primary" href="#/play">Try a new table</a></div>
      </div>`;
  }
}

function wireSound() {
  const toggle = document.getElementById('sound-toggle');
  if (!toggle) return;

  const saved = localStorage.getItem('ff.sound') !== 'off';
  setEnabled(saved);
  toggle.setAttribute('aria-pressed', String(saved));
  toggle.setAttribute('title', saved ? 'Sound on' : 'Sound off');

  toggle.addEventListener('click', () => {
    const next = !isEnabled();
    setEnabled(next);
    localStorage.setItem('ff.sound', next ? 'on' : 'off');
    toggle.setAttribute('aria-pressed', String(next));
    toggle.setAttribute('title', next ? 'Sound on' : 'Sound off');
    if (next) sfx.click();
  });
}

async function boot() {
  wireSound();
  window.addEventListener('hashchange', render);

  try {
    tiles = (await board()).tiles;
  } catch {
    tiles = [];
  }

  await render();
}

boot();
