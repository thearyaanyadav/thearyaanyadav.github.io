/* ═══════════════════════════════════════════════════════
   aryaan yadav — main.js
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ─── Tab Navigation ─────────────────────────────────── */
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.tab-panel');

  function activate(id) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    panels.forEach(p => p.classList.toggle('active', p.id === `panel-${id}`));
    try { sessionStorage.setItem('aryaan-tab', id); } catch (_) { }
  }

  tabs.forEach(tab => tab.addEventListener('click', () => activate(tab.dataset.tab)));

  let saved = 'home';
  try { saved = sessionStorage.getItem('aryaan-tab') || 'home'; } catch (_) { }
  activate(saved);

  const hash = location.hash.replace('#', '');
  if (hash && document.getElementById(`panel-${hash}`)) activate(hash);
}

/* ─── Live Clock ─────────────────────────────────────── */
function initClock() {
  const el = document.getElementById('clock');
  if (!el) return;

  // Format the timezone offset string (e.g. UTC+5:30)
  function getTzString() {
    const offset = -new Date().getTimezoneOffset();
    if (offset === 0) return 'UTC';
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset / 60);
    const mins = absOffset % 60;
    return `UTC${sign}${hours}${mins ? ':' + String(mins).padStart(2, '0') : ''}`;
  }

  const tzString = getTzString();

  function tick() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}  ${tzString}`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ─── Typewriter Effect ──────────────────────────────── */
function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;
  const text = el.dataset.text || el.textContent;
  el.textContent = '';
  el.style.visibility = 'visible';
  let i = 0;
  function type() {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(type, 38 + Math.random() * 30);
    } else {
      el.style.borderRight = 'none';
      el.style.animation = 'blink-caret 0.7s step-end infinite';
    }
  }
  setTimeout(type, 800);
}

/* ─── Visitor Counter ────────────────────────────────── */
function initCounter() {
  const el = document.getElementById('visitor-count');
  if (!el) return;

  // Initial optimistic load from localStorage
  let localCount = 1337;
  try {
    localCount = parseInt(localStorage.getItem('aryaan-visitors') || '1337', 10);
  } catch (_) { }

  function render(val) {
    const str = String(val).padStart(7, '0');
    el.innerHTML = str.split('').map(d => `<span class="digit">${d}</span>`).join('');
  }

  render(localCount);

  // Fetch worldwide count and update
  // Added cache-busting parameter and no-store to prevent aggressive browser caching
  fetch(`https://api.counterapi.dev/v1/aryaan yadav/visitors/up?t=${Date.now()}`, { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (data && typeof data.count === 'number') {
        const globalCount = data.count + 1337; // preserve legacy base
        render(globalCount);
        try { localStorage.setItem('aryaan-visitors', globalCount); } catch (_) { }
      }
    })
    .catch(e => console.error('Counter API error:', e));
}

/* ─── Glitch Hover Setup ─────────────────────────────── */
function initGlitch() {
  document.querySelectorAll('.glitch').forEach(el => {
    el.dataset.text = el.textContent;
  });
}

/* ─── Smooth Scroll for anchor links ────────────────── */
function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

/* ─── Window Minimize Buttons ────────────────────────── */
function initWindowButtons() {
  document.querySelectorAll('.window').forEach(win => {
    const minBtn = win.querySelector('.win-btn.min');
    const body = win.querySelector('.window-body');
    if (minBtn && body) {
      minBtn.addEventListener('click', () => {
        body.style.display = body.style.display === 'none' ? '' : 'none';
      });
    }
  });
}

/* ─── Random Pixel Noise Background ─────────────────── */
function initNoise() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9997;opacity:0.025;';
  const ctx = canvas.getContext('2d');
  function redraw() {
    const img = ctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() > 0.5 ? 255 : 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 15;
    }
    ctx.putImageData(img, 0, 0);
  }
  redraw();
  setInterval(redraw, 120);
  document.body.appendChild(canvas);
}

// HTML escaping for security
function escHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ═══════════════════════════════════════════════════════
   MINI MARKDOWN PARSER — no dependencies
   ═══════════════════════════════════════════════════════ */
