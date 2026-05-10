const GAME_POSITION = {
    1160789089: "Animator",
    6508759464: "UGC Uploader",
    9474062886: "Founder",
    4235402932: "Animator",
    1195308961: "Contributor",
    2722569653: "Animator",
    6963638414: "Founder",
    9849457491: "Founder"
};

const API_URL = "http://localhost:3000/api/visits";
let allGames = [];

function formatNumber(value) {
    return value.toLocaleString();
}

function getFilteredGames() {
    const filter = document.getElementById("groupFilter");
    const selected = filter?.value || "";
    if (!selected) return allGames;
    return allGames.filter(game => (game.creator?.name || "Unknown") === selected);
}

function renderTotals(games) {
    const totals = games.reduce(
        (acc, game) => ({
            visits: acc.visits + game.visits,
            playing: acc.playing + game.playing,
            favorites: acc.favorites + game.favoritedCount
        }),
        { visits: 0, playing: 0, favorites: 0 }
    );

    document.getElementById("totals").innerHTML = `
        <strong>Games:</strong> ${games.length} |
        <strong>Total Visits:</strong> ${formatNumber(totals.visits)} |
        <strong>Total Playing:</strong> ${formatNumber(totals.playing)} |
        <strong>Total Favorites:</strong> ${formatNumber(totals.favorites)}
    `;
}

function renderGames(games) {
    const output = document.getElementById("output");

    if (!games.length) {
        output.innerHTML = "No games match the selected group.";
        return;
    }

    output.innerHTML = games.map(g => `
        <div class="game">
            <img src="${g.thumbnail || 'https://tr.rbxcdn.com/4e4f2e6e8c6e8e8e8e8e8e8e8e8e/150/150/Image/Png'}" alt="Thumbnail">
            <div class="info">
                <h2>
                    <a href="https://www.roblox.com/games/${g.rootPlaceId}" target="_blank">
                        ${g.name}
                    </a>
                </h2>
                <p><strong>Creator:</strong> ${g.creator?.name || "Unknown"}</p>
                <p><strong>Position:</strong> ${GAME_POSITION[g.id] || "None"}</p>
                <p><strong>Visits:</strong> ${formatNumber(g.visits)}</p>
                <p><strong>Playing:</strong> ${formatNumber(g.playing)}</p>
                <p><strong>Favorites:</strong> ${formatNumber(g.favoritedCount)}</p>
            </div>
        </div>
    `).join("");
}

function buildGroupFilter(games) {
    const filter = document.getElementById("groupFilter");
    if (!filter) return;

    const creators = [...new Set(games.map(game => game.creator?.name || "Unknown"))].sort((a, b) => a.localeCompare(b));
    filter.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "All games";
    filter.appendChild(defaultOption);

    creators.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        filter.appendChild(option);
    });

    filter.onchange = () => {
        const filtered = getFilteredGames();
        renderTotals(filtered);
        renderGames(filtered);
    };
}

async function fetchVisits() {
    const res = await fetch(API_URL);
    if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
    }
    return await res.json();
}

async function loadData() {
    try {
        const data = await fetchVisits();

        if (!data.games || data.games.length === 0) {
            document.getElementById("output").innerHTML = "No games found.";
            return;
        }

        allGames = data.games.sort((a, b) => b.visits - a.visits);
        buildGroupFilter(allGames);

        const filtered = getFilteredGames();
        renderTotals(filtered);
        renderGames(filtered);

    } catch (err) {
        document.getElementById("output").innerHTML = "Failed to load data from local backend. Start the backend with `node backend/server.js` and reload the page.";
        console.error("Frontend error:", err);
    }
}

loadData();
setInterval(loadData, 30000);