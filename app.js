const state = {
  mode: "music",
  source: "local",
  library: {
    music: { local: [], online: [] },
    video: { local: [], online: [] }
  },
  queue: {
    music: { local: [], online: [] },
    video: { local: [], online: [] }
  },
  index: {
    music: { local: -1, online: -1 },
    video: { local: -1, online: -1 }
  },
  shuffle: false,
  repeat: false,
  autoplay: true,
  current: null,
  ytReady: false,
  ytPlayer: null,
  isPlaying: false,
  youtubeApiKey: "",
  pendingYouTubeItem: null,
  visualizer: {
    ctx: null,
    audioCtx: null,
    analyser: null,
    sourceNode: null,
    freqData: null,
    particles: [],
    lastTime: 0
  },
  selectedMood: "Energia",
  discoverRequestId: 0,
  discoverCache: {
    music: { online: [], local: [] },
    video: { online: [], local: [] }
  }
};

const moods = ["Energia", "Relax", "Concentracion", "Fiesta", "Triste", "Romantica"];
const moodQueries = {
  Energia: "workout music mix",
  Relax: "chill lofi mix",
  Concentracion: "focus instrumental music",
  Fiesta: "party hits 2026",
  Triste: "sad songs playlist",
  Romantica: "romantic songs playlist"
};

const invidiousInstances = [
  "https://invidious.fdn.fr",
  "https://invidious.privacyredirect.com",
  "https://invidious.projectsegfau.lt"
];

const appConfig = window.DUO_CONFIG || {};

function hasLocalApi() {
  return location.protocol === "http:" || location.protocol === "https:";
}

function isGitHubPagesHost() {
  return /github\.io$/i.test(location.hostname);
}

function loadApiKey() {
  try {
    return localStorage.getItem("duo.youtubeApiKey") || "";
  } catch (_) {
    return "";
  }
}

function saveApiKey(value) {
  try {
    localStorage.setItem("duo.youtubeApiKey", value);
  } catch (_) {
    // Ignore storage failures.
  }
}

function isConfigMode() {
  return new URLSearchParams(location.search).get("config") === "1";
}

