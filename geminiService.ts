
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
3. SCORING VARIANCE: 
   - DO NOT default to 3/4 or 6/8. Use the FULL range.
   - 4/4 or 8/8 : Exceptional, novel, deep insight. Rare.
   - 3/4 or 6/8 : Very good, solid, but standard.
   - 2/4 or 4/8 : Satisfactory, meets basic requirements but lacks depth.
   - 0-1/4 or 0-2/8 : Poor, missing sections, or significant misunderstandings.
   - The TOTAL score must NEVER be 100% (perfect).
   - IT IS FORBIDDEN to give full marks in EVERY category simultaneously. At least one category MUST receive less than full marks to ensure the total is not perfect.
   - However, individual categories (especially "Adherence to Instructions") SHOULD receive full marks if deserved, provided the rule above is met.

4. DETAILED FEEDBACK: Feedback must be personal, encouraging, and specific. 
   - LENGTH: MAXIMUM 100 WORDS. value conciseness.
   - STRUCTURE: Separate paragraphs with a single empty line. Do not use multiple empty lines.
   - Paragraph 1: Acknowledge the work and praise a specific strength or insight (using the student's own words or concepts).
   - Paragraph 2: Discuss a key framework or theory they applied correctly (e.g., "Your use of Rogers’ Diffusion of Innovation...").
   - Paragraph 3: Explain what can be improved to get full marks.
   - STYLE: Professional yet warm. Concise. Use the sample below as a guide for tone and length.

   SAMPLE FEEDBACK:
   "Dear Adam,
   
   Thanks for your submission. Your use of Rogers’ Diffusion of Innovation and the TOE framework provides a robust academic foundation that makes your analysis of mobile phones highly persuasive.
   
   I particularly liked how you mapped the transition of AI from a 'decision support' tool to a 'platform ecosystem' for a sports investment firm, mirroring the mobile phone’s own evolution. The explicit link between 'innovation attributes' and your three-stage roadmap is exactly the kind of synthesis we look for. This is a masterclass in applying theory to a specific organizational context.
   
   Sincerely,
   Agustin Rubini"

5. FORMAT:
   - Start with "Dear <Student name>," on its own line.
   - End with:
     "Kind regards,
     Agustin Rubini"
     (Ensure "Agustin Rubini" is on the line below "Kind regards,")

RUBRICS CONTEXT:
${JSON.stringify(MODULES_RUBRICS, null, 2)}

OUTPUT FORMAT:
Return valid JSON matching the EvaluationResult interface.
`;

export const evaluateAssignment = async (content: string, fileName: string, apiKey: string, suggestedName?: string): Promise<EvaluationResult> => {
  if (!content || content.trim().length === 0) {
    throw new Error("Assignment content is empty.");
  }

  const processedContent = content.length > MAX_CHAR_LIMIT
    ? content.substring(0, MAX_CHAR_LIMIT) + "... [Content truncated for processing]"
    : content;

  if (!apiKey) {
    throw new Error("API Key is missing. Please enter it in the settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const contextPrompt = `
Contextual Information:
- File Name: ${fileName}
- Possible Student Name: ${suggestedName || "Unknown"}

Evaluate this assignment text:\n\n${processedContent}
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
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

    const result = JSON.parse(response.text.trim()) as EvaluationResult;

    // Post-process the feedback to ensure strict formatting
    if (result.feedback) {
      // 1. Ensure maximum of one empty line between paragraphs (replace 3+ newlines with 2)
      result.feedback = result.feedback.replace(/(\r\n|\n|\r){3,}/g, '\n\n');

      // 2. Ensure signature format "Kind regards,\nAgustin Rubini"
      // Remove any existing variations of the signature
      const signatureRegex = /(?:Kind regards,|Sincerely,|Best regards,)?\s*[\n\r]*\s*Agustin Rubini\s*$/i;
      result.feedback = result.feedback.replace(signatureRegex, '').trim();

      // Append the correct signature
      result.feedback += "\n\nKind regards,\nAgustin Rubini";
    }

    return result;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("token count")) {
      throw new Error("The assignment text is too large to process.");
    }
    throw error;
  }
};

export const listAvailableModels = async (apiKey: string): Promise<string[]> => {
  if (!apiKey) return [];
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.list();
    const models: string[] = [];
    // Handle async iterable or array response from SDK
    if (Array.isArray(response)) {
      response.forEach((m: any) => models.push(m.name));
    } else if (response && typeof (response as any)[Symbol.asyncIterator] === 'function') {
      for await (const model of response) {
        models.push(model.name);
      }
    } else if ((response as any).models) {
      (response as any).models.forEach((m: any) => models.push(m.name));
    }
    return models;
  } catch (error) {
    console.error("Error listing models:", error);
    throw error;
  }
};
