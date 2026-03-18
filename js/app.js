/* ──────────────────────────────────────────────────────────
   QR Studio — DENR Link Manager
   app.js
   ────────────────────────────────────────────────────────── */

const DENR_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Logo_of_the_Department_of_Environment_and_Natural_Resources.svg/960px-Logo_of_the_Department_of_Environment_and_Natural_Resources.svg.png";
const SHORT_BASE = "denr.link/";
const STORAGE_KEY = "qr_studio_history";

/* ── State ── */
let currentQRData = null;
let currentShortData = null;
let qrInstance = null;

/* ── DOM Refs ── */
const $ = id => document.getElementById(id);

// Tabs
const navTabs    = document.querySelectorAll(".nav-tab");
const tabPanels  = document.querySelectorAll(".tab-panel");

// QR form
const qrUrlInput   = $("qr-url");
const qrTitleInput = $("qr-title");
const qrColorInput = $("qr-color");
const qrBgInput    = $("qr-bg");
const qrSizeInput  = $("qr-size");
const eclBtns      = document.querySelectorAll("#qr-ecl .toggle-btn");
const btnGenQR     = $("btn-generate-qr");

// QR result
const qrPlaceholder = $("qr-placeholder");
const qrResult      = $("qr-result");
const qrTitleDisp   = $("qr-title-display");
const qrCanvasInner = $("qr-canvas-inner");
const qrUrlDisp     = $("qr-url-display");
const btnDownloadQR = $("btn-download-qr");
const btnCopyQRUrl  = $("btn-copy-qr-url");
const btnSaveQR     = $("btn-save-qr");

// Shortener
const shortUrlInput   = $("short-url");
const shortAliasInput = $("short-alias");
const shortLabelInput = $("short-label");
const btnShorten      = $("btn-shorten");

// Short result
const shortPlaceholder = $("short-placeholder");
const shortResult      = $("short-result");
const shortLinkDisp    = $("short-link-display");
const shortOrigDisp    = $("short-original");
const shortMeta        = $("short-meta");
const btnCopyShort     = $("btn-copy-short");
const btnShortToQR     = $("btn-short-to-qr");
const btnSaveShort     = $("btn-save-short");

// History
const historyGrid  = $("history-grid");
const historyEmpty = $("history-empty");
const btnClearHist = $("btn-clear-history");

// Toast
const toast = $("toast");

/* ──────────────────────────────────────
   TAB NAVIGATION
────────────────────────────────────── */
navTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    navTabs.forEach(t => t.classList.remove("active"));
    tabPanels.forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${target}`).classList.add("active");
  });
});

/* ──────────────────────────────────────
   COLOR PICKERS
────────────────────────────────────── */
qrColorInput.addEventListener("input", () => {
  $("qr-color-label").textContent = qrColorInput.value;
});
qrBgInput.addEventListener("input", () => {
  $("qr-bg-label").textContent = qrBgInput.value;
});

/* ──────────────────────────────────────
   SIZE SLIDER
────────────────────────────────────── */
qrSizeInput.addEventListener("input", () => {
  const min = +qrSizeInput.min, max = +qrSizeInput.max, val = +qrSizeInput.value;
  const pct = ((val - min) / (max - min)) * 100;
  qrSizeInput.style.setProperty("--slider-pct", pct + "%");
  $("qr-size-label").textContent = val + "px";
});
// init
(function() {
  const min = +qrSizeInput.min, max = +qrSizeInput.max, val = +qrSizeInput.value;
  qrSizeInput.style.setProperty("--slider-pct", ((val - min) / (max - min)) * 100 + "%");
})();

/* ──────────────────────────────────────
   ECL TOGGLE
────────────────────────────────────── */
eclBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    eclBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});
function getECL() {
  return document.querySelector("#qr-ecl .toggle-btn.active")?.dataset.val || "H";
}

/* ──────────────────────────────────────
   QR GENERATION
────────────────────────────────────── */
btnGenQR.addEventListener("click", generateQR);
qrUrlInput.addEventListener("keydown", e => { if (e.key === "Enter") generateQR(); });

function generateQR() {
  const url = qrUrlInput.value.trim();
  if (!url) { showToast("Please enter a URL", "error"); qrUrlInput.focus(); return; }
  if (!isValidURL(url)) { showToast("Please enter a valid URL", "error"); qrUrlInput.focus(); return; }

  const title  = qrTitleInput.value.trim() || "QR Code";
  const color  = qrColorInput.value;
  const bg     = qrBgInput.value;
  const size   = +qrSizeInput.value;
  const ecl    = getECL();

  // Show spinner on button
  btnGenQR.textContent = "Generating…";
  btnGenQR.disabled = true;

  // Clear previous
  qrCanvasInner.innerHTML = "";
  qrInstance = null;

  // Create QR
  try {
    qrInstance = new QRCode(qrCanvasInner, {
      text: url,
      width: size,
      height: size,
      colorDark: color,
      colorLight: bg,
      correctLevel: QRCode.CorrectLevel[ecl],
    });
  } catch(e) {
    showToast("Failed to generate QR code", "error");
    resetBtn(btnGenQR, "Generate QR Code");
    return;
  }

  // Wait for QR canvas to be ready, then overlay logo
  setTimeout(() => {
    overlayLogo(size, color, bg, () => {
      // Show result
      qrPlaceholder.classList.add("hidden");
      qrResult.classList.remove("hidden");
      qrTitleDisp.textContent = title;
      qrUrlDisp.textContent = url;

      currentQRData = { url, title, color, bg, size, ecl, created: new Date().toISOString() };
      resetBtnQR();
      showToast("QR Code generated!", "success");
    });
  }, 150);
}

function overlayLogo(size, darkColor, lightColor, cb) {
  const canvas = qrCanvasInner.querySelector("canvas");
  if (!canvas) { cb(); return; }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const ctx = canvas.getContext("2d");
    const logoSize = Math.round(size * 0.2);
    const x = (size - logoSize) / 2;
    const y = (size - logoSize) / 2;

    // Draw circular white background for logo
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
    ctx.fillStyle = lightColor || "#ffffff";
    ctx.fill();
    ctx.restore();

    // Draw the logo
    ctx.drawImage(img, x, y, logoSize, logoSize);
    cb();
  };
  img.onerror = () => cb(); // Skip logo if image fails
  img.src = DENR_LOGO;
}

function resetBtnQR() {
  btnGenQR.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Generate QR Code`;
  btnGenQR.disabled = false;
}

