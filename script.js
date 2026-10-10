const TRACKS = [
  { id: 1, title: "Sunset Lo-Fi",   artist: "VHS Dreams", duration: 180, genre: "Chill", color: "cream", bpm: 90,  wave: "triangle", root: 220.00, pattern: [0, 3, 7, 10, 7, 3] },
  { id: 2, title: "Neon Nights",    artist: "RetroWave",  duration: 200, genre: "Hype",  color: "pink",  bpm: 120, wave: "sawtooth", root: 164.81, pattern: [0, 7, 12, 7, 5, 12, 10, 7] },
  { id: 3, title: "Cassette Love",  artist: "Mixtape",    duration: 190, genre: "Retro", color: "teal",  bpm: 100, wave: "square",   root: 196.00, pattern: [0, 4, 7, 12, 7, 4] },
  { id: 4, title: "Weekend Tape",   artist: "FM Gold",    duration: 210, genre: "Chill", color: "cream", bpm: 84,  wave: "sine",     root: 174.61, pattern: [0, 5, 9, 12, 9, 5] },
  { id: 5, title: "Midnight Drive", artist: "Laser Club", duration: 220, genre: "Hype",  color: "pink",  bpm: 128, wave: "sawtooth", root: 146.83, pattern: [0, 3, 7, 10, 12, 10, 7, 3] },
  { id: 6, title: "Rewind Baby",    artist: "Tape Deck",  duration: 175, genre: "Retro", color: "teal",  bpm: 112, wave: "triangle", root: 261.63, pattern: [0, 2, 4, 7, 9, 7, 4, 2] }
];

const STATIONS = [
  { freq: 88.1,  name: "Late Night Lo-Fi", genre: "Chill" },
  { freq: 94.7,  name: "Throwback Jams",   genre: "Retro" },
  { freq: 101.3, name: "Neon FM",          genre: "Hype" },
  { freq: 107.9, name: "The Mixtape",      genre: null }
];

const COLORS = { cream: "#ffcf6b", pink: "#ff4fa3", teal: "#25c9c9" };

const state = { index: 0, station: 1, playing: false, elapsed: 0, volume: 0.7, side: "A" };

const $ = (id) => document.getElementById(id);
const current = () => TRACKS[state.index];
const currentStation = () => STATIONS[state.station];

let audioCtx = null;
let masterGain = null;
let lastStep = -1;
let lastTs = 0;

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
  osc.type = type || current().wave;
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
  const tr = current();
  const noteDur = 30 / tr.bpm;
  const step = Math.floor(state.elapsed / noteDur);
  if (step === lastStep) return;
  lastStep = step;
  let i = step % tr.pattern.length;
  if (state.side === "B") i = tr.pattern.length - 1 - i;
  const semi = tr.pattern[i];
  note(tr.root * Math.pow(2, semi / 12), noteDur * 0.9, tr.wave);
  if (step % 4 === 0) note(tr.root / 2, noteDur * 1.8, "sine");
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return {
    m: String(Math.floor(s / 60)).padStart(2, "0"),
    s: String(s % 60).padStart(2, "0")
  };
}

function updateClock() {
  const f = fmtTime(state.elapsed);
  $("timeMin").textContent = f.m;
  $("timeSec").textContent = f.s;
  const pct = Math.min(100, (state.elapsed / current().duration) * 100);
  $("progressBar").style.width = pct + "%";
}

function updateLCD() {
  const tr = current();
  let text;
  if (state.playing) text = "\u25B6 " + tr.title + " \u2014 " + tr.artist;
  else if (state.elapsed > 0) text = "\u275A\u275A PAUSED \u2014 " + tr.title;
  else text = "NOW TUNED TO: " + currentStation().name;
  $("lcdText").textContent = text + "  [SIDE " + state.side + "]";
}

function updateNow() {
  const tr = current();
  $("nowTitle").textContent = tr.title;
  $("nowArtist").textContent = tr.artist + " \u00B7 SIDE " + state.side;
  document.documentElement.style.setProperty("--accent", COLORS[tr.color] || "#ffb000");
}

function renderGrid() {
  const grid = $("cassetteGrid");
  grid.innerHTML = "";
  TRACKS.forEach((tr, i) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "track-card" + (i === state.index ? " active" : "");
    card.style.setProperty("--card", COLORS[tr.color] || "#ffb000");
    const t = fmtTime(tr.duration);
    card.innerHTML =
      '<div class="mini-cassette"><span class="mini-reel"></span><span class="mini-reel"></span></div>' +
      '<div class="tc-title">' + tr.title + "</div>" +
      '<div class="tc-artist">' + tr.artist + "</div>" +
      '<div class="tc-meta">' + tr.genre + " \u00B7 " + t.m + ":" + t.s + "</div>";
    card.addEventListener("click", () => { selectTrack(i); play(); });
    grid.appendChild(card);
  });
}

function renderTuner() {
  const st = currentStation();
  $("freqDisplay").textContent = st.freq.toFixed(1) + " MHz";
  $("stationName").textContent = st.name;
  $("dialNeedle").style.left = (((st.freq - 88) / (108 - 88)) * 100) + "%";
}

function selectTrack(i) {
  const n = TRACKS.length;
  state.index = ((i % n) + n) % n;
  state.elapsed = 0;
  lastStep = -1;
  updateNow();
  renderGrid();
  updateClock();
  updateLCD();
}

function stepTrack(delta) {
  selectTrack(state.index + delta);
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
  updateTransport();
}

function pause() {
  state.playing = false;
  updateTransport();
}

function stop() {
  state.playing = false;
  state.elapsed = 0;
  lastStep = -1;
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
  state.elapsed = Math.min(current().duration, Math.max(0, state.elapsed + delta));
  lastStep = -1;
  updateClock();
}

function tune(delta) {
  const n = STATIONS.length;
  state.station = ((state.station + delta) % n + n) % n;
  renderTuner();
  if (!state.playing) updateLCD();
}

function tuneFromClick(event) {
  const rect = $("dial").getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const freq = 88 + ratio * 20;
  let best = 0;
  let bestDist = Infinity;
  STATIONS.forEach((st, i) => {
    const d = Math.abs(st.freq - freq);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  state.station = best;
  renderTuner();
  if (!state.playing) updateLCD();
}

function loop(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min(0.25, (ts - lastTs) / 1000);
  lastTs = ts;
  if (state.playing) {
    state.elapsed += dt;
    if (state.elapsed >= current().duration) {
      state.elapsed = 0;
      lastStep = -1;
      stepTrack(1);
    } else {
      scheduleNotes();
    }
  }
  updateClock();
  requestAnimationFrame(loop);
}

function init() {
  renderGrid();
  renderTuner();
  updateNow();
  updateClock();
  updateTransport();

  $("playAllBtn").addEventListener("click", () => (state.playing ? pause() : play()));
  $("btnPlay").addEventListener("click", play);
  $("btnPause").addEventListener("click", pause);
  $("btnStop").addEventListener("click", stop);
  $("btnRewind").addEventListener("click", () => seek(-10));
  $("btnFF").addEventListener("click", () => seek(10));
  $("btnFlip").addEventListener("click", flip);
  $("rewindTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  $("tunePrev").addEventListener("click", () => tune(-1));
  $("tuneNext").addEventListener("click", () => tune(1));
  $("dial").addEventListener("click", tuneFromClick);

  const vol = $("volume");
  vol.value = String(state.volume);
  vol.addEventListener("input", () => {
    state.volume = Number(vol.value);
    if (masterGain) masterGain.gain.value = state.volume;
  });

  requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", init);
