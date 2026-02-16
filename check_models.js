
import { GoogleGenAI } from "@google/genai";

async function listModels() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await ai.models.list();
        console.log("Models:");
        // Inspect the response structure. It might be an async iterable or an object with a models property.
        // Based on @google/genai documentation (newer SDK), it returns a promise that resolves to a response object.
        // However, for list(), it's often paginated. The newer SDK might handle it differently.
        // Let's safe-check what "response" is.
        if (response && typeof response[Symbol.asyncIterator] === 'function') {
            for await (const model of response) {
                console.log(`- ${model.name}`);
            }
        } else if (Array.isArray(response)) {
            response.forEach(m => console.log(`- ${m.name}`));
        } else if (response.models) {
            response.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("Unexpected response structure:", response);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
