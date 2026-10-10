const TRACKS = [
  { id: 1, title: "Sunset Lo-Fi",   artist: "VHS Dreams", duration: 180, genre: "Chill", color: "cream", bpm: 90,  wave: "triangle", root: 220.00, pattern: [0, 3, 7, 10, 7, 3] },
  { id: 2, title: "Neon Nights",    artist: "RetroWave",  duration: 200, genre: "Hype",  color: "pink",  bpm: 120, wave: "sawtooth", root: 164.81, pattern: [0, 7, 12, 7, 5, 12, 10, 7] },
  { id: 3, title: "Cassette Love",  artist: "Mixtape",    duration: 190, genre: "Retro", color: "teal",  bpm: 100, wave: "square",   root: 196.00, pattern: [0, 4, 7, 12, 7, 4] },
  { id: 4, title: "Weekend Tape",   artist: "FM Gold",    duration: 210, genre: "Chill", color: "cream", bpm: 84,  wave: "sine",     root: 174.61, pattern: [0, 5, 9, 12, 9, 5] },
  { id: 5, title: "Midnight Drive", artist: "Laser Club", duration: 220, genre: "Hype",  color: "pink",  bpm: 128, wave: "sawtooth", root: 146.83, pattern: [0, 3, 7, 10, 12, 10, 7, 3] },
  { id: 6, title: "Rewind Baby",    artist: "Tape Deck",  duration: 175, genre: "Retro", color: "teal",  bpm: 112, wave: "triangle", root: 261.63, pattern: [0, 2, 4, 7, 9, 7, 4, 2] }
];

const STATIONS = [
  { freq: 88.1,  name: "Groove Salad",    genre: "Chill", live: true, src: "https://ice1.somafm.com/groovesalad-128-mp3" },
  { freq: 94.7,  name: "Throwback Jams",  genre: "Retro", live: true, src: "https://ice1.somafm.com/u80s-128-mp3" },
  { freq: 101.3, name: "Radio Paradise",  genre: "Hype",  live: true, src: "https://stream.radioparadise.com/mp3-192" },
  { freq: 107.9, name: "Left Coast 70s",  genre: null,    live: true, src: "https://ice1.somafm.com/seventies-128-mp3" }
];

const COLORS = { cream: "#ffcf6b", pink: "#ff4fa3", teal: "#25c9c9" };
const CUSTOM_KEY = "mixtape-custom-tapes";

const state = { mode: "radio", index: 0, station: 1, playing: false, elapsed: 0, volume: 0.7, side: "A" };

const $ = (id) => document.getElementById(id);
const currentTrack = () => TRACKS[state.index];
const currentStation = () => STATIONS[state.station];
const audioEl = $("audioEl");

let audioCtx = null;
let masterGain = null;
let lastStep = -1;
let lastTs = 0;

function currentSource() {
  if (state.mode === "radio") {
    const st = currentStation();
    return { kind: "radio", title: st.name, artist: st.freq.toFixed(1) + " FM", src: st.src, live: true, color: COLORS.teal };
  }
  const tr = currentTrack();
  return { kind: "tape", title: tr.title, artist: tr.artist, src: tr.src || null, live: false, duration: tr.duration || 0, color: COLORS[tr.color] || "#ffb000" };
}

