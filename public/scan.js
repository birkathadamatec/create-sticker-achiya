const barcodeInput = document.querySelector("#barcode");
const statusEl = document.querySelector("#scan-status");
const searchButton = document.querySelector("#search-button");
const labelSection = document.querySelector("#label-section");
const labelPreview = document.querySelector("#label-preview");
const backToScan = document.querySelector("#back-to-scan");
const printButton = document.querySelector("#print-button");
const csvStatus = document.querySelector("#csv-status");

const installButton = document.querySelector("#install-button");
let deferredPrompt = null;

const WEBHOOK_URL =
  "https://hook.integrator.boost.space/36qda98lb8qyzgj53xuqnsi8igbugnxr";
const POLL_DELAY_MS = 1500;
const MAX_POLL_ATTEMPTS = 10;

async function fetchTaskData(taskId) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ task_id: taskId }),
  });

  if (response.status !== 200) {
    throw new Error("שליחת הברקוד נכשלה.");
  }

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS));
    const pollResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task_id: taskId }),
    });

    if (pollResponse.status === 201) {
      return pollResponse.json();
    }
  }

  throw new Error("לא התקבלה תשובה מהמערכת בזמן.");
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
    const payload = await fetchTaskData(barcode);
    if (!Array.isArray(payload) || payload.length === 0) {
      throw new Error("לא נמצאו נתונים למשימה.");
    }

    const [task] = payload;
    const data = {
      "כמות חבילות": task.packages_quantity ?? "-",
      "מספר הזמנה": task.wp_order_id ?? "-",
      "נהג": task.driver_str ?? "-",
    };

    renderLabels(data, Number(task.packages_quantity || 1));
    statusEl.textContent = "נמצאו נתונים והמדבקה מוכנה.";
    labelSection.classList.remove("hidden");
  } catch (error) {
    statusEl.textContent = error.message;
  }
}

function renderLabels(data, totalLabels) {
  labelPreview.innerHTML = "";
  const count = Number.isFinite(totalLabels) && totalLabels > 0 ? totalLabels : 1;

  for (let index = 1; index <= count; index += 1) {
    const card = document.createElement("div");
    card.className = "label-card";

    const header = document.createElement("div");
    header.className = "label-header";

    const logo = document.createElement("div");
    logo.className = "label-logo";

    const logoImage = document.createElement("img");
    logoImage.src = "./assets/logo.png";
    logoImage.alt = "Logo";
    logoImage.className = "label-logo-image";
    logoImage.addEventListener("error", () => {
      logoImage.classList.add("hidden");
      logo.textContent = "לוגו כאן";
    });

    logo.appendChild(logoImage);

    const counter = document.createElement("div");
    counter.className = "label-counter";
    counter.textContent = `${index}/${count}`;

    header.append(logo, counter);
    card.appendChild(header);

    Object.entries(data).forEach(([key, value]) => {
      const row = document.createElement("div");
      row.className = "label-row";

      const label = document.createElement("div");
      label.textContent = key;

      const content = document.createElement("div");
      content.textContent = value || "-";

      row.append(label, content);
      card.appendChild(row);
    });

    labelPreview.appendChild(card);
  }
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

csvStatus.textContent = "המערכת קוראת נתונים ישירות מה-API.";
