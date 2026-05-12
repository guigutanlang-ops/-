
import { GameState, GameEvent, ClanMember, Region, Inventory } from '../types';
import { STATIC_EVENTS, createTravelEvent } from '../data/events/staticEvents';
import { generateMissionOutcomeEvent } from '../data/events/missionEvents';
import { ALL_ITEM_DETAILS } from '../constants';

export class EventController {
    /**
     * 根据当前状态筛选可触发的事件
     */
    static generateNextEvent(state: GameState): GameEvent {
        // 1. 优先处理队列中的强制剧情
        if (state.eventQueue.length > 0) {
            const forcedId = state.eventQueue[0];
            const event = STATIC_EVENTS.find(e => e.id === forcedId);
            if (event) return { ...event };
        }

        // 2. 筛选满足条件的随机事件
        const pool = STATIC_EVENTS.filter(e => {
            if (!e.requirements) return true;
            const { minYear, minMerit, requiredFlags, forbiddenFlags, minSpiritStones } = e.requirements;
            
            if (minYear && state.year < minYear) return false;
            if (minMerit && state.merit < minMerit) return false;
            if (minSpiritStones && state.spiritStones < minSpiritStones) return false;
            
            if (requiredFlags && requiredFlags.some(f => !state.flags[f])) return false;
            if (forbiddenFlags && forbiddenFlags.some(f => state.flags[f])) return false;
            
            return true;
        });

        const randomIndex = Math.floor(Math.random() * pool.length);
        const event = { ...pool[randomIndex] };
        event.impact = { ...event.impact, eventType: 'standard' };
        return event;
    }

    static generateTravelEvent(member: ClanMember): GameEvent {
        return createTravelEvent(member);
    }

    /**
     * 生成派遣任务的结果事件
     */
    static generateMissionResult(member: ClanMember, region: Region, year: number): GameEvent {
        return generateMissionOutcomeEvent(member, region, year);
    }

