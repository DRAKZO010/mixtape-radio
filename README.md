# Mixtape Radio FM

A retro 90s boombox / cassette-deck web toy. Pure HTML, CSS and vanilla JS — no build step, no dependencies, no audio files.

## Features

- **Cassette deck** — play / pause / stop / rewind / fast-forward / flip (side A ↔ B).
- **Built-in tapes** — the six stock tracks are synthesized live in the browser with the Web Audio API, so no audio assets are needed.
- **Real radio** — the tuner holds four live internet stations (SomaFM Groove Salad / Underground 80s / Left Coast 70s, and Radio Paradise). Tune with ◀ / ▶ or click the dial, then press PLAY to stream.
- **Add your own cassettes** — paste a direct link to any audio file or stream (`.mp3`, `.ogg`, an internet-radio URL, …) and it becomes a playable tape in the grid. Custom tapes are saved in `localStorage`.
- **Real clock** — the progress bar and time readout track playback; finished tapes auto-advance. Live streams show `LIVE`.
- **Animated reels** — the cassette reels spin while audio is playing.
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

## Notes

- Press **PLAY** once before audio can start (browser autoplay rule).
- Real radio and external tapes need a network connection. If a stream fails, the LCD shows `STREAM OFFLINE`.
- Custom tapes live in your browser's `localStorage` only — they are not uploaded anywhere.

## Files

- `index.html` — markup and UI structure
- `styles.css` — the 90s boombox/cassette theme
- `script.js` — player engine, Web Audio synth, real-audio streaming, tuner and tape grid
- `UPGRADES.md` — changelog of enhancements and next ideas
