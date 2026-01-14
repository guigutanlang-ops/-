
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, ClanMember } from "../types";

const SEASON_NAMES = ['', '春', '夏', '秋', '冬'];

export async function generateYearlyEvent(state: GameState) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const aliveMembers = state.members.filter(m => m.status === 'healthy');
    const memberSummary = aliveMembers.map(m => `${m.name}(${m.realm}${m.subRealm}层)`).join(', ');
    
    const prompt = `
        你是一个修仙题材的叙事大师，风格参考小说《玄鉴仙族》。
        当前游戏时间：太平历 第${state.year}年 ${SEASON_NAMES[state.season]}季。
        家族背景：望月李氏。
        家族成员：${memberSummary}。
        当前资源：灵石${state.spiritStones}，功德${state.merit}。
        
        请根据当前季节和家族状态，生成本季度发生的一件随机事件。
        春：万物复苏、灵药萌发、新生儿、势力外交。
        夏：烈日炎炎、火系灵气爆发、冲突、邪修出没。
        秋：收获季节、散修集会、洞府开启、境界突破。
        冬：寒冬腊月、资源紧缺、妖兽下山、老祖悟道。
        
        要求返回JSON格式，描述要简洁且富有修仙韵味。
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: '事件名称' },
                        content: { type: Type.STRING, description: '详细的叙事文字' },
                        choiceA: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                effect: { type: Type.STRING }
                            },
                            required: ["text", "effect"]
                        },
                        choiceB: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                effect: { type: Type.STRING }
                            },
                            required: ["text", "effect"]
                        },
                        impact: {
                            type: Type.OBJECT,
                            properties: {
                                spiritStones: { type: Type.NUMBER },
                                merit: { type: Type.NUMBER },
                                luck: { type: Type.NUMBER },
                                log: { type: Type.STRING }
                            },
                            required: ["spiritStones", "merit", "luck", "log"]
                        }
                    },
                    required: ["title", "content", "choiceA", "choiceB", "impact"]
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Gemini Error:", error);
        return null;
    }
}

export async function consultHaotianMirror(state: GameState, query: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        你是昊天镜的镜灵。玩家作为李氏老祖正在向你请教。
        当前家族处境：${JSON.stringify(state.members)}。
        玩家提问：${query}。
        
        请以高深莫测、看透因果的语气回答，给出战略性的建议或揭示一段未来的碎片。
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        return "镜面模糊，似有天机遮掩...";
    }
}