const state = {
  mode: "music",
  source: "local",
  view: "home",
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
  repeatMode: "off",
  autoplay: true,
  preferFreeInBackground: true,
  current: null,
  ytReady: false,
  ytPlayer: null,
  isPlaying: false,
  userPaused: false,
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
  discoverSeed: Math.floor(Math.random() * 100000),
  discoverRequestId: 0,
  searchRequestId: 0,
  discoverRotation: 0,
  discoverShownIds: [],
  discoverLoading: false,
  queueReorderId: "",
  discoverCache: {
    music: { online: [], local: [] },
    video: { online: [], local: [] }
  },
  onlineQueue: {
    music: { related: [], results: [], view: "related", loading: false, lastSeedId: "", playedIds: [], playedSignatures: [], seedTrail: [], searchSeed: "", growthCycle: 0, reseedSeedId: "", reseeding: false, blockedIds: [] },
    video: { related: [], results: [], view: "related", loading: false, lastSeedId: "", playedIds: [], playedSignatures: [], seedTrail: [], searchSeed: "", growthCycle: 0, reseedSeedId: "", reseeding: false, blockedIds: [] }
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

// Cada refresco de Descubrir toma una consulta distinta del pool: con una sola
// consulta fija YouTube devolvia siempre el mismo punado de videos.
// Se piden canciones (no "mix"/"set"), que luego se filtran como recopilatorios.
const moodQueryPool = {
  Energia: ["high energy songs", "workout songs", "gym motivation songs", "rock anthems", "hype rap songs", "power pop hits"],
  Relax: ["chill songs", "acoustic chill songs", "indie chill songs", "slow rnb songs", "ambient guitar songs", "bossa nova songs"],
  Concentracion: ["focus instrumental songs", "study beats", "piano study songs", "minimal techno tracks", "cinematic instrumental tracks", "jazz cafe instrumental"],
  Fiesta: ["party hits", "reggaeton hits", "latin club hits", "dance floor hits", "afrobeats hits", "throwback party classics"],
  Triste: ["sad songs", "emotional ballads", "heartbreak indie songs", "melancholic piano songs", "sad rnb songs", "acoustic sad covers"],
  Romantica: ["romantic songs", "love songs classics", "baladas romanticas", "rnb love songs", "acoustic love duets", "slow dance songs"]
};

const moodRadioTags = {
  Energia: "dance",
  Relax: "chillout",
  Concentracion: "ambient",
  Fiesta: "latin",
  Triste: "indie",
  Romantica: "love songs"
};

const moodSeedTerms = {
  Energia: ["edm", "rock", "hip hop"],
  Relax: ["chillout", "acoustic", "lo-fi"],
  Concentracion: ["instrumental", "classical", "ambient"],
  Fiesta: ["reggaeton", "dance", "latin"],
  Triste: ["ballad", "indie", "soul"],
  Romantica: ["romantic", "r&b", "pop"]
};

const genreLexicon = {
  edm: ["edm", "electronic", "dance", "festival", "big room", "progressive", "electro"],
  house: ["house", "deep house", "tech house", "slap house"],
  trance: ["trance", "uplifting", "psytrance"],
  techno: ["techno", "minimal techno", "hard techno"],
  hiphop: ["hip hop", "hiphop", "rap", "trap", "drill", "freestyle"],
  reggaeton: ["reggaeton", "latin urbano", "dembow"],
  pop: ["pop", "chart", "mainstream"],
  rock: ["rock", "alternative", "indie rock", "metal", "punk"],
  lofi: ["lofi", "lo-fi", "chillhop", "study beats"],
  classical: ["classical", "orchestra", "piano", "violin", "symphony"],
  jazz: ["jazz", "swing", "blues", "soul"],
  ambient: ["ambient", "meditation", "sleep", "relaxing"]
};

const genreLabel = {
  edm: "edm",
  house: "house",
  trance: "trance",
  techno: "techno",
  hiphop: "hip hop",
  reggaeton: "reggaeton",
  pop: "pop",
  rock: "rock",
  lofi: "lofi",
  classical: "classical",
  jazz: "jazz",
  ambient: "ambient"
};

const fallbackCatalog = [
  { title: "Eminem - Lose Yourself", subtitle: "Hip Hop", youtubeId: "xFYQQPAOz7Y", thumbnail: "https://i.ytimg.com/vi/xFYQQPAOz7Y/hqdefault.jpg", moods: ["Energia", "Concentracion"] },
  { title: "Eminem - Mockingbird", subtitle: "Hip Hop", youtubeId: "S9bCLPwzSC0", thumbnail: "https://i.ytimg.com/vi/S9bCLPwzSC0/hqdefault.jpg", moods: ["Triste", "Relax"] },
  { title: "Eminem - Without Me", subtitle: "Hip Hop", youtubeId: "YVkUvmDQ3HY", thumbnail: "https://i.ytimg.com/vi/YVkUvmDQ3HY/hqdefault.jpg", moods: ["Fiesta", "Energia"] },
  { title: "Eminem - Not Afraid", subtitle: "Hip Hop", youtubeId: "j5-yKhDd64s", thumbnail: "https://i.ytimg.com/vi/j5-yKhDd64s/hqdefault.jpg", moods: ["Energia", "Concentracion"] },
  { title: "Eminem - Till I Collapse", subtitle: "Hip Hop", youtubeId: "Pi3_Zs-oRUo", thumbnail: "https://i.ytimg.com/vi/Pi3_Zs-oRUo/hqdefault.jpg", moods: ["Energia", "Fiesta"] },
  { title: "Martin Garrix - Animals", subtitle: "EDM", youtubeId: "gCYcHz2k5x0", thumbnail: "https://i.ytimg.com/vi/gCYcHz2k5x0/hqdefault.jpg", moods: ["Energia", "Fiesta"] },
  { title: "Martin Garrix - High On Life", subtitle: "EDM", youtubeId: "Lpjcm1F8tY8", thumbnail: "https://i.ytimg.com/vi/Lpjcm1F8tY8/hqdefault.jpg", moods: ["Energia", "Relax"] },
  { title: "The Weeknd - Blinding Lights", subtitle: "Pop", youtubeId: "4NRXx6U8ABQ", thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg", moods: ["Fiesta", "Energia"] },
  { title: "Coldplay - Yellow", subtitle: "Rock", youtubeId: "yKNxeF4KMsY", thumbnail: "https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg", moods: ["Relax", "Romantica"] },
  { title: "Kina - Get You The Moon", subtitle: "Lo-fi / Chill", youtubeId: "AF1M6E2F8_8", thumbnail: "https://i.ytimg.com/vi/AF1M6E2F8_8/hqdefault.jpg", moods: ["Relax", "Concentracion"] },
  { title: "AURORA - Runaway", subtitle: "Alternative", youtubeId: "d_HlPboLRL8", thumbnail: "https://i.ytimg.com/vi/d_HlPboLRL8/hqdefault.jpg", moods: ["Triste", "Relax"] },
  { title: "Ruelle - I Get To Love You", subtitle: "Romantic", youtubeId: "15a49Hik4FQ", thumbnail: "https://i.ytimg.com/vi/15a49Hik4FQ/hqdefault.jpg", moods: ["Romantica", "Triste"] },
  { title: "Linkin Park - Numb", subtitle: "Rock / Alternative", youtubeId: "kXYiU_JCYtU", thumbnail: "https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg", moods: ["Triste", "Concentracion"] },
  { title: "Imagine Dragons - Believer", subtitle: "Alternative Rock", youtubeId: "7wtfhZwyrcc", thumbnail: "https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg", moods: ["Energia", "Fiesta"] },
  { title: "Avicii - Wake Me Up", subtitle: "EDM / Pop", youtubeId: "IcrbM1l_BoI", thumbnail: "https://i.ytimg.com/vi/IcrbM1l_BoI/hqdefault.jpg", moods: ["Energia", "Relax"] },
  { title: "Queen - Don't Stop Me Now", subtitle: "Classic Rock", youtubeId: "HgzGwKwLmgM", thumbnail: "https://i.ytimg.com/vi/HgzGwKwLmgM/hqdefault.jpg", moods: ["Fiesta", "Energia"] },
  { title: "Ed Sheeran - Shape of You", subtitle: "Pop", youtubeId: "JGwWNGJdvx8", thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg", moods: ["Fiesta", "Romantica"] },
  { title: "Sia - Cheap Thrills", subtitle: "Pop", youtubeId: "nYh-n7EOtMA", thumbnail: "https://i.ytimg.com/vi/nYh-n7EOtMA/hqdefault.jpg", moods: ["Fiesta", "Energia"] },
  { title: "Alan Walker - Faded", subtitle: "EDM", youtubeId: "60ItHLz5WEA", thumbnail: "https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg", moods: ["Relax", "Triste"] },
  { title: "BTS - Dynamite", subtitle: "Pop", youtubeId: "gdZLi9oWNZg", thumbnail: "https://i.ytimg.com/vi/gdZLi9oWNZg/hqdefault.jpg", moods: ["Fiesta", "Energia"] },
  { title: "Shakira - Waka Waka", subtitle: "Pop Latino", youtubeId: "pRpeEdMmmQ0", thumbnail: "https://i.ytimg.com/vi/pRpeEdMmmQ0/hqdefault.jpg", moods: ["Fiesta", "Energia"] },
  { title: "Adele - Rolling in the Deep", subtitle: "Pop Soul", youtubeId: "rYEDA3JcQqw", thumbnail: "https://i.ytimg.com/vi/rYEDA3JcQqw/hqdefault.jpg", moods: ["Triste", "Relax"] },
  { title: "The Kid LAROI, Justin Bieber - STAY", subtitle: "Pop", youtubeId: "kTJczUoc26U", thumbnail: "https://i.ytimg.com/vi/kTJczUoc26U/hqdefault.jpg", moods: ["Romantica", "Fiesta"] }
];

const invidiousInstances = [
  "https://invidious.fdn.fr",
  "https://invidious.privacyredirect.com",
  "https://invidious.projectsegfau.lt"
];

const runtimeCache = {
  search: new Map(),
  recommendations: new Map(),
  metadata: new Map(),
  resolve: new Map()
};

const RADIO_MAX_PER_ARTIST = 4;
const SEARCH_CACHE_TTL = 10 * 60 * 1000;
const RECOMMENDATION_CACHE_TTL = 20 * 60 * 1000;
const METADATA_CACHE_TTL = 30 * 60 * 1000;
const RESOLVE_CACHE_TTL = 6 * 60 * 60 * 1000;
const DISCOVER_ROTATION_KEY = "duo.discoverRotation";
const DISCOVER_SHOWN_LIMIT = 60;

const appConfig = window.DUO_CONFIG || {};
let deferredInstallPrompt = null;
const LOCAL_DB_NAME = "duoplayer-local-v1";
const LOCAL_DB_STORE = "tracks";
let localDbPromise = null;
const PLAYBACK_NOTIFICATION_TAG = "duo-playback-controls";
let hasAskedNotificationPermission = false;
let playbackNotificationKey = "";
let silentKeepAlive = null;
let streamPlayer = null;
let renderedLibraryItems = [];
let lastMediaSessionAssert = 0;

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

function getCachedValue(cache, key, ttlMs) {
  const entry = cache.get(key);
  if (!entry) return null;
  if ((Date.now() - entry.time) > ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCachedValue(cache, key, value) {
  cache.set(key, { time: Date.now(), value });
  return value;
}

function uniqueItems(items) {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    if (!item) return;
    const key = item.id || item.youtubeId || `${item.title || ""}|${item.subtitle || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
}

function rotateItems(items, offset) {
  if (!items.length) return items;
  const index = ((offset % items.length) + items.length) % items.length;
  return items.slice(index).concat(items.slice(0, index));
}

function markAsRadioAdded(item) {
  if (!item) return item;
  return {
    ...item,
    addedByRadio: true,
    addedByRadioAt: Date.now()
  };
}

// Tokens ordenados y sin repetir del titulo: distintos uploads de la misma cancion
// (official / audio / lyrics / live / con o sin feat) producen conjuntos casi iguales.
function trackTokens(item) {
  const raw = normalizeText(item?.title || "").toLowerCase();
  if (!raw) return [];
  const stripped = raw
    .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, " ")
    .replace(/official|oficial|video|videoclip|lyrics|lyric|letra|audio|hd|4k|hq|remaster(?:ed)?|version|live|mix|playlist|visualizer|feat\.?|ft\.?|mv/gi, " ")
    .replace(/[^a-z0-9\s]/g, " ");

  return Array.from(new Set(stripped.split(/\s+/).filter((x) => x && x.length > 2))).sort();
}

function trackSignature(item) {
  return trackTokens(item).join(" ");
}

function tokensAreNearDuplicate(a, b) {
  if (!a.length || !b.length) return false;
  const setB = new Set(b);
  let overlap = 0;
  a.forEach((token) => {
    if (setB.has(token)) overlap += 1;
  });
  const minLen = Math.min(a.length, b.length);
  if (minLen < 2) return overlap === minLen;
  return overlap / minLen >= 0.7;
}

function createDuplicateGuard(signatures = []) {
  const known = [];
  (signatures instanceof Set ? Array.from(signatures) : signatures || []).forEach((sig) => {
    if (sig) known.push(String(sig).split(" ").filter(Boolean));
  });

  return {
    has(item) {
      const tokens = trackTokens(item);
      if (!tokens.length) return false;
      return known.some((other) => tokensAreNearDuplicate(tokens, other));
    },
    add(item) {
      const tokens = trackTokens(item);
      if (tokens.length) known.push(tokens);
    }
  };
}

function artistCountsOf(items) {
  const counts = new Map();
  (items || []).forEach((item) => {
    const artist = artistHint(item);
    if (!artist) return;
    counts.set(artist, (counts.get(artist) || 0) + 1);
  });
  return counts;
}

function bumpArtistCount(counts, item) {
  const artist = artistHint(item);
  if (!artist) return;
  counts.set(artist, (counts.get(artist) || 0) + 1);
}

function artistIsSaturated(counts, item, max = RADIO_MAX_PER_ARTIST) {
  const artist = artistHint(item);
  if (!artist) return false;
  return (counts.get(artist) || 0) >= max;
}

// Un "mix" de dos horas no es una recomendacion: se descartan recopilatorios,
// sets y videos larguisimos del descubrimiento y de la radio.
// La duracion manda; en el titulo solo se miran marcas inequivocas ("mix" suelto
// no vale: hay bandas como Little Mix).
const NON_SONG_TITLE = /\b(megamix|full album|album completo|non ?stop|dj set|live set|compilation|radio show|podcast|karaoke|playlist|top \d{2,}|\d+\s*(hour|hours|horas)|24\/7)\b/i;

function durationSecondsOf(item) {
  const stamp = String(item?.subtitle || "").split(" - ").pop() || "";
  const parts = stamp.trim().split(":").map((x) => Number(x));
  if (!parts.length || parts.some((x) => !Number.isFinite(x))) return 0;
  return parts.reduce((total, value) => (total * 60) + value, 0);
}

function looksLikeSong(item) {
  if (!item) return false;
  if (item.isLiveRadio) return true;
  if (durationSecondsOf(item) > 900) return false;
  if (item.kind !== "youtube") return true;
  return !NON_SONG_TITLE.test(item.title || "");
}

// Si al filtrar queda muy poco, se devuelve la lista original antes que dejarla vacia.
function preferSongs(items) {
  const songs = (items || []).filter(looksLikeSong);
  return songs.length >= Math.min(8, (items || []).length) ? songs : items || [];
}

function pickDiverseTracks(items, { max = 24, blockedSignatures = new Set(), blockedIds = new Set(), artistCounts = null, maxPerArtist = 0 } = {}) {
  const picked = [];
  const seenIds = new Set(blockedIds);
  const guard = createDuplicateGuard(blockedSignatures);
  const counts = artistCounts ? new Map(artistCounts) : new Map();
  for (const item of items || []) {
    if (!item?.id || seenIds.has(item.id)) continue;
    if (guard.has(item)) continue;
    if (maxPerArtist > 0 && artistIsSaturated(counts, item, maxPerArtist)) continue;
    picked.push(item);
    seenIds.add(item.id);
    guard.add(item);
    bumpArtistCount(counts, item);
    if (picked.length >= max) break;
  }
  return picked;
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
  discoverTitle: document.getElementById("discoverTitle"),
  discoverList: document.getElementById("discoverList"),
  discoverRefreshBtn: document.getElementById("discoverRefreshBtn"),
  navHome: document.getElementById("navHome"),
  navExplore: document.getElementById("navExplore"),
  navLibrary: document.getElementById("navLibrary"),
  libraryExtras: document.getElementById("libraryExtras"),
  resultsTitle: document.getElementById("resultsTitle"),
  moodChips: document.getElementById("moodChips"),
  resultsSection: document.getElementById("resultsSection"),
  localPicker: document.getElementById("localPicker"),
  localFolderPicker: document.getElementById("localFolderPicker"),
  installAppBtn: document.getElementById("installAppBtn"),
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
  resetPlayerBtn: document.getElementById("resetPlayerBtn"),
  playerHead: document.getElementById("playerHead"),
  nowTitle: document.getElementById("nowTitle"),
  nowSubtitle: document.getElementById("nowSubtitle"),
  queueModeTabs: document.getElementById("queueModeTabs"),
  queueModeRelated: document.getElementById("queueModeRelated"),
  queueModeResults: document.getElementById("queueModeResults"),
  radioGrowingHint: document.getElementById("radioGrowingHint"),
  closeResultsBtn: document.getElementById("closeResultsBtn"),
  shuffleControlBtn: document.getElementById("shuffleControlBtn"),
  prevBtn: document.getElementById("prevBtn"),
  backBtn: document.getElementById("backBtn"),
  playBtn: document.getElementById("playBtn"),
  fwdBtn: document.getElementById("fwdBtn"),
  nextBtn: document.getElementById("nextBtn"),
  seekBar: document.getElementById("seekBar"),
  currentTime: document.getElementById("currentTime"),
  durationTime: document.getElementById("durationTime"),
  volumeBar: document.getElementById("volumeBar"),
  speedSelect: document.getElementById("speedSelect"),
  repeatBtn: document.getElementById("repeatBtn"),
  autoplayBtn: document.getElementById("autoplayBtn"),
  bgFreeBtn: document.getElementById("bgFreeBtn"),
  freeSwapBtn: document.getElementById("freeSwapBtn"),
  shareBtn: document.getElementById("shareBtn")
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

const PLAY_ICON = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M8 5v14l11-7z\"/></svg>";
const PAUSE_ICON = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M7 5h4v14H7zm6 0h4v14h-4z\"/></svg>";

function isOnlineQueueMode() {
  return state.source === "online";
}

function onlineQueueState() {
  return state.onlineQueue[state.mode];
}

function getActiveQueueView() {
  if (!isOnlineQueueMode()) return "related";
  return onlineQueueState().view || "related";
}

function setActiveQueueView(view) {
  if (!isOnlineQueueMode()) return;
  const next = view === "results" ? "results" : "related";
  onlineQueueState().view = next;
  updateQueueViewUi();
  renderQueue();
}

function updateQueueViewUi() {
  if (!refs.queueModeTabs || !refs.queueModeRelated || !refs.queueModeResults) return;
  const show = isOnlineQueueMode();
  refs.queueModeTabs.hidden = !show;
  if (!show) {
    if (refs.radioGrowingHint) refs.radioGrowingHint.hidden = true;
    return;
  }
  const view = getActiveQueueView();
  refs.queueModeRelated.classList.toggle("is-active", view === "related");
  refs.queueModeResults.classList.toggle("is-active", view === "results");
  updateRadioGrowingIndicator();
}

function updateRadioGrowingIndicator() {
  if (!refs.radioGrowingHint) return;
  const show = isOnlineQueueMode() && Boolean(onlineQueueState().loading);
  refs.radioGrowingHint.hidden = !show;
}

function queueItemsForRender() {
  if (!isOnlineQueueMode()) {
    return nowQueue();
  }

  const q = onlineQueueState();
  return getActiveQueueView() === "results" ? q.results : q.related;
}

async function fetchRecommendationsSafe(videoId) {
  const cacheKey = String(videoId || "").trim();
  if (cacheKey) {
    const cached = getCachedValue(runtimeCache.recommendations, cacheKey, RECOMMENDATION_CACHE_TTL);
    if (cached) return cached.map((item) => ({ ...item }));
  }
  try {
    const result = await fetchRecommendations(videoId);
    if (cacheKey && result.length) {
      setCachedValue(runtimeCache.recommendations, cacheKey, result);
    }
    return result;
  } catch (_) {
    return [];
  }
}

function isRadioPlayable(item) {
  return item?.kind === "youtube" || item?.kind === "stream";
}

// Los rellenos de la radio tambien tienen que parecerse a lo que suena: sin este
// filtro colaban pistas del descubrimiento que no tenian relacion alguna.
function relatedToCurrent(items) {
  if (!state.current) return items || [];
  return (items || []).filter((item) => onlineSimilarityScore(state.current, item) >= 0);
}

function rememberOnlinePlayback(item) {
  if (!isOnlineQueueMode() || !isRadioPlayable(item) || !item?.id) return;
  const qState = onlineQueueState();
  if (!Array.isArray(qState.playedIds)) qState.playedIds = [];
  qState.playedIds = [item.id, ...qState.playedIds.filter((id) => id !== item.id)].slice(0, 140);
  if (!Array.isArray(qState.playedSignatures)) qState.playedSignatures = [];
  const sig = trackSignature(item);
  if (sig) {
    qState.playedSignatures = [sig, ...qState.playedSignatures.filter((x) => x !== sig)].slice(0, 140);
  }
}

// Nunca se busca el titulo exacto de la pista actual: eso devuelve la misma cancion
// una y otra vez. Las consultas giran alrededor del artista y del genero detectado.
// Relacionadas por capas: fuente original -> similares reales (Last.fm/Deezer/iTunes)
// -> catalogos libres del mismo artista -> mezcla por genero.
async function fetchRelatedForItem(item) {
  if (!item) return [];
  if (item.isLiveRadio) return [];

  const artist = artistHint(item) || splitTitleArtist(item).artist;
  const genre = item.genre || genreLabel[Array.from(radioGenreProfile(item))[0]] || "";
  const tasks = [];

  if (item.kind === "youtube" && item.youtubeId) {
    tasks.push(fetchRecommendationsSafe(item.youtubeId).catch(() => []));
  }
  if (item.provider === "jamendo" && item.providerTrackId) {
    tasks.push(fetchJamendoSimilar(item.providerTrackId, 20).catch(() => []));
  }
  if (item.provider === "audius" && genre) {
    tasks.push(fetchAudiusTrending(audiusGenreFor(genre) || genre, 20).catch(() => []));
  }

  tasks.push(fetchCrossPlatformRelated(item, 10).catch(() => []));

  if (artist) {
    // Los resultados libres por artista se filtran: si no nombran al artista, fuera.
    tasks.push(
      fetchFreeCatalogResults(artist, 12)
        .then((list) => list.filter((candidate) => queryMatchScore(artist, candidate) >= 0.6))
        .catch(() => [])
    );
    tasks.push(fetchYouTubeResults(`${artist} ${genre || "music"} mix`).catch(() => []));
  } else if (genre) {
    tasks.push(fetchMixedResults(`${genre} mix`).catch(() => []));
  }

  const buckets = await Promise.all(tasks);
  const merged = preferSongs(interleave(...buckets).filter((candidate) => !candidate?.isLiveRadio));

  return pickDiverseTracks(merged, {
    max: 30,
    blockedIds: new Set(item.id ? [item.id] : []),
    blockedSignatures: new Set([trackSignature(item)].filter(Boolean))
  });
}

function buildRadioRelatedQueries(qState) {
  const current = state.current || {};
  const artist = artistHint(current);
  const seed = normalizeText(qState.searchSeed || "").toLowerCase();
  const cycle = Number(qState.growthCycle || 0);
  const genres = Array.from(radioGenreProfile(current));
  const primaryGenre = genreLabel[genres[0]] || genres[0] || "pop";
  const secondaryGenre = genreLabel[genres[1]] || genres[1] || "";
  const flavors = ["mix", "playlist", "radio", "best songs", "top tracks", "similar artists"];
  const flavor = flavors[cycle % flavors.length];
  const queryBase = [];

  if (artist) {
    queryBase.push(`artists similar to ${artist}`);
    queryBase.push(`${artist} ${primaryGenre} ${flavor}`);
    queryBase.push(`${artist} radio mix`);
  }

  queryBase.push(`${primaryGenre} ${flavor}`);
  if (secondaryGenre) queryBase.push(`${secondaryGenre} mix`);
  if (seed && artist && !seed.includes(artist) && cycle % 3 === 0) {
    queryBase.push(`${seed} ${primaryGenre} ${flavor}`);
  }
  queryBase.push(`${primaryGenre} music mix ${new Date().getFullYear()}`);
  queryBase.push(`${primaryGenre} songs playlist`);

  const seen = new Set();
  return queryBase
    .map((q) => normalizeText(q).trim())
    .filter((q) => {
      const key = q.toLowerCase();
      if (!q || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

async function injectRadioFromQueryVariations(qState, related, existing, played, minAhead, existingSignatures = new Set()) {
  const queries = buildRadioRelatedQueries(qState);
  const artistCounts = artistCountsOf(related);
  const guard = createDuplicateGuard(existingSignatures);
  let appended = 0;
  for (const query of queries) {
    const candidates = await fetchMixedResults(query).catch(() => []);
    const diverse = pickDiverseTracks(candidates, {
      max: Math.max(10, minAhead),
      blockedSignatures: existingSignatures,
      blockedIds: existing,
      artistCounts,
      maxPerArtist: RADIO_MAX_PER_ARTIST
    });
    for (const item of diverse) {
      if (!item?.id || existing.has(item.id) || played.has(item.id)) continue;
      if (guard.has(item)) continue;
      related.push(markAsRadioAdded(item));
      existing.add(item.id);
      guard.add(item);
      bumpArtistCount(artistCounts, item);
      const sig = trackSignature(item);
      if (sig) existingSignatures.add(sig);
      appended += 1;
      if (appended >= Math.max(10, minAhead)) break;
    }
    if (appended >= Math.max(10, minAhead)) break;
  }
  qState.growthCycle = Number(qState.growthCycle || 0) + 1;
  return appended;
}

// La cola sigue a la pista en reproduccion, no a la busqueda inicial.
async function reseedRadioFromCurrent(insertCount = 6) {
  if (state.source !== "online" || !isRadioPlayable(state.current)) return;
  const qState = onlineQueueState();
  const currentId = state.current.id;
  if (!currentId || qState.reseeding || qState.reseedSeedId === currentId) return;

  const related = qState.related;
  if (!Array.isArray(related) || !related.length) return;

  qState.reseedSeedId = currentId;
  qState.reseeding = true;
  try {
    const rec = await fetchRelatedForItem(state.current);
    if (!rec.length) return;

    const existing = new Set(related.map((x) => x.id));
    const played = new Set([...(qState.playedIds || []), ...(qState.blockedIds || [])]);
    const signatures = new Set((qState.playedSignatures || []).filter(Boolean));
    related.forEach((item) => {
      const sig = trackSignature(item);
      if (sig) signatures.add(sig);
    });

    const fresh = pickDiverseTracks(
      rec
        .filter((r) => r?.id && !existing.has(r.id) && !played.has(r.id))
        .sort((a, b) => onlineSimilarityScore(state.current, b) - onlineSimilarityScore(state.current, a)),
      {
        max: insertCount,
        blockedSignatures: signatures,
        blockedIds: existing,
        artistCounts: artistCountsOf(related),
        maxPerArtist: RADIO_MAX_PER_ARTIST
      }
    ).map(markAsRadioAdded);

    if (!fresh.length) return;

    const known = nowIndex();
    const idx = related[known]?.id === currentId ? known : related.findIndex((x) => x.id === currentId);
    related.splice(idx >= 0 ? idx + 1 : 0, 0, ...fresh);
    state.queue[state.mode][state.source] = related;
    if (idx >= 0) setNowIndex(idx);
    renderQueue();
    updateOnlineHint(`Radio: +${fresh.length} relacionadas con lo que suena.`);
  } finally {
    qState.reseeding = false;
  }
}

async function ensureOnlineQueueGrowth(minAhead = 5, minTotal = 40) {
  if (state.source !== "online" || !isRadioPlayable(state.current)) return;
  const qState = onlineQueueState();
  if (qState.loading) return;

  const related = qState.related;
  if (!Array.isArray(related) || !related.length) return;

  const idx = Math.max(0, nowIndex());
  const ahead = related.length - (idx + 1);
  if (ahead >= minAhead && related.length >= minTotal) return;

  if (!Array.isArray(qState.seedTrail)) qState.seedTrail = [];

  // La pista en reproduccion manda: la cola crece a partir de lo que suena ahora.
  const seedCandidates = uniqueItems([
    state.current,
    related[idx],
    related[idx + 1],
    related[related.length - 1],
    ...qState.results.slice(0, 4)
  ]).filter(isRadioPlayable);

  const existing = new Set(related.map((x) => x.id));
  const played = new Set([...(qState.playedIds || []), ...(qState.blockedIds || [])]);
  const existingSignatures = new Set((qState.playedSignatures || []).filter(Boolean));
  related.forEach((item) => {
    const sig = trackSignature(item);
    if (sig) existingSignatures.add(sig);
  });
  const artistCounts = artistCountsOf(related);
  const guard = createDuplicateGuard(existingSignatures);
  let appended = 0;
  const targetAppend = Math.max(6, minAhead * 2);

  qState.loading = true;
  updateRadioGrowingIndicator();
  try {
    for (const seed of seedCandidates) {
      if (!isRadioPlayable(seed)) continue;
      if (qState.seedTrail.includes(seed.id) && appended > 0) continue;

      const rec = await fetchRelatedForItem(seed);
      if (!rec.length) continue;

      const diverseRec = pickDiverseTracks(rec, {
        max: targetAppend,
        blockedSignatures: existingSignatures,
        blockedIds: existing,
        artistCounts,
        maxPerArtist: RADIO_MAX_PER_ARTIST
      });

      const ranked = diverseRec
        .filter((r) => r?.id && !played.has(r.id))
        .map((r) => ({
          item: r,
          score: onlineSimilarityScore(state.current, r) + (onlineSimilarityScore(seed, r) * 0.7)
        }))
        .sort((a, b) => b.score - a.score);

      if (!ranked.length) continue;

      qState.seedTrail = [seed.id, ...qState.seedTrail.filter((id) => id !== seed.id)].slice(0, 18);
      qState.lastSeedId = seed.id;

      // Sin afinidad no entra: la cola se rellena despues con las consultas por genero.
      const candidates = ranked.map((x) => ({ item: x.item, strong: x.score >= 0 }));

      for (const { item, strong } of candidates) {
        if (appended >= targetAppend || !strong) break;
        if (existing.has(item.id) || played.has(item.id)) continue;
        if (guard.has(item)) continue;
        if (artistIsSaturated(artistCounts, item)) continue;
        related.push(markAsRadioAdded(item));
        existing.add(item.id);
        guard.add(item);
        bumpArtistCount(artistCounts, item);
        const sig = trackSignature(item);
        if (sig) existingSignatures.add(sig);
        appended += 1;
      }

      if (appended >= targetAppend) break;
    }

    if (!appended) {
      appended += await injectRadioFromQueryVariations(qState, related, existing, played, minAhead, existingSignatures);
    }

    if (!appended) {
      const fromResults = pickDiverseTracks(
        relatedToCurrent(qState.results || []).filter((r) => r?.id && !played.has(r.id)),
        {
          max: Math.max(6, minAhead),
          blockedSignatures: existingSignatures,
          blockedIds: existing
        }
      );
      fromResults.forEach((item) => {
        related.push(markAsRadioAdded(item));
        existing.add(item.id);
        const sig = trackSignature(item);
        if (sig) existingSignatures.add(sig);
        appended += 1;
      });
    }

    if (!appended) {
      const fromDiscover = pickDiverseTracks(
        relatedToCurrent(state.discoverCache[state.mode]?.online || []).filter((r) => r?.id && !played.has(r.id)),
        {
          max: Math.max(6, minAhead),
          blockedSignatures: existingSignatures,
          blockedIds: existing
        }
      );
      fromDiscover.forEach((item) => {
        related.push(markAsRadioAdded(item));
        existing.add(item.id);
        const sig = trackSignature(item);
        if (sig) existingSignatures.add(sig);
        appended += 1;
      });
    }

    if (!appended && state.current?.title) {
      const hint = artistHint(state.current) || "";
      const genre = genreLabel[Array.from(radioGenreProfile(state.current))[0]] || "pop";
      const query = hint ? `${hint} ${genre} mix` : `${genre} music mix`;
      const more = await fetchMixedResults(query).catch(() => []);
      const fallback = pickDiverseTracks(
        relatedToCurrent(more).filter((r) => r?.id && !played.has(r.id)),
        {
          max: Math.max(8, minAhead),
          blockedSignatures: existingSignatures,
          blockedIds: existing
        }
      );
      fallback.forEach((item) => {
        related.push(markAsRadioAdded(item));
        existing.add(item.id);
        const sig = trackSignature(item);
        if (sig) existingSignatures.add(sig);
        appended += 1;
      });
    }

    if (!appended) {
      const fromFallback = pickDiverseTracks(
        getFallbackCatalogForMood(state.selectedMood).filter((r) => r?.id && !played.has(r.id)),
        {
          max: Math.max(4, Math.floor(minAhead / 2)),
          blockedSignatures: existingSignatures,
          blockedIds: existing
        }
      );
      fromFallback.forEach((item) => {
        related.push(markAsRadioAdded(item));
        existing.add(item.id);
        const sig = trackSignature(item);
        if (sig) existingSignatures.add(sig);
        appended += 1;
      });
    }

    if (!appended) {
      updateOnlineHint("Radio creciendo: sin nuevas relacionadas en este intento.");
      return;
    }

    updateOnlineHint(`Radio agrego +${appended} relacionadas.`);

    state.queue[state.mode][state.source] = related;
    renderQueue();
  } finally {
    qState.loading = false;
    updateRadioGrowingIndicator();
  }
}

function updatePrimaryPlayButton() {
  if (!refs.playBtn) return;
  const playing = Boolean(state.current) && state.isPlaying;
  refs.playBtn.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
  refs.playBtn.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
  refs.playBtn.title = playing ? "Pausar" : "Reproducir";
}

function updateShuffleUi() {
  if (refs.shuffleControlBtn) {
    refs.shuffleControlBtn.classList.toggle("is-active", state.shuffle);
    refs.shuffleControlBtn.setAttribute("aria-pressed", String(state.shuffle));
    refs.shuffleControlBtn.textContent = state.shuffle ? "Shuffle on" : "Shuffle off";
  }
}

function updateRepeatUi() {
  if (!refs.repeatBtn) return;
  refs.repeatBtn.classList.toggle("is-active", state.repeatMode !== "off");
  refs.repeatBtn.setAttribute("aria-pressed", String(state.repeatMode !== "off"));
  if (state.repeatMode === "one") {
    refs.repeatBtn.textContent = "Repeat 1";
    return;
  }
  if (state.repeatMode === "all") {
    refs.repeatBtn.textContent = "Repeat all";
    return;
  }
  refs.repeatBtn.textContent = "Repeat off";
}

function currentShareUrl() {
  if (!state.current) return "";
  if (state.current.kind === "youtube" && state.current.youtubeId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(state.current.youtubeId)}`;
  }
  return "";
}

async function shareCurrentTrack() {
  const url = currentShareUrl();
  if (!url || !state.current) return;
  const payload = {
    title: state.current.title || "Reproductor Duo",
    text: state.current.subtitle || "",
    url
  };

  if (navigator.share) {
    try {
      await navigator.share(payload);
      return;
    } catch (_) {
      // Fall back to copy.
    }
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      updateOnlineHint("Enlace copiado al portapapeles.");
      return;
    } catch (_) {
      // Fall back below.
    }
  }

  window.prompt("Copia este enlace:", url);
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

function extractYouTubeIdFromUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./i, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
    }

    if (host.endsWith("youtube.com")) {
      const watchId = url.searchParams.get("v") || "";
      if (/^[A-Za-z0-9_-]{11}$/.test(watchId)) return watchId;
      const shortsMatch = /\/shorts\/([A-Za-z0-9_-]{11})/.exec(url.pathname);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch (_) {
    return "";
  }

  return "";
}

function normalizeYouTubeResult(videoId, title, subtitle) {
  return {
    id: `yt-${videoId}`,
    youtubeId: videoId,
    title: normalizeText(title || "Sin titulo"),
    subtitle: normalizeText(subtitle || "YouTube - Busqueda web"),
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    kind: "youtube"
  };
}

function decodeDuckDuckGoRedirect(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const target = url.searchParams.get("uddg");
    if (target) return decodeURIComponent(target);
  } catch (_) {
    return rawUrl;
  }

  return rawUrl;
}

function buildDuckDuckGoQuery(query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return "";
  return `site:youtube.com ${trimmed}`;
}

function buildYouTubeSearchQuery(query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return "";
  return `${trimmed} youtube`;
}

function buildYouTubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function parseYouTubeHtmlResults(html) {
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  const items = [];
  const seen = new Set();
  const titleNodes = Array.from(doc.querySelectorAll('a#video-title'));

  titleNodes.forEach((node) => {
    const href = node.getAttribute("href") || "";
    const rawUrl = href.startsWith("http") ? href : `https://www.youtube.com${href}`;
    const videoId = extractYouTubeIdFromUrl(rawUrl);
    if (!videoId || seen.has(videoId)) return;
    seen.add(videoId);

    const title = normalizeText(node.textContent || node.getAttribute("title") || "Sin titulo");
    const channelNode = node.closest("ytd-video-renderer")?.querySelector("ytd-channel-name a, .yt-simple-endpoint.yt-formatted-string") || null;
    const channel = normalizeText(channelNode?.textContent || "YouTube");
    items.push(normalizeYouTubeResult(videoId, title, `${channel} - Busqueda web`));
  });

  if (items.length) return items;

  const scriptText = doc.documentElement?.innerHTML || "";
  const fallbackPattern = /"videoId":"([A-Za-z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"([^"]+)"\}\]\}/gs;
  for (const match of scriptText.matchAll(fallbackPattern)) {
    const videoId = match[1];
    const title = match[2];
    if (!videoId || seen.has(videoId)) continue;
    seen.add(videoId);
    items.push(normalizeYouTubeResult(videoId, title, "YouTube - Busqueda web"));
  }

  return items;
}

function parseDuckDuckGoResults(markdown) {
  const text = String(markdown || "");
  const items = [];
  const seen = new Set();
  const linkPattern = /\[(.*?)\]\((https?:\/\/duckduckgo\.com\/l\/\?uddg=[^)]+)\)/gi;

  for (const match of text.matchAll(linkPattern)) {
    const title = normalizeText(match[1] || "");
    const targetUrl = decodeDuckDuckGoRedirect(match[2] || "");
    const videoId = extractYouTubeIdFromUrl(targetUrl);
    if (!videoId || seen.has(videoId)) continue;
    seen.add(videoId);
    items.push(normalizeYouTubeResult(videoId, title, "YouTube - Busqueda web"));
  }

  const directPattern = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/gi;
  for (const match of text.matchAll(directPattern)) {
    const videoId = match[1];
    if (!videoId || seen.has(videoId)) continue;
    seen.add(videoId);
    items.push(normalizeYouTubeResult(videoId, `YouTube video ${videoId}`, "YouTube - Busqueda web"));
  }

  return items;
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
  if (state.source === "local") {
    state.queue[state.mode].local = [...state.library[state.mode].local];
  }
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

  if (source === "local") {
    state.queue[state.mode].local = [...state.library[state.mode].local];
    setResultsVisible(state.library[state.mode].local.length > 0);
  }

  updateOnlineHintByContext();
  updateMediaSurface();
  loadDiscovery();
  renderAll();
}

function updateMediaSurface() {
  const isVideoMode = state.mode === "video";
  const active = state.current;
  refs.videoFrameWrap.classList.remove("audio-host");
  refs.videoFrameWrap.hidden = !isVideoMode;
  refs.musicArt.hidden = isVideoMode;

  if (!active) {
    refs.htmlPlayer.style.display = "none";
    return;
  }

  if (active.kind === "local") {
    // El video local necesita el contenedor visible aunque estemos en modo musica.
    refs.htmlPlayer.style.display = isVideoMode ? "block" : "none";
    if (isVideoMode) {
      refs.videoFrameWrap.hidden = false;
      refs.musicArt.hidden = true;
    }
    return;
  }

  if (active.kind === "stream") {
    refs.htmlPlayer.style.display = "none";
    refs.videoFrameWrap.hidden = true;
    refs.musicArt.hidden = false;
    return;
  }

  refs.htmlPlayer.style.display = "none";
  if (active.kind === "youtube" && !isVideoMode) {
    // Keep YouTube iframe mounted for reliable audio playback in music mode.
    refs.videoFrameWrap.hidden = false;
    refs.videoFrameWrap.classList.add("audio-host");
  }
}

function providerLabel(item) {
  if (!item) return "";
  if (item.kind === "local") return "Local";
  if (item.provider === "audius") return "Audius";
  if (item.provider === "jamendo") return "Jamendo";
  if (item.provider === "openverse") return "Openverse";
  if (item.provider === "radio") return "Radio";
  if (item.kind === "youtube") return "YouTube";
  return "";
}

// Origen del descubrimiento (Deezer/iTunes/Last.fm) aunque el audio venga de otra fuente.
function seedOriginLabel(item) {
  const map = { deezer: "Deezer", itunes: "iTunes", lastfm: "Last.fm" };
  return map[String(item?.seedOrigin || "").toLowerCase()] || "";
}

function providerTag(item) {
  const label = providerLabel(item);
  const origin = seedOriginLabel(item);
  const tags = [];
  if (label) tags.push(`<span class="source-tag source-${label.toLowerCase().replace(/\./g, "")}">${label}</span>`);
  if (origin) tags.push(`<span class="source-tag source-${origin.toLowerCase().replace(/\./g, "")}">${origin}</span>`);
  return tags.join("");
}

const HISTORY_KEY = "duo.history";
const SEARCH_KEY = "duo.searches";
const HISTORY_LIMIT = 60;
const SEARCH_LIMIT = 18;

function readStoredList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeStoredList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (_) {
    // Ignore storage failures.
  }
}