    /**
     * 处理选择，更新长期影响
     */
    static processEventChoice(state: GameState, event: GameEvent, choiceKey: 'choiceA' | 'choiceB'): Partial<GameState> {
        const choice = event[choiceKey];
        const impact = event.impact;
        const currentYear = state.year;
        
        let newFlags = { ...state.flags };
        let newQueue = [...state.eventQueue];

        // 弹出已处理的剧情
        if (newQueue.length > 0 && newQueue[0] === event.id) {
            newQueue.shift();
        }

        // 应用选项标记
        if (choice.flagsSet) {
            newFlags = { ...newFlags, ...choice.flagsSet };
        }

        // 压入后续剧情
        if (choice.nextEventId) {
            newQueue.push(choice.nextEventId);
        }

        // 处理领地变更与解锁逻辑
        let newRegions = [...state.regions];

        // 1. 处理好感度/占领导致的直接变更
        if (impact.regionId && impact.newOwner) {
            newRegions = newRegions.map(r => 
                r.id === impact.regionId 
                ? { ...r, owner: impact.newOwner!, occupancyStatus: 'secured', isDiscovered: true } 
                : r
            );
        }

        // 2. 核心修复：处理标志位带来的区域解锁 (将特定 flag 映射到 Region ID)
        const regionUnlockMap: Record<string, string> = {
            "revealed_ziyun": "mystic_cave_01",
            "revealed_wei": "wei_clan_valley",
            "revealed_beihan": "beihan_sect_main"
        };

        if (choice.flagsSet || impact.flagsSet) {
            const combinedFlags = { ...(choice.flagsSet || {}), ...(impact.flagsSet || {}) };
            Object.keys(combinedFlags).forEach(flag => {
                const targetRegionId = regionUnlockMap[flag];
                if (targetRegionId) {
                    newRegions = newRegions.map(r => 
                        r.id === targetRegionId ? { ...r, isDiscovered: true } : r
                    );
                }
                
                // Handle Mystic region destruction
                if (flag.startsWith('destroyed_')) {
                    const destroyedRegionId = flag.replace('destroyed_', '');
                    newRegions = newRegions.filter(r => r.id !== destroyedRegionId);
                }
                
                // Handle one-time exploration exhaustion (Deprecated in favor of specific category logic, but keeping for compatibility)
                if (flag.startsWith('explored_')) {
                    const exploredRegionId = flag.replace('explored_', '');
                    newRegions = newRegions.map(r => 
                        r.id === exploredRegionId ? { ...r, production: undefined } : r
                    );
                }
            });
        }

        // 统一处理好感度变更
        let newReputation = { ...state.factionReputation };
        if (impact.reputationChange) {
            Object.entries(impact.reputationChange).forEach(([faction, val]) => {
                newReputation[faction] = (newReputation[faction] || 0) + val;
            });
        }

        // 处理掉落物品
        let newInventory = { ...state.inventory };
        let newMembers = [...state.members];

        if (impact.items) {
            const isOccupyOrAttack = event.title.includes('占领') || event.title.includes('攻克') || event.title.includes('开疆拓土');
            const targetMemberId = impact.memberId;
            const targetMember = newMembers.find(m => m.id === targetMemberId);

            Object.entries(impact.items).forEach(([idStr, qty]) => {
                const id = parseInt(idStr);
                const detail = ALL_ITEM_DETAILS[id];
                if (detail) {
                    const cat = (detail as any).category;
                    const catKey = cat === 'herb' ? 'herbs' :
                                   cat === 'mineral' ? 'minerals' :
                                   cat === 'pill' ? 'pills' :
                                   cat === 'weapon' ? 'weapons' :
                                   cat === 'method' ? 'methods' : 
                                   cat === 'paper' ? 'paper' : 'scrolls';
                    
                    if (catKey === 'scrolls' && typeof newInventory.scrolls === 'number') return;
                    if (catKey === 'paper') {
                        // Special handling for number type
                        if (isOccupyOrAttack || !targetMember) {
                            newInventory.paper += qty;
                        } else {
                            newMembers = newMembers.map(m => m.id === targetMemberId ? { ...m, personalInventory: { ...m.personalInventory, paper: m.personalInventory.paper + qty } } : m);
                        }
                        return;
                    }

                    const typedCat = catKey as 'herbs' | 'minerals' | 'pills' | 'weapons' | 'methods' | 'scrolls';

                    // Decision logic: Occupy/Attack -> Clan, Others -> Member
                    if (isOccupyOrAttack || !targetMember) {
                        // To Clan
                        const clanCat = { ...(newInventory[typedCat] as Record<number, number>) };
                        clanCat[id] = (clanCat[id] || 0) + qty;
                        (newInventory as any)[typedCat] = clanCat;
                    } else {
                        // To Member
                        newMembers = newMembers.map(m => {
                            if (m.id !== targetMemberId) return m;
                            const memberCat = { ...(m.personalInventory[typedCat] as Record<number, number>) };
                            memberCat[id] = (memberCat[id] || 0) + qty;
                            return {
                                ...m,
                                personalInventory: {
                                    ...m.personalInventory,
                                    [typedCat]: memberCat
                                }
                            };
                        });
                    }
                }
            });
        }

        const updates: Partial<GameState> = {
            spiritStones: state.spiritStones + (impact.spiritStones || 0),
            merit: state.merit + (impact.merit || 0),
            luck: state.luck + (impact.luck || 0),
            flags: newFlags,
            eventQueue: newQueue,
            regions: newRegions,
            factionReputation: newReputation,
            inventory: newInventory,
            members: newMembers,
            logs: [
                impact.log || `【${currentYear}载·因果】已作出决策：${event.title}`,
                ...state.logs
            ].slice(0, 30)
        };

        // 处理任务结算后的状态归还
        if (impact.eventType === 'mission' && impact.memberId) {
             updates.members = state.members.map(m => 
                m.id === impact.memberId ? { ...m, assignment: 'Cultivation' } : m
            );
        }

        // 处理游历
        if (impact.eventType === 'travel' && impact.memberId) {
            if (choiceKey === 'choiceA') {
                updates.members = state.members.map(m => 
                    m.id === impact.memberId ? { ...m, assignment: 'Travel' } : m
                );
            }
        }

        return updates;
    }
}
