import { GoogleGenAI, Type } from "@google/genai";
import { AggregatedStats } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeAttendance = async (stats: AggregatedStats[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "无法连接到 AI 服务，请检查 API Key。";

  if (stats.length === 0) return "暂无数据可分析。";

  // Convert stats to a lightweight readable format for the LLM
  const dataSummary = stats.map(s => ({
    name: s.studentName,
    team: s.teamNumber,
    hours: (s.totalDurationMs / (1000 * 60 * 60)).toFixed(2)
  }));

  const prompt = `
    你是一位负责管理学生考勤的老师助手。请根据以下的学生打卡数据（姓名、队号、总时长-小时）生成一份中文周报简评。
    
    数据:
    ${JSON.stringify(dataSummary, null, 2)}

    请包含以下内容：
    1. 表现最积极的团队或个人。
    2. 时长明显不足的学生（假设每周目标是 5 小时）。
    3. 给老师的简短管理建议。
    
    保持语气专业、鼓励性。不要使用 Markdown 格式，直接分段纯文本输出即可。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "无法生成分析报告。";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "分析服务暂时不可用，请稍后再试。";
  }
};

export const generateStudentQuote = async (studentName: string, durationMs: number): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "今天辛苦了！";

  const hours = (durationMs / (1000 * 60 * 60)).toFixed(1);

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `写一句简短的鼓励语给学生 ${studentName}，他刚刚完成了 ${hours} 小时的学习任务。语气轻松幽默，50字以内。中文。`,
    });
    return response.text || "继续加油！";
  } catch (e) {
      return "继续加油！";
  }
}