function rememberPlayedItem(item) {
  if (!item?.id) return;
  const isLocal = item.kind === "local";
  const entry = {
    id: item.id,
    kind: item.kind || "youtube",
    provider: item.provider || "",
    title: item.title || "",
    subtitle: item.subtitle || "",
    thumbnail: isLocal ? "" : (item.thumbnail || ""),
    youtubeId: item.youtubeId || "",
    url: isLocal ? "" : (item.url || ""),
    genre: item.genre || "",
    mode: state.mode,
    at: Date.now()
  };
  writeStoredList(
    HISTORY_KEY,
    [entry, ...readStoredList(HISTORY_KEY).filter((x) => x?.id !== entry.id)].slice(0, HISTORY_LIMIT)
  );
}

function rememberSearchTerm(term) {
  const query = normalizeText(term);
  if (!query) return;
  writeStoredList(
    SEARCH_KEY,
    [query, ...readStoredList(SEARCH_KEY).filter((x) => String(x).toLowerCase() !== query.toLowerCase())].slice(0, SEARCH_LIMIT)
  );
}

// Las pistas locales guardan solo el id: su blob url se rehace al restaurar la libreria.
function historyEntries(mode = null) {
  const localTracks = [...state.library.music.local, ...state.library.video.local];
  return readStoredList(HISTORY_KEY)
    .filter((x) => x?.id && (!mode || x.mode === mode))
    .map((entry) => (entry.kind === "local"
      ? localTracks.find((track) => track.id === entry.id) || null
      : entry))
    .filter(Boolean);
}

