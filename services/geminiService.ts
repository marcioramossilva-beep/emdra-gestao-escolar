import { GoogleGenAI } from "@google/genai";
import { Occurrence } from "../types";

export const getGeminiInsights = async (occurrences: Occurrence[]) => {
  // O process.env.API_KEY é injetado pelo Vite conforme definido no vite.config.ts
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return "Aguardando configuração da chave de IA para gerar insights.";
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const dataSummary = occurrences.slice(0, 10).map(o => ({
    tipo: o.type,
    motivo: o.reason,
    data: o.date
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `Você é um consultor pedagógico sênior. Analise estes dados de ocorrências e dê uma sugestão estratégica de 2 linhas: ${JSON.stringify(dataSummary)}`
        }]
      }],
    });
    return response.text || "Dados analisados. Continue o bom trabalho na gestão escolar.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "O sistema está pronto para analisar seus dados disciplinares.";
  }
};