/* ──────────────────────────────────────
   DOWNLOAD QR
────────────────────────────────────── */
btnDownloadQR.addEventListener("click", () => {
  const canvas = qrCanvasInner.querySelector("canvas");
  if (!canvas) return;

  const title = currentQRData?.title || "qr-code";
  const filename = slugify(title) + ".png";

  // Create composite canvas with title + QR
  const hasTitle = currentQRData?.title && currentQRData.title !== "QR Code";
  const pad = 24;
  const titleH = hasTitle ? 48 : 0;
  const qrSize = canvas.width;

  const out = document.createElement("canvas");
  out.width  = qrSize + pad * 2;
  out.height = qrSize + pad * 2 + titleH;
  const ctx = out.getContext("2d");

  // Background
  ctx.fillStyle = currentQRData?.bg || "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);

  // Title
  if (hasTitle) {
    ctx.fillStyle = currentQRData?.color || "#1a472a";
    ctx.font = "bold 22px 'Syne', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(currentQRData.title, out.width / 2, pad + 24);
  }

  // QR
  ctx.drawImage(canvas, pad, pad + titleH, qrSize, qrSize);

  const a = document.createElement("a");
  a.href = out.toDataURL("image/png");
  a.download = filename;
  a.click();
  showToast("Downloaded!", "success");
});

/* ──────────────────────────────────────
   COPY QR URL
────────────────────────────────────── */
btnCopyQRUrl.addEventListener("click", () => {
  if (!currentQRData?.url) return;
  copyToClipboard(currentQRData.url, "URL copied!");
});

/* ──────────────────────────────────────
   SAVE QR TO HISTORY
────────────────────────────────────── */
btnSaveQR.addEventListener("click", () => {
  if (!currentQRData) return;
  const canvas = qrCanvasInner.querySelector("canvas");
  const thumb  = canvas ? canvas.toDataURL("image/png") : null;
  saveToHistory({ type: "qr", ...currentQRData, thumb });
  showToast("Saved to history!", "success");
});

/* ──────────────────────────────────────
   URL SHORTENER
────────────────────────────────────── */
btnShorten.addEventListener("click", shortenURL);
shortUrlInput.addEventListener("keydown", e => { if (e.key === "Enter") shortenURL(); });

function shortenURL() {
  const url = shortUrlInput.value.trim();
  if (!url) { showToast("Please enter a URL", "error"); shortUrlInput.focus(); return; }
  if (!isValidURL(url)) { showToast("Please enter a valid URL", "error"); shortUrlInput.focus(); return; }

  const alias  = shortAliasInput.value.trim().replace(/[^a-zA-Z0-9\-_]/g, "") || generateAlias();
  const label  = shortLabelInput.value.trim() || url;
  const short  = SHORT_BASE + alias;

  btnShorten.textContent = "Shortening…";
  btnShorten.disabled = true;

  // Simulate async (real API would go here)
  setTimeout(() => {
    currentShortData = { url, short, alias, label, created: new Date().toISOString() };

    shortPlaceholder.classList.add("hidden");
    shortResult.classList.remove("hidden");
    shortLinkDisp.textContent = short;
    shortOrigDisp.textContent = "→ " + (url.length > 60 ? url.slice(0, 60) + "…" : url);
    shortMeta.textContent = label !== url ? "📌 " + label : "Created " + formatDate(currentShortData.created);

    resetBtn(btnShorten, `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Shorten URL`);
    showToast("Short link created!", "success");
  }, 400);
}