function parseMd(md) {
  let html = '';
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let inCode = false;
  let codeBlock = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      if (inCode) {
        html += `<pre><code>${escHTML(codeBlock.trim())}</code></pre>`;
        codeBlock = '';
        inCode = false;
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeBlock += line + '\n'; continue; }
    if (/^---+$/.test(line.trim())) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<hr>';
      continue;
    }
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      if (inList) { html += '</ul>'; inList = false; }
      const lvl = hMatch[1].length;
      html += `<h${lvl}>${inlineMd(hMatch[2])}</h${lvl}>`;
      continue;
    }
    if (line.trim().startsWith('> ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<blockquote>${inlineMd(line.trim().slice(2))}</blockquote>`;
      continue;
    }
    const liMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (liMatch) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inlineMd(liMatch[1])}</li>`;
      continue;
    } else if (inList && line.trim() === '') {
      html += '</ul>'; inList = false;
      continue;
    }
    if (line.trim() === '') continue;
    if (inList) { html += '</ul>'; inList = false; }
    html += `<p>${inlineMd(line)}</p>`;
  }
  if (inList) html += '</ul>';
  if (inCode) html += `<pre><code>${escHTML(codeBlock.trim())}</code></pre>`;
  return html;
}

function inlineMd(text) {
  return escHTML(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

/* ═══════════════════════════════════════════════════════
   CYBERPUNK ASCII SCRAMBLE EFFECT
   On hover: randomly scrambles characters then resolve
   back to the original — keeps text readable throughout
   ═══════════════════════════════════════════════════════ */
function initAsciiScramble() {
  const el = document.getElementById('ascii-title');
  if (!el) return;

  // Set the data-text attribute for CSS chromatic layers
  el.dataset.text = el.textContent;

  const CHARSET = '!<>-_\\/[]{}—=+*^?#╔╗╝╚║═╬░▒▓█▄▀◆◇●○□■▪▫♦♣♠♥@$%&';
  const original = el.textContent;

  let scrambleTimer = null;
  let isScrambling = false;

  function scramble() {
    if (isScrambling) return;
    isScrambling = true;

    const chars = original.split('');
    // Track which indices have "resolved"
    const resolved = new Set();
    // Don't scramble whitespace / newlines — keep layout stable
    const candidates = chars.map((c, i) => (/[\S]/.test(c) && c !== '\n') ? i : null)
      .filter(i => i !== null);

    let frame = 0;
    const totalFrames = 22;

    function tick() {
      const out = chars.map((orig, i) => {
        if (!candidates.includes(i)) return orig; // whitespace → keep
        if (resolved.has(i)) return orig;  // already resolved
        // resolve progressively as frames advance
        if (frame / totalFrames > Math.random() * 0.85 + 0.1) {
          resolved.add(i);
          return orig;
        }
        return CHARSET[Math.floor(Math.random() * CHARSET.length)];
      });

      el.textContent = out.join('');
      el.dataset.text = el.textContent; // keep CSS layers in sync

      frame++;
      if (frame <= totalFrames || resolved.size < candidates.length) {
        scrambleTimer = requestAnimationFrame(tick);
      } else {
        // Final resolve — make sure we get the original exactly right
        el.textContent = original;
        el.dataset.text = original;
        isScrambling = false;
      }
    }

    scrambleTimer = requestAnimationFrame(tick);
  }

  function cancelScramble() {
    if (scrambleTimer) { cancelAnimationFrame(scrambleTimer); scrambleTimer = null; }
    el.textContent = original;
    el.dataset.text = original;
    isScrambling = false;
  }

  el.addEventListener('mouseenter', scramble);
  el.addEventListener('mouseleave', cancelScramble);
  // Re-fire every 4 seconds while hovering
  el.addEventListener('mouseenter', () => {
    clearInterval(window._asciiLoopTimer);
    window._asciiLoopTimer = setInterval(() => {
      if (!isScrambling) scramble();
    }, 3800);
  });
  el.addEventListener('mouseleave', () => clearInterval(window._asciiLoopTimer));
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC PHILES — read/write from localStorage
   ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   DYNAMIC PHILES — read/write from localStorage
   ═══════════════════════════════════════════════════════ */

function renderPhileList(containerEl, philes, maxItems) {
  if (!containerEl) return;
  const list = maxItems ? philes.slice(0, maxItems) : philes;
  containerEl.innerHTML = '';

  if (!list.length) {
    const li = document.createElement('li');
    li.style.cssText = 'color:var(--text-dim);font-size:12px;padding:12px 0;';
    li.textContent = 'No files yet.';
    containerEl.appendChild(li);
    return;
  }

  list.forEach(p => {
    const li = document.createElement('li');

    const leftSpan = document.createElement('span');

    // If in file list (not home preview) make it a button that opens the viewer
    const titleLink = document.createElement('a');
    titleLink.href = '#';
    titleLink.textContent = escHTML(p.title); // Escaped
    titleLink.style.cssText = 'text-decoration:none;';
    titleLink.addEventListener('click', e => {
      e.preventDefault();
       // Switch to Files tab so the viewer is visible
      const philesTab = document.querySelector('[data-tab="philes"]');
      if (philesTab) philesTab.click();
      if (window.openFile) window.openFile(p.title, p.body || p.excerpt || '', p.date, p.md || null);
    });
    leftSpan.appendChild(titleLink);

    if (p.excerpt) {
      const exSpan = document.createElement('span');
      exSpan.className = 'text-dim';
      exSpan.style.cssText = 'font-size:10px;display:block;';
      exSpan.textContent = escHTML(p.excerpt); // Escaped
      leftSpan.appendChild(exSpan);
    }

    const dateSpan = document.createElement('span');
    dateSpan.className = 'phile-date';
    dateSpan.textContent = escHTML(p.date || ''); // Escaped

    li.appendChild(leftSpan);
    li.appendChild(dateSpan);
    containerEl.appendChild(li);
  });
}

async function initDynamicPhiles() {
  let philes = [];
  try {
    const res = await fetch(`data/philes.json?t=${Date.now()}`);
    if (res.ok) philes = await res.json();
  } catch (e) {
    console.error('Failed to load philes.json', e);
  }

  // Home tab preview (3 most recent)
  const homeList = document.getElementById('philes-home-list');
  renderPhileList(homeList, philes, 3);

  // Full philes tab
  const fullList = document.getElementById('philes-full-list');
  renderPhileList(fullList, philes);
}

/* ─── Window Minimize Buttons (extended) ─────────────── */

/* ═══════════════════════════════════════════════════════
   DYNAMIC PROFILE — reads admin-saved values from localStorage
   and injects them into the page
   ═══════════════════════════════════════════════════════ */
async function initDynamicProfile() {
  let profile = {
    bio: '', location: 'somewhere on the internet', status: 'writing code at 3am',
    listening: 'ghost protocol', lastSeen: '2026-03-03', tags: 'code, security, music, games, night owl, eternal lone wolf',
    footerTagline: 'hand-coded with ♥ // best experienced at 3am', aboutIntro: '', aboutLine2: '',
    aboutContact: '', avatar: null, interests: 'security research, reverse engineering, low-level systems, game dev, music',
    skills: []
  };

  try {
    const res = await fetch(`data/profile.json?t=${Date.now()}`);
    if (res.ok) profile = await res.json();
  } catch (e) {
    console.error('Failed to load profile.json', e);
  }

  // Bio typewriter
  const bioEl = document.getElementById('typewriter');
  if (bioEl && profile.bio) {
    bioEl.dataset.text = profile.bio;
  }

  // Status block
  const locEl = document.getElementById('prof-location-display');
  if (locEl) locEl.textContent = escHTML(profile.location);

  const statusEl = document.getElementById('prof-status-display');
  if (statusEl) statusEl.textContent = escHTML(profile.status);

  const listeningEl = document.getElementById('listening-status');
  if (listeningEl) listeningEl.textContent = escHTML(profile.listening);

  const lastSeenEl = document.getElementById('last-updated');
  if (lastSeenEl) lastSeenEl.textContent = escHTML(profile.lastSeen);

  // Tags
  const tagsEl = document.getElementById('profile-tags');
  if (tagsEl && profile.tags) {
    tagsEl.innerHTML = profile.tags.split(',').map(t => t.trim()).filter(Boolean)
      .map(t => `<span class="tag">${escHTML(t)}</span>`).join('');
  }

  // Footer tagline
  const footerTagEl = document.getElementById('footer-tagline');
  if (footerTagEl) footerTagEl.textContent = escHTML(profile.footerTagline);

  // About page paragraphs
  const aboutIntroEl = document.getElementById('about-intro-text');
  if (aboutIntroEl && profile.aboutIntro) aboutIntroEl.textContent = escHTML(profile.aboutIntro);

  const aboutLine2El = document.getElementById('about-line2-text');
  if (aboutLine2El && profile.aboutLine2) aboutLine2El.textContent = escHTML(profile.aboutLine2);

  const aboutContactEl = document.getElementById('about-contact-text');
  if (aboutContactEl && profile.aboutContact) aboutContactEl.textContent = escHTML(profile.aboutContact);

  // Avatar
  const avatarEl = document.getElementById('main-avatar');
  const homeImgEl = document.getElementById('home-avatar-img');
  const homeEmojiEl = document.getElementById('home-avatar-emoji');

  if (profile.avatar) {
    const safeSrc = escHTML(profile.avatar);
    if (avatarEl) {
      avatarEl.src = safeSrc;
      avatarEl.style.display = 'block';
    }
    if (homeImgEl && homeEmojiEl) {
      homeImgEl.src = safeSrc;
      homeImgEl.style.display = 'block';
      homeEmojiEl.style.display = 'none';
      homeImgEl.parentElement.style.border = '1px solid var(--border)'; // clean up pixelated dragon border
    }
  } else {
    if (avatarEl) avatarEl.style.display = 'none';
    if (homeImgEl && homeEmojiEl) {
      homeImgEl.style.display = 'none';
      homeEmojiEl.style.display = 'block';
      homeImgEl.parentElement.style.border = '2px solid var(--primary)';
    }
  }

  // Interests
  const interestsEl = document.getElementById('about-interests-text');
  if (interestsEl && profile.interests) {
    const parts = profile.interests.split(',').map(s => s.trim()).filter(Boolean);
    interestsEl.innerHTML = 'interests: ' + parts.map(p => `<span class="text-cyan">${escHTML(p)}</span>`).join(' · ');
  }

  // Skills Grid
  const skillsGridEl = document.getElementById('about-skills-grid');
  if (skillsGridEl && profile.skills && profile.skills.length) {
    try {
      skillsGridEl.innerHTML = '';
      profile.skills.forEach(col => {
        const div = document.createElement('div');
        const h3 = document.createElement('h3');
        h3.textContent = escHTML(col.title); // safe textContent, now explicitly escaped
        h3.className = 'mb-8';
        div.appendChild(h3);
        const ul = document.createElement('ul');
        ul.style.cssText = 'list-style:none; color:var(--text-dim);';
        const items = col.items.split(',').map(s => s.trim()).filter(Boolean);
        items.forEach(item => {
          const li = document.createElement('li');
          li.innerHTML = `<span class="text-${escHTML(col.color)}">›</span> ${escHTML(item)}`;
          ul.appendChild(li);
        });
        div.appendChild(ul);
        skillsGridEl.appendChild(div);
      });
    } catch (e) { }
  }
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC LINKS — renders link sections from localStorage
   ═══════════════════════════════════════════════════════ */
async function initDynamicLinks() {
  let links = [];
  try {
    const res = await fetch(`data/links.json?t=${Date.now()}`);
    if (res.ok) links = await res.json();
  } catch (e) {
    console.error('Failed to load links.json', e);
  }

  if (!links) return;

  function renderLinkGroup(containerId, cat) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const group = links.filter(l => l.cat === cat);
    if (!group.length) return;
    el.innerHTML = '';
    group.forEach(l => {
      const a = document.createElement('a');
      a.href = l.url; // href is assigned natively, safe-ish if starts with http/https but could be javascript:
      if (a.href.toLowerCase().startsWith('javascript:')) a.href = '#'; // prevent XSS in href
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'link-item';
      a.innerHTML = `<span class="link-icon">${escHTML(l.icon)}</span> <span class="link-text">${escHTML(l.label)}</span> <span class="link-arrow">↗</span>`;
      el.appendChild(a);
    });
  }

  renderLinkGroup('links-social-grid', 'social');
  renderLinkGroup('links-friends-grid', 'friends');
  renderLinkGroup('links-cool-grid', 'cool');
}

/* ═══════════════════════════════════════════════════════
   LOADING SCREEN — matrix rain + progress bar
   ═══════════════════════════════════════════════════════ */
function initLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;

  const canvas = document.getElementById('loading-canvas');
  const ctx = canvas.getContext('2d');
  const msgs = ['LOADING KERNEL...', 'MOUNTING FS...', 'ESTABLISHING CONNECTION...', 'READY.'];
  let msgI = 0;

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const cols = Math.max(1, Math.floor(canvas.width / 16));
  const drops = Array(cols).fill(0).map(() => Math.random() * -50);
  const CHARS = '01アイウエオカキクケコサシスセソ#@$%&ABCDEFGHIJKLMNOP';

  let raf;
  function draw() {
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px monospace';
    drops.forEach((y, i) => {
      const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
      ctx.fillStyle = Math.random() > 0.92 ? '#ffffff' : '#ff3333';
      ctx.globalAlpha = 0.5 + Math.random() * 0.4;
      ctx.fillText(ch, i * 16, y * 16);
      ctx.globalAlpha = 1;
      drops[i] = y > canvas.height / 16 + 20 ? 0 : y + 1;
    });
    raf = requestAnimationFrame(draw);
  }
  draw();

  const bar = document.getElementById('loading-bar');
  const msgEl = document.getElementById('loading-msg');
  const continueBtn = document.getElementById('continue-btn');

  function dismissLoader() {
    clearInterval(tick);
    cancelAnimationFrame(raf);
    if (bar) bar.style.width = '100%';
    if (msgEl) msgEl.textContent = 'READY.';
    screen.style.transition = 'opacity 0.5s ease';
    screen.style.opacity = '0';
    setTimeout(() => { screen.style.display = 'none'; }, 550);
  }

  function showContinueButton() {
    clearInterval(tick);
    if (bar) bar.style.width = '100%';
    if (msgEl) msgEl.textContent = 'READY. WAITING FOR USER INPUT.';
    if (continueBtn) {
      continueBtn.style.display = 'block';
      continueBtn.onclick = () => {
        dismissLoader();
        const playBtn = document.getElementById('btn-play');
        if (playBtn) playBtn.click();
      };
    }
  }

  let pct = 0;
  const tick = setInterval(() => {
    pct = Math.min(100, pct + (Math.random() * 8 + 4)); // faster: 4-12% per tick
    if (bar) bar.style.width = pct + '%';
    if (msgEl) {
      const next = Math.floor((pct / 100) * (msgs.length - 1));
      if (next > msgI) { msgI = next; msgEl.textContent = msgs[msgI]; }
    }
    if (pct >= 100) showContinueButton();
  }, 30);

  // Hard cap: loader always gone within 3 seconds
  setTimeout(showContinueButton, 3000);
}

/* ═══════════════════════════════════════════════════════
   CMATRIX — detailed terminal rain for About page
   ═══════════════════════════════════════════════════════ */
function initCMatrix() {
  const canvas = document.getElementById('cmatrix-canvas');
  if (!canvas) return;
  const CHARS = '01アイウエオカキクケコ╔╗╚╝║═▒▓█#$@%&<>[]{}ABCDEFGHabcdefgh';
  let raf2;

  function start() {
    const parent = canvas.parentElement;
    canvas.width = parent.offsetWidth || 400;
    canvas.height = parent.offsetHeight || 120;
    const ctx = canvas.getContext('2d');
    const cols = Math.max(1, Math.floor(canvas.width / 10));
    const drops = Array(cols).fill(0).map(() => Math.random() * -canvas.height / 10);
    if (raf2) cancelAnimationFrame(raf2);
    function tick() {
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '10px monospace';
      drops.forEach((y, i) => {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillStyle = Math.random() > 0.88 ? '#ffffff' : (Math.random() > 0.7 ? '#ff3333' : '#ff3333');
        ctx.globalAlpha = 0.4 + Math.random() * 0.5;
        ctx.fillText(ch, i * 10, y * 10);
        ctx.globalAlpha = 1;
        drops[i] = y * 10 > canvas.height + 200 ? 0 : y + 0.7;
      });
      raf2 = requestAnimationFrame(tick);
    }
    tick();
  }

  const aboutTab = document.querySelector('[data-tab=about]');
  if (aboutTab) aboutTab.addEventListener('click', () => setTimeout(start, 50));
  if (document.getElementById('panel-about')?.classList.contains('active')) start();
}

/* ═══════════════════════════════════════════════════════
   FILE VIEWER — open files as full blog post pages
   ═══════════════════════════════════════════════════════ */
function initFileViewer() {
  window.openFile = async function (title, body, date, mdPath) {
    const viewer = document.getElementById('file-viewer');
    const titleEl = document.getElementById('file-viewer-title');
    const bodyEl = document.getElementById('file-viewer-body');
    if (!viewer || !titleEl || !bodyEl) return;
    titleEl.textContent = '📄 ' + title;
    bodyEl.innerHTML = '';

    if (mdPath) {
      try {
        bodyEl.innerHTML = '<p class="text-dim" style="font-size:12px;">loading…</p>';
        const res = await fetch(`${mdPath}?t=${Date.now()}`);
        if (res.ok) {
          const mdText = await res.text();
          const wrapper = document.createElement('div');
          wrapper.className = 'md-content';
          wrapper.innerHTML = parseMd(mdText);
          bodyEl.innerHTML = '';
          bodyEl.appendChild(wrapper);
          viewer.style.display = 'block';
          viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      } catch (e) {
        console.error('Failed to load markdown', e);
      }
      bodyEl.innerHTML = '';
    }

    const h = document.createElement('h2');
    h.textContent = title;
    h.style.cssText = 'margin-bottom:8px;font-size:16px;';
    const meta = document.createElement('p');
    meta.className = 'text-dim';
    meta.style.cssText = 'font-size:11px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:12px;';
    meta.textContent = date || '';
    bodyEl.appendChild(h);
    bodyEl.appendChild(meta);
    const paragraphs = (body || 'No content yet.').split(/\n\n+/);
    paragraphs.forEach(para => {
      const p = document.createElement('p');
      p.textContent = para.trim();
      p.style.cssText = 'font-size:13px;line-height:1.7;margin-bottom:12px;color:var(--text);';
      bodyEl.appendChild(p);
    });
    viewer.style.display = 'block';
    viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.closeFileViewer = function () {
    const viewer = document.getElementById('file-viewer');
    if (viewer) viewer.style.display = 'none';
  };
}

/* ═══════════════════════════════════════════════════════
   EASTER EGGS — secret keystroke sequences
   ═══════════════════════════════════════════════════════ */
function initEasterEggs() {
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  let konamiPos = 0;
  let wordBuf = '';
  let wordTimer = null;

  document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    if (e.code === KONAMI[konamiPos]) {
      konamiPos++;
      if (konamiPos === KONAMI.length) {
        konamiPos = 0;
        triggerGlitch();
      }
    } else {
      konamiPos = 0;
    }

    if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
      wordBuf += e.key.toLowerCase();
      clearTimeout(wordTimer);
      wordTimer = setTimeout(() => { wordBuf = ''; }, 1500);

      if (wordBuf.endsWith('hack')) { wordBuf = ''; triggerHack(); }
      if (wordBuf.endsWith('matrix')) { wordBuf = ''; triggerMatrix(); }
    }
  });

  function triggerGlitch() {
    document.body.classList.add('glitch-mode');
    setTimeout(() => document.body.classList.remove('glitch-mode'), 5000);
  }

  function triggerHack() {
    const overlay = document.createElement('div');
    overlay.className = 'hack-overlay';
    overlay.innerHTML = '<div class="hack-text">ACCESS GRANTED</div><div class="hack-sub">welcome back, operator.</div>';
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 2800);
  }

  function triggerMatrix() {
    document.body.classList.add('matrix-mode');
    setTimeout(() => document.body.classList.remove('matrix-mode'), 4000);
  }
}

/* ═══════════════════════════════════════════════════════
   DESKTOP ICONS — Win98 style floating icons top-right
   ═══════════════════════════════════════════════════════ */
function initDesktopIcons() {
  if (document.getElementById('desktop-dock')) return; // already injected

  const inGamesDir = window.location.pathname.includes('/games/');
  const prefix = inGamesDir ? '' : 'games/';

  const games = [
    { label: 'MINE', href: prefix + 'minesweeper.html', svg: `<svg viewBox="0 0 32 32" width="36" height="36" shape-rendering="crispEdges"><rect width="32" height="32" fill="transparent"/><rect x="2" y="2" width="28" height="28" fill="rgba(0,0,0,0.3)" stroke="var(--accent)" stroke-width="1.5" rx="4"/><rect x="5" y="10" width="4" height="4" fill="var(--accent2)"/><rect x="15" y="15" width="4" height="4" fill="var(--accent2)"/><rect x="20" y="20" width="4" height="4" fill="var(--accent2)"/><circle cx="13" cy="13" r="3" fill="var(--accent)" filter="drop-shadow(0 0 4px var(--accent))"/><circle cx="18" cy="18" r="3" fill="var(--accent)" filter="drop-shadow(0 0 4px var(--accent))"/></svg>` },
    { label: 'CHESS', href: prefix + 'chess.html', svg: `<svg viewBox="0 0 32 32" width="36" height="36" shape-rendering="crispEdges"><rect width="32" height="32" fill="transparent"/><rect x="2" y="2" width="28" height="28" fill="rgba(0,0,0,0.3)" stroke="var(--accent)" stroke-width="1.5" rx="4"/><path d="M 13 14 L 19 14 L 19 15 L 13 15 Z M 15 12 L 17 12 L 17 17 L 15 17 Z M 12 17 L 20 17 L 20 19 L 12 19 Z M 11 19 L 21 19 L 21 22 L 11 22 Z" fill="none" stroke="var(--accent2)" stroke-width="1.5" filter="drop-shadow(0 0 6px var(--accent2))"/><path d="M 16 11 L 16 12 M 15 11.5 L 17 11.5" stroke="var(--accent)" stroke-width="1.5"/></svg>` },
    { label: 'SNAKE', href: prefix + 'snake.html', svg: `<svg viewBox="0 0 32 32" width="36" height="36" shape-rendering="crispEdges"><rect width="32" height="32" fill="transparent"/><rect x="2" y="2" width="28" height="28" fill="rgba(0,0,0,0.3)" stroke="var(--accent)" stroke-width="1.5" rx="4"/><path d="M 6 24 L 16 24 L 16 14 L 22 14" fill="none" stroke="var(--accent2)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="drop-shadow(0 0 4px var(--accent2))"/><circle cx="23" cy="14" r="2.5" fill="var(--accent)" filter="drop-shadow(0 0 4px var(--accent))"/><circle cx="23.5" cy="13.5" r="0.5" fill="#000"/><circle cx="9" cy="9" r="2" fill="#ff3366" filter="drop-shadow(0 0 6px #ff3366)"/></svg>` },
    { label: 'TETRIS', href: prefix + 'tetris.html', svg: `<svg viewBox="0 0 32 32" width="36" height="36" shape-rendering="crispEdges"><rect width="32" height="32" fill="transparent"/><rect x="2" y="2" width="28" height="28" fill="rgba(0,0,0,0.3)" stroke="var(--accent)" stroke-width="1.5" rx="4"/><path d="M 6 6 L 6 18" fill="none" stroke="var(--accent2)" stroke-width="3" stroke-linecap="square" filter="drop-shadow(0 0 4px var(--accent2))"/><path d="M 8 18 L 12 18 L 12 14 L 16 14" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="square" stroke-linejoin="bevel" filter="drop-shadow(0 0 4px var(--accent))"/><path d="M 12 24 L 20 24 M 16 24 L 16 28" fill="none" stroke="#ff3366" stroke-width="3" stroke-linecap="square" filter="drop-shadow(0 0 4px #ff3366)"/></svg>` },
  ];

  const dock = document.createElement('div');
  dock.id = 'desktop-dock';
  dock.setAttribute('aria-label', 'Game shortcuts');
  // SVG content is static (not user data), safe to use innerHTML
  dock.innerHTML = games.map(g =>
    `<a href="${g.href}" class="desktop-icon" title="${g.label}">${g.svg}<span>${g.label}</span></a>`
  ).join('');
  document.body.appendChild(dock);
}

/* ─── Boot ───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  initLoadingScreen();
  await initDynamicProfile();   // must run before initTypewriter
  initTabs();
  initClock();
  initTypewriter();
  initCounter();
  initGlitch();
  initAnchors();
  initWindowButtons();
  initNoise();
  initAsciiScramble();
  await initDynamicPhiles();
  await initDynamicLinks();
  initCMatrix();
  initFileViewer();
  initDesktopIcons();
  initEasterEggs();
});


