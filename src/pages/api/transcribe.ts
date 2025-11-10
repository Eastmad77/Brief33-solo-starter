import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import formidable, { File } from "formidable";
import fs from "node:fs";

export const config = { api: { bodyParser: false } };
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

function parseForm(req: NextApiRequest): Promise<{ file: File }> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      maxFileSize: 50 * 1024 * 1024,
      filter: (part) =>
        part.mimetype?.startsWith("audio/") ||
        part.mimetype === "video/webm" ||
        part.mimetype === "application/octet-stream",
    });
    form.parse(req, (err, _fields, files) => {
      if (err) return reject(err);
      const file = (files.file as File) || (files.audio as File);
      if (!file) return reject(new Error("No audio file received."));
      resolve({ file });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
    const { file } = await parseForm(req);

    if (!OPENAI_API_KEY) {
      return res.status(200).json({
        transcript: "Demo transcript (set OPENAI_API_KEY to enable real Whisper transcription).",
        segments: [],
        durationSec: 0,
      });
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const readStream = fs.createReadStream(file.filepath);
    const tr = await openai.audio.transcriptions.create({
      file: readStream as any,
      model: "whisper-1",
      response_format: "verbose_json",
      temperature: 0,
    });

    return res.status(200).json({
      transcript: (tr as any).text,
      segments: (tr as any).segments ?? [],
      durationSec: (tr as any).duration ?? null,
    });
  } catch (err: any) {
    console.error("[transcribe] error:", err);
    return res.status(500).json({ error: err?.message || "transcribe-failed" });
  }
}
