/* Krantjuweel — de kaart, de lezer en een bewerkmodus (index.html?edit).
   Geen afhankelijkheden. De inhoud komt uit content/articles.js (zie loadItems). */
(() => {
  'use strict';

  const CONFIG = {
    zoom: { min: 0.45, max: 1.6, step: 1.25 },
    cardWidth: { s: 192, m: 256, l: 336 }, // px bij zoom 1; gelijk aan --w in style.css (12/16/21rem)
    masthead: { w: 720, h: 320 },          // ruimte die vrij blijft rond de kop
    autoSpacing: 340,                      // afstand tussen automatisch geplaatste stukken
    gap: 40,                               // minimale ruimte tussen stukken bij automatisch plaatsen
    float: { amp: [5, 13], dur: [9, 16] }, // hoe ver (px) en hoe traag (s) de stukken zweven
  };

  const $ = (id) => document.getElementById(id);
  const viewport = $('viewport');
  const sizer = $('sizer');
  const map = $('map');
  const reader = $('reader');
  const readerContent = $('reader-content');

  let entries = [];      // { it, x, y, w, h, el }
  let byId = new Map();
  let editing = false;

  // ----- Inhoud -------------------------------------------------------------
  // Dit is de enige plek die weet waar de stukken vandaan komen. Met een backend wordt dit bv.:
  //   const res = await fetch('https://jouw-server.nl/api/collections/stukken/records?perPage=500');
  //   return (await res.json()).items;
  async function loadItems() {
    return (window.KRANTJUWEEL && window.KRANTJUWEEL.items) || [];
  }

  // ----- Hulpjes -------------------------------------------------------------

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  // Vaste 'toevalligheid' per stuk, zodat scheefheid en zweefritme bij elk bezoek gelijk zijn.
  function seeded(str) {
    let h = 2166136261;
    for (const ch of str) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      return (h >>> 0) / 4294967296;
    };
  }

  function formatDate(d) {
    if (!d) return '';
    const dt = new Date(`${d}T12:00:00`);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function hashId() {
    try {
      return decodeURIComponent(location.hash.slice(1));
    } catch {
      return '';
    }
  }

  // ----- Plaatsing -----------------------------------------------------------

  function widthOf(it) {
    return CONFIG.cardWidth[it.size] || CONFIG.cardWidth.m;
  }

  function heightOf(it, w) {
    if (it.type === 'image') {
      const aspect = isNum(it.aspect) && it.aspect > 0 ? it.aspect : 1;
      return w / aspect + 48;
    }
    return w * 0.85;
  }

  function overlaps(a, b) {
    return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + CONFIG.gap
      && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + CONFIG.gap;
  }

  // Stukken met x/y krijgen die plek. De rest gaat op een zonnebloemspiraal vanuit het midden,
  // op de eerste vrije plek: oud dicht bij de kop, nieuw komt er buitenom bij.
  function layout(items) {
    const taken = [{ x: 0, y: 0, w: CONFIG.masthead.w, h: CONFIG.masthead.h }];
    const list = items.map((it) => {
      const w = widthOf(it);
      return { it, w, h: heightOf(it, w), x: null, y: null, el: null };
    });

    for (const e of list) {
      if (isNum(e.it.x) && isNum(e.it.y)) {
        e.x = e.it.x;
        e.y = e.it.y;
        taken.push(e);
      }
    }

    let n = 1;
    for (const e of list) {
      if (e.x !== null) continue;
      for (;;) {
        const r = CONFIG.autoSpacing * Math.sqrt(n);
        const a = n * 2.39996; // de gulden hoek
        const cand = { x: Math.round(r * Math.cos(a)), y: Math.round(r * Math.sin(a) * 0.8), w: e.w, h: e.h };
        n += 1;
        if (!taken.some((t) => overlaps(t, cand))) {
          e.x = cand.x;
          e.y = cand.y;
          taken.push(e);
          break;
        }
      }
    }
    return list;
  }

  // ----- Camera: scrollen en zoomen -------------------------------------------

  const camera = {
    z: 1,
    W: 0,
    H: 0,

    apply() {
      sizer.style.width = `${this.W * this.z}px`;
      sizer.style.height = `${this.H * this.z}px`;
      map.style.width = `${this.W}px`;
      map.style.height = `${this.H}px`;
      map.style.transform = `scale(${this.z})`;
    },

    // Kaartpunt (t.o.v. het midden) dat nu in het midden van het scherm staat.
    center() {
      return {
        x: (viewport.scrollLeft + viewport.clientWidth / 2) / this.z - this.W / 2,
        y: (viewport.scrollTop + viewport.clientHeight / 2) / this.z - this.H / 2,
      };
    },

    centerOn(x, y, smooth) {
      viewport.scrollTo({
        left: (this.W / 2 + x) * this.z - viewport.clientWidth / 2,
        top: (this.H / 2 + y) * this.z - viewport.clientHeight / 2,
        behavior: smooth ? 'smooth' : 'auto',
      });
    },

    // Zoom naar z en houd het kaartpunt onder schermpositie (cx, cy) op zijn plek.
    zoomTo(z, cx, cy) {
      const next = clamp(z, CONFIG.zoom.min, CONFIG.zoom.max);
      const rect = viewport.getBoundingClientRect();
      const px = cx - rect.left;
      const py = cy - rect.top;
      const mx = (viewport.scrollLeft + px) / this.z;
      const my = (viewport.scrollTop + py) / this.z;
      this.z = next;
      this.apply();
      viewport.scrollLeft = mx * next - px;
      viewport.scrollTop = my * next - py;
    },

    zoomAroundCenter(factor) {
      const rect = viewport.getBoundingClientRect();
      this.zoomTo(this.z * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
    },
  };

  // De kaart groeit mee met de stukken en is altijd minstens een paar schermen groot.
  function fitMap() {
    const keep = camera.W ? camera.center() : null;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    let ex = CONFIG.masthead.w / 2;
    let ey = CONFIG.masthead.h / 2;
    for (const e of entries) {
      ex = Math.max(ex, Math.abs(e.x) + e.w / 2);
      ey = Math.max(ey, Math.abs(e.y) + e.h / 2);
    }
    camera.W = Math.max(2 * (ex + vw * 0.6), vw / CONFIG.zoom.min);
    camera.H = Math.max(2 * (ey + vh * 0.6), vh / CONFIG.zoom.min);
    camera.apply();
    if (keep) camera.centerOn(keep.x, keep.y, false);
  }

  // ----- Tekst -----------------------------------------------------------------

  function plainExcerpt(body, max = 200) {
    if (!body) return '';
    const text = String(body)
      .replace(/^#{1,3}\s.*$/gm, '')            // koppen
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')     // afbeeldingen
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')  // links -> alleen de tekst
      .replace(/^\s*(?:[-*]|\d+\.)\s+/gm, '')   // lijsttekens
      .replace(/^>\s?/gm, '')                   // citaten
      .replace(/[*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
  }

  // Een klein beetje markdown: alinea's, # koppen, > citaten, - en 1. lijstjes, ---,
  // **vet**, *schuin*, [tekst](url), ![beschrijving](pad).
  // Regeleinden binnen een alinea blijven staan (fijn voor gedichten en brieven).
  function renderMarkdown(src) {
    const inline = (t) => esc(t)
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+|[#./][^)\s]*)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br>');

    return String(src).trim().split(/\n\s*\n/).map((raw) => {
      const b = raw.trim();
      let m;
      if ((m = b.match(/^(#{1,3})\s+([\s\S]+)$/))) {
        const level = m[1].length + 1; // # wordt h2; de titel van het stuk is al de h1
        return `<h${level}>${inline(m[2])}</h${level}>`;
      }
      if (/^(?:-{3,}|\*{3,})$/.test(b)) return '<hr>';
      if (/^>/.test(b)) return `<blockquote><p>${inline(b.replace(/^>\s?/gm, ''))}</p></blockquote>`;
      if (/^[-*]\s/.test(b)) {
        return `<ul>${b.split('\n').map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      if (/^\d+\.\s/.test(b)) {
        return `<ol>${b.split('\n').map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`;
      }
      if ((m = b.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
        return `<figure><img src="${esc(m[2])}" alt="${esc(m[1])}" loading="lazy"></figure>`;
      }
      return `<p>${inline(b)}</p>`;
    }).join('\n');
  }

  // ----- De kaartjes -----------------------------------------------------------

  function articleCard(it) {
    const excerpt = it.excerpt || plainExcerpt(it.body);
    const kicker = [it.kind || 'artikel', it.author].filter(Boolean).map(esc).join('<span class="orn">◆</span>');
    return `
      <div class="card-kicker">${kicker}</div>
      <h2 class="card-title">${esc(it.title)}</h2>
      ${excerpt ? `<p class="card-excerpt">${esc(excerpt)}</p>` : ''}
      <span class="card-more">lees verder →</span>`;
  }

  function imageCard(it) {
    return `
      <figure>
        <img src="${esc(it.image)}" alt="${esc(it.alt || it.title)}" loading="lazy" decoding="async" draggable="false">
        <figcaption><span>${esc(it.title)}</span><span>${esc(it.author || '')}</span></figcaption>
      </figure>`;
  }

  function positionEl(e) {
    e.el.style.left = `calc(50% + ${e.x}px)`;
    e.el.style.top = `calc(50% + ${e.y}px)`;
  }

  function renderEntry(e, order) {
    const it = e.it;
    const rnd = seeded(it.id);
    const [a0, a1] = CONFIG.float.amp;
    const [d0, d1] = CONFIG.float.dur;
    const sign = () => (rnd() < 0.5 ? -1 : 1);
    const dur = lerp(d0, d1, rnd());

    const el = document.createElement('div');
    el.className = 'item';
    el.dataset.id = it.id;
    el.dataset.size = CONFIG.cardWidth[it.size] ? it.size : 'm';
    el.style.setProperty('--i', order);
    el.style.setProperty('--rot', `${isNum(it.rotate) ? it.rotate : lerp(-3.5, 3.5, rnd()).toFixed(2)}deg`);
    el.style.setProperty('--dx', `${(sign() * lerp(a0, a1, rnd())).toFixed(1)}px`);
    el.style.setProperty('--dy', `${(sign() * lerp(a0, a1, rnd())).toFixed(1)}px`);
    el.style.setProperty('--dur', `${dur.toFixed(2)}s`);
    el.style.setProperty('--delay', `${(-dur * rnd()).toFixed(2)}s`); // negatief: elk stuk begint ergens midden in zijn baan

    const card = document.createElement('a');
    card.className = `card ${it.type === 'image' ? 'card-image' : 'card-article'}`;
    card.href = `#${encodeURIComponent(it.id)}`;
    card.draggable = false;
    card.innerHTML = it.type === 'image' ? imageCard(it) : articleCard(it);

    const floater = document.createElement('div');
    floater.className = 'item-float';
    floater.append(card);
    el.append(floater);

    e.el = el;
    positionEl(e);
    return el;
  }

  // ----- De lezer ----------------------------------------------------------------

  function setOpenItem(e) {
    map.querySelectorAll('.item.is-open').forEach((el) => el.classList.remove('is-open'));
    if (e) e.el.classList.add('is-open');
  }

  function openReader(e) {
    const it = e.it;
    const meta = [it.kind || (it.type === 'image' ? 'beeld' : 'artikel'), it.author, formatDate(it.date)]
      .filter(Boolean)
      .map(esc)
      .join(' <span class="orn">◆</span> ');
    const figure = it.image
      ? `<figure class="sheet-figure">
           <img src="${esc(it.image)}" alt="${esc(it.alt || it.title)}">
           ${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ''}
         </figure>`
      : '';

    readerContent.innerHTML = `
      <p class="sheet-kicker">${meta}</p>
      <h1 class="sheet-title" id="reader-title">${esc(it.title)}</h1>
      ${figure}
      ${it.body ? `<div class="sheet-body">${renderMarkdown(it.body)}</div>` : ''}
      <p class="sheet-end" aria-hidden="true">◆</p>`;
    readerContent.scrollTop = 0;

    if (!reader.open) reader.showModal();
    setOpenItem(e);
    camera.centerOn(e.x, e.y, true);
  }

  function route() {
    const e = byId.get(hashId());
    if (e) openReader(e);
    else if (reader.open) reader.close();
  }

  reader.addEventListener('close', () => {
    setOpenItem(null);
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  });
  reader.addEventListener('click', (ev) => {
    if (ev.target === reader) reader.close(); // klik naast het vel
  });
  $('reader-close').addEventListener('click', () => reader.close());
  window.addEventListener('hashchange', route);

  // ----- Slepen met de muis --------------------------------------------------------
  // Aanraken en scrollen doet de browser zelf (het is een gewoon scrollvlak).

  let drag = null;
  let suppressClick = false;

  viewport.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
    if (editing && ev.target.closest('.card')) return;
    drag = { x: ev.clientX, y: ev.clientY, left: viewport.scrollLeft, top: viewport.scrollTop, moved: false };
  });

  window.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const dx = ev.clientX - drag.x;
    const dy = ev.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      viewport.classList.add('is-dragging');
    }
    viewport.scrollLeft = drag.left - dx;
    viewport.scrollTop = drag.top - dy;
  });

  function endDrag() {
    if (!drag) return;
    if (drag.moved) {
      suppressClick = true; // na slepen is de klik die volgt geen klik
      setTimeout(() => { suppressClick = false; }, 0);
    }
    drag = null;
    viewport.classList.remove('is-dragging');
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  viewport.addEventListener('click', (ev) => {
    if (suppressClick) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }, true);
  viewport.addEventListener('dragstart', (ev) => ev.preventDefault());

  // ----- Zoomen ---------------------------------------------------------------------

  viewport.addEventListener('wheel', (ev) => {
    if (!ev.ctrlKey && !ev.metaKey) return; // gewoon scrollen = over de kaart bewegen
    ev.preventDefault();
    camera.zoomTo(camera.z * Math.exp(-ev.deltaY * 0.0022), ev.clientX, ev.clientY);
  }, { passive: false });

  $('zoom-in').addEventListener('click', () => camera.zoomAroundCenter(CONFIG.zoom.step));
  $('zoom-out').addEventListener('click', () => camera.zoomAroundCenter(1 / CONFIG.zoom.step));
  $('recenter').addEventListener('click', () => camera.centerOn(0, 0, true));

  window.addEventListener('keydown', (ev) => {
    if (reader.open) return;
    if (ev.target instanceof Element && ev.target.closest('input, textarea, button')) return;
    if (ev.key === '+' || ev.key === '=') camera.zoomAroundCenter(CONFIG.zoom.step);
    else if (ev.key === '-') camera.zoomAroundCenter(1 / CONFIG.zoom.step);
    else if (ev.key === '0') camera.centerOn(0, 0, true);
  });

  // ----- Bewerkmodus: stukken verslepen en de coördinaten overnemen -------------------

  function initEditor() {
    editing = true;
    document.body.classList.add('is-editing');
    const out = $('editor-out');
    const moved = new Map();
    $('editor').hidden = false;

    const show = () => {
      out.textContent = moved.size
        ? [...moved].map(([id, p]) => `${id}:  x: ${p.x}, y: ${p.y}`).join('\n')
        : 'nog niets verplaatst';
    };

    map.addEventListener('pointerdown', (ev) => {
      const card = ev.target.closest('.card');
      if (!card || ev.button !== 0) return;
      ev.preventDefault();
      const e = byId.get(card.closest('.item').dataset.id);
      const start = { x: ev.clientX, y: ev.clientY, ex: e.x, ey: e.y };

      const onMove = (mv) => {
        e.x = Math.round(start.ex + (mv.clientX - start.x) / camera.z);
        e.y = Math.round(start.ey + (mv.clientY - start.y) / camera.z);
        positionEl(e);
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        moved.set(e.it.id, { x: e.x, y: e.y });
        show();
        fitMap();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    map.addEventListener('click', (ev) => {
      if (ev.target.closest('.card')) ev.preventDefault(); // in bewerkmodus opent klikken niets
    });

    $('editor-copy').addEventListener('click', () => {
      if (navigator.clipboard) navigator.clipboard.writeText(out.textContent);
    });
  }

  // ----- Start ------------------------------------------------------------------------

  async function init() {
    const items = (await loadItems()).filter((it) => it && it.id && it.title);
    items.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

    entries = layout(items);
    byId = new Map(entries.map((e) => [e.it.id, e]));
    fitMap();

    // Dichtst bij het midden verschijnt het eerst.
    const frag = document.createDocumentFragment();
    [...entries]
      .sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y))
      .forEach((e, i) => frag.append(renderEntry(e, i)));
    map.append(frag);

    $('count').textContent = `${entries.length} ${entries.length === 1 ? 'stuk' : 'stukken'}`;

    // Op een smal scherm iets uitgezoomd beginnen, zodat de kop past.
    camera.z = clamp(viewport.clientWidth / 900, CONFIG.zoom.min, 1);
    camera.apply();

    const start = byId.get(hashId());
    camera.centerOn(start ? start.x : 0, start ? start.y : 0, false);
    if (start) openReader(start);

    window.addEventListener('resize', fitMap);
    if (new URLSearchParams(location.search).has('edit')) initEditor();
  }

  init();
})();
