
import { GameEvent, ClanMember, Region } from '../../types';
import { REALM_ORDER, ALL_ITEM_DETAILS } from '../../constants';

/**
 * 任务结果生成器策略映射
 * 键名为任务类型，值为生成 GameEvent 的函数
 */
const MISSION_STRATEGIES: Record<string, (member: ClanMember, region: Region, year: number) => GameEvent> = {
    // 外交逻辑
    'Diplomacy': (member, region, year) => {
        const id = `mission_dip_${member.id}_${region.id}_${Date.now()}`;
        return {
            id,
            title: `外交：拜访${region.owner}`,
            content: `${member.name} 备齐厚礼，登门拜访了 ${region.owner}。作为回礼，对方赠予李家一些家族特产。`,
            choiceA: { text: "宾主尽欢", effect: "获得：补气丸 x2，好感度提升" },
            choiceB: { text: "以此互励", effect: "获得：少量功德" },
            impact: { 
                eventType: 'mission',
                memberId: member.id,
                regionId: region.id,
                reputationChange: { [region.owner]: 15 },
                merit: 5,
                items: { 1201: 2 }, // 奖励 2 颗补气丸
                log: `【${year}载】${member.name} 完成外交使命，带回补气丸作为回礼。`
            }
        };
    },

    // 商贸逻辑
    'Trade': (member, region, year) => {
        const id = `mission_trd_${member.id}_${region.id}_${Date.now()}`;
        return {
            id,
            title: `商贸：与${region.owner}通商`,
            content: `${member.name} 统领商队与 ${region.owner} 完成了一笔物资置换。在望月湖畔的交易中，李家换得了一批珍贵的精炼矿石。`,
            choiceA: { text: "满载而归", effect: "获得：灵石 x800、赤铜精 x5" },
            choiceB: { text: "拓展渠道", effect: "获得：灵石收益增加" },
            impact: { 
                eventType: 'mission',
                memberId: member.id,
                regionId: region.id,
                spiritStones: 800,
                items: { 1401: 5 }, // 奖励 5 份赤铜精
                log: `【${year}载】商道大开，家族获灵石八百，赤铜精五份。`
            }
        };
    },

    // 战争/占领逻辑 (由于两者内核相似，共用计算逻辑但文案区分)
    'War': (member, region, year) => generateCombatOutcome(member, region, year, true),
    'Occupy': (member, region, year) => generateCombatOutcome(member, region, year, false),

    // 探索逻辑
    'Explore': (member, region, year) => {
        const id = `mission_exp_${member.id}_${region.id}_${Date.now()}`;
        const luckRoll = Math.random();
        
        // 动态根据资源点产出决定物品
        let rewardedItems: Record<number, number> = {};
        const possibleItems = region.production?.items;
        
        if (possibleItems && Object.keys(possibleItems).length > 0) {
            // 随机挑选该地区产出的一种或多种物品
            const itemIds = Object.keys(possibleItems).map(Number);
            const count = luckRoll > 0.8 ? 2 : 1; // 运气好可能发现两种
            
            for (let i = 0; i < count; i++) {
                const randomId = itemIds[Math.floor(Math.random() * itemIds.length)];
                const baseQty = possibleItems[randomId] || 1;
                // 探索所得通常为产出的一半到两倍不等
                const qty = Math.max(1, Math.round(baseQty * (0.5 + Math.random())));
                rewardedItems[randomId] = (rewardedItems[randomId] || 0) + qty;
            }
        } else {
            // 兜底：如果没定义产出，则给一些基础灵草
            rewardedItems = luckRoll > 0.7 ? { 1301: 3 } : { 1300: 5 };
        }

        const itemNameDesc = Object.keys(rewardedItems).length > 0 ? "了一些天材地宝" : "了一些寻常草药";

        // 构建具体的奖励描述字符串
        const itemNamesString = Object.entries(rewardedItems)
            .map(([id, qty]) => {
                const detail = (ALL_ITEM_DETAILS as any)[id];
                return `${detail?.name || '未知灵材'} x${qty}`;
            })
            .join('、');

        return {
            id,
            title: `探索：${region.name}见闻`,
            content: `${member.name} 在 ${region.name} 深处探寻多日。${luckRoll > 0.6 ? `运气颇佳，在一处隐秘角落发现了${itemNameDesc}。` : "虽无惊世发现，但也采集到了一些灵材。" }`,
            choiceA: { 
                text: "悉数收入", 
                effect: `获得：${itemNamesString || '少量灵石'}` 
            },
            choiceB: { 
                text: "道法自然", 
                effect: "放弃物资，磨炼心境，气运增加" 
            },
            impact: { 
                eventType: 'mission',
                memberId: member.id,
                regionId: region.id,
                spiritStones: Math.floor(luckRoll * 300) + 100,
                merit: 15,
                luck: luckRoll > 0.8 ? 5 : 1,
                items: rewardedItems,
                log: `【${year}载】${member.name} 探索 ${region.name} 归来，带回了 ${itemNamesString}。`
            }
        };
    },

    // 驻守逻辑 (兜底策略)
    'Guard': (member, region, year) => {
        const id = `mission_grd_${member.id}_${region.id}_${Date.now()}`;
        return {
            id,
            title: `驻守：${region.name}平安`,
            content: `${member.name} 坐镇 ${region.name}，期间并无宵小胆敢作乱。`,
            choiceA: { text: "守土有功", effect: "获得：少量功德" },
            choiceB: { text: "家族支柱", effect: "获得：家族威望" },
            impact: { 
                eventType: 'mission',
                memberId: member.id,
                regionId: region.id,
                merit: 5,
                log: `【${year}载】${member.name} 顺利完成驻守交接。`
            }
        };
    }
};

