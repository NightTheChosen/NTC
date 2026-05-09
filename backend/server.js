const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// Render requires dynamic port binding
const PORT = process.env.PORT || 3000;

// Universe IDs in your preferred order
const UNIVERSE_IDS = [
    1160789089, // Flag Wars
    6508759464, // Grace
    9474062886, // FarChance UGC
    4235402932, // Survival Of The Fittest
    1195308961  // Time Wasting Simulator
];

// Debug route to confirm server is alive
app.get("/api/debug", (req, res) => {
    res.json({
        message: "Server is alive",
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.get("/api/visits", async (req, res) => {
    try {
        // Fetch game info
        const gameInfoUrl = `https://games.roblox.com/v1/games?universeIds=${UNIVERSE_IDS.join(",")}`;
        const gameInfo = await axios.get(gameInfoUrl);

        console.log("Fetched games from Roblox:", gameInfo.data.data.map(g => g.id));

        // Fetch thumbnails
        const thumbUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${UNIVERSE_IDS.join(",")}&size=256x256&format=Png&isCircular=false`;
        const thumbs = await axios.get(thumbUrl);

        // Map thumbnails by universe ID
        const thumbMap = {};
        thumbs.data.data.forEach(t => {
            thumbMap[t.targetId] = t.imageUrl;
        });

        // Combine data
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

        // Totals
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
