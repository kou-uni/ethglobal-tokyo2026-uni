# README animation

The repository's opening GIF links to the [HD viewer](../../readme-video.html).

| Asset | Use |
|---|---|
| `yohaku-overview.gif` | English README preview, 1100 × 619, 10 fps, 43.5 seconds, looping, about 2.5 MiB |
| `yohaku-overview-en.mp4` | English full-resolution video, 2560 × 1440, H.264, 30 fps, no audio |
| `yohaku-overview-ja.mp4` | Japanese full-resolution video, same format |
| `yohaku-overview-*.png` | Still-image posters, 1280 × 720 |

## What this is

Captured from the original SVG and playback clock in
[`docs/launch.html` at `a965962`](https://github.com/kou-uni/ethglobal-tokyo2026-uni/blob/a965962/docs/launch.html).
The capture shows the whole diagram, including the ENSv2 policy node and the optional payment
overlay. The original request paths and 40-second sequence are unchanged; the video adds a
short opening/closing hold and places the captions alongside the diagram.

The GIF was derived from the English MP4. Its smaller palette and frame rate keep the README
preview compact; the MP4 retains the full-resolution version. The original capture was
rendered from the source SVG into a canvas, encoded with MediaRecorder, then converted to
H.264. Both MP4s were fully decoded successfully and representative frames visually checked.

## What the animation does not establish

- The 50 requests are a fixed illustration: 28 delegated, 13 refused, 9 held, grouped into
  5 bundles with 2 surfaced. This is not measured customer demand or a count of payments.
- The payment overlay describes one example and executes no transaction. The person receives
  the reward directly; the optional YOHAKU fee is a separate authorization. Fee collection
  is not implemented.
- The fee ledger belongs to the regular `/requests` path; it is not connected to `/experience`.
- ENSv2 delegation has [separate on-chain evidence](../../build/evidence/ens-delegation.json).
  The phone `/experience` flow does not read or write ENS.
- NEO integration is proposed; neither NEO nor MultiBaas is connected.
- Actual mobile payment evidence is recorded separately in
  [experience-public-payment.json](../../build/evidence/experience-public-payment.json).

## Regenerate the GIF from the MP4

Run in this directory with FFmpeg installed:

```sh
ffmpeg -i yohaku-overview-en.mp4 \
  -vf "fps=10,scale=1100:-1:flags=lanczos,palettegen=max_colors=160:stats_mode=diff" \
  -frames:v 1 /tmp/yohaku-readme-palette.png
ffmpeg -i yohaku-overview-en.mp4 -i /tmp/yohaku-readme-palette.png \
  -lavfi "fps=10,scale=1100:-1:flags=lanczos[v];[v][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  -loop 0 yohaku-overview.gif
```

GitHub's documentation lists GIF image attachments and recommends H.264 for video
compatibility: [Attaching files](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files).
The README uses a repository image; the HD player is a regular HTML page served by GitHub Pages.
