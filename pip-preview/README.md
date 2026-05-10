# PiP Preview

> Pop the active video into a minimal Picture-in-Picture window.

A simple, no-frills PiP extension. Click the toolbar icon, get a floating preview window with three controls: close, play/pause, and return to tab.

## Features

- Click toolbar icon to pop out the active video
- Native resizable PiP window
- Works on sites that block PiP (`disablePictureInPicture` is stripped)
- Replaces any existing PiP window when triggered again
- Custom controls overlaid on the video: close (top-left), return to tab (top-right), play/pause (center)
- Automatic fallback to native PiP for DRM-protected platforms

## Supported sites

Works on any site with an HTML5 `<video>` element.

| Site | Mode | Notes |
|------|------|-------|
| YouTube, Twitch, Twitter/X, etc. | Custom | Full custom controls |
| Netflix, Prime, Disney+, HBO, Hulu, Apple TV+ | Native | Browser's built-in PiP controls (DRM-safe) |

## Why two modes?

Custom controls require moving the video element into a separate window. DRM-protected platforms (Widevine) refuse to render protected content when the video element is moved between documents — you get a black frame. For those sites the extension falls back to the legacy PiP API, which keeps the video in place and lets the browser project the protected frames into its native floating window. Trade-off: no custom overlay, just whatever controls Chrome provides.

## Installation

See the [root README](../README.md#install).
