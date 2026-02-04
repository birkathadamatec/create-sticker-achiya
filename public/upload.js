const form = document.querySelector("#upload-form");
const statusEl = document.querySelector("#upload-status");
const githubForm = document.querySelector("#github-form");
const githubOwner = document.querySelector("#github-owner");
const githubRepo = document.querySelector("#github-repo");
const githubBranch = document.querySelector("#github-branch");
const githubPath = document.querySelector("#github-path");
const githubToken = document.querySelector("#github-token");
const saveGithub = document.querySelector("#save-github");

function loadGithubSettings() {
  githubOwner.value = localStorage.getItem("githubOwner") || "";
  githubRepo.value = localStorage.getItem("githubRepo") || "";
  githubBranch.value = localStorage.getItem("githubBranch") || "main";
  githubPath.value = localStorage.getItem("githubPath") || "";
  githubToken.value = localStorage.getItem("githubToken") || "";
}

function saveGithubSettings() {
  localStorage.setItem("githubOwner", githubOwner.value.trim());
  localStorage.setItem("githubRepo", githubRepo.value.trim());
  localStorage.setItem("githubBranch", githubBranch.value.trim() || "main");
  localStorage.setItem("githubPath", githubPath.value.trim());
  localStorage.setItem("githubToken", githubToken.value.trim());
}

saveGithub.addEventListener("click", () => {
  saveGithubSettings();
  statusEl.textContent = "הגדרות המאגר נשמרו.";
});

githubForm.addEventListener("submit", (event) => {
  event.preventDefault();
});

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
    saveGithubSettings();
    const owner = githubOwner.value.trim();
    const repo = githubRepo.value.trim();
    const branch = githubBranch.value.trim() || "main";
    const path = githubPath.value.trim();
    const token = githubToken.value.trim();

    if (!owner || !repo || !path || !token) {
      throw new Error("יש להשלים את כל הגדרות המאגר לפני העלאה.");
    }

    const content = await file.text();
    const rows = parseCsv(content);
    if (rows.length === 0) {
      throw new Error("הקובץ ריק.");
    }

    const base64Content = btoa(unescape(encodeURIComponent(content)));
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const existingResponse = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    let sha;
    if (existingResponse.ok) {
      const existingPayload = await existingResponse.json();
      sha = existingPayload.sha;
    }

    const updateResponse = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Update CSV file",
        content: base64Content,
        branch,
        sha,
      }),
    });

    if (!updateResponse.ok) {
      let errorMessage = "העלאה ל-GitHub נכשלה.";
      try {
        const errorPayload = await updateResponse.json();
        if (errorPayload?.message) {
          errorMessage = `העלאה ל-GitHub נכשלה: ${errorPayload.message}`;
        }
      } catch (parseError) {
        // ignore parse error
      }
      throw new Error(errorMessage);
    }

    statusEl.textContent = `הקובץ הועלה בהצלחה ל-GitHub (${file.name}).`;
    form.reset();
  } catch (error) {
    statusEl.textContent = error.message;
  }
});

loadGithubSettings();
