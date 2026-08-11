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

function trackSignature(title, author) {
  const artist = normalizeText(author).toLowerCase();
  const core = cleanTitleForQuery(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((x) => x && x.length > 2)
    .slice(0, 6)
    .join(" ");
  return `${artist}|${core}`;
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

function pickDiverse(videos, { excludeIds = new Set(), excludeSignatures = new Set(), limit = 24 } = {}) {
  const out = [];
  const ids = new Set(excludeIds);
  const sigs = new Set(excludeSignatures);

  for (const v of videos || []) {
    if (!v?.videoId) continue;
    const id = `yt-${v.videoId}`;
    if (ids.has(id)) continue;

    const sig = trackSignature(v.title, v.author?.name || "");
    if (sig && sigs.has(sig)) continue;

    ids.add(id);
    if (sig) sigs.add(sig);
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
  if (!videoId) {
    return res.status(400).json({ error: "Missing videoId" });
  }

  try {
    const details = await yts({ videoId });
    const seedTitle = normalizeText(details?.title || "");
    const seedAuthor = normalizeText(details?.author?.name || "");
    const seedSignature = trackSignature(seedTitle, seedAuthor);
    const excludeIds = new Set([`yt-${videoId}`]);
    const excludeSignatures = new Set(seedSignature ? [seedSignature] : []);

    const buckets = [];

    if (Array.isArray(details?.related_videos) && details.related_videos.length) {
      buckets.push(details.related_videos);
    }

    const searchQueries = [];
    if (seedAuthor && seedTitle) searchQueries.push(`${seedAuthor} ${cleanTitleForQuery(seedTitle)}`);
    if (seedTitle) searchQueries.push(`${cleanTitleForQuery(seedTitle)} similar songs`);
    if (seedAuthor) searchQueries.push(`${seedAuthor} top tracks`);

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