/* ---------- Web Audio synth (for built-in tapes) ---------- */
function ensureAudio() {
  if (audioCtx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audioCtx = new Ctx();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = state.volume;
  masterGain.connect(audioCtx.destination);
}

function note(freq, dur, type) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || "triangle";
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function scheduleNotes() {
  if (!audioCtx) return;
  const tr = currentTrack();
  const noteDur = 30 / tr.bpm;
  const step = Math.floor(state.elapsed / noteDur);
  if (step === lastStep) return;
  lastStep = step;
  let i = step % tr.pattern.length;
  if (state.side === "B") i = tr.pattern.length - 1 - i;
  note(tr.root * Math.pow(2, tr.pattern[i] / 12), noteDur * 0.9, tr.wave);
  if (step % 4 === 0) note(tr.root / 2, noteDur * 1.8, "sine");
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
  let pos = state.elapsed;
  let dur = src.duration;
  let live = src.live;
  if (src.src) {
    pos = audioEl.currentTime || 0;
    dur = isFinite(audioEl.duration) ? audioEl.duration : 0;
    live = live || audioEl.duration === Infinity;
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
  else if (state.mode === "tape" && state.elapsed > 0) text = "\u275A\u275A PAUSED \u2014 " + src.title;
  else text = "NOW TUNED TO: " + (state.mode === "radio" ? currentStation().name : src.title);
  $("lcdText").textContent = text + "  [" + (state.mode === "radio" ? "FM" : "SIDE " + state.side) + "]";
}

function updateNow() {
  const src = currentSource();
  $("nowTitle").textContent = src.title;
  $("nowArtist").textContent = src.artist + (state.mode === "radio" ? " \u00B7 LIVE" : " \u00B7 SIDE " + state.side);
  document.documentElement.style.setProperty("--accent", src.color || "#ffb000");
}

function renderGrid() {
  const grid = $("cassetteGrid");
  grid.innerHTML = "";
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
}

/* ---------- selection / transport ---------- */
function resetPlayhead() {
  state.elapsed = 0;
  lastStep = -1;
}

function selectTrack(i) {
  const n = TRACKS.length;
  state.mode = "tape";
  state.index = ((i % n) + n) % n;
  resetPlayhead();
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
  resetPlayhead();
  renderTuner();
  renderGrid();
  updateNow();
  if (state.playing) {
    const src = currentSource();
    loadAudio(src.src);
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
  ensureAudio();
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  state.playing = true;
  const src = currentSource();
  if (src.src) {
    loadAudio(src.src);
    audioEl.play().catch(() => setStatus("TAP PLAY TO START " + (src.live ? "STREAM" : "TAPE")));
  } else {
    audioEl.pause();
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
  resetPlayhead();
  audioEl.pause();
  updateTransport();
  updateClock();
}

function flip() {
  state.side = state.side === "A" ? "B" : "A";
  lastStep = -1;
  updateNow();
  updateLCD();
}

function seek(delta) {
  const src = currentSource();
  if (src.live) return;
  if (src.src) {
    if (isFinite(audioEl.duration)) {
      audioEl.currentTime = Math.min(audioEl.duration, Math.max(0, audioEl.currentTime + delta));
    }
  } else {
    state.elapsed = Math.min(src.duration, Math.max(0, state.elapsed + delta));
    lastStep = -1;
  }
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
  if (state.mode === "tape" && state.index >= TRACKS.length) state.index = 0;
  renderGrid();
  updateNow();
  updateLCD();
  updateClock();
}

/* ---------- main loop ---------- */
function loop(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min(0.25, (ts - lastTs) / 1000);
  lastTs = ts;
  if (state.playing) {
    const src = currentSource();
    if (src.kind === "tape" && !src.src) {
      state.elapsed += dt;
      if (state.elapsed >= src.duration) {
        resetPlayhead();
        selectTrack(state.index + 1);
      } else {
        scheduleNotes();
      }
    }
  }
  updateClock();
  requestAnimationFrame(loop);
}

/* ---------- events / init ---------- */
function init() {
  loadCustom();
  renderGrid();
  renderTuner();
  updateNow();
  updateClock();
  updateTransport();

  audioEl.addEventListener("ended", () => {
    if (state.playing && state.mode === "tape") {
      resetPlayhead();
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
    const freq = 88 + ratio * 20;
    let best = 0;
    let bestDist = Infinity;
    STATIONS.forEach((st, i) => {
      const d = Math.abs(st.freq - freq);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    changeStation(best - state.station);
  });

  const vol = $("volume");
  vol.value = String(state.volume);
  vol.addEventListener("input", () => {
    state.volume = Number(vol.value);
    if (masterGain) masterGain.gain.value = state.volume;
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
}

document.addEventListener("DOMContentLoaded", init);
