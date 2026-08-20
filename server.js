const express = require("express");
const path = require("path");
const yts = require("yt-search");

const app = express();
const PORT = process.env.PORT || 5173;

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanTitleForQuery(title) {
  return normalizeText(title)
    .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, " ")
    .replace(/official|video|lyrics|lyric|audio|live|mix|remix|playlist|ft\.?|feat\.?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Firma sin canal y sin orden: reuploads de la misma cancion colapsan en una clave.
function trackSignature(title) {
  const parts = cleanTitleForQuery(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((x) => x && x.length > 2);
  return Array.from(new Set(parts)).sort().slice(0, 6).join(" ");
}

const genreLexicon = {
  edm: ["edm", "electronic", "dance", "festival", "big room", "progressive"],
  house: ["house", "deep house", "tech house"],
  trance: ["trance", "psytrance", "uplifting"],
  techno: ["techno", "minimal techno", "hard techno"],
  hiphop: ["hip hop", "hiphop", "rap", "trap", "drill"],
  reggaeton: ["reggaeton", "latin urbano", "dembow"],
  pop: ["pop", "mainstream", "chart"],
  rock: ["rock", "alternative", "indie rock", "metal", "punk"],
  lofi: ["lofi", "lo-fi", "chillhop", "study beats"],
  ambient: ["ambient", "relax", "meditation", "sleep"]
};

function detectGenres(text) {
  const raw = normalizeText(text).toLowerCase();
  const found = [];
  Object.entries(genreLexicon).forEach(([genre, words]) => {
    if (words.some((w) => raw.includes(w))) found.push(genre);
  });
  return found;
}

function inferGenre(seed, genreHint, mood) {
  const fromHint = normalizeText(genreHint).toLowerCase();
  if (fromHint && genreLexicon[fromHint]) return fromHint;
  const byText = detectGenres(seed || "");
  if (byText.length) return byText[0];
  const moodMap = {
    energia: "edm",
    relax: "lofi",
    concentracion: "lofi",
    fiesta: "reggaeton",
    triste: "pop",
    romantica: "pop"
  };
  return moodMap[String(mood || "").toLowerCase()] || "pop";
}

function mapVideo(v) {
  return {
    id: `yt-${v.videoId}`,
    youtubeId: v.videoId,
    title: normalizeText(v.title || "Sin titulo"),
    subtitle: `${normalizeText(v.author?.name || "Canal")} - ${normalizeText(v.timestamp || "00:00")}`,
    thumbnail: v.thumbnail || "",
    kind: "youtube"
  };
}

function pickDiverse(videos, { excludeIds = new Set(), excludeSignatures = new Set(), limit = 24, maxPerAuthor = 4 } = {}) {
  const out = [];
  const ids = new Set(excludeIds);
  const sigs = new Set(excludeSignatures);
  const authors = new Map();

  for (const v of videos || []) {
    if (!v?.videoId) continue;
    const id = `yt-${v.videoId}`;
    if (ids.has(id)) continue;

    const sig = trackSignature(v.title);
    if (sig && sigs.has(sig)) continue;

    const author = normalizeText(v.author?.name || "").toLowerCase();
    if (author && (authors.get(author) || 0) >= maxPerAuthor) continue;

    ids.add(id);
    if (sig) sigs.add(sig);
    if (author) authors.set(author, (authors.get(author) || 0) + 1);
    out.push(mapVideo(v));
    if (out.length >= limit) break;
  }

  return out;
}

app.use(express.static(path.join(__dirname)));

app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const mode = String(req.query.mode || "music").toLowerCase();
  if (!q) {
    return res.status(400).json({ error: "Missing q" });
  }

  try {
    const data = await yts(q);
    const list = (data.videos || []).slice(0, 30).map((v) => ({
      id: `yt-${v.videoId}`,
      youtubeId: v.videoId,
      title: v.title || "Sin titulo",
      subtitle: `${v.author?.name || "Canal"} - ${v.timestamp || "00:00"}`,
      thumbnail: v.thumbnail || "",
      kind: "youtube"
    }));

    const filtered = mode === "music"
      ? list.filter((x) => !/shorts/i.test(x.title)).slice(0, 20)
      : list;

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

app.get("/api/recommend", async (req, res) => {
  const videoId = String(req.query.videoId || "").trim();
  const seedHint = String(req.query.seed || "").trim();
  const genreHint = String(req.query.genre || "").trim();
  const moodHint = String(req.query.mood || "").trim();
  if (!videoId) {
    return res.status(400).json({ error: "Missing videoId" });
  }

  try {
    const details = await yts({ videoId });
    const seedTitle = normalizeText(details?.title || "");
    const seedAuthor = normalizeText(details?.author?.name || "");
    const genre = inferGenre(`${seedHint} ${seedTitle} ${seedAuthor}`, genreHint, moodHint);
    const seedSignature = trackSignature(seedTitle);
    const excludeIds = new Set([`yt-${videoId}`]);
    const excludeSignatures = new Set(seedSignature ? [seedSignature] : []);

    const buckets = [];

    if (Array.isArray(details?.related_videos) && details.related_videos.length) {
      buckets.push(details.related_videos);
    }

    // Las recomendaciones se anclan al artista de la pista elegida. Las consultas
    // genericas por genero devuelven mixes desconectados de la seleccion.
    const searchQueries = [];
    if (seedAuthor) {
      searchQueries.push(`artists similar to ${seedAuthor}`);
      searchQueries.push(`${seedAuthor} ${genre} songs`);
      searchQueries.push(`${seedAuthor} similar songs`);
    }
    if (!seedAuthor && seedHint) {
      searchQueries.push(`${seedHint} similar songs`);
      searchQueries.push(`${seedHint} ${genre} songs`);
    }
    if (!searchQueries.length) {
      searchQueries.push(`${genre} songs`);
    }

    for (const q of searchQueries) {
      if (!q.trim()) continue;
      try {
        const data = await yts(q);
        if (Array.isArray(data?.videos) && data.videos.length) {
          buckets.push(data.videos);
        }
      } catch (_) {
        // Continue with next query.
      }
    }

    const merged = [];
    buckets.forEach((list) => {
      list.forEach((v) => merged.push(v));
    });

    const related = pickDiverse(merged, {
      excludeIds,
      excludeSignatures,
      limit: 30
    });

    res.json(related);
  } catch (error) {
    res.status(500).json({ error: "Recommend failed" });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Reproductor Duo en http://localhost:${PORT}`);
});
