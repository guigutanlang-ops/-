
import { GameEvent, ClanMember } from '../../types';

export const STATIC_EVENTS: GameEvent[] = [
    {
        id: "std_harvest",
        title: "灵谷丰收",
        content: "今年望月湖畔风调雨顺，灵气浓郁，族中经营的灵田迎来了前所未有的大丰收。",
        choiceA: { text: "扩大开垦", effect: "功德-10，预期未来收益增加", flagsSet: { "expanded_fields": true } },
        choiceB: { text: "打赏族人", effect: "灵石-200，家族气运+5", flagsSet: { "clan_loyalty_boost": true } },
        impact: { 
            spiritStones: 500, 
            merit: 10, 
            luck: 2, 
            items: { 1300: 20 }, // 奖励 20 份灵谷草
            log: "【岁时】灵谷丰产，家族喜获物资。" 
        }
    },
    {
        id: "std_rogue_cultivator",
        title: "散修求见",
        content: "一名衣衫褴褛但双目有神的散修在李家大门外长跪不起，自称手中有一卷上古残页，愿以此换取一颗凝气丹疗伤。",
        choiceA: { 
            text: "施丹赠药", 
            effect: "凝气丹-1，获得对方馈赠", 
            flagsSet: { "helped_rogue": true } 
        },
        choiceB: { text: "闭门不见", effect: "无事发生" },
        impact: { 
            merit: 5, 
            luck: -1, 
            items: { 1402: 1 }, // 奖励 1 块玄金石
            log: "【因果】施恩散修，获赠一块不知名的玄金石。" 
        }
    },
    {
        id: "plot_rogue_return",
        title: "旧人重逢",
        content: "多年前受过李家恩惠的那名散修如今已突破筑基，特意归来报恩，并呈上一柄其偶然所得的神兵利器。",
        requirements: { requiredFlags: ["helped_rogue"] },
        choiceA: { text: "笑纳厚礼", effect: "解锁：紫云洞府，获得紫薇软剑", flagsSet: { "revealed_ziyun": true } },
        choiceB: { text: "婉言谢绝", effect: "气运+10" },
        impact: { 
            merit: 20, 
            luck: 10, 
            items: { 1106: 1 }, // 奖励紫薇软剑
            log: "【因果】昔日善果成真，不仅得闻洞府消息，更获赠名剑紫薇。" 
        }
    }
];

export const createTravelEvent = (member: ClanMember): GameEvent => {
    return {
        id: `travel_${member.id}_${Date.now()}`,
        title: "游历机缘",
        content: `族中修士【${member.name}】感道心通明，察觉天地灵气律动，欲下山游历大川。`,
        choiceA: { text: "准许下山", effect: "进入游历状态", flagsSet: { [`traveling_${member.id}`]: true } },
        choiceB: { text: "留在族中", effect: "安稳修行" },
        impact: {
            eventType: 'travel',
            memberId: member.id,
            log: `【因果】关于${member.name}是否游历的决策已下达。`
        }
    };
};
