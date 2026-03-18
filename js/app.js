/* ──────────────────────────────────────────────────────────
   QR Studio — DENR Link Manager  |  app.js
   ────────────────────────────────────────────────────────── */

const DENR_LOGO  = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Logo_of_the_Department_of_Environment_and_Natural_Resources.svg/960px-Logo_of_the_Department_of_Environment_and_Natural_Resources.svg.png";
const STORAGE_KEY = "qr_studio_history";

/* ── State ── */
let currentQRData = null; // stores settings + final composited dataURL

/* ── DOM ── */
const $ = id => document.getElementById(id);

const navTabs      = document.querySelectorAll(".nav-tab");
const tabPanels    = document.querySelectorAll(".tab-panel");
const qrUrlInput   = $("qr-url");
const qrTitleInput = $("qr-title");
const qrColorInput = $("qr-color");
const qrBgInput    = $("qr-bg");
const qrSizeInput  = $("qr-size");
const eclBtns      = document.querySelectorAll("#qr-ecl .toggle-btn");
const btnGenQR     = $("btn-generate-qr");
const qrPlaceholder = $("qr-placeholder");
const qrResult     = $("qr-result");
const qrTitleDisp  = $("qr-title-display");
const qrRawInner   = $("qr-raw-inner");   // hidden – QRCode.js renders here
const qrDisplayCanvas = $("qr-display-canvas"); // visible composite
const qrUrlDisp    = $("qr-url-display");
const btnDownloadQR = $("btn-download-qr");
const btnCopyQRUrl  = $("btn-copy-qr-url");
const btnSaveQR    = $("btn-save-qr");
const historyGrid  = $("history-grid");
const historyEmpty = $("history-empty");
const btnClearHist = $("btn-clear-history");
const toast        = $("toast");

/* ──────────────────────────────────────
   TAB NAVIGATION
────────────────────────────────────── */
navTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    navTabs.forEach(t => t.classList.remove("active"));
    tabPanels.forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    $(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

/* ──────────────────────────────────────
   COLOR PICKERS
────────────────────────────────────── */
qrColorInput.addEventListener("input", () => { $("qr-color-label").textContent = qrColorInput.value; });
qrBgInput.addEventListener("input",    () => { $("qr-bg-label").textContent    = qrBgInput.value; });

/* ──────────────────────────────────────
   SIZE SLIDER
────────────────────────────────────── */
function updateSlider() {
  const min = +qrSizeInput.min, max = +qrSizeInput.max, val = +qrSizeInput.value;
  qrSizeInput.style.setProperty("--slider-pct", ((val - min) / (max - min)) * 100 + "%");
  $("qr-size-label").textContent = val + "px";
}
qrSizeInput.addEventListener("input", updateSlider);
updateSlider();

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
   Strategy: QRCode.js renders to a hidden canvas (untouched).
   We then composite that clean QR + DENR logo onto a second
   visible canvas. Download also uses the composite canvas.
   The raw QR canvas is NEVER modified, so it stays fully scannable.
────────────────────────────────────── */
btnGenQR.addEventListener("click", generateQR);
qrUrlInput.addEventListener("keydown", e => { if (e.key === "Enter") generateQR(); });

function generateQR() {
  const url = qrUrlInput.value.trim();
  if (!url) { showToast("Please enter a URL", "error"); qrUrlInput.focus(); return; }
  if (!isValidURL(url)) { showToast("Please enter a valid URL", "error"); qrUrlInput.focus(); return; }

  const title = qrTitleInput.value.trim() || "";
  const color = qrColorInput.value;
  const bg    = qrBgInput.value;
  const size  = +qrSizeInput.value;
  const ecl   = getECL();

  btnGenQR.textContent = "Generating…";
  btnGenQR.disabled = true;

  // Clear hidden raw container
  qrRawInner.innerHTML = "";

  // Step 1: render clean QR into hidden div
  try {
    new QRCode(qrRawInner, {
      text: url,
      width: size,
      height: size,
      colorDark: color,
      colorLight: bg,
      correctLevel: QRCode.CorrectLevel[ecl],
    });
  } catch (e) {
    showToast("Failed to generate QR code", "error");
    resetBtnQR();
    return;
  }

  // Step 2: after QRCode.js paints, composite onto display canvas
  setTimeout(() => {
    const rawCanvas = qrRawInner.querySelector("canvas");
    if (!rawCanvas) { showToast("QR render error", "error"); resetBtnQR(); return; }

    buildComposite(rawCanvas, size, bg, (compositeCanvas) => {
      // Copy composite onto the visible display canvas
      qrDisplayCanvas.width  = compositeCanvas.width;
      qrDisplayCanvas.height = compositeCanvas.height;
      const ctx = qrDisplayCanvas.getContext("2d");
      ctx.drawImage(compositeCanvas, 0, 0);

      // Show result panel
      qrPlaceholder.classList.add("hidden");
      qrResult.classList.remove("hidden");
      qrTitleDisp.textContent = title;
      qrUrlDisp.textContent   = url;

      currentQRData = {
        url, title, color, bg, size, ecl,
        created: new Date().toISOString(),
        // keep a reference to the final composited data URL for download/save
        dataURL: compositeCanvas.toDataURL("image/png"),
      };

      resetBtnQR();
      showToast("QR Code generated!", "success");
    });
  }, 150);
}

/*
  buildComposite: takes the clean raw QR canvas and draws a new canvas
  with the DENR logo overlaid.  The raw canvas is NEVER touched.
  Logo size = 20% of QR — safe zone for H-level error correction (30%).
*/
function buildComposite(rawCanvas, size, bgColor, cb) {
  const out = document.createElement("canvas");
  out.width  = size;
  out.height = size;
  const ctx = out.getContext("2d");

  // 1. Draw the clean QR
  ctx.drawImage(rawCanvas, 0, 0);

  // 2. Load DENR logo and overlay
  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    const logoSize  = Math.round(size * 0.20);  // 20% of QR width
    const x = Math.round((size - logoSize) / 2);
    const y = Math.round((size - logoSize) / 2);
    const pad = Math.round(logoSize * 0.12);     // white halo padding

    // White circular background so the logo sits cleanly
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2 + pad, 0, Math.PI * 2);
    ctx.fillStyle = bgColor || "#ffffff";
    ctx.fill();
    ctx.restore();

    // Draw logo centred
    ctx.drawImage(img, x, y, logoSize, logoSize);

    cb(out);
  };

  img.onerror = () => {
    // Logo failed to load — return QR without logo (still scannable)
    cb(out);
  };

  img.src = DENR_LOGO;
}

