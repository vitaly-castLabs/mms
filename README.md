# MMS

A small self-contained demo that exercises Apple's Managed Media Source (MMS) API
available in Safari 17 / iOS 17, supporting both clear and encrypted playback scenarios.

## Requirements

- Safari 17+ (regular or TP) or any browser on iOS 17.1+ (all iOS browsers are Safari with a thin wrap on top).
- Any static HTTP server can host the files in this folder for clear media playback; `python3 -m http.server` will do.

For encrypted media it's recommended to use HTTPS (`localhost` over HTTP usually works too). This simple HTTPS server is highly recommended, even if I say so myself: https://github.com/vitaly-castLabs/httpsrv

## Run locally

1. Serve the project directory:
   ```bash
   python3 -m http.server
   ```
2. Open `http://localhost:8000` in Safari or Safari TP and the demo starts automatically.
   The `main.js` startup routine wires a `ManagedMediaSource`, appends the
   samples under `media/`, and writes player events to the page for inspection.

## Encrypted media playback

The demo can request FPS licenses when both a certificate and license endpoint
are supplied through query parameters. Here's an example of how to use it with `DRMtoday` (you have to have an account with a FPS cert - which you request from Apple directly - attached to it):

```
https://vitaly-castlabs.github.io/mms/?crt=lic.staging.drmtoday.com/license-server-fairplay/cert/${your_drmtoday_merchant_id}&lic=lic.staging.drmtoday.com/license-server-fairplay
```

## Notes

- The HTML entry point is `index.html`; scripts are kept in `main.js`,
  `mediasource.js`, and `fps_safari_support.js`.
- Remote playback is disabled intentionally (`video.disableRemotePlayback =
  true`) - MMS won't work otherwise.
