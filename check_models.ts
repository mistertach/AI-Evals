
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config'; // Load environment variables

async function listModels() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await ai.models.list();
        // The SDK might return an async iterator or a response object depending on version
        // Let's inspect what we get
        console.log("Models:");
        for await (const model of response) {
            console.log(`- ${model.name}`);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
