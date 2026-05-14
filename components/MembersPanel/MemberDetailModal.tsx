
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ClanMember, GameState, Realm, MethodType, CultivationMethod, InjuryStatus } from '../../types';
import { NamePlaque, EquipSlot } from './Shared/UIComponents';
import { getRealmText, getRealmStyle, getStatusLabel } from './Shared/utils';
import { REALM_ORDER, PILL_DETAILS, CULTIVATION_METHODS } from '../../constants';
import { getRequiredExp } from '../Xiulian/CultivationSystem';
import Tooltip from '../Shared/Tooltip';
import { TooltipState } from '../Shared/useTooltip';

import AttributeTab from './Tabs/AttributeTab';
import CanvasSpiritBar from '../Shared/CanvasSpiritBar';
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
    tooltip: TooltipState | null;
    renderPhysiqueTooltip: (physique: string) => React.ReactNode;
    renderItemTooltip: (id: number) => React.ReactNode;
    renderMethodTooltip: (method: CultivationMethod) => React.ReactNode;
}

const MemberDetailModal: React.FC<Props> = (props) => {
    const { member, state, onClose, onOpenBreakthrough, onUpdateMember, onSelectMember, onContributeItem, showTooltip, hideTooltip, tooltip, renderPhysiqueTooltip, renderItemTooltip, renderMethodTooltip } = props;
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

    const [displaySubRealm, setDisplaySubRealm] = useState(member.subRealm);
    const [isBarFinished, setIsBarFinished] = useState(false);
    const [showPromotionEffect, setShowPromotionEffect] = useState(false);

    // 同步重置状态以防一帧闪烁
    const [prevSyncState, setPrevSyncState] = useState({ id: member.id, power: member.spiritPower, level: member.subRealm, realm: member.realm });
    if (prevSyncState.id !== member.id || prevSyncState.realm !== member.realm || prevSyncState.power !== member.spiritPower || prevSyncState.level !== member.subRealm) {
        setPrevSyncState({ id: member.id, power: member.spiritPower, level: member.subRealm, realm: member.realm });
        setIsBarFinished(false);
        if (prevSyncState.id !== member.id || prevSyncState.realm !== member.realm) {
            setDisplaySubRealm(member.subRealm);
        }
    }
    
    // 移除异步的重置 Effect，已经合并到上面同步逻辑中

    const isBreakthroughNeeded = () => {
        const realmIdx = REALM_ORDER.indexOf(member.realm);
        const req = getRequiredExp(realmIdx, displaySubRealm);
        return displaySubRealm === 9 && member.spiritPower >= req && member.realm !== Realm.YuanShen;
    };

    const isActuallyShowingBreakthrough = isBreakthroughNeeded() && isBarFinished;
    const statusDisplay = getStatusLabel(member, state);

    const MiniInfoRow = ({ label, value, valueClass = "text-text-main" }: { label: string, value: string | number, valueClass?: string }) => (
        <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs font-sans">
            <span className="text-gray-400">{label}</span>
            <span className={`font-medium ${valueClass}`}>{value}</span>
        </div>
    );

    const handleLevelChange = (lvl: number) => {
        const isPromotion = lvl > displaySubRealm;
        setDisplaySubRealm(lvl);
        if (isPromotion) {
            setShowPromotionEffect(true);
            setTimeout(() => setShowPromotionEffect(false), 2000);
        }
    };

    const handleAnimationComplete = () => {
        setIsBarFinished(true);
    };

    const requiredExp = getRequiredExp(REALM_ORDER.indexOf(member.realm), member.subRealm);
    const progressPercent = Math.min(100, (member.spiritPower / requiredExp) * 100);
    
    // Calculate a cumulative level to handle major breakthroughs smoothly in the progress bar
    const realmIdx = REALM_ORDER.indexOf(member.realm);
    const cumulativeLevel = realmIdx * 10 + member.subRealm;

    const handleUnequip = (slot: keyof ClanMember['equippedItems']) => {
        const itemId = member.equippedItems[slot];
        if (itemId === null) return;
        const newEquipped = { ...member.equippedItems, [slot]: null };
        const newInventory = { 
            ...member.personalInventory,
            weapons: { ...member.personalInventory.weapons }
        };
        newInventory.weapons[itemId] = (newInventory.weapons[itemId] || 0) + 1;
        onUpdateMember(member.id, { equippedItems: newEquipped, personalInventory: newInventory });
        setFocusedEquipSlot(null);
    };

    const handleEquip = (itemId: number, cat: 'weapon' | 'armor' | 'accessory' | 'treasure') => {
        const newEquipped = { ...member.equippedItems };
        const newInventory = { 
            ...member.personalInventory,
            weapons: { ...member.personalInventory.weapons }
        };
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

        const isBreakthroughPill = data.effects?.breakthroughBonus && 
                                  !data.effects?.spiritPower && 
                                  !data.effects?.status &&
                                  !data.effects?.aptitude &&
                                  !data.effects?.comprehension &&
                                  !data.effects?.maxAge &&
                                  !data.effects?.divineSense;
        if (isBreakthroughPill) return;

        const currentPillsQty = member.personalInventory.pills[id] || 0;
        if (currentPillsQty < qty) return;
        
        const newInv = { 
            ...member.personalInventory,
            pills: { ...member.personalInventory.pills }
        };
        newInv.pills[id] -= qty;
        if (newInv.pills[id] === 0) delete newInv.pills[id];
        
        const updates: Partial<ClanMember> = { personalInventory: newInv };
        if (data.effects?.spiritPower) updates.spiritPower = (member.spiritPower || 0) + data.effects.spiritPower * qty;
        if (data.effects?.maxAge) updates.maxAge = (member.maxAge || 0) + data.effects.maxAge * qty;
        
        // 处理伤病恢复
        if (data.effects?.status) {
            const finalStatus = data.effects.status as InjuryStatus;
            
            // 只有健康的丹药能治愈除了Dead以外的状态（逻辑可按需调整）
            // 用户要求：轻伤、重伤 自然或丹药恢复；濒死、道基破损 只能丹药恢复
            
            // 从濒死状态恢复后，回复被扣除的最大生命值 (maxAgeLost)
            if (member.status === InjuryStatus.Dying && finalStatus !== InjuryStatus.Dying) {
                updates.maxAge = (updates.maxAge !== undefined ? updates.maxAge : member.maxAge) + (member.maxAgeLost || 0);
                updates.maxAgeLost = 0;
            }
            
            updates.status = finalStatus;
            // 如果恢复了，清空任务为Idle（如果当前是Recovery）
            if (member.assignment === 'Recovery' && finalStatus === InjuryStatus.Healthy) {
                updates.assignment = 'Idle';
            }
        }

        onUpdateMember(member.id, updates);
    };

    const handleSlotClick = (slot: string) => {
        setFocusedEquipSlot(prev => prev === slot ? null : slot);
    };

    if (!portalRoot) return null;

    return createPortal(
        <div 
            className="absolute inset-0 z-[8000] flex items-center justify-center bg-black/98 p-2 sm:p-4 font-serif overflow-hidden pointer-events-auto"
            onClick={() => setFocusedEquipSlot(null)}
        >
            <div 
                className="relative w-[1400px] h-[880px] bg-[#1a2521] border-[12px] border-[#2c3e34] rounded-sm shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <Tooltip state={tooltip} />
                <div className="h-20 bg-[#141e1b] border-b border-[#2c3e34] flex items-center px-8 shrink-0">
                    <div className="flex items-center gap-2 h-full overflow-x-auto scrollbar-hide">
                        {tabs.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setDetailTab(t.id)} 
                                className={`whitespace-nowrap px-4 h-full flex items-center text-sm transition-all border-b-4 font-bold ${detailTab === t.id ? 'border-yellow-500 text-yellow-500 bg-yellow-900/10' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                    <button onClick={onClose} className="ml-auto w-9 h-9 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-full flex items-center justify-center text-xl transition-all font-bold">×</button>
                </div>

                <div className="flex-1 flex overflow-hidden" onClick={() => setFocusedEquipSlot(null)}>
                    {/* 左侧详情栏 */}
                    <div className="w-[42%] flex flex-col items-center justify-start border-r border-[#2c3e34] px-6 py-4 bg-black/10 shrink-0 overflow-y-auto custom-scrollbar">
                        <div className="mb-4 w-full flex justify-center scale-95 origin-top">
                            <NamePlaque member={member} />
                        </div>
                        
                        <div className="relative flex items-center justify-center gap-10 py-6 w-full" onClick={(e) => e.stopPropagation()}>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

                            <div className="flex flex-col gap-10 z-20">
                                <EquipSlot itemId={member.equippedItems.weapon} label="武器" icon="⚔️" isLeftSide isFocused={focusedEquipSlot === 'weapon'} onClick={() => handleSlotClick('weapon')} onMouseEnter={(e) => member.equippedItems.weapon && showTooltip(e, renderItemTooltip(member.equippedItems.weapon))} onMouseLeave={hideTooltip} onUnequip={() => handleUnequip('weapon')} />
                                <EquipSlot itemId={member.equippedItems.armor} label="服饰" icon="🛡️" isLeftSide isFocused={focusedEquipSlot === 'armor'} onClick={() => handleSlotClick('armor')} onMouseEnter={(e) => member.equippedItems.armor && showTooltip(e, renderItemTooltip(member.equippedItems.armor))} onMouseLeave={hideTooltip} onUnequip={() => handleUnequip('armor')} />
                            </div>

                            <div className="w-40 h-56 flex flex-col items-center justify-center relative z-10 transition-transform hover:scale-105">
                                <div className="text-[210px] opacity-10 absolute pointer-events-none -translate-y-5">🧘</div>
                                <div className="z-10 text-center px-1 mt-12">
                                    <p className="text-[9px] text-yellow-600/60 font-bold tracking-[0.2em] mb-1">修为境界</p>
                                    <p className={`text-2xl font-cursive font-bold drop-shadow-lg ${isActuallyShowingBreakthrough ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
                                        {member.realm}
                                    </p>
                                    <div className="relative">
                                        <p className="text-[11px] text-gray-400 mt-1 font-bold tracking-[0.1em] border-t border-yellow-900/10 pt-1">
                                            第 {displaySubRealm} 层
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-10 z-20">
                                <EquipSlot itemId={member.equippedItems.accessory} label="饰品" icon="💍" isLeftSide={false} isFocused={focusedEquipSlot === 'accessory'} onClick={() => handleSlotClick('accessory')} onMouseEnter={(e) => member.equippedItems.accessory && showTooltip(e, renderItemTooltip(member.equippedItems.accessory))} onMouseLeave={hideTooltip} onUnequip={() => handleUnequip('accessory')} />
                                <EquipSlot itemId={member.equippedItems.treasure} label="法宝" icon="🔮" isLeftSide={false} isFocused={focusedEquipSlot === 'treasure'} onClick={() => handleSlotClick('treasure')} onMouseEnter={(e) => member.equippedItems.treasure && showTooltip(e, renderItemTooltip(member.equippedItems.treasure))} onMouseLeave={hideTooltip} onUnequip={() => handleUnequip('treasure')} />
                            </div>
                        </div>

                        {!isMortal && (
                            <div className="w-full mt-1 px-5 relative group/progress" onClick={(e) => e.stopPropagation()}>
                                {showPromotionEffect && (
                                    <div className="absolute bottom-full right-6 z-50 animate-bounce mb-1">
                                        <span className="text-lg font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] tracking-widest font-cursive">晋升！</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mb-1.5 relative z-10 px-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1 h-1 rounded-full animate-pulse ${isActuallyShowingBreakthrough ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]' : 'bg-blue-500/50'}`}></div>
                                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isActuallyShowingBreakthrough ? 'text-red-400' : 'text-blue-400/60'}`}>
                                            {isActuallyShowingBreakthrough ? '突破之机已至' : '修为灵力进度'}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-mono font-bold ${isActuallyShowingBreakthrough ? 'text-red-500' : 'text-gray-600'}`}>
                                        {Math.floor(member.spiritPower)} <span className="mx-0.5 text-gray-800">/</span> {Math.floor(requiredExp)} 
                                    </span>
                                </div>
                                <div className="relative overflow-hidden">
                                    <CanvasSpiritBar 
                                        progress={progressPercent / 100}
                                        level={cumulativeLevel}
                                        resetKey={member.id}
                                        onLevelChange={(lvl) => handleLevelChange(lvl % 10 || 10)}
                                        onAnimationComplete={handleAnimationComplete}
                                        color={isActuallyShowingBreakthrough ? "#dc2626" : "#2563eb"}
                                        glowColor={isActuallyShowingBreakthrough ? "#f97316" : "#22d3ee"}
                                        height={8}
                                        className="rounded-full"
                                    />
                                </div>
                                
                                {isActuallyShowingBreakthrough ? (
                                    <div className="mt-4 animate-fade-in relative z-10">
                                        <button 
                                            onClick={() => onOpenBreakthrough(member.id)} 
                                            className="w-full py-3.5 bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white font-bold rounded-sm border border-red-500/30 text-lg tracking-[0.5em] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(220,38,38,0.3)] relative group overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
                                            <span className="relative z-10 drop-shadow-md">逆 天 而 行 ◇ 破 镜</span>
                                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                            <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] -translate-x-full group-hover:animate-shimmer"></div>
                                        </button>
                                    </div>
                                ) : (
                                    <p className="mt-1 text-[8px] text-gray-700 text-center font-medium tracking-[0.1em] opacity-0 group-hover/progress:opacity-100 transition-opacity">
                                        潜心纳灵 ◈ 厚积薄发
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="w-full mt-4 space-y-0.5 px-5">
                            <MiniInfoRow label="寿元" value={`${member.age} / ${member.maxAge} 载`} valueClass={member.maxAge - member.age < 10 ? 'text-red-400' : 'text-zinc-300'} />
                            <MiniInfoRow label="家族" value={member.family} valueClass="text-zinc-300" />
                            <MiniInfoRow 
                                label="身体" 
                                value={member.status} 
                                valueClass={
                                    member.status === InjuryStatus.Healthy ? "text-emerald-400 font-bold" :
                                    member.status === InjuryStatus.Dead ? "text-gray-500" :
                                    "text-red-400 font-bold"
                                }
                            />
                            <MiniInfoRow label="状态" value={statusDisplay.label} valueClass={`${statusDisplay.color} font-medium`} />
                        </div>
                    </div>

                    {/* 右侧列表栏 */}
                    <div className="flex-1 p-8 overflow-hidden bg-[#1a2521]/50 flex flex-col min-h-0" onClick={(e) => e.stopPropagation()}>
                        {detailTab === 'attr' && <AttributeTab member={member} state={state} showPhysiqueTooltip={(e) => showTooltip(e, renderPhysiqueTooltip(member.physique))} hideTooltip={hideTooltip} />}
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
