const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const UNIVERSE_IDS = [
    1160789089, // Flag Wars
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
