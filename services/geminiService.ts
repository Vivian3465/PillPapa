import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { Medicine, Reminder } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

const medicineSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The common brand or generic name of the medicine.' },
    description: { type: Type.STRING, description: 'A brief, one-paragraph summary of what the medicine is used for.' },
    activeIngredients: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'A list of the primary active chemical ingredients.'
    },
    interactions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'A list of substances or other drugs this medicine should not be mixed with.'
    },
    dosage: { type: Type.STRING, description: 'A typical dosage recommendation, e.g., "One tablet twice a day".' }
  },
  required: ['name', 'description', 'activeIngredients', 'interactions', 'dosage']
};

const getMedicineInfoPrompt = "Analyze the provided information and identify the medicine. Provide its name, a brief description, its active chemical ingredients, drugs it should not be mixed with, and a typical dosage frequency. Respond in the requested JSON format.";

export const getMedicineInfoFromImage = async (base64Image: string, mimeType: string): Promise<Omit<Medicine, 'id' | 'imageUrl'>> => {
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };
  const textPart = { text: getMedicineInfoPrompt };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: medicineSchema,
    }
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};

export const getMedicineInfoFromText = async (drugName: string): Promise<Omit<Medicine, 'id' | 'imageUrl'>> => {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: `${getMedicineInfoPrompt} The medicine name is: ${drugName}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: medicineSchema,
    }
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};

let chat: Chat | null = null;
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const buildContextString = (medicines: Medicine[], reminders: Reminder[]): string => {
    let context = "CURRENT MEDICATIONS:\n";
    if (medicines.length === 0) {
        context += "- None\n";
    } else {
        medicines.forEach(med => {
            context += `- ${med.name}: Dosage is "${med.dosage}". Key interactions to avoid: ${med.interactions.join(', ') || 'None specified'}.\n`;
        });
    }

    context += "\nWEEKLY REMINDER SCHEDULE:\n";
    if (reminders.length === 0) {
        context += "- No reminders set.\n";
    } else {
        daysOfWeek.forEach((day, index) => {
            const dayReminders = reminders.filter(r => r.day === index).sort((a,b) => a.time.localeCompare(b.time));
            if (dayReminders.length > 0) {
                context += `${day}:\n`;
                dayReminders.forEach(r => {
                    context += `  - ${r.time}: Take ${r.medicineName}\n`;
                });
            }
        });
    }
    return context;
};


export const startChat = (medicines: Medicine[], reminders: Reminder[]) => {
  const context = buildContextString(medicines, reminders);

  chat = ai.chats.create({
    model: model,
    history: [
      {
        role: "user",
        parts: [{ text: `Here is my current medication and reminder schedule. Use this as context for our conversation:\n\n${context}` }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I have your medication and reminder schedule. How can I help you today?" }],
      }
    ],
    config: {
      systemInstruction: "You are a helpful AI assistant specializing in pharmacology named Pill Papa AI. You have been provided with the user's current list of medications and their weekly reminder schedule in the chat history. Refer to this information to answer questions about their regimen. For instance, if they ask about their schedule for a specific day, use the provided reminder data. Be conversational and helpful. Always advise users to consult their doctor or pharmacist for definitive medical advice.",
    },
  });
};

export const getChatResponse = async (message: string): Promise<string> => {
  if (!chat) {
    throw new Error("Chat not initialized. Call startChat first.");
  }
  const response = await chat.sendMessage({ message });
  return response.text;
};