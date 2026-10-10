const MIRRORS = [
  "https://de1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://at1.api.radio-browser.info"
];

const FALLBACK_STATIONS = [
  { name: "Groove Salad", src: "https://ice1.somafm.com/groovesalad-128-mp3", country: "US", genre: "Chill" },
  { name: "Throwback Jams", src: "https://ice1.somafm.com/u80s-128-mp3", country: "US", genre: "Retro" },
  { name: "Radio Paradise", src: "https://stream.radioparadise.com/mp3-192", country: "US", genre: "Hype" },
  { name: "Left Coast 70s", src: "https://ice1.somafm.com/seventies-128-mp3", country: "US", genre: "Retro" }
];

let TRACKS = [];
let STATIONS = [];

const COLORS = { cream: "#ffcf6b", pink: "#ff4fa3", teal: "#25c9c9" };
const CUSTOM_KEY = "mixtape-custom-tapes";

const state = { mode: "radio", index: 0, station: 0, playing: false, volume: 0.7, side: "A" };

const $ = (id) => document.getElementById(id);
const currentTrack = () => TRACKS[state.index];
const currentStation = () => STATIONS[state.station] || STATIONS[0];
const audioEl = $("audioEl");

/* ---------- station directory (Radio-Browser) ---------- */
function assignFrequencies(list) {
  const n = list.length;
  const lo = 88;
  const hi = 108;
  const step = n > 1 ? (hi - lo) / (n - 1) : 0;
  return list.map((s, i) => Object.assign({}, s, { freq: +(lo + i * step).toFixed(1), live: true }));
}

function normalizeStations(data) {
  if (!Array.isArray(data)) return [];
  return data
    .filter((s) => s && s.url_resolved && s.hls !== 1 && s.lastcheckok === 1)
    .map((s) => ({
      name: String(s.name || "").trim(),
      src: s.url_resolved,
      country: s.country || "",
      codec: (s.codec || "").toUpperCase(),
      bitrate: s.bitrate || 0,
      genre: ((s.tags || "").split(",")[0] || "Radio").replace(/^\w/, (c) => c.toUpperCase())
    }))
    .filter((s) => s.name);
}

async function tryFetch(path) {
  for (const mirror of MIRRORS) {
    try {
      const res = await fetch(mirror + path);
      if (!res.ok) continue;
      const list = normalizeStations(await res.json());
      if (list.length) return list;
    } catch {}
  }
  return [];
}

async function fetchStations(term) {
  const q = "limit=30&hidebroken=true&order=clickcount&reverse=true";
  const attempts = term
    ? [
        "/json/stations/search?name=" + encodeURIComponent(term) + "&" + q,
        "/json/stations/search?tag=" + encodeURIComponent(term) + "&" + q,
        "/json/stations/search?country=" + encodeURIComponent(term) + "&" + q
      ]
    : ["/json/stations/topclick/30?" + q];
  for (const path of attempts) {
    const list = await tryFetch(path);
    if (list.length) return assignFrequencies(list);
  }
  throw new Error("no stations");
}

function applyStations(list) {
  STATIONS = list;
  state.station = 0;
  state.mode = "radio";
  renderTuner();
  updateNow();
  renderGrid();
  if (state.playing) {
    loadAudio(currentSource().src);
    audioEl.play().catch(() => setStatus("STREAM BLOCKED \u2014 TRY ANOTHER"));
  } else {
    updateLCD();
  }
  updateClock();
}

/* ---------- source model ---------- */
function currentSource() {
  if (state.mode === "radio" || !TRACKS.length) {
    const st = currentStation();
    return { kind: "radio", title: st.name, artist: st.freq.toFixed(1) + " FM", src: st.src, live: true, color: COLORS.teal };
  }
  const tr = currentTrack();
  return { kind: "tape", title: tr.title, artist: tr.artist, src: tr.src || null, live: false, duration: tr.duration || 0, color: COLORS[tr.color] || "#ffb000" };
}

/* ---------- real audio (streams + external files) ---------- */
function loadAudio(src) {
  if (audioEl.dataset.src === src) return;
  audioEl.dataset.src = src;
  audioEl.src = src;
  audioEl.load();
}

function setStatus(msg) {
  $("lcdText").textContent = msg;
}

/* ---------- formatting / rendering ---------- */
function fmtTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  return { m: String(Math.floor(s / 60)).padStart(2, "0"), s: String(s % 60).padStart(2, "0") };
}

