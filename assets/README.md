# QR Studio — DENR QR Code Generator

A modern, fully client-side web application for generating permanent, scannable QR codes with DENR branding.

---

## ✨ Features

### QR Code Generator
- Generate permanent QR codes for any URL
- Embedded **DENR logo** at the center of every QR code (fully scannable)
- Customize **QR color** and **background color**
- Set a **title** displayed on the downloaded QR image
- Choose **QR size** (128px – 512px)
- Select **Error Correction Level** (L / M / H — H recommended for logo)
- **Download** as PNG (with optional title banner)
- **Copy URL** to clipboard
- **Save to history** (persisted in localStorage)

### History Manager
- All saved QR codes in one place with thumbnail previews
- Copy URL, download, or delete any saved item
- Persisted in browser localStorage

---

## 🔑 How logo-in-QR works (scannable)

QRCode.js renders a **clean, unmodified QR canvas** in a hidden element.  
A separate **composite canvas** is then built by drawing the QR first, then overlaying the DENR logo on top.  
The raw QR data is never touched, so scanners can always recover the URL using **High (H)** error correction, which tolerates up to 30% data obstruction — the logo covers only ~20%.

---

## 🚀 Getting Started

### Option 1 — Open Directly
Double-click `index.html`. No build step, no server needed.

### Option 2 — Serve Locally
```bash
python -m http.server 8080
# or
npx serve .
```

### Option 3 — Deploy to GitHub Pages
1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, root `/`
4. Live at `https://<username>.github.io/<repo>/`

The included `.github/workflows/deploy.yml` auto-deploys on every push to `main`.

---

## 📁 Project Structure

```
qr-shortener/
├── index.html
├── css/style.css
├── js/app.js
├── .github/workflows/deploy.yml
└── README.md
```

---

## ⚙️ Configuration

Change the center logo in `js/app.js`:
```js
const DENR_LOGO = "https://...your-logo-url...";
```

---

## 📜 License

MIT License — free to use, modify, and distribute.