function historyArtists(limit = 12) {
  const seen = [];
  historyEntries().forEach((item) => {
    const artist = artistHint(item);
    if (artist && !seen.includes(artist)) seen.push(artist);
  });
  return seen.slice(0, limit);
}

function setView(view) {
  state.view = view;
  const map = { home: refs.navHome, explore: refs.navExplore, library: refs.navLibrary };
  Object.entries(map).forEach(([key, btn]) => {
    if (btn) btn.classList.toggle("is-active", key === view);
  });

  if (refs.discoverSection) refs.discoverSection.hidden = view === "library";
  if (refs.discoverTitle) {
    refs.discoverTitle.textContent = view === "explore" ? "Explorar" : "Descubrir";
  }

  if (view === "library") {
    renderLibraryView();
    setResultsVisible(true);
    refs.resultsSection?.scrollIntoView({ block: "start" });
    return;
  }

  if (refs.libraryExtras) refs.libraryExtras.hidden = true;
  if (refs.resultsTitle) refs.resultsTitle.textContent = "Resultados / Biblioteca";
  renderLibrary();
  setResultsVisible(nowLibrary().length > 0);

  if (view === "explore") {
    loadDiscovery();
    refs.discoverSection?.scrollIntoView({ block: "start" });
  }
}

function renderLibraryView() {
  const items = historyEntries(state.mode);
  if (refs.resultsTitle) {
    refs.resultsTitle.textContent = state.mode === "music" ? "Tu biblioteca de musica" : "Tu biblioteca de videos";
  }

  renderLibrary(items.length ? items : []);
  if (!refs.libraryExtras) return;

  const searches = readStoredList(SEARCH_KEY);
  const artists = historyArtists();
  const chips = (title, values) => (values.length
    ? `<div class="library-group">
        <h3>${title}</h3>
        <div class="library-chips">
          ${values.map((v) => `<button class="chip" data-query="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join("")}
        </div>
      </div>`
    : "");

  const html = `${chips("Artistas escuchados", artists)}${chips("Busquedas recientes", searches)}`;
  refs.libraryExtras.innerHTML = html
    || `<p class="online-hint">Aun no hay historial. Reproduce algo y aparecera aqui.</p>`;
  refs.libraryExtras.hidden = false;
}

function runLibraryQuery(query) {
  if (!query) return;
  if (state.source === "local") {
    refs.localQuery.value = query;
    setView("home");
    filterLocal();
    return;
  }
  refs.onlineQuery.value = query;
  setView("home");
  searchOnline();
}

// Sustituye la pista de YouTube por una equivalente de los catalogos libres,
// que se reproducen sin anuncios y sin bloqueo en segundo plano.
async function switchCurrentToFreeCatalog() {
  const current = state.current;
  if (!current || current.kind !== "youtube") {
    updateOnlineHint("Esta pista ya viene de un catalogo libre.");
    return;
  }
  if (!freeCatalogsEnabled()) {
    updateOnlineHint("Los catalogos libres estan desactivados o no aplican en modo video.");
    return;
  }

  const artist = artistHint(current);
  const core = trackTokens(current).join(" ");
  const queries = [
    normalizeText(current.title),
    artist ? `${core} ${artist}` : "",
    core
  ].filter(Boolean);

  updateOnlineHint("Buscando esta cancion en catalogos sin anuncios...");

  for (const query of queries) {
    const found = await fetchFreeCatalogResults(query, 12).catch(() => []);
    // Solo vale la misma cancion: antes se aceptaba el primer resultado y sonaba
    // cualquier otra cosa del catalogo libre.
    const match = found.find((item) => tokensAreNearDuplicate(trackTokens(item), trackTokens(current)));
    if (!match) continue;

    const queue = nowQueue();
    const idx = Math.max(0, nowIndex());
    queue.splice(idx + 1, 0, match);
    state.queue[state.mode][state.source] = queue;
    if (isOnlineQueueMode()) onlineQueueState().related = queue;
    renderQueue();
    playItem(match, idx + 1);
    updateOnlineHint(`Cambiado a ${providerLabel(match)}: sin anuncios.`);
    return;
  }

  updateOnlineHint("No hay una version equivalente en los catalogos libres.");
}

function renderLibrary(items = null) {
  const list = items || nowLibrary();
  renderedLibraryItems = list;
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
    const radioTag = item.addedByRadio ? `<span class="radio-added-tag">Radio la agrego</span>` : "";
    li.innerHTML = `
      <div class="track-head">
        ${thumb}
        <div>
          <div class="title-row">
            <div class="title">${escapeHtml(item.title)}</div>
            ${radioTag}
          </div>
          <div class="sub">${providerTag(item)}${escapeHtml(item.subtitle || "")}</div>
        </div>
      </div>
      <div class="actions">
        <button class="ghost" data-action="play" data-id="${item.id}" aria-label="Reproducir" title="Reproducir">▶</button>
        <button class="ghost" data-action="next" data-id="${item.id}" aria-label="Reproducir a continuacion" title="Reproducir a continuacion">⏭</button>
        <button class="ghost" data-action="add" data-id="${item.id}" aria-label="Agregar a cola" title="Agregar al final de la cola">＋</button>
      </div>
    `;
    refs.libraryList.appendChild(li);
  });
}

function renderQueue() {
  const queue = queueItemsForRender();
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
    li.dataset.pos = String(i);
    li.dataset.id = item.id;
    const reordering = state.queueReorderId === item.id;
    if (reordering) li.classList.add("is-reordering");
    const activeInRelated = nowQueue()[idx]?.id === item.id;
    const activeInResults = state.current?.id === item.id;
    if (activeInRelated || activeInResults) {
      li.style.border = "2px solid #0f4c5c";
    }
    const thumb = item.thumbnail
      ? `<img class="thumb" src="${escapeHtml(item.thumbnail)}" alt="portada" loading="lazy" />`
      : `<div class="thumb placeholder">${state.mode === "music" ? "MUS" : "VID"}</div>`;
    const actions = reordering
      ? `<button class="ghost" data-action="moveUp" data-pos="${i}" aria-label="Subir" title="Subir">▲</button>
        <button class="ghost" data-action="moveDown" data-pos="${i}" aria-label="Bajar" title="Bajar">▼</button>
        <button class="ghost" data-action="playNext" data-pos="${i}" aria-label="Poner en el turno" title="Poner en el turno">⏭</button>
        <button class="ghost" data-action="doneOrder" data-pos="${i}" aria-label="Listo" title="Listo">✓</button>`
      : `${canReorderQueue() ? `<button class="ghost" data-action="order" data-pos="${i}" aria-label="Cambiar el orden" title="Cambiar el orden">⇅</button>` : ""}
        <button class="ghost" data-action="jump" data-pos="${i}" aria-label="Ir a esta pista" title="Ir">⏵</button>
        <button class="ghost" data-action="remove" data-pos="${i}" aria-label="Quitar" title="Quitar">✕</button>`;
    li.innerHTML = `
      <div class="track-head">
        ${thumb}
        <div>
          <div class="title">${escapeHtml(item.title)}</div>
          <div class="sub">${providerTag(item)}${escapeHtml(item.subtitle || "")}</div>
        </div>
      </div>
      <div class="actions">
        ${actions}
      </div>
    `;
    refs.queueList.appendChild(li);
  });
}

function renderAll() {
  if (state.view === "library") {
    renderLibraryView();
  } else {
    renderLibrary();
  }
  updateQueueViewUi();
  renderQueue();
}

function normalizeCatalogItem(item) {
  return {
    ...item,
    id: item.id || `fallback-${item.youtubeId}`,
    kind: item.kind || "youtube",
    title: normalizeText(item.title || "Sin titulo"),
    subtitle: normalizeText(item.subtitle || "")
  };
}

function getFallbackCatalogForMood(mood) {
  const filtered = fallbackCatalog.filter((item) => item.moods.includes(mood));
  const source = filtered.length ? filtered : fallbackCatalog;
  return source.map(normalizeCatalogItem);
}

function searchFallbackCatalog(query) {
  const q = normalizeText(query).toLowerCase();
  const scored = fallbackCatalog
    .map((item) => {
      const hay = `${item.title} ${item.subtitle} ${item.moods.join(" ")}`.toLowerCase();
      const score = !q ? 1 : hay.includes(q) ? 3 : keywordsFromTitle(item.title).some((k) => q.includes(k) || k.includes(q)) ? 2 : 0;
      return { item: normalizeCatalogItem(item), score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
  return scored.length ? scored : fallbackCatalog.slice(0, 14).map(normalizeCatalogItem);
}

function setResultsVisible(visible) {
  if (!refs.resultsSection) return;
  refs.resultsSection.hidden = !visible;
}

function setPlayerOpen(open) {
  if (!refs.nowPlayingSection) return;
  refs.nowPlayingSection.hidden = !open;
  if (open) {
    requestAnimationFrame(() => applyPlayerAdaptiveLayout());
  }
}

function isPlayerOpen() {
  return Boolean(refs.nowPlayingSection && !refs.nowPlayingSection.hidden);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function applyPlayerAdaptiveLayout() {
  const panel = refs.nowPlayingSection;
  if (!panel) return;
  fitPlayerToViewport();
  const w = panel.clientWidth;
  const h = panel.clientHeight;
  const compactByViewport = window.innerWidth < 1024;
  const tightByViewport = window.innerWidth < 760;
  panel.classList.toggle("is-compact", compactByViewport || w < 720 || h < 420);
  panel.classList.toggle("is-tight", tightByViewport || w < 560 || h < 340);
}

function fitPlayerToViewport() {
  const panel = refs.nowPlayingSection;
  if (!panel) return;

  const margin = 8;
  const maxW = Math.max(320, window.innerWidth - (margin * 2));
  const maxH = Math.max(300, window.innerHeight - 92);

  if (panel.offsetWidth > maxW) {
    panel.style.width = `${maxW}px`;
  }

  if (panel.offsetHeight > maxH) {
    panel.style.height = `${maxH}px`;
  }

  const rect = panel.getBoundingClientRect();
  let nextLeft = rect.left;
  let nextTop = rect.top;

  if (rect.right > window.innerWidth - margin) {
    nextLeft -= (rect.right - (window.innerWidth - margin));
  }
  if (rect.left < margin) {
    nextLeft = margin;
  }

  if (rect.bottom > window.innerHeight - margin) {
    nextTop -= (rect.bottom - (window.innerHeight - margin));
  }
  if (rect.top < margin) {
    nextTop = margin;
  }

  panel.style.left = `${Math.round(nextLeft)}px`;
  panel.style.top = `${Math.round(nextTop)}px`;
  panel.style.bottom = "auto";
  panel.style.transform = "none";
}

function centerPlayerWindow() {
  const panel = refs.nowPlayingSection;
  if (!panel) return;
  fitPlayerToViewport();
  const rect = panel.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const left = Math.round((window.innerWidth - rect.width) / 2);
  const top = Math.round((window.innerHeight - rect.height) / 2);
  panel.style.left = `${Math.max(8, left)}px`;
  panel.style.top = `${Math.max(8, top)}px`;
  panel.style.bottom = "auto";
  panel.style.transform = "none";
}

function resetPlayerWindow() {
  const panel = refs.nowPlayingSection;
  if (!panel) return;
  panel.style.width = "";
  panel.style.height = "";
  panel.style.left = "32px";
  panel.style.top = "86px";
  panel.style.bottom = "auto";
  panel.style.transform = "none";
  fitPlayerToViewport();
  requestAnimationFrame(() => {
    centerPlayerWindow();
    applyPlayerAdaptiveLayout();
  });
}

function enablePlayerWindowInteraction() {
  const panel = refs.nowPlayingSection;
  const head = refs.playerHead;
  if (!panel || !head || !window.PointerEvent) return;

  let dragging = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const onPointerMove = (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const rect = panel.getBoundingClientRect();
    const nextLeft = clamp(startLeft + dx, 0, Math.max(0, window.innerWidth - rect.width));
    const nextTop = clamp(startTop + dy, 0, Math.max(0, window.innerHeight - rect.height));
    panel.style.left = `${Math.round(nextLeft)}px`;
    panel.style.top = `${Math.round(nextTop)}px`;
    panel.style.bottom = "auto";
    panel.style.transform = "none";
  };

  const stopDrag = (event) => {
    if (!dragging) return;
    if (event && event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    head.classList.remove("dragging");
    head.releasePointerCapture?.(event.pointerId);
  };

  head.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest("button,input,select,label,a")) return;
    const rect = panel.getBoundingClientRect();
    dragging = true;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    head.classList.add("dragging");
    head.setPointerCapture?.(event.pointerId);
  });

  head.addEventListener("pointermove", onPointerMove);
  head.addEventListener("pointerup", stopDrag);
  head.addEventListener("pointercancel", stopDrag);

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => applyPlayerAdaptiveLayout());
    ro.observe(panel);
  }

  window.addEventListener("resize", applyPlayerAdaptiveLayout);
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
        <div class="sub">${providerTag(item)}${escapeHtml(item.subtitle || "")}</div>
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

// En Explorar las sugerencias se amplian con lo que el usuario ya escucho o busco.
function exploreSeedQueries() {
  const genre = genreLabel[Array.from(radioGenreProfile(state.current || {}))[0]] || "";
  const rotation = state.discoverRotation;
  const seeds = [];
  rotateItems(historyArtists(6), rotation).slice(0, 2).forEach((artist) => {
    seeds.push(genre ? `${artist} ${genre} mix` : `${artist} mix`);
  });
  const searches = readStoredList(SEARCH_KEY);
  const lastSearch = pickRotating(searches, rotation);
  if (lastSearch) seeds.push(`${lastSearch} similar`);
  return seeds.slice(0, 3);
}

// Explorar tira de las plataformas de referencia usando el historial del usuario:
// artistas afines en Deezer, similares en Last.fm y catalogo de iTunes.
async function fetchHistoryCrossPlatform(rotation, limit = 8) {
  if (!metadataCatalogsEnabled()) return [];
  const artists = rotateItems(historyArtists(8), rotation).slice(0, 2);
  const lastSearch = pickRotating(readStoredList(SEARCH_KEY), rotation);
  const tasks = [];

  artists.forEach((artist) => {
    tasks.push(fetchDeezerRelatedSeeds(artist, 10).catch(() => []));
    tasks.push(fetchLastfmSimilarSeeds(artist, "", 12).catch(() => []));
    tasks.push(fetchItunesSeeds(artist, 10).catch(() => []));
  });
  if (lastSearch) tasks.push(fetchDeezerSeeds(lastSearch, 10).catch(() => []));
  if (!tasks.length) return [];

  const buckets = await Promise.all(tasks);
  return resolveSeedsToPlayable(rotateItems(uniqueSeeds(interleave(...buckets)), rotation), limit);
}

// La rotacion se guarda: al volver a entrar el descubrimiento no arranca igual.
function loadDiscoverRotation() {
  try {
    const stored = Number(localStorage.getItem(DISCOVER_ROTATION_KEY) || 0);
    return Number.isFinite(stored) ? stored : 0;
  } catch (_) {
    return 0;
  }
}

function saveDiscoverRotation(value) {
  try {
    localStorage.setItem(DISCOVER_ROTATION_KEY, String(value));
  } catch (_) {
    // Ignore storage failures.
  }
}

function pickRotating(list, offset) {
  if (!Array.isArray(list) || !list.length) return "";
  const index = ((offset % list.length) + list.length) % list.length;
  return list[index];
}

function discoverQueriesForMood(mood, rotation) {
  const pool = moodQueryPool[mood] || [moodQueries[mood] || "top music"];
  return [pickRotating(pool, rotation), pickRotating(pool, rotation + 3)].filter(Boolean);
}

function rememberDiscoverShown(items) {
  const ids = items.map((item) => item?.id).filter(Boolean);
  state.discoverShownIds = Array.from(new Set([...ids, ...state.discoverShownIds])).slice(0, DISCOVER_SHOWN_LIMIT);
}

// Ninguna fuente externa puede colgar el descubrimiento: pasado el limite se sigue.
function withTimeout(promise, ms, fallbackValue) {
  return Promise.race([
    Promise.resolve(promise).catch(() => fallbackValue),
    new Promise((resolve) => setTimeout(() => resolve(fallbackValue), ms))
  ]);
}

// Se prefiere lo que no se mostro en refrescos previos; si no alcanza, se rellena.
function finalizeDiscovery(pool, rotation, blockedIds) {
  const songs = preferSongs(pool);
  let combined = pickDiverseTracks(songs, {
    max: 30,
    blockedIds: blockedIds || new Set(state.discoverShownIds),
    maxPerArtist: 2
  });
  if (combined.length < 12) {
    combined = pickDiverseTracks(songs, { max: 30, maxPerArtist: 2 });
  }

  const rotated = rotateItems(combined, state.discoverSeed + rotation);
  state.discoverCache[state.mode].online = rotated;
  rememberDiscoverShown(rotated);
  renderDiscovery(rotated);
  return rotated;
}

async function loadDiscovery({ force = false } = {}) {
  if (!refs.discoverSection) return;
  if (state.discoverLoading && !force) return;

  const requestId = ++state.discoverRequestId;
  state.discoverRotation = (state.discoverRotation + 1) % 100000;
  saveDiscoverRotation(state.discoverRotation);
  const rotation = state.discoverRotation;

  // Cada refresco pide material distinto: antes el mismo lote cacheado volvia una y otra vez.
  const previous = state.discoverCache[state.mode][state.source === "local" ? "local" : "online"] || [];
  if (previous.length) {
    renderDiscovery(rotateItems(previous, rotation));
  }

  if (state.source === "local") {
    const local = state.library[state.mode].local;
    const combined = rotateItems(local, state.discoverSeed + rotation).slice(0, 24);
    state.discoverCache[state.mode].local = combined;
    if (requestId !== state.discoverRequestId) return;
    renderDiscovery(combined);
    return;
  }

  const fallback = getFallbackCatalogForMood(state.selectedMood);
  if (!previous.length) {
    // Algo visible desde el primer segundo mientras responden las APIs.
    renderDiscovery(rotateItems(fallback, rotation).slice(0, 24));
  }

  const [query, altQuery] = discoverQueriesForMood(state.selectedMood, rotation);
  const moodGenre = genreLabel[Array.from(radioGenreProfile(state.current || {}))[0]] || "";
  const seedTerm = pickRotating(moodSeedTerms[state.selectedMood] || ["pop"], rotation);
  const radioTag = moodRadioTags[state.selectedMood] || "pop";

  state.discoverLoading = true;
  // Lo ya visto se congela aqui: la fase 2 no debe descartar lo que pinto la fase 1.
  const alreadyShown = new Set(state.discoverShownIds);
  try {
    // Fase 1: fuentes rapidas, se pinta en cuanto contestan.
    // "official music video" evita que YouTube devuelva solo recopilatorios de una hora.
    const [results, freeTracks, openverse, trending, stations] = await Promise.all([
      withTimeout(fetchYouTubeResults(`${query} official music video`), 20000, []),
      freeCatalogsEnabled() ? withTimeout(fetchJamendoByTag(seedTerm, 12), 10000, []) : [],
      freeCatalogsEnabled() ? withTimeout(fetchOpenverseResults(seedTerm, 8), 10000, []) : [],
      freeCatalogsEnabled() ? withTimeout(fetchAudiusTrending(audiusGenreFor(moodGenre || seedTerm), 12), 10000, []) : [],
      withTimeout(fetchLiveRadioStations({ tag: radioTag, limit: 3 }), 8000, [])
    ]);
    if (requestId !== state.discoverRequestId) return;

    const basePool = interleave(results, freeTracks, openverse, trending).concat(stations, fallback);
    finalizeDiscovery(basePool, rotation, alreadyShown);

    // Fase 2: catalogo cruzado (Deezer/Last.fm/iTunes) resuelto a fuentes reproducibles.
    const [chartSeeds, tagSeeds, itunesSeeds, moreResults] = await Promise.all([
      withTimeout(fetchDeezerChartSeeds(30), 8000, []),
      withTimeout(fetchLastfmTagSeeds(seedTerm, 20), 8000, []),
      withTimeout(fetchItunesSeeds(`${seedTerm} ${new Date().getFullYear()}`, 16), 8000, []),
      altQuery ? withTimeout(fetchYouTubeResults(`${altQuery} official music video`), 15000, []) : []
    ]);
    if (requestId !== state.discoverRequestId) return;

    // Las semillas rotan antes de resolverse: sin esto siempre salian las mismas.
    const crossPlatform = await withTimeout(
      resolveSeedsToPlayable(rotateItems(uniqueSeeds(interleave(chartSeeds, tagSeeds, itunesSeeds)), rotation), 8),
      25000,
      []
    );
    if (requestId !== state.discoverRequestId) return;

    const explore = state.view === "explore"
      ? (await Promise.all([
        ...exploreSeedQueries().map((q) => withTimeout(fetchMixedResults(q), 10000, [])),
        withTimeout(fetchHistoryCrossPlatform(rotation, 8), 25000, [])
      ])).flat()
      : [];
    if (requestId !== state.discoverRequestId) return;

    const seeded = isRadioPlayable(state.current) && !state.current?.isLiveRadio
      ? await withTimeout(fetchRelatedForItem(state.current), 12000, [])
      : [];
    if (requestId !== state.discoverRequestId) return;

    if (!crossPlatform.length && !explore.length && !seeded.length && !moreResults.length) return;

    finalizeDiscovery(
      interleave(results, crossPlatform, moreResults, freeTracks, openverse, trending, explore).concat(seeded, stations, fallback),
      rotation,
      alreadyShown
    );
  } catch (error) {
    if (requestId !== state.discoverRequestId) return;
    const fallback = getFallbackCatalogForMood(state.selectedMood);
    const combined = uniqueItems([...(state.discoverCache[state.mode].online || []), ...fallback]).slice(0, 24);
    renderDiscovery(rotateItems(combined, state.discoverSeed + rotation));
  } finally {
    state.discoverLoading = false;
  }
}

function keywordsFromTitle(text) {
  const stop = new Set(["official", "video", "lyrics", "audio", "ft", "feat", "the", "and", "mix"]);
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((x) => x.length > 2 && !stop.has(x));
}

function detectGenres(text) {
  const raw = normalizeText(text).toLowerCase();
  const found = new Set();
  if (!raw) return found;

  Object.entries(genreLexicon).forEach(([genre, words]) => {
    if (words.some((w) => raw.includes(w))) {
      found.add(genre);
    }
  });

  return found;
}

function radioGenreProfile(seed) {
  const qState = isOnlineQueueMode() ? onlineQueueState() : null;
  const signals = [
    seed?.title || "",
    seed?.subtitle || "",
    seed?.genre || "",
    qState?.searchSeed || "",
    moodQueries[state.selectedMood] || ""
  ].join(" ");

  const genres = detectGenres(signals);
  if (!genres.size && state.selectedMood === "Energia") genres.add("edm");
  if (!genres.size && state.selectedMood === "Relax") genres.add("lofi");
  if (!genres.size && state.selectedMood === "Concentracion") genres.add("lofi");
  if (!genres.size && state.selectedMood === "Fiesta") genres.add("reggaeton");
  if (!genres.size && state.selectedMood === "Triste") genres.add("pop");
  if (!genres.size && state.selectedMood === "Romantica") genres.add("pop");

  return genres;
}

function genreAffinityScore(seed, candidate) {
  const seedGenres = radioGenreProfile(seed);
  if (!seedGenres.size) return 0;
  const candidateGenres = detectGenres(`${candidate?.title || ""} ${candidate?.subtitle || ""} ${candidate?.genre || ""}`);
  if (!candidateGenres.size) return -0.4;

  let overlap = 0;
  seedGenres.forEach((g) => {
    if (candidateGenres.has(g)) overlap += 1;
  });

  if (!overlap) return -0.8;
  return overlap * 1.25;
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

function artistHint(item) {
  const subtitle = normalizeText(item?.subtitle || "");
  if (!subtitle) return "";
  return subtitle.split(" - ")[0].trim().toLowerCase();
}

function onlineSimilarityScore(seed, candidate) {
  let score = similarityScore(seed, candidate);
  const seedArtist = artistHint(seed);
  const candidateArtist = artistHint(candidate);
  score += genreAffinityScore(seed, candidate);

  if (seedArtist && candidateArtist) {
    if (seedArtist === candidateArtist) {
      score += 3;
    } else if (seedArtist.includes(candidateArtist) || candidateArtist.includes(seedArtist)) {
      score += 1;
    }
  }

  if (state.mode === "video" && /official|live|mv/i.test(candidate.title || "")) {
    score += 1;
  }

  return score;
}

function buildSmartQueue(seed, candidates) {
  const filtered = candidates.filter((x) => x.id !== seed.id);
  filtered.sort((a, b) => similarityScore(seed, b) - similarityScore(seed, a));
  return [seed, ...filtered.slice(0, 24)];
}

function buildOnlineQueue(seed, candidates) {
  const seedSig = trackSignature(seed);
  const blocked = new Set(seedSig ? [seedSig] : []);
  const blockedIds = new Set(seed?.id ? [seed.id] : []);
  const diverse = pickDiverseTracks(candidates, { max: 40, blockedSignatures: blocked, blockedIds });
  const scored = candidates
    .filter((x) => diverse.some((d) => d.id === x.id))
    .map((x) => ({ item: x, score: onlineSimilarityScore(seed, x) }))
    .sort((a, b) => b.score - a.score);

  const strong = scored.filter((x) => x.score >= 3).map((x) => x.item);
  if (strong.length) return [seed, ...strong.slice(0, 24)];

  const medium = scored.filter((x) => x.score >= 2).map((x) => x.item);
  if (medium.length) return [seed, ...medium.slice(0, 24)];

  return [seed];
}

async function startSmartPlayback(item, sourceItems = null) {
  const base = sourceItems || nowLibrary();
  const onlineRadio = state.source === "online" && isRadioPlayable(item);
  alternativeChain = { signature: "", count: 0 };

  if (onlineRadio) {
    const qState = onlineQueueState();
    const seedSig = trackSignature(item);
    qState.results = uniqueItems(base.length ? [...base] : [item]);
    qState.related = [item];
    qState.loading = false;
    qState.playedIds = [item.id];
    qState.playedSignatures = seedSig ? [seedSig] : [];
    qState.seedTrail = [];
    qState.lastSeedId = item.id || "";
    if (!qState.searchSeed) {
      qState.searchSeed = normalizeText(item.title || "");
    }
    qState.growthCycle = 0;
    qState.view = "related";
    qState.reseedSeedId = item.id || "";
    qState.reseeding = false;
    state.queue[state.mode][state.source] = [item];
  } else {
    const queue = buildSmartQueue(item, base);
    state.queue[state.mode][state.source] = queue.length ? queue : [item];
  }

  setNowIndex(0);
  updateQueueViewUi();
  renderQueue();
  playItem(item, 0);

  if (isRadioPlayable(item)) {
    const rec = await fetchRelatedForItem(item);
    if (rec.length) {
      const existing = new Set(nowQueue().map((x) => x.id));
      const fresh = rec.filter((r) => !existing.has(r.id) && onlineSimilarityScore(item, r) >= 2);
      if (onlineRadio) {
        const qState = onlineQueueState();
        const signatures = new Set();
        qState.related.forEach((x) => {
          const sig = trackSignature(x);
          if (sig) signatures.add(sig);
        });
        const picked = pickDiverseTracks(fresh, {
          max: 24,
          blockedSignatures: signatures,
          blockedIds: existing,
          artistCounts: artistCountsOf(qState.related),
          maxPerArtist: RADIO_MAX_PER_ARTIST
        }).map(markAsRadioAdded);
        if (picked.length) {
          qState.related.splice(1, 0, ...picked);
          state.queue[state.mode][state.source] = qState.related;
          updateOnlineHint(`Radio agrego +${picked.length} relacionadas.`);
        }
      } else {
        fresh.forEach((r) => nowQueue().push(r));
      }
      renderQueue();
    }
    ensureOnlineQueueGrowth(18, 52).catch(() => null);
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
  } else if (state.current?.kind !== "local" && state.isPlaying) {
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
  return renderedLibraryItems.find((x) => x.id === id)
    || nowLibrary().find((x) => x.id === id)
    || null;
}

function enqueue(item) {
  nowQueue().push(item);
  renderQueue();
}

function syncQueueReference(queue) {
  state.queue[state.mode][state.source] = queue;
  if (isOnlineQueueMode()) onlineQueueState().related = queue;
}

function syncNowIndexToCurrent() {
  const activeIndex = nowQueue().findIndex((x) => x.id === state.current?.id);
  if (activeIndex >= 0) setNowIndex(activeIndex);
}

// Coloca la pista justo despues de la que suena, sin duplicarla en la cola.
function playNextInQueue(item) {
  if (!item?.id) return;
  const queue = nowQueue();
  const currentIndex = queue.findIndex((x) => x.id === state.current?.id);

  const duplicate = queue.findIndex((x) => x.id === item.id);
  if (duplicate >= 0 && duplicate !== currentIndex) queue.splice(duplicate, 1);

  const anchor = queue.findIndex((x) => x.id === state.current?.id);
  const target = clamp((anchor >= 0 ? anchor : nowIndex()) + 1, 0, queue.length);
  queue.splice(target, 0, item);

  syncQueueReference(queue);
  syncNowIndexToCurrent();
  renderQueue();
  updateOnlineHint(`"${item.title}" suena a continuacion.`);
}

function canReorderQueue() {
  return !isOnlineQueueMode() || getActiveQueueView() === "related";
}

function moveQueueItemToIndex(id, target) {
  if (!canReorderQueue()) return false;
  const queue = nowQueue();
  const from = queue.findIndex((x) => x.id === id);
  if (from < 0) return false;

  const to = clamp(target, 0, queue.length - 1);
  if (to === from) return false;

  const [moved] = queue.splice(from, 1);
  queue.splice(to, 0, moved);
  syncQueueReference(queue);
  syncNowIndexToCurrent();
  renderQueue();
  return true;
}

function playItem(item, queuePosition = null) {
  if (!item) return;

  setPlayerOpen(true);
  rememberOnlinePlayback(item);
  rememberPlayedItem(item);

  state.current = item;
  state.isPlaying = true;
  state.userPaused = false;
  updatePlaybackNotification({ fromUserGesture: true, force: true }).catch(() => null);

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
    // El iframe de YouTube puede tardar en cargar: sin esto arrancaba la pista
    // anterior encima de la que se acaba de elegir.
    state.pendingYouTubeItem = null;
    playLocal(item);
  } else if (item.kind === "stream") {
    state.pendingYouTubeItem = null;
    playStream(item);
  } else {
    playYouTube(item);
  }

  updateMediaSurface();
  updateMediaSession();
  updatePrimaryPlayButton();
  renderQueue();

  if (state.source === "online" && isRadioPlayable(item)) {
    reseedRadioFromCurrent(6).catch(() => null);
    ensureOnlineQueueGrowth(16, 48).catch(() => null);
    ensureBackgroundStreamsAhead().catch(() => null);
  }
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

  stopSilentKeepAlive();
  stopAllPlayers();
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

// Elemento propio para los catalogos libres: el analizador de audio del reproductor
// local silencia cualquier fuente remota al enrutarla por Web Audio.
function ensureStreamPlayer() {
  if (streamPlayer) return streamPlayer;
  const audio = document.createElement("audio");
  audio.setAttribute("playsinline", "");
  audio.preload = "none";
  audio.style.display = "none";
  document.body.appendChild(audio);
  audio.addEventListener("timeupdate", () => {
    if (state.current?.kind === "stream") updateTimeUi(audio.currentTime, audio.duration);
  });
  audio.addEventListener("ended", onMediaEnded);
  audio.addEventListener("play", () => {
    state.isPlaying = true;
    updateMediaSession();
    if (refs.miniPlayPause) refs.miniPlayPause.textContent = "⏸";
    updatePrimaryPlayButton();
  });
  audio.addEventListener("pause", () => {
    if (state.current?.kind !== "stream") return;
    state.isPlaying = false;
    updateMediaSession();
    if (refs.miniPlayPause) refs.miniPlayPause.textContent = "▶";
    updatePrimaryPlayButton();
  });
  audio.addEventListener("error", async () => {
    if (state.current?.kind !== "stream") return;
    if (!audio.getAttribute("src")) return;
    const failed = state.current;
    updateOnlineHint("Esa pista del catalogo libre fallo; buscando otra version...");
    if (await playSameSongAlternative(failed)) return;
    if (state.autoplay) nextTrack();
    updateOnlineHint("No se pudo reproducir esa pista del catalogo libre.");
  });
  streamPlayer = audio;
  return audio;
}

function stopStreamPlayer() {
  if (streamPlayer) streamPlayer.pause();
}

function stopAllPlayers({ keepYouTube = false, keepStream = false } = {}) {
  if (!keepStream && streamPlayer) {
    streamPlayer.pause();
    streamPlayer.removeAttribute("src");
    streamPlayer.load();
  }
  refs.htmlPlayer.pause();
  if (!keepYouTube && state.ytReady && state.ytPlayer) {
    try {
      state.ytPlayer.pauseVideo();
    } catch (_) {
      // Ignore player errors while it reloads.
    }
  }
}

function playStream(item) {
  if (!item?.url) {
    updateOnlineHint("Esta pista no tiene un stream valido.");
    state.isPlaying = false;
    updatePrimaryPlayButton();
    return;
  }

  stopSilentKeepAlive();
  stopAllPlayers({ keepStream: true });

  const audio = ensureStreamPlayer();
  audio.pause();
  audio.src = item.url;
  audio.playbackRate = Number(refs.speedSelect.value);
  audio.volume = Number(refs.volumeBar.value);
  audio.play().catch(() => {
    state.isPlaying = false;
    updatePrimaryPlayButton();
  });
  updateOnlineHint(item.isLiveRadio
    ? `Radio en vivo: ${item.title}.`
    : `Reproduciendo desde ${providerLabel(item) || "catalogo libre"}.`);
}

function activeMediaElement() {
  return state.current?.kind === "stream" ? ensureStreamPlayer() : refs.htmlPlayer;
}

function playYouTube(item) {
  if (!item?.youtubeId) {
    updateOnlineHint("Este elemento no tiene un video valido para reproducir.");
    state.isPlaying = false;
    updatePrimaryPlayButton();
    return;
  }

  stopAllPlayers({ keepYouTube: true });

  if (!state.ytPlayer || !state.ytReady) {
    state.pendingYouTubeItem = item;
    updateOnlineHint("Cargando reproductor de YouTube...");
    return;
  }

  state.pendingYouTubeItem = null;

  state.ytPlayer.loadVideoById(item.youtubeId);
  state.ytPlayer.playVideo();
  state.ytPlayer.setPlaybackRate(Number(refs.speedSelect.value));
  state.ytPlayer.setVolume(Math.round(Number(refs.volumeBar.value) * 100));
  startSilentKeepAlive();
  setMediaActionHandlers();
  updateOnlineHint("Reproduciendo en YouTube.");
}

function createSilentAudioUrl(seconds = 12) {
  const sampleRate = 8000;
  const dataSize = sampleRate * seconds * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeText = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, dataSize, true);

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

function ensureSilentKeepAlive() {
  if (silentKeepAlive) return silentKeepAlive;
  const audio = document.createElement("audio");
  audio.src = createSilentAudioUrl(12);
  audio.loop = true;
  audio.volume = 0.0001;
  audio.setAttribute("playsinline", "");
  audio.style.display = "none";
  document.body.appendChild(audio);
  silentKeepAlive = audio;
  return audio;
}

// El iframe de YouTube no expone controles del sistema ni sigue sonando en segundo
// plano; este audio silencioso mantiene la sesion de medios del sitio activa.
function startSilentKeepAlive() {
  const audio = ensureSilentKeepAlive();
  if (!audio.paused) return;
  audio.play().catch(() => null);
}

function stopSilentKeepAlive() {
  if (silentKeepAlive) silentKeepAlive.pause();
}

// Deja siempre alguna pista de catalogo libre cerca para poder seguir en segundo plano.
async function ensureBackgroundStreamsAhead(minStreams = 2) {
  if (!state.preferFreeInBackground || !freeCatalogsEnabled()) return;
  if (!isOnlineQueueMode()) return;

  const qState = onlineQueueState();
  const related = qState.related;
  if (!Array.isArray(related) || !related.length) return;

  const from = Math.max(0, nowIndex());
  const ahead = related.slice(from + 1);
  if (ahead.filter((x) => x.kind === "stream").length >= minStreams) return;

  const artist = artistHint(state.current || {});
  const genre = genreLabel[Array.from(radioGenreProfile(state.current || {}))[0]] || "pop";
  const query = artist ? `${artist} ${genre}` : genre;
  const fresh = await fetchFreeCatalogResults(query, 10).catch(() => []);
  if (!fresh.length) return;

  // Solo se cuelan pistas afines: si no, la cola acababa llena de remixes sueltos.
  const relevant = relatedToCurrent(fresh.filter((x) => queryMatchScore(query, x) >= 0.4));
  if (!relevant.length) return;

  const existing = new Set(related.map((x) => x.id));
  const signatures = new Set((qState.playedSignatures || []).filter(Boolean));
  related.forEach((x) => {
    const sig = trackSignature(x);
    if (sig) signatures.add(sig);
  });

  const picked = pickDiverseTracks(relevant, {
    max: minStreams,
    blockedIds: existing,
    blockedSignatures: signatures,
    artistCounts: artistCountsOf(related),
    maxPerArtist: RADIO_MAX_PER_ARTIST
  }).map(markAsRadioAdded);

  if (!picked.length) return;

  related.splice(Math.min(from + 3, related.length), 0, ...picked);
  state.queue[state.mode][state.source] = related;
  renderQueue();
}

function resumeYouTubeSoon() {
  if (!state.ytReady || !state.ytPlayer) return;
  [150, 700, 1800].forEach((delay) => {
    setTimeout(() => {
      if (state.userPaused || !state.isPlaying) return;
      if (state.current?.kind !== "youtube") return;
      try {
        if (state.ytPlayer.getPlayerState() !== 1) state.ytPlayer.playVideo();
      } catch (_) {
        // Ignore player errors while it reloads.
      }
    }, delay);
  });
  setTimeout(() => { handleBlockedBackgroundPlayback().catch(() => null); }, 2600);
}

// YouTube prohibe el segundo plano en su reproductor incrustado: si no logro
// reanudarlo, sigo con una pista de catalogo libre o dejo el estado en pausa real.
async function handleBlockedBackgroundPlayback() {
  if (!document.hidden || state.userPaused) return;
  if (state.current?.kind !== "youtube" || !state.isPlaying) return;

  let playing = false;
  try {
    playing = state.ytPlayer?.getPlayerState() === 1;
  } catch (_) {
    playing = false;
  }
  if (playing) return;

  if (state.preferFreeInBackground) {
    // Primero la MISMA cancion en un catalogo libre; saltar a otra pista distinta
    // era justo lo que hacia aparecer canciones que nadie habia pedido.
    const blocked = state.current;
    if (await playSameSongAlternative(blocked, { preferStream: true, streamOnly: true })) {
      updateOnlineHint("YouTube no permite segundo plano; sigo la misma cancion sin anuncios.");
      return;
    }

    const queue = nowQueue();
    const from = Math.max(0, nowIndex());
    const nextFree = queue.findIndex((x, i) => i > from && x.kind === "stream" && !isAlreadyPlayed(x));
    if (nextFree >= 0) {
      playItem(queue[nextFree], nextFree);
      updateOnlineHint("YouTube no permite segundo plano; sigo con el catalogo libre.");
      return;
    }
  }

  state.isPlaying = false;
  stopSilentKeepAlive();
  updateMediaSession();
  updatePrimaryPlayButton();
}

function togglePlay() {
  if (!state.current) return;

  state.userPaused = false;
  updatePlaybackNotification({ fromUserGesture: true, force: true }).catch(() => null);

  if (state.current.kind === "local") {
    refs.htmlPlayer.play().catch(() => null);
  } else if (state.current.kind === "stream") {
    ensureStreamPlayer().play().catch(() => null);
  } else if (state.ytReady) {
    startSilentKeepAlive();
    state.ytPlayer.playVideo();
  }

  state.isPlaying = true;
  updateMediaSession();
  if (refs.miniPlayPause) refs.miniPlayPause.textContent = "⏸";
  updatePrimaryPlayButton();
}

function togglePause() {
  if (!state.current) return;

  state.userPaused = true;
  updatePlaybackNotification({ fromUserGesture: true, force: true }).catch(() => null);

  if (state.current.kind === "local") {
    refs.htmlPlayer.pause();
  } else if (state.current.kind === "stream") {
    stopStreamPlayer();
  } else if (state.ytReady) {
    state.ytPlayer.pauseVideo();
  }

  stopSilentKeepAlive();
  state.isPlaying = false;
  updateMediaSession();
  if (refs.miniPlayPause) refs.miniPlayPause.textContent = "▶";
  updatePrimaryPlayButton();
}

function seekBy(delta) {
  if (!state.current) return;

  if (state.current.kind === "youtube") {
    if (!state.ytReady) return;
    const now = state.ytPlayer.getCurrentTime();
    state.ytPlayer.seekTo(Math.max(0, now + delta), true);
    return;
  }

  const media = activeMediaElement();
  media.currentTime = Math.max(0, media.currentTime + delta);
}

function setSeekPercent(value) {
  if (!state.current) return;

  const pct = Number(value) / 100;
  if (state.current.kind === "youtube") {
    if (!state.ytReady) return;
    const d = state.ytPlayer.getDuration() || 0;
    state.ytPlayer.seekTo(d * pct, true);
    return;
  }

  const media = activeMediaElement();
  const d = media.duration || 0;
  media.currentTime = d * pct;
}

function isAlreadyPlayed(item) {
  if (!isOnlineQueueMode() || !item) return false;
  const qState = onlineQueueState();
  if ((qState.playedIds || []).includes(item.id)) return true;
  if ((qState.blockedIds || []).includes(item.id)) return true;
  return createDuplicateGuard(qState.playedSignatures || []).has(item);
}

// Evita encadenar busquedas infinitas cuando ninguna version se puede reproducir.
let alternativeChain = { signature: "", count: 0 };

// Si la pista elegida falla (muchos videos oficiales prohiben incrustarse), el
// usuario quiere ESA cancion, no la siguiente de la cola: se busca otra version
// de la misma antes de saltar.
async function playSameSongAlternative(item, { preferStream = false, streamOnly = false } = {}) {
  if (!item?.title) return false;

  const signature = trackSignature(item);
  if (alternativeChain.signature === signature) {
    if (alternativeChain.count >= 2) return false;
    alternativeChain.count += 1;
  } else {
    alternativeChain = { signature, count: 1 };
  }

  const parsed = splitTitleArtist(item);
  const query = normalizeText(`${parsed.artist} ${parsed.title}`) || normalizeText(item.title);
  if (!query) return false;

  const blocked = new Set(isOnlineQueueMode() ? (onlineQueueState().blockedIds || []) : []);
  const [youtube, free] = await Promise.all([
    fetchYouTubeResults(query).catch(() => []),
    fetchFreeCatalogResults(query, 10).catch(() => [])
  ]);

  // Primer intento: otra subida de la misma grabacion. Segundo: catalogo libre,
  // porque si la primera alternativa tambien fallo el problema es de YouTube.
  const preferFree = preferStream || alternativeChain.count >= 2;
  const ordered = (preferFree ? [...free, ...youtube] : [...youtube, ...free])
    .filter((candidate) => !streamOnly || candidate?.kind === "stream");
  const match = ordered.find((candidate) => candidate?.id
    && candidate.id !== item.id
    && !blocked.has(candidate.id)
    && tokensAreNearDuplicate(trackTokens(candidate), trackTokens(item)));
  if (!match) return false;

  const queue = nowQueue();
  const target = clamp(nowIndex() + 1, 0, queue.length);
  queue.splice(target, 0, match);
  syncQueueReference(queue);
  renderQueue();
  playItem(match, target);
  // El aviso va despues: al arrancar, el reproductor escribe su propio mensaje.
  updateOnlineHint(`Esa version no se podia reproducir; sigo con la misma cancion desde ${providerLabel(match) || "otra fuente"}.`);
  return true;
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
  // Salta pistas que ya sonaron (o reuploads de la misma cancion) dentro de la cola.
  while (idx < queue.length && isAlreadyPlayed(queue[idx])) {
    idx += 1;
  }

  if (idx >= queue.length) {
    if (state.repeatMode === "all") {
      playItem(queue[0], 0);
      return;
    }
    handleQueueEnd();
    return;
  }

  playItem(queue[idx], idx);
}

function previousTrack() {
  const queue = nowQueue();
  if (!queue.length) return;

  let idx = nowIndex() - 1;
  if (idx < 0) idx = state.repeatMode === "all" ? queue.length - 1 : 0;
  playItem(queue[idx], idx);
}

async function handleQueueEnd() {
  if (!state.current) return;

  if (state.repeatMode === "one") {
    playItem(state.current, nowIndex());
    return;
  }

  if (state.repeatMode === "all" && nowQueue().length) {
    playItem(nowQueue()[0], 0);
    return;
  }

  if (!state.autoplay) {
    state.isPlaying = false;
    stopSilentKeepAlive();
    return;
  }

  if (isOnlineQueueMode() && isRadioPlayable(state.current)) {
    const qState = onlineQueueState();
    await ensureOnlineQueueGrowth(20, 56);
    let nextIdx = nowIndex() + 1;
    while (qState.related[nextIdx] && isAlreadyPlayed(qState.related[nextIdx])) {
      nextIdx += 1;
    }
    if (qState.related[nextIdx]) {
      state.queue[state.mode][state.source] = qState.related;
      playItem(qState.related[nextIdx], nextIdx);
      return;
    }
  }

  if (isRadioPlayable(state.current)) {
    const rec = await fetchRelatedForItem(state.current);
    if (rec.length) {
      const qState = isOnlineQueueMode() ? onlineQueueState() : null;
      const played = new Set(qState?.playedIds || []);
      const playedSignatures = new Set(qState?.playedSignatures || []);
      const existing = new Set(nowQueue().map((x) => x.id));
      nowQueue().forEach((x) => {
        const sig = trackSignature(x);
        if (sig) playedSignatures.add(sig);
      });
      const guard = createDuplicateGuard(playedSignatures);
      const picked = rec.find((x) => {
        if (!x?.id || existing.has(x.id) || played.has(x.id)) return false;
        return !guard.has(x);
      });
      if (picked) {
        nowQueue().push(markAsRadioAdded(picked));
        updateOnlineHint("Radio agrego +1 relacionada.");
        renderQueue();
        playItem(picked, nowQueue().length - 1);
        return;
      }
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

// La busqueda manda: primero lo que coincide de verdad con lo escrito.
// Los catalogos libres solo entran si el titulo/artista coincide; antes se
// interleaveaban 1 a 1 y metian canciones que no tenian nada que ver.
function rankSearchResults(query, { youtube = [], free = [], resolved = [], stations = [] }) {
  const strongYoutube = [];
  const weakYoutube = [];
  youtube.forEach((item) => {
    if (queryMatchScore(query, item) >= 0.5) strongYoutube.push(item);
    else weakYoutube.push(item);
  });

  const relevantFree = free.filter((item) => queryMatchScore(query, item) >= 0.6);
  const relevantResolved = resolved.filter((item) => queryMatchScore(query, item) >= 0.5);
  // Las coincidencias fuertes de YouTube abren la lista (es lo que se buscaba);
  // detras se intercalan las demas plataformas para que no quede todo igual.
  const head = [
    ...strongYoutube.slice(0, 4),
    ...interleave(relevantResolved.slice(0, 6), strongYoutube.slice(4, 12), relevantFree.slice(0, 6))
  ];
  const pool = [...head, ...strongYoutube.slice(12), ...relevantFree.slice(6), ...relevantResolved.slice(6), ...weakYoutube, ...stations];

  const diverse = pickDiverseTracks(pool, { max: 40 });
  if (diverse.length >= 18) return diverse;

  // En una busqueda si interesan las otras versiones (en vivo, lyrics) de lo pedido;
  // el filtro anti-duplicados fuerte se reserva para la radio y el descubrimiento.
  const seen = new Set(diverse.map((item) => item.id));
  const variants = pool.filter((item) => item?.id && !seen.has(item.id) && queryMatchScore(query, item) >= 0.5);
  return uniqueItems([...diverse, ...variants]).slice(0, 24);
}

// Cuando una sugerencia de Deezer/iTunes/Last.fm coincide con una pista que ya
// estaba en la lista, se conserva su procedencia para que se vea de donde salio.
function annotateSeedOrigins(items, resolved) {
  if (!resolved?.length) return items;
  return items.map((item) => {
    if (item.seedOrigin) return item;
    const match = resolved.find((r) => r.id === item.id || tokensAreNearDuplicate(trackTokens(r), trackTokens(item)));
    return match?.seedOrigin ? { ...item, seedOrigin: match.seedOrigin } : item;
  });
}

async function searchOnline() {
  const query = refs.onlineQuery.value.trim();
  if (!query) return;

  const searchId = ++state.searchRequestId;
  const qState = onlineQueueState();
  qState.searchSeed = query;
  qState.growthCycle = 0;
  rememberSearchTerm(query);

  refs.onlineSearchBtn.disabled = true;
  refs.onlineSearchBtn.textContent = "Buscando...";

  const describeSources = (results, extraNote) => {
    const sources = Array.from(new Set(results.map((item) => providerLabel(item)).filter(Boolean)));
    const origins = Array.from(new Set(results.map((item) => seedOriginLabel(item)).filter(Boolean)));
    updateOnlineHint(`Resultados de ${sources.join(" + ") || "YouTube"}`
      + (origins.length ? ` (sugeridos por ${origins.join(" + ")})` : "")
      + (extraNote || "")
      + (jamendoClientId() ? "" : ". Agrega jamendoClientId en config.js para incluir Jamendo directo."));
  };

  const showResults = (results) => {
    state.library[state.mode].online = results;
    setResultsVisible(true);
    renderLibrary(results);
  };

  try {
    const [youtube, free, seedsItunes, seedsDeezer, seedsLastfm, stations] = await Promise.all([
      fetchYouTubeResults(query).catch(() => []),
      fetchFreeCatalogResults(query).catch(() => []),
      fetchItunesSeeds(query, 10).catch(() => []),
      fetchDeezerSeeds(query, 10).catch(() => []),
      fetchLastfmSearchSeeds(query, 10).catch(() => []),
      fetchLiveRadioStations({ name: query.replace(/\bradio\b/i, "").trim() || query, limit: 3 }).catch(() => [])
    ]);
    if (searchId !== state.searchRequestId) return;

    const base = rankSearchResults(query, { youtube, free, resolved: [], stations });
    if (!base.length) {
      throw new Error("Empty search results");
    }
    showResults(base);
    refs.resultsSection?.scrollIntoView({ block: "start" });
    describeSources(base, ". Buscando en Deezer/iTunes/Last.fm...");
    refs.onlineSearchBtn.disabled = false;
    refs.onlineSearchBtn.textContent = "Buscar";

    // Segunda pasada: las plataformas de referencia tardan mas porque cada
    // sugerencia hay que resolverla a una fuente reproducible.
    const strongYoutube = youtube.filter((item) => queryMatchScore(query, item) >= 0.5).length;
    const resolved = await withTimeout(
      resolveSeedsToPlayable(interleave(seedsItunes, seedsDeezer, seedsLastfm), strongYoutube < 8 ? 8 : 5),
      30000,
      []
    );
    if (searchId !== state.searchRequestId) return;

    if (!resolved.length) {
      describeSources(base);
      return;
    }

    const merged = annotateSeedOrigins(rankSearchResults(query, { youtube, free, resolved, stations }), resolved);
    showResults(merged.length ? merged : base);
    describeSources(merged.length ? merged : base);
  } catch (err) {
    if (searchId !== state.searchRequestId) return;



    const fallback = searchFallbackCatalog(query);
    state.library[state.mode].online = fallback;
    setResultsVisible(true);
    renderLibrary(fallback);
    refs.resultsSection?.scrollIntoView({ block: "start" });
    updateOnlineHint(/quota|429/i.test(String(err?.message || ""))
      ? "Cuota de YouTube agotada; mostrando sugerencias locales hasta que se restablezca."
      : "Mostrando sugerencias locales de respaldo.");
  } finally {
    refs.onlineSearchBtn.disabled = false;
    refs.onlineSearchBtn.textContent = "Buscar";
  }
}

const DUO_APP_NAME = "ReproductorDuo";
const AUDIUS_FALLBACK_HOST = "https://discoveryprovider.audius.co";
const JAMENDO_API = "https://api.jamendo.com/v3.0";
let audiusHostPromise = null;

function freeCatalogsEnabled() {
  return appConfig.useFreeCatalogs !== false && state.mode === "music";
}

function jamendoClientId() {
  return String(appConfig.jamendoClientId || "").trim();
}

async function audiusHost() {
  if (!audiusHostPromise) {
    audiusHostPromise = fetch("https://api.audius.co")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const hosts = Array.isArray(data?.data) ? data.data.filter(Boolean) : [];
        return hosts[Math.floor(Math.random() * hosts.length)] || AUDIUS_FALLBACK_HOST;
      })
      .catch(() => AUDIUS_FALLBACK_HOST);
  }
  return audiusHostPromise;
}

function mapAudiusTrack(track, host) {
  if (!track?.id) return null;
  const artist = normalizeText(track.user?.name || track.user?.handle || "Audius");
  const artwork = track.artwork || {};
  return {
    id: `audius-${track.id}`,
    provider: "audius",
    kind: "stream",
    providerTrackId: String(track.id),
    url: `${host}/v1/tracks/${encodeURIComponent(track.id)}/stream?app_name=${DUO_APP_NAME}`,
    title: normalizeText(track.title || "Sin titulo"),
    subtitle: `${artist} - ${formatTime(track.duration || 0)}`,
    thumbnail: artwork["480x480"] || artwork["150x150"] || "",
    genre: normalizeText(track.genre || "")
  };
}

async function fetchAudiusResults(query, limit = 20) {
  const host = await audiusHost();
  const url = `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=${DUO_APP_NAME}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data?.data) ? data.data : [])
    .map((track) => mapAudiusTrack(track, host))
    .filter(Boolean);
}

