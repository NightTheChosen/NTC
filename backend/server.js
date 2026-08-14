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

// Serve embeddable HTML dynamically so embeds work even if static files
app.get('/embed', (req, res) => {
    const host = req.get('host');
    // Force embed to render dark so static deploys show dark embed
    const themeAttr = ' data-theme="dark"';
    res.type('html').send(`<!DOCTYPE html>
<html lang="en"${themeAttr}>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>NTC Embed — Games Worked On</title>
    <script>(function(){try{var params=new URLSearchParams((typeof window!=='undefined'&&window.location?window.location.search:('')));if(params.get&&params.get('theme')==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();</script>
    <style>:root{--bg:#070712;--text:#e6e6e6;--card:#0f1720;--accent:#4da3ff}:root[data-theme="light"]{--bg:#fff;--text:#111;--card:#f7f8fb;--accent:#0078d7}html,body{margin:0;height:100%;font-family:Inter,Segoe UI,system-ui,Arial;background:var(--bg);color:var(--text)}.wrap{padding:12px;box-sizing:border-box}.header{display:flex;align-items:center;gap:10px;margin-bottom:12px}.title{font-weight:700;font-size:16px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}.card{background:var(--card);border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:8px;align-items:center}.thumb{width:120px;height:120px;object-fit:cover;border-radius:8px;border:1px solid rgba(0,0,0,0.06)}.name{font-size:14px;font-weight:700;text-align:center}.pos{font-size:12px;color:#444}.note{font-size:12px;color:#666;margin-top:10px}.example{margin-top:8px;background:#f3f4f6;padding:8px;border-radius:6px;font-family:monospace;font-size:12px}</style>
</head>
<body>
    <div class="wrap">
        <div class="header"><div class="title">NightTheChosen — Selected Works</div></div>
        <div id="grid" class="grid">Loading…</div>
    </div>
    <script>
        const GAME_POSITION = {1160789089:'Animator',6508759464:'UGC Uploader',9474062886:'Founder',4235402932:'Animator',1195308961:'Contributor',2722569653:'Animator',6963638414:'Founder',9849457491:'Founder',6421173906:'Founder',9684251607:'Founder',1081987046:'Contributor'};
        async function load(){
            try{
                const res = await fetch('/api/visits');
                if(!res.ok) throw new Error('API error');
                const data = await res.json();
                var games = (data.games||[]).filter(function(g){ return GAME_POSITION[g.id]; });
                var grid = document.getElementById('grid');
                if(!games.length){ grid.innerHTML = '<div class="note">No matching games found.</div>'; return; }
                var html = games.map(function(g){ return '<div class="card"><img class="thumb" src="'+(g.thumbnail||'')+'" alt="'+escapeHtml(g.name)+'"><div class="name">'+escapeHtml(g.name)+'</div><div class="pos">'+(GAME_POSITION[g.id]||'')+'</div></div>'; }).join('');
                grid.innerHTML = html;
                setTimeout(function(){ var h = document.documentElement.scrollHeight; try{ parent.postMessage({type:'embed-height',height:h}, '*'); }catch(e){} }, 50);
            }catch(err){ document.getElementById('grid').innerHTML = '<div class="note">Failed to load embed.</div>'; console.error(err); }
        }
        function escapeHtml(s){ return (s+'').replace(/[&<>\"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]; }); }
        window.addEventListener('message', function(ev){ if(ev && ev.data && ev.data.type === 'request-height'){ var h = document.documentElement.scrollHeight; try{ parent.postMessage({type:'embed-height',height:h}, '*'); }catch(e){} } });
        load();
    </script>
</body>
</html>`);
});

// Redirect old static path to dynamic route (helps existing embeds)
app.get('/embed.html', (req, res) => res.redirect(302, '/embed'));

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
            const game = gameInfo.data.data.find(g => g.id === id || g.rootPlaceId === id) || {};
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
