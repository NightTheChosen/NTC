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
    1081987046: "Contributor"
};

const API_URL = "https://ntc-fn7y.onrender.com/api/visits";
let lastUpdated = null;
let secondsUntilRefresh = 90;
const REFRESH_INTERVAL = 90000;

let allGames = [];
let isDarkMode = false;

const STAR_COUNT = 70;
const STAR_MIN_SIZE = 1.8;
const STAR_MAX_SIZE = 4.2;
const STAR_MOUSE_STRENGTH = 35;
const STAR_FOLLOW_SPEED = 0.08;

let starElements = [];
let targetX = 0.5;
let targetY = 0.5;
let currentX = 0.5;
let currentY = 0.5;
let starContainer = null;

function init() {
    applyThemeByLocalTime();
    setupStars();
    setupDarkMode();
    loadData();
    setInterval(updateCountdown, 1000);
    setInterval(loadData, REFRESH_INTERVAL);
}

function applyThemeByLocalTime() {
    const hour = new Date().getHours();
    const shouldDark = hour >= 19 || hour < 6;
    document.body.classList.toggle("dark", shouldDark);
}

function setupStars() {
    const stars = document.getElementById("stars");
    if (!stars) return;

    starContainer = stars;
    buildStars();
    window.addEventListener("resize", buildStars);
    document.addEventListener("mousemove", (event) => {
        targetX = event.clientX / window.innerWidth;
        targetY = event.clientY / window.innerHeight;
    });
    requestAnimationFrame(animateStars);
}

function buildStars() {
    if (!starContainer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    starContainer.innerHTML = "";
    starElements = [];

    for (let i = 0; i < STAR_COUNT; i++) {
        const size = STAR_MIN_SIZE + Math.random() * (STAR_MAX_SIZE - STAR_MIN_SIZE);
        const star = document.createElement("div");
        star.className = "star";
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.opacity = `${0.35 + Math.random() * 0.55}`;

        const baseX = Math.random() * (width - size);
        const baseY = Math.random() * (height - size);
        star.style.left = `${baseX}px`;
        star.style.top = `${baseY}px`;

        starContainer.appendChild(star);

        starElements.push({
            el: star,
            baseX,
            baseY,
            size,
            speed: 0.8 + Math.random() * 0.9,
            phase: Math.random() * Math.PI * 2,
            driftX: 4 + Math.random() * 10,
            driftY: 4 + Math.random() * 10,
            parallaxScale: 0.4 + Math.random() * 0.9
        });
    }
}

function animateStars(timestamp) {
    currentX += (targetX - currentX) * STAR_FOLLOW_SPEED;
    currentY += (targetY - currentY) * STAR_FOLLOW_SPEED;

    const parallaxX = (currentX - 0.5) * STAR_MOUSE_STRENGTH;
    const parallaxY = (currentY - 0.5) * STAR_MOUSE_STRENGTH;
    const time = (timestamp || 0) / 1000;

    starElements.forEach((star) => {
        const idleX = Math.sin(time * star.speed + star.phase) * star.driftX;
        const idleY = Math.cos(time * star.speed + star.phase * 1.2) * star.driftY;
        const x = idleX + parallaxX * star.parallaxScale;
        const y = idleY + parallaxY * star.parallaxScale;
        star.el.style.transform = `translate(${x}px, ${y}px)`;
    });

    requestAnimationFrame(animateStars);
}

function setupDarkMode() {
    const toggleDark = document.getElementById("toggleDark");
    if (!toggleDark) return;

    isDarkMode = document.body.classList.contains("dark");
    toggleDark.textContent = isDarkMode ? "Light Mode" : "Dark Mode";

    toggleDark.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        isDarkMode = document.body.classList.contains("dark");
        toggleDark.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
    });
}

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

init();