const AUDIUS_GENRES = {
  edm: "Electronic",
  house: "House",
  trance: "Trance",
  techno: "Techno",
  "hip hop": "Hip-Hop/Rap",
  hiphop: "Hip-Hop/Rap",
  reggaeton: "Latin",
  pop: "Pop",
  rock: "Rock",
  lofi: "Lo-Fi",
  classical: "Classical",
  jazz: "Jazz",
  ambient: "Ambient"
};

function audiusGenreFor(genre) {
  return AUDIUS_GENRES[String(genre || "").toLowerCase()] || "";
}

async function fetchAudiusTrending(genre = "", limit = 20) {
  const host = await audiusHost();
  const genreParam = genre ? `&genre=${encodeURIComponent(genre)}` : "";
  const url = `${host}/v1/tracks/trending?limit=${limit}${genreParam}&app_name=${DUO_APP_NAME}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data?.data) ? data.data : [])
    .map((track) => mapAudiusTrack(track, host))
    .filter(Boolean);
}

function mapJamendoTrack(track) {
  if (!track?.id || !track.audio) return null;
  const artist = normalizeText(track.artist_name || "Jamendo");
  return {
    id: `jamendo-${track.id}`,
    provider: "jamendo",
    kind: "stream",
    providerTrackId: String(track.id),
    url: track.audio,
    title: normalizeText(track.name || "Sin titulo"),
    subtitle: `${artist} - ${formatTime(Number(track.duration) || 0)}`,
    thumbnail: track.album_image || track.image || "",
    genre: normalizeText(track.musicinfo?.tags?.genres?.[0] || "")
  };
}

async function fetchJamendoJson(path, params) {
  const clientId = jamendoClientId();
  if (!clientId) return [];
  const search = new URLSearchParams({
    client_id: clientId,
    format: "json",
    audioformat: "mp32",
    include: "musicinfo",
    ...params
  });
  const res = await fetch(`${JAMENDO_API}${path}?${search.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data?.results) ? data.results : []).map(mapJamendoTrack).filter(Boolean);
}

