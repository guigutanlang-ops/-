
import React from 'react';
import { ClanMember } from '../../../types';
import { POSITIONS } from '../../../constants';

interface Props {
    members: ClanMember[];
    unlockedPositions: string[];
    merit: number;
    onUpdateMember: (id: string, updates: Partial<ClanMember>) => void;
    onUnlockPosition: (pos: string, cost: number) => void;
}

const PositionsTab: React.FC<Props> = ({ members, unlockedPositions, merit, onUpdateMember, onUnlockPosition }) => {
    const aliveMembers = members.filter(m => m.status !== 'dead' && m.family === '望月李氏');

    const positionConfigs: Record<string, { cost: number; desc: string; icon: string }> = {
        '执事': { cost: 50, desc: '处理家族日常琐碎，负责资源调配。', icon: '📝' },
        '长老': { cost: 200, desc: '家族中坚力量，参与核心决策。', icon: '🍵' },
    };

    return (
        <div className="space-y-10 animate-fade-in max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                {POSITIONS.filter(p => p !== '弟子' && p !== '家主').map(posName => {
                    const isUnlocked = unlockedPositions.includes(posName);
                    const config = positionConfigs[posName];
                    if (!config) return null;
                    const canUnlock = merit >= config.cost;

                    return (
                        <div key={posName} className={`p-6 bg-black/40 border rounded-xl flex flex-col justify-between transition-all ${isUnlocked ? 'border-yellow-900/30' : 'border-gray-800 opacity-80'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{config.icon}</span>
                                    <div>
                                        <h4 className="text-lg font-bold text-yellow-500">{posName}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">族中职司</p>
                                    </div>
                                </div>
                                {isUnlocked ? (
                                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-green-900/40 text-green-500 font-bold">已解封</span>
                                ) : (
                                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-gray-700 text-gray-500 font-bold">待开启</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mb-6 italic leading-relaxed">{config.desc}</p>
                            {!isUnlocked && (
                                <button 
                                    onClick={() => onUnlockPosition(posName, config.cost)}
                                    disabled={!canUnlock}
                                    className={`w-full py-2.5 rounded font-bold text-[11px] tracking-[0.2em] transition-all border ${canUnlock ? 'bg-yellow-900/20 border-yellow-700 text-yellow-500 hover:bg-yellow-900/40' : 'bg-black/20 border-gray-800 text-gray-700 cursor-not-allowed'}`}
                                >
                                    解封所需：💠 {config.cost} 功德
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="bg-black/30 p-6 rounded-xl border border-yellow-900/10 mb-10">
                <h3 className="text-yellow-600 font-bold text-sm mb-6 border-l-4 border-yellow-600 pl-4 tracking-[0.3em]">成员册封</h3>
                <div className="space-y-3">
                    {aliveMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-lg group hover:border-yellow-900/40 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="text-center min-w-[80px]">
                                    <p className="text-xs text-yellow-100 font-bold">{member.name}</p>
                                    <p className="text-[9px] text-gray-500 mt-0.5">{member.realm}</p>
                                </div>
                                <div className="h-8 w-px bg-white/5 mx-2"></div>
                                <div className="flex flex-col">
                                    <p className="text-[10px] text-gray-500">当前职位</p>
                                    <p className="text-sm text-orange-400 font-bold">{member.position}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <select 
                                    value={member.position}
                                    onChange={(e) => onUpdateMember(member.id, { position: e.target.value })}
                                    className="bg-[#2c1810] border border-yellow-900/40 px-3 py-1.5 rounded text-yellow-500 text-xs font-bold outline-none cursor-pointer hover:border-yellow-600 transition-colors"
                                >
                                    {unlockedPositions.map(pos => (
                                        <option key={pos} value={pos}>{pos}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PositionsTab;
