import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { GameState, ClanMember, Region, Realm, Building, Inventory, GameEvent, TaskType } from './types';
import { INITIAL_MEMBERS, INITIAL_REGIONS, REALM_ORDER, BUILDING_TYPES, ALL_ITEM_DETAILS, RECIPES, CULTIVATION_SLOT_BONUSES, VEIN_LEVELS } from './constants';
import { CLAN_MASTER_REGISTRY } from './data/master_registry';
import { CharacterController } from './services/CharacterController';
import { EventController } from './services/EventController';
import { OracleService } from './services/OracleService';
import ClanDashboard from './components/MembersPanel/ClanDashboard';
import WorldMap from './components/Map/WorldMap';
import ClanManagement from './components/ClanManagement/ClanManagement';
import BreakthroughModal from './components/Xiulian/BreakthroughModal';
import EventModal from './components/events/EventModal';
import RegionInfoPanel from './components/Map/RegionInfoPanel';

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
    const [isMapOverview, setIsMapOverview] = useState(false);

    const [scale, setScale] = useState(1);

    const updateScale = useCallback(() => {
        const ww = window.innerWidth;
        const wh = window.innerHeight;
        const targetW = 1920;
        const targetH = 1080;
        const scaleW = ww / targetW;
        const scaleH = wh / targetH;
        const newScale = Math.min(scaleW, scaleH);
        setScale(Math.max(newScale, 0.1));
    }, []);

    useLayoutEffect(() => {
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [updateScale]);

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

    const handleAssignMission = (memberId: string, missionType: string) => {
        const regionId = state.currentRegionId;
        if (!regionId) return;

        setState(prev => {
            const member = prev.members.find(m => m.id === memberId);
            const region = prev.regions.find(r => r.id === regionId);
            if (!member || !region) return prev;

            // Update member assignment
            const updatedMembers = prev.members.map(m => 
                m.id === memberId ? { ...m, assignment: 'Mission' as TaskType } : m
            );

            // Update region with mission info
            const updatedRegions = prev.regions.map(r => 
                r.id === regionId ? {
                    ...r,
                    activeMission: {
                        memberId,
                        turnsRemaining: 2, // Standard 2 seasons mission
                        totalTurns: 2,
                        type: missionType
                    }
                } : r
            );

            return {
                ...prev,
                members: updatedMembers,
                regions: updatedRegions,
                currentRegionId: '', // Close panel
                logs: [`【派遣】${member.name} 领老祖法旨，前往 ${region.name} 执行任务。`, ...prev.logs].slice(0, 30)
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
                            if (b.assignedMemberId) proficiencyGains[b.assignedMemberId] = { type: artisanType, amount: (proficiencyGains[b.assignedMemberId]?.amount || 0) + totalGain };
                            turnLogs.push(`【${currentYear}载·成品】${BUILDING_TYPES[b.type].name} 传来阵阵异响，${productDetail.name} 炼制成功！`);
                        }
                        return { ...b, activeProduction: undefined };
                    }
                    return { ...b, activeProduction: { ...b.activeProduction, turnsRemaining: rem } };
                }
                return b;
            });

            const updatedRegions = state.regions.map(r => {
                let nr = { ...r };
                if (nr.activeMission) {
                    const rem = nr.activeMission.turnsRemaining - 1;
                    if (rem <= 0) {
                        const member = state.members.find(m => m.id === nr.activeMission!.memberId);
                        if (member) newEvents.push(EventController.generateMissionResult(member, nr, currentYear));
                        nr.activeMission = undefined;
                    } else nr.activeMission = { ...nr.activeMission, turnsRemaining: rem };
                }
                return nr;
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

            const updatedMembers = state.members.map(m => {
                const multiplier = cultivationMultipliers[m.id] || 1.0;
                let { updatedMember, logs } = CharacterController.processTurn(m, currentYear, isYearIncrement, multiplier);
                if (proficiencyGains[m.id]) {
                    const { type, amount } = proficiencyGains[m.id];
                    const currentProf = updatedMember.proficiencies[type] || 0;
                    updatedMember = { ...updatedMember, proficiencies: { ...updatedMember.proficiencies, [type]: currentProf + amount } };
                }
                turnLogs.push(...logs);
                return updatedMember;
            });

            if (Math.random() > 0.6) newEvents.push(EventController.generateNextEvent({ ...state, members: updatedMembers, regions: updatedRegions, buildings: updatedBuildings, inventory: finalInventory }));
            
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
        const updates = EventController.processEventChoice(state, pendingEvents[0], choiceKey);
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

    const selectedRegion = state.regions.find(r => r.id === state.currentRegionId);
    const maxClanRealmIdx = state.members
        .filter(m => m.family === '望月李氏')
        .reduce((max, m) => Math.max(max, REALM_ORDER.indexOf(m.realm)), 0);

    return (
        <div className="game-canvas" style={{ transform: `scale(${scale})` }}>
            <div className="h-full w-full relative bg-[#0a0f0d] text-text-main overflow-hidden select-none font-sans">
                
                <div className="absolute inset-0 z-0">
                    <WorldMap 
                        regions={state.regions} 
                        members={state.members} 
                        reputation={state.factionReputation}
                        currentRegionId={state.currentRegionId} 
                        onSelectRegion={(r) => r?.id === 'li_clan_home' ? setIsManagementVisible(true) : setState(p => ({ ...p, currentRegionId: r ? r.id : '' }))} 
                        onUpdateMember={handleUpdateMember} 
                        onUpdateRegion={(id, u) => setState(p => ({ ...p, regions: p.regions.map(r => r.id === id ? { ...r, ...u } : r) }))}
                        onOverviewChange={setIsMapOverview} 
                    />
                </div>

                {selectedRegion && selectedRegion.id !== 'li_clan_home' && (
                    <RegionInfoPanel 
                        region={selectedRegion} 
                        members={state.members}
                        onClose={() => setState(p => ({ ...p, currentRegionId: '' }))} 
                        onAssignMission={handleAssignMission}
                    />
                )}

                <header 
                    className={`absolute top-0 left-0 w-full h-28 flex items-start justify-between px-16 z-20 pointer-events-none pt-4 transition-all duration-500 ease-in-out
                        ${isMapOverview ? 'opacity-0 -translate-y-[120%]' : 'opacity-100 translate-y-0'}`}
                >
                    <div className="flex items-center gap-12 pointer-events-auto bg-[#131c18]/90 backdrop-blur-md px-12 py-4 rounded-xl border border-accent-gold/20 shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
                        <div className="flex flex-col">
                            <h1 className="font-serif text-3xl font-black text-accent-gold tracking-[0.3em] drop-shadow-[0_2px_8px_rgba(201,160,99,0.5)] uppercase">玄鉴仙族</h1>
                            <span className="text-[10px] text-accent-gold/40 tracking-[0.5em] mt-0.5">HANTIAN ERA</span>
                        </div>
                        <div className="flex gap-14 items-center border-l border-white/5 pl-14">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-text-disabled mb-1">灵石存续</span>
                                <span className="text-2xl font-bold text-accent-gold font-mono">✨ {state.spiritStones.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-text-disabled mb-1">功德造化</span>
                                <span className="text-2xl font-bold text-blue-400 font-mono">💠 {state.merit}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-text-disabled mb-1">岁时纪元</span>
                                <span className="text-2xl font-bold text-text-main tracking-widest">{state.year}载 · {SEASON_NAMES[state.season]}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 pointer-events-auto bg-[#131c18]/90 backdrop-blur-md px-8 py-5 rounded-xl border border-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
                        <button onClick={() => setIsManagementVisible(true)} className="px-8 py-3 bg-bg-main/60 border border-border-soft text-text-muted rounded-sm font-bold hover:border-accent-jade hover:text-accent-jade transition-all flex items-center gap-2 text-base shadow-inner">🏛️ 家族管理</button>
                        <button onClick={() => setIsDashboardVisible(!isDashboardVisible)} className={`px-8 py-3 rounded-sm border transition-all font-bold flex items-center gap-2 text-base ${isDashboardVisible ? 'bg-accent-jade/20 border-accent-jade text-accent-jade' : 'bg-bg-main/60 border-border-soft text-text-disabled'}`}>📜 族谱常青</button>
                        <button onClick={handleNextTurn} disabled={isProcessing || pendingEvents.length > 0} className="bg-accent-jade hover:brightness-110 disabled:opacity-30 text-bg-main px-12 py-3 rounded-sm font-black transition-all shadow-[0_0_30px_rgba(77,124,107,0.5)] text-lg tracking-widest ml-4">{isProcessing ? '推演因果' : '岁时轮转'}</button>
                    </div>
                </header>
                
                {isDashboardVisible && (
                    <aside 
                        className={`absolute top-36 right-12 bottom-12 w-[480px] z-30 pointer-events-auto transition-all duration-500 ease-in-out
                            ${isMapOverview ? 'opacity-0 translate-x-[110%] pointer-events-none' : 'opacity-100 translate-x-0'}`}
                    >
                        <div className="h-full bg-[#131c18]/95 backdrop-blur-xl border border-border-soft/60 shadow-[0_0_80px_rgba(0,0,0,1)] rounded-xl overflow-hidden flex flex-col ring-1 ring-white/5">
                            <ClanDashboard state={state} onUpdateMember={handleUpdateMember} onAddMember={() => {}} onOpenBreakthrough={(id) => setBreakingMemberId(id)} onContributeItem={() => {}} />
                        </div>
                    </aside>
                )}

                <div 
                    className={`absolute bottom-12 left-12 transition-all duration-500 z-30 flex flex-col overflow-hidden pointer-events-auto
                        ${isMapOverview ? 'opacity-0 translate-y-[120%] pointer-events-none' : 'opacity-100 translate-y-0'}
                        ${isConsoleCollapsed ? 'w-64 h-16' : 'w-[520px] h-[360px]'}`}
                >
                    <div className="h-full bg-[#131c18]/90 backdrop-blur-xl border border-border-soft shadow-[0_20px_60px_rgba(0,0,0,0.9)] rounded-xl overflow-hidden flex flex-col ring-1 ring-white/5">
                        <div 
                            className="flex justify-between items-center px-8 py-5 border-b border-white/5 bg-bg-main/40 shrink-0 cursor-pointer group hover:bg-bg-panel transition-all" 
                            onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-xl">📜</span>
                                <span className="font-serif font-bold text-accent-gold/90 group-hover:text-accent-gold transition-colors tracking-[0.4em] text-base">族史摘要</span>
                            </div>
                            <span className={`text-xs text-accent-gold/60 transition-transform duration-500 ${isConsoleCollapsed ? '-rotate-180' : 'rotate-0'}`}>▼</span>
                        </div>
                        {!isConsoleCollapsed && (
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/30">
                                {state.logs.map((log, i) => (
                                    <div key={i} className="flex gap-5 border-b border-white/5 pb-5 animate-fade-in group" style={{animationDelay: `${i*0.05}s`}}>
                                        <span className="text-accent-jade text-xl shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">◈</span>
                                        <p className="font-sans text-[15px] text-text-muted leading-relaxed tracking-wide group-hover:text-text-main transition-colors">
                                            {log}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {isManagementVisible && (
                    <div className="fixed inset-0 z-[500]">
                        <ClanManagement 
                            state={state} 
                            onUpdateMember={handleUpdateMember} 
                            onUpdateBuilding={(id, u) => setState(p => ({ ...p, buildings: p.buildings.map(b => b.id === id ? { ...b, ...u } : b) }))} 
                            onUpdateInventory={(u) => setState(p => ({ ...p, inventory: { ...p.inventory, ...u } }))}
                            onAddBuilding={(type) => {
                                const id = `building_${Date.now()}`;
                                const cost = BUILDING_TYPES[type].baseCost;
                                if (state.spiritStones < cost) return;
                                const newBuilding: Building = {
                                    id, type, level: 1, assignedMemberId: null, isFinished: false, turnsRemaining: BUILDING_TYPES[type].baseTurns
                                };
                                setState(p => ({ ...p, spiritStones: p.spiritStones - cost, buildings: [...p.buildings, newBuilding] }));
                            }} 
                            onCancelBuilding={() => {}}
                            onAssignBuilding={(bid, mid, sidx) => {
                                setState(prev => ({
                                    ...prev,
                                    buildings: prev.buildings.map(b => {
                                        if (b.id !== bid) return b;
                                        if (sidx !== undefined) {
                                            const ids = [...(b.assignedMemberIds || Array(12).fill(null))];
                                            ids[sidx] = mid;
                                            return { ...b, assignedMemberIds: ids };
                                        }
                                        return { ...b, assignedMemberId: mid };
                                    })
                                }));
                            }} 
                            onAssignItem={() => {}}
                            onClose={() => setIsManagementVisible(false)} 
                        />
                    </div>
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
        </div>
    );
};

export default App;