async function fetchJamendoResults(query, limit = 20) {
  return fetchJamendoJson("/tracks/", { limit: String(limit), search: query, groupby: "artist_id" });
}

async function fetchJamendoSimilar(trackId, limit = 20) {
  return fetchJamendoJson("/tracks/similar/", { limit: String(limit), id: String(trackId) });
}

async function fetchJamendoByTag(tag, limit = 20) {
  return fetchJamendoJson("/tracks/", { limit: String(limit), fuzzytags: tag, groupby: "artist_id", boost: "popularity_month" });
}

// Openverse agrega catalogo libre reproducible (Jamendo, ccMixter, FMA) sin pedir clave,
// asi que funciona aunque no haya jamendoClientId configurado.
const OPENVERSE_API = "https://api.openverse.org/v1/audio/";

function mapOpenverseTrack(track) {
  const url = track?.url || track?.alt_files?.[0]?.url;
  if (!track?.id || !url) return null;
  const artist = normalizeText(track.creator || "Openverse");
  return {
    id: `openverse-${track.id}`,
    provider: "openverse",
    kind: "stream",
    providerTrackId: String(track.id),
    url,
    title: normalizeText(track.title || "Sin titulo"),
    subtitle: `${artist} - ${formatTime(Math.round(Number(track.duration || 0) / 1000))}`,
    thumbnail: track.thumbnail || "",
    genre: normalizeText(track.genres?.[0] || track.tags?.[0]?.name || "")
  };
}

