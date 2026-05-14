import React, { useMemo, useState } from 'react';
import { ClanMember, Building, Inventory, Realm, InjuryStatus } from '../../../../types';
import { ALL_ITEM_DETAILS, REALM_ORDER } from '../../../../constants';
import { getGradeStyle } from '../../../MembersPanel/Shared/utils';
import { renderItemContent } from '../../../Shared/TooltipRenderers';

interface Props {
    building: Building;
    members: ClanMember[];
    inventory: Inventory;
    spiritStones: number;
    alreadyAssignedIds: string[];
    onAssignBuilding: (buildingId: string, memberId: string | null) => void;
    onUpdateBuilding: (id: string, updates: Partial<Building>) => void;
    onUpdateInventory: (updates: Partial<Inventory>) => void;
    onUpdateMember: (id: string, updates: Partial<ClanMember>) => void;
    onUpdateSpiritStones: (amount: number) => void;
    showTooltip: (e: React.MouseEvent, content: React.ReactNode) => void;
    hideTooltip: () => void;
}

const LibraryTab: React.FC<Props> = ({ building, members, inventory, spiritStones, alreadyAssignedIds, onAssignBuilding, onUpdateBuilding, onUpdateInventory, onUpdateMember, onUpdateSpiritStones, showTooltip, hideTooltip }) => {
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
    const [recallConfirmId, setRecallConfirmId] = useState<number | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const aliveMembers = members.filter(m => m.status !== InjuryStatus.Dead && m.family === '望月李氏');
    const assignedCurator = aliveMembers.find(m => m.id === building.assignedMemberId);

    // 计算拓印需求
    const getRubbingRequirements = (grade: number) => {
        const cost = grade * 200;
        const realmIndex = Math.ceil(grade / 2); // 1,2品练气(1); 3,4品筑基(2); 5,6品紫府(3)...
        const realm = REALM_ORDER[realmIndex] || Realm.YuanShen;
        const subRealm = grade % 2 === 1 ? 5 : 9;
        const turns = Math.ceil(grade / 2);
        return { cost, realm, realmIndex, subRealm, turns };
    };

    // Get all methods in the clan warehouse
    const clanMethods = useMemo(() => {
        return (Object.entries(inventory.methods) as [string, number][])
            .map(([id, count]) => ({ id: parseInt(id), count }))
            .filter(item => item.count > 0);
    }, [inventory.methods]);

    // Get all methods practiced by or in personal inventory of members
    const memberMethodsInfo = useMemo(() => {
        const practicing = new Map<number, { memberName: string, memberId: string }[]>();
        const personal = new Map<number, { memberName: string, memberId: string, count: number }[]>();

        members.forEach(m => {
            if (m.family !== '望月李氏' || m.status === InjuryStatus.Dead) return;
            
            // Practicing
            [m.mainMethodId, m.movementMethodId, ...m.auxMethodIds].forEach(mid => {
                if (mid === null) return;
                const list = practicing.get(mid) || [];
                list.push({ memberName: m.name, memberId: m.id });
                practicing.set(mid, list);
            });

            // Personal Inventory
            Object.entries(m.personalInventory.methods).forEach(([idStr, count]) => {
                const mid = parseInt(idStr);
                const list = personal.get(mid) || [];
                list.push({ memberName: m.name, memberId: m.id, count });
                personal.set(mid, list);
            });
        });

        return { practicing, personal };
    }, [members]);

    const allKnownMethodIds = useMemo(() => {
        const ids = new Set<number>();
        clanMethods.forEach(m => ids.add(m.id));
        memberMethodsInfo.practicing.forEach((_, id) => ids.add(id));
        memberMethodsInfo.personal.forEach((_, id) => ids.add(id));
        return Array.from(ids).sort((a, b) => {
            const gradeA = (ALL_ITEM_DETAILS as any)[a]?.grade || 0;
            const gradeB = (ALL_ITEM_DETAILS as any)[b]?.grade || 0;
            return gradeB - gradeA;
        });
    }, [clanMethods, memberMethodsInfo]);

    const handleStartRubbing = () => {
        if (!assignedCurator || !selectedMethodId) return;
        const detail = (ALL_ITEM_DETAILS as any)[selectedMethodId];
        if (!detail) return;

        const { cost, turns } = getRubbingRequirements(detail.grade);
        if (spiritStones < cost) return;

        onUpdateSpiritStones(spiritStones - cost);
        onUpdateBuilding(building.id, {
            activeProduction: {
                recipeId: selectedMethodId,
                turnsRemaining: turns,
                type: 'Library'
            }
        });
        setSelectedMethodId(null);
    };

    const handleRecallFromMember = (methodId: number) => {
        // Find a member who has this method in their personal inventory
        const owner = members.find(m => m.personalInventory.methods[methodId] > 0);
        if (!owner) return;

        // Move one copy from member's inventory to clan inventory
        const newPersonalMethods = { ...owner.personalInventory.methods };
        newPersonalMethods[methodId] -= 1;
        if (newPersonalMethods[methodId] <= 0) delete newPersonalMethods[methodId];

        onUpdateMember(owner.id, {
            personalInventory: {
                ...owner.personalInventory,
                methods: newPersonalMethods
            }
        });

        const newClanMethods = { ...inventory.methods };
        newClanMethods[methodId] = (newClanMethods[methodId] || 0) + 1;
        onUpdateInventory({ methods: newClanMethods });
        
        setRecallConfirmId(null);
    };

    const handleCancelRubbing = () => {
        if (!building.activeProduction) return;
        
        const methodId = building.activeProduction.recipeId;
        const detail = (ALL_ITEM_DETAILS as any)[methodId];
        if (detail) {
            const { cost } = getRubbingRequirements(detail.grade);
            onUpdateSpiritStones(spiritStones + cost);
        }

        onUpdateBuilding(building.id, {
            activeProduction: undefined
        });
        
        setShowCancelConfirm(false);
    };

    const methodToRub = selectedMethodId ? (ALL_ITEM_DETAILS as any)[selectedMethodId] : null;
    const rubReqs = methodToRub ? getRubbingRequirements(methodToRub.grade) : null;
    
    // Check curator requirements
    const curatorRealmIdx = assignedCurator ? REALM_ORDER.indexOf(assignedCurator.realm) : -1;
    const isRealmMatch = rubReqs ? curatorRealmIdx > rubReqs.realmIndex || (curatorRealmIdx === rubReqs.realmIndex && assignedCurator!.subRealm >= rubReqs.subRealm) : false;
    const hasStones = rubReqs ? spiritStones >= rubReqs.cost : false;
    const isInClanWarehouse = selectedMethodId ? inventory.methods[selectedMethodId] > 0 : false;

    return (
        <div className="flex gap-8 h-full animate-fade-in max-w-6xl mx-auto">
            <div className="w-80 p-6 bg-black/40 border border-amber-900/20 rounded shadow-xl flex flex-col h-fit">
                <h3 className="text-amber-600 font-bold text-lg mb-6 flex items-center gap-2"><span>📚</span> 藏经阁</h3>
                <div className="bg-[#1a1612] p-5 rounded border border-amber-900/30">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest shrink-0 mr-4">守阁长老</p>
                        <select className="bg-[#2c1810] border border-yellow-900/40 px-2 py-1 rounded text-yellow-500 outline-none text-[10px] font-bold min-w-[120px] shadow-sm hover:border-yellow-600 transition-colors" 
                            onChange={(e) => onAssignBuilding(building.id, e.target.value || null)} 
                            value={building.assignedMemberId || ''}>
                            <option value="">- 轮空 -</option>
                            {aliveMembers
                                .filter(m => m.realm !== Realm.Mortal && (!alreadyAssignedIds.includes(m.id) || m.id === building.assignedMemberId))
                                .sort((a, b) => {
                                    const realmA = REALM_ORDER.indexOf(a.realm);
                                    const realmB = REALM_ORDER.indexOf(b.realm);
                                    if (realmB !== realmA) return realmB - realmA;
                                    return b.subRealm - a.subRealm;
                                })
                                .map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} · {m.realm+m.subRealm}层
                                </option>
                            ))}
                        </select>
                    </div>
                    {assignedCurator ? (
                        <div className="animate-fade-in">
                            <p className="text-yellow-500 font-black text-2xl tracking-tighter">{assignedCurator.name}</p>
                            <p className="text-amber-600 text-[13px] mt-1 font-bold">镇守功法传续</p>
                            
                            {building.activeProduction ? (
                                    <div className="mt-4 p-3 bg-amber-900/10 border border-amber-500/20 rounded">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-amber-400 text-[10px] font-bold">拓印中...</span>
                                            <button 
                                                onClick={() => setShowCancelConfirm(true)}
                                                className="text-red-500/60 hover:text-red-400 text-[9px] font-bold border border-red-900/30 px-1.5 py-0.5 rounded transition-colors"
                                            >取消</button>
                                        </div>
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-yellow-100 font-bold text-xs truncate max-w-[120px]">
                                                《{(ALL_ITEM_DETAILS as any)[building.activeProduction.recipeId]?.name}》
                                            </p>
                                            <span className="text-gray-500 text-[9px] font-mono shrink-0">余 {building.activeProduction.turnsRemaining} 载</span>
                                        </div>
                                    </div>
                            ) : null}
                        </div>
                    ) : <p className="italic text-gray-700 py-10 text-center border border-dashed border-amber-900/20 rounded text-[13px]">暂未任命</p>}
                </div>
            </div>
            
            <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-6 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                    <h4 className="text-amber-500 text-sm font-bold flex items-center gap-2">
                        <span>📜</span> 家族传承武学
                    </h4>
                    <div className="flex gap-4 text-[10px] items-center">
                        <span className="text-gray-500 font-mono">灵石储备: <span className="text-amber-600">{spiritStones}</span></span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {allKnownMethodIds.length > 0 ? (
                        <div className="space-y-8">
                            {/* 族库现有 */}
                            <section>
                                <h5 className="text-[11px] text-amber-700 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-700"></span> 族库典藏
                                </h5>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {allKnownMethodIds.filter(id => (inventory.methods[id] || 0) > 0).map(id => {
                                        const detail = (ALL_ITEM_DETAILS as any)[id];
                                        if (!detail) return null;
                                        const style = getGradeStyle(detail.grade);
                                        return (
                                            <div 
                                                key={id} 
                                                onMouseEnter={(e) => showTooltip(e, renderItemContent(id))}
                                                onMouseLeave={hideTooltip}
                                                onClick={() => !building.activeProduction && setSelectedMethodId(id)}
                                                className={`${style.bg} border ${style.border} p-3 rounded-lg flex flex-col items-center group transition-all cursor-pointer hover:border-amber-400 relative ${building.activeProduction ? 'opacity-40 grayscale' : ''}`}
                                            >
                                                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📖</div>
                                                <span className={`text-[10px] font-bold text-center truncate w-full ${style.text}`}>{detail.name}</span>
                                                <div className="flex justify-between w-full mt-2 text-[9px] font-bold">
                                                    <span className="text-amber-600/80">余量: {inventory.methods[id]}</span>
                                                    <span className="text-blue-500/80 group-hover:text-blue-400 transition-colors">点击拓印</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* 族人已修炼 */}
                            <section>
                                <h5 className="text-[11px] text-emerald-700 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span> 族人正修功法
                                </h5>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {allKnownMethodIds.filter(id => memberMethodsInfo.practicing.has(id)).map(id => {
                                        const detail = (ALL_ITEM_DETAILS as any)[id];
                                        if (!detail) return null;
                                        const style = getGradeStyle(detail.grade);
                                        const users = memberMethodsInfo.practicing.get(id)!;
                                        const inClan = (inventory.methods[id] || 0) > 0;
                                        return (
                                            <div 
                                                key={id} 
                                                onMouseEnter={(e) => showTooltip(e, renderItemContent(id))}
                                                onMouseLeave={hideTooltip}
                                                onClick={() => {
                                                    if (building.activeProduction) return;
                                                    if (!inClan) {
                                                        setRecallConfirmId(id);
                                                    } else {
                                                        setSelectedMethodId(id);
                                                    }
                                                }}
                                                className={`${style.bg} border ${style.border} p-3 rounded-lg flex flex-col items-center group transition-all cursor-pointer hover:border-emerald-400 relative ${building.activeProduction ? 'opacity-40 grayscale' : ''}`}
                                            >
                                                <div className="text-2xl mb-1 opacity-80 group-hover:opacity-100 transition-opacity">📜</div>
                                                <span className={`text-[10px] font-bold text-center truncate w-full ${style.text}`}>{detail.name}</span>
                                                <div className="mt-2 flex flex-col items-center gap-0.5">
                                                    <span className="text-[8px] text-emerald-600/60 font-bold uppercase">当前在修族人</span>
                                                    <div className="flex flex-wrap justify-center gap-1">
                                                        {users.slice(0, 2).map((u, i) => (
                                                            <span key={i} className="text-[8px] text-gray-400 bg-black/20 px-1 rounded truncate max-w-[50px]">{u.memberName}</span>
                                                        ))}
                                                        {users.length > 2 && <span className="text-[8px] text-gray-500">...</span>}
                                                    </div>
                                                </div>
                                                {!inClan && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                        <span className="text-[10px] text-red-400 font-bold px-2 text-center leading-tight">需先收回族库<br/>方可拓印</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* 族人私藏 (未修炼) */}
                            <section>
                                <h5 className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span> 族人身藏
                                </h5>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {allKnownMethodIds.filter(id => memberMethodsInfo.personal.has(id)).map(id => {
                                        const detail = (ALL_ITEM_DETAILS as any)[id];
                                        if (!detail) return null;
                                        const style = getGradeStyle(detail.grade);
                                        const inClan = (inventory.methods[id] || 0) > 0;
                                        return (
                                            <div 
                                                key={id} 
                                                onMouseEnter={(e) => showTooltip(e, renderItemContent(id))}
                                                onMouseLeave={hideTooltip}
                                                onClick={() => {
                                                    if (building.activeProduction) return;
                                                    if (!inClan) {
                                                        setRecallConfirmId(id);
                                                    } else {
                                                        setSelectedMethodId(id);
                                                    }
                                                }}
                                                className={`${style.bg} border border-gray-800 p-3 rounded-lg flex flex-col items-center group transition-all cursor-pointer hover:border-gray-500 relative grayscale-[0.8] hover:grayscale-0 ${building.activeProduction ? 'opacity-40 grayscale' : ''}`}
                                            >
                                                <div className="text-2xl mb-1 opacity-60">📑</div>
                                                <span className={`text-[10px] font-bold text-center truncate w-full text-gray-400 group-hover:text-amber-500`}>{detail.name}</span>
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                    <span className="text-[10px] text-red-500 font-bold px-2 text-center leading-tight">需先收回族库<br/>方可拓印</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-700 italic gap-2">
                            <span className="text-4xl opacity-10">📖</span>
                            <p className="text-[13px]">族中目前无任何功法存本</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 收回确认弹窗 */}
            {recallConfirmId && (() => {
                const owners = members.filter(m => m.personalInventory.methods[recallConfirmId] > 0);
                const ownerNames = owners.length > 0 ? owners.map(m => m.name).join('、') : '族人';
                return (
                    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setRecallConfirmId(null)}>
                        <div className="bg-[#1a1612] border-2 border-red-900/40 p-6 rounded shadow-2xl max-w-sm w-full text-center animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <h4 className="text-xl font-bold text-red-500 mb-4">确认收回功法？</h4>
                            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                                《{(ALL_ITEM_DETAILS as any)[recallConfirmId]?.name}》目前由 <span className="text-red-400 font-bold">{ownerNames}</span> 携带，族中暂无存本。需先将实物收回族库再行拓印。
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setRecallConfirmId(null)}
                                    className="flex-1 py-2 bg-black/40 border border-white/5 text-gray-500 rounded text-xs hover:text-gray-300"
                                >取消</button>
                                <button 
                                    onClick={() => handleRecallFromMember(recallConfirmId)}
                                    className="flex-1 py-2 bg-red-900/40 border border-red-500/30 text-red-100 rounded text-xs hover:bg-red-800/40"
                                >立即收回</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* 拓印取消确认弹窗 */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCancelConfirm(false)}>
                    <div className="bg-[#1a1612] border-2 border-amber-900/40 p-6 rounded shadow-2xl max-w-sm w-full text-center animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-xl font-bold text-amber-500 mb-4">中止拓印？</h4>
                        <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                            确定要停止当前《{(ALL_ITEM_DETAILS as any)[building.activeProduction?.recipeId || 0]?.name}》的拓印吗？<br/>
                            <span className="text-amber-600/80 mt-2 block font-bold">※ 拓印工期将不会保留，但会全额退还灵石。</span>
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowCancelConfirm(false)}
                                className="flex-1 py-2 bg-black/40 border border-white/5 text-gray-500 rounded text-xs hover:text-gray-300"
                            >继续拓印</button>
                            <button 
                                onClick={handleCancelRubbing}
                                className="flex-1 py-2 bg-amber-900/40 border border-amber-500/30 text-amber-100 rounded text-xs hover:bg-amber-800/40"
                            >中止并退还</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 拓印确认弹窗 */}
            {selectedMethodId && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedMethodId(null)}>
                    <div className="bg-[#1a1612] border-4 border-amber-900/40 p-8 rounded-sm shadow-2xl max-w-sm w-full text-center animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-2xl font-cursive text-amber-500 mb-6 tracking-widest">拓 印 功 法</h4>
                        
                        <div className="bg-black/60 p-6 rounded border border-white/5 mb-8 text-left space-y-4">
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">拟拓功法</p>
                                <p className="font-bold text-lg text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                                    《{methodToRub?.name}》
                                </p>
                            </div>

                            <div className="pt-2 border-t border-white/5 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-[11px]">所需境界 (长老)</span>
                                    <span className={`text-[11px] font-bold ${isRealmMatch ? 'text-green-500' : 'text-red-500'}`}>
                                        {rubReqs?.realm}{rubReqs?.subRealm}层
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-[11px]">消耗灵石</span>
                                    <span className={`text-[11px] font-bold ${hasStones ? 'text-amber-500' : 'text-red-500'}`}>
                                        {rubReqs?.cost} ✨
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-[11px]">拓印工期</span>
                                    <span className="text-[11px] font-bold text-blue-400">{rubReqs?.turns} 载</span>
                                </div>
                            </div>

                            {!isInClanWarehouse && (
                                <p className="text-red-400 text-[10px] font-bold bg-red-900/10 p-2 border border-red-900/20 rounded">
                                    ※ 族库无存本，请先收回。
                                </p>
                            )}

                            {!assignedCurator && (
                                <p className="text-red-500 text-[10px] font-bold">※ 必须任命守阁长老方可拓印</p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setSelectedMethodId(null)}
                                className="flex-1 py-2.5 bg-black/40 border border-amber-900/40 text-gray-500 rounded font-bold hover:text-gray-300 transition-all text-xs"
                            >取消</button>
                            <button 
                                onClick={handleStartRubbing}
                                disabled={!assignedCurator || !isRealmMatch || !hasStones || !isInClanWarehouse}
                                className={`flex-1 py-2.5 rounded font-bold transition-all shadow-xl text-xs border border-amber-500/30 ${assignedCurator && isRealmMatch && hasStones && isInClanWarehouse ? 'bg-amber-900/80 text-amber-100 hover:bg-amber-800' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                            >开始拓印</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LibraryTab;
