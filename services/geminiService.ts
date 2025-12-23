import { GoogleGenAI } from "@google/genai";
import { LeaveRequest, User } from "../types.ts";

export const generateHRInsights = async (
  requests: LeaveRequest[],
  users: User[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Prepare data summary for the prompt
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const sickLeaves = requests.filter(r => r.type === 'Sick Leave').length;
  
  // Group by dept
  const deptCounts: Record<string, number> = {};
  requests.forEach(r => {
    deptCounts[r.department] = (deptCounts[r.department] || 0) + 1;
  });

  const prompt = `
    You are a world-class HR Strategy Consultant. Analyze this leave data for a high-performance company:
    
    Data Summary:
    - Total Workforce: ${users.length}
    - Total Requests: ${requests.length}
    - Approved: ${approvedCount} | Pending: ${pendingCount}
    - Sick Leaves: ${sickLeaves}
    - Departmental Distribution: ${JSON.stringify(deptCounts)}
    
    Task:
    Provide a professional analysis in 3 bullet points. 
    1. Identify any critical workforce availability risks.
    2. Detect anomalies (e.g., high sick leave in specific depts).
    3. Suggest immediate leadership actions.
    
    Tone: Professional, Data-driven, Insightful. Language: Thai (ภาษาไทย).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text || "ขออภัย ไม่สามารถสร้างบทวิเคราะห์ได้ในขณะนี้";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาลองใหม่ภายหลัง";
  }
};