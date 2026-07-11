export interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
}

export async function chatWithJoker(history: ChatMessage[], message: string): Promise<string> {
  try {
    const response = await fetch("/api/chat-with-joker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ history, message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("HTTP error sending chat request:", response.status, errorData);
      
      if (errorData.text) {
        return errorData.text;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.text || "J'ai eu un trou de mémoire... Heureusement que je ne suis pas un chirurgien ! Ha ha ha !";
  } catch (error) {
    console.error("Client fetch error during Joker conversation:", error);
    return "Même mon génie a ses limites... ou alors c'est ton réseau qui flanche ! Ha ha ha !";
  }
}
