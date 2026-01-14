
import React from 'react';
import { ClanMember, Building, Realm } from '../../../../types';
import { getArtisanTitle, REALM_ORDER } from '../../../../constants';

interface Props {
    building: Building;
    members: ClanMember[];
    alreadyAssignedIds: string[];
    onAssignBuilding: (buildingId: string, memberId: string | null) => void;
}

const SmithyTab: React.FC<Props> = ({ building, members, alreadyAssignedIds, onAssignBuilding }) => {
    const aliveMembers = members.filter(m => m.status !== 'dead' && m.family === '望月李氏');
    const assignedSmith = aliveMembers.find(m => m.id === building.assignedMemberId);

    return (
        <div className="flex gap-8 h-full animate-fade-in max-w-5xl mx-auto">
            <div className="w-80 p-6 bg-black/40 border border-blue-900/20 rounded shadow-xl flex flex-col h-fit">
                <h3 className="text-blue-600 font-bold text-lg mb-6 flex items-center gap-2"><span>🔨</span> 炼器坊</h3>
                <div className="bg-[#12161a] p-5 rounded border border-blue-900/30">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest shrink-0 mr-4">当前坊主</p>
                        <select className="bg-[#2c1810] border border-yellow-900/40 px-2 py-1 rounded text-yellow-500 outline-none text-[10px] font-bold min-w-[120px] shadow-sm hover:border-yellow-600 transition-colors" 
                            onChange={(e) => onAssignBuilding(building.id, e.target.value || null)} 
                            value={building.assignedMemberId || ''}>
                            <option value="">- 轮空 -</option>
                            {aliveMembers
                                .filter(m => m.realm !== Realm.Mortal && m.talents.百艺天赋.炼器 > 0 && (!alreadyAssignedIds.includes(m.id) || m.id === building.assignedMemberId))
                                .sort((a, b) => {
                                    // 先按照职业熟练度排序 (炼器)
                                    if (b.proficiencies.炼器 !== a.proficiencies.炼器) return b.proficiencies.炼器 - a.proficiencies.炼器;
                                    // 同熟练度按照境界排序
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
            </div>
            
            <div className="flex-1 p-10 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center justify-center text-center opacity-40">
                <span className="text-6xl mb-4">⚒️</span>
                <p className="text-gray-400 font-serif italic">玄铁已至熔点，静待新版本开启模拟炼器系统...</p>
            </div>
        </div>
    );
};

export default SmithyTab;
