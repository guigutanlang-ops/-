
import { GoogleGenAI } from "@google/genai";
import { GameState } from "../types";

export class GeminiService {
  private static ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

  static async generateYearlyOracle(state: GameState): Promise<string | null> {
    if (!this.ai) return null;

    const topMember = state.members
      .filter(m => m.family === '望月李氏')
      .sort((a, b) => {
        const realms = ['凡人', '练气', '筑基', '紫府', '金丹', '元婴', '化神'];
        return realms.indexOf(b.realm) - realms.indexOf(a.realm);
      })[0];

    const prompt = `
      你现在是《玄鉴仙族》中的昊天镜。请根据以下李氏家族现状，生成一段老祖视角的“岁时感悟”。
      文风需庄严、古朴、富有修仙氛围，字数约60字。
      
      家族状态：
      - 岁时：${state.year}载
      - 灵石储备：${state.spiritStones}
      - 功德：${state.merit}
      - 家族最强者：${topMember?.name} (${topMember?.realm})
      
      生成的内容应包含对家族未来的期许或对当前局势的玄妙批注。
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.8 }
      });
      return response.text || null;
    } catch (error) {
      console.error("Gemini Oracle Error:", error);
      return null;
    }
  }
}