function resetBtnQR() {
  btnGenQR.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Generate QR Code`;
  btnGenQR.disabled = false;
}

/* ──────────────────────────────────────
   DOWNLOAD QR
   Uses the pre-built composite dataURL — adds title banner if set.
────────────────────────────────────── */
btnDownloadQR.addEventListener("click", () => {
  if (!currentQRData?.dataURL) return;

  const title    = currentQRData.title;
  const hasTitle = Boolean(title);
  const pad      = 28;
  const titleH   = hasTitle ? 52 : 0;
  const qrSize   = currentQRData.size;

  const out = document.createElement("canvas");
  out.width  = qrSize + pad * 2;
  out.height = qrSize + pad * 2 + titleH;
  const ctx = out.getContext("2d");

  // Background
  ctx.fillStyle = currentQRData.bg || "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);

  // Title text
  if (hasTitle) {
    ctx.fillStyle  = currentQRData.color || "#1a472a";
    ctx.font       = "bold 20px sans-serif";
    ctx.textAlign  = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, out.width / 2, pad + titleH / 2);
  }

  // Composite QR (already has logo baked in)
  const qrImg = new Image();
  qrImg.onload = () => {
    ctx.drawImage(qrImg, pad, pad + titleH, qrSize, qrSize);
    const a = document.createElement("a");
    a.href     = out.toDataURL("image/png");
    a.download = slugify(title || "denr-qr") + ".png";
    a.click();
    showToast("Downloaded!", "success");
  };
  qrImg.src = currentQRData.dataURL;
});

/* ──────────────────────────────────────
   COPY URL
────────────────────────────────────── */
btnCopyQRUrl.addEventListener("click", () => {
  if (currentQRData?.url) copyToClipboard(currentQRData.url, "URL copied!");
});

/* ──────────────────────────────────────
   SAVE TO HISTORY
────────────────────────────────────── */
btnSaveQR.addEventListener("click", () => {
  if (!currentQRData) return;
  saveToHistory({ type: "qr", ...currentQRData });
  showToast("Saved to history!", "success");
});

/* ──────────────────────────────────────
   HISTORY
────────────────────────────────────── */
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveHistoryStore(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function saveToHistory(item) {
  const h = loadHistory();
  const exists = h.findIndex(x => x.url === item.url && x.type === item.type);
  if (exists !== -1) h.splice(exists, 1);
  h.unshift(item);
  saveHistoryStore(h.slice(0, 100));
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
        <span class="history-type qr">◈ QR Code</span>
        ${item.dataURL ? `<img src="${item.dataURL}" class="history-qr-thumb" alt="QR" />` : ""}
        <div class="history-item-title">${escHTML(item.title || "Untitled")}</div>
        <div class="history-item-url">${escHTML(item.url?.length > 55 ? item.url.slice(0,55)+"…" : item.url || "")}</div>
        <div class="history-item-date">${formatDate(item.created)}</div>
      </div>
      <div class="history-item-actions">
        <button class="hist-btn" data-action="copy" data-i="${i}">Copy URL</button>
        ${item.dataURL ? `<button class="hist-btn" data-action="download" data-i="${i}">Download</button>` : ""}
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
      if (action === "copy")     copyToClipboard(item.url, "URL copied!");
      if (action === "download" && item.dataURL) {
        const a = document.createElement("a");
        a.href     = item.dataURL;
        a.download = slugify(item.title || "denr-qr") + ".png";
        a.click();
        showToast("Downloaded!", "success");
      }
      if (action === "delete") {
        const h = loadHistory(); h.splice(idx, 1); saveHistoryStore(h); renderHistory();
        showToast("Deleted", "info");
      }
    });
  });
}

btnClearHist.addEventListener("click", () => {
  if (!confirm("Clear all history? This cannot be undone.")) return;
  saveHistoryStore([]); renderHistory(); showToast("History cleared", "info");
});

renderHistory();

/* ──────────────────────────────────────
   UTILITIES
────────────────────────────────────── */
function isValidURL(str) {
  try { new URL(str); return true; } catch { return false; }
}
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "denr-qr";
}
function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}
function escHTML(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function copyToClipboard(text, msg = "Copied!") {
  navigator.clipboard.writeText(text)
    .then(() => showToast(msg, "success"))
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
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2800);
}