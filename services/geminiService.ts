import { GoogleGenAI } from "@google/genai";

/**
 * Helper to interact with Gemini API following the @google/genai guidelines.
 */
export const getGeminiResponse = async (userMessage: string): Promise<string> => {
  // Initialize GoogleGenAI with named parameter using process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Use ai.models.generateContent directly with recommended model name
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction: `You are a helpful assistant for the Toolazon PDF tools website. 
        Your goal is to help users find the right PDF tool for their needs or explain how to use specific PDF features.
        Be concise, friendly, and guide them to the specific tools mentioned in the context if possible.
        The available tools categories are: Merge, Split, Edit & Sign, Compress, Security, Convert.
        If a user asks how to do something, explain the steps briefly and mention which tool to use.`,
      }
    });

    // Access response.text as a property directly
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error while processing your request. Please try again later.";
  }
};