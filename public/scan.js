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

async function lookupBarcode() {
  const barcode = barcodeInput.value.trim();
  if (!barcode) {
    statusEl.textContent = "נא להזין ברקוד.";
    return;
  }

  statusEl.textContent = "מחפש...";
  labelSection.classList.add("hidden");

  const stored = localStorage.getItem("csvData");
  if (!stored) {
    statusEl.textContent = "לא נמצא קובץ CSV שמור. יש להעלות קובץ קודם.";
    return;
  }

  try {
    const payload = JSON.parse(stored);
    const match = payload.rows.find((row) => String(row[0]).trim() === barcode);

    if (!match) {
      throw new Error("ברקוד לא נמצא בקובץ.");
    }

    const data = payload.headers.reduce((acc, header, index) => {
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
  codeStatus.textContent = "";
  codeInput.value = "";
  codeInput.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  modal.setAttribute("hidden", "");
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
  const stored = localStorage.getItem("csvData");
  if (!stored) {
    csvStatus.textContent = "אין קובץ CSV שמור במכשיר.";
    return;
  }

  try {
    const payload = JSON.parse(stored);
    csvStatus.textContent = `קובץ פעיל: ${payload.filename || "ללא שם"} | שורות: ${
      payload.rows?.length ?? 0
    }`;
  } catch (error) {
    csvStatus.textContent = "לא ניתן לקרוא את הקובץ השמור.";
  }
}

updateCsvStatus();
