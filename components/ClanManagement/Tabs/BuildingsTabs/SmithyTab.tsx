
import React, { useState, useMemo } from 'react';
import { ClanMember, Building, Realm, Inventory, InjuryStatus } from '../../../../types';
import { getArtisanTitle, REALM_ORDER, RECIPES, ALL_ITEM_DETAILS } from '../../../../constants';
import { getGradeStyle } from '../../../MembersPanel/Shared/utils';
import { renderItemContent } from '../../../Shared/TooltipRenderers';

interface Props {
    building: Building;
    members: ClanMember[];
    inventory: Inventory;
    alreadyAssignedIds: string[];
    onAssignBuilding: (buildingId: string, memberId: string | null) => void;
    onUpdateBuilding: (id: string, updates: Partial<Building>) => void;
    onUpdateInventory: (updates: Partial<Inventory>) => void;
    onUpdateMember: (id: string, updates: Partial<ClanMember>) => void;
    showTooltip: (e: React.MouseEvent, content: React.ReactNode) => void;
    hideTooltip: () => void;
}

const SmithyTab: React.FC<Props> = ({ building, members, inventory, alreadyAssignedIds, onAssignBuilding, onUpdateBuilding, onUpdateInventory, onUpdateMember, showTooltip, hideTooltip }) => {
    const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
    const [batchCount, setBatchCount] = useState<number>(1);

    const [activeRightTab, setActiveRightTab] = useState<'recipes' | 'materials'>('recipes');

    const aliveMembers = members.filter(m => m.status !== InjuryStatus.Dead && m.family === '望月李氏');
    const assignedSmith = aliveMembers.find(m => m.id === building.assignedMemberId);

    const recipeGroups = useMemo(() => {
        const clanRecipes = RECIPES.Smithing.filter(r => (inventory.scrolls[r.id] || 0) > 0).map(r => ({ ...r, source: '家族' as const, canUse: true }));
        const masterRecipes = assignedSmith ? RECIPES.Smithing.filter(r => (assignedSmith.personalInventory.scrolls[r.id] || 0) > 0 && !clanRecipes.some(cr => cr.id === r.id)).map(r => ({ ...r, source: '堂主' as const, canUse: true })) : [];
        const otherRecipes = aliveMembers.filter(m => m.id !== building.assignedMemberId).flatMap(m => 
            RECIPES.Smithing.filter(r => (m.personalInventory.scrolls[r.id] || 0) > 0 && !clanRecipes.some(cr => cr.id === r.id) && !masterRecipes.some(mr => mr.id === r.id))
        ).map(r => ({ ...r, source: '其他族人' as const, canUse: false }));
        
        return {
            clan: clanRecipes,
            master: masterRecipes,
            others: otherRecipes
        };
    }, [inventory.scrolls, assignedSmith, aliveMembers, building.assignedMemberId]);

    const availableRecipesCount = recipeGroups.clan.length + recipeGroups.master.length + recipeGroups.others.length;

    const selectedRecipe = useMemo(() => {
        return RECIPES.Smithing.find(r => r.id === selectedRecipeId);
    }, [selectedRecipeId]);

    const getArtisanRank = (proficiency: number): number => {
        const getThreshold = (rank: number): number => {
            if (rank <= 0) return 0;
            if (rank === 1) return 10;
            return 10 + 50 * rank * (rank - 1);
        };
        if (proficiency < 10) return 0;
        let currentRank = 1;
        for (let r = 9; r >= 1; r--) {
            if (proficiency >= getThreshold(r)) {
                currentRank = r;
                break;
            }
        }
        return currentRank;
    };

    const isRankSufficient = useMemo(() => {
        if (!selectedRecipe) return false;
        const rank = assignedSmith ? getArtisanRank(assignedSmith.proficiencies.炼器) : 0;
        return rank >= selectedRecipe.grade;
    }, [assignedSmith, selectedRecipe]);

    const getMineralQty = (id: number) => {
        const clanQty = inventory.minerals[id] || 0;
        const masterQty = assignedSmith?.personalInventory.minerals[id] || 0;
        return { clanQty, masterQty, total: clanQty + masterQty };
    };

    const checkResources = (recipe: any, count: number = 1) => {
        return Object.entries(recipe.cost).every(([id, qty]) => {
            const { total } = getMineralQty(parseInt(id));
            return total >= (qty as number) * count;
        });
    };

    const renderRecipeCard = (r: any) => {
        const style = getGradeStyle(r.grade);
        const isFocused = selectedRecipeId === r.id;
        const isDisabled = !!building.activeProduction || !r.canUse;
        
        return (
            <div 
                key={r.id}
                onClick={(e) => { e.stopPropagation(); !isDisabled && setSelectedRecipeId(isFocused ? null : r.id); setBatchCount(1); }}
                onMouseEnter={(e) => showTooltip(e, renderItemContent(r.id))}
                onMouseLeave={hideTooltip}
                className={`${style.bg} border-2 ${isFocused ? 'border-yellow-500 scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.2)]' : style.border} p-3 rounded-lg flex flex-col items-center group transition-all aspect-[4/5] justify-between shadow-lg relative overflow-hidden ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}`}
            >
                <div className={`text-3xl mt-2 group-hover:scale-110 transition-transform ${style.shadow}`}>⚒️</div>
                <span className={`text-[11px] font-bold text-center truncate w-full mt-2 px-1 ${style.text} ${style.shadow}`}>{r.name}</span>
                <div className="absolute top-1 right-1">
                    <span className={`text-[7px] font-bold px-1 rounded-sm border ${style.border} ${style.text} bg-black/60`}>{r.grade === 0 ? '凡品' : r.grade + '品'}</span>
                </div>
                <div className="mt-auto flex flex-col items-center">
                    <span className="text-[9px] text-blue-500/50 font-bold uppercase tracking-widest leading-tight">器谱</span>
                    {!r.canUse && <span className="text-[8px] text-red-500/80 font-bold mt-0.5 animate-pulse">不可用</span>}
                </div>
            </div>
        );
    };

    const handleStartSmithing = () => {
        const recipeToStart = recipeGroups.clan.find(r => r.id === selectedRecipeId) || recipeGroups.master.find(r => r.id === selectedRecipeId);
        if (!recipeToStart || !assignedSmith) return;
        if (!checkResources(recipeToStart, batchCount)) return;

        const newClanMinerals = { ...inventory.minerals };
        const newMasterMinerals = { ...assignedSmith.personalInventory.minerals };

        Object.entries(recipeToStart.cost).forEach(([id, qty]) => {
            const itemId = parseInt(id);
            let needed = (qty as number) * batchCount;

            const clanAvailable = newClanMinerals[itemId] || 0;
            if (clanAvailable >= needed) {
                newClanMinerals[itemId] -= needed;
                needed = 0;
            } else {
                newClanMinerals[itemId] = 0;
                needed -= clanAvailable;
                newMasterMinerals[itemId] = (newMasterMinerals[itemId] || 0) - needed;
            }

            if (newClanMinerals[itemId] === 0) delete newClanMinerals[itemId];
            if (newMasterMinerals[itemId] === 0) delete newMasterMinerals[itemId];
        });

        onUpdateInventory({ minerals: newClanMinerals });
        onUpdateMember(assignedSmith.id, { 
            personalInventory: { ...assignedSmith.personalInventory, minerals: newMasterMinerals } 
        });

        onUpdateBuilding(building.id, {
            activeProduction: {
                recipeId: recipeToStart.id,
                turnsRemaining: ((recipeToStart as any).turns || 1) * batchCount,
                batchCount: batchCount,
                type: 'Smithing'
            }
        });
        setSelectedRecipeId(null);
        setBatchCount(1);
    };

    const [isAbortConfirmVisible, setIsAbortConfirmVisible] = useState(false);

    const handleAbortSmithing = () => {
        onUpdateBuilding(building.id, { activeProduction: undefined });
        setIsAbortConfirmVisible(false);
    };

    const currentProductionRecipe = building.activeProduction 
        ? RECIPES.Smithing.find(r => r.id === building.activeProduction!.recipeId) 
        : null;

    return (
        <div className="flex gap-8 h-full animate-fade-in max-w-5xl mx-auto">
            {/* 左侧：人员与状态 */}
            <div className="w-80 p-6 bg-black/40 border border-blue-900/20 rounded shadow-xl flex flex-col h-fit">
                <h3 className="text-blue-600 font-bold text-lg mb-6 flex items-center gap-2"><span>🔨</span> 炼器坊</h3>
                <div className="bg-[#12161a] p-5 rounded border border-blue-900/30 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest shrink-0 mr-4">当前坊主</p>
                        <select className="bg-[#1a1c2c] border border-blue-900/40 px-2 py-1 rounded text-blue-400 outline-none text-[10px] font-bold min-w-[120px] shadow-sm hover:border-blue-600 transition-colors" 
                            onChange={(e) => onAssignBuilding(building.id, e.target.value || null)} 
                            value={building.assignedMemberId || ''}>
                            <option value="">- 轮空 -</option>
                            {aliveMembers
                                .filter(m => m.realm !== Realm.Mortal && m.talents.百艺天赋.炼器 > 0 && (!alreadyAssignedIds.includes(m.id) || m.id === building.assignedMemberId))
                                .sort((a, b) => {
                                    if (b.proficiencies.炼器 !== a.proficiencies.炼器) return b.proficiencies.炼器 - a.proficiencies.炼器;
                                    const realmA = REALM_ORDER.indexOf(a.realm);
                                    const realmB = REALM_ORDER.indexOf(b.realm);
                                    if (realmB !== realmA) return realmB - realmA;
                                    return b.subRealm - a.subRealm;
                                })
                                .map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} · {getArtisanTitle('炼器', m.proficiencies.炼器)} 
                                </option>
                            ))}
                        </select>
                    </div>
                    {assignedSmith ? (
                        <div className="animate-fade-in">
                            <p className="text-yellow-500 font-black text-2xl tracking-tighter">{assignedSmith.name}</p>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-blue-600 text-[13px] font-bold">{getArtisanTitle('炼器', assignedSmith.proficiencies.炼器)}</p>
                                <p className="text-[10px] text-gray-500 font-mono">熟练度 {assignedSmith.proficiencies.炼器}</p>
                            </div>
                        </div>
                    ) : <p className="italic text-gray-700 py-10 text-center border border-dashed border-blue-900/20 rounded text-[13px]">暂未任命</p>}
                </div>

                {building.activeProduction ? (
                    <div className="bg-blue-900/10 border border-blue-500/20 p-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-blue-400 text-[11px] font-bold">炼制中... (共 {building.activeProduction.batchCount || 1} 次)</span>
                            <span className="text-gray-500 text-[10px] font-mono">余 {building.activeProduction.turnsRemaining} 岁时</span>
                        </div>
                        <p className="text-yellow-100 font-bold text-sm mb-3">
                            {currentProductionRecipe?.name.replace('器谱', '')}
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsAbortConfirmVisible(true)}
                                className="flex-1 py-2 bg-red-900/20 border border-red-900/40 text-red-500 text-[10px] font-bold rounded hover:bg-red-900/40 transition-all font-black tracking-widest"
                            >
                                中止炼制
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded mb-6">
                        <p className="text-gray-600 text-[11px] italic">地火待命阶段</p>
                    </div>
                )}

                {/* 库存概览 */}
                <div className="mt-auto pt-6 border-t border-blue-900/20">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">核心矿石库存</h4>
                        <span className="text-[9px] text-blue-600 font-mono">库 / 主</span>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                        {RECIPES.Smithing.flatMap(r => Object.keys(r.cost)).filter((v, i, a) => a.indexOf(v) === i).map(idStr => {
                            const id = parseInt(idStr);
                            const { clanQty, masterQty, total } = getMineralQty(id);
                            if (total === 0) return null;
                            const detail = ALL_ITEM_DETAILS[id] as any;
                            return (
                                <div key={id} className="flex justify-between items-center text-[11px] group">
                                    <span className="text-gray-400 group-hover:text-yellow-500 transition-colors">{detail?.name || '未知'}</span>
                                    <div className="flex gap-2 font-mono">
                                        <span className="text-emerald-600/80">{clanQty}</span>
                                        <span className="text-gray-600">/</span>
                                        <span className="text-blue-600/80">{masterQty}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {RECIPES.Smithing.flatMap(r => Object.keys(r.cost)).filter((v, i, a) => a.indexOf(v) === i).every(id => getMineralQty(parseInt(id)).total === 0) && (
                            <p className="text-center py-4 text-gray-700 text-[10px] italic">暂无相关矿石</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 中止确认弹窗 */}
            {isAbortConfirmVisible && (
                <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#12161a] border-2 border-red-900/40 p-8 rounded shadow-2xl max-w-xs w-full text-center">
                        <p className="text-red-500 font-bold mb-6">确定要中止当前的炼制吗？</p>
                        <p className="text-gray-500 text-xs mb-8">中止后将立即结束本次炼制，未完成的部分将不会产出且投入的矿石无法收回。</p>
                        <div className="flex gap-4">
                            <button onClick={() => setIsAbortConfirmVisible(false)} className="flex-1 py-2 bg-gray-800 text-gray-400 rounded text-xs">取消</button>
                            <button onClick={handleAbortSmithing} className="flex-1 py-2 bg-red-900 text-red-100 rounded text-xs font-bold">确定中止</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* 右侧：器谱库与物产 */}
            <div className="flex-1 bg-black/40 border border-white/5 rounded-xl flex flex-col overflow-hidden" onClick={() => { setSelectedRecipeId(null); setBatchCount(1); }}>
                <div className="flex justify-between items-center px-6 pt-4 border-b border-white/5">
                    <div className="flex gap-6">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setActiveRightTab('recipes'); }}
                            className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeRightTab === 'recipes' ? 'text-blue-500 border-blue-500' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
                        >
                            器谱秘卷
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setActiveRightTab('materials'); }}
                            className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeRightTab === 'materials' ? 'text-blue-500 border-blue-500' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
                        >
                            矿石产出
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {activeRightTab === 'recipes' ? (
                        <div className="space-y-8">
                            {/* 族库器谱 */}
                            {recipeGroups.clan.length > 0 && (
                                <div>
                                    <h5 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        家族公有 (族库)
                                    </h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {recipeGroups.clan.map(r => renderRecipeCard(r))}
                                    </div>
                                </div>
                            )}

                            {/* 堂主器谱 */}
                            {recipeGroups.master.length > 0 && (
                                <div>
                                    <h5 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        堂主私藏 (携带)
                                    </h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {recipeGroups.master.map(r => renderRecipeCard(r))}
                                    </div>
                                </div>
                            )}

                            {/* 其他族人 */}
                            {recipeGroups.others.length > 0 && (
                                <div>
                                    <h5 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                                        其他族人 (需收回方可炼制)
                                    </h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 opacity-50 grayscale">
                                        {recipeGroups.others.map(r => renderRecipeCard(r))}
                                    </div>
                                </div>
                            )}

                            {availableRecipesCount === 0 && (
                                <div className="h-40 flex flex-col items-center justify-center text-gray-700 italic gap-2">
                                    <span className="text-4xl opacity-10">⚒️</span>
                                    <p className="text-[11px]">族中目前暂未收集到器谱秘籍</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                {Object.keys(ALL_ITEM_DETAILS).filter(id => (ALL_ITEM_DETAILS as any)[id].category === 'mineral').map(idStr => {
                                    const id = parseInt(idStr);
                                    const { clanQty, masterQty, total } = getMineralQty(id);
                                    if (total === 0) return null;
                                    const detail = ALL_ITEM_DETAILS[id] as any;
                                    const style = getGradeStyle(detail.grade);
                                    
                                    return (
                                        <div key={id} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded hover:bg-white/5 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded flex items-center justify-center text-xl ${style.bg} ${style.border} border`}>⚒️</div>
                                                <div>
                                                    <p className={`text-[13px] font-bold ${style.text}`}>{detail.name}</p>
                                                    <p className="text-[10px] text-gray-600">{detail.gradeText}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-6 text-right">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">族库</span>
                                                    <span className="text-emerald-500 font-mono font-bold text-sm">{clanQty}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">堂主</span>
                                                    <span className="text-blue-500 font-mono font-bold text-sm">{masterQty}</span>
                                                </div>
                                                <div className="flex flex-col border-l border-white/5 pl-6">
                                                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">累计</span>
                                                    <span className="text-yellow-600 font-mono font-bold text-sm">{total}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 炼器确认弹窗 */}
            {selectedRecipe && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedRecipeId(null)}>
                    <div className="bg-[#12161a] border-4 border-blue-900/40 p-8 rounded-sm shadow-2xl max-w-sm w-full text-center animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-2xl font-cursive text-blue-500 mb-6 tracking-widest">开 炉 炼 器</h4>
                        
                        <div className="bg-black/60 p-6 rounded border border-white/5 mb-8 text-left space-y-4">
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">拟炼灵宝</p>
                                {(() => {
                                    const modalStyle = getGradeStyle(selectedRecipe.grade);
                                    return (
                                        <p className={`font-bold text-lg ${modalStyle.text} ${modalStyle.shadow}`}>
                                            {selectedRecipe.name.replace('器谱', '')}
                                        </p>
                                    );
                                })()}
                            </div>

                            <div className="pt-2 border-t border-white/5">
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">炼制次数</p>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" min="1" max="10" step="1" 
                                        value={batchCount} 
                                        onChange={(e) => setBatchCount(parseInt(e.target.value))}
                                        className="flex-1 accent-blue-600"
                                    />
                                    <span className="text-yellow-500 font-mono font-bold w-8 text-center">{batchCount}</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">累计消耗</p>
                                <div className="space-y-1.5">
                                    {Object.entries(selectedRecipe.cost).map(([id, qty]) => {
                                        const detail = ALL_ITEM_DETAILS[parseInt(id)] as any;
                                        const itemId = parseInt(id);
                                        const totalQty = (qty as number) * batchCount;
                                        const { clanQty, masterQty, total } = getMineralQty(itemId);
                                        const hasEnough = total >= totalQty;
                                        
                                        return (
                                            <div key={id} className="border-b border-white/5 pb-1 last:border-0">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-gray-400">{detail?.name || '未知矿石'}</span>
                                                    <span className={`font-mono ${hasEnough ? 'text-green-500' : 'text-red-500 font-bold'}`}>
                                                        {total} / {totalQty}
                                                    </span>
                                                </div>
                                                <div className="flex justify-end gap-2 text-[9px] text-gray-600 font-mono">
                                                    <span>库:{clanQty}</span>
                                                    <span>主:{masterQty}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-gray-300 text-[11px]">所需品级</span>
                                <span className={`${isRankSufficient ? 'text-green-500' : 'text-red-500'} font-bold font-mono`}>
                                   {selectedRecipe.grade === 0 ? "炼器学徒": `${selectedRecipe.grade}品炼器师`}
                                </span>
                            </div>

                            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-gray-300 text-[11px]">累计岁时</span>
                                <span className="text-yellow-500 font-bold font-mono text-base">
                                    {((selectedRecipe as any).turns || 1) * batchCount} 载
                                </span>
                            </div>
                        </div>

                        {!assignedSmith && (
                            <p className="text-red-500 text-[10px] mb-4 font-bold">※ 必须任命坊主方可炼制</p>
                        )}

                        {assignedSmith && !isRankSufficient && (
                            <p className="text-red-500 text-[10px] mb-4 font-bold">※ 当前坊主炼器造诣不足，无法炼制此宝</p>
                        )}

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setSelectedRecipeId(null)}
                                className="flex-1 py-2.5 bg-black/40 border border-blue-900/40 text-gray-500 rounded font-bold hover:text-gray-300 transition-all text-xs"
                            >取消</button>
                            <button 
                                onClick={handleStartSmithing}
                                disabled={!assignedSmith || !checkResources(selectedRecipe, batchCount) || !isRankSufficient}
                                className={`flex-1 py-2.5 rounded font-bold transition-all shadow-xl text-xs border border-blue-500/30 ${assignedSmith && checkResources(selectedRecipe, batchCount) && isRankSufficient ? 'bg-blue-900/80 text-blue-100 hover:bg-blue-800' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                            >开启炼制</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmithyTab;
