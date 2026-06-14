# NFL Parlay Model — Deploy as PWA

## What you need
Four files (all in this folder):
- `index.html` — app entry point + storage shim + Babel JSX loader
- `nfl-predictor.jsx` — the full model (3800+ lines)
- `manifest.json` — PWA metadata
- `sw.js` — service worker (offline support + caching)

You also need two icon files:
- `icon-192.png` — 192×192px app icon (dark background, 🏈 emoji or custom)
- `icon-512.png` — 512×512px same icon (for splash screen)

Create them quickly at **https://favicon.io/emoji-favicons/** — search for
"football" → download → rename to icon-192.png and icon-512.png.

---

## Deploy to Netlify (free, 2 minutes)

1. Go to **https://netlify.com** → sign up free
2. Drag the entire folder onto the Netlify drop zone
3. Done — you get a URL like `https://nfl-parlay-abc123.netlify.app`

**Add to iPhone home screen:**
1. Open that URL in Safari
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add" — it installs as a native app with full screen, no browser chrome

---

## Deploy to Vercel (free, 2 minutes)

```bash
npm i -g vercel
cd /path/to/your/folder
vercel
```

Follow the prompts — it deploys automatically.

---

## Deploy to GitHub Pages (free)

1. Create a GitHub repo
2. Upload all 6 files (4 + 2 icons)
3. Go to Settings → Pages → Source: main branch → `/` root
4. Your URL: `https://yourusername.github.io/reponame/`

---

## API Key Note

The model uses the Anthropic API. When you run it:
- In **Claude.ai** (artifact): API calls are handled by Anthropic automatically
- In **standalone PWA**: The model calls `https://api.anthropic.com/v1/messages`
  directly from the browser. This works because the artifact was built to call
  the API without an explicit key (handled by Claude.ai's proxy).

  **For standalone deployment**, you'll need to either:
  - Use a proxy server that injects your API key
  - Add `"x-api-key": "YOUR_KEY"` to the fetch headers in `callClaude()`

  The line to modify in `nfl-predictor.jsx` is:
  ```js
  headers: { "Content-Type": "application/json" }
  ```
  Change to:
  ```js
  headers: { "Content-Type": "application/json", "x-api-key": "sk-ant-..." }
  ```

---

## File structure

```
your-folder/
├── index.html          ← entry point
├── nfl-predictor.jsx   ← the model
├── manifest.json       ← PWA config
├── sw.js               ← service worker
├── icon-192.png        ← 192x192 icon (you create this)
└── icon-512.png        ← 512x512 icon (you create this)
```