/* ── Copy short link ── */
btnCopyShort.addEventListener("click", () => {
  if (!currentShortData?.short) return;
  copyToClipboard(currentShortData.short, "Short link copied!");
});

/* ── Send short link to QR generator ── */
btnShortToQR.addEventListener("click", () => {
  if (!currentShortData?.short) return;
  qrUrlInput.value = "https://" + currentShortData.short;
  qrTitleInput.value = currentShortData.label || "";
  // Switch to QR tab
  navTabs.forEach(t => t.classList.remove("active"));
  tabPanels.forEach(p => p.classList.remove("active"));
  document.querySelector('[data-tab="qr"]').classList.add("active");
  document.getElementById("tab-qr").classList.add("active");
  showToast("URL loaded into QR generator", "info");
});

/* ── Save short to history ── */
btnSaveShort.addEventListener("click", () => {
  if (!currentShortData) return;
  saveToHistory({ type: "short", ...currentShortData });
  showToast("Saved to history!", "success");
});

/* ──────────────────────────────────────
   HISTORY
────────────────────────────────────── */
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveHistory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function saveToHistory(item) {
  const history = loadHistory();
  // Avoid duplicates by url+type
  const exists = history.findIndex(h => h.url === item.url && h.type === item.type);
  if (exists !== -1) history.splice(exists, 1);
  history.unshift(item);
  saveHistory(history.slice(0, 100)); // Max 100
  renderHistory();
}
function renderHistory() {
  const items = loadHistory();
  historyGrid.innerHTML = "";
  if (!items.length) {
    historyGrid.appendChild(historyEmpty);
    historyEmpty.style.display = "flex";
    return;
  }
  historyEmpty.style.display = "none";
  items.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div>
        <span class="history-type ${item.type}">${item.type === "qr" ? "◈ QR Code" : "⇒ Short Link"}</span>
        ${item.thumb ? `<img src="${item.thumb}" class="history-qr-thumb" alt="QR" />` : ""}
        <div class="history-item-title">${escHTML(item.title || item.label || item.alias || "Untitled")}</div>
        <div class="history-item-url">${item.type === "short" ? item.short : (item.url?.length > 50 ? item.url.slice(0,50)+"…" : item.url)}</div>
        <div class="history-item-date">${formatDate(item.created)}</div>
      </div>
      <div class="history-item-actions">
        <button class="hist-btn" data-action="copy" data-i="${i}">Copy</button>
        ${item.type === "short" ? `<button class="hist-btn" data-action="to-qr" data-i="${i}">Make QR</button>` : ""}
        ${item.thumb ? `<button class="hist-btn" data-action="download" data-i="${i}">Download</button>` : ""}
        <button class="hist-btn del" data-action="delete" data-i="${i}">Delete</button>
      </div>`;
    historyGrid.appendChild(div);
  });

  historyGrid.querySelectorAll(".hist-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx    = +btn.dataset.i;
      const action = btn.dataset.action;
      const item   = loadHistory()[idx];
      if (!item) return;
      if (action === "copy") copyToClipboard(item.type === "short" ? item.short : item.url, "Copied!");
      if (action === "delete") {
        const h = loadHistory(); h.splice(idx, 1); saveHistory(h); renderHistory();
        showToast("Deleted", "info");
      }
      if (action === "download" && item.thumb) {
        const a = document.createElement("a"); a.href = item.thumb;
        a.download = slugify(item.title || "qr") + ".png"; a.click();
      }
      if (action === "to-qr") {
        qrUrlInput.value  = item.url;
        qrTitleInput.value = item.label || "";
        navTabs.forEach(t => t.classList.remove("active"));
        tabPanels.forEach(p => p.classList.remove("active"));
        document.querySelector('[data-tab="qr"]').classList.add("active");
        document.getElementById("tab-qr").classList.add("active");
        showToast("URL loaded", "info");
      }
    });
  });
}

btnClearHist.addEventListener("click", () => {
  if (!confirm("Clear all history? This cannot be undone.")) return;
  saveHistory([]); renderHistory(); showToast("History cleared", "info");
});

// Init history
renderHistory();

/* ──────────────────────────────────────
   UTILITIES
────────────────────────────────────── */
function isValidURL(str) {
  try { new URL(str); return true; }
  catch { return false; }
}
function generateAlias() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "file";
}
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function escHTML(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function copyToClipboard(text, msg = "Copied!") {
  navigator.clipboard.writeText(text).then(() => showToast(msg, "success"))
    .catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      showToast(msg, "success");
    });
}
function showToast(msg, type = "") {
  toast.textContent = msg;
  toast.className = "toast show" + (type ? " " + type : "");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.classList.remove("show"); }, 2800);
}
function resetBtn(btn, html) {
  btn.innerHTML = html;
  btn.disabled = false;
}
