import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ClanMember, Inventory } from '../../../types';
import { ALL_ITEM_DETAILS } from '../../../constants';
import { getGradeStyle } from '../Shared/utils';

interface Props {
    member: ClanMember;
    onUsePill: (id: number, qty: number) => void;
    onEquip: (id: number, cat: 'weapon' | 'armor' | 'accessory' | 'treasure') => void;
    onContributeItem: (itemId: number, category: string, quantity: number) => void;
    onViewMethod?: () => void;
    showTooltip: (e: React.MouseEvent, content: React.ReactNode) => void;
    hideTooltip: () => void;
    renderItemTooltip: (id: number) => React.ReactNode;
}

type BagSubTab = 'all' | 'methods' | 'equipment' | 'pills' | 'scrolls' | 'materials';
type SortKey = 'grade' | 'quantity' | 'name' | 'category';
type ActionType = 'use' | 'contribute' | null;

const BagTab: React.FC<Props> = ({ member, onUsePill, onEquip, onContributeItem, onViewMethod, showTooltip, hideTooltip, renderItemTooltip }) => {
    const [bagSubTab, setBagSubTab] = useState<BagSubTab>('all');
    const [bagSortKey, setBagSortKey] = useState<SortKey>('category');
    const [focusedItem, setFocusedItem] = useState<number | null>(null);
    
    // 弹窗状态
    const [showActionModal, setShowActionModal] = useState(false);
    const [modalAction, setModalAction] = useState<ActionType>(null);
    const [modalItem, setModalItem] = useState<{ id: number; count: number; inventoryKey: keyof Inventory } | null>(null);
    const [selectedQty, setSelectedQty] = useState(1);
    const [isFinalConfirm, setIsFinalConfirm] = useState(false);
    
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (event.target === listRef.current) {
                setFocusedItem(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTabChange = (tab: BagSubTab) => {
        setBagSubTab(tab);
        if (tab === 'all') {
            setBagSortKey('category');
        } else if (bagSortKey === 'category') {
            setBagSortKey('grade');
        }
        setFocusedItem(null);
    };

    const sortedItems = useMemo(() => {
        const inv = member.personalInventory;
        const itemsList: Array<{ id: number; count: number; category: BagSubTab; inventoryKey: keyof Inventory }> = [];
        // Fix: Explicitly cast entries to [string, number][] to fix potential 'unknown' type inference in filter/map
        const add = (rec: Record<number, number>, cat: BagSubTab, invKey: keyof Inventory) => (Object.entries(rec) as [string, number][]).forEach(([id, count]) => count > 0 && itemsList.push({ id: parseInt(id), count, category: cat, inventoryKey: invKey }));

        if (bagSubTab === 'all' || bagSubTab === 'methods') add(inv.methods, 'methods', 'methods');
        if (bagSubTab === 'all' || bagSubTab === 'equipment') add(inv.weapons, 'equipment', 'weapons');
        if (bagSubTab === 'all' || bagSubTab === 'pills') add(inv.pills, 'pills', 'pills');
        if (bagSubTab === 'all' || bagSubTab === 'scrolls') add(inv.scrolls, 'scrolls', 'scrolls');
        if (bagSubTab === 'all' || bagSubTab === 'materials') { 
            add(inv.herbs, 'materials', 'herbs'); 
            add(inv.minerals, 'materials', 'minerals'); 
        }

        return itemsList.sort((a, b) => {
            const dA = (ALL_ITEM_DETAILS as any)[a.id];
            const dB = (ALL_ITEM_DETAILS as any)[b.id];
            if (!dA || !dB) return 0;
            
            if (bagSortKey === 'category') {
                const catOrder: Record<string, number> = { 'methods': 0, 'equipment': 1, 'pills': 2, 'scrolls': 3, 'materials': 4 };
                const orderA = catOrder[a.category] ?? 99;
                const orderB = catOrder[b.category] ?? 99;
                if (orderA !== orderB) return orderA - orderB;
                return (typeof dB.grade === 'number' ? dB.grade : 0) - (typeof dA.grade === 'number' ? dA.grade : 0);
            }
            if (bagSortKey === 'grade') {
                return (typeof dB.grade === 'number' ? dB.grade : 0) - (typeof dA.grade === 'number' ? dA.grade : 0);
            }
            if (bagSortKey === 'quantity') return b.count - a.count;
            
            return dA.name.localeCompare(dB.name, 'zh-CN');
        });
    }, [member, bagSubTab, bagSortKey]);

    const initiateAction = (item: { id: number, count: number, category: BagSubTab; inventoryKey: keyof Inventory }, action: ActionType) => {
        const details = (ALL_ITEM_DETAILS as any)[item.id];
        if (!details) return;

        if (action === 'use') {
            if (item.category === 'pills' && item.count > 1) {
                setModalItem(item);
                setModalAction('use');
                setSelectedQty(1);
                setIsFinalConfirm(false);
                setShowActionModal(true);
            } else if (item.category === 'pills') {
                onUsePill(item.id, 1);
                setFocusedItem(null);
            } else if (item.category === 'equipment') {
                let cat: 'weapon' | 'armor' | 'accessory' | 'treasure' = 'weapon';
                if (details.name.includes('佩') || details.name.includes('戒') || details.name.includes('镯')) cat = 'accessory';
                else if (details.name.includes('甲') || details.name.includes('袍')) cat = 'armor';
                else if (details.name.includes('印') || details.name.includes('镜') || details.name.includes('壶')) cat = 'treasure';
                onEquip(item.id, cat);
                setFocusedItem(null);
            } else if (item.category === 'methods') {
                if (onViewMethod) onViewMethod();
                setFocusedItem(null);
            }
        } else if (action === 'contribute') {
            setModalItem(item);
            setModalAction('contribute');
            setSelectedQty(1);
            setIsFinalConfirm(false);
            setShowActionModal(true);
        }
        hideTooltip();
    };

    const confirmModalAction = () => {
        if (!modalItem || !modalAction) return;

        // 如果是上交且还没有进行最终确认，则切换到最终确认状态
        if (modalAction === 'contribute' && !isFinalConfirm) {
            setIsFinalConfirm(true);
            return;
        }

        if (modalAction === 'use') {
            onUsePill(modalItem.id, selectedQty);
        } else if (modalAction === 'contribute') {
            onContributeItem(modalItem.id, modalItem.inventoryKey, selectedQty);
        }

        setShowActionModal(false);
        setFocusedItem(null);
        setIsFinalConfirm(false);
    };

    return (
        <div className="h-full flex flex-col min-h-0 animate-fade-in pr-2 overflow-hidden relative">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-yellow-900/20">
                    {(['all', 'methods', 'equipment', 'pills', 'scrolls', 'materials'] as BagSubTab[]).map(t => (
                        <button key={t} onClick={() => handleTabChange(t)} className={`px-4 py-1.5 text-[10px] rounded-lg transition-all font-bold ${bagSubTab === t ? 'bg-yellow-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                            {t === 'all' ? '📦 全部' : t === 'methods' ? '📖 功法' : t === 'equipment' ? '🏮 装备' : t === 'pills' ? '💊 丹药' : t === 'scrolls' ? '📜 卷轴' : '🎋 材料'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-r border-white/10 pr-2">排序</span>
                    <select value={bagSortKey} onChange={(e) => setBagSortKey(e.target.value as SortKey)} className="bg-bg-panel text-[10px] text-yellow-600 outline-none font-bold cursor-pointer">
                        {bagSubTab === 'all' && <option value="category">按类型</option>}
                        <option value="grade">按品级</option>
                        <option value="quantity">按数量</option>
                        <option value="name">按名称</option>
                    </select>
                </div>
            </div>

            <div 
                ref={listRef}
                className="flex-1 overflow-y-auto custom-scrollbar pb-10"
            >
                {sortedItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8 items-start pointer-events-none">
                        {sortedItems.map(item => {
                            const details = (ALL_ITEM_DETAILS as any)[item.id];
                            if (!details) return null;

                            const style = getGradeStyle(details.grade);
                            const isRestricted = details.requiredRealm && member.realm !== details.requiredRealm;
                            const isFocused = focusedItem === item.id;

                            return (
                                <div key={item.id} className="flex flex-col gap-[5px] pointer-events-auto">
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); setFocusedItem(isFocused ? null : item.id); }} 
                                        onMouseEnter={(e) => showTooltip(e, renderItemTooltip(item.id))} 
                                        onMouseLeave={hideTooltip} 
                                        className={`${style.bg} border-2 ${isFocused ? 'border-yellow-500 scale-[1.02]' : style.border} ${style.glow} p-3 rounded-lg flex flex-col items-center aspect-[4/5] justify-between shadow-lg relative group overflow-hidden transition-all duration-200 cursor-pointer ${isRestricted ? 'opacity-50 grayscale' : ''}`}
                                    >
                                        <div className={`text-3xl mt-2 group-hover:scale-110 transition-transform ${style.shadow}`}>
                                            {item.category === 'equipment' ? '⚔️' : item.category === 'pills' ? '💊' : item.category === 'materials' ? '💎' : item.category === 'scrolls' ? '📜' : '📖'}
                                        </div>
                                        <span className={`text-[11px] font-bold text-center truncate w-full mt-2 px-1 ${style.text} ${style.shadow}`}>{details.name}</span>
                                        <span className="text-[11px] font-bold text-yellow-600/80 font-mono">数量：{item.count}</span>
                                    </div>

                                    {isFocused && (
                                        <div 
                                            className="bg-black/95 border border-yellow-900/40 rounded-lg p-1.5 w-full max-w-full min-w-0 flex flex-col gap-1.5 animate-fade-in z-20 shadow-xl"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex flex-col gap-1 w-full">
                                                <div className="flex gap-2 w-full">
                                                    {item.category !== 'materials' && item.category !== 'scrolls' && (
                                                        <button 
                                                            onClick={() => isRestricted ? null : initiateAction(item, 'use')} 
                                                            disabled={isRestricted}
                                                            className={`flex-1 whitespace-nowrap text-center text-white text-[10px] leading-tight py-1 px-1 rounded font-bold ${style.bg.replace('40', '90')} border ${style.border} active:scale-95 transition-all shadow-lg hover:brightness-125 disabled:opacity-30`}
                                                        >
                                                            {item.category === 'pills' ? '使用' : item.category === 'equipment' ? '佩戴' : '修炼' }
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => initiateAction(item, 'contribute')} 
                                                        className="flex-1 whitespace-nowrap text-center text-yellow-500 text-[10px] leading-tight py-1 px-1 rounded font-bold bg-yellow-900/20 border border-yellow-600/40 active:scale-95 transition-all shadow-lg hover:bg-yellow-900/40"
                                                    >
                                                        上交
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-full py-24 text-center text-gray-700 italic border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center gap-4">
                        <span className="text-5xl opacity-10">🎒</span>
                        <span>行囊空空如也</span>
                    </div>
                )}
            </div>

            {/* 操作弹窗 (数量选择 & 确认) */}
            {showActionModal && modalItem && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1a1310] border-4 border-[#4a3728] p-8 rounded-sm shadow-2xl max-w-sm w-full text-center relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-600/30"></div>
                        <h4 className="text-2xl font-cursive text-yellow-500 mb-6 tracking-widest">
                            {modalAction === 'use' ? '服用灵丹' : '收回物品'}
                        </h4>
                        
                        <div className="bg-black/60 p-6 rounded-sm border border-white/5 mb-8">
                            {!isFinalConfirm ? (
                                <>
                                    <div className="flex flex-col items-center gap-2 mb-4">
                                        <span className="text-3xl">{(ALL_ITEM_DETAILS as any)[modalItem.id]?.category === 'pills' ? '💊' : '📦'}</span>
                                        <p className="text-yellow-500 font-bold text-lg">{(ALL_ITEM_DETAILS as any)[modalItem.id]?.name}</p>
                                    </div>

                                    <p className="text-gray-400 text-xs mb-6 font-serif leading-relaxed">
                                        {modalAction === 'use' 
                                            ? `确定要消耗该丹药以精进修为吗？` 
                                            : `确定要将此物收回，由家族掌控吗？`}
                                    </p>

                                    {(modalItem.count > 1 || modalAction === 'contribute') && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-2">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">选择数量</span>
                                                <span className="text-[12px] text-yellow-500 font-mono font-bold">
                                                    {selectedQty} / {modalItem.count}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white/5 p-2 rounded border border-white/10">
                                                <button 
                                                    onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                                                    className="w-10 h-10 flex items-center justify-center bg-black/40 text-yellow-500 hover:text-yellow-400 rounded border border-white/5 active:scale-90 transition-all font-bold text-lg"
                                                >-</button>
                                                <input 
                                                    type="range"
                                                    min="0"
                                                    max={modalItem.count}
                                                    value={selectedQty}
                                                    onChange={(e) => setSelectedQty(parseInt(e.target.value))}
                                                    className="flex-1 accent-yellow-600"
                                                />
                                                <button 
                                                    onClick={() => setSelectedQty(Math.min(modalItem.count, selectedQty + 1))}
                                                    className="w-10 h-10 flex items-center justify-center bg-black/40 text-yellow-500 hover:text-yellow-400 rounded border border-white/5 active:scale-90 transition-all font-bold text-lg"
                                                >+</button>
                                            </div>
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => setSelectedQty(1)} className="text-[9px] text-gray-600 hover:text-gray-400 px-2">最小</button>
                                                <button onClick={() => setSelectedQty(modalItem.count)} className="text-[9px] text-gray-600 hover:text-gray-400 px-2">最大</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="animate-fade-in flex flex-col items-center">
                                    <div className="text-4xl mb-4">📜</div>
                                    <p className="text-yellow-500 font-bold text-lg mb-2">确认收回</p>
                                    <p className="text-gray-300 text-sm font-serif leading-relaxed">
                                        您确定要将 <span className="text-white font-bold">{selectedQty}</span> 个 <span className="text-yellow-400 font-bold">{(ALL_ITEM_DETAILS as any)[modalItem.id]?.name}</span> 收回吗？
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => {
                                    if (isFinalConfirm) {
                                        setIsFinalConfirm(false);
                                    } else {
                                        setShowActionModal(false);
                                    }
                                }}
                                className="flex-1 py-2.5 bg-black/40 border border-[#4a3728] text-gray-500 rounded-sm font-bold hover:text-gray-300 transition-all text-xs tracking-widest"
                            >
                                {isFinalConfirm ? '返回' : '取消'}
                            </button>
                            <button 
                                onClick={confirmModalAction}
                                className={`flex-1 py-2.5 rounded-sm font-bold transition-all shadow-xl text-xs tracking-widest border border-white/10
                                    ${modalAction === 'use' ? 'bg-blue-900/80 text-blue-100 hover:bg-blue-800' : 'bg-yellow-900/80 text-yellow-100 hover:bg-yellow-800'}`}
                            >
                                {isFinalConfirm ? '确认收回' : '确定'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BagTab;