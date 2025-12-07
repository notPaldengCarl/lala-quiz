import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizData, QuizSettings, FileData } from "../types";

const getApiKey = (): string | undefined => {
  // 1. Try Vite / Modern Frontend Build Tools (import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore
  }

  // 2. Try Node.js / Cloud Environment (process.env)
  try {
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // process is not defined in browser
  }

  return undefined;
};

const parseJsonClean = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    throw new Error("Failed to parse quiz data from AI response.");
  }
};

export const generateQuiz = async (
  text: string,
  files: FileData[],
  settings: QuizSettings
): Promise<QuizData> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API Key is missing. If running locally, create a .env file with VITE_API_KEY=your_key");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are LalaQuiz, an expert educational AI.
    
    Task: Create a study set (Quiz + Summary + Keywords).
    Settings:
    - Questions: ${settings.numberOfQuestions}
    - Difficulty: ${settings.difficulty}
    - Types: ${settings.questionTypes.join(', ')}

    Important Rules:
    1. **True/False**: If a question is 'true_false', the 'options' array MUST be ["True", "False"].
    2. **Accuracy**: Ensure the 'correct_answer' exactly matches one of the 'options'.
    3. **Explanations**: Provide clear, helpful explanations.
    4. **Output**: STRICT JSON format only.

    Schema:
    - questions: Array of objects (id, type, question, options, correct_answer, explanation)
    - summary: String (Concise summary)
    - keywords: Array of Strings (Key terms)
  `;

  const parts: any[] = [{ text: prompt }];

  if (text.trim()) {
    parts.push({ text: `\nSource Text:\n${text}` });
  }

  files.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      metadata: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING },
          number_of_questions: { type: Type.NUMBER },
          difficulty: { type: Type.STRING },
          types: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["source", "number_of_questions", "difficulty", "types"],
      },
      summary: { type: Type.STRING },
      keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ["multiple_choice", "true_false", "identification", "fill_in_blank"] },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
            correct_answer: { type: Type.STRING },
            explanation: { type: Type.STRING, nullable: true },
          },
          required: ["id", "type", "question", "correct_answer"],
        },
      },
    },
    required: ["metadata", "questions", "summary", "keywords"],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Switched to 2.5-flash for better free tier limits
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3, 
      }
    });

    if (!response.text) {
      throw new Error("No response generated.");
    }

    return parseJsonClean(response.text);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    if (error.status === 429 || error.message?.includes('429')) {
         throw new Error("Free tier quota exceeded. Please wait a moment before trying again.");
    }
    throw error;
  }
};