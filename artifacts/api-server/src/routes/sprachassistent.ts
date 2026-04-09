import { Router } from "express";
import multer from "multer";
import { pool } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { Readable } from "stream";
import { toFile } from "openai";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// POST /sprachassistent/transkribieren
// Nimmt eine Audio-Datei entgegen, transkribiert sie und extrahiert Aufgaben per GPT
router.post("/sprachassistent/transkribieren", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Keine Audio-Datei erhalten." });
    }

    // 1. Transkription via Whisper (gpt-4o-mini-transcribe)
    const audioBuffer = req.file.buffer;
    const mimeType = req.file.mimetype || "audio/webm";
    const ext = mimeType.includes("wav") ? "wav"
               : mimeType.includes("mp4") ? "mp4"
               : mimeType.includes("ogg") ? "ogg"
               : "webm";

    const audioFile = await toFile(Readable.from(audioBuffer), `aufnahme.${ext}`, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file: audioFile,
      response_format: "json",
      language: "de",
    });

    const transcript = transcription.text?.trim() || "";
    if (!transcript) {
      return res.json({ transcript: "", aufgaben: [] });
    }

    // 2. Aufgaben extrahieren via GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: `Du bist ein Assistent für einen EDEKA-Supermarkt und hilfst dabei, aus gesprochenen Arbeitsanweisungen strukturierte Aufgaben zu extrahieren.

Extrahiere alle Aufgaben aus dem Text und gib sie als JSON-Array zurück.
Jede Aufgabe hat folgende Felder:
- "title": Kurzer, klarer Aufgabentitel (max 80 Zeichen)
- "description": Optionale Beschreibung mit Details (oder leerer String)
- "assignedTo": Name der verantwortlichen Person falls genannt, sonst leerer String
- "requiresApproval": true wenn explizit Genehmigung/Freigabe erwähnt wird, sonst false

Antworte NUR mit einem validen JSON-Array. Kein erklärender Text darum herum.
Beispiel: [{"title":"Kühlraum prüfen","description":"Temperatur kontrollieren und dokumentieren","assignedTo":"","requiresApproval":false}]

Wenn keine klaren Aufgaben erkennbar sind, antworte mit einem leeren Array: []`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    let aufgaben: Array<{
      title: string;
      description: string;
      assignedTo: string;
      requiresApproval: boolean;
    }> = [];

    try {
      const raw = completion.choices[0]?.message?.content || "[]";
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        aufgaben = parsed.map(a => ({
          title: String(a.title || "").slice(0, 80),
          description: String(a.description || ""),
          assignedTo: String(a.assignedTo || ""),
          requiresApproval: Boolean(a.requiresApproval),
        }));
      }
    } catch {
      aufgaben = [];
    }

    res.json({ transcript, aufgaben });
  } catch (err: any) {
    console.error("[Sprachassistent] Fehler:", err);
    res.status(500).json({ error: "Fehler bei der Verarbeitung der Sprachnachricht.", detail: err?.message });
  }
});

// POST /sprachassistent/aufgaben-anlegen
// Legt extrahierte Aufgaben direkt als Projektaufgaben an (ohne Projekt → neues Projekt wird erstellt)
router.post("/sprachassistent/aufgaben-anlegen", async (req, res) => {
  try {
    const { aufgaben, projektName, transcript } = req.body as {
      aufgaben: Array<{ title: string; description: string; assignedTo: string; requiresApproval: boolean }>;
      projektName?: string;
      transcript?: string;
    };

    if (!Array.isArray(aufgaben) || aufgaben.length === 0) {
      return res.status(400).json({ error: "Keine Aufgaben übergeben." });
    }

    const tenantId = 1;
    const name = (projektName || "Sprachnotiz").trim().slice(0, 100);
    const now = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const projectTitle = `${name} – ${dateStr}`;

    // Neues Projekt anlegen
    const projRes = await pool.query(
      `INSERT INTO projects (tenant_id, title, description, status, created_at)
       VALUES ($1, $2, $3, 'active', NOW())
       RETURNING id`,
      [tenantId, projectTitle, transcript ? `Transkript: ${transcript.slice(0, 500)}` : "Automatisch erstellt via Sprachassistent"]
    );
    const projectId = projRes.rows[0].id;

    // Alle Aufgaben anlegen
    const createdTasks = [];
    for (let i = 0; i < aufgaben.length; i++) {
      const a = aufgaben[i];
      const taskRes = await pool.query(
        `INSERT INTO project_tasks (project_id, title, description, status, order_index, assigned_to, requires_approval, approval_note)
         VALUES ($1, $2, $3, 'pending', $4, $5, $6, '')
         RETURNING id, title`,
        [
          projectId,
          a.title.slice(0, 255),
          a.description || "",
          i,
          a.assignedTo || null,
          Boolean(a.requiresApproval),
        ]
      );
      createdTasks.push(taskRes.rows[0]);
    }

    res.json({ success: true, projectId, projectTitle, tasks: createdTasks });
  } catch (err: any) {
    console.error("[Sprachassistent] Aufgaben-Anlegen Fehler:", err);
    res.status(500).json({ error: "Fehler beim Anlegen der Aufgaben.", detail: err?.message });
  }
});

export default router;
