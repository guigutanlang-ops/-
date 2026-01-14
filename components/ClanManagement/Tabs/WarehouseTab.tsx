import React, { useState, useMemo } from 'react';
import { Inventory, ClanMember, Realm } from '../../../types';
import { ALL_ITEM_DETAILS, REALM_ORDER } from '../../../constants';
import { getGradeStyle, getRealmText } from '../../MembersPanel/Shared/utils';
import { renderItemContent } from '../../Shared/TooltipRenderers';

interface Props {
    inventory: Inventory;
    members: ClanMember[];
    onAssignItem?: (memberId: string, itemId: number, category: string, quantity: number) => void;
    showTooltip: (e: React.MouseEvent, content: React.ReactNode) => void;
    hideTooltip: () => void;
}

type WarehouseSubTab = 'all' | 'materials' | 'pills' | 'equipment' | 'methods' | 'scrolls';
type SortKey = 'grade' | 'quantity' | 'name' | 'category';

const WarehouseTab: React.FC<Props> = ({ inventory, members, onAssignItem, showTooltip, hideTooltip }) => {
    const [warehouseSubTab, setWarehouseSubTab] = useState<WarehouseSubTab>('all');
    const [warehouseSortKey, setWarehouseSortKey] = useState<SortKey>('category');
    const [focusedItemId, setFocusedItemId] = useState<number | null>(null);
    
    // 流程控制状态
    const [assigningMemberId, setAssigningMemberId] = useState<string | null>(null);
    const [showMemberSelect, setShowMemberSelect] = useState(false);
    const [showQuantitySelect, setShowQuantitySelect] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    const [selectedAssignQuantity, setSelectedAssignQuantity] = useState(1);

    const handleTabChange = (tab: WarehouseSubTab) => {
        setWarehouseSubTab(tab);
        if (tab === 'all') {
            setWarehouseSortKey('category');
        } else if (warehouseSortKey === 'category') {
            setWarehouseSortKey('grade');
        }
        setFocusedItemId(null);
    };

    const sortedWarehouseItems = useMemo(() => {
        const inv = inventory;
        const allItems: Array<{ id: number; count: number; category: WarehouseSubTab; inventoryKey: keyof Inventory; icon: string }> = [];

        const addToAll = (record: Record<number, number>, category: WarehouseSubTab, inventoryKey: keyof Inventory, icon: string) => {
            // Fix: Cast Object.entries to [string, number][] to fix type inference issues
            (Object.entries(record) as [string, number][]).forEach(([id, count]) => {
                if (count > 0) allItems.push({ id: parseInt(id), count, category, inventoryKey, icon });
            });
        };

        addToAll(inv.scrolls, 'scrolls', 'scrolls', '📜');
        addToAll(inv.methods, 'methods', 'methods', '📖');
        addToAll(inv.herbs, 'materials', 'herbs', '🌿');
        addToAll(inv.minerals, 'materials', 'minerals', '💎');
        addToAll(inv.pills, 'pills', 'pills', '💊');
        addToAll(inv.weapons, 'equipment', 'weapons', '⚔️');

        const filtered = warehouseSubTab === 'all' 
            ? allItems 
            : allItems.filter(item => item.category === warehouseSubTab);

        return filtered.sort((a, b) => {
            const detailA = (ALL_ITEM_DETAILS as any)[a.id];
            const detailB = (ALL_ITEM_DETAILS as any)[b.id];
            if (!detailA || !detailB) return 0;

            if (warehouseSortKey === 'category') {
                const catOrder: Record<string, number> = { 'methods': 0, 'equipment': 1, 'pills': 2, 'scrolls': 3, 'materials': 4 };
                const orderA = catOrder[a.category] ?? 99;
                const orderB = catOrder[b.category] ?? 99;
                if (orderA !== orderB) return orderA - orderB;
                return (typeof detailB.grade === 'number' ? detailB.grade : 0) - (typeof detailA.grade === 'number' ? detailA.grade : 0);
            } else if (warehouseSortKey === 'grade') {
                const gA = typeof detailA.grade === 'number' ? detailA.grade : 0;
                const gB = typeof detailB.grade === 'number' ? detailB.grade : 0;
                return gB - gA;
            } else if (warehouseSortKey === 'quantity') {
                return b.count - a.count;
            } else {
                return detailA.name.localeCompare(detailB.name, 'zh-CN');
            }
        });
    }, [inventory, warehouseSubTab, warehouseSortKey]);

    const familyMembers = useMemo(() => {
        return members
            .filter(m => m.family === '望月李氏' && m.status !== 'dead' && m.realm !== Realm.Mortal && m.age>=6)
            .sort((a, b) => {
                const idxA = REALM_ORDER.indexOf(a.realm);
                const idxB = REALM_ORDER.indexOf(b.realm);
                if (idxA !== idxB) return idxB - idxA;
                return b.subRealm - a.subRealm;
            });
    }, [members]);

    const handleConfirmAssign = () => {
        if (!onAssignItem || !assigningMemberId || focusedItemId === null) return;
        const item = sortedWarehouseItems.find(i => i.id === focusedItemId);
        if (item) {
            onAssignItem(assigningMemberId, focusedItemId, item.inventoryKey, selectedAssignQuantity);
        }
        resetAssignmentState();
    };

    const resetAssignmentState = () => {
        setShowConfirmModal(false);
        setShowQuantitySelect(false);
        setShowMemberSelect(false);
        setFocusedItemId(null);
        setAssigningMemberId(null);
        setSelectedAssignQuantity(1);
    };

    const handleItemClick = (id: number, canAssign: boolean) => {
        if (!canAssign) {
            setFocusedItemId(null);
            return;
        }
        setFocusedItemId(prev => prev === id ? null : id);
    };

    const currentItem = useMemo(() => sortedWarehouseItems.find(i => i.id === focusedItemId), [sortedWarehouseItems, focusedItemId]);

    return (
        <div className="flex flex-col animate-fade-in max-w-5xl mx-auto h-full min-h-0 relative" onClick={() => !showMemberSelect && !showQuantitySelect && !showConfirmModal && setFocusedItemId(null)}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 shrink-0 border-b border-yellow-900/30 pb-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'all', name: '全部', icon: '🏠', activeBg: 'bg-yellow-900/30', activeText: 'text-yellow-500' },
                        { id: 'methods', name: '功法', icon: '📖', activeBg: 'bg-amber-800/20', activeText: 'text-amber-600' },
                        { id: 'equipment', name: '装备', icon: '⚔️', activeBg: 'bg-blue-900/20', activeText: 'text-blue-500' },
                        { id: 'pills', name: '丹药', icon: '💊', activeBg: 'bg-pink-900/20', activeText: 'text-pink-500' },
                        { id: 'scrolls', name: '卷轴', icon: '📜', activeBg: 'bg-amber-800/20', activeText: 'text-amber-500' },
                        { id: 'materials', name: '材料', icon: '💎', activeBg: 'bg-emerald-900/20', activeText: 'text-emerald-500' },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id as any)} 
                            className={`px-4 py-2 rounded text-[13px] font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${warehouseSubTab === tab.id ? `${tab.activeBg} ${tab.activeText} border-yellow-600/50 shadow-lg` : 'bg-black/10 text-gray-600 border-transparent hover:text-gray-400'}`}
                        >
                            <span className="text-base">{tab.icon}</span> {tab.name}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
                    <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest border-r border-white/10 pr-3">排序</span>
                    <select 
                        value={warehouseSortKey}
                        onChange={(e) => setWarehouseSortKey(e.target.value as SortKey)}
                        className="bg-transparent text-[12px] text-yellow-600 outline-none font-bold cursor-pointer"
                    >
                        {warehouseSubTab === 'all' && <option value="category">类型</option>}
                        <option value="grade">品级</option>
                        <option value="quantity">数量</option>
                        <option value="name">名称</option>
                    </select>
                </div>
            </div>
            
            <div className="bg-black/30 rounded-lg p-6 border border-white/5 h-[480px] overflow-y-auto custom-scrollbar relative">
                {sortedWarehouseItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                        {sortedWarehouseItems.map(item => {
                            const details: any = (ALL_ITEM_DETAILS as any)[item.id];
                            if (!details) return null;
                            const style = getGradeStyle(details.grade);
                            const isFocused = focusedItemId === item.id;
                            const canAssign = item.category === 'equipment' || item.category === 'pills';

                            return (
                                <div key={item.id} className="flex flex-col gap-2 relative">
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); handleItemClick(item.id, canAssign); }}
                                        onMouseEnter={(e) => showTooltip(e, renderItemContent(item.id))}
                                        onMouseLeave={hideTooltip}
                                        className={`${style.bg} border-2 ${isFocused ? 'border-yellow-500 scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.2)]' : style.border} p-3 rounded-lg flex flex-col items-center group transition-all aspect-[4/5] justify-between shadow-lg relative overflow-hidden ${canAssign ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
                                    >
                                        <div className={`text-3xl mt-2 ${canAssign ? 'group-hover:scale-110' : ''} transition-transform`}>{item.icon}</div>
                                        <span className={`text-[12px] font-bold text-center truncate w-full mt-2 px-1 ${style.text}`}>{details.name}</span>
                                        <div className="mt-auto"><span className="text-[11px] font-bold text-yellow-600/80 mt-auto font-mono">数量：{item.count}</span></div>
                                        <div className="absolute top-1 right-1"><span className={`text-[7px] font-bold px-1 rounded-sm border ${style.border} ${style.text} bg-black/60`}>{details.grade === 0 ? '凡品' : `${details.grade}品`}</span></div>
                                    </div>
                                    {isFocused && canAssign && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setShowMemberSelect(true); }}
                                            className="bg-yellow-800 text-yellow-100 py-2 rounded text-[11px] font-bold shadow-md hover:bg-yellow-700 transition-all animate-fade-in border border-yellow-600/30"
                                        >分配</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-700 italic gap-4">
                        <span className="text-5xl opacity-20">🏯</span>
                        <p className="text-[13px]">家族仓库中尚无此类物资</p>
                    </div>
                )}
            </div>

            {/* 第一步：选择成员 */}
            {showMemberSelect && (
                <div className="absolute inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#1a1310] border-2 border-yellow-900/40 w-full max-w-md rounded shadow-2xl flex flex-col max-h-[85%] overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 bg-[#2c1810] border-b border-yellow-900/20 flex justify-between items-center">
                            <div>
                                <h4 className="text-yellow-500 font-bold text-sm tracking-widest">领受族人</h4>
                                <p className="text-[10px] text-gray-500 mt-0.5 italic">※ 准许族人领用家族资源</p>
                            </div>
                            <button onClick={() => setShowMemberSelect(false)} className="text-gray-500 hover:text-white text-2xl transition-colors font-bold">×</button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-2">
                            {familyMembers.length > 0 ? familyMembers.map(member => (
                                <div 
                                    key={member.id} 
                                    onClick={() => { setAssigningMemberId(member.id); setShowMemberSelect(false); setShowQuantitySelect(true); setSelectedAssignQuantity(1); }}
                                    className="p-4 bg-black/40 border border-white/5 rounded-sm hover:bg-yellow-900/10 hover:border-yellow-600/50 transition-all cursor-pointer flex justify-between items-center group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-yellow-900/10 flex items-center justify-center border border-yellow-900/20 text-yellow-600/60 font-bold text-[10px]">{member.gender === '男' ? '♂' : '♀'}</div>
                                        <div className="flex flex-col">
                                            <span className="text-yellow-100 font-bold text-sm">{member.name}</span>
                                            <span className="text-[12px] text-gray-300">{getRealmText(member.realm, member.subRealm)}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[12px] text-gray-300 font-bold uppercase tracking-widest mb-1">{member.position}</span>
                                        <span className="text-[10px] text-yellow-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 font-bold">选择该族人 ◈</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center text-gray-600 italic">族中尚无具备修行资质的在世族人</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 第二步：选择数量 */}
            {showQuantitySelect && currentItem && (
                <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#1a1310] border-2 border-yellow-900/40 w-full max-w-sm rounded shadow-2xl p-6 flex flex-col animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <h4 className="text-yellow-500 font-bold text-sm tracking-widest mb-6 border-b border-yellow-900/20 pb-2">分配数量</h4>
                        
                        <div className="bg-black/40 p-4 rounded border border-white/5 mb-6 text-center">
                            <p className="text-gray-400 text-xs mb-2 italic">正在向 <span className="text-yellow-500 font-bold">{members.find(m => m.id === assigningMemberId)?.name}</span> 分配</p>
                            <p className="text-yellow-100 font-bold text-lg">{(ALL_ITEM_DETAILS as any)[currentItem.id]?.name}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">选择数量</span>
                                <span className="text-sm text-yellow-500 font-mono font-bold">{selectedAssignQuantity} / {currentItem.count}</span>
                            </div>
                            <div className="flex items-center gap-4 bg-black/60 p-3 rounded-lg border border-white/5">
                                <button onClick={() => setSelectedAssignQuantity(Math.max(1, selectedAssignQuantity - 1))} className="w-8 h-8 bg-yellow-900/20 text-yellow-500 rounded border border-yellow-900/40 flex items-center justify-center font-bold">-</button>
                                <input 
                                    type="range" min="0" max={currentItem.count} value={selectedAssignQuantity}
                                    onChange={(e) => setSelectedAssignQuantity(parseInt(e.target.value))}
                                    className="flex-1 accent-yellow-600"
                                />
                                <button onClick={() => setSelectedAssignQuantity(Math.min(currentItem.count, selectedAssignQuantity + 1))} className="w-8 h-8 bg-yellow-900/20 text-yellow-500 rounded border border-yellow-900/40 flex items-center justify-center font-bold">+</button>
                            </div>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => setSelectedAssignQuantity(1)} className="text-[10px] text-gray-500 hover:text-yellow-600">最小值</button>
                                <button onClick={() => setSelectedAssignQuantity(currentItem.count)} className="text-[10px] text-gray-500 hover:text-yellow-600">全部</button>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={() => { setShowQuantitySelect(false); setShowMemberSelect(true); }} className="flex-1 py-2 bg-black/40 border border-gray-700 text-gray-500 rounded text-xs font-bold hover:text-gray-300">上一步</button>
                            <button onClick={() => { setShowQuantitySelect(false); setShowConfirmModal(true); }} className="flex-1 py-2 bg-yellow-900/60 border border-yellow-500 text-yellow-100 rounded text-xs font-bold hover:bg-yellow-800 shadow-lg">下一步</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 第三步：最终确认弹窗 */}
            {showConfirmModal && currentItem && (
                <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1a1310] border-4 border-[#4a3728] p-8 rounded-sm shadow-2xl max-w-sm w-full text-center relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-600/30"></div>
                        <h4 className="text-2xl font-cursive text-yellow-500 mb-6 tracking-widest">分 配 诏 令</h4>
                        <div className="bg-black/60 p-6 rounded-sm border border-white/5 mb-8">
                            <p className="text-gray-300 text-sm leading-relaxed font-serif">
                                族中老祖诏曰：<br/><br/>
                                将 <span className="text-yellow-500 font-bold">{(ALL_ITEM_DETAILS as any)[focusedItemId!]?.name}</span> x<span className="text-yellow-500 font-bold">{selectedAssignQuantity}</span> 分配给族人 <span className="text-yellow-500 font-bold">{members.find(m => m.id === assigningMemberId)?.name}</span> 掌管。
                            </p>
                            <p className="text-[10px] text-gray-600 mt-4 italic border-t border-white/5 pt-2">※ 家族内府将不再记录该物品流向</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => { setShowConfirmModal(false); setShowQuantitySelect(true); }} className="flex-1 py-2.5 bg-black/40 border border-[#4a3728] text-gray-500 rounded-sm font-bold hover:text-gray-300 transition-all text-xs tracking-widest">驳回重审</button>
                            <button onClick={handleConfirmAssign} className="flex-1 py-2.5 bg-yellow-900/80 text-yellow-100 rounded-sm font-bold hover:bg-yellow-800 transition-all shadow-xl text-xs tracking-widest border border-yellow-600/30">准奏</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarehouseTab;