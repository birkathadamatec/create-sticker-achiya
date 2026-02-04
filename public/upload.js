const form = document.querySelector("#upload-form");
const statusEl = document.querySelector("#upload-status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "קורא את הקובץ...";

  const fileInput = form.querySelector("#csv");
  const file = fileInput.files[0];

  if (!file) {
    statusEl.textContent = "יש לבחור קובץ.";
    return;
  }

  try {
    const content = await file.text();
    const rows = parseCsv(content);
    if (rows.length === 0) {
      throw new Error("הקובץ ריק.");
    }

    const [headers, ...dataRows] = rows;
    const payload = {
      headers,
      rows: dataRows,
      filename: file.name,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("csvData", JSON.stringify(payload));
    statusEl.textContent = `הקובץ נשמר בהצלחה (${file.name}). נמצאו ${dataRows.length} שורות.`;
    form.reset();
  } catch (error) {
    statusEl.textContent = error.message;
  }
});