const refs = {
  modeMusic: document.getElementById("modeMusic"),
  modeVideo: document.getElementById("modeVideo"),
  sourceLocal: document.getElementById("sourceLocal"),
  sourceOnline: document.getElementById("sourceOnline"),
  onlineSearchRow: document.getElementById("onlineSearchRow"),
  localSearchRow: document.getElementById("localSearchRow"),
  onlineQuery: document.getElementById("onlineQuery"),
  ytApiKeyInput: document.getElementById("ytApiKeyInput"),
  saveApiKeyBtn: document.getElementById("saveApiKeyBtn"),
  clearApiKeyBtn: document.getElementById("clearApiKeyBtn"),
  onlineHint: document.getElementById("onlineHint"),
  localQuery: document.getElementById("localQuery"),
  onlineSearchBtn: document.getElementById("onlineSearchBtn"),
  onlineApiRow: document.getElementById("onlineApiRow"),
  discoverSection: document.getElementById("discoverSection"),
  discoverList: document.getElementById("discoverList"),
  moodChips: document.getElementById("moodChips"),
  resultsSection: document.getElementById("resultsSection"),
  localPicker: document.getElementById("localPicker"),
  nowPlayingSection: document.getElementById("nowPlayingSection"),
  libraryList: document.getElementById("libraryList"),
  queueList: document.getElementById("queueList"),
  htmlPlayer: document.getElementById("htmlPlayer"),
  videoFrameWrap: document.getElementById("videoFrameWrap"),
  musicArt: document.getElementById("musicArt"),
  nowArt: document.getElementById("nowArt"),
  visualizerCanvas: document.getElementById("visualizerCanvas"),
  artPulse: document.getElementById("artPulse"),
  miniPlayer: document.getElementById("miniPlayer"),
  miniArt: document.getElementById("miniArt"),
  miniTitle: document.getElementById("miniTitle"),
  miniSub: document.getElementById("miniSub"),
  miniOpenArea: document.getElementById("miniOpenArea"),
  miniPrev: document.getElementById("miniPrev"),
  miniPlayPause: document.getElementById("miniPlayPause"),
  miniNext: document.getElementById("miniNext"),
  closePlayerBtn: document.getElementById("closePlayerBtn"),
  nowTitle: document.getElementById("nowTitle"),
  nowSubtitle: document.getElementById("nowSubtitle"),
  prevBtn: document.getElementById("prevBtn"),
  backBtn: document.getElementById("backBtn"),
  playBtn: document.getElementById("playBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  fwdBtn: document.getElementById("fwdBtn"),
  nextBtn: document.getElementById("nextBtn"),
  seekBar: document.getElementById("seekBar"),
  currentTime: document.getElementById("currentTime"),
  durationTime: document.getElementById("durationTime"),
  volumeBar: document.getElementById("volumeBar"),
  speedSelect: document.getElementById("speedSelect"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  repeatBtn: document.getElementById("repeatBtn"),
  autoplayBtn: document.getElementById("autoplayBtn")
};

function nowQueue() {
  return state.queue[state.mode][state.source];
}

function nowLibrary() {
  return state.library[state.mode][state.source];
}

function nowIndex() {
  return state.index[state.mode][state.source];
}

function setNowIndex(value) {
  state.index[state.mode][state.source] = value;
}

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const hours = Math.floor(sec / 3600);
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  if (hours > 0) {
    const minPart = Math.floor((sec % 3600) / 60);
    return String(hours).padStart(2, "0") + ":" + String(minPart).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }
  return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

function parseIsoDurationToSeconds(iso) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(String(iso || ""));
  if (!match) return 0;
  const h = Number(match[1] || 0);
  const m = Number(match[2] || 0);
  const s = Number(match[3] || 0);
  return h * 3600 + m * 60 + s;
}

function updateOnlineHint(message) {
  refs.onlineHint.hidden = false;
  refs.onlineHint.textContent = message;
}

function updateOnlineHintByContext() {
  if (state.source !== "online") {
    refs.onlineHint.hidden = true;
    return;
  }

  if (state.youtubeApiKey) {
    updateOnlineHint("Modo online listo.");
    return;
  }

  if (isGitHubPagesHost()) {
    updateOnlineHint("Modo online activo con fallback automatico.");
    return;
  }

  updateOnlineHint("Modo online con fallback automatico.");
}

function setMode(mode) {
  state.mode = mode;
  refs.modeMusic.classList.toggle("is-active", mode === "music");
  refs.modeVideo.classList.toggle("is-active", mode === "video");
  updateMediaSurface();
  loadDiscovery();
  renderAll();
}

function setSource(source) {
  state.source = source;
  refs.sourceLocal.classList.toggle("is-active", source === "local");
  refs.sourceOnline.classList.toggle("is-active", source === "online");
  refs.onlineSearchRow.hidden = source !== "online";
  if (refs.onlineApiRow) {
    const showConfigRow = source === "online" && isConfigMode();
    refs.onlineApiRow.hidden = !showConfigRow;
    refs.onlineApiRow.style.display = showConfigRow ? "flex" : "none";
  }
  refs.localSearchRow.hidden = source !== "local";
  updateOnlineHintByContext();
  updateMediaSurface();
  loadDiscovery();
  renderAll();
}

function updateMediaSurface() {
  const isVideoMode = state.mode === "video";
  const active = state.current;
  const online = state.source === "online";
  refs.videoFrameWrap.classList.remove("audio-host");
  refs.videoFrameWrap.hidden = !isVideoMode;
  refs.musicArt.hidden = isVideoMode;

  if (!active) {
    refs.htmlPlayer.style.display = "none";
    return;
  }

  if (active.kind === "local") {
    refs.htmlPlayer.style.display = "block";
  } else if (online && isVideoMode) {
    refs.htmlPlayer.style.display = "none";
  } else if (active.kind === "youtube" && state.mode === "music") {
    // Keep YouTube iframe mounted for reliable audio playback in music mode.
    refs.videoFrameWrap.hidden = false;
    refs.videoFrameWrap.classList.add("audio-host");
    refs.htmlPlayer.style.display = "none";
  }
}

function renderLibrary(items = null) {
  const list = items || nowLibrary();
  refs.libraryList.innerHTML = "";

  if (!list.length) {
    const li = document.createElement("li");
    li.className = "track-item";
    li.textContent = state.source === "local"
      ? "No hay archivos cargados en esta categoria."
      : "Sin resultados. Usa la busqueda online.";
    refs.libraryList.appendChild(li);
    return;
  }

  list.forEach((item) => {
    const li = document.createElement("li");
    li.className = "track-item";
    const thumb = item.thumbnail
      ? `<img class="thumb" src="${escapeHtml(item.thumbnail)}" alt="portada" loading="lazy" />`
      : `<div class="thumb placeholder">${state.mode === "music" ? "MUS" : "VID"}</div>`;
    li.innerHTML = `
      <div class="track-head">
        ${thumb}
        <div>
          <div class="title">${escapeHtml(item.title)}</div>
          <div class="sub">${escapeHtml(item.subtitle || "")}</div>
        </div>
      </div>
      <div class="actions">
        <button class="ghost" data-action="play" data-id="${item.id}" aria-label="Reproducir" title="Reproducir">▶</button>
        <button class="ghost" data-action="add" data-id="${item.id}" aria-label="Agregar a cola" title="Agregar a cola">＋</button>
      </div>
    `;
    refs.libraryList.appendChild(li);
  });
}

function renderQueue() {
  const queue = nowQueue();
  const idx = nowIndex();
  refs.queueList.innerHTML = "";

  if (!queue.length) {
    const li = document.createElement("li");
    li.className = "track-item";
    li.textContent = "Cola vacia.";
    refs.queueList.appendChild(li);
    return;
  }

  queue.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "track-item";
    if (i === idx) {
      li.style.border = "2px solid #0f4c5c";
    }
    const thumb = item.thumbnail
      ? `<img class="thumb" src="${escapeHtml(item.thumbnail)}" alt="portada" loading="lazy" />`
      : `<div class="thumb placeholder">${state.mode === "music" ? "MUS" : "VID"}</div>`;
    li.innerHTML = `
      <div class="track-head">
        ${thumb}
        <div>
          <div class="title">${escapeHtml(item.title)}</div>
          <div class="sub">${escapeHtml(item.subtitle || "")}</div>
        </div>
      </div>
      <div class="actions">
        <button class="ghost" data-action="jump" data-pos="${i}" aria-label="Ir a esta pista" title="Ir">⏵</button>
        <button class="ghost" data-action="remove" data-pos="${i}" aria-label="Quitar" title="Quitar">✕</button>
      </div>
    `;
    refs.queueList.appendChild(li);
  });
}

function renderAll() {
  renderLibrary();
  renderQueue();
}

function setResultsVisible(visible) {
  if (!refs.resultsSection) return;
  refs.resultsSection.hidden = !visible;
}

