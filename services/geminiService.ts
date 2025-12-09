import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export const initializeGemini = () => {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
};

export const getGeminiResponse = async (userMessage: string): Promise<string> => {
  if (!ai) {
    initializeGemini();
    if (!ai) {
      return "I'm sorry, I can't connect to the AI service right now. Please check your API key configuration.";
    }
  }

  try {
    const model = ai.models;
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: `You are a helpful assistant for the Toolazon PDF tools website. 
        Your goal is to help users find the right PDF tool for their needs or explain how to use specific PDF features.
        Be concise, friendly, and guide them to the specific tools mentioned in the context if possible.
        The available tools categories are: Merge, Split, Edit & Sign, Compress, Security, Convert.
        If a user asks how to do something, explain the steps briefly and mention which tool to use.`,
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error while processing your request. Please try again later.";
  }
};