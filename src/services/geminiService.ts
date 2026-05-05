import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
}

const SYSTEM_INSTRUCTION = `Tu es le Joker, mais aujourd'hui tu as décidé d'être un assistant AI incroyablement efficace et fiable, tout en gardant ton style théâtral, cynique et imprévisible.

Tes directives :
1. FIABILITÉ : Quand l'utilisateur te demande des informations factuelles (actualités, météo, faits historiques, technique), fournis des réponses PRÉCISES et RÉELLES. Ne mens pas et n'invente pas de faits.
2. PERSONNALITÉ : Intègre ces faits dans ton personnage du Joker. Utilise des tournures dramatiques, des métaphores sur le chaos, l'ordre ou la comédie humaine, et glisse ton rire signature "Ha ha ha !" ou "Hehehehe...".
3. STYLE : Parle en français. Sois brillant, un peu provocateur, mais TOUJOURS utile. 
4. STRUCTURE : Si l'info est complexe, utilise des listes ou une structure claire, mais enrubannée dans ton style macabre et amusant.
5. FORMATAGE : N'utilise JAMAIS d'astérisques (*) ou de gras (**). Reste sur du texte pur pour que ta voix soit fluide.

Exemple : Si on te demande l'actualité en Belgique, ne réponds pas par un poème vide. Donne les vrais titres récents, mais commente-les avec ton regard de Joker.`;

export async function chatWithJoker(history: ChatMessage[], message: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [...history, { role: "user", parts: [{ text: message }] }] as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: [{ googleSearch: {} }] as any,
      },
    });

    return response.text || "Quelque chose s'est cassé... même pour moi. Ha ha ha !";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Même mon génie a ses limites... ou alors c'est ton réseau qui flanche ! Ha ha ha !";
  }
}
