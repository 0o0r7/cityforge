# Repository artwork

| File | Used for |
| --- | --- |
| `banner.svg` | The hero image at the top of the root `README.md`. Scales to any width, no raster assets. |
| `social-preview.svg` | Source of the 1280×640 social card GitHub shows when the repository link is shared. |

GitHub's social preview accepts raster images only (PNG, JPG, GIF), so the card is rendered from the SVG:

```sh
rsvg-convert -w 1280 -h 640 social-preview.svg -o social-preview.png
```

Then upload `social-preview.png` in **Settings → Social preview**. The file is not committed: the SVG is the
source of truth and the PNG is a build artifact.

Palette follows the app's design tokens (`app/public/css/tokens.css`): `#0b0908` ground, `#ff9f45` ember,
`#f4c65a` gold, `#7dd3a0` mint, `#f6f1e8` ink.
