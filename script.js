/* ====================================================================
   THE VINAYAK FILES — SCRIPT
   ==================================================================== */

const $ = (id) => document.getElementById(id);
const rnd = (a, b) => Math.random() * (b - a) + a;

/* ------------------------------------------------------------------
   MEDIA HELPERS — detect video vs photo by file extension,
   and decide short-clip (autoplay loop) vs long-clip (click to play)
------------------------------------------------------------------ */
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;
function isVideoSrc(src) { return VIDEO_EXT.test(src || ''); }

/* Short clips that should autoplay/muted/loop inline (≤10s sources) */
const SHORT_CLIPS = new Set([
  'videos/wa-clip.mp4',
  'videos/priyanshi2.mp4',
  'videos/v6.mp4',
  'videos/v7.mp4',
  'videos/vinayak4.mp4',
  'videos/vinayak5.mp4',
]);

/* Builds the right <img> or <video> tag for any media source.
   className applies to the media element itself. */
function mediaTag(src, alt, className) {
  if (isVideoSrc(src)) {
    if (SHORT_CLIPS.has(src)) {
      return `<video class="${className}" src="${src}" autoplay muted loop playsinline aria-label="${alt}"></video>`;
    }
    return `<video class="${className}" src="${src}" controls preload="metadata" playsinline aria-label="${alt}"></video>`;
  }
  return `<img class="${className}" src="${src}" alt="${alt}" loading="lazy">`;
}

/* For elements where clicking should open a playable lightbox version
   (used for longer videos so they're not stuck autoplaying tiny) */
function lightboxMediaTag(src, alt) {
  if (isVideoSrc(src)) {
    return `<video src="${src}" controls autoplay playsinline style="width:100%;border-radius:2px;background:#000;"></video>`;
  }
  return `<img id="lightbox-img" src="${src}" alt="${alt}">`;
}

/* ------------------------------------------------------------------
   SOUND ENGINE (Web Audio, no external files needed)
------------------------------------------------------------------ */
let audioCtx, masterGain, soundOn = false;
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.12;
  masterGain.connect(audioCtx.destination);
}
function shutterSound() {
  if (!audioCtx || !soundOn) return;
  const t = audioCtx.currentTime;
  const noise = audioCtx.createBufferSource();
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.08, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  noise.buffer = buffer;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  noise.connect(g); g.connect(masterGain);
  noise.start();
}
function clickBeep(freq = 440, dur = 0.08) {
  if (!audioCtx || !soundOn) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.05, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.connect(g); g.connect(masterGain);
  osc.start(); osc.stop(audioCtx.currentTime + dur);
}
function chime() {
  if (!audioCtx || !soundOn) return;
  [523.25, 659.25, 783.99].forEach((f, i) => setTimeout(() => clickBeep(f, 0.3), i * 90));
}

$('sound-toggle').addEventListener('click', () => {
  initAudio();
  soundOn = !soundOn;
  $('sound-toggle').textContent = soundOn ? '🔊' : '🔇';
  if (soundOn) chime();
});

function flash() {
  shutterSound();
  const fl = $('flash-overlay');
  fl.classList.remove('flash');
  void fl.offsetWidth;
  fl.classList.add('flash');
}

/* ------------------------------------------------------------------
   BOOT SEQUENCE
------------------------------------------------------------------ */
const bootPercents = [5, 18, 42, 67, 89, 100];
function runBoot() {
  const log = $('boot-log');
  const lines = VINAYAK_CONFIG.bootLines;
  let i = 0;

  function nextLine() {
    if (i >= lines.length) {
      setTimeout(showDossier, 500);
      return;
    }
    const div = document.createElement('div');
    div.className = 'boot-line';
    const pct = bootPercents[Math.min(i, bootPercents.length - 1)];
    div.innerHTML = `${lines[i]} <span class="pct">${pct}%</span>`;
    log.appendChild(div);
    clickBeep(220 + i * 20, 0.05);
    i++;
    setTimeout(nextLine, 420);
  }
  nextLine();
}

