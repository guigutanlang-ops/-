
import React, { useState, useEffect } from 'react';
import { GameState, ClanMember, Region, Realm, Building, Inventory, GameEvent, TaskType } from './types';
import { INITIAL_MEMBERS, INITIAL_REGIONS, REALM_ORDER, BUILDING_TYPES, ALL_ITEM_DETAILS, RECIPES, CULTIVATION_SLOT_BONUSES, VEIN_LEVELS } from './constants';
import { CLAN_MASTER_REGISTRY } from './data/master_registry';
import { CharacterController } from './services/CharacterController';
import { EventController } from './services/EventController';
import { OracleService } from './services/OracleService'; // 修改：使用 OracleService
import ClanDashboard from './components/MembersPanel/ClanDashboard';
import WorldMap from './components/WorldMap';
import ClanManagement from './components/ClanManagement/ClanManagement';
import BreakthroughModal from './components/Xiulian/BreakthroughModal';
import EventModal from './components/events/EventModal';

const SEASON_NAMES = ['', '春', '夏', '秋', '冬'];

const App: React.FC = () => {
    const [state, setState] = useState<GameState>(() => {
        const initializedMembers = INITIAL_MEMBERS.map(m => ({
            ...m,
            rootGrade: CharacterController.getAutoRootGrade(m.roots)
        })) as ClanMember[];

        return {
            year: 1,
            season: 1,
            spiritStones: CLAN_MASTER_REGISTRY.spiritStones,
            merit: CLAN_MASTER_REGISTRY.merit,
            luck: CLAN_MASTER_REGISTRY.luck,
            members: initializedMembers,
            regions: INITIAL_REGIONS,
            buildings: [],
            inventory: CLAN_MASTER_REGISTRY.inventory,
            currentRegionId: '',
            logs: ["太平历初，望月李氏在此立基。"],
            heritagePool: CLAN_MASTER_REGISTRY.heritagePool,
            unlockedPositions: ['家主', '弟子'],
            flags: {},
            eventQueue: [],
            factionReputation: { '魏家': 50, '邵家': 50, '北寒宗': 50 } 
        };
    });

    const [pendingEvents, setPendingEvents] = useState<GameEvent[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDashboardVisible, setIsDashboardVisible] = useState(true);
    const [isManagementVisible, setIsManagementVisible] = useState(false);
    const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
    const [breakingMemberId, setBreakingMemberId] = useState<string | null>(null);

    // 修改：本地老祖谕令系统
    useEffect(() => {
        if (state.season === 1) {
            const oracle = OracleService.getYearlyOracle(state);
            setState(prev => ({
                ...prev,
                logs: [`【昊天镜】老祖谕令：${oracle}`, ...prev.logs].slice(0, 40)
            }));
        }
    }, [state.year]);

    const handleUpdateMember = (id: string, updates: Partial<ClanMember>) => {
        setState(prev => {
            const member = prev.members.find(m => m.id === id);
            if (!member) return prev;
            const { updatedMember, logs } = CharacterController.updateMember(member, updates, prev.year);
            let updatedMembers = prev.members.map(m => m.id === id ? updatedMember : m);
            if (updates.position === '家主') {
                updatedMembers = updatedMembers.map(m => 
                    (m.position === '家主' && m.id !== id) ? { ...m, position: '弟子' } : m
                );
            }
            return {
                ...prev,
                members: updatedMembers,
                logs: logs.length > 0 ? [...logs, ...prev.logs].slice(0, 30) : prev.logs
            };
        });
    };

    const handleUpdateInventory = (updates: Partial<Inventory>) => {
        setState(prev => ({
            ...prev,
            inventory: { ...prev.inventory, ...updates }
        }));
    };

    const handleAssignItem = (memberId: string, itemId: number, category: string, quantity: number) => {
        setState(prev => {
            const member = prev.members.find(m => m.id === memberId);
            const itemDetail = ALL_ITEM_DETAILS[itemId] as any;
            const catKey = category as keyof Inventory;
            
            if (!member || !itemDetail || (prev.inventory[catKey] as any)[itemId] < quantity) return prev;

            const newClanInventory = { ...prev.inventory };
            (newClanInventory[catKey] as any)[itemId] -= quantity;
            if ((newClanInventory[catKey] as any)[itemId] === 0) delete (newClanInventory[catKey] as any)[itemId];

            const newMemberInventory = { ...member.personalInventory };
            (newMemberInventory[catKey] as any)[itemId] = ((newMemberInventory[catKey] as any)[itemId] || 0) + quantity;

            const updatedMembers = prev.members.map(m => 
                m.id === memberId ? { ...m, personalInventory: newMemberInventory } : m
            );

            return {
                ...prev,
                inventory: newClanInventory,
                members: updatedMembers,
                logs: [`【分配】家族将 ${itemDetail.name} x${quantity} 分配给了 ${member.name}。`, ...prev.logs].slice(0, 30)
            };
        });
    };

    const handleContributeItem = (memberId: string, itemId: number, category: string, quantity: number) => {
        setState(prev => {
            const member = prev.members.find(m => m.id === memberId);
            if (!member) return prev;
            
            const catKey = category as keyof Inventory;
            const currentQty = (member.personalInventory[catKey] as any)[itemId] || 0;
            if (currentQty < quantity) return prev;

            const newMemberInventory = { ...member.personalInventory };
            (newMemberInventory[catKey] as any)[itemId] -= quantity;
            if ((newMemberInventory[catKey] as any)[itemId] <= 0) {
                delete (newMemberInventory[catKey] as any)[itemId];
            }

            const newClanInventory = { ...prev.inventory };
            if (catKey !== 'paper') {
                (newClanInventory[catKey] as any)[itemId] = ((newClanInventory[catKey] as any)[itemId] || 0) + quantity;
            }

            const itemDetail = ALL_ITEM_DETAILS[itemId] as any;

            return {
                ...prev,
                inventory: newClanInventory,
                members: prev.members.map(m => m.id === memberId ? { ...m, personalInventory: newMemberInventory } : m),
                logs: [`【上交】${member.name} 将 ${itemDetail?.name || '物品'} x${quantity} 上交给家族。`, ...prev.logs].slice(0, 30)
            };
        });
    };

    const handleNextTurn = async () => {
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            let turnLogs: string[] = [];
            let newEvents: GameEvent[] = [];
            let finalInventory = { ...state.inventory };
            
            const currentYear = state.year;
            const currentSeason = state.season;
            const nextSeason = currentSeason >= 4 ? 1 : currentSeason + 1;
            const isYearIncrement = currentSeason === 4;

            const proficiencyGains: Record<string, { type: string, amount: number }> = {};

            const updatedBuildings = state.buildings.map(b => {
                if (!b.isFinished) {
                    const rem = b.turnsRemaining - 1;
                    if (rem <= 0) {
                        turnLogs.push(`【${currentYear}载·${SEASON_NAMES[currentSeason]}】${BUILDING_TYPES[b.type].name} 营造完成。`);
                        return { ...b, isFinished: true, turnsRemaining: 0 };
                    }
                    return { ...b, turnsRemaining: rem };
                }
                
                if (b.activeProduction) {
                    const rem = b.activeProduction.turnsRemaining - 1;
                    if (rem <= 0) {
                        const recipe = [...RECIPES.Alchemy, ...RECIPES.Smithing].find(r => r.id === b.activeProduction!.recipeId);
                        if (recipe) {
                            const productDetail = ALL_ITEM_DETAILS[recipe.productId] as any;
                            const catKey = productDetail.category === 'pill' ? 'pills' : 'weapons';
                            finalInventory[catKey][recipe.productId] = (finalInventory[catKey][recipe.productId] || 0) + 1;
                            
                            const baseGain = recipe.grade === 0 ? 2 : recipe.grade * 10;
                            const totalGain = baseGain * (recipe.turns || 1);
                            const artisanType = b.activeProduction.type === 'Alchemy' ? '炼丹' : '炼器';
                            
                            if (b.assignedMemberId) {
                                proficiencyGains[b.assignedMemberId] = { 
                                    type: artisanType, 
                                    amount: (proficiencyGains[b.assignedMemberId]?.amount || 0) + totalGain 
                                };
                            }

                            turnLogs.push(`【${currentYear}载·成品】${BUILDING_TYPES[b.type].name} 传来阵阵异响，${productDetail.name} 炼制成功！`);
                        }
                        return { ...b, activeProduction: undefined };
                    }
                    return { ...b, activeProduction: { ...b.activeProduction, turnsRemaining: rem } };
                }
                return b;
            });

            const cultivationMultipliers: Record<string, number> = {};
            const cultRoom = state.buildings.find(b => b.type === 'CultivationRoom' && b.isFinished);
            if (cultRoom && cultRoom.assignedMemberIds) {
                const veinBonus = VEIN_LEVELS[cultRoom.veinLevel || 0].bonus;
                cultRoom.assignedMemberIds.forEach((id, idx) => {
                    if (id) {
                        const tierKey = idx < 4 ? 'Jia' : idx < 8 ? 'Yi' : 'Bing';
                        const slotInTier = idx % 4;
                        const baseMult = CULTIVATION_SLOT_BONUSES[tierKey][slotInTier];
                        cultivationMultipliers[id] = baseMult * veinBonus;
                    }
                });
            }

            const updatedRegions = state.regions.map(r => {
                let nr = { ...r };
                if (nr.activeMission) {
                    const rem = nr.activeMission.turnsRemaining - 1;
                    if (rem <= 0) {
                        const member = state.members.find(m => m.id === nr.activeMission!.memberId);
                        if (member) {
                            const missionEvent = EventController.generateMissionResult(member, nr, currentYear);
                            newEvents.push(missionEvent);
                        }
                        nr.activeMission = undefined;
                    } else {
                        nr.activeMission = { ...nr.activeMission, turnsRemaining: rem };
                    }
                }
                return nr;
            });

            const updatedMembers = state.members.map(m => {
                const multiplier = cultivationMultipliers[m.id] || 1.0;
                let { updatedMember, logs } = CharacterController.processTurn(m, currentYear, isYearIncrement, multiplier);
                
                if (proficiencyGains[m.id]) {
                    const { type, amount } = proficiencyGains[m.id];
                    const currentProf = updatedMember.proficiencies[type] || 0;
                    updatedMember = {
                        ...updatedMember,
                        proficiencies: {
                            ...updatedMember.proficiencies,
                            [type]: currentProf + amount
                        }
                    };
                }

                turnLogs.push(...logs);
                return updatedMember;
            });

            if (Math.random() > 0.6) {
                newEvents.push(EventController.generateNextEvent({ ...state, members: updatedMembers, regions: updatedRegions, buildings: updatedBuildings, inventory: finalInventory }));
            }

            setState(prev => ({
                ...prev,
                year: isYearIncrement ? prev.year + 1 : prev.year,
                season: nextSeason,
                members: updatedMembers,
                regions: updatedRegions,
                buildings: updatedBuildings,
                spiritStones: prev.spiritStones + 50,
                merit: prev.merit + 2,
                inventory: finalInventory,
                logs: [...turnLogs, ...prev.logs].slice(0, 40)
            }));

            if (newEvents.length > 0) setPendingEvents(newEvents);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleChoice = (choiceKey: 'choiceA' | 'choiceB') => {
        if (pendingEvents.length === 0) return;
        const currentEvent = pendingEvents[0];
        const updates = EventController.processEventChoice(state, currentEvent, choiceKey);
        
        setState(prev => ({ ...prev, ...updates }));
        setPendingEvents(prev => prev.slice(1));
    };

    const handleBreakthroughAttempt = (memberId: string, success: boolean, usedPillId?: number) => {
        setState(prev => {
            const member = prev.members.find(m => m.id === memberId);
            if (!member) return prev;
            const { updatedMember, log } = CharacterController.breakthrough(member, success, prev.year, usedPillId);
            return {
                ...prev,
                members: prev.members.map(m => m.id === memberId ? updatedMember : m),
                heritagePool: success ? prev.heritagePool + 10 : prev.heritagePool,
                logs: [log, ...prev.logs].slice(0, 30)
            };
        });
        setBreakingMemberId(null);
    };

    const handleSelectRegion = (r: Region | null) => {
        if (r && r.id === 'li_clan_home') setIsManagementVisible(true);
        else setState(p => ({ ...p, currentRegionId: r ? r.id : '' }));
    };

    return (
        <div className="h-full w-full flex flex-col bg-bg-main text-text-main overflow-hidden select-none font-sans">
            <header className="h-16 bg-bg-panel border-b border-border-soft flex items-center justify-between px-8 z-40 shadow-xl shrink-0">
                <div className="flex items-center gap-12">
                    <h1 className="font-serif font-h1 text-accent-gold tracking-[0.2em]">玄鉴仙族：昊天纪元</h1>
                    <div className="flex gap-8 items-center border-l border-border-soft pl-8">
                        <div className="flex flex-col">
                            <span className="font-caption text-text-disabled">灵石</span>
                            <span className="font-value text-accent-gold">✨ {state.spiritStones}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-caption text-text-disabled">功德</span>
                            <span className="font-value text-blue-400">💠 {state.merit}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-caption text-text-disabled">岁时</span>
                            <span className="font-value text-text-main">{state.year}载 · {SEASON_NAMES[state.season]}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsManagementVisible(true)} className="px-5 py-2 bg-bg-main border border-border-soft text-text-muted rounded-sm font-caption font-bold hover:border-accent-jade transition-all">🏛️ 家族管理</button>
                    <button onClick={() => setIsDashboardVisible(!isDashboardVisible)} className={`px-5 py-2 rounded-sm border transition-all font-caption font-bold ${isDashboardVisible ? 'bg-accent-jade/20 border-accent-jade text-accent-jade' : 'bg-bg-main border-border-soft text-text-disabled'}`}>📜 族谱</button>
                    <button onClick={handleNextTurn} disabled={isProcessing || pendingEvents.length > 0} className="bg-accent-jade hover:brightness-110 disabled:opacity-30 text-bg-main px-8 py-2 rounded-sm font-sans font-body font-bold transition-all shadow-lg">{isProcessing ? '推演中' : '岁时轮转'}</button>
                </div>
            </header>
            
            <main className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 relative bg-bg-main">
                    <WorldMap 
                        regions={state.regions} 
                        members={state.members} 
                        reputation={state.factionReputation}
                        currentRegionId={state.currentRegionId} 
                        onSelectRegion={handleSelectRegion} 
                        onUpdateMember={handleUpdateMember} 
                        onUpdateRegion={(id, u) => setState(p => ({ ...p, regions: p.regions.map(r => r.id === id ? { ...r, ...u } : r) }))} 
                    />
                    
                    <div className={`absolute bottom-6 left-6 transition-all duration-300 bg-bg-panel/95 border border-border-soft rounded-sm shadow-2xl z-20 flex flex-col overflow-hidden ${isConsoleCollapsed ? 'w-48 h-10' : 'w-80 h-64'}`}>
                        <div 
                            className="flex justify-between items-center px-4 py-2 border-b border-border-soft bg-bg-main/50 shrink-0 cursor-pointer group hover:bg-bg-panel/80 transition-all" 
                            onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
                        >
                            <span className="font-sans font-caption font-bold text-text-muted group-hover:text-text-main transition-colors">族史摘要</span>
                            <span className={`text-[10px] text-accent-gold transition-transform duration-300 ${isConsoleCollapsed ? '-rotate-180' : 'rotate-0'}`}>▼</span>
                        </div>
                        {!isConsoleCollapsed && (
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {state.logs.map((log, i) => (
                                    <p key={i} className="font-sans font-caption text-text-muted leading-relaxed border-b border-border-soft/30 pb-2">
                                        <span className="text-accent-jade mr-2">◈</span> {log}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                {isDashboardVisible && (
                    <div className="w-80 h-full border-l border-border-soft flex flex-col shrink-0">
                        <ClanDashboard state={state} onUpdateMember={handleUpdateMember} onAddMember={() => {}} onOpenBreakthrough={(id) => setBreakingMemberId(id)} onContributeItem={handleContributeItem} />
                    </div>
                )}
            </main>
            
            {isManagementVisible && (
                <ClanManagement 
                    state={state} 
                    onUpdateMember={handleUpdateMember} 
                    onUpdateBuilding={(id, u) => setState(p => ({ ...p, buildings: p.buildings.map(b => b.id === id ? { ...b, ...u } : b) }))} 
                    onUpdateInventory={handleUpdateInventory}
                    onAddBuilding={(type) => {}} 
                    onCancelBuilding={(id) => {}}
                    onAssignBuilding={(bId, mId, slotIdx) => {}} 
                    onAssignItem={handleAssignItem}
                    onClose={() => setIsManagementVisible(false)} 
                />
            )}
            
            {pendingEvents.length > 0 && <EventModal event={pendingEvents[0]} onChoice={handleChoice} />}
            {breakingMemberId && (
                <BreakthroughModal 
                    member={state.members.find(m => m.id === breakingMemberId)!}
                    onClose={() => setBreakingMemberId(null)}
                    onAttempt={(success, pillId) => handleBreakthroughAttempt(breakingMemberId, success, pillId)}
                />
            )}
        </div>
    );
};

export default App;
