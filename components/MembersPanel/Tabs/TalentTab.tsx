
import React from 'react';
import { ClanMember, SpecializedTalents } from '../../../types';
import { getWeaponMasteryTitle, getWeaponTalentBonus, getArtisanTitle, getArtisanBonus } from '../../../constants';

interface Props {
    member: ClanMember;
}

const TalentTab: React.FC<Props> = ({ member }) => {
    return (
        <div className="h-full overflow-y-auto custom-scrollbar space-y-10 animate-fade-in text-white pr-2">
            <div>
                <h4 className="text-red-700 text-[15px] font-bold uppercase tracking-[0.3em] border-b border-red-900/20 pb-2 mb-6">⚔️ 战斗造诣</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(Object.entries(member.talents.战斗天赋) as [string, number][]).filter(([_, val]) => val > 0).map(([key, val]) => {
                        // Cast key to keyof combat talents to fix index type error
                        const weaponKey = key as keyof SpecializedTalents['战斗天赋'];
                        const prof = member.combatProficiencies[weaponKey] || 0;
                        const title = getWeaponMasteryTitle(key, prof);
                        const bonus = getWeaponTalentBonus(val);
                        return (
                            <div key={key} className="bg-black/30 p-4 rounded-xl border border-white/5 relative group shadow-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[11px] text-gray-400 font-bold">{key}天赋</span>
                                    <span className="text-xl font-bold text-red-500 font-mono">{val}</span>
                                </div>
                                <p className="text-sm font-bold text-orange-400 mb-2">{title}</p>
                                <div className="flex justify-between text-[11px] mb-2">
                                    <span className="text-gray-500">熟练度:</span>
                                    <span className="text-gray-200 font-mono">{prof}</span>
                                </div>
                                {bonus > 0 && <p className="text-[10px] text-green-500 font-bold">习练加成: +{bonus}%</p>}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div>
                <h4 className="text-blue-600 text-[15px] font-bold uppercase tracking-[0.3em] border-b border-blue-900/20 pb-2 mb-6">🧪 百艺修持</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(Object.entries(member.talents.百艺天赋) as [string, number][]).filter(([_, val]) => val > 0).map(([key, val]) => {
                        // Cast key to keyof artisan talents to fix index type error
                        const artisanKey = key as keyof SpecializedTalents['百艺天赋'];
                        const prof = member.proficiencies[artisanKey] || 0;
                        const title = getArtisanTitle(key, prof);
                        const successBonus = getArtisanBonus(val);
                        return (
                            <div key={key} className="bg-black/30 p-5 rounded-xl border border-blue-900/20 relative group overflow-hidden shadow-lg">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[11px] text-gray-400 font-bold">{key}天赋</span>
                                    <span className="text-xl font-bold text-blue-500 font-mono">{val}</span>
                                </div>
                                <p className="text-sm font-bold text-yellow-500 mb-2">{title}</p>
                                <div className="flex justify-between items-center text-[11px] mb-2">
                                    <span className="text-gray-500">熟练度:</span>
                                    <span className="text-blue-300 font-mono">{prof}</span>
                                </div>
                                {successBonus > 0 && <p className="text-[11px] text-green-500 font-bold">属性加成: +{successBonus}%</p>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Add missing default export
export default TalentTab;
