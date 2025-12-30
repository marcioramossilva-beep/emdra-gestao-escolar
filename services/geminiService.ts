
import { GoogleGenAI } from "@google/genai";
import { Occurrence } from "../types";

// Compliant with @google/genai guidelines: Create a new instance right before making an API call.
export const getGeminiInsights = async (occurrences: Occurrence[]) => {
  // Always use a named parameter and obtain the API key exclusively from process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const dataSummary = occurrences.map(o => ({
    tipo: o.type,
    motivo: o.reason,
    data: o.date
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise brevemente estes dados de ocorrências escolares e dê uma sugestão de 2 linhas para a direção pedagógica melhorar o clima escolar. Dados: ${JSON.stringify(dataSummary)}`,
    });
    // Extracting Text Output: Access the .text property (do not call as a method).
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao gerar insights da IA.";
  }
};
