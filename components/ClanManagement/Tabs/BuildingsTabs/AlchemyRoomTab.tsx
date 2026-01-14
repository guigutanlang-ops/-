
import React, { useState, useMemo } from 'react';
import { ClanMember, Building, Realm, Inventory } from '../../../../types';
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
    showTooltip: (e: React.MouseEvent, content: React.ReactNode) => void;
    hideTooltip: () => void;
}

const AlchemyRoomTab: React.FC<Props> = ({ building, members, inventory, alreadyAssignedIds, onAssignBuilding, onUpdateBuilding, onUpdateInventory, showTooltip, hideTooltip }) => {
    const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);

    const aliveMembers = members.filter(m => m.status !== 'dead' && m.family === '望月李氏');
    const assignedAlchemist = aliveMembers.find(m => m.id === building.assignedMemberId);

    const availableRecipes = useMemo(() => {
        return RECIPES.Alchemy.filter(r => (inventory.scrolls[r.id] || 0) > 0);
    }, [inventory.scrolls]);

    const selectedRecipe = useMemo(() => {
        return RECIPES.Alchemy.find(r => r.id === selectedRecipeId);
    }, [selectedRecipeId]);

    // 获取职业等级数值 (1-9)
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
        const rank = assignedAlchemist ? getArtisanRank(assignedAlchemist.proficiencies.炼丹) : 0;
        return rank >= selectedRecipe.grade;
    }, [assignedAlchemist, selectedRecipe]);

    const checkResources = (recipe: any) => {
        return Object.entries(recipe.cost).every(([id, qty]) => {
            return (inventory.herbs[parseInt(id)] || 0) >= (qty as number);
        });
    };

    // 计算预期熟练度收益
    const getExpectedProficiency = (recipe: any) => {
        const base = recipe.grade === 0 ? 2 : recipe.grade * 10;
        return base * (recipe.turns || 1);
    };

    const handleStartAlchemy = () => {
        if (!selectedRecipe || !assignedAlchemist) return;
        if (!checkResources(selectedRecipe)) return;

        const newHerbs = { ...inventory.herbs };
        Object.entries(selectedRecipe.cost).forEach(([id, qty]) => {
            const itemId = parseInt(id);
            newHerbs[itemId] -= (qty as number);
            if (newHerbs[itemId] <= 0) delete newHerbs[itemId];
        });

        onUpdateInventory({ herbs: newHerbs });
        onUpdateBuilding(building.id, {
            activeProduction: {
                recipeId: selectedRecipe.id,
                turnsRemaining: (selectedRecipe as any).turns || 1,
                type: 'Alchemy'
            }
        });
        setSelectedRecipeId(null);
    };

    const handleCancelAlchemy = () => {
        onUpdateBuilding(building.id, { activeProduction: undefined });
    };

    const currentProductionRecipe = building.activeProduction 
        ? RECIPES.Alchemy.find(r => r.id === building.activeProduction!.recipeId) 
        : null;

    return (
        <div className="flex gap-8 h-full animate-fade-in max-w-5xl mx-auto">
            {/* 左侧：人员与状态 */}
            <div className="w-80 p-6 bg-black/40 border border-pink-900/20 rounded shadow-xl flex flex-col h-fit">
                <h3 className="text-pink-600 font-bold text-lg mb-6 flex items-center gap-2"><span>⚗️</span> 丹鼎堂</h3>
                <div className="bg-[#1a1215] p-5 rounded border border-pink-900/30 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest shrink-0 mr-4">当前堂主</p>
                        <select className="bg-[#2c1810] border border-yellow-900/40 px-2 py-1 rounded text-yellow-500 outline-none text-[10px] font-bold min-w-[120px] shadow-sm hover:border-yellow-600 transition-colors" 
                            onChange={(e) => onAssignBuilding(building.id, e.target.value || null)} 
                            value={building.assignedMemberId || ''}>
                            <option value="">- 轮空 -</option>
                            {aliveMembers
                                .filter(m => m.realm !== Realm.Mortal && m.talents.百艺天赋.炼丹 > 0 && (!alreadyAssignedIds.includes(m.id) || m.id === building.assignedMemberId))
                                .sort((a, b) => {
                                    if (b.proficiencies.炼丹 !== a.proficiencies.炼丹) return b.proficiencies.炼丹 - a.proficiencies.炼丹;
                                    const realmA = REALM_ORDER.indexOf(a.realm);
                                    const realmB = REALM_ORDER.indexOf(b.realm);
                                    if (realmB !== realmA) return realmB - realmA;
                                    return b.subRealm - a.subRealm;
                                })
                                .map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} · {getArtisanTitle('炼丹', m.proficiencies.炼丹)} 
                                </option>
                            ))}
                        </select>
                    </div>
                    {assignedAlchemist ? (
                        <div className="animate-fade-in">
                            <p className="text-yellow-500 font-black text-2xl tracking-tighter">{assignedAlchemist.name}</p>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-pink-600 text-[13px] font-bold">{getArtisanTitle('炼丹', assignedAlchemist.proficiencies.炼丹)}</p>
                                <p className="text-[10px] text-gray-300 font-mono">熟练度 {assignedAlchemist.proficiencies.炼丹}</p>
                            </div>
                        </div>
                    ) : <p className="italic text-gray-700 py-10 text-center border border-dashed border-pink-900/20 rounded text-[13px]">暂未任命</p>}
                </div>

                {building.activeProduction ? (
                    <div className="bg-pink-900/10 border border-pink-500/20 p-4 ">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-pink-400 text-[11px] font-bold">炼制中...</span>
                            <span className="text-gray-500 text-[10px] font-mono">余 {building.activeProduction.turnsRemaining} 岁时</span>
                        </div>
                        <p className="text-yellow-100 font-bold text-sm mb-3">
                            {currentProductionRecipe?.name.replace('丹方', '')}
                        </p>
                        <button 
                            onClick={handleCancelAlchemy}
                            className="w-full py-2 bg-red-900/20 border border-red-900/40 text-red-500 text-[10px] font-bold rounded hover:bg-red-900/40 transition-all"
                        >
                            废止炼制
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded">
                        <p className="text-gray-600 text-[11px] italic">丹炉待机中</p>
                    </div>
                )}
            </div>
            
            {/* 右侧：丹方库 */}
            <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-6 flex flex-col overflow-hidden" onClick={() => setSelectedRecipeId(null)}>
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                    <h4 className="text-pink-500 text-sm font-bold flex items-center gap-2">
                        <span>📜</span> 家族炼丹配方
                    </h4>
                    <span className="text-[10px] text-gray-500 font-mono">已掌握：{availableRecipes.length} 卷</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {availableRecipes.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-1">
                            {availableRecipes.map(r => {
                                const style = getGradeStyle(r.grade);
                                const isFocused = selectedRecipeId === r.id;
                                const isDisabled = !!building.activeProduction;
                                
                                return (
                                    <div key={r.id} className="flex flex-col gap-2">
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); !isDisabled && setSelectedRecipeId(isFocused ? null : r.id); }}
                                            onMouseEnter={(e) => showTooltip(e, renderItemContent(r.id))}
                                            onMouseLeave={hideTooltip}
                                            className={`${style.bg} border-2 ${isFocused ? 'border-yellow-500 scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.2)]' : style.border} p-3 rounded-lg flex flex-col items-center group transition-all aspect-[4/5] justify-between shadow-lg relative overflow-hidden ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}`}
                                        >
                                            <div className={`text-3xl mt-2 group-hover:scale-110 transition-transform ${style.shadow}`}>📜</div>
                                            <span className={`text-[11px] font-bold text-center truncate w-full mt-2 px-1 ${style.text} ${style.shadow}`}>{r.name}</span>
                                            <div className="absolute top-1 right-1">
                                                <span className={`text-[7px] font-bold px-1 rounded-sm border ${style.border} ${style.text} bg-black/60`}>{r.grade === 0 ? '凡品' : r.grade + '品'}</span>
                                            </div>
                                            <div className="mt-auto">
                                                <span className="text-[9px] text-pink-500/50 font-bold uppercase tracking-widest">炼丹配方</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-700 italic gap-2">
                            <span className="text-4xl opacity-10">📖</span>
                            <p className="text-[11px]">族中目前暂未收集到丹方残卷</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 炼丹确认弹窗 */}
            {selectedRecipe && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1a1215] border-4 border-pink-900/40 p-8 rounded-sm shadow-2xl max-w-sm w-full text-center animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-2xl font-cursive text-pink-500 mb-6 tracking-widest">开 炉 炼 丹</h4>
                        
                        <div className="bg-black/60 p-6 rounded border border-white/5 mb-8 text-left space-y-4">
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">拟炼丹药</p>
                                {(() => {
                                    const modalStyle = getGradeStyle(selectedRecipe.grade);
                                    return (
                                        <p className={`font-bold text-lg ${modalStyle.text} ${modalStyle.shadow}`}>
                                            {selectedRecipe.name.replace('丹方', '')}
                                        </p>
                                    );
                                })()}
                            </div>

                            <div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">消耗药材</p>
                                <div className="space-y-1.5">
                                    {Object.entries(selectedRecipe.cost).map(([id, qty]) => {
                                        const detail = ALL_ITEM_DETAILS[parseInt(id)] as any;
                                        const hasEnough = (inventory.herbs[parseInt(id)] || 0) >= (qty as number);
                                        return (
                                            <div key={id} className="flex justify-between text-[11px]">
                                                <span className="text-gray-400">{detail?.name || '未知药材'}</span>
                                                <span className={`font-mono ${hasEnough ? 'text-green-500' : 'text-red-500 font-bold'}`}>
                                                    {inventory.herbs[parseInt(id)] || 0} / {qty as number}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-gray-300 text-[11px]">所需品级</span>
                                <span className={`${isRankSufficient ? 'text-green-500' : 'text-red-500'} font-bold font-mono`}>
                                   {selectedRecipe.grade === 0 ? "炼丹学徒": `${selectedRecipe.grade}品炼丹师`}
                                </span>
                            </div>


                            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-gray-300 text-[11px]">所需岁时</span>
                                <span className="text-gray-300 font-bold font-mono">{(selectedRecipe as any).turns || 1} 载</span>
                            </div>
                        </div>

                        {!assignedAlchemist && (
                            <p className="text-red-500 text-[10px] mb-4 font-bold">※ 必须任命堂主方可炼制</p>
                        )}

                        {assignedAlchemist && !isRankSufficient && (
                            <p className="text-red-500 text-[10px] mb-4 font-bold">※ 当前堂主炼丹造诣不足，无法炼制此丹</p>
                        )}

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setSelectedRecipeId(null)}
                                className="flex-1 py-2.5 bg-black/40 border border-pink-900/40 text-gray-500 rounded font-bold hover:text-gray-300 transition-all text-xs"
                            >取消</button>
                            <button 
                                onClick={handleStartAlchemy}
                                disabled={!assignedAlchemist || !checkResources(selectedRecipe) || !isRankSufficient}
                                className={`flex-1 py-2.5 rounded font-bold transition-all shadow-xl text-xs border border-pink-500/30 ${assignedAlchemist && checkResources(selectedRecipe) && isRankSufficient ? 'bg-pink-900/80 text-pink-100 hover:bg-pink-800' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                            >开始炼制</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlchemyRoomTab;