function setPlayerOpen(open) {
  if (!refs.nowPlayingSection) return;
  refs.nowPlayingSection.hidden = !open;
}

function isPlayerOpen() {
  return Boolean(refs.nowPlayingSection && !refs.nowPlayingSection.hidden);
}

function renderMoodChips() {
  if (!refs.moodChips) return;
  refs.moodChips.innerHTML = "";
  moods.forEach((mood) => {
    const btn = document.createElement("button");
    btn.className = "mood-chip" + (mood === state.selectedMood ? " is-active" : "");
    btn.textContent = mood;
    btn.addEventListener("click", () => {
      state.selectedMood = mood;
      renderMoodChips();
      loadDiscovery();
    });
    refs.moodChips.appendChild(btn);
  });
}

function renderDiscovery(items) {
  if (!refs.discoverList) return;
  refs.discoverList.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("li");
    empty.className = "track-item";
    empty.textContent = "Sin sugerencias por ahora.";
    refs.discoverList.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "discover-card";
    li.innerHTML = `
      <img src="${escapeHtml(item.thumbnail || "icon-192.svg")}" alt="Portada" loading="lazy" />
      <div class="meta">
        <div class="title">${escapeHtml(item.title)}</div>
        <div class="sub">${escapeHtml(item.subtitle || "")}</div>
      </div>
    `;
    li.addEventListener("click", () => {
      state.library[state.mode][state.source] = items;
      renderLibrary(items);
      startSmartPlayback(item, items);
    });
    refs.discoverList.appendChild(li);
  });
}

async function loadDiscovery() {
  if (!refs.discoverSection) return;

  const requestId = ++state.discoverRequestId;

  if (state.source === "local") {
    const local = state.library[state.mode].local;
    const localSlice = local.slice(0, 18);
    state.discoverCache[state.mode].local = localSlice;
    if (requestId !== state.discoverRequestId) return;
    renderDiscovery(localSlice);
    return;
  }

  const query = moodQueries[state.selectedMood] || "top music";
  try {
    const results = await fetchYouTubeResults(query);
    if (requestId !== state.discoverRequestId) return;
    const sliced = results.slice(0, 18);
    if (sliced.length) {
      state.discoverCache[state.mode].online = sliced;
      renderDiscovery(sliced);
      return;
    }
    renderDiscovery(state.discoverCache[state.mode].online || []);
  } catch (_) {
    if (requestId !== state.discoverRequestId) return;
    renderDiscovery(state.discoverCache[state.mode].online || []);
  }
}

function keywordsFromTitle(text) {
  const stop = new Set(["official", "video", "lyrics", "audio", "ft", "feat", "the", "and", "mix"]);
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((x) => x.length > 2 && !stop.has(x));
}

function similarityScore(a, b) {
  const sa = new Set(keywordsFromTitle(a.title));
  const sb = new Set(keywordsFromTitle(b.title));
  let overlap = 0;
  sa.forEach((k) => {
    if (sb.has(k)) overlap += 1;
  });
  return overlap;
}

function buildSmartQueue(seed, candidates) {
  const filtered = candidates.filter((x) => x.id !== seed.id);
  filtered.sort((a, b) => similarityScore(seed, b) - similarityScore(seed, a));
  return [seed, ...filtered.slice(0, 24)];
}

async function startSmartPlayback(item, sourceItems = null) {
  const base = sourceItems || nowLibrary();
  const queue = buildSmartQueue(item, base);
  state.queue[state.mode][state.source] = queue;
  setNowIndex(0);
  renderQueue();
  playItem(item, 0);

  if (item.kind === "youtube") {
    const rec = await fetchRecommendations(item.youtubeId);
    if (rec.length) {
      const existing = new Set(nowQueue().map((x) => x.id));
      rec.forEach((r) => {
        if (!existing.has(r.id)) nowQueue().push(r);
      });
      renderQueue();
    }
  }
}

function ensureVisualizerSize() {
  const canvas = refs.visualizerCanvas;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const targetW = Math.floor(rect.width * dpr);
  const targetH = Math.floor(rect.height * dpr);
  if (canvas.width === targetW && canvas.height === targetH) return;
  canvas.width = targetW;
  canvas.height = targetH;
}

function initAudioVisualizer() {
  if (!refs.visualizerCanvas) return;
  state.visualizer.ctx = refs.visualizerCanvas.getContext("2d", { alpha: true });
  ensureVisualizerSize();
  window.addEventListener("resize", ensureVisualizerSize);
}

function connectLocalAudioAnalyser() {
  if (state.visualizer.sourceNode || !window.AudioContext) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const audioCtx = new AC();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.84;
  const source = audioCtx.createMediaElementSource(refs.htmlPlayer);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  state.visualizer.audioCtx = audioCtx;
  state.visualizer.analyser = analyser;
  state.visualizer.sourceNode = source;
  state.visualizer.freqData = new Uint8Array(analyser.frequencyBinCount);
}

function spawnVisualizerParticle(energy, width, height, rgb) {
  if (energy < 0.15 || Math.random() > 0.34) return;
  const y = height * (0.25 + Math.random() * 0.55);
  state.visualizer.particles.push({
    x: width * 0.5,
    y,
    vx: (Math.random() - 0.5) * 1.6,
    vy: -0.5 - energy * 2.8,
    life: 1,
    size: 1.2 + Math.random() * 2.6,
    rgb
  });
  if (state.visualizer.particles.length > 220) {
    state.visualizer.particles.splice(0, state.visualizer.particles.length - 220);
  }
}