async function fetchOpenverseResults(query, limit = 12) {
  if (!freeCatalogsEnabled() || !normalizeText(query)) return [];
  const params = new URLSearchParams({
    q: normalizeText(query),
    page_size: String(limit),
    category: "music"
  });
  const res = await fetch(`${OPENVERSE_API}?${params.toString()}`, { mode: "cors" });
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data?.results) ? data.results : []).map(mapOpenverseTrack).filter(Boolean);
}

async function fetchFreeCatalogResults(query, limit = 16) {
  if (!freeCatalogsEnabled() || !normalizeText(query)) return [];
  const [audius, jamendo, openverse] = await Promise.all([
    fetchAudiusResults(query, limit).catch(() => []),
    fetchJamendoResults(query, limit).catch(() => []),
    fetchOpenverseResults(query, limit).catch(() => [])
  ]);
  return interleave(audius, jamendo, openverse);
}

function interleave(...lists) {
  const out = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i += 1) {
    lists.forEach((list) => {
      if (list[i]) out.push(list[i]);
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Capa de metadatos multiplataforma.
// Deezer, iTunes y Last.fm no entregan audio completo (y Spotify exige OAuth de
// servidor), asi que se usan como catalogo de referencia: dicen QUE canciones
// existen y cuales se parecen. Cada "semilla" se resuelve despues a una fuente
// realmente reproducible (Audius, Jamendo o YouTube).
// ---------------------------------------------------------------------------

const ITUNES_API = "https://itunes.apple.com";
const DEEZER_API = "https://api.deezer.com";
const LASTFM_API = "https://ws.audioscrobbler.com/2.0/";
const RADIO_BROWSER_API = "https://de1.api.radio-browser.info/json";
const SEED_RESOLVE_CONCURRENCY = 6;

function metadataCatalogsEnabled() {
  return appConfig.useMetadataCatalogs !== false && state.mode === "music";
}

function liveRadioEnabled() {
  return appConfig.useLiveRadio !== false && state.mode === "music";
}

function lastfmApiKey() {
  return String(appConfig.lastfmApiKey || "").trim();
}

// Deezer y otras APIs no mandan CORS: se prueban varios proxys publicos porque
// ninguno es fiable al 100% (allorigins cae a ratos).
const JSON_PROXIES = [
  {
    build: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    extract: (payload) => (typeof payload?.contents === "string" ? JSON.parse(payload.contents) : null)
  },
  { build: (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}` },
  { build: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` }
];

async function fetchJsonMaybeProxied(url, { cacheKey = "", ttl = METADATA_CACHE_TTL } = {}) {
  const key = cacheKey || url;
  const cached = getCachedValue(runtimeCache.metadata, key, ttl);
  if (cached !== null && cached !== undefined) return cached;

  let payload = null;
  try {
    const direct = await fetch(url, { mode: "cors" });
    if (direct.ok) payload = await direct.json();
  } catch (_) {
    payload = null;
  }

  for (const proxy of JSON_PROXIES) {
    if (payload) break;
    try {
      const res = await fetch(proxy.build(url), { mode: "cors" });
      if (!res.ok) continue;
      const body = await res.json();
      payload = proxy.extract ? proxy.extract(body) : body;
    } catch (_) {
      payload = null;
    }
  }

  if (payload) setCachedValue(runtimeCache.metadata, key, payload);
  return payload;
}

function stripTitleNoise(text) {
  return normalizeText(text)
    .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, " ")
    .replace(/official\s*(music\s*)?(video|audio)|video\s*oficial|lyrics?|letra|visualizer|hd|4k|remaster(ed)?|mv/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// "Artist - Song (Official Video)" -> { artist, title }. Sin separador se usa el canal.
function splitTitleArtist(item) {
  const raw = stripTitleNoise(item?.title || "");
  const parts = raw.split(/\s+[-–—|]\s+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { artist: parts[0], title: parts.slice(1).join(" ") };
  }
  return { artist: artistHint(item) || "", title: raw };
}

function makeSeed(title, artist, extra = {}) {
  const seedTitle = stripTitleNoise(title);
  const seedArtist = normalizeText(artist);
  if (!seedTitle) return null;
  return {
    seedTitle,
    seedArtist,
    thumbnail: extra.thumbnail || "",
    genre: normalizeText(extra.genre || ""),
    origin: extra.origin || "",
    key: `${seedArtist}|${seedTitle}`.toLowerCase()
  };
}

function uniqueSeeds(seeds) {
  const seen = new Set();
  const out = [];
  (seeds || []).forEach((seed) => {
    if (!seed?.key || seen.has(seed.key)) return;
    seen.add(seed.key);
    out.push(seed);
  });
  return out;
}

async function mapWithConcurrency(items, limit, worker) {
  const results = [];
  let cursor = 0;
  const runners = new Array(Math.max(1, Math.min(limit, items.length))).fill(null).map(async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await worker(items[index], index);
      } catch (_) {
        results[index] = null;
      }
    }
  });
  await Promise.all(runners);
  return results;
}

async function fetchItunesSeeds(term, limit = 20) {
  if (!metadataCatalogsEnabled() || !normalizeText(term)) return [];
  const url = `${ITUNES_API}/search?media=music&entity=song&limit=${limit}&term=${encodeURIComponent(term)}`;
  const data = await fetchJsonMaybeProxied(url);
  return (Array.isArray(data?.results) ? data.results : [])
    .map((row) => makeSeed(row.trackName, row.artistName, {
      thumbnail: String(row.artworkUrl100 || "").replace("100x100", "400x400"),
      genre: row.primaryGenreName,
      origin: "itunes"
    }))
    .filter(Boolean);
}

function deezerTrackToSeed(track) {
  return makeSeed(track?.title_short || track?.title, track?.artist?.name, {
    thumbnail: track?.album?.cover_medium || track?.album?.cover_big || track?.artist?.picture_medium || "",
    origin: "deezer"
  });
}

async function fetchDeezerSeeds(query, limit = 20) {
  if (!metadataCatalogsEnabled() || !normalizeText(query)) return [];
  const data = await fetchJsonMaybeProxied(`${DEEZER_API}/search?limit=${limit}&q=${encodeURIComponent(query)}`);
  return (Array.isArray(data?.data) ? data.data : []).map(deezerTrackToSeed).filter(Boolean);
}

async function fetchDeezerChartSeeds(limit = 25) {
  if (!metadataCatalogsEnabled()) return [];
  const data = await fetchJsonMaybeProxied(`${DEEZER_API}/chart/0/tracks?limit=${limit}`);
  return (Array.isArray(data?.data) ? data.data : []).map(deezerTrackToSeed).filter(Boolean);
}

// Artistas parecidos segun Deezer + sus temas mas escuchados: base real de "radio".
async function fetchDeezerRelatedSeeds(artist, limit = 12) {
  if (!metadataCatalogsEnabled() || !normalizeText(artist)) return [];
  const search = await fetchJsonMaybeProxied(`${DEEZER_API}/search/artist?limit=1&q=${encodeURIComponent(artist)}`);
  const artistId = search?.data?.[0]?.id;
  if (!artistId) return [];

  const related = await fetchJsonMaybeProxied(`${DEEZER_API}/artist/${encodeURIComponent(artistId)}/related?limit=6`);
  const artistIds = (Array.isArray(related?.data) ? related.data : []).map((x) => x?.id).filter(Boolean).slice(0, 5);
  artistIds.unshift(artistId);

  const buckets = await mapWithConcurrency(artistIds, 3, async (id) => {
    const top = await fetchJsonMaybeProxied(`${DEEZER_API}/artist/${encodeURIComponent(id)}/top?limit=4`);
    return (Array.isArray(top?.data) ? top.data : []).map(deezerTrackToSeed).filter(Boolean);
  });

  return uniqueSeeds(interleave(...buckets.filter(Boolean))).slice(0, limit);
}

async function fetchLastfmSimilarSeeds(artist, title, limit = 20) {
  const key = lastfmApiKey();
  if (!key || !metadataCatalogsEnabled() || !normalizeText(artist)) return [];

  const method = normalizeText(title) ? "track.getsimilar" : "artist.gettoptracks";
  const params = new URLSearchParams({ method, api_key: key, format: "json", limit: String(limit), artist });
  if (normalizeText(title)) params.set("track", title);
  params.set("autocorrect", "1");

  const data = await fetchJsonMaybeProxied(`${LASTFM_API}?${params.toString()}`);
  const rows = data?.similartracks?.track || data?.toptracks?.track || [];
  return (Array.isArray(rows) ? rows : [rows])
    .map((row) => makeSeed(row?.name, row?.artist?.name || row?.artist, { origin: "lastfm" }))
    .filter(Boolean);
}

async function fetchLastfmTagSeeds(tag, limit = 20) {
  const key = lastfmApiKey();
  if (!key || !metadataCatalogsEnabled() || !normalizeText(tag)) return [];
  const params = new URLSearchParams({ method: "tag.gettoptracks", api_key: key, format: "json", limit: String(limit), tag });
  const data = await fetchJsonMaybeProxied(`${LASTFM_API}?${params.toString()}`);
  const rows = data?.tracks?.track || [];
  return (Array.isArray(rows) ? rows : [rows])
    .map((row) => makeSeed(row?.name, row?.artist?.name || row?.artist, { origin: "lastfm" }))
    .filter(Boolean);
}

async function fetchLastfmSearchSeeds(query, limit = 12) {
  const key = lastfmApiKey();
  if (!key || !metadataCatalogsEnabled() || !normalizeText(query)) return [];
  const params = new URLSearchParams({ method: "track.search", api_key: key, format: "json", limit: String(limit), track: query });
  const data = await fetchJsonMaybeProxied(`${LASTFM_API}?${params.toString()}`);
  const rows = data?.results?.trackmatches?.track || [];
  return (Array.isArray(rows) ? rows : [rows])
    .map((row) => makeSeed(row?.name, row?.artist, { origin: "lastfm" }))
    .filter(Boolean);
}

function mapRadioStation(station) {
  const url = String(station?.url_resolved || station?.url || "");
  // Un stream http en una pagina https lo bloquea el navegador (mixed content).
  if (!station?.stationuuid || !/^https:\/\//i.test(url)) return null;
  const place = normalizeText(station.country || station.state || "Radio");
  return {
    id: `radio-${station.stationuuid}`,
    provider: "radio",
    kind: "stream",
    isLiveRadio: true,
    url,
    title: normalizeText(station.name || "Radio").slice(0, 60),
    subtitle: `${place} - En vivo`,
    thumbnail: /^https:\/\//i.test(String(station.favicon || "")) ? station.favicon : "",
    genre: normalizeText(String(station.tags || "").split(",")[0] || "")
  };
}

async function fetchLiveRadioStations({ tag = "", name = "", limit = 10 } = {}) {
  if (!liveRadioEnabled()) return [];
  const params = new URLSearchParams({
    limit: String(limit * 3),
    hidebroken: "true",
    order: "clickcount",
    reverse: "true",
    codec: "MP3"
  });
  if (tag) params.set("tag", tag);
  if (name) params.set("name", name);
  if (!tag && !name) return [];

  const data = await fetchJsonMaybeProxied(`${RADIO_BROWSER_API}/stations/search?${params.toString()}`);
  const mapped = (Array.isArray(data) ? data : []).map(mapRadioStation).filter(Boolean);
  return uniqueItems(mapped).slice(0, limit);
}

function seedMatchesItem(seed, item) {
  const seedTokens = trackTokens({ title: seed.seedTitle });
  if (!tokensAreNearDuplicate(seedTokens, trackTokens(item))) return false;
  const mainArtist = String(seed.seedArtist || "").toLowerCase().split(/,| & | feat\.?| ft\.?| with /)[0].trim();
  const haystack = `${normalizeText(item?.title || "")} ${normalizeText(item?.subtitle || "")}`.toLowerCase();
  if (mainArtist.length >= 3) return haystack.includes(mainArtist);
  // Sin artista utilizable, un solo token en comun no basta ("Rockstars" pega con cualquier cosa).
  return seedTokens.length >= 2;
}

// Convierte una semilla de metadatos en algo reproducible de verdad.
// Se prioriza el catalogo libre (sin anuncios, suena en segundo plano) y solo
// se acepta el resultado si el titulo y el artista coinciden.
async function resolveSeedToPlayable(seed) {
  if (!seed?.key) return null;
  const cached = getCachedValue(runtimeCache.resolve, seed.key, RESOLVE_CACHE_TTL);
  if (cached !== null && cached !== undefined) return cached ? { ...cached } : null;

  const query = normalizeText(`${seed.seedArtist} ${seed.seedTitle}`);
  const [audius, openverse, youtube] = await Promise.all([
    freeCatalogsEnabled() ? fetchAudiusResults(query, 6).catch(() => []) : Promise.resolve([]),
    freeCatalogsEnabled() ? fetchOpenverseResults(query, 6).catch(() => []) : Promise.resolve([]),
    fetchYouTubeResults(query).catch(() => [])
  ]);

  const match = [...audius, ...openverse, ...youtube].find((candidate) => seedMatchesItem(seed, candidate)) || null;
  const resolved = match
    ? {
      ...match,
      thumbnail: match.thumbnail || seed.thumbnail,
      genre: match.genre || seed.genre,
      seedOrigin: seed.origin
    }
    : null;

  // Se cachea tambien el "no encontrado" (false) para no repetir la busqueda.
  setCachedValue(runtimeCache.resolve, seed.key, resolved || false);
  return resolved ? { ...resolved } : null;
}

// Se resuelve por tandas y se corta al llegar al cupo: cada semilla cuesta una
// busqueda real, asi que no se resuelve el catalogo entero.
async function resolveSeedsToPlayable(seeds, limit = 8) {
  const list = uniqueSeeds(seeds).slice(0, Math.max(0, limit) + 3);
  if (!list.length) return [];

  const out = [];
  for (let i = 0; i < list.length && out.length < limit; i += SEED_RESOLVE_CONCURRENCY) {
    const batch = list.slice(i, i + SEED_RESOLVE_CONCURRENCY);
    const resolved = await mapWithConcurrency(batch, SEED_RESOLVE_CONCURRENCY, resolveSeedToPlayable);
    resolved.filter(Boolean).forEach((item) => out.push(item));
  }

  return uniqueItems(out).slice(0, limit);
}

// Recomendaciones reales cruzando plataformas: Last.fm dice que canciones se
// parecen, Deezer que artistas son afines, iTunes completa con el mismo genero.
async function fetchCrossPlatformRelated(item, limit = 8) {
  if (!metadataCatalogsEnabled() || !item) return [];
  const { artist: parsedArtist, title: parsedTitle } = splitTitleArtist(item);
  const artist = parsedArtist || artistHint(item);
  if (!artist && !parsedTitle) return [];

  const buckets = await Promise.all([
    fetchLastfmSimilarSeeds(artist, parsedTitle, 20).catch(() => []),
    fetchDeezerRelatedSeeds(artist, 14).catch(() => []),
    fetchItunesSeeds(artist, 16).catch(() => [])
  ]);

  const rotation = state.discoverRotation + Number(onlineQueueState()?.growthCycle || 0);
  const seeds = uniqueSeeds(interleave(...buckets))
    .filter((seed) => !seedMatchesItem(seed, item));

  return resolveSeedsToPlayable(rotateItems(seeds, rotation), limit);
}

function queryTokens(query) {
  return Array.from(new Set(
    normalizeText(query)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1)
  ));
}

// Cuanto de la busqueda aparece realmente en el resultado (0..1).
// Sin esto los catalogos libres colaban temas indie que no tenian nada que ver.
function queryMatchScore(query, item) {
  const tokens = queryTokens(query);
  if (!tokens.length) return 1;
  const haystack = `${normalizeText(item?.title || "")} ${normalizeText(item?.subtitle || "")}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");
  let hits = 0;
  tokens.forEach((token) => {
    if (haystack.includes(token)) hits += 1;
  });
  return hits / tokens.length;
}

// Fuente unica para la radio: mezcla YouTube con los catalogos libres y deduplica.
// Los temas libres solo pasan si comparten algo con la consulta (artista o genero).
async function fetchMixedResults(query) {
  const [youtube, free] = await Promise.all([
    fetchYouTubeResults(query).catch(() => []),
    fetchFreeCatalogResults(query).catch(() => [])
  ]);
  const relevantFree = free.filter((item) => queryMatchScore(query, item) >= 0.4);
  return pickDiverseTracks(interleave(youtube, relevantFree), { max: 40 });
}

async function fetchYouTubeResults(query) {
  const cacheKey = `${state.mode}|${normalizeText(query).toLowerCase()}`;
  const cached = getCachedValue(runtimeCache.search, cacheKey, SEARCH_CACHE_TTL);
  if (cached?.length) {
    return cached.map((item) => ({ ...item }));
  }

  if (state.youtubeApiKey) {
    try {
      const byApiKey = await fetchYouTubeResultsViaApiKey(query, state.youtubeApiKey);
      if (byApiKey.length) {
        setCachedValue(runtimeCache.search, cacheKey, byApiKey);
        return byApiKey;
      }
    } catch (_) {
      // If YouTube Data API quota is exhausted, continue with non-key fallbacks.
    }
  }

  // El backend propio (si existe) va antes que el scraping: es mucho mas fiable.
  if (hasLocalApi()) {
    try {
      const base = String(appConfig.publicApiBase || "").trim();
      const route = `/api/search?q=${encodeURIComponent(query)}&mode=${encodeURIComponent(state.mode)}`;
      const proxyUrl = base ? `${base}${route}` : route;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (Array.isArray(proxyData) && proxyData.length) {
          setCachedValue(runtimeCache.search, cacheKey, proxyData);
          return proxyData;
        }
      }
    } catch (_) {
      // Fallback below.
    }
  }

  try {
    const allOriginsResults = await fetchYouTubeResultsViaAllOrigins(query);
    if (allOriginsResults.length) {
      setCachedValue(runtimeCache.search, cacheKey, allOriginsResults);
      return allOriginsResults;
    }
  } catch (_) {
    // Fall through to the other fallbacks below.
  }

  try {
    const duckDuckGoResults = await fetchYouTubeResultsViaDuckDuckGo(query);
    if (duckDuckGoResults.length) {
      setCachedValue(runtimeCache.search, cacheKey, duckDuckGoResults);
      return duckDuckGoResults;
    }
  } catch (_) {
    // Fall through to the other fallbacks below.
  }

  for (const base of invidiousInstances) {
    const url = `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) continue;
      const data = await res.json();
      const cleaned = data
        .filter((x) => x.type === "video" && x.videoId)
        .slice(0, 30)
        .map((x) => ({
          id: `yt-${x.videoId}`,
          youtubeId: x.videoId,
          title: normalizeText(x.title || "Sin titulo"),
          subtitle: `${normalizeText(x.author || "Canal")} - ${formatTime(x.lengthSeconds || 0)}`,
          thumbnail: x.videoThumbnails?.[0]?.url || "",
          kind: "youtube"
        }));

      if (state.mode === "music") {
        const filtered = cleaned.filter((x) => !/shorts/i.test(x.title)).slice(0, 24);
        if (filtered.length) setCachedValue(runtimeCache.search, cacheKey, filtered);
        return filtered;
      }
      if (cleaned.length) setCachedValue(runtimeCache.search, cacheKey, cleaned);
      return cleaned;
    } catch (error) {
      continue;
    }
  }

  throw Object.assign(new Error("No API instances available"), { code: 503 });
}

