import { GoogleGenAI, Type } from "@google/genai";
import { DashboardData, ChartConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL = "gemini-2.5-flash";

// Helper to clean CSV string (sometimes LLMs add markdown blocks)
const cleanOutput = (text: string) => {
  return text.replace(/```csv/g, '').replace(/```python/g, '').replace(/```json/g, '').replace(/```/g, '').trim();
};

export const transformCsvData = async (
  csvContent: string, 
  userPrompt: string
): Promise<{ newCsv: string; pythonCode: string }> => {
  
  const prompt = `
    You are a Senior Data Engineer. 
    Input CSV Data:
    ${csvContent.substring(0, 3000)}... (truncated if too long)
    
    User Request: "${userPrompt}"
    
    Task:
    1. Generate Python Pandas code to perform this transformation.
    2. Simulate the execution of this code on the provided CSV data and return the RESULTING CSV content.
    
    Output Format: JSON
    {
      "pythonCode": "The python code string...",
      "resultCsv": "The full CSV string after transformation..."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                pythonCode: { type: Type.STRING },
                resultCsv: { type: Type.STRING }
            }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      newCsv: result.resultCsv || csvContent,
      pythonCode: result.pythonCode || "# No code generated"
    };
  } catch (error) {
    console.error("Gemini Transformation Error:", error);
    throw error;
  }
};

export const chatWithData = async (
    csvContent: string,
    history: { role: string; content: string }[],
    userMessage: string
): Promise<{ answer: string; pythonCode: string }> => {
    
    const context = `
    You are a Data Scientist Assistant.
    Current CSV Data Context:
    ${csvContent.substring(0, 2000)}...

    Task: Answer the user's question about the data.
    Provide a Python Pandas snippet that WOULD solve this query, followed by the plain text answer.
    
    Output Format: JSON
    {
        "answer": "Natural language answer...",
        "pythonCode": "pandas code snippet..."
    }
    `;

    const contents = [
        { role: 'user', parts: [{ text: context }] },
        ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: userMessage }] }
    ];

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        answer: { type: Type.STRING },
                        pythonCode: { type: Type.STRING }
                    }
                }
            }
        });
        
        return JSON.parse(response.text || "{}");
    } catch (error) {
        console.error("Chat Error", error);
        return { answer: "Sorry, I couldn't process that.", pythonCode: "" };
    }
};

export const generateDashboardData = async (csvContent: string): Promise<DashboardData> => {
    const prompt = `
    You are a Data Visualization Expert.
    Analyze the following CSV data and generate a JSON configuration for a dashboard.
    
    CSV Data:
    ${csvContent.substring(0, 3000)}...

    Task:
    1. Create a "mainStats" section with 1 key high-level chart (e.g., total sales over time).
    2. Create a "charts" section with exactly 4 other diverse charts.
    
    CRITICAL REQUIREMENTS:
    - The "type" field for each chart MUST be exactly one of: 'bar', 'pie', 'line', 'radar', 'radial'. (lowercase).
    - Provide actual numeric data in the "value" fields.
    - Ensure "charts" has at least one 'bar', one 'pie', and one 'line' chart if the data supports it.

    Output Schema (JSON):
    DashboardData
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        mainStats: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    dataKey: { type: Type.STRING },
                                    categoryKey: { type: Type.STRING },
                                    data: { 
                                        type: Type.ARRAY,
                                        items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } } }
                                    }
                                }
                            }
                        },
                        charts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    dataKey: { type: Type.STRING },
                                    categoryKey: { type: Type.STRING },
                                    data: { 
                                        type: Type.ARRAY,
                                        items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } } }
                                    }
                                }
                            }
                        }
                    }
                 }
            }
        });

        const result = JSON.parse(response.text || "{}");
        
        // Robust fallback to ensure arrays exist
        return {
            mainStats: Array.isArray(result.mainStats) ? result.mainStats : [],
            charts: Array.isArray(result.charts) ? result.charts : []
        };
    } catch (error) {
        console.error("Dashboard Gen Error", error);
        // Fallback or empty state
        return { mainStats: [], charts: [] };
    }
};