function updateClock() {
  const src = currentSource();
  let live = src.live;
  let pos = 0;
  let dur = src.duration;
  if (src.src) {
    pos = audioEl.currentTime || 0;
    dur = isFinite(audioEl.duration) ? audioEl.duration : 0;
    if (audioEl.duration === Infinity) live = true;
  }
  if (live) {
    $("timeMin").textContent = "LI";
    $("timeSec").textContent = "VE";
    $("progressBar").style.width = "100%";
    return;
  }
  const f = fmtTime(pos);
  $("timeMin").textContent = f.m;
  $("timeSec").textContent = f.s;
  $("progressBar").style.width = (dur > 0 ? Math.min(100, (pos / dur) * 100) : 0) + "%";
}

function updateLCD() {
  const src = currentSource();
  let text;
  if (state.playing) text = "\u25B6 " + src.title + " \u2014 " + src.artist;
  else if (src.kind === "tape" && audioEl.currentTime > 0) text = "\u275A\u275A PAUSED \u2014 " + src.title;
  else text = "NOW TUNED TO: " + (src.kind === "radio" ? currentStation().name : src.title);
  $("lcdText").textContent = text + "  [" + (src.kind === "radio" ? "FM" : "SIDE " + state.side) + "]";
}

function updateNow() {
  const src = currentSource();
  $("nowTitle").textContent = src.title;
  $("nowArtist").textContent = src.artist + (src.kind === "radio" ? " \u00B7 LIVE" : " \u00B7 SIDE " + state.side);
  document.documentElement.style.setProperty("--accent", src.color || "#ffb000");
}

function renderGrid() {
  const grid = $("cassetteGrid");
  grid.innerHTML = "";
  if (!TRACKS.length) {
    const empty = document.createElement("p");
    empty.className = "empty-grid";
    empty.textContent = "No tapes yet \u2014 add one below, or press PLAY to listen to the radio.";
    grid.appendChild(empty);
    return;
  }
  TRACKS.forEach((tr, i) => {
    const card = document.createElement("div");
    card.className = "track-card" + (state.mode === "tape" && i === state.index ? " active" : "");
    card.style.setProperty("--card", COLORS[tr.color] || "#ffb000");
    const t = fmtTime(tr.duration);
    const meta = tr.custom ? "Custom" : tr.genre + " \u00B7 " + t.m + ":" + t.s;
    card.innerHTML =
      '<div class="mini-cassette"><span class="mini-reel"></span><span class="mini-reel"></span></div>' +
      '<div class="tc-title">' + tr.title + "</div>" +
      '<div class="tc-artist">' + tr.artist + "</div>" +
      '<div class="tc-meta">' + meta + "</div>" +
      (tr.custom ? '<button class="card-remove" type="button" aria-label="Remove tape">\u00D7</button>' : "");
    card.addEventListener("click", () => { selectTrack(i); play(); });
    const rm = card.querySelector(".card-remove");
    if (rm) rm.addEventListener("click", (e) => { e.stopPropagation(); removeTape(i); });
    grid.appendChild(card);
  });
}

function renderTuner() {
  const st = currentStation();
  $("freqDisplay").textContent = st.freq.toFixed(1) + " MHz";
  $("stationName").textContent = st.name;
  $("dialNeedle").style.left = (((st.freq - 88) / (108 - 88)) * 100) + "%";
  $("stationCount").textContent = STATIONS.length + (STATIONS.length === 1 ? " station" : " stations");
  const bits = [st.country, st.codec, st.bitrate ? st.bitrate + "k" : ""].filter(Boolean);
  $("stationInfo").textContent = bits.join(" \u00B7 ");
}

/* ---------- selection / transport ---------- */
function selectTrack(i) {
  if (!TRACKS.length) return;
  const n = TRACKS.length;
  state.mode = "tape";
  state.index = ((i % n) + n) % n;
  audioEl.pause();
  updateNow();
  renderGrid();
  updateClock();
  updateLCD();
}

function changeStation(delta) {
  const n = STATIONS.length;
  state.station = ((state.station + delta) % n + n) % n;
  state.mode = "radio";
  renderTuner();
  renderGrid();
  updateNow();
  if (state.playing) {
    loadAudio(currentSource().src);
    audioEl.play().catch(() => setStatus("STREAM BLOCKED \u2014 CHECK CONNECTION"));
  } else {
    updateLCD();
  }
  updateClock();
}

function updateTransport() {
  $("cassette").classList.toggle("playing", state.playing);
  $("btnPlay").classList.toggle("on", state.playing);
  $("playAllBtn").classList.toggle("on", state.playing);
  $("playAllBtn").textContent = state.playing ? "PAUSE" : "PLAY";
  updateLCD();
}

