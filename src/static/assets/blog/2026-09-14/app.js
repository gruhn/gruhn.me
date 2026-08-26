const GOOGLE_MAPS_API_KEY = "AIzaSyCzceMMO38FiJoljlc2Ekz7VtUG66m670Q";

const DATA_CHUNKS = [
  { minId: 1, maxId: 5000, count: 3936, file: "/assets/blog/2026-09-14/roundabouts-00001-05000.json?v=4" },
  { minId: 5001, maxId: 10000, count: 3740, file: "/assets/blog/2026-09-14/roundabouts-05001-10000.json?v=4" },
  { minId: 10001, maxId: 15000, count: 4151, file: "/assets/blog/2026-09-14/roundabouts-10001-15000.json?v=4" },
  { minId: 15001, maxId: 20000, count: 4311, file: "/assets/blog/2026-09-14/roundabouts-15001-20000.json?v=4" },
  { minId: 20001, maxId: 25000, count: 4159, file: "/assets/blog/2026-09-14/roundabouts-20001-25000.json?v=4" },
  { minId: 25001, maxId: 30000, count: 3885, file: "/assets/blog/2026-09-14/roundabouts-25001-30000.json?v=4" },
  { minId: 30001, maxId: 35000, count: 1718, file: "/assets/blog/2026-09-14/roundabouts-30001-35000.json?v=4" },
  { minId: 35001, maxId: 40000, count: 1778, file: "/assets/blog/2026-09-14/roundabouts-35001-40000.json?v=4" },
  { minId: 40001, maxId: 45000, count: 627, file: "/assets/blog/2026-09-14/roundabouts-40001-45000.json?v=4" },
];
const INTERESTING_IDS = [
  8302, 32681, 27708, 1426, 20928,
  25804, 19174, 7181,
  6608, 23279, 12392, 28673, 10466, 11432,
  26609, 24296, 37580, 22671, 25899, 28342,
  32092, 9150, 9240, 30007, 23150, 27186, 19113, 5460,
  27832, 23128, 1076, 9783, 18163, 25228, 32648, 12450, 7061, 5738,
  8198, 12750, 20925, 8273, 20006, 9869, 8462,
  5992, 23632,
];
const totalEntries = DATA_CHUNKS.reduce((total, chunk) => total + chunk.count, 0);
const chunkCache = new Map();

const ui = typeof document === "undefined" ? {} : {
  loading: document.querySelector("#loading"),
  streetView: document.querySelector("#street-view"),
  randomize: document.querySelector("#randomize"),
  randomizeInteresting: document.querySelector("#randomize-interesting"),
  copyLink: document.querySelector("#copy-link"),
  copyLinkLabel: document.querySelector("#copy-link-label"),
  title: document.querySelector("#title"),
  databaseLink: document.querySelector("#database-link"),
};

let currentEntry;

export function buildStreetViewEmbedUrl(location) {
  const url = new URL("https://www.google.com/maps/embed/v1/streetview");
  url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
  url.searchParams.set("location", `${location.lat},${location.lng}`);
  url.searchParams.set("radius", "100");
  return url.href;
}

function renderDetails(entry) {
  ui.title.textContent = entry.address || `${entry.lat.toFixed(5)}, ${entry.lng.toFixed(5)}`;
  ui.databaseLink.href = `https://roundabouts.kittelson.com/Roundabouts/Details/${entry.databaseId}`;
  ui.databaseLink.setAttribute("aria-disabled", "false");
  ui.databaseLink.hidden = !entry.databaseId;
}

function showStreetView(entry) {
  ui.loading.hidden = false;
  ui.streetView.src = buildStreetViewEmbedUrl(entry);
}

function updatePageUrl(entry, replace = false) {
  const url = new URL(window.location.href);
  url.searchParams.set("roundabout", entry.databaseId);
  if (replace) history.replaceState(null, "", url);
  else history.pushState(null, "", url);
}

function showEntry(entry, updateUrl = true, replaceUrl = false) {
  currentEntry = entry;
  renderDetails(entry);
  showStreetView(entry);
  if (updateUrl) updatePageUrl(entry, replaceUrl);
}

function loadChunk(chunk) {
  if (!chunkCache.has(chunk.file)) {
    chunkCache.set(chunk.file, fetch(chunk.file).then((response) => {
      if (!response.ok) throw new Error(`Could not load ${chunk.file.split("?")[0]}.`);
      return response.json();
    }));
  }
  return chunkCache.get(chunk.file);
}

function chunkForId(id) {
  return DATA_CHUNKS.find((chunk) => chunk.minId <= id && id <= chunk.maxId);
}

async function entryForKey(key) {
  const id = Number(key);
  if (!Number.isInteger(id)) return null;
  const chunk = chunkForId(id);
  if (!chunk) return null;
  const entries = await loadChunk(chunk);
  return entries.find((entry) => entry.databaseId === String(id)) || null;
}

async function randomEntryData(excludedId = "") {
  let entry;
  do {
    let ordinal = Math.floor(Math.random() * totalEntries);
    const chunk = DATA_CHUNKS.find((candidate) => {
      if (ordinal < candidate.count) return true;
      ordinal -= candidate.count;
      return false;
    });
    const entries = await loadChunk(chunk);
    entry = entries[ordinal];
  } while (totalEntries > 1 && entry.databaseId === excludedId);
  return entry;
}

async function randomEntry() {
  const entry = await randomEntryData(currentEntry?.databaseId);
  showEntry(entry);
}

export function nextInterestingId(currentId, interestingIds = INTERESTING_IDS) {
  const sortedIds = [...interestingIds].sort((left, right) => left - right);
  const current = Number(currentId);
  return sortedIds.find((id) => id > current) ?? sortedIds[0];
}

async function randomInterestingEntry() {
  const id = nextInterestingId(currentEntry?.databaseId);
  const entry = await entryForKey(id);
  if (entry) showEntry(entry);
}

async function copyShareLink() {
  try {
    const url = new URL(window.location.href);
    url.hash = "roundabout-picker";

    await navigator.clipboard.writeText(url.toString());
    ui.copyLinkLabel.textContent = "✓ Link copied";
  } catch {
    ui.copyLinkLabel.textContent = "Could not copy link";
  }
  window.setTimeout(() => { ui.copyLinkLabel.textContent = "Copy share link"; }, 2000);
}

async function restoreEntryFromUrl() {
  const key = new URL(window.location.href).searchParams.get("roundabout");
  const entry = await entryForKey(key);
  if (entry) showEntry(entry, false);
}

async function init() {
  try {
    const requestedKey = new URL(window.location.href).searchParams.get("roundabout");
    const initialEntryPromise = requestedKey ? entryForKey(requestedKey) : randomEntryData();
    const requestedEntry = await initialEntryPromise;
    const initialEntry = requestedEntry || await randomEntryData();
    ui.streetView.addEventListener("load", () => { ui.loading.hidden = true; });
    ui.randomize.disabled = false;
    ui.randomizeInteresting.disabled = false;
    ui.copyLink.disabled = false;
    ui.randomize.addEventListener("click", () => randomEntry());
    ui.randomizeInteresting.addEventListener("click", () => randomInterestingEntry());
    ui.copyLink.addEventListener("click", copyShareLink);
    window.addEventListener("popstate", restoreEntryFromUrl);
    showEntry(initialEntry, true, true);
  } catch (error) {
    ui.loading.innerHTML = `<strong>${error.message}</strong>`;
  }
}

if (typeof document !== "undefined") init();
