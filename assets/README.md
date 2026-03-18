# QR Studio — DENR Link Manager

A modern, fully client-side web application for generating permanent QR codes and shortening URLs, built for the Department of Environment and Natural Resources (DENR).

![QR Studio Preview](assets/preview.png)

---

## ✨ Features

### QR Code Generator
- Generate permanent QR codes for any URL
- Embedded **DENR logo** at the center of every QR code
- Customize **QR color** and **background color**
- Set a **title** displayed above the QR
- Choose **QR size** (128px – 512px)
- Select **Error Correction Level** (L / M / H)
- **Download** as PNG (with title)
- **Copy URL** to clipboard
- **Save to history** (persisted in localStorage)

### URL Shortener
- Shorten long URLs to readable `denr.link/` short links
- Set a **custom alias** or auto-generate one
- Add a **label/description** for reference
- **Copy** short link to clipboard
- **Send to QR generator** in one click
- **Save to history**

### History Manager
- All saved QR codes and short links in one place
- QR code thumbnail previews
- Copy, download, re-use, or delete any saved item
- Persisted in browser localStorage

---

## 🚀 Getting Started

### Option 1 — Open Directly
Just double-click `index.html` or open it in any modern browser. No build step, no server needed.

### Option 2 — Serve Locally
```bash
# Using Python
python -m http.server 8080

# Using Node.js (npx)
npx serve .

# Using VS Code Live Server extension
# Right-click index.html → Open with Live Server
```
Then visit `http://localhost:8080`.

### Option 3 — Deploy to GitHub Pages
1. Fork or push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, root `/`
4. Your app will be live at `https://<username>.github.io/<repo>/`

---

## 📁 Project Structure

```
qr-shortener/
├── index.html          # Main app entry point
├── css/
│   └── style.css       # All styles (CSS custom properties, responsive)
├── js/
│   └── app.js          # All application logic
├── assets/             # (optional) screenshots, icons
└── README.md
```

---

## 🔧 Technical Details

| Technology | Details |
|---|---|
| **QRCode.js** | `qrcodejs` v1.0.0 via CDN (Cloudflare) |
| **Fonts** | Syne (display) + DM Sans (body) via Google Fonts |
| **Storage** | `localStorage` (client-side, no server required) |
| **DENR Logo** | Auto-overlaid via Canvas API from Wikimedia Commons |
| **Browser Support** | All modern browsers (Chrome, Firefox, Safari, Edge) |

---

## ⚙️ Configuration

To change the short link base URL, edit in `js/app.js`:
```js
const SHORT_BASE = "denr.link/";
```

To change the center logo, edit:
```js
const DENR_LOGO = "https://...your-logo-url...";
```

> **Note:** The URL shortener in this demo generates the short link locally. To make short links actually redirect, connect a backend service (e.g. [yourls.org](https://yourls.org), [kutt.it](https://kutt.it), or a custom API) and replace the `shortenURL()` function's `setTimeout` with a real API call.

---

## 📜 License

MIT License — free to use, modify, and distribute.

---

## 🌿 Built for DENR

This tool supports the Department of Environment and Natural Resources in creating easily shareable, branded links and QR codes for public documents, portals, and resources.
