
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ClanMember, Building, Realm, Inventory } from '../../../../types';
import { REALM_ORDER, VEIN_LEVELS, ALL_ITEM_DETAILS, CULTIVATION_SLOT_BONUSES } from '../../../../constants';
import { getGradeStyle } from '../../../MembersPanel/Shared/utils';
import { renderItemContent } from '../../../Shared/TooltipRenderers';

interface Props {
    building: Building;
    members: ClanMember[];
    inventory: Inventory;
    alreadyAssignedIds: string[];
    onAssignBuilding: (buildingId: string, memberId: string | null, slotIndex?: number) => void;
    onUpdateBuilding: (id: string, updates: Partial<Building>) => void;
    onUpdateInventory: (updates: Partial<Inventory>) => void;
    showTooltip: (e: React.MouseEvent, content: React.ReactNode) => void;
    hideTooltip: () => void;
}

const CultivationRoomTab: React.FC<Props> = ({ building, members, inventory, alreadyAssignedIds, onAssignBuilding, onUpdateBuilding, onUpdateInventory, showTooltip, hideTooltip }) => {
    const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
    const [showMemberSelect, setShowMemberSelect] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedMaterials, setSelectedMaterials] = useState<Record<number, number>>({});
    const [isConfirmingUpgrade, setIsConfirmingUpgrade] = useState(false);
    
    // 数量选择小弹窗状态
    const [itemPickingQty, setItemPickingQty] = useState<{ id: number; max: number } | null>(null);
    const [pickingQty, setPickingQty] = useState(1);
    
    const aliveMembers = members.filter(m => m.status !== 'dead' && m.family === '望月李氏');
    
    const currentVeinLevel = building.veinLevel || 0;
    const currentVeinExp = building.veinExp || 0;
    const veinInfo = VEIN_LEVELS[currentVeinLevel];
    const nextVeinInfo = VEIN_LEVELS[currentVeinLevel + 1];

    const portalRoot = document.getElementById('portal-root');

    // 密室配置
    const TIERS = [
        { id: 'Jia' as const, name: '甲等', levelReq: 2, color: 'text-amber-500', border: 'border-amber-600/30', bg: 'bg-amber-900/5', dot: 'bg-amber-500', originalIdx: 0 },
        { id: 'Yi' as const, name: '乙等', levelReq: 1, color: 'text-blue-500', border: 'border-blue-600/30', bg: 'bg-blue-900/5', dot: 'bg-blue-500', originalIdx: 1 },
        { id: 'Bing' as const, name: '丙等', levelReq: 0, color: 'text-emerald-500', border: 'border-emerald-600/30', bg: 'bg-emerald-900/5', dot: 'bg-emerald-500', originalIdx: 2 }
    ];
    
    const SUB_GRADES = ['天', '地', '玄', '黄'];
    
    const isTierUnlocked = (levelReq: number) => {
        return currentVeinLevel >= levelReq;
    };

    const assignedIds = useMemo(() => {
        const base = building.assignedMemberIds || [];
        const full = Array(12).fill(null);
        base.forEach((id, i) => { if (i < 12) full[i] = id; });
        return full;
    }, [building.assignedMemberIds]);

    // 修改处：仅筛选状态为“Idle”(无) 的族人作为待选对象
    const selectableMembers = useMemo(() => {
        return aliveMembers
            .filter(m => m.realm !== Realm.Mortal && m.assignment === 'Idle')
            .sort((a, b) => {
                const realmA = REALM_ORDER.indexOf(a.realm);
                const realmB = REALM_ORDER.indexOf(b.realm);
                if (realmB !== realmA) return realmB - realmA;
                return b.subRealm - a.subRealm;
            });
    }, [aliveMembers]);

    const selectedExpGain = useMemo(() => {
        return Object.entries(selectedMaterials).reduce((acc, [idStr, qty]) => {
            const id = parseInt(idStr);
            const item = (ALL_ITEM_DETAILS as any)[id];
            if (!item) return acc;
            const itemGrade = typeof item.grade === 'number' ? item.grade : 1;
            const weight = item.category === 'mineral' ? 50 : (item.category === 'herb' ? 20 : 10);
            return acc + (itemGrade * qty * weight);
        }, 0);
    }, [selectedMaterials]);

    const handleUpgradeVein = () => {
        if (selectedExpGain <= 0) return;

        let totalExp = currentVeinExp + selectedExpGain;
        let newLevel = currentVeinLevel;

        while (newLevel < VEIN_LEVELS.length - 1 && totalExp >= VEIN_LEVELS[newLevel + 1].exp) {
            newLevel++;
        }

        const newMinerals = { ...inventory.minerals };
        const newHerbs = { ...inventory.herbs };
        
        Object.entries(selectedMaterials).forEach(([idStr, qty]) => {
            const id = parseInt(idStr);
            if (newMinerals[id]) {
                newMinerals[id] -= qty;
                if (newMinerals[id] <= 0) delete newMinerals[id];
            } else if (newHerbs[id]) {
                newHerbs[id] -= qty;
                if (newHerbs[id] <= 0) delete newHerbs[id];
            }
        });

        onUpdateInventory({ minerals: newMinerals, herbs: newHerbs });
        onUpdateBuilding(building.id, { veinLevel: newLevel, veinExp: totalExp });
        
        setSelectedMaterials({});
        setShowUpgradeModal(false);
        setIsConfirmingUpgrade(false);
    };

    const handleSlotClick = (idx: number) => {
        setSelectedSlotIdx(idx);
        setShowMemberSelect(true);
    };

    function handleSelect(memberId: string | null) {
        if (selectedSlotIdx !== null) {
            onAssignBuilding(building.id, memberId, selectedSlotIdx);
        }
        setShowMemberSelect(false);
    }

    const openQtyPicker = (id: number, currentMax: number) => {
        setItemPickingQty({ id, max: currentMax });
        setPickingQty(1);
    };

    const confirmQtySelection = () => {
        if (!itemPickingQty) return;
        setSelectedMaterials(p => ({
            ...p,
            [itemPickingQty.id]: (p[itemPickingQty.id] || 0) + pickingQty
        }));
        setItemPickingQty(null);
    };

    const renderUpgradeModal = () => {
        if (!showUpgradeModal || !portalRoot) return null;
        return createPortal(
            <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
                <div className="relative w-full max-w-4xl h-[80vh] bg-[#1a1310] border-[10px] border-[#4a3728] rounded-sm shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-6 bg-[#2c1810] border-b border-yellow-900/30 flex justify-between items-center">
                        <div>
                            <h4 className="text-yellow-500 font-cursive text-2xl tracking-[0.2em]">灵 脉 升 阶 诏</h4>
                            <p className="text-[10px] text-gray-500 mt-1 italic">昊天镜鉴：融合天地奇珍，以壮李氏基业灵脉。</p>
                        </div>
                        <button onClick={() => { setShowUpgradeModal(false); setItemPickingQty(null); hideTooltip(); }} className="text-gray-500 hover:text-white text-3xl font-bold transition-colors">×</button>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-yellow-900/10">
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                                {Object.entries({ ...inventory.minerals, ...inventory.herbs }).map(([idStr, count]) => {
                                    const id = parseInt(idStr);
                                    const details = (ALL_ITEM_DETAILS as any)[id];
                                    if (!details || (count as number) <= 0) return null;
                                    const style = getGradeStyle(details.grade);
                                    const alreadySelectedQty = selectedMaterials[id] || 0;
                                    const remaining = (count as number) - alreadySelectedQty;

                                    return (
                                        <div 
                                            key={id}
                                            onMouseEnter={(e) => showTooltip(e, renderItemContent(id))}
                                            onMouseLeave={hideTooltip}
                                            onClick={() => remaining > 0 && openQtyPicker(id, remaining)}
                                            className={`p-2 border rounded cursor-pointer transition-all flex flex-col items-center gap-1 ${style.bg} ${style.border} ${remaining <= 0 ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-105 hover:brightness-110 shadow-lg'}`}
                                        >
                                            <span className="text-2xl">{details.category === 'mineral' ? '💎' : '🌿'}</span>
                                            <span className={`text-[9px] font-bold truncate w-full text-center ${style.text}`}>{details.name}</span>
                                            <span className="text-[8px] text-gray-500 font-mono">库存 {remaining}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="w-80 p-6 bg-black/40 flex flex-col gap-6">
                            <div className="bg-[#1a1215] p-5 rounded border border-yellow-900/20">
                                <h5 className="text-yellow-600 text-[11px] font-bold mb-4 uppercase tracking-widest">选中物资清单</h5>
                                <div className="flex-1 max-h-48 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                                    {Object.entries(selectedMaterials).map(([idStr, qty]) => {
                                        const id = parseInt(idStr);
                                        const details = (ALL_ITEM_DETAILS as any)[id];
                                        return (
                                            <div key={id} className="flex justify-between items-center text-[10px] bg-black/20 p-2 rounded border border-white/5">
                                                <span className="text-gray-300">{details.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-yellow-500 font-bold">x{qty}</span>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedMaterials(p => { const n = {...p}; n[id]--; if(n[id]<=0) delete n[id]; return n; }) }}
                                                        className="w-5 h-5 flex items-center justify-center bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded transition-colors"
                                                    >➖</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Object.keys(selectedMaterials).length === 0 && <p className="text-center text-gray-700 italic text-[10px] py-4">未选择祭炼物资</p>}
                                </div>
                                <div className="pt-4 border-t border-white/5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-[10px]">预期灵气获取</span>
                                        <span className="text-emerald-500 font-bold font-mono">+{selectedExpGain}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-[10px]">升阶进度预览</span>
                                        <span className="text-yellow-500 font-bold font-mono">
                                            {currentVeinExp + selectedExpGain} {nextVeinInfo ? `/ ${nextVeinInfo.exp}` : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setIsConfirmingUpgrade(true)}
                                disabled={selectedExpGain <= 0}
                                className={`w-full py-4 rounded font-bold text-sm tracking-[0.3em] transition-all shadow-xl ${selectedExpGain > 0 ? 'bg-yellow-800 text-yellow-100 hover:bg-yellow-700' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                            >
                                熔 炼 升 阶
                            </button>
                        </div>
                    </div>

                    {/* 数量选择子弹窗 */}
                    {itemPickingQty && (
                        <div className="fixed inset-0 z-[1050] bg-black/60 flex items-center justify-center p-4">
                            <div className="bg-[#2c1810] border-2 border-yellow-900/40 p-6 rounded shadow-2xl max-w-xs w-full animate-fade-in">
                                <h5 className="text-yellow-500 font-bold text-sm mb-4 border-b border-yellow-900/20 pb-2">祭炼数量</h5>
                                <div className="text-center mb-6">
                                    <p className="text-gray-300 text-xs mb-2">投入灵脉祭炼的 {(ALL_ITEM_DETAILS as any)[itemPickingQty.id]?.name}</p>
                                    <div className="flex items-center justify-center gap-4 py-3 bg-black/40 rounded">
                                        <button onClick={() => setPickingQty(Math.max(1, pickingQty - 1))} className="w-8 h-8 flex items-center justify-center bg-yellow-900/20 text-yellow-500 rounded border border-yellow-900/30">-</button>
                                        <span className="text-xl font-mono font-bold text-yellow-500 w-12 text-center">{pickingQty}</span>
                                        <button onClick={() => setPickingQty(Math.min(itemPickingQty.max, pickingQty + 1))} className="w-8 h-8 flex items-center justify-center bg-yellow-900/20 text-yellow-500 rounded border border-yellow-900/30">+</button>
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-2 italic">可用上限: {itemPickingQty.max}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setItemPickingQty(null)} className="flex-1 py-2 bg-black/40 border border-gray-700 text-gray-500 rounded text-[10px] font-bold">取消</button>
                                    <button onClick={confirmQtySelection} className="flex-1 py-2 bg-yellow-900/60 border border-yellow-500 text-yellow-100 rounded text-[10px] font-bold">投入</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isConfirmingUpgrade && (
                        <div className="fixed inset-0 z-[1100] bg-black/80 flex items-center justify-center p-4">
                            <div className="bg-[#1a1310] border-4 border-[#4a3728] p-8 rounded shadow-2xl max-sm w-full text-center animate-fade-in">
                                <h4 className="text-2xl font-cursive text-yellow-500 mb-6">因 果 确 认</h4>
                                <p className="text-gray-300 text-sm font-serif leading-relaxed mb-8">
                                    尔等确定要熔炼这些奇珍异宝吗？<br/>
                                    此举将使家族灵脉品级飞跃，但也意味着这些天材地宝将彻底消散于天地之间。
                                </p>
                                <div className="flex gap-4">
                                    <button onClick={() => setIsConfirmingUpgrade(false)} className="flex-1 py-2.5 bg-black/40 border border-gray-700 text-gray-500 rounded font-bold hover:text-gray-300">暂缓</button>
                                    <button onClick={handleUpgradeVein} className="flex-1 py-2.5 bg-yellow-900/80 text-yellow-100 rounded font-bold hover:bg-yellow-800 shadow-xl border border-yellow-600/30">准奏</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>,
            portalRoot
        );
    };

    const renderMemberSelect = () => {
        if (!showMemberSelect || selectedSlotIdx === null || !portalRoot) return null;
        return createPortal(
            <div className="fixed inset-0 z-[1200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#1a1a1a] border-2 border-emerald-900/30 w-full max-w-md rounded shadow-2xl flex flex-col max-h-[80%] overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 bg-[#121a15] border-b border-emerald-900/20 flex justify-between items-center">
                        <div>
                            <h4 className="text-emerald-500 font-bold text-sm tracking-widest">指派入室</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5 italic">
                                拟入：{SUB_GRADES[selectedSlotIdx % 4]}字室 
                            </p>
                        </div>
                        <button onClick={() => setShowMemberSelect(false)} className="text-gray-500 hover:text-white text-3xl font-bold transition-colors">×</button>
                    </div>
                    <div className="p-2 overflow-y-auto custom-scrollbar flex-1 space-y-1 bg-black/20">
                        {assignedIds[selectedSlotIdx] && (
                            <button 
                                onClick={() => handleSelect(null)}
                                className="w-full p-3 bg-red-950/20 border border-red-900/30 text-red-500 text-xs font-bold hover:bg-red-900/20 mb-2 rounded transition-all"
                            >
                                撤出密室 (恢复空位)
                            </button>
                        )}
                        {selectableMembers.length > 0 ? selectableMembers.map(member => (
                            <div 
                                key={member.id} 
                                onClick={() => handleSelect(member.id)}
                                className={`p-3 border rounded transition-all cursor-pointer flex justify-between items-center group
                                    ${member.id === assignedIds[selectedSlotIdx] ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-white/5 border-white/5 hover:bg-emerald-900/10 hover:border-emerald-600/30'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center border border-white/5 text-emerald-500 text-xs font-bold">
                                        {member.name[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-200 font-bold text-sm">{member.name}</span>
                                        <span className="text-[10px] text-gray-500">{member.realm}{member.subRealm}层</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase">{member.position}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center text-gray-600 italic text-xs">暂无符合条件的族人（需为“无事务”状态）</div>
                        )}
                    </div>
                </div>
            </div>,
            portalRoot
        );
    };

    return (
        <div className="flex gap-6 h-full animate-fade-in max-w-7xl mx-auto overflow-hidden">
            <div className="w-64 shrink-0 flex flex-col gap-6">
                <div className="p-5 bg-black/40 border border-emerald-900/20 rounded shadow-xl flex flex-col relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-${veinInfo.color.split('-')[1]}-500/5 to-transparent animate-pulse`}></div>
                    <h3 className={`${veinInfo.color} font-bold text-[13px] mb-6 flex items-center gap-2 border-b border-white/5 pb-2 relative z-10`}>
                        <span>💠</span> 灵脉真身
                    </h3>
                    <div className="space-y-4 relative z-10">
                        <div className={`relative h-24 w-full rounded border ${veinInfo.color.replace('text', 'border')}/30 bg-black/40 overflow-hidden flex flex-col items-center justify-center group`}>
                            <span className={`${veinInfo.color} font-cursive text-xl tracking-widest drop-shadow-md`}>{veinInfo.name}</span>
                            <div className="w-4/5 h-1 bg-gray-900 rounded-full mt-3 overflow-hidden">
                                {nextVeinInfo ? (
                                    <div className={`h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all`} style={{ width: `${Math.min(100, (currentVeinExp / nextVeinInfo.exp) * 100)}%` }}></div>
                                ) : (
                                    <div className="h-full bg-red-500 w-full"></div>
                                )}
                            </div>
                            <span className="text-[9px] text-gray-500 mt-1 font-mono">{currentVeinExp} {nextVeinInfo ? `/ ${nextVeinInfo.exp}` : '(巅峰)'}</span>
                        </div>
                        <div className="space-y-2 text-[10px]">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">当前灵气倍率</span>
                                <span className={`${veinInfo.color} font-bold`}>x{veinInfo.bonus.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">已解锁权限</span>
                                <span className="text-white font-bold">{veinInfo.unlock}密室</span>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                            <button 
                                onClick={() => setShowUpgradeModal(true)}
                                className="w-full py-2.5 bg-yellow-900/20 border border-yellow-700/30 text-yellow-500 rounded text-[10px] font-bold hover:bg-yellow-900/40 transition-all shadow-lg active:scale-95"
                            >
                                🏺 灵脉升阶
                            </button>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-black/40 border border-blue-900/20 rounded shadow-xl flex-1 overflow-hidden flex flex-col">
                    <h3 className="text-blue-500 font-bold text-[13px] mb-4 border-b border-blue-900/10 pb-2 flex items-center gap-2">
                        <span>🏺</span> 修练灵物
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        <div className="p-2 border border-blue-900/20 rounded bg-blue-900/5 flex items-center gap-2">
                            <span className="text-lg">🕯️</span>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-blue-400 font-bold">静心檀香</span>
                                <span className="text-[7px] text-gray-500">瓶颈突破率 +2%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-black/40 border border-white/5 rounded p-6 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-gray-300 font-bold text-sm tracking-widest flex items-center gap-2 opacity-80">
                        <span>🏛️</span> 聚灵密室
                    </h4>
                    <div className="flex gap-4 text-[10px] font-bold">
                        <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 甲等 </span>
                        <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 乙等 </span>
                        <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 丙等 </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
                    {TIERS.filter(t => isTierUnlocked(t.levelReq)).map((tier) => {
                        return (
                            <div key={tier.id} className="mb-12 last:mb-0 animate-fade-in">
                                <div className={`flex items-center gap-3 mb-5 border-l-2 ${tier.color.replace('text', 'border')} pl-3`}>
                                    <span className={`${tier.color} font-bold text-sm tracking-widest`}>{tier.name}·静室区域</span>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                                    {SUB_GRADES.map((grade, gIdx) => {
                                        const slotIdx = tier.originalIdx * 4 + gIdx;
                                        const baseSlotMult = CULTIVATION_SLOT_BONUSES[tier.id][gIdx];
                                        const memberId = assignedIds[slotIdx];
                                        const member = aliveMembers.find(m => m.id === memberId);

                                        return (
                                            <div 
                                                key={slotIdx}
                                                onClick={() => handleSlotClick(slotIdx)}
                                                className={`relative h-48 rounded-lg border flex flex-col items-center justify-center transition-all overflow-hidden group
                                                    ${member 
                                                        ? `${tier.border} ${tier.bg} shadow-lg cursor-pointer hover:border-white/20` 
                                                        : 'bg-black/60 border-white/5 border-dashed cursor-pointer hover:border-white/10'}
                                                `}
                                            >
                                                <div className={`absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg text-[9px] font-mono font-black z-20 shadow-sm
                                                    ${member ? 'bg-white/10 ' + tier.color : 'bg-white/5 text-gray-600'}`}>
                                                    速率 x{baseSlotMult}
                                                </div>
                                                <div className={`absolute top-3 left-3 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 border border-white/5 z-20 ${member ? tier.color : 'text-gray-600'}`}>
                                                    {grade}字{tier.name[0]}等
                                                </div>
                                                {member ? (
                                                    <div className="flex flex-col items-center animate-fade-in text-center p-2 z-10">
                                                        <div className="w-14 h-14 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-2xl mb-3 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">🧘</div>
                                                        <p className={`text-xs font-bold ${tier.color}`}>{member.name}</p>
                                                        <p className="text-[9px] text-gray-500 mt-1 font-medium">{member.realm}{member.subRealm}层</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center opacity-20 group-hover:opacity-100 transition-all duration-300">
                                                        <span className="text-3xl mb-1">🔘</span>
                                                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">空置密室</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {renderUpgradeModal()}
            {renderMemberSelect()}
        </div>
    );
};

export default CultivationRoomTab;
