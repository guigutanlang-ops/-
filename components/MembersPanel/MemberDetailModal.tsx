
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ClanMember, GameState, Realm, MethodType, CultivationMethod, TaskType, DevelopmentPlan } from '../../types';
import { NamePlaque, EquipSlot } from './Shared/UIComponents';
import { getRealmText, getRealmStyle } from './Shared/utils';
import { REALM_ORDER, PILL_DETAILS, CULTIVATION_METHODS } from '../../constants';
import { getRequiredExp } from '../Xiulian/CultivationSystem';

import AttributeTab from './Tabs/AttributeTab';
import TalentTab from './Tabs/TalentTab';
import RelationTab from './Tabs/RelationTab';
import CultivationTab from './Tabs/CultivationTab';
import BagTab from './Tabs/BagTab';

interface Props {
    member: ClanMember;
    state: GameState;
    onClose: () => void;
    onUpdateMember: (id: string, updates: Partial<ClanMember>) => void;
    onOpenBreakthrough: (id: string) => void;
    onSelectMember: (id: string) => void;
    onContributeItem?: (memberId: string, itemId: number, category: string, quantity: number) => void;
    showTooltip: (e: React.MouseEvent, content: React.ReactNode) => void;
    hideTooltip: () => void;
    renderPhysiqueTooltip: (physique: string) => React.ReactNode;
    renderItemTooltip: (id: number) => React.ReactNode;
    renderMethodTooltip: (method: CultivationMethod) => React.ReactNode;
}

