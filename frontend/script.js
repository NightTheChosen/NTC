const GAME_POSITION = {
    1160789089: "Animator",
    6508759464: "UGC Uploader",
    9474062886: "Founder",
    4235402932: "Animator",
    1195308961: "Contributor"
};

async function loadData() {
    try {
        const res = await fetch("http://localhost:3000/api/visits");
        const data = await res.json();

        if (!data.games || data.games.length === 0) {
            document.getElementById("output").innerHTML = "No games found.";
            return;
        }

        // Sort games by visits (highest first)
        data.games.sort((a, b) => b.visits - a.visits);

        // Update totals
        const totals = data.totals;
        document.getElementById("totals").innerHTML = `
            <strong>Total Visits:</strong> ${totals.visits.toLocaleString()} |
            <strong>Total Playing:</strong> ${totals.playing.toLocaleString()} |
            <strong>Total Favorites:</strong> ${totals.favorites.toLocaleString()}
        `;

        // Render sorted games
        document.getElementById("output").innerHTML =
            data.games.map(g => `
                <div class="game">
                    <img src="${g.thumbnail || ''}" alt="Thumbnail">
                    <div class="info">
                        <h2>
                            <a href="https://www.roblox.com/games/${g.rootPlaceId}" target="_blank">
                                ${g.name}
                            </a>
                        </h2>
                        <p><strong>Creator:</strong> ${g.creator?.name || "Unknown"}</p>
                        <p><strong>Position:</strong> ${GAME_POSITION[g.id] || "None"}</p>
                        <p><strong>Visits:</strong> ${g.visits.toLocaleString()}</p>
                        <p><strong>Playing:</strong> ${g.playing.toLocaleString()}</p>
                        <p><strong>Favorites:</strong> ${g.favoritedCount.toLocaleString()}</p>
                    </div>
                </div>
            `).join("");

    } catch (err) {
        document.getElementById("output").innerHTML = "Failed to load data.";
        console.error("Frontend error:", err);
    }
}

loadData();
setInterval(loadData, 30000);
