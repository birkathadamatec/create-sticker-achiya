const form = document.querySelector("#upload-form");
const statusEl = document.querySelector("#upload-status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "מעלה קובץ...";

  const formData = new FormData(form);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "שגיאה בהעלאה");
    }

    statusEl.textContent = `הקובץ נשמר בהצלחה (${payload.filename}).`;
    form.reset();
  } catch (error) {
    statusEl.textContent = error.message;
  }
});