/**
 * 内部辅助函数：处理战斗/占领的胜负计算
 */
function generateCombatOutcome(member: ClanMember, region: Region, year: number, isWar: boolean): GameEvent {
    const id = `mission_war_${member.id}_${region.id}_${Date.now()}`;
    const winProb = 0.5 + (REALM_ORDER.indexOf(member.realm) * 0.1) - (region.difficulty * 0.02);
    const isWin = Math.random() < winProb;

    if (isWin) {
        // 构建战利品描述
        const winItems = region.production?.items || { 1402: 3, 1202: 5 };
        const winItemsString = Object.entries(winItems)
            .map(([id, qty]) => {
                const detail = (ALL_ITEM_DETAILS as any)[id];
                return `${detail?.name || '战利品'} x${qty}`;
            })
            .join('、');

        return {
            id,
            title: isWar ? `捷报：攻克${region.name}` : `占领：入主${region.name}`,
            content: `${member.name} 杀伐果断，攻克了 ${region.name}。从对方仓库中缴获了一批物资与镇家灵药。`,
            choiceA: { text: "立碑明誓", effect: `占领该地，获得：${winItemsString}` },
            choiceB: { text: "安抚人心", effect: "占领该地，获得：额外功德" },
            impact: { 
                eventType: 'mission',
                memberId: member.id,
                regionId: region.id,
                newOwner: '望月李氏',
                reputationChange: (region.owner !== '无' && region.owner !== '望月李氏') ? { [region.owner]: -50 } : {},
                merit: 10,
                items: winItems, 
                log: `【${year}载】捷报传来，${region.name} 归附，并缴获了 ${winItemsString}。`
            }
        };
    } else {
        return {
            id,
            title: `急报：${region.name}之行受阻`,
            content: `${member.name} 在 ${region.name} 遭遇了抵抗，行动最终失败。`,
            choiceA: { text: "撤回待机", effect: "人员受损撤回" },
            choiceB: { text: "心有不甘", effect: "全员暂退" },
            impact: { 
                eventType: 'mission',
                memberId: member.id,
                regionId: region.id,
                log: `【${year}载】功败垂成，${member.name} 已撤回修整。`
            }
        };
    }
}

/**
 * 统一出口：根据任务类型分发至对应的生成器
 */
export const generateMissionOutcomeEvent = (member: ClanMember, region: Region, year: number): GameEvent => {
    const type = region.activeMission?.type || 'Guard';
    
    // 从策略映射中获取生成器，如果未匹配则使用 Guard
    const generator = MISSION_STRATEGIES[type] || MISSION_STRATEGIES['Guard'];
    
    return generator(member, region, year);
};
