const express = require("express");
const path = require("path");
const yts = require("yt-search");

const app = express();
const PORT = process.env.PORT || 5173;

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
    const related = (details.related_videos || []).slice(0, 12).map((v) => ({
      id: `yt-${v.videoId}`,
      youtubeId: v.videoId,
      title: v.title || "Recomendado",
      subtitle: `${v.author?.name || "Canal"} - ${v.timestamp || "00:00"}`,
      thumbnail: v.thumbnail || "",
      kind: "youtube"
    }));
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
