# Mixtape Radio FM

A retro 90s boombox / cassette-deck web toy. Pure HTML, CSS and vanilla JS — no build step, no dependencies, no bundled audio files.

## Features

- **Cassette deck** — play / pause / stop / rewind / fast-forward / flip (side A ↔ B).
- **Real radio** — the tuner connects to the live [Radio-Browser](https://www.radio-browser.info/) directory and loads actual internet stations on startup. Use **SCAN** to search by genre, name or country, then ◀ / ▶ (or click the dial) to tune. Press PLAY to stream.
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
| SCAN | search the station directory by genre / name / country |
| ◀ ▶ | previous / next station |
| Dial | click to tune to the nearest station |

## Notes

- Press **PLAY** once before audio can start (browser autoplay rule).
- The station list comes from the public Radio-Browser API over the network. If it is unreachable, the app falls back to four built-in stations.
- Some directory stations stream over plain `http`; those play when the app is opened locally, but a browser may block them if the page itself is served over `https`.
- Custom tapes live in your browser's `localStorage` only — they are not uploaded anywhere.

## Files

- `index.html` — markup and UI structure
- `styles.css` — the 90s boombox/cassette theme
- `script.js` — player engine, real-audio streaming, tuner and tape grid
- `UPGRADES.md` — changelog of enhancements and next ideas
