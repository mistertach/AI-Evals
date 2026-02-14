
import { GoogleGenAI, Type } from "@google/genai";
import { MODULES_RUBRICS } from "./constants";
import { EvaluationResult } from "./types";

const MAX_CHAR_LIMIT = 200000;

const SYSTEM_INSTRUCTION = `
You are an expert academic evaluator for the Oxford Saïd Business School and GetSmarter.
Your task is to evaluate student assignments based on specific rubrics across 6 modules.

CRITICAL RULES:
1. IDENTIFY THE MODULE: Determine which of the 6 modules the assignment belongs to. Look for headers like "MODULE X UNIT Y".
2. EXTRACT STUDENT NAME: Identify the student's name. Use the provided "Possible Student Name" as a hint, but confirm it within the text.
3. NEVER GIVE FULL MARKS: For any rubric category, the maximum score awarded MUST be maxScore minus 1 (or less). Do not award 4/4 or 8/8. 
4. CONCISE FEEDBACK: Feedback must be short, very concise, professional, and academic. Use the sample format provided.
5. FORMAT:
   - Start with "Dear <Student name>,"
   - End with "Kind regards, Agustin Rubini"
6. EVALUATION DEPTH: Base scores on the provided rubrics. 
   - 3/4 or 6/8 means "Very good" but with minor room for improvement.
   - 2/4 or 4/8 means "Satisfactory to good".
   - 0/4 or 0/8 means "Poor or incomplete".

RUBRICS CONTEXT:
${JSON.stringify(MODULES_RUBRICS, null, 2)}

OUTPUT FORMAT:
Return valid JSON matching the EvaluationResult interface.
`;

export const evaluateAssignment = async (content: string, fileName: string, suggestedName?: string): Promise<EvaluationResult> => {
  if (!content || content.trim().length === 0) {
    throw new Error("Assignment content is empty.");
  }

  const processedContent = content.length > MAX_CHAR_LIMIT 
    ? content.substring(0, MAX_CHAR_LIMIT) + "... [Content truncated for processing]"
    : content;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const contextPrompt = `
Contextual Information:
- File Name: ${fileName}
- Possible Student Name: ${suggestedName || "Unknown"}

Evaluate this assignment text:\n\n${processedContent}
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contextPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentName: { type: Type.STRING },
            moduleId: { type: Type.INTEGER },
            scores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  categoryName: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  maxScore: { type: Type.NUMBER }
                },
                required: ["categoryName", "score", "maxScore"]
              }
            },
            totalScore: { type: Type.NUMBER },
            maxPossible: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          },
          required: ["studentName", "moduleId", "scores", "totalScore", "maxPossible", "feedback"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from evaluation engine.");
    }

    return JSON.parse(response.text.trim()) as EvaluationResult;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("token count")) {
      throw new Error("The assignment text is too large to process.");
    }
    throw error;
  }
};