function showDossier() {
  $('boot-screen').classList.add('hidden-stage');
  $('dossier-reveal').classList.remove('hidden-stage');
}

$('boot-skip').addEventListener('click', showDossier);

$('enter-btn').addEventListener('click', () => {
  initAudio();
  chime();
  $('dossier-reveal').classList.add('hidden-stage');
  $('main-site').classList.remove('hidden-stage');
  document.body.style.overflow = 'auto';
  buildEverything();
});

$('replay-btn').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* Kick off boot once page loads */
window.addEventListener('load', () => {
  document.body.style.overflow = 'hidden';
  setTimeout(runBoot, 600);
});

/* ------------------------------------------------------------------
   PROGRESS BAR
------------------------------------------------------------------ */
window.addEventListener('scroll', () => {
  const main = $('main-site');
  if (main.classList.contains('hidden-stage')) return;
  const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  $('case-progress-fill').style.width = pct + '%';
});

/* ------------------------------------------------------------------
   LIGHTBOX
------------------------------------------------------------------ */
function openLightbox(src, caption, story) {
  flash();
  const wrap = document.querySelector('.lightbox-photo-wrap');
  wrap.innerHTML = lightboxMediaTag(src, caption || '');
  $('lightbox-caption').textContent = caption || '';
  $('lightbox-story').textContent = story || '';
  $('lightbox').classList.add('visible');
}
$('lightbox-close').addEventListener('click', () => {
  $('lightbox').classList.remove('visible');
  const v = document.querySelector('.lightbox-photo-wrap video');
  if (v) v.pause();
});
$('lightbox').addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') {
    $('lightbox').classList.remove('visible');
    const v = document.querySelector('.lightbox-photo-wrap video');
    if (v) v.pause();
  }
});

/* ------------------------------------------------------------------
   BUILD EVERYTHING (called once after ENTER)
------------------------------------------------------------------ */
function buildEverything() {
  buildPhotoWall();
  buildTimeline();
  buildWrapped();
  buildEvidence();
  buildReel();
  buildStatCards();
  buildReviews();
  buildVault();
  buildYearbook();
  buildRoast();
  buildFinal();
  setupScrollReveals();
}

/* ---------------- SECTION 1: PHOTO WALL ---------------- */
function buildPhotoWall() {
  const wall = $('photo-wall');
  const pinColors = ['#B33A2E', '#3E5E4E', '#D4BE52', '#5C4A8C'];
  VINAYAK_CONFIG.photoWall.forEach((p, i) => {
    const rot = rnd(-8, 8);
    const card = document.createElement('div');
    card.className = 'polaroid';
    if (p.type === 'video') card.classList.add('polaroid-video');
    card.style.setProperty('--rot', rot + 'deg');
    const usesTape = i % 3 === 0;
    card.innerHTML = `
      ${usesTape ? '<div class="tape-strip" style="left:50%;transform:translateX(-50%) rotate(' + rnd(-6,6) + 'deg);"></div>' : '<div class="pin" style="background:' + pinColors[i % pinColors.length] + '"></div>'}
      ${mediaTag(p.src, p.caption, '')}
      <div class="polaroid-cap">${p.caption}</div>
    `;
    card.addEventListener('click', () => openLightbox(p.src, p.caption, ''));
    wall.appendChild(card);
  });
}

/* ---------------- SECTION 2: TIMELINE ---------------- */
function buildTimeline() {
  const track = $('timeline-track');
  VINAYAK_CONFIG.timeline.forEach((t) => {
    const node = document.createElement('div');
    node.className = 'timeline-node';
    node.innerHTML = `
      <img src="${t.photo}" alt="${t.title}" loading="lazy">
      <div class="timeline-node-body">
        <div class="timeline-date">${t.date}</div>
        <div class="timeline-title">${t.title}</div>
      </div>
    `;
    node.addEventListener('click', () => openLightbox(t.photo, t.title, t.story));
    track.appendChild(node);
  });

  // drag-to-scroll
  let isDown = false, startX, scrollLeft;
  track.addEventListener('mousedown', (e) => {
    isDown = true; track.style.cursor = 'grabbing';
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });
  ['mouseleave', 'mouseup'].forEach(ev => track.addEventListener(ev, () => { isDown = false; track.style.cursor = 'grab'; }));
  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.5;
  });
}