async function fetchYouTubeResultsViaAllOrigins(query) {
  const searchQuery = buildYouTubeSearchQuery(query);
  if (!searchQuery) return [];

  const youtubeUrl = buildYouTubeSearchUrl(searchQuery);
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(youtubeUrl)}`;
  const res = await fetch(proxyUrl, { mode: "cors" });
  if (!res.ok) {
    throw Object.assign(new Error(`AllOrigins search error ${res.status}`), { status: res.status });
  }

  const payload = await res.json();
  const html = typeof payload?.contents === "string" ? payload.contents : "";
  const items = parseYouTubeHtmlResults(html);
  if (!items.length) return [];

  if (state.mode === "music") {
    return items.filter((x) => !/shorts/i.test(x.title)).slice(0, 30);
  }

  return items.slice(0, 30);
}

async function fetchYouTubeResultsViaDuckDuckGo(query) {
  const searchQuery = buildDuckDuckGoQuery(query);
  if (!searchQuery) return [];

  const url = `https://r.jina.ai/http://duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) {
    throw Object.assign(new Error(`DuckDuckGo relay error ${res.status}`), { status: res.status });
  }

  const text = await res.text();
  const items = parseDuckDuckGoResults(text);
  if (!items.length) return [];

  if (state.mode === "music") {
    return items.filter((x) => !/shorts/i.test(x.title)).slice(0, 30);
  }

  return items.slice(0, 30);
}

