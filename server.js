import express from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: path.join(__dirname, "uploads") });
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, "uploads", "data.csv");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.redirect("/scan.html");
});

app.post("/api/upload", upload.single("csv"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Missing CSV file" });
  }

  try {
    await fs.mkdir(path.join(__dirname, "uploads"), { recursive: true });
    await fs.rename(req.file.path, DATA_PATH);
    return res.json({ ok: true, filename: req.file.originalname });
  } catch (error) {
    return res.status(500).json({ error: "Failed to store CSV" });
  }
});

app.get("/api/lookup", async (req, res) => {
  const { barcode } = req.query;
  if (!barcode) {
    return res.status(400).json({ error: "Missing barcode" });
  }

  try {
    const content = await fs.readFile(DATA_PATH, "utf8");
    const rows = parseCsv(content);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Empty CSV" });
    }

    const [headers, ...dataRows] = rows;
    const match = dataRows.find((row) => String(row[0]).trim() === String(barcode).trim());
    if (!match) {
      return res.status(404).json({ error: "Barcode not found" });
    }

    const data = headers.reduce((acc, header, index) => {
      acc[header || `עמודה ${index + 1}`] = match[index] ?? "";
      return acc;
    }, {});

    return res.json({ ok: true, data });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({ error: "CSV not uploaded yet" });
    }
    return res.status(500).json({ error: "Failed to read CSV" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

function parseCsv(content) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current.trim());
      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }

  return rows;
}
