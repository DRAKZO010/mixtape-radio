# Mixtape Radio FM

A retro 90s boombox / cassette-deck web toy. Pure HTML, CSS and vanilla JS — no build step, no dependencies, no audio files.

## Features

- **Cassette deck** — play / pause / stop / rewind / fast-forward / flip (side A ↔ B).
- **Live audio** — every track is synthesized in the browser with the Web Audio API, so no audio assets are needed.
- **Real clock** — the progress bar and time readout track playback; tracks auto-advance when they finish.
- **Tuner** — 4 stations across 88–108 MHz. Use the ◀ / ▶ buttons or click the dial; the needle moves and the LCD updates.
- **Track library** — a grid of selectable tapes; tap one to load and play it.
- **Animated reels** — the cassette reels spin while a track is playing.
- **Volume control.**

## Running

Open `index.html` in any modern browser. That's it.

> Audio starts after your first interaction (a browser autoplay rule), so press **PLAY** once.

## Controls

| Control | Action |
| --- | --- |
| PLAY | start playback |
| PAUSE | pause at the current position |
| STOP | stop and reset to 00:00 |
| REW / FF | seek −10s / +10s |
| FLIP | flip the tape to side A/B |
| ◀ ▶ | previous / next station |
| Dial | click to tune to the nearest station |

## Files

- `index.html` — markup and UI structure
- `styles.css` — the 90s boombox/cassette theme
- `script.js` — player engine, Web Audio synth, tuner and track grid
- `UPGRADES.md` — changelog of enhancements and next ideas
