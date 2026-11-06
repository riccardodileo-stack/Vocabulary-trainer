# Avatar sources

The 12 profile avatars are drawn in code: `gen.py` writes one SVG per avatar
(skin, hair style and color, clothes, glasses, beard...), `render.js` turns them
into the 384×384 PNGs used by the app (`assets/avatars/`).

To change or add an avatar:
1. Edit the `AVATARS` list in `gen.py` and run `python3 gen.py` in this folder.
2. Render the PNGs (Playwright needed, from the `app/` folder):
   `node design/avatars/render.js design/avatars assets/avatars`
3. For a new avatar, add a row to `src/content/avatars.ts`.

This folder is not part of the app bundle.
