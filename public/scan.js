const barcodeInput = document.querySelector("#barcode");
const statusEl = document.querySelector("#scan-status");
const searchButton = document.querySelector("#search-button");
const labelSection = document.querySelector("#label-section");
const labelPreview = document.querySelector("#label-preview");
const backToScan = document.querySelector("#back-to-scan");
const printButton = document.querySelector("#print-button");
const goUpload = document.querySelector("#go-upload");
const csvStatus = document.querySelector("#csv-status");

const modal = document.querySelector("#code-modal");
const codeInput = document.querySelector("#code-input");
const codeSubmit = document.querySelector("#code-submit");
const codeCancel = document.querySelector("#code-cancel");
const codeStatus = document.querySelector("#code-status");

const installButton = document.querySelector("#install-button");
let deferredPrompt = null;

function forceHideModal() {
  modal.classList.add("hidden");
  modal.setAttribute("hidden", "");
}

forceHideModal();

function getGithubConfig() {
  return {
    owner: localStorage.getItem("githubOwner") || "",
    repo: localStorage.getItem("githubRepo") || "",
    branch: localStorage.getItem("githubBranch") || "main",
    path: localStorage.getItem("githubPath") || "",
  };
}

async function fetchCsvFromGithub() {
  const config = getGithubConfig();
  if (!config.owner || !config.repo || !config.path) {
    throw new Error("יש להגדיר פרטי מאגר בדף העלאת ה-CSV.");
  }

  const rawUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${config.path}`;
  const response = await fetch(rawUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("לא ניתן לטעון את קובץ ה-CSV מהמאגר.");
  }

  return response.text();
}

async function lookupBarcode() {
  const barcode = barcodeInput.value.trim();
  if (!barcode) {
    statusEl.textContent = "נא להזין ברקוד.";
    return;
  }

  statusEl.textContent = "מחפש...";
  labelSection.classList.add("hidden");

  try {
    const content = await fetchCsvFromGithub();
    const rows = parseCsv(content);
    if (rows.length === 0) {
      throw new Error("קובץ ה-CSV ריק.");
    }

    const [headers, ...dataRows] = rows;
    const match = dataRows.find((row) => String(row[0]).trim() === barcode);

    if (!match) {
      throw new Error("ברקוד לא נמצא בקובץ.");
    }

    const data = headers.reduce((acc, header, index) => {
      acc[header || `עמודה ${index + 1}`] = match[index] ?? "";
      return acc;
    }, {});

    renderLabel(data);
    statusEl.textContent = "נמצאו נתונים והמדבקה מוכנה.";
    labelSection.classList.remove("hidden");
  } catch (error) {
    statusEl.textContent = error.message;
  }
}

function renderLabel(data) {
  labelPreview.innerHTML = "";
  Object.entries(data).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "label-row";

    const label = document.createElement("div");
    label.textContent = key;

    const content = document.createElement("div");
    content.textContent = value || "-";

    row.append(label, content);
    labelPreview.appendChild(row);
  });
}

searchButton.addEventListener("click", lookupBarcode);
barcodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    lookupBarcode();
  }
});

backToScan.addEventListener("click", () => {
  labelSection.classList.add("hidden");
  barcodeInput.focus();
});

printButton.addEventListener("click", () => {
  statusEl.textContent = "כפתור ההדפסה מוכן להגדרה בהמשך.";
});

function openModal() {
  modal.classList.remove("hidden");
  modal.removeAttribute("hidden");
  modal.style.display = "flex";
  codeStatus.textContent = "";
  codeInput.value = "";
  codeInput.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  modal.setAttribute("hidden", "");
  modal.style.display = "";
}

goUpload.addEventListener("click", () => {
  openModal();
});

codeCancel.addEventListener("click", closeModal);

codeSubmit.addEventListener("click", () => {
  const value = codeInput.value.trim();
  if (value === "770") {
    window.location.href = "./upload.html";
    return;
  }
  codeStatus.textContent = "הקוד שגוי. נסה שוב.";
});

codeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    codeSubmit.click();
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!deferredPrompt) {
    return;
  }

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

function updateCsvStatus() {
  const config = getGithubConfig();
  if (!config.owner || !config.repo || !config.path) {
    csvStatus.textContent = "אין הגדרות מאגר. יש להגדיר בדף העלאת CSV.";
    return;
  }

  csvStatus.textContent = `מאגר פעיל: ${config.owner}/${config.repo} | קובץ: ${config.path}`;
}

updateCsvStatus();