function play() {
  state.playing = true;
  const src = currentSource();
  if (src.src) {
    loadAudio(src.src);
    audioEl.play().catch(() => setStatus("TAP PLAY TO START " + (src.live ? "STREAM" : "TAPE")));
  }
  updateTransport();
}

function pause() {
  state.playing = false;
  audioEl.pause();
  updateTransport();
}

function stop() {
  state.playing = false;
  audioEl.pause();
  try { audioEl.currentTime = 0; } catch {}
  updateTransport();
  updateClock();
}

function flip() {
  state.side = state.side === "A" ? "B" : "A";
  updateNow();
  updateLCD();
}

function seek(delta) {
  const src = currentSource();
  if (src.live || !src.src || !isFinite(audioEl.duration)) return;
  audioEl.currentTime = Math.min(audioEl.duration, Math.max(0, audioEl.currentTime + delta));
  updateClock();
}

/* ---------- custom tapes ---------- */
function loadCustom() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (raw) JSON.parse(raw).forEach((t) => TRACKS.push(t));
  } catch {}
}

function saveCustom() {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(TRACKS.filter((t) => t.custom)));
  } catch {}
}

function addTape(title, artist, src) {
  const tape = { id: Date.now(), title, artist: artist || "Unknown", duration: 0, genre: "Custom", color: "pink", custom: true, src };
  TRACKS.push(tape);
  saveCustom();
  selectTrack(TRACKS.length - 1);
  play();
}

function removeTape(i) {
  const tr = TRACKS[i];
  if (!tr || !tr.custom) return;
  TRACKS.splice(i, 1);
  saveCustom();
  if (state.mode === "tape" && state.index >= TRACKS.length) {
    if (TRACKS.length) state.index = TRACKS.length - 1;
    else { state.mode = "radio"; state.index = 0; }
  }
  audioEl.pause();
  state.playing = false;
  renderGrid();
  updateTransport();
  updateNow();
  updateClock();
}

/* ---------- main loop ---------- */
function loop() {
  updateClock();
  requestAnimationFrame(loop);
}

/* ---------- events / init ---------- */
function init() {
  STATIONS = assignFrequencies(FALLBACK_STATIONS.slice());

  loadCustom();
  renderGrid();
  renderTuner();
  updateNow();
  updateClock();
  updateTransport();

  audioEl.volume = state.volume;

  audioEl.addEventListener("ended", () => {
    if (state.playing && state.mode === "tape" && TRACKS.length) {
      selectTrack(state.index + 1);
      play();
    }
  });
  audioEl.addEventListener("error", () => {
    if (!audioEl.dataset.src) return;
    setStatus(state.playing ? "STREAM OFFLINE \u2014 TRY ANOTHER" : "READY \u2014 PRESS PLAY");
  });

  $("playAllBtn").addEventListener("click", () => (state.playing ? pause() : play()));
  $("btnPlay").addEventListener("click", play);
  $("btnPause").addEventListener("click", pause);
  $("btnStop").addEventListener("click", stop);
  $("btnRewind").addEventListener("click", () => seek(-10));
  $("btnFF").addEventListener("click", () => seek(10));
  $("btnFlip").addEventListener("click", flip);
  $("rewindTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  $("tunePrev").addEventListener("click", () => changeStation(-1));
  $("tuneNext").addEventListener("click", () => changeStation(1));
  $("dial").addEventListener("click", (e) => {
    const rect = $("dial").getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const target = 88 + ratio * 20;
    let best = 0;
    let bestDist = Infinity;
    STATIONS.forEach((st, i) => {
      const d = Math.abs(st.freq - target);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    changeStation(best - state.station);
  });

  $("stationForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const term = $("stationQuery").value.trim();
    const btn = $("stationScan");
    btn.disabled = true;
    $("stationCount").textContent = "Scanning\u2026";
    try {
      applyStations(await fetchStations(term || null));
    } catch {
      $("stationCount").textContent = "No stations found \u2014 try another search";
    } finally {
      btn.disabled = false;
    }
  });

  const vol = $("volume");
  vol.value = String(state.volume);
  vol.addEventListener("input", () => {
    state.volume = Number(vol.value);
    audioEl.volume = state.volume;
  });

  $("addCassette").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = $("acTitle").value.trim();
    const artist = $("acArtist").value.trim();
    const url = $("acUrl").value.trim();
    if (!title || !url) return;
    addTape(title, artist, url);
    e.target.reset();
  });

  requestAnimationFrame(loop);

  $("stationCount").textContent = "Connecting to station directory\u2026";
  fetchStations(null)
    .then(applyStations)
    .catch(() => { $("stationCount").textContent = "Directory unreachable \u2014 using built-in stations"; });
}

document.addEventListener("DOMContentLoaded", init);
