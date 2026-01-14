import React, { useMemo } from 'react';
import { ClanMember, Building, Inventory, Realm } from '../../../../types';
import { ALL_ITEM_DETAILS, REALM_ORDER } from '../../../../constants';
import { getGradeStyle } from '../../../MembersPanel/Shared/utils';
import { renderItemContent } from '../../../Shared/TooltipRenderers';

interface Props {
    building: Building;
    members: ClanMember[];
    inventory: Inventory;
    alreadyAssignedIds: string[];
    onAssignBuilding: (buildingId: string, memberId: string | null) => void;
    showTooltip: (e: React.MouseEvent, content: React.ReactNode) => void;
    hideTooltip: () => void;
}

const LibraryTab: React.FC<Props> = ({ building, members, inventory, alreadyAssignedIds, onAssignBuilding, showTooltip, hideTooltip }) => {
    const aliveMembers = members.filter(m => m.status !== 'dead' && m.family === '望月李氏');
    const assignedCurator = aliveMembers.find(m => m.id === building.assignedMemberId);

    const familyMethods = useMemo(() => {
        // Fix: Cast Object.entries to [string, number][] to ensure count is treated as a number during filter comparison
        return (Object.entries(inventory.methods) as [string, number][])
            .map(([id, count]) => ({ id: parseInt(id), count }))
            .filter(item => item.count > 0);
    }, [inventory.methods]);

    return (
        <div className="flex gap-8 h-full animate-fade-in max-w-5xl mx-auto">
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
                        </div>
                    ) : <p className="italic text-gray-700 py-10 text-center border border-dashed border-amber-900/20 rounded text-[13px]">暂未任命</p>}
                </div>
            </div>
            
            <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-6 flex flex-col overflow-hidden">
                <h4 className="text-amber-500 text-sm font-bold mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
                    <span>📜</span> 家族传承功法
                </h4>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {familyMethods.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-1">
                            {familyMethods.map(item => {
                                const detail = (ALL_ITEM_DETAILS as any)[item.id];
                                if (!detail) return null;
                                
                                const style = getGradeStyle(detail.grade);
                                
                                return (
                                    <div 
                                        key={item.id} 
                                        onMouseEnter={(e) => showTooltip(e, renderItemContent(item.id))}
                                        onMouseLeave={hideTooltip}
                                        className={`${style.bg} border-2 ${style.border} p-3 rounded-lg flex flex-col items-center group transition-all aspect-[4/5] justify-between shadow-lg relative overflow-hidden`}
                                    >
                                        <div className={`text-3xl mt-2 group-hover:scale-110 transition-transform ${style.shadow}`}>📖</div>
                                        <span className={`text-[11px] font-bold text-center truncate w-full mt-2 px-1 ${style.text} ${style.shadow}`}>{detail.name}</span>
                                        <div className="mt-auto">
                                            <span className="text-[11px] font-bold text-yellow-600/80 font-mono">余量：{item.count}</span>
                                        </div>
                                        <div className="absolute top-1 right-1">
                                            <span className={`text-[7px] font-bold px-1 rounded-sm border ${style.border} ${style.text} bg-black/60`}>
                                                {typeof detail.grade === 'number' ? `${detail.grade}品` : '凡品'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-700 italic gap-2">
                            <span className="text-4xl opacity-10">📖</span>
                            <p className="text-[13px]">族中目前无任何公有功法存本</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LibraryTab;