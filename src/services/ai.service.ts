import { getAI, getGenerativeModel, GoogleAIBackend, FunctionDeclaration, ObjectSchemaInterface } from "@firebase/ai";
import { app } from "../config/firebase";

// AI servisini başlat
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Gemini modelini oluştur
const model = getGenerativeModel(ai, { model: "gemini-2.0-flash" });

export const generateText = async (prompt: string): Promise<string> => {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI metin üretme hatası:", error);
    throw error;
  }
};

export const generateStructuredOutput = async <T>(
  prompt: string,
  schema: ObjectSchemaInterface
): Promise<T> => {
  try {
    const functionDeclaration: FunctionDeclaration = {
      name: "getStructuredOutput",
      description: "Get structured output based on the schema",
      parameters: schema
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      tools: [{
        functionDeclarations: [functionDeclaration]
      }]
    });
    
    const candidates = result.response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response from AI model");
    }

    return candidates[0].content.parts[0].functionCall?.args as T;
  } catch (error) {
    console.error("AI yapılandırılmış çıktı üretme hatası:", error);
    throw error;
  }
};

export const startChat = async () => {
  try {
    const chat = model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
    return chat;
  } catch (error) {
    console.error("AI sohbet başlatma hatası:", error);
    throw error;
  }
}; 