function drawVisualizerFrame() {
  const ctx = state.visualizer.ctx;
  const canvas = refs.visualizerCanvas;
  if (!ctx || !canvas || state.mode !== "music") return;

  ensureVisualizerSize();
  const width = canvas.width;
  const height = canvas.height;
  if (!width || !height) return;

  ctx.clearRect(0, 0, width, height);

  const aura = getComputedStyle(document.documentElement).getPropertyValue("--aura-rgb").trim() || "123,224,255";
  const rgb = aura.split(",").map((x) => Number(x.trim()) || 120);

  let energy = 0.08;
  let spectrum = null;
  if (state.current?.kind === "local" && state.visualizer.analyser && state.visualizer.freqData) {
    if (state.visualizer.audioCtx && state.visualizer.audioCtx.state === "suspended") {
      state.visualizer.audioCtx.resume().catch(() => null);
    }
    state.visualizer.analyser.getByteFrequencyData(state.visualizer.freqData);
    spectrum = state.visualizer.freqData;
    let sum = 0;
    for (let i = 0; i < spectrum.length; i += 1) sum += spectrum[i];
    energy = Math.min(1, (sum / spectrum.length) / 180);
  } else if (state.current?.kind === "youtube" && state.isPlaying) {
    const t = performance.now() * 0.001;
    energy = 0.2 + Math.abs(Math.sin(t * 1.8)) * 0.35 + Math.random() * 0.12;
  }

  const lineY = height * 0.68;
  const bars = 72;
  const gap = width / bars;

  ctx.beginPath();
  for (let i = 0; i <= bars; i += 1) {
    const x = i * gap;
    const waveY = lineY - Math.sin((i * 0.34) + performance.now() * 0.004) * (8 + energy * 26);
    if (i === 0) {
      ctx.moveTo(x, waveY);
    } else {
      ctx.lineTo(x, waveY);
    }
  }
  ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.22 + energy * 0.4})`;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  for (let i = 0; i < bars; i += 1) {
    const x = i * gap + gap * 0.5;
    const bin = spectrum ? spectrum[Math.floor((i / bars) * spectrum.length)] / 255 : Math.random() * energy;
    const mag = spectrum ? bin : Math.max(0.06, bin);
    const barH = (height * 0.34) * (0.18 + mag);
    const alpha = 0.25 + mag * 0.6;
    ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    ctx.lineWidth = Math.max(1.2, gap * 0.55);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, lineY + barH * 0.08);
    ctx.lineTo(x, lineY - barH);
    ctx.stroke();
  }

  spawnVisualizerParticle(energy, width, height, rgb);
  spawnVisualizerParticle(energy * 0.75, width, height, rgb);
  for (let i = state.visualizer.particles.length - 1; i >= 0; i -= 1) {
    const p = state.visualizer.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy -= 0.004;
    p.life -= 0.012;
    if (p.life <= 0) {
      state.visualizer.particles.splice(i, 1);
      continue;
    }
    ctx.fillStyle = `rgba(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]}, ${0.55 * p.life})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(width * 0.5, height * 0.62, 6, width * 0.5, height * 0.62, width * 0.5);
  glow.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.2 + energy * 0.35})`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function findInLibraryById(id) {
  return nowLibrary().find((x) => x.id === id) || null;
}

function enqueue(item) {
  nowQueue().push(item);
  renderQueue();
}

function playItem(item, queuePosition = null) {
  if (!item) return;

  state.current = item;
  state.isPlaying = true;

  if (queuePosition == null) {
    const index = nowQueue().findIndex((x) => x.id === item.id);
    setNowIndex(index);
  } else {
    setNowIndex(queuePosition);
  }

  refs.nowTitle.textContent = item.title;
  refs.nowSubtitle.textContent = item.subtitle || "";
  updateArtworkUi(item);
  updateMiniPlayer(item);
  applyDynamicTheme(item);

  if (item.kind === "local") {
    playLocal(item);
  } else {
    playYouTube(item);
  }

  updateMediaSurface();
  updateMediaSession();
  renderQueue();
}

function updateMiniPlayer(item) {
  if (!refs.miniPlayer || !item) return;
  refs.miniPlayer.hidden = false;
  refs.miniTitle.textContent = item.title || "Sin reproduccion";
  refs.miniSub.textContent = item.subtitle || "";
  refs.miniArt.src = item.thumbnail || "icon-192.svg";
  refs.miniPlayPause.textContent = state.isPlaying ? "⏸" : "▶";
}

function updateArtworkUi(item) {
  if (item.thumbnail) {
    refs.nowArt.src = item.thumbnail;
    refs.nowArt.hidden = false;
    refs.artPulse.hidden = true;
    return;
  }

  refs.nowArt.hidden = true;
  refs.artPulse.hidden = false;
}

function applyDynamicTheme(item) {
  const fallback = state.mode === "music" ? "123,224,255" : "255,109,65";
  if (!item.thumbnail) {
    document.documentElement.style.setProperty("--aura-rgb", fallback);
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.referrerPolicy = "no-referrer";
  img.onload = () => {
    const sampled = sampleImageColor(img);
    document.documentElement.style.setProperty("--aura-rgb", sampled || fallback);
  };
  img.onerror = () => {
    document.documentElement.style.setProperty("--aura-rgb", fallback);
  };
  img.src = item.thumbnail;
}

function sampleImageColor(img) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const w = 32;
  const h = 32;
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const rr = data[i];
    const gg = data[i + 1];
    const bb = data[i + 2];
    const alpha = data[i + 3];
    if (alpha < 120) continue;

    const bright = (rr + gg + bb) / 3;
    if (bright < 24 || bright > 238) continue;

    r += rr;
    g += gg;
    b += bb;
    count += 1;
  }

  if (!count) return null;
  return `${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)}`;
}

function playLocal(item) {
  if (!item.url) return;

  connectLocalAudioAnalyser();

  refs.htmlPlayer.pause();
  refs.htmlPlayer.src = item.url;
  refs.htmlPlayer.playbackRate = Number(refs.speedSelect.value);
  refs.htmlPlayer.volume = Number(refs.volumeBar.value);

  if (state.mode === "music") {
    refs.htmlPlayer.style.display = "none";
  } else {
    refs.htmlPlayer.style.display = "block";
  }

  refs.htmlPlayer.play().catch(() => {
    state.isPlaying = false;
  });
}

function playYouTube(item) {
  if (!state.ytPlayer || !state.ytReady) {
    state.pendingYouTubeItem = item;
    return;
  }

  state.pendingYouTubeItem = null;
  refs.htmlPlayer.pause();

  state.ytPlayer.loadVideoById(item.youtubeId);
  state.ytPlayer.playVideo();
  state.ytPlayer.setPlaybackRate(Number(refs.speedSelect.value));
  state.ytPlayer.setVolume(Math.round(Number(refs.volumeBar.value) * 100));
}

function togglePlay() {
  if (!state.current) return;

  if (state.current.kind === "local") {
    refs.htmlPlayer.play().catch(() => null);
  } else if (state.ytReady) {
    state.ytPlayer.playVideo();
  }

  state.isPlaying = true;
  updateMediaSession();
  if (refs.miniPlayPause) refs.miniPlayPause.textContent = "⏸";
}

function togglePause() {
  if (!state.current) return;

  if (state.current.kind === "local") {
    refs.htmlPlayer.pause();
  } else if (state.ytReady) {
    state.ytPlayer.pauseVideo();
  }

  state.isPlaying = false;
  updateMediaSession();
  if (refs.miniPlayPause) refs.miniPlayPause.textContent = "▶";
}

function seekBy(delta) {
  if (!state.current) return;

  if (state.current.kind === "local") {
    refs.htmlPlayer.currentTime = Math.max(0, refs.htmlPlayer.currentTime + delta);
  } else if (state.ytReady) {
    const now = state.ytPlayer.getCurrentTime();
    state.ytPlayer.seekTo(Math.max(0, now + delta), true);
  }
}

function setSeekPercent(value) {
  if (!state.current) return;

  const pct = Number(value) / 100;
  if (state.current.kind === "local") {
    const d = refs.htmlPlayer.duration || 0;
    refs.htmlPlayer.currentTime = d * pct;
  } else if (state.ytReady) {
    const d = state.ytPlayer.getDuration() || 0;
    state.ytPlayer.seekTo(d * pct, true);
  }
}

function nextTrack() {
  const queue = nowQueue();
  if (!queue.length) return;

  if (state.shuffle) {
    const r = Math.floor(Math.random() * queue.length);
    playItem(queue[r], r);
    return;
  }

  let idx = nowIndex() + 1;
  if (idx >= queue.length) {
    handleQueueEnd();
    return;
  }

  playItem(queue[idx], idx);
}

function previousTrack() {
  const queue = nowQueue();
  if (!queue.length) return;

  let idx = nowIndex() - 1;
  if (idx < 0) idx = 0;
  playItem(queue[idx], idx);
}

async function handleQueueEnd() {
  if (!state.current) return;

  if (state.repeat) {
    playItem(state.current, nowIndex());
    return;
  }

  if (!state.autoplay) {
    state.isPlaying = false;
    return;
  }

  if (state.current.kind === "youtube") {
    const rec = await fetchRecommendations(state.current.youtubeId);
    if (rec.length) {
      const picked = rec[0];
      nowQueue().push(picked);
      renderQueue();
      playItem(picked, nowQueue().length - 1);
      return;
    }
  } else {
    const library = nowLibrary();
    if (library.length) {
      const random = library[Math.floor(Math.random() * library.length)];
      nowQueue().push(random);
      renderQueue();
      playItem(random, nowQueue().length - 1);
      return;
    }
  }

  state.isPlaying = false;
}

async function searchOnline() {
  const query = refs.onlineQuery.value.trim();
  if (!query) return;

  refs.onlineSearchBtn.disabled = true;
  refs.onlineSearchBtn.textContent = "Buscando...";

  try {
    const results = await fetchYouTubeResults(query);
    if (!results.length) {
      throw new Error("Empty search results");
    }
    state.library[state.mode].online = results;
    setResultsVisible(true);
    renderLibrary(results);
  } catch (err) {
    setResultsVisible(true);
    renderLibrary([]);
    const li = document.createElement("li");
    li.className = "track-item";
    li.textContent = "No se pudo consultar YouTube ahora. Reintenta en unos segundos.";
    refs.libraryList.appendChild(li);
  } finally {
    refs.onlineSearchBtn.disabled = false;
    refs.onlineSearchBtn.textContent = "Buscar";
  }
}

async function fetchYouTubeResults(query) {
  if (state.youtubeApiKey) {
    const byApiKey = await fetchYouTubeResultsViaApiKey(query, state.youtubeApiKey);
    if (byApiKey.length) return byApiKey;
  }

  if (hasLocalApi()) {
    try {
      const base = String(appConfig.publicApiBase || "").trim();
      const route = `/api/search?q=${encodeURIComponent(query)}&mode=${encodeURIComponent(state.mode)}`;
      const proxyUrl = base ? `${base}${route}` : route;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (Array.isArray(proxyData) && proxyData.length) {
          return proxyData;
        }
      }
    } catch (_) {
      // Fallback below.
    }
  }

  for (const base of invidiousInstances) {
    const url = `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) continue;
      const data = await res.json();
      const cleaned = data
        .filter((x) => x.type === "video" && x.videoId)
        .slice(0, 25)
        .map((x) => ({
          id: `yt-${x.videoId}`,
          youtubeId: x.videoId,
          title: normalizeText(x.title || "Sin titulo"),
          subtitle: `${normalizeText(x.author || "Canal")} - ${formatTime(x.lengthSeconds || 0)}`,
          thumbnail: x.videoThumbnails?.[0]?.url || "",
          kind: "youtube"
        }));

      if (state.mode === "music") {
        return cleaned.filter((x) => !/shorts/i.test(x.title)).slice(0, 20);
      }
      return cleaned;
    } catch (error) {
      continue;
    }
  }

  throw new Error("No API instances available");
}