async function fetchYouTubeResultsViaApiKey(query, apiKey) {
  const searchUrl = "https://www.googleapis.com/youtube/v3/search"
    + `?part=snippet&type=video&maxResults=30&q=${encodeURIComponent(query)}`
    + `&key=${encodeURIComponent(apiKey)}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    const payload = await searchRes.text().catch(() => "");
    throw Object.assign(new Error(payload || `YouTube API error ${searchRes.status}`), { status: searchRes.status });
  }

  const searchData = await searchRes.json();
  const items = Array.isArray(searchData.items) ? searchData.items : [];
  if (!items.length) return [];

  const ids = items
    .map((x) => x?.id?.videoId)
    .filter(Boolean)
    .slice(0, 30);

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
    return mapped.filter((x) => !/shorts/i.test(x.title)).slice(0, 30);
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
    try {
      const byApiKey = await fetchRecommendationsViaApiKey(videoId, state.youtubeApiKey);
      if (byApiKey.length) return byApiKey;
    } catch (_) {
      // Continue with fallback recommenders.
    }
  }

  if (hasLocalApi()) {
    try {
      const base = String(appConfig.publicApiBase || "").trim();
      const qState = isOnlineQueueMode() ? onlineQueueState() : null;
      const seedHint = normalizeText(qState?.searchSeed || state.current?.title || "");
      const genreHint = Array.from(radioGenreProfile(state.current || {}))[0] || "";
      const route = `/api/recommend?videoId=${encodeURIComponent(videoId)}&seed=${encodeURIComponent(seedHint)}&genre=${encodeURIComponent(genreHint)}&mood=${encodeURIComponent(state.selectedMood || "")}`;
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

function readAudioTags(file) {
  if (!window.jsmediatags?.read) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      window.jsmediatags.read(file, {
        onSuccess: (result) => resolve(result?.tags || null),
        onError: () => resolve(null)
      });
    } catch (_) {
      resolve(null);
    }
  });
}

function pictureToBlob(picture) {
  try {
    if (!picture?.data || !picture?.format) return null;
    const bytes = new Uint8Array(picture.data);
    return new Blob([bytes], { type: picture.format });
  } catch (_) {
    return null;
  }
}

function pictureToObjectUrl(picture) {
  try {
    const blob = pictureToBlob(picture);
    if (!blob) return "";
    return URL.createObjectURL(blob);
  } catch (_) {
    return "";
  }
}

function readLocalDuration(file, isVideo) {
  return new Promise((resolve) => {
    const el = document.createElement(isVideo ? "video" : "audio");
    const objectUrl = URL.createObjectURL(file);
    let done = false;

    const finish = (value) => {
      if (done) return;
      done = true;
      try {
        el.pause();
        el.removeAttribute("src");
        el.load();
      } catch (_) {
        // Ignore cleanup failures.
      }
      URL.revokeObjectURL(objectUrl);
      resolve(value);
    };

    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const dur = Number(el.duration);
      finish(Number.isFinite(dur) && dur > 0 ? dur : 0);
    };
    el.onerror = () => finish(0);
    el.src = objectUrl;
  });
}

async function buildLocalItem(file) {
  const isVideo = state.mode === "video";
  const baseTitle = file.name.replace(/\.[^.]+$/, "");
  const durationSec = await readLocalDuration(file, isVideo);
  const durationLabel = durationSec > 0 ? formatTime(durationSec) : "00:00";
  const url = URL.createObjectURL(file);
  const relativePath = normalizeText(file.webkitRelativePath || "");

  let title = baseTitle;
  let artist = "Local";
  let album = "";
  let thumbnail = "";
  let thumbnailBlob = null;

  if (!isVideo) {
    const tags = await readAudioTags(file);
    if (tags) {
      title = normalizeText(tags.title || baseTitle) || baseTitle;
      artist = normalizeText(tags.artist || tags.albumartist || artist) || artist;
      album = normalizeText(tags.album || "");
      thumbnailBlob = pictureToBlob(tags.picture);
      thumbnail = thumbnailBlob ? URL.createObjectURL(thumbnailBlob) : "";
    }
  }

  const subtitleParts = [`${artist} - ${durationLabel}`];
  if (album) subtitleParts.push(album);
  if (relativePath) subtitleParts.push(relativePath);

  return {
    id: `local-${file.name}-${file.size}-${file.lastModified}`,
    title,
    subtitle: subtitleParts.join(" | "),
    thumbnail,
    thumbnailBlob,
    fileBlob: file,
    url,
    kind: "local"
  };
}

const AUDIO_FILE_EXT = /\.(mp3|m4a|m4b|aac|flac|wav|wave|ogg|oga|opus|wma|alac|aif|aiff|amr|mka)$/i;
const VIDEO_FILE_EXT = /\.(mp4|m4v|mkv|webm|mov|avi|wmv|flv|3gp|3g2|mpeg|mpg|mts|m2ts|ts|ogv)$/i;

// Al cargar carpetas muchos archivos llegan sin MIME; hay que mirar la extension.
function isAcceptedLocalFile(file, mode) {
  const type = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "");
  if (mode === "music") {
    if (type.startsWith("audio/")) return true;
    if (type.startsWith("video/")) return false;
    return AUDIO_FILE_EXT.test(name);
  }
  if (type.startsWith("video/")) return true;
  if (type.startsWith("audio/")) return false;
  return VIDEO_FILE_EXT.test(name);
}

async function loadLocalFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  const accepted = files.filter((f) => isAcceptedLocalFile(f, state.mode));
  if (!accepted.length) {
    updateOnlineHint(`No se encontraron archivos de ${state.mode === "music" ? "audio" : "video"} en esta seleccion.`);
    return;
  }

  updateOnlineHint(`Cargando ${accepted.length} archivos locales...`);
  const built = await Promise.all(accepted.map((f) => buildLocalItem(f)));

  const merged = new Map((state.library[state.mode].local || []).map((x) => [x.id, x]));
  built.forEach((item) => merged.set(item.id, item));

  state.library[state.mode].local = Array.from(merged.values())
    .sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));

  state.queue[state.mode].local = [...state.library[state.mode].local];
  await persistLocalLibrary(state.mode);

  const skipped = files.length - accepted.length;
  setResultsVisible(true);
  renderLibrary();
  renderQueue();
  loadDiscovery();
  updateOnlineHint(
    `Biblioteca local: ${state.library[state.mode].local.length} pistas en la cola.`
    + (skipped > 0 ? ` (${skipped} archivos omitidos por formato)` : "")
  );
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

function supportsPlaybackNotifications() {
  return "Notification" in window && "serviceWorker" in navigator;
}

async function ensurePlaybackNotificationPermission(fromUserGesture = false) {
  if (!supportsPlaybackNotifications()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  if (!fromUserGesture || hasAskedNotificationPermission) return Notification.permission;
  hasAskedNotificationPermission = true;
  try {
    return await Notification.requestPermission();
  } catch (_) {
    return Notification.permission;
  }
}

function playbackNotificationAction() {
  return state.isPlaying
    ? { action: "pause", title: "Pausar" }
    : { action: "play", title: "Reproducir" };
}

async function updatePlaybackNotification(options = {}) {
  if (!state.current || !supportsPlaybackNotifications()) return;
  const fromUserGesture = Boolean(options.fromUserGesture);
  const permission = await ensurePlaybackNotificationPermission(fromUserGesture);
  if (permission !== "granted") return;

  const key = `${state.current.id}|${state.isPlaying ? 1 : 0}|${state.mode}|${state.source}`;
  if (!options.force && key === playbackNotificationKey) return;
  playbackNotificationKey = key;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(state.current.title || "Reproductor Duo", {
      body: state.current.subtitle || (state.source === "online" ? "Modo online" : "Modo local"),
      icon: state.current.thumbnail || "./icon-192.svg",
      badge: "./icon-192.svg",
      tag: PLAYBACK_NOTIFICATION_TAG,
      renotify: false,
      silent: true,
      requireInteraction: false,
      data: {
        kind: "playback-controls",
        currentId: state.current.id,
        mode: state.mode,
        source: state.source,
        isPlaying: state.isPlaying
      },
      actions: [
        { action: "previous", title: "Anterior" },
        playbackNotificationAction(),
        { action: "next", title: "Siguiente" }
      ]
    });
  } catch (_) {
    // Ignore notification failures in unsupported environments.
  }
}

async function clearPlaybackNotification() {
  playbackNotificationKey = "";
  if (!supportsPlaybackNotifications()) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications({ tag: PLAYBACK_NOTIFICATION_TAG });
    notifications.forEach((n) => n.close());
  } catch (_) {
    // Ignore clear failures.
  }
}

function updateMediaSession() {
  if (!("mediaSession" in navigator)) {
    updatePlaybackNotification().catch(() => null);
    return;
  }

  if (!state.current) {
    navigator.mediaSession.playbackState = "none";
    clearPlaybackNotification().catch(() => null);
    return;
  }

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
  updatePlaybackNotification().catch(() => null);
}

function setMediaActionHandlers() {
  if (!("mediaSession" in navigator)) return;

  try { navigator.mediaSession.setActionHandler("play", () => togglePlay()); } catch (_) {}
  try { navigator.mediaSession.setActionHandler("pause", () => togglePause()); } catch (_) {}
  try { navigator.mediaSession.setActionHandler("previoustrack", () => previousTrack()); } catch (_) {}
  try { navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack()); } catch (_) {}
  try { navigator.mediaSession.setActionHandler("stop", () => togglePause()); } catch (_) {}
  try { navigator.mediaSession.setActionHandler("seekbackward", (details) => seekBy(-(details.seekOffset || 10))); } catch (_) {}
  try { navigator.mediaSession.setActionHandler("seekforward", (details) => seekBy(details.seekOffset || 10)); } catch (_) {}
  try {
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (!details.seekTime && details.seekTime !== 0) return;
      if (!state.current) return;
      if (state.current.kind === "youtube") {
        if (state.ytReady) state.ytPlayer.seekTo(details.seekTime, true);
        return;
      }
      activeMediaElement().currentTime = details.seekTime;
    });
  } catch (_) {}
}

// Mantener presionada una pista de la cola activa el modo orden: se puede arrastrar
// para cambiarla de turno o usar las flechas.
const queueDrag = { pointerId: null, id: "", timer: 0, active: false, startY: 0 };

function cancelQueueLongPress() {
  if (queueDrag.timer) window.clearTimeout(queueDrag.timer);
  queueDrag.timer = 0;
}

function endQueueDrag() {
  cancelQueueLongPress();
  if (refs.queueList && queueDrag.pointerId !== null) {
    try {
      refs.queueList.releasePointerCapture?.(queueDrag.pointerId);
    } catch (_) {
      // El puntero ya no existe: soltarlo no es obligatorio para cerrar el arrastre.
    }
  }
  queueDrag.pointerId = null;
  queueDrag.id = "";
  queueDrag.active = false;
  if (refs.queueList) refs.queueList.style.touchAction = "";
}

// El dedo no siempre queda justo sobre una fila (sale de la lista, la fila esta
// recortada por el scroll...), asi que si el impacto directo falla se usa la altura.
function queueIndexFromPoint(x, y) {
  const list = refs.queueList;
  if (!list) return null;

  const hit = document.elementFromPoint(x, y)?.closest?.(".track-item");
  if (hit && list.contains(hit)) {
    const pos = Number(hit.dataset.pos);
    if (Number.isFinite(pos)) return pos;
  }

  const rows = Array.from(list.querySelectorAll(".track-item"));
  if (!rows.length) return null;

  for (const row of rows) {
    const rect = row.getBoundingClientRect();
    if (y >= rect.top && y <= rect.bottom) {
      const pos = Number(row.dataset.pos);
      if (Number.isFinite(pos)) return pos;
    }
  }

  const edge = y < rows[0].getBoundingClientRect().top ? rows[0] : rows[rows.length - 1];
  const pos = Number(edge.dataset.pos);
  return Number.isFinite(pos) ? pos : null;
}

function autoScrollQueue(y) {
  const list = refs.queueList;
  if (!list || list.scrollHeight <= list.clientHeight) return;
  const rect = list.getBoundingClientRect();
  if (y < rect.top + 44) list.scrollTop -= 14;
  else if (y > rect.bottom - 44) list.scrollTop += 14;
}

function bindQueueReorder() {
  const list = refs.queueList;
  if (!list) return;

  list.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    const li = e.target.closest(".track-item");
    const id = li?.dataset?.id;
    if (!id || !canReorderQueue()) return;

    cancelQueueLongPress();
    queueDrag.pointerId = e.pointerId;
    queueDrag.id = id;
    queueDrag.startY = e.clientY;
    queueDrag.active = false;
    queueDrag.timer = window.setTimeout(() => {
      queueDrag.active = true;
      state.queueReorderId = id;
      list.style.touchAction = "none";
      // La captura vive en la lista, no en la fila: la fila se vuelve a crear en cada repintado.
      try {
        list.setPointerCapture(queueDrag.pointerId);
      } catch (_) {
        // Sin captura el arrastre sigue funcionando con los eventos de window.
      }
      if (navigator.vibrate) navigator.vibrate(15);
      renderQueue();
      updateOnlineHint("Modo orden: arrastra la pista o usa las flechas.");
    }, 450);
  });

  // En movil hay que cancelar el scroll a mano: si el navegador se queda el gesto
  // dispara pointercancel y el arrastre muere antes de empezar.
  list.addEventListener("touchmove", (e) => {
    if (queueDrag.active) e.preventDefault();
  }, { passive: false });

  list.addEventListener("contextmenu", (e) => {
    if (queueDrag.active || queueDrag.timer) e.preventDefault();
  });

  // Los eventos de movimiento van en window: la lista se vuelve a pintar mientras se
  // arrastra y el elemento bajo el dedo desaparece.
  window.addEventListener("pointermove", (e) => {
    if (queueDrag.pointerId !== e.pointerId) return;

    if (!queueDrag.active) {
      // Si el dedo se desplaza antes de tiempo es un scroll, no una pulsacion larga.
      if (Math.abs(e.clientY - queueDrag.startY) > 16) cancelQueueLongPress();
      return;
    }

    e.preventDefault();
    autoScrollQueue(e.clientY);
    const target = queueIndexFromPoint(e.clientX, e.clientY);
    if (target === null) return;
    moveQueueItemToIndex(queueDrag.id, target);
  }, { passive: false });

  const stopDrag = (e) => {
    if (queueDrag.pointerId !== null && e.pointerId !== queueDrag.pointerId) return;
    endQueueDrag();
  };

  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
}

function bindEvents() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      const action = event?.data?.type;
      if (!action) return;
      if (action === "playback:previous") previousTrack();
      if (action === "playback:next") nextTrack();
      if (action === "playback:play") togglePlay();
      if (action === "playback:pause") togglePause();
      if (action === "playback:toggle") {
        if (state.isPlaying) togglePause();
        else togglePlay();
      }
    });
  }

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

  refs.localPicker.addEventListener("change", async (e) => {
    await loadLocalFiles(e.target.files);
    e.target.value = "";
  });
  if (refs.localFolderPicker) {
    refs.localFolderPicker.addEventListener("change", async (e) => {
      await loadLocalFiles(e.target.files);
      e.target.value = "";
    });
  }
  refs.localQuery.addEventListener("input", filterLocal);

  if (refs.installAppBtn) {
    refs.installAppBtn.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      try {
        await deferredInstallPrompt.userChoice;
      } catch (_) {
        // Ignore prompt result errors.
      }
      deferredInstallPrompt = null;
      refs.installAppBtn.hidden = true;
    });
  }

  refs.libraryList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const action = btn.getAttribute("data-action");
    const item = findInLibraryById(id);
    if (!item) return;

    if (action === "play") {
      startSmartPlayback(item, renderedLibraryItems);
    }

    if (action === "next") {
      if (!state.current) {
        startSmartPlayback(item, renderedLibraryItems);
        return;
      }
      playNextInQueue(item);
    }

    if (action === "add") {
      enqueue(item);
      renderQueue();
    }
  });

  bindQueueReorder();

  refs.queueList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const pos = Number(btn.getAttribute("data-pos"));
    const queue = queueItemsForRender();
    if (!Number.isFinite(pos) || pos < 0 || pos >= queue.length) return;

    const item = queue[pos];
    if (!item) return;

    if (action === "order") {
      state.queueReorderId = item.id;
      renderQueue();
      updateOnlineHint("Modo orden: arrastra la pista o usa las flechas.");
      return;
    }

    if (action === "moveUp" || action === "moveDown") {
      moveQueueItemToIndex(item.id, pos + (action === "moveUp" ? -1 : 1));
      return;
    }

    if (action === "playNext") {
      playNextInQueue(item);
      state.queueReorderId = "";
      renderQueue();
      return;
    }

    if (action === "doneOrder") {
      state.queueReorderId = "";
      renderQueue();
      return;
    }

    if (action === "jump") {
      if (isOnlineQueueMode() && getActiveQueueView() === "results") {
        startSmartPlayback(item, onlineQueueState().results);
      } else {
        const activeIdx = nowQueue().findIndex((x) => x.id === item.id);
        playItem(item, activeIdx >= 0 ? activeIdx : pos);
      }
      return;
    }

    if (action === "remove") {
      const removeById = (arr) => {
        const i = arr.findIndex((x) => x.id === item.id);
        if (i >= 0) arr.splice(i, 1);
      };

      if (isOnlineQueueMode()) {
        removeById(onlineQueueState().results);
        removeById(onlineQueueState().related);
        removeById(nowQueue());
      } else {
        queue.splice(pos, 1);
      }

      const activeIndex = nowQueue().findIndex((x) => x.id === state.current?.id);
      if (activeIndex >= 0) {
        setNowIndex(activeIndex);
      } else if (nowQueue().length) {
        setNowIndex(Math.min(nowIndex(), nowQueue().length - 1));
      } else {
        setNowIndex(-1);
      }
      renderQueue();
    }
  });

  if (refs.queueModeRelated) {
    refs.queueModeRelated.addEventListener("click", () => setActiveQueueView("related"));
  }
  if (refs.queueModeResults) {
    refs.queueModeResults.addEventListener("click", () => setActiveQueueView("results"));
  }
  if (refs.closeResultsBtn) {
    refs.closeResultsBtn.addEventListener("click", () => {
      setResultsVisible(false);
      if (refs.discoverSection) {
        refs.discoverSection.hidden = false;
        refs.discoverSection.scrollIntoView({ block: "start" });
      }
    });
  }

  refs.prevBtn.addEventListener("click", previousTrack);
  refs.backBtn.addEventListener("click", () => seekBy(-10));
  refs.playBtn.addEventListener("click", () => {
    if (state.isPlaying) {
      togglePause();
    } else {
      togglePlay();
    }
  });
  refs.fwdBtn.addEventListener("click", () => seekBy(10));
  refs.nextBtn.addEventListener("click", nextTrack);
  if (refs.shuffleControlBtn) {
    refs.shuffleControlBtn.addEventListener("click", () => {
      state.shuffle = !state.shuffle;
      updateShuffleUi();
    });
  }

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

  if (refs.resetPlayerBtn) {
    refs.resetPlayerBtn.addEventListener("click", () => {
      resetPlayerWindow();
    });
  }

  refs.seekBar.addEventListener("input", () => setSeekPercent(refs.seekBar.value));

  refs.volumeBar.addEventListener("input", () => {
    const v = Number(refs.volumeBar.value);
    refs.htmlPlayer.volume = v;
    if (streamPlayer) streamPlayer.volume = v;
    if (state.ytReady) state.ytPlayer.setVolume(Math.round(v * 100));
  });

  refs.speedSelect.addEventListener("change", () => {
    const rate = Number(refs.speedSelect.value);
    refs.htmlPlayer.playbackRate = rate;
    if (streamPlayer) streamPlayer.playbackRate = rate;
    if (state.ytReady) state.ytPlayer.setPlaybackRate(rate);
  });

  refs.repeatBtn.addEventListener("click", () => {
    if (state.repeatMode === "off") {
      state.repeatMode = "one";
    } else if (state.repeatMode === "one") {
      state.repeatMode = "all";
    } else {
      state.repeatMode = "off";
    }
    updateRepeatUi();
  });

  refs.autoplayBtn.addEventListener("click", () => {
    state.autoplay = !state.autoplay;
    refs.autoplayBtn.classList.toggle("is-active", state.autoplay);
    refs.autoplayBtn.setAttribute("aria-pressed", String(state.autoplay));
    refs.autoplayBtn.textContent = state.autoplay ? "Autoplay on" : "Autoplay off";
  });

  if (refs.bgFreeBtn) {
    refs.bgFreeBtn.addEventListener("click", () => {
      state.preferFreeInBackground = !state.preferFreeInBackground;
      saveBackgroundPreference(state.preferFreeInBackground);
      updateBackgroundPreferenceUi();
      if (state.preferFreeInBackground) ensureBackgroundStreamsAhead().catch(() => null);
    });
  }

  if (refs.freeSwapBtn) {
    refs.freeSwapBtn.addEventListener("click", () => {
      refs.freeSwapBtn.disabled = true;
      switchCurrentToFreeCatalog()
        .catch(() => updateOnlineHint("No se pudo consultar los catalogos libres."))
        .finally(() => {
          refs.freeSwapBtn.disabled = false;
        });
    });
  }

  if (refs.navHome) refs.navHome.addEventListener("click", () => setView("home"));  if (refs.navExplore) refs.navExplore.addEventListener("click", () => setView("explore"));
  if (refs.navLibrary) refs.navLibrary.addEventListener("click", () => setView("library"));

  if (refs.discoverRefreshBtn) {
    refs.discoverRefreshBtn.addEventListener("click", async () => {
      refs.discoverRefreshBtn.disabled = true;
      refs.discoverRefreshBtn.textContent = "Buscando...";
      try {
        await loadDiscovery({ force: true });
      } finally {
        refs.discoverRefreshBtn.disabled = false;
        refs.discoverRefreshBtn.textContent = "Actualizar";
      }
    });
  }

  if (refs.libraryExtras) {
    refs.libraryExtras.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-query]");
      if (!btn) return;
      runLibraryQuery(btn.getAttribute("data-query"));
    });
  }

  if (refs.shareBtn) {
    refs.shareBtn.addEventListener("click", () => {
      shareCurrentTrack();
    });
  }

  refs.htmlPlayer.addEventListener("timeupdate", () => {
    updateTimeUi(refs.htmlPlayer.currentTime, refs.htmlPlayer.duration);
  });

  refs.htmlPlayer.addEventListener("ended", onMediaEnded);
  refs.htmlPlayer.addEventListener("play", () => {
    state.isPlaying = true;
    updateMediaSession();
    if (refs.miniPlayPause) refs.miniPlayPause.textContent = "⏸";
    updatePrimaryPlayButton();
  });
  refs.htmlPlayer.addEventListener("pause", () => {
    state.isPlaying = false;
    updateMediaSession();
    if (refs.miniPlayPause) refs.miniPlayPause.textContent = "▶";
    updatePrimaryPlayButton();
  });

  document.addEventListener("visibilitychange", () => {
    if (state.current?.kind !== "youtube" || state.userPaused || !state.isPlaying) return;
    startSilentKeepAlive();
    resumeYouTubeSoon();
  });
}

function saveBackgroundPreference(value) {
  try {
    localStorage.setItem("duo.preferFreeInBackground", value ? "1" : "0");
  } catch (_) {
    // Ignore storage failures.
  }
}

function loadBackgroundPreference() {
  try {
    return localStorage.getItem("duo.preferFreeInBackground") !== "0";
  } catch (_) {
    return true;
  }
}

function updateBackgroundPreferenceUi() {
  if (!refs.bgFreeBtn) return;
  refs.bgFreeBtn.classList.toggle("is-active", state.preferFreeInBackground);
  refs.bgFreeBtn.setAttribute("aria-pressed", String(state.preferFreeInBackground));
  refs.bgFreeBtn.textContent = state.preferFreeInBackground ? "Fondo libre on" : "Fondo libre off";
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

function openLocalLibraryDb() {
  if (!window.indexedDB) return Promise.resolve(null);
  if (localDbPromise) return localDbPromise;

  localDbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(LOCAL_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LOCAL_DB_STORE)) {
        const store = db.createObjectStore(LOCAL_DB_STORE, { keyPath: "key" });
        store.createIndex("mode", "mode", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch(() => null);

  return localDbPromise;
}

function persistableLocalRow(mode, item) {
  return {
    key: `${mode}:${item.id}`,
    mode,
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    kind: item.kind || "local",
    fileBlob: item.fileBlob || null,
    thumbnailBlob: item.thumbnailBlob || null
  };
}

async function persistLocalLibrary(mode) {
  const db = await openLocalLibraryDb();
  if (!db) return;

  const items = (state.library[mode]?.local || []).filter((x) => x.fileBlob);
  await new Promise((resolve) => {
    const tx = db.transaction(LOCAL_DB_STORE, "readwrite");
    const store = tx.objectStore(LOCAL_DB_STORE);
    const index = store.index("mode");
    const req = index.openCursor(IDBKeyRange.only(mode));

    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        items.forEach((item) => store.put(persistableLocalRow(mode, item)));
        return;
      }
      store.delete(cursor.primaryKey);
      cursor.continue();
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

async function restoreLocalLibraryMode(mode) {
  const db = await openLocalLibraryDb();
  if (!db) return [];

  return new Promise((resolve) => {
    const tx = db.transaction(LOCAL_DB_STORE, "readonly");
    const store = tx.objectStore(LOCAL_DB_STORE);
    const index = store.index("mode");
    const req = index.getAll(IDBKeyRange.only(mode));

    req.onsuccess = () => {
      const rows = Array.isArray(req.result) ? req.result : [];
      const items = rows
        .map((row) => {
          if (!row?.fileBlob) return null;
          return {
            id: row.id,
            title: row.title || "Sin titulo",
            subtitle: row.subtitle || "Local",
            kind: row.kind || "local",
            fileBlob: row.fileBlob,
            thumbnailBlob: row.thumbnailBlob || null,
            url: URL.createObjectURL(row.fileBlob),
            thumbnail: row.thumbnailBlob ? URL.createObjectURL(row.thumbnailBlob) : ""
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
      resolve(items);
    };

    req.onerror = () => resolve([]);
  });
}

async function restoreLocalLibraries() {
  const music = await restoreLocalLibraryMode("music");
  const video = await restoreLocalLibraryMode("video");
  state.library.music.local = music;
  state.library.video.local = video;
  state.queue.music.local = [...music];
  state.queue.video.local = [...video];
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
        const pending = state.pendingYouTubeItem;
        state.pendingYouTubeItem = null;
        if (pending && state.current?.id === pending.id) {
          playYouTube(pending);
        }
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.ENDED) onMediaEnded();
        if (event.data === YT.PlayerState.PLAYING) {
          state.isPlaying = true;
          state.userPaused = false;
          startSilentKeepAlive();
          setMediaActionHandlers();
          updateMediaSession();
          if (refs.miniPlayPause) refs.miniPlayPause.textContent = "⏸";
          updatePrimaryPlayButton();
        }
        if (event.data === YT.PlayerState.PAUSED) {
          // YouTube pausa solo al pasar a segundo plano; se reanuda si el usuario no pauso.
          if (!state.userPaused && document.hidden) {
            resumeYouTubeSoon();
            return;
          }
          state.isPlaying = false;
          stopSilentKeepAlive();
          updateMediaSession();
          if (refs.miniPlayPause) refs.miniPlayPause.textContent = "▶";
          updatePrimaryPlayButton();
        }
      },
      onError: (event) => {
        handleYouTubePlaybackError(event?.data);
      }
    }
  });
};

// 2: id invalido, 5: error del reproductor HTML5, 100: no disponible,
// 101/150: el dueno no permite incrustar el video.
async function handleYouTubePlaybackError(code) {
  const current = state.current;
  if (!current || current.kind !== "youtube") return;

  if (isOnlineQueueMode()) {
    const qState = onlineQueueState();
    if (!Array.isArray(qState.blockedIds)) qState.blockedIds = [];
    if (current.id && !qState.blockedIds.includes(current.id)) {
      qState.blockedIds.push(current.id);
    }
    dropFromQueues(current.id);
  }

  const embedBlocked = code === 101 || code === 150;
  const reason = embedBlocked
    ? "El autor no permite reproducir este video fuera de YouTube."
    : "Este video no esta disponible.";
  updateOnlineHint(`${reason} Buscando otra version de la misma cancion...`);

  const replaced = await playSameSongAlternative(current);
  if (replaced) return;

  if (!state.autoplay) {
    updateOnlineHint(`${reason} Reproduccion detenida.`);
    state.isPlaying = false;
    stopSilentKeepAlive();
    updatePrimaryPlayButton();
    return;
  }

  nextTrack();
  updateOnlineHint(`${reason} No hay otra version, sigo con la cola.`);
}

function dropFromQueues(id) {
  if (!id) return;
  const qState = onlineQueueState();
  const idx = nowIndex();
  qState.related = qState.related.filter((x) => x.id !== id);
  qState.results = qState.results.filter((x) => x.id !== id);
  state.queue[state.mode][state.source] = state.queue[state.mode][state.source].filter((x) => x.id !== id);
  setNowIndex(Math.max(-1, idx - 1));
  renderQueue();
}

function tick() {
  if (state.current && state.current.kind === "youtube" && state.ytReady) {
    const current = state.ytPlayer.getCurrentTime();
    const duration = state.ytPlayer.getDuration();
    updateTimeUi(current, duration);

    // El iframe reclama la sesion de medios; hay que reafirmarla cada tanto.
    const now = Date.now();
    if (state.isPlaying && now - lastMediaSessionAssert > 4000) {
      lastMediaSessionAssert = now;
      setMediaActionHandlers();
      updateMediaSession();
    }
  }

  drawVisualizerFrame();

  requestAnimationFrame(tick);
}

async function bootstrap() {
  state.youtubeApiKey = String(appConfig.youtubeApiKey || "").trim() || loadApiKey();
  state.discoverRotation = loadDiscoverRotation();
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

  await restoreLocalLibraries();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (refs.installAppBtn) refs.installAppBtn.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    if (refs.installAppBtn) refs.installAppBtn.hidden = true;
  });

  initAudioVisualizer();
  enablePlayerWindowInteraction();
  renderMoodChips();
  updatePrimaryPlayButton();
  updateShuffleUi();
  updateRepeatUi();
  updateQueueViewUi();
  state.preferFreeInBackground = loadBackgroundPreference();
  updateBackgroundPreferenceUi();
  if (refs.miniPlayer) refs.miniPlayer.hidden = false;
  setMode("music");
  setSource("online");
  setPlayerOpen(false);
  centerPlayerWindow();
  setResultsVisible(false);
  if (refs.discoverSection) refs.discoverSection.hidden = false;
  loadDiscovery();
  setMediaActionHandlers();
  tick();

  if (!window.__duoDiscoveryRefreshTimer) {
    window.__duoDiscoveryRefreshTimer = window.setInterval(() => {
      if (!refs.discoverSection || refs.discoverSection.hidden) return;
      if (document.hidden) return;
      loadDiscovery();
    }, 120000);
  }

  if (!window.__duoQueueGrowthTimer) {
    window.__duoQueueGrowthTimer = window.setInterval(() => {
      if (state.source !== "online" || !isRadioPlayable(state.current) || !state.isPlaying) return;
      ensureOnlineQueueGrowth(20, 56).catch(() => null);
    }, 15000);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js?v=43", { updateViaCache: "none" }).catch(() => null);
  }
}

bootstrap();