const MemberDetailModal: React.FC<Props> = (props) => {
    const { member, state, onClose, onOpenBreakthrough, onUpdateMember, onSelectMember, onContributeItem, showTooltip, hideTooltip, renderPhysiqueTooltip, renderItemTooltip, renderMethodTooltip } = props;
    const [detailTab, setDetailTab] = useState('attr');
    const [focusedEquipSlot, setFocusedEquipSlot] = useState<string | null>(null);

    const isMortal = member.realm === Realm.Mortal;
    const portalRoot = document.getElementById('portal-root');

    // 根据身份定义可用标签
    const tabs = useMemo(() => {
        const allTabs = [
            { id: 'attr', name: '👤 属性' },
            { id: 'talents', name: '📜 天赋' },
            { id: 'relations', name: '🤝 关系' },
            { id: 'cultivation', name: '🌀 功法' },
            { id: 'bag', name: '🎒 行囊' },
        ];
        
        if (isMortal) {
            // 凡人只展示：属性、关系、行囊
            return allTabs.filter(t => ['attr', 'relations', 'bag'].includes(t.id));
        }
        return allTabs;
    }, [isMortal]);

    // 当切换人物或身份变化时，确保当前选中的 tab 是合法的
    useEffect(() => {
        if (!tabs.find(t => t.id === detailTab)) {
            setDetailTab('attr');
        }
    }, [member.id, tabs, detailTab]);

    const isBreakthroughNeeded = () => {
        const realmIdx = REALM_ORDER.indexOf(member.realm);
        const req = getRequiredExp(realmIdx, member.subRealm);
        return member.subRealm === 9 && member.cultivationProgress >= req && member.realm !== Realm.YuanShen;
    };

    const requiredExp = getRequiredExp(REALM_ORDER.indexOf(member.realm), member.subRealm);
    const progressPercent = Math.min(100, (member.cultivationProgress / requiredExp) * 100);

    const handleUnequip = (slot: keyof ClanMember['equippedItems']) => {
        const itemId = member.equippedItems[slot];
        if (itemId === null) return;
        const newEquipped = { ...member.equippedItems, [slot]: null };
        const newInventory = { ...member.personalInventory };
        newInventory.weapons[itemId] = (newInventory.weapons[itemId] || 0) + 1;
        onUpdateMember(member.id, { equippedItems: newEquipped, personalInventory: newInventory });
        setFocusedEquipSlot(null);
    };

    const handleEquip = (itemId: number, cat: 'weapon' | 'armor' | 'accessory' | 'treasure') => {
        const newEquipped = { ...member.equippedItems };
        const newInventory = { ...member.personalInventory };
        const currentId = newEquipped[cat];
        if (currentId !== null) newInventory.weapons[currentId] = (newInventory.weapons[currentId] || 0) + 1;
        if (newInventory.weapons[itemId] > 0) {
            newInventory.weapons[itemId]--;
            if (newInventory.weapons[itemId] === 0) delete newInventory.weapons[itemId];
        }
        newEquipped[cat] = itemId;
        onUpdateMember(member.id, { equippedItems: newEquipped, personalInventory: newInventory });
    };

    const handleToggleMethod = (methodId: number | null, type: MethodType) => {
        if (methodId === null) return;
        if (type === 'Cultivation') onUpdateMember(member.id, { mainMethodId: member.mainMethodId === methodId ? null : methodId });
        else if (type === 'Movement') onUpdateMember(member.id, { movementMethodId: member.movementMethodId === methodId ? null : methodId });
        else if (type === 'Combat') {
            const current = member.auxMethodIds;
            if (current.includes(methodId)) onUpdateMember(member.id, { auxMethodIds: current.filter(id => id !== methodId) });
            else if (current.length < 4) onUpdateMember(member.id, { auxMethodIds: [...current, methodId] });
        }
    };

    const handleUsePill = (id: number, qty: number) => {
        const data = PILL_DETAILS[id] as any;
        if (!data || (data.requiredRealm && member.realm !== data.requiredRealm)) return;
        const newInv = { ...member.personalInventory };
        if ((newInv.pills[id] || 0) < qty) return;
        newInv.pills[id] -= qty;
        if (newInv.pills[id] === 0) delete newInv.pills[id];
        const updates: Partial<ClanMember> = { personalInventory: newInv };
        if (data.effects?.cultivationProgress) updates.cultivationProgress = (member.cultivationProgress || 0) + data.effects.cultivationProgress * qty;
        if (data.effects?.maxAge) updates.maxAge = (member.maxAge || 0) + data.effects.maxAge * qty;
        onUpdateMember(member.id, updates);
    };

    const handleSlotClick = (slot: string) => {
        setFocusedEquipSlot(prev => prev === slot ? null : slot);
    };

    if (!portalRoot) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/95 p-2 sm:p-4 font-serif overflow-hidden"
            onClick={() => setFocusedEquipSlot(null)}
        >
            <div 
                className="relative w-full max-w-6xl max-h-[95vh] h-full bg-[#1a2521] border-[4px] sm:border-[12px] border-[#2c3e34] rounded-sm shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-20 sm:h-24 bg-[#141e1b] border-b border-[#2c3e34] flex items-center px-2 sm:px-8 shrink-0 pt-2">
                    <div className="flex items-center gap-1 sm:gap-2 h-full overflow-x-auto scrollbar-hide">
                        {tabs.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setDetailTab(t.id)} 
                                className={`whitespace-nowrap px-3 sm:px-4 h-full flex items-center text-[11px] sm:text-sm transition-all border-b-4 font-bold ${detailTab === t.id ? 'border-yellow-500 text-yellow-500 bg-yellow-900/10' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                    <button onClick={onClose} className="ml-auto min-w-[36px] w-9 h-9 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-full flex items-center justify-center text-xl transition-all font-bold">×</button>
                </div>

                <div className="flex-1 flex flex-col sm:flex-row overflow-hidden" onClick={() => setFocusedEquipSlot(null)}>
                    <div className="w-full sm:w-[38%] lg:w-[42%] flex flex-col items-center justify-start border-r border-[#2c3e34] p-4 sm:p-8 bg-black/10 shrink-0 pt-8 overflow-y-auto custom-scrollbar">
                        <div className="mb-8 w-full flex justify-center scale-95 sm:scale-100"><NamePlaque member={member} /></div>
                        
                        <div className="relative flex items-center justify-center gap-4 sm:gap-8 py-8 w-full" onClick={(e) => e.stopPropagation()}>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

                            <div className="flex flex-col gap-10 z-20">
                                <EquipSlot itemId={member.equippedItems.weapon} label="武器" icon="⚔️" isLeftSide isFocused={focusedEquipSlot === 'weapon'} onClick={() => handleSlotClick('weapon')} onMouseEnter={(e) => member.equippedItems.weapon && showTooltip(e, renderItemTooltip(member.equippedItems.weapon))} onMouseLeave={hideTooltip} onUnequip={() => handleUnequip('weapon')} />
                                <EquipSlot itemId={member.equippedItems.armor} label="服饰" icon="🛡️" isLeftSide isFocused={focusedEquipSlot === 'armor'} onClick={() => handleSlotClick('armor')} onMouseEnter={(e) => member.equippedItems.armor && showTooltip(e, renderItemTooltip(member.equippedItems.armor))} onMouseLeave={hideTooltip} onUnequip={() => handleUnequip('armor')} />
                            </div>

                            <div className="w-28 h-40 lg:w-44 lg:h-64 bg-black/30 rounded-full border-2 border-yellow-900/20 flex flex-col items-center justify-center relative shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] z-10">
                                <div className="text-6xl lg:text-8xl opacity-10 absolute pointer-events-none">🧘</div>
                                <div className="z-10 text-center px-2">
                                    <p className={`text-xl lg:text-3xl font-cursive font-bold drop-shadow-lg ${isBreakthroughNeeded() ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
                                        {member.realm}
                                    </p>
                                    <p className="text-[10px] lg:text-xs text-gray-400 mt-2 font-bold tracking-widest uppercase">
                                        {member.subRealm} 层
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-10 z-20">
                                <EquipSlot itemId={member.equippedItems.accessory} label="饰品" icon="💍" isLeftSide={false} isFocused={focusedEquipSlot === 'accessory'} onClick={() => handleSlotClick('accessory')} onMouseEnter={(e) => member.equippedItems.accessory && showTooltip(e, renderItemTooltip(member.equippedItems.accessory))} onMouseLeave={hideTooltip} onUnequip={() => handleUnequip('accessory')} />
                                <EquipSlot itemId={member.equippedItems.treasure} label="法宝" icon="🔮" isLeftSide={false} isFocused={focusedEquipSlot === 'treasure'} onClick={() => handleSlotClick('treasure')} onMouseEnter={(e) => member.equippedItems.treasure && showTooltip(e, renderItemTooltip(member.equippedItems.treasure))} onMouseLeave={hideTooltip} onUnequip={() => handleUnequip('treasure')} />
                            </div>
                        </div>

                        {!isMortal && (
                            <div className="w-full mt-10 px-6 py-4 bg-black/40 border border-yellow-900/10 rounded-lg shadow-xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                                <div className="flex justify-between items-end mb-3 relative z-10">
                                    <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isBreakthroughNeeded() ? 'text-red-400' : 'text-blue-400'}`}>
                                        {isBreakthroughNeeded() ? '突破之机已至' : '灵力积蓄中'}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-gray-100">
                                        {Math.floor(member.cultivationProgress)} <span className="text-gray-600">/</span> {Math.floor(requiredExp)}
                                    </span>
                                </div>
                                <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                                    <div 
                                        className={`h-full transition-all duration-1000 shadow-[0_0_12px_rgba(37,99,235,0.3)] ${isBreakthroughNeeded() ? 'bg-gradient-to-r from-red-600 to-orange-500 animate-pulse' : 'bg-gradient-to-r from-blue-700 to-blue-400'}`} 
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                {isBreakthroughNeeded() && (
                                    <p className="mt-3 text-[10px] text-red-500 text-center font-bold animate-bounce tracking-widest">
                                        叩问天门 ◈ 就在此时
                                    </p>
                                )}
                            </div>
                        )}

                        {isBreakthroughNeeded() && (
                            <button 
                                onClick={() => onOpenBreakthrough(member.id)} 
                                className="mt-8 w-full py-4 bg-gradient-to-r from-red-900 to-red-800 text-white font-bold rounded border border-red-500 text-base tracking-[0.4em] hover:brightness-125 transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] relative group"
                            >
                                <span className="relative z-10">逆天而行 ◈ 破镜</span>
                                <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 p-4 sm:p-8 overflow-hidden bg-[#1a2521]/50 flex flex-col min-h-0" onClick={(e) => e.stopPropagation()}>
                        {detailTab === 'attr' && <AttributeTab member={member} showPhysiqueTooltip={(e) => showTooltip(e, renderPhysiqueTooltip(member.physique))} hideTooltip={hideTooltip} />}
                        {detailTab === 'talents' && <TalentTab member={member} />}
                        {detailTab === 'relations' && <RelationTab member={member} state={state} onSelectMember={onSelectMember} />}
                        {detailTab === 'cultivation' && <CultivationTab member={member} state={state} onToggleMethod={handleToggleMethod} showMethodTooltip={(e, m) => showTooltip(e, renderMethodTooltip(m))} hideTooltip={hideTooltip} />}
                        {detailTab === 'bag' && (
                            <BagTab 
                                member={member} 
                                onUsePill={handleUsePill} 
                                onEquip={handleEquip} 
                                onContributeItem={(itemId, category, quantity) => onContributeItem?.(member.id, itemId, category, quantity)}
                                onViewMethod={() => setDetailTab('cultivation')}
                                showTooltip={showTooltip} 
                                hideTooltip={hideTooltip} 
                                renderItemTooltip={renderItemTooltip} 
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>,
        portalRoot
    );
};

export default MemberDetailModal;