async function fetchYouTubeResultsViaApiKey(query, apiKey) {
  const searchUrl = "https://www.googleapis.com/youtube/v3/search"
    + `?part=snippet&type=video&maxResults=25&q=${encodeURIComponent(query)}`
    + `&key=${encodeURIComponent(apiKey)}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) return [];

  const searchData = await searchRes.json();
  const items = Array.isArray(searchData.items) ? searchData.items : [];
  if (!items.length) return [];

  const ids = items
    .map((x) => x?.id?.videoId)
    .filter(Boolean)
    .slice(0, 25);

  const durationMap = await fetchDurationMapByVideoIds(ids, apiKey);

  const mapped = items
    .map((x) => {
      const videoId = x?.id?.videoId;
      if (!videoId) return null;
      const snippet = x.snippet || {};
      const sec = durationMap.get(videoId) || 0;
      return {
        id: `yt-${videoId}`,
        youtubeId: videoId,
        title: normalizeText(snippet.title || "Sin titulo"),
        subtitle: `${normalizeText(snippet.channelTitle || "Canal")} - ${formatTime(sec)}`,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
        kind: "youtube"
      };
    })
    .filter(Boolean);

  if (state.mode === "music") {
    return mapped.filter((x) => !/shorts/i.test(x.title)).slice(0, 20);
  }

  return mapped;
}

async function fetchDurationMapByVideoIds(videoIds, apiKey) {
  const map = new Map();
  if (!videoIds.length) return map;

  const detailUrl = "https://www.googleapis.com/youtube/v3/videos"
    + `?part=contentDetails&id=${encodeURIComponent(videoIds.join(","))}`
    + `&key=${encodeURIComponent(apiKey)}`;
  const detailRes = await fetch(detailUrl);
  if (!detailRes.ok) return map;

  const detailData = await detailRes.json();
  const detailItems = Array.isArray(detailData.items) ? detailData.items : [];
  detailItems.forEach((item) => {
    if (!item?.id) return;
    map.set(item.id, parseIsoDurationToSeconds(item?.contentDetails?.duration));
  });

  return map;
}

async function fetchRecommendations(videoId) {
  if (state.youtubeApiKey) {
    const byApiKey = await fetchRecommendationsViaApiKey(videoId, state.youtubeApiKey);
    if (byApiKey.length) return byApiKey;
  }

  if (hasLocalApi()) {
    try {
      const base = String(appConfig.publicApiBase || "").trim();
      const route = `/api/recommend?videoId=${encodeURIComponent(videoId)}`;
      const proxyUrl = base ? `${base}${route}` : route;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (Array.isArray(proxyData) && proxyData.length) {
          return proxyData;
        }
      }
    } catch (_) {
      // Fallback below.
    }
  }

  for (const base of invidiousInstances) {
    const url = `${base}/api/v1/videos/${encodeURIComponent(videoId)}`;
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) continue;
      const data = await res.json();
      const related = (data.recommendedVideos || [])
        .filter((x) => x.videoId)
        .slice(0, 10)
        .map((x) => ({
          id: `yt-${x.videoId}`,
          youtubeId: x.videoId,
          title: normalizeText(x.title || "Recomendado"),
          subtitle: `${normalizeText(x.author || "Canal")} - ${formatTime(x.lengthSeconds || 0)}`,
          thumbnail: "",
          kind: "youtube"
        }));
      return related;
    } catch (error) {
      continue;
    }
  }

  return [];
}

async function fetchRecommendationsViaApiKey(videoId, apiKey) {
  const relatedUrl = "https://www.googleapis.com/youtube/v3/search"
    + `?part=snippet&type=video&maxResults=10&relatedToVideoId=${encodeURIComponent(videoId)}`
    + `&key=${encodeURIComponent(apiKey)}`;

  const relatedRes = await fetch(relatedUrl);
  if (!relatedRes.ok) return [];

  const relatedData = await relatedRes.json();
  const items = Array.isArray(relatedData.items) ? relatedData.items : [];
  if (!items.length) return [];

  const ids = items
    .map((x) => x?.id?.videoId)
    .filter(Boolean)
    .slice(0, 10);

  const durationMap = await fetchDurationMapByVideoIds(ids, apiKey);

  return items
    .map((x) => {
      const vid = x?.id?.videoId;
      if (!vid) return null;
      const snippet = x.snippet || {};
      const sec = durationMap.get(vid) || 0;
      return {
        id: `yt-${vid}`,
        youtubeId: vid,
        title: normalizeText(snippet.title || "Recomendado"),
        subtitle: `${normalizeText(snippet.channelTitle || "Canal")} - ${formatTime(sec)}`,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
        kind: "youtube"
      };
    })
    .filter(Boolean);
}

function loadLocalFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  const kindAccept = state.mode === "music" ? "audio/" : "video/";
  const mapped = files
    .filter((f) => f.type.startsWith(kindAccept))
    .map((f) => ({
      id: `local-${f.name}-${f.size}-${f.lastModified}`,
      title: f.name.replace(/\.[^.]+$/, ""),
      subtitle: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      url: URL.createObjectURL(f),
      kind: "local"
    }));

  state.library[state.mode].local = mapped;
  setResultsVisible(true);
  renderLibrary();
}

function filterLocal() {
  const q = refs.localQuery.value.trim().toLowerCase();
  if (!q) {
    setResultsVisible(nowLibrary().length > 0);
    renderLibrary();
    return;
  }

  const filtered = nowLibrary().filter((x) =>
    x.title.toLowerCase().includes(q) || (x.subtitle || "").toLowerCase().includes(q)
  );
  setResultsVisible(true);
  renderLibrary(filtered);
}

function updateTimeUi(currentSec, durationSec) {
  const safeCurrent = Number.isFinite(currentSec) ? currentSec : 0;
  const safeDuration = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 0;
  refs.currentTime.textContent = formatTime(safeCurrent);
  refs.durationTime.textContent = formatTime(safeDuration);
  refs.seekBar.value = safeDuration ? (safeCurrent / safeDuration) * 100 : 0;

  if ("mediaSession" in navigator && Number.isFinite(safeDuration) && safeDuration > 0) {
    navigator.mediaSession.setPositionState({
      duration: safeDuration,
      playbackRate: Number(refs.speedSelect.value),
      position: Math.min(safeCurrent, safeDuration)
    });
  }
}

function onMediaEnded() {
  nextTrack();
}

function updateMediaSession() {
  if (!("mediaSession" in navigator) || !state.current) return;

  const item = state.current;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: item.title || "Sin titulo",
    artist: item.subtitle || "Reproductor Duo",
    album: state.mode === "music" ? "Musica" : "Videos",
    artwork: [
      {
        src: item.thumbnail || "icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ]
  });

  navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
}

function setMediaActionHandlers() {
  if (!("mediaSession" in navigator)) return;

  try { navigator.mediaSession.setActionHandler("play", () => togglePlay()); } catch (_) {}
  try { navigator.mediaSession.setActionHandler("pause", () => togglePause()); } catch (_) {}
  try { navigator.mediaSession.setActionHandler("previoustrack", () => previousTrack()); } catch (_) {}
  try { navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack()); } catch (_) {}
  try { navigator.mediaSession.setActionHandler("seekbackward", (details) => seekBy(-(details.seekOffset || 10))); } catch (_) {}
  try { navigator.mediaSession.setActionHandler("seekforward", (details) => seekBy(details.seekOffset || 10)); } catch (_) {}
  try {
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (!details.seekTime && details.seekTime !== 0) return;
      if (!state.current) return;
      if (state.current.kind === "local") {
        refs.htmlPlayer.currentTime = details.seekTime;
      } else if (state.ytReady) {
        state.ytPlayer.seekTo(details.seekTime, true);
      }
    });
  } catch (_) {}
}

function bindEvents() {
  refs.modeMusic.addEventListener("click", () => setMode("music"));
  refs.modeVideo.addEventListener("click", () => setMode("video"));
  refs.sourceLocal.addEventListener("click", () => setSource("local"));
  refs.sourceOnline.addEventListener("click", () => setSource("online"));

  refs.onlineSearchBtn.addEventListener("click", searchOnline);
  refs.onlineQuery.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchOnline();
  });

  if (refs.saveApiKeyBtn && refs.ytApiKeyInput) {
    refs.saveApiKeyBtn.addEventListener("click", () => {
      const key = refs.ytApiKeyInput.value.trim();
      state.youtubeApiKey = key;
      saveApiKey(key);
      updateOnlineHintByContext();
    });
  }

  if (refs.clearApiKeyBtn && refs.ytApiKeyInput) {
    refs.clearApiKeyBtn.addEventListener("click", () => {
      refs.ytApiKeyInput.value = "";
      state.youtubeApiKey = "";
      saveApiKey("");
      updateOnlineHintByContext();
    });
  }

  refs.localPicker.addEventListener("change", (e) => loadLocalFiles(e.target.files));
  refs.localQuery.addEventListener("input", filterLocal);

  refs.libraryList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const action = btn.getAttribute("data-action");
    const item = findInLibraryById(id);
    if (!item) return;

    if (action === "play") {
      startSmartPlayback(item);
    }

    if (action === "add") {
      enqueue(item);
      renderQueue();
    }
  });

  refs.queueList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const pos = Number(btn.getAttribute("data-pos"));
    const queue = nowQueue();
    if (!Number.isFinite(pos) || pos < 0 || pos >= queue.length) return;

    if (action === "jump") {
      playItem(queue[pos], pos);
      return;
    }

    if (action === "remove") {
      queue.splice(pos, 1);
      if (pos <= nowIndex()) {
        setNowIndex(Math.max(0, nowIndex() - 1));
      }
      renderQueue();
    }
  });

  refs.prevBtn.addEventListener("click", previousTrack);
  refs.backBtn.addEventListener("click", () => seekBy(-10));
  refs.playBtn.addEventListener("click", togglePlay);
  refs.pauseBtn.addEventListener("click", togglePause);
  refs.fwdBtn.addEventListener("click", () => seekBy(10));
  refs.nextBtn.addEventListener("click", nextTrack);

  if (refs.miniPrev) refs.miniPrev.addEventListener("click", previousTrack);
  if (refs.miniNext) refs.miniNext.addEventListener("click", nextTrack);
  if (refs.miniPlayPause) {
    refs.miniPlayPause.addEventListener("click", () => {
      if (state.isPlaying) {
        togglePause();
      } else {
        togglePlay();
      }
    });
  }

  if (refs.miniOpenArea) {
    refs.miniOpenArea.addEventListener("click", () => {
      setPlayerOpen(!isPlayerOpen());
    });
  }

  if (refs.closePlayerBtn) {
    refs.closePlayerBtn.addEventListener("click", () => {
      setPlayerOpen(false);
    });
  }

  refs.seekBar.addEventListener("input", () => setSeekPercent(refs.seekBar.value));

  refs.volumeBar.addEventListener("input", () => {
    const v = Number(refs.volumeBar.value);
    refs.htmlPlayer.volume = v;
    if (state.ytReady) state.ytPlayer.setVolume(Math.round(v * 100));
  });

  refs.speedSelect.addEventListener("change", () => {
    const rate = Number(refs.speedSelect.value);
    refs.htmlPlayer.playbackRate = rate;
    if (state.ytReady) state.ytPlayer.setPlaybackRate(rate);
  });

  refs.shuffleBtn.addEventListener("click", () => {
    state.shuffle = !state.shuffle;
    refs.shuffleBtn.classList.toggle("is-active", state.shuffle);
    refs.shuffleBtn.setAttribute("aria-pressed", String(state.shuffle));
    refs.shuffleBtn.textContent = state.shuffle ? "Shuffle on" : "Shuffle off";
  });

  refs.repeatBtn.addEventListener("click", () => {
    state.repeat = !state.repeat;
    refs.repeatBtn.classList.toggle("is-active", state.repeat);
    refs.repeatBtn.setAttribute("aria-pressed", String(state.repeat));
    refs.repeatBtn.textContent = state.repeat ? "Repeat on" : "Repeat off";
  });

  refs.autoplayBtn.addEventListener("click", () => {
    state.autoplay = !state.autoplay;
    refs.autoplayBtn.classList.toggle("is-active", state.autoplay);
    refs.autoplayBtn.setAttribute("aria-pressed", String(state.autoplay));
    refs.autoplayBtn.textContent = state.autoplay ? "Autoplay on" : "Autoplay off";
  });

  refs.htmlPlayer.addEventListener("timeupdate", () => {
    updateTimeUi(refs.htmlPlayer.currentTime, refs.htmlPlayer.duration);
  });

  refs.htmlPlayer.addEventListener("ended", onMediaEnded);
  refs.htmlPlayer.addEventListener("play", () => {
    state.isPlaying = true;
    updateMediaSession();
    if (refs.miniPlayPause) refs.miniPlayPause.textContent = "⏸";
  });
  refs.htmlPlayer.addEventListener("pause", () => {
    state.isPlaying = false;
    updateMediaSession();
    if (refs.miniPlayPause) refs.miniPlayPause.textContent = "▶";
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function decodeHtmlEntities(str) {
  const txt = document.createElement("textarea");
  txt.innerHTML = String(str || "");
  return txt.value;
}

function normalizeText(value) {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  state.ytPlayer = new YT.Player("youtubePlayer", {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 1,
      modestbranding: 1,
      playsinline: 1
    },
    events: {
      onReady: () => {
        state.ytReady = true;
        if (state.pendingYouTubeItem) {
          playYouTube(state.pendingYouTubeItem);
        }
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.ENDED) onMediaEnded();
        if (event.data === YT.PlayerState.PLAYING) {
          state.isPlaying = true;
          updateMediaSession();
          if (refs.miniPlayPause) refs.miniPlayPause.textContent = "⏸";
        }
        if (event.data === YT.PlayerState.PAUSED) {
          state.isPlaying = false;
          updateMediaSession();
          if (refs.miniPlayPause) refs.miniPlayPause.textContent = "▶";
        }
      }
    }
  });
};

function tick() {
  if (state.current && state.current.kind === "youtube" && state.ytReady) {
    const current = state.ytPlayer.getCurrentTime();
    const duration = state.ytPlayer.getDuration();
    updateTimeUi(current, duration);
  }

  drawVisualizerFrame();

  requestAnimationFrame(tick);
}

function bootstrap() {
  state.youtubeApiKey = String(appConfig.youtubeApiKey || "").trim() || loadApiKey();
  if (refs.ytApiKeyInput) {
    refs.ytApiKeyInput.value = state.youtubeApiKey;
  }

  if (refs.onlineApiRow && !isConfigMode()) {
    refs.onlineApiRow.hidden = true;
    refs.onlineApiRow.style.display = "none";
  }

  if (location.protocol === "file:") {
    const warn = document.createElement("li");
    warn.className = "track-item";
    warn.textContent = "Modo online funciona mejor en http/https.";
    refs.libraryList.innerHTML = "";
    refs.libraryList.appendChild(warn);
  }

  bindEvents();
  initAudioVisualizer();
  renderMoodChips();
  if (refs.miniPlayer) refs.miniPlayer.hidden = false;
  setMode("music");
  setSource("online");
  setPlayerOpen(false);
  setResultsVisible(false);
  if (refs.discoverSection) refs.discoverSection.hidden = false;
  loadDiscovery();
  setMediaActionHandlers();
  tick();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => null);
  }
}

bootstrap();
