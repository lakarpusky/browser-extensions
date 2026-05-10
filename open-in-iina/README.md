# Open in IINA

Opens the current YouTube, Twitter/X, or Twitch video in [IINA](https://iina.io).

Click the extension icon or press `Alt+I`.

## Supported sites

- YouTube (`/watch`, `/shorts`)
- Twitter / X (`/status/*`)
- Twitch (channels, VODs, clips)

## Requirements

- macOS with [IINA](https://iina.io) installed
- Recommended: `yt-dlp` configured in IINA for best extraction

### Suggested IINA config

`Settings → Network → youtube-dl → Raw options`:

```
format="best[height<=?720][protocol^=http]/bestvideo[height<=?720]+bestaudio/best[height<=?720]"
```

## Install

See the [root README](../README.md#install).
