const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "..")));

const PORT = process.env.PORT || 3000;

const UNIVERSE_IDS = [
    3214114884, // Flag Wars (corrected)
    6508759464, // Grace
    9474062886, // FarChance UGC
    4235402932, // Survival Of The Fittest
    1195308961, // Time Wasting Simulator
    2722569653, // TVA
    6963638414, // Don't Blink
    9849457491, // FarChance's Easter Expedition
    6421173906, // Boomtato Unlit
    9684251607, // Intergalactical Contact
    1081987046, // Melee Smash Legacy
];

app.get("/api/work", async (req, res) => {
    try {
        const workDir = path.join(__dirname, "..", "work");
        if (!fs.existsSync(workDir)) {
            return res.json({ folders: [] });
        }

        const folders = fs.readdirSync(workDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);

        const data = folders.map((folderName) => {
            const previewPath = path.join(workDir, folderName, "index.html");
            return {
                id: folderName,
                hasIndex: fs.existsSync(previewPath)
            };
        });

        res.json({ folders: data });
    } catch (err) {
        console.error("Error reading work folders:", err.message);
        res.status(500).json({ error: "Failed to read work folders" });
    }
});

app.get("/api/work/:id/media", async (req, res) => {
    try {
        const workDir = path.join(__dirname, "..", "work", req.params.id);
        if (!fs.existsSync(workDir) || !fs.lstatSync(workDir).isDirectory()) {
            return res.status(404).json({ files: [] });
        }

        const supported = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".mp4", ".webm", ".mov"];
        const files = fs.readdirSync(workDir, { withFileTypes: true })
            .filter((entry) => entry.isFile())
            .filter((entry) => entry.name.toLowerCase() !== "index.html")
            .map((entry) => ({ name: entry.name, ext: path.extname(entry.name).toLowerCase() }))
            .filter((entry) => supported.includes(entry.ext))
            .map((entry) => ({
                name: entry.name,
                url: `/work/${encodeURIComponent(req.params.id)}/${encodeURIComponent(entry.name)}`,
                type: [".mp4", ".webm", ".mov"].includes(entry.ext) ? "video" : "image",
            }));

        res.json({ files });
    } catch (err) {
        console.error("Error reading work media:", err.message);
        res.status(500).json({ error: "Failed to read work media" });
    }
});

app.get("/api/visits", async (req, res) => {
    try {
        const gameInfoUrl = `https://games.roblox.com/v1/games?universeIds=${UNIVERSE_IDS.join(",")}`;
        const gameInfo = await axios.get(gameInfoUrl);

        const thumbUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${UNIVERSE_IDS.join(",")}&size=256x256&format=Png&isCircular=false&retrying=true`;
        const thumbs = await axios.get(thumbUrl);

        const thumbMap = {};
        thumbs.data.data.forEach(t => {
            thumbMap[t.targetId] = t.imageUrl;
        });

        const combined = UNIVERSE_IDS.map(id => {
            const game = gameInfo.data.data.find(g => g.id === id) || {};
            return {
                id,
                name: game.name || "Unknown Game",
                creator: game.creator || { name: "Unknown" },
                visits: game.visits || 0,
                playing: game.playing || 0,
                favoritedCount: game.favoritedCount || 0,
                rootPlaceId: game.rootPlaceId || id,
                thumbnail: thumbMap[id] || null
            };
        });

        const totals = combined.reduce(
            (acc, g) => ({
                visits: acc.visits + g.visits,
                playing: acc.playing + g.playing,
                favorites: acc.favorites + g.favoritedCount
            }),
            { visits: 0, playing: 0, favorites: 0 }
        );

        res.json({
            updated: new Date().toISOString(),
            totals,
            games: combined
        });

    } catch (err) {
        console.error("Error fetching Roblox data:", err.message);
        res.status(500).json({ error: "Failed to fetch Roblox data" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
