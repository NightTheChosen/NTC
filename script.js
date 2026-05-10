const GAME_POSITION = {
    1160789089: "Animator",
    6508759464: "UGC Uploader",
    9474062886: "Founder",
    4235402932: "Animator",
    1195308961: "Contributor",
    2722569653: "Animator",
    6963638414: "Founder",
    9849457491: "Founder",
    6421173906: "Founder",
    9684251607: "Founder",
    1081987046: "Developer"
};

const API_URL = "https://ntc-fn7y.onrender.com/api/visits";
let lastUpdated = null;
let secondsUntilRefresh = 90;
const REFRESH_INTERVAL = 90000;

function updateCountdown() {
    secondsUntilRefresh--;
    if (secondsUntilRefresh < 0) {
        secondsUntilRefresh = 90;
    }
    renderFooter();
}

function renderFooter() {
    let footer = document.getElementById("footer");
    if (!footer) {
        footer = document.createElement("div");
        footer.id = "footer";
        document.body.appendChild(footer);
    }
    
    const timeStr = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—";
    const mins = Math.floor(secondsUntilRefresh / 60);
    const secs = secondsUntilRefresh % 60;
    
    footer.innerHTML = `<strong>Last Refreshed:</strong> ${timeStr} | <strong>Next in:</strong> ${mins}:${secs.toString().padStart(2, "0")}`;
}
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
    renderFooter();
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
    if (!filter) {
        console.error("groupFilter element not found in DOM");
        return;
    }

    const currentSelection = filter.value;
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

    filter.value = currentSelection;

    if (!filter.onchange) {
        filter.onchange = () => {
            const filtered = getFilteredGames();
            renderTotals(filtered);
            renderGames(filtered);
        };
    }
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

        lastUpdated = new Date().toISOString();
        secondsUntilRefresh = 90;
        renderFooter();
        allGames = data.games.sort((a, b) => b.visits - a.visits);
        buildGroupFilter(allGames);

        const filtered = getFilteredGames();
        renderTotals(filtered);
        renderGames(filtered);

    } catch (err) {
        document.getElementById("output").innerHTML = "Failed to load data from API.";
    }
}

loadData();
setInterval(updateCountdown, 1000);
setInterval(loadData, REFRESH_INTERVAL);