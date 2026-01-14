
import React, { useState, useMemo } from 'react';
import { ClanMember, GameState, MethodType, CultivationMethod, RootGrade } from '../../../types';
import { CULTIVATION_METHODS, REALM_ORDER } from '../../../constants';
import { SlotItem } from '../Shared/UIComponents';
import { getGradeStyle, getElementName } from '../Shared/utils';

interface Props {
    member: ClanMember;
    state: GameState;
    onToggleMethod: (methodId: number, type: MethodType) => void;
    showMethodTooltip: (e: React.MouseEvent, method: CultivationMethod) => void;
    hideTooltip: () => void;
}

type LibraryFilter = MethodType | 'All';
type SortKey = 'grade' | 'name';

const CultivationTab: React.FC<Props> = ({ member, state, onToggleMethod, showMethodTooltip, hideTooltip }) => {
    const [libraryType, setLibraryType] = useState<LibraryFilter>('All');
    const [sortKey, setSortKey] = useState<SortKey>('grade');
    const [focusedSlot, setFocusedSlot] = useState<string | null>(null);
    const [selectedLibraryMethodId, setSelectedLibraryMethodId] = useState<number | null>(null);

    const checkMethodRequirements = (m: CultivationMethod) => {
        const req = m.requirements;
        if (!req) return { met: true, missing: [] };
        
        const missing: string[] = [];
        
        if (req.realm && REALM_ORDER.indexOf(member.realm) < REALM_ORDER.indexOf(req.realm)) {
            missing.push(`境界需达${req.realm}`);
        }
        
        if (req.minRootGrade) {
            const grades: RootGrade[] = ['凡人', '伪灵根', '下品灵根', '中品灵根', '上品灵根', '极品灵根'];
            if (grades.indexOf(member.rootGrade) < grades.indexOf(req.minRootGrade)) {
                missing.push(`灵根品质不足`);
            }
        }

        if (req.minRoots) {
            Object.entries(req.minRoots).forEach(([el, val]) => {
                const memberVal = (member.roots as any)[el] || 0;
                if (memberVal < (val as number)) {
                    missing.push(`${getElementName(el)}系不足`);
                }
            });
        }

        return { met: missing.length === 0, missing };
    };

    const libraryMethods = useMemo(() => {
        const filtered = CULTIVATION_METHODS.filter(m => {
            if (libraryType !== 'All' && m.type !== libraryType) return false;
          
            const isOwnedBySelf = (member.personalInventory.methods[m.id] || 0) > 0;
            const isEquipped = member.mainMethodId === m.id || member.movementMethodId === m.id || member.auxMethodIds.includes(m.id);
            return isOwnedBySelf || isEquipped;
        });

        return filtered.sort((a, b) => {
            if (sortKey === 'grade') return b.grade - a.grade;
            return a.name.localeCompare(b.name, 'zh-CN');
        });
    }, [libraryType, sortKey, member, state.inventory.methods]);

    const handleLibraryClick = (m: CultivationMethod) => {
        if (selectedLibraryMethodId === m.id) {
            setSelectedLibraryMethodId(null);
        } else {
            setSelectedLibraryMethodId(m.id);
            setFocusedSlot(null);
        }
    };

    const handleEquippedSlotClick = (slotId: string) => {
        if (focusedSlot === slotId) {
            setFocusedSlot(null);
        } else {
            setFocusedSlot(slotId);
            setSelectedLibraryMethodId(null);
        }
    };

    const handleCultivateSelected = () => {
        if (selectedLibraryMethodId === null) return;
        const method = CULTIVATION_METHODS.find(m => m.id === selectedLibraryMethodId);
        if (!method) return;
        const { met } = checkMethodRequirements(method);
        if (!met) return;
        onToggleMethod(method.id, method.type);
        setSelectedLibraryMethodId(null);
    };

    const selectedMethodDetails = useMemo(() => {
        if (selectedLibraryMethodId === null) return null;
        return CULTIVATION_METHODS.find(m => m.id === selectedLibraryMethodId);
    }, [selectedLibraryMethodId]);

    const isAlreadyEquipped = useMemo(() => {
        if (!selectedMethodDetails) return false;
        return member.mainMethodId === selectedMethodDetails.id || 
               member.movementMethodId === selectedMethodDetails.id || 
               member.auxMethodIds.includes(selectedMethodDetails.id);
    }, [selectedMethodDetails, member]);

    return (
        <div className="h-full flex flex-col min-h-0 overflow-hidden animate-fade-in" onClick={() => { setFocusedSlot(null); setSelectedLibraryMethodId(null); }}>
            {/* 上部：已装备槽位 */}
            <div className="shrink-0 py-6 bg-black/20 rounded-xl border border-white/5 shadow-2xl overflow-hidden mb-4" onClick={(e) => e.stopPropagation()}>
                <div className="relative grid grid-cols-3 gap-x-12 gap-y-4 z-10 items-center max-w-lg mx-auto">
                    <div className="flex flex-col gap-4">
                        <SlotItem methodId={member.auxMethodIds[0] || null} type="Combat" label="辅修I" isFocused={focusedSlot === 'aux0'} onClick={() => handleEquippedSlotClick('aux0')} onMouseEnter={(e) => member.auxMethodIds[0] && showMethodTooltip(e, CULTIVATION_METHODS.find(m => m.id === member.auxMethodIds[0])!)} onMouseLeave={hideTooltip} onUnequip={() => onToggleMethod(member.auxMethodIds[0], 'Combat')} />
                        <SlotItem methodId={member.auxMethodIds[1] || null} type="Combat" label="辅修II" isFocused={focusedSlot === 'aux1'} onClick={() => handleEquippedSlotClick('aux1')} onMouseEnter={(e) => member.auxMethodIds[1] && showMethodTooltip(e, CULTIVATION_METHODS.find(m => m.id === member.auxMethodIds[1])!)} onMouseLeave={hideTooltip} onUnequip={() => onToggleMethod(member.auxMethodIds[1], 'Combat')} />
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <SlotItem methodId={member.movementMethodId} type="Movement" label="遁术" isFocused={focusedSlot === 'mov'} onClick={() => handleEquippedSlotClick('mov')} onMouseEnter={(e) => member.movementMethodId && showMethodTooltip(e, CULTIVATION_METHODS.find(m => m.id === member.movementMethodId)!)} onMouseLeave={hideTooltip} onUnequip={() => onToggleMethod(member.movementMethodId!, 'Movement')} />
                        <div className="w-16 h-10 rounded-full bg-yellow-900/5 border border-yellow-500/10 flex items-center justify-center relative">
                            <span className="text-xl opacity-20">🧘</span>
                        </div>
                        <SlotItem methodId={member.mainMethodId} type="Cultivation" label="主修" isFocused={focusedSlot === 'main'} onClick={() => handleEquippedSlotClick('main')} onMouseEnter={(e) => member.mainMethodId && showMethodTooltip(e, CULTIVATION_METHODS.find(m => m.id === member.mainMethodId)!)} onMouseLeave={hideTooltip} onUnequip={() => onToggleMethod(member.mainMethodId!, 'Cultivation')} />
                    </div>
                    <div className="flex flex-col gap-4">
                        <SlotItem methodId={member.auxMethodIds[2] || null} type="Combat" label="辅修III" isFocused={focusedSlot === 'aux2'} onClick={() => handleEquippedSlotClick('aux2')} onMouseEnter={(e) => member.auxMethodIds[2] && showMethodTooltip(e, CULTIVATION_METHODS.find(m => m.id === member.auxMethodIds[2])!)} onMouseLeave={hideTooltip} onUnequip={() => onToggleMethod(member.auxMethodIds[2], 'Combat')} />
                        <SlotItem methodId={member.auxMethodIds[3] || null} type="Combat" label="辅修IV" isFocused={focusedSlot === 'aux3'} onClick={() => handleEquippedSlotClick('aux3')} onMouseEnter={(e) => member.auxMethodIds[3] && showMethodTooltip(e, CULTIVATION_METHODS.find(m => m.id === member.auxMethodIds[3])!)} onMouseLeave={hideTooltip} onUnequip={() => onToggleMethod(member.auxMethodIds[3], 'Combat')} />
                    </div>
                </div>
            </div>

            {/* 下部：背包功法区域 */}
            <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col min-h-0" onClick={(e) => e.stopPropagation()}>
                {/* 标题栏与控制区 */}
                <div className="flex flex-col gap-4 mb-4 border-b border-white/10 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <h5 className="text-base text-gray-200 font-bold tracking-[0.2em] font-cursive whitespace-nowrap">功法</h5>
                        </div>
                        
                        {/* 筛选按钮组 */}
                        <div className="flex bg-black/60 p-1 rounded border border-white/10">
                            {[
                                { id: 'All', label: '全部' },
                                { id: 'Cultivation', label: '修行' },
                                { id: 'Combat', label: '战斗' },
                                { id: 'Movement', label: '遁术' }
                            ].map(t => (
                                <button 
                                    key={t.id} 
                                    onClick={() => setLibraryType(t.id as any)} 
                                    className={`px-4 py-1 text-[11px] font-bold transition-all rounded whitespace-nowrap ${libraryType === t.id ? 'bg-yellow-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 排序与次级信息 */}
                    <div className="flex items-center justify-end">
                        <div className="bg-black/40 px-3 py-1 rounded border border-white/10 flex items-center gap-3">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">排序</span>
                            <select 
                                value={sortKey}
                                onChange={(e) => setSortKey(e.target.value as SortKey)}
                                className="bg-bg-main text-[11px] text-yellow-600 outline-none font-bold cursor-pointer hover:text-yellow-400"
                            >
                                <option value="grade">按品级</option>
                                <option value="name">按名称</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 滚动网格区域 */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-6 pb-4 px-1 items-start">
                        {libraryMethods.map(m => {
                            const isEquipped = member.mainMethodId === m.id || member.movementMethodId === m.id || member.auxMethodIds.includes(m.id);
                            const { met, missing } = checkMethodRequirements(m);
                            const isSelected = selectedLibraryMethodId === m.id;
                            
                            // Safe style check
                            const style = getGradeStyle(m?.grade || 0);

                            return (
                                <div key={m.id} className="flex flex-col">
                                    <div 
                                        onClick={() => handleLibraryClick(m)} 
                                        onMouseEnter={(e) => showMethodTooltip(e, m)} 
                                        onMouseLeave={hideTooltip} 
                                        className={`p-3 rounded border transition-all cursor-pointer relative flex flex-col items-center justify-between aspect-[3/4] shadow-md group 
                                            ${style.bg} ${style.border}
                                            ${isSelected ? 'ring-2 ring-yellow-400 scale-105 z-10 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : ''}
                                            ${isEquipped ? 'grayscale-[0.8] brightness-50' : (!met ? 'grayscale-[0.9] brightness-[0.3]' : 'hover:scale-[1.02] hover:brightness-110')}
                                        `}
                                    >
                                        <div className="text-2xl mt-1 opacity-80 drop-shadow-md">📖</div>
                                        <div className="text-center mt-auto w-full pb-1">
                                            <p className={`text-[11px] font-bold leading-tight truncate px-0.5 drop-shadow-sm ${style.text}`}>{m.name}</p>
                                        </div>
                                        
                                        {isEquipped && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 backdrop-blur-[1px]">
                                                <div className="bg-black/90 text-gray-400 text-[10px] px-3 py-1 rounded-sm border border-gray-700 rotate-[-12deg] font-bold shadow-2xl">已修习</div>
                                            </div>
                                        )}
                                        
                                        {!isEquipped && !met && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                                                <span className="text-gray-500 text-[9px] font-bold mb-1">未达要求</span>
                                                <div className="bg-red-950/40 border border-red-900/40 rounded-sm px-1 py-0.5">
                                                    <span className="text-red-700 text-[8px] leading-tight font-bold">{missing[0] || '条件不足'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {isSelected && !isEquipped && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleCultivateSelected(); }}
                                            className={`mt-[7px] w-full py-1.5 rounded border font-bold text-[10px] animate-fade-in transition-all flex items-center justify-center gap-1 shadow-lg
                                                ${met 
                                                    ? 'bg-yellow-900/60 border-yellow-500 text-yellow-400 hover:bg-yellow-800' 
                                                    : 'bg-red-950/40 border-red-900/40 text-red-700 cursor-not-allowed'}`}
                                            disabled={!met}
                                        >
                                            修炼
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {libraryMethods.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-700 italic py-16 gap-2">
                            <span className="text-4xl opacity-10 grayscale">📖</span>
                            <p className="text-[11px] font-bold">暂无可用功法</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CultivationTab;