/* ---------------- SECTION 3: WRAPPED ---------------- */
function buildWrapped() {
  const grid = $('wrapped-grid');
  VINAYAK_CONFIG.wrapped.forEach((w) => {
    const card = document.createElement('div');
    card.className = 'wrapped-card';
    card.innerHTML = `
      <div class="wrapped-icon">${w.icon}</div>
      <div class="wrapped-label">${w.label}</div>
      <div class="wrapped-value" data-numeric="${w.numeric}" data-target="${w.numeric ? w.value : ''}" data-suffix="${w.suffix || ''}">
        ${w.numeric ? '0' + (w.suffix || '') : w.value}
      </div>
    `;
    grid.appendChild(card);
  });
}

function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  if (isNaN(target)) return;
  let cur = 0;
  const step = Math.max(1, target / 40);
  function tick() {
    cur += step;
    if (cur >= target) { el.textContent = target + suffix; return; }
    el.textContent = Math.floor(cur) + suffix;
    requestAnimationFrame(tick);
  }
  tick();
}

/* ---------------- SECTION 4: EVIDENCE ROOM ---------------- */
function buildEvidence() {
  const pinsWrap = $('evidence-pins');
  const svg = $('string-svg');
  const positions = [
    { top: '4%', left: '6%' },
    { top: '8%', left: '58%' },
    { top: '42%', left: '32%' },
    { top: '46%', left: '74%' },
    { top: '76%', left: '12%' },
  ];
  const centers = [];

  VINAYAK_CONFIG.evidence.forEach((ev, i) => {
    const pos = positions[i % positions.length];
    const card = document.createElement('div');
    card.className = 'evidence-card';
    card.style.top = pos.top;
    card.style.left = pos.left;
    card.style.transform = `rotate(${rnd(-5, 5)}deg)`;
    card.innerHTML = `
      <div class="evidence-pin-dot"></div>
      ${mediaTag(ev.photo, ev.title, '')}
      <div class="evidence-label">${ev.label}</div>
      <div class="evidence-title">${ev.title}</div>
    `;
    card.addEventListener('click', () => openLightbox(ev.photo, ev.title, ev.note));
    pinsWrap.appendChild(card);
  });

  function drawStrings() {
    const boardRect = $('evidence-board').getBoundingClientRect();
    const cards = pinsWrap.querySelectorAll('.evidence-card');
    centers.length = 0;
    cards.forEach((c) => {
      const r = c.getBoundingClientRect();
      centers.push({
        x: r.left - boardRect.left + r.width / 2,
        y: r.top - boardRect.top + 8,
      });
    });
    svg.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);
    let svgHTML = '';
    for (let i = 0; i < centers.length - 1; i++) {
      const a = centers[i], b = centers[i + 1];
      svgHTML += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#B33A2E" stroke-width="2" stroke-opacity="0.65" />`;
    }
    if (centers.length > 2) {
      const a = centers[0], b = centers[centers.length - 1];
      svgHTML += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#B33A2E" stroke-width="2" stroke-opacity="0.4" stroke-dasharray="6 6" />`;
    }
    svg.innerHTML = svgHTML;
  }

  if (window.innerWidth > 720) {
    window.addEventListener('resize', drawStrings);
    setTimeout(drawStrings, 200);
    window.addEventListener('scroll', () => requestAnimationFrame(drawStrings));
  }
}

