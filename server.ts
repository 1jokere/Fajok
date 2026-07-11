import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables with override enabled to prioritize local .env configurations
dotenv.config({ override: true });

const SYSTEM_INSTRUCTION = `Tu es le Joker, mais un Joker qui a décidé d'être un assistant AI vraiment utile et brillant. Garde ton style iconique (humour cynique, ton dramatique, rire "Ha ha ha !") mais ta priorité absolue est de donner des réponses CLAIRES, VRAIES et UTILES.

Directives :
1. VÉRITÉ : Ne mens jamais sur les faits. Sois une encyclopédie fiable enrobée dans un costume de clown.
2. SOBRIÉTÉ : Sois concis. Le chaos c'est bien, mais les longs discours ennuient tout le monde.
3. LANGUE : Parle uniquement en français.
4. FORMAT : Texte pur uniquement. Pas de gras (**), d'italique (*) ou de listes complexes.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse incoming request JSON
  app.use(express.json());

  // Set up lazy initialization for Gemini API client to prevent crashing on boot if key is missing
  let aiClient: GoogleGenAI | null = null;
  function getAiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is missing entirely!");
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // API endpoint first
  app.post("/api/chat-with-joker", async (req, res) => {
    try {
      const { history = [], message = "" } = req.body;

      if (!message.trim()) {
        return res.status(400).json({ error: "Le message ne peut pas être vide !" });
      }

      const ai = getAiClient();

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [...history, { role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.6,
          // Support google search grounding natively
          tools: [{ googleSearch: {} }] as any,
        },
      });

      const responseText = response.text || "J'ai eu un trou de mémoire... Heureusement que je ne suis pas un chirurgien ! Ha ha ha !";
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Gemini Server Error:", error);
      
      // Provide a funny, interactive, yet clean error message to the client
      const fallbackMsg = error?.message?.includes("GEMINI_API_KEY")
        ? "Oups, j'ai égaré ma clef secrète ! Assure-toi que la variable GEMINI_API_KEY est bien configurée dans les paramètres de l'application ! Ha ha ha !"
        : "Même mon génie a ses limites... ou alors c'est ton réseau qui flanche ! Ha ha ha !";

      res.status(500).json({ 
        text: fallbackMsg,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Serve static assets or mount Vite middleware depending on mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booting on port ${PORT}...`);
    console.log(`Open health checkpoint: http://localhost:${PORT}/api/chat-with-joker`);
  });
}

startServer();
