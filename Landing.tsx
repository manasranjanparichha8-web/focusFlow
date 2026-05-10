import { GoogleGenAI, Type } from "@google/genai";
import { FeedbackResponse, TaskType, PracticeQuestion, PracticeResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are FocusFlow AI, a productivity coach for students. 
Your goal is to analyze a student's study activity and determine if it's meaningful learning or passive activity.
Passive activity example: just watching a long lecture without notes or practice.
Meaningful example: solving problems, active recall, summarized reading.

Provide feedback in JSON format including:
- isMeaningful: boolean
- score: 0-100 (engagement/efficiency score)
- message: concise encouragement or advice
- recommendations: 2-3 specific actions to make the session more effective
`;

export async function analyzeActivity(
  taskTitle: string,
  type: TaskType,
  description: string,
  url?: string
): Promise<FeedbackResponse> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Task: ${taskTitle}
        Type: ${type}
        Context: ${description}
        URL: ${url || 'N/A'}
      `,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMeaningful: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER },
            message: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["isMeaningful", "score", "message", "recommendations"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as FeedbackResponse;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      isMeaningful: true,
      score: 70,
      message: "Keep going! You're doing great.",
      recommendations: ["Take short breaks", "Try to summarize what you learned"]
    };
  }
}

export async function generatePracticeQuestions(topic: string, count: number = 3): Promise<PracticeQuestion[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Topic: ${topic}. 
      First, determine if "${topic}" is a valid educational or academic topic. 
      If it is meaningless, gibberish, or completely unrelated to learning/knowledge, return an empty array [].
      If it is valid, generate EXACTLY ${count} multiple choice questions. 
      Do not return fewer than ${count} questions.
      Include a mix of theory and application if possible.`,
      config: {
        systemInstruction: `You are a teacher. 
        1. VALIDATE: If the topic is gibberish or non-educational, return [].
        2. GENERATE: Respond ONLY with a valid JSON array of EXACTLY ${count} objects if valid. 
        Each object MUST have: 'question' (string), 'options' (array of exactly 4 strings), and 'correctAnswer' (string, matching one of the options).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      }
    });
    const data = JSON.parse(response.text || "[]");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error generating questions:", error);
    return [];
  }
}

export async function gradePracticeSession(
  topic: string,
  answers: { question: string, userAnswer: string, isCorrect: boolean, correctAnswer?: string }[]
): Promise<PracticeResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Subject/Topic: ${topic}
        Student's Performance Data: ${JSON.stringify(answers)}
        
        Analyze these answers carefully.
      `,
      config: {
        systemInstruction: `
          You are a professional tutor. 
          Analyze the student's quiz results for the topic: ${topic}.
          1. Calculate a score from 0-100.
          2. List 2-3 specific "strengths" shown.
          3. List 2-3 specific "weaknesses" or areas for improvement.
          4. Return the results as JSON.
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            totalQuestions: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            answers: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  userAnswer: { type: Type.STRING },
                  isCorrect: { type: Type.BOOLEAN },
                  correctAnswer: { type: Type.STRING }
                },
                required: ["question", "userAnswer", "isCorrect", "correctAnswer"]
              } 
            }
          },
          required: ["score", "totalQuestions", "strengths", "weaknesses", "answers"]
        }
      }
    });
    const result = JSON.parse(response.text || "{}");
    return {
      ...result,
      // Ensure answers from input are preserved if AI misses any details
      answers: result.answers || answers
    } as PracticeResult;
  } catch (error) {
    console.error("Error grading session:", error);
    return {
      score: answers.filter(a => a.isCorrect).length * (100 / answers.length),
      totalQuestions: answers.length,
      strengths: ["Completed the practice session"],
      weaknesses: ["AI analysis unvailable, please review individual answers"],
      answers: answers
    };
  }
}

export async function generateSessionSummary(tasks: any[]): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the following study sessions for the user: ${JSON.stringify(tasks)}`,
      config: {
        systemInstruction: "Provide a motivational and concise daily summary in markdown."
      }
    });
    return response.text || "No summary available.";
  } catch (error) {
    return "Great effort today! Keep sticking to your goals.";
  }
}
