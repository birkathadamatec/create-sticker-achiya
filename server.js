import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE = "https://members.lionwheel.com/api/v1/tasks/show";
const API_KEY = process.env.LIONWHEEL;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.redirect("/scan.html");
});

app.get("/api/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;
  if (!taskId) {
    return res.status(400).json({ error: "Missing task id" });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: "Missing LIONWHEEL API key" });
  }

  try {
    const url = `${API_BASE}/${encodeURIComponent(taskId)}?key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch task data" });
    }
    const payload = await response.json();
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch task data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