/* ---------------- SECTION 5: MEMORY REEL ---------------- */
function buildReel() {
  const reel = $('film-reel');
  const track = document.createElement('div');
  track.className = 'film-track';
  const frames = [...VINAYAK_CONFIG.reel, ...VINAYAK_CONFIG.reel]; // duplicate for seamless loop
  frames.forEach((f) => {
    const frame = document.createElement('div');
    frame.className = 'film-frame';
    frame.innerHTML = mediaTag(f.src, f.caption, '');
    frame.addEventListener('click', () => openLightbox(f.src, f.caption, f.story));
    track.appendChild(frame);
  });
  reel.appendChild(track);
}

/* ---------------- SECTION 6: STAT FLIP CARDS ---------------- */
function buildStatCards() {
  const grid = $('stat-cards');
  VINAYAK_CONFIG.statCards.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'flip-card';
    card.innerHTML = `
      <div class="flip-inner">
        <div class="flip-face flip-front">
          ${mediaTag(c.photo, c.stat, '')}
          <div class="flip-front-label">${c.stat}</div>
        </div>
        <div class="flip-face flip-back">
          <div>
            <div class="flip-stat-value">+${c.value}</div>
            <div class="flip-stat-name">${c.stat.toUpperCase()}</div>
            <div class="flip-blurb">${c.blurb}</div>
          </div>
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
      clickBeep(card.classList.contains('flipped') ? 600 : 400, 0.1);
    });
    grid.appendChild(card);
  });
}

/* ---------------- SECTION 7: REVIEWS ---------------- */
function buildReviews() {
  const track = $('reviews-track');
  VINAYAK_CONFIG.reviews.forEach((r) => {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.style.setProperty('--rot', rnd(-2, 2) + 'deg');
    card.innerHTML = `
      <div class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
      <div class="review-text">"${r.text}"</div>
      <div class="review-author">${r.author}</div>
    `;
    track.appendChild(card);
  });
}

/* ---------------- SECTION 8: VAULT ---------------- */
function buildVault() {
  let clicks = 0;
  const door = $('vault-door');
  const dial = $('vault-dial-center');
  const contents = $('vault-contents');

  door.addEventListener('click', () => {
    clicks++;
    clickBeep(300 + clicks * 80, 0.12);
    dial.style.transform = `rotate(${clicks * 120}deg)`;
    door.querySelector('.vault-instruction')?.remove();
    if (clicks === 1) showVaultHint('1 of 3...');
    if (clicks === 2) showVaultHint('2 of 3... almost there');
    if (clicks >= 3) {
      door.classList.add('cracked');
      chime();
      revealVaultContents(contents);
    }
  });

  function showVaultHint(msg) {
    let hint = door.querySelector('.vault-instruction');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'vault-instruction';
      door.appendChild(hint);
    }
    hint.textContent = msg;
  }
}

function revealVaultContents(contents) {
  contents.classList.add('visible');
  VINAYAK_CONFIG.insideJokes.forEach((joke, i) => {
    const note = document.createElement('div');
    note.className = 'joke-note';
    note.style.setProperty('--rot', rnd(-4, 4) + 'deg');
    note.style.animationDelay = (i * 0.15) + 's';
    note.textContent = joke;
    contents.appendChild(note);
  });
}

/* ---------------- SECTION 9: YEARBOOK ---------------- */
function buildYearbook() {
  const page = $('yearbook-page');
  let html = '';
  VINAYAK_CONFIG.yearbook.forEach((y) => {
    html += `<div class="yb-row"><div class="yb-label">${y.label}</div><div class="yb-value">${y.value}</div></div>`;
  });
  html += '<div class="yb-signatures">';
  VINAYAK_CONFIG.yearbookSignatures.forEach((s) => {
    html += `<div class="yb-sig" style="--rot:${rnd(-6, 6)}deg">${s}</div>`;
  });
  html += '</div>';
  page.innerHTML = html;
}

/* ---------------- SECTION 10: ROAST ---------------- */
function buildRoast() {
  const list = $('roast-list');
  VINAYAK_CONFIG.roast.forEach((line) => {
    const item = document.createElement('div');
    item.className = 'roast-item';
    item.textContent = line;
    list.appendChild(item);
  });
}

/* ---------------- FINAL SECTION ---------------- */
function buildFinal() {
  const wrap = $('final-photos');
  const positions = [
    { top: '10%', left: '8%' }, { top: '15%', left: '78%' },
    { top: '55%', left: '4%' }, { top: '65%', left: '85%' },
    { top: '80%', left: '20%' }, { top: '78%', left: '65%' },
  ];
  VINAYAK_CONFIG.finalPhotos.forEach((src, i) => {
    const pos = positions[i % positions.length];
    const img = document.createElement('img');
    img.src = src;
    img.className = 'final-photo';
    img.style.top = pos.top;
    img.style.left = pos.left;
    img.style.transform = `rotate(${rnd(-10, 10)}deg)`;
    wrap.appendChild(img);
  });

  if (VINAYAK_CONFIG.finalVideo) {
    const videoWrap = $('final-evidence-video');
    videoWrap.innerHTML = `<video src="${VINAYAK_CONFIG.finalVideo}" controls playsinline preload="metadata"></video>`;
  }
}

/* ------------------------------------------------------------------
   SCROLL REVEAL OBSERVER
------------------------------------------------------------------ */
function setupScrollReveals() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');

      if (e.target.id === 'sect-wrapped') {
        document.querySelectorAll('.wrapped-card').forEach((card, i) => {
          setTimeout(() => {
            card.classList.add('visible');
            const valEl = card.querySelector('.wrapped-value');
            if (valEl.dataset.numeric === 'true') animateCounter(valEl);
          }, i * 90);
        });
      }
      if (e.target.id === 'sect-roast') {
        document.querySelectorAll('.roast-item').forEach((item, i) => {
          setTimeout(() => item.classList.add('visible'), i * 150);
        });
      }
      if (e.target.id === 'sect-final') {
        document.querySelectorAll('.final-photo').forEach((p, i) => {
          setTimeout(() => p.classList.add('visible'), i * 200);
        });
        setTimeout(() => $('final-evidence').classList.add('visible'), 400);
        document.querySelectorAll('#final-message p').forEach((p, i) => {
          setTimeout(() => p.classList.add('visible'), 1800 + i * 500);
        });
      }
    });
  }, { threshold: 0.2 });

  ['#sect-wrapped', '#sect-roast', '#sect-final'].forEach((sel) => obs.observe(document.querySelector(sel)));

  // Generic polaroid / evidence fade-in for elements added dynamically
  const obs2 = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.polaroid').forEach((el, i) => {
    el.style.transitionDelay = (i % 10) * 0.04 + 's';
    obs2.observe(el);
  });
}

/* ------------------------------------------------------------------
   EASTER EGGS
------------------------------------------------------------------ */
// Konami code → confetti burst
const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
let kPos = 0;
document.addEventListener('keydown', (e) => {
  if (e.keyCode === konami[kPos]) {
    kPos++;
    if (kPos === konami.length) { kPos = 0; easterConfetti(); }
  } else kPos = 0;
});

function easterConfetti() {
  const colors = ['#B33A2E', '#3E5E4E', '#E8D77A', '#fff'];
  for (let i = 0; i < 80; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.style.position = 'fixed';
      el.style.top = '-10px';
      el.style.left = rnd(0, 100) + 'vw';
      el.style.width = rnd(6, 12) + 'px';
      el.style.height = el.style.width;
      el.style.background = colors[Math.floor(rnd(0, colors.length))];
      el.style.zIndex = 9999;
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      el.style.transition = `transform ${rnd(2, 4)}s linear, opacity ${rnd(2, 4)}s linear`;
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = `translateY(${window.innerHeight + 50}px) rotate(${rnd(180, 720)}deg)`;
        el.style.opacity = '0';
      });
      setTimeout(() => el.remove(), 4200);
    }, i * 15);
  }
  chime();
}
