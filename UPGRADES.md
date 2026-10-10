# Upgrades

## Done

- Wired up every dead control (pause, rewind, fast-forward, flip).
- Live time readout + progress bar, with auto-advance to the next track.
- Track grid rendered from data; tap a tape to load and play it.
- Tuner: station prev/next, clickable dial, moving needle, LCD updates.
- FLIP switches tape side A/B.
- Animated spinning reels while playing.
- Volume slider.
- Full 90s boombox/cassette visual theme.
- Real internet radio: the four tuner stations now stream live (SomaFM + Radio Paradise).
- Connected the tuner to the live Radio-Browser directory — it loads real stations on startup and **SCAN** searches by genre / name / country, with a built-in offline fallback.
- Add-your-own-tape form — paste any audio/stream URL to create a playable cassette, persisted in `localStorage`.
- `<audio>` playback engine with `LIVE` display, stream-error handling and auto-advance.
- Replaced the placeholder synth tracks (and the Web Audio engine that played them) — the deck ships empty and plays real radio or your own tapes.

## Next ideas

- Real audio files / streaming source per track (with `<audio>` fallback).
- Draggable tuner needle with static/noise between stations.
- Playlist shuffle + repeat modes.
- Keyboard shortcuts (space, arrows).
- Persist last-played state to `localStorage`.
- Spectrum / visualizer bars in the LCD.
- Mobile haptics and PWA offline support.
