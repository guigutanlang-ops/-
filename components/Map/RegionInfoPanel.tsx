import React, { useState } from 'react';
import { Region, Realm, ClanMember, TaskType } from '../../types';
import { REALM_ORDER, TASK_INFO } from '../../constants';
import { getRealmText } from '../MembersPanel/Shared/utils';

interface RegionInfoPanelProps {
    region: Region;
    members: ClanMember[];
    onClose: () => void;
    onAssignMission: (memberId: string, missionType: string) => void;
}

const RegionInfoPanel: React.FC<RegionInfoPanelProps> = ({ region, members, onClose, onAssignMission }) => {
    const [isDispatching, setIsDispatching] = useState(false);

    const getRequiredRealm = (difficulty: number): Realm => {
        if (difficulty <= 5) return Realm.QiRefinement;
        if (difficulty <= 15) return Realm.FoundationEstablishment;
        if (difficulty <= 25) return Realm.Zifu;
        if (difficulty <= 35) return Realm.JinDan;
        if (difficulty <= 45) return Realm.YuanYing;
        return Realm.YuanShen;
    };

    const requiredRealm = getRequiredRealm(region.difficulty);
    const requiredIdx = REALM_ORDER.indexOf(requiredRealm);

    // Filter for available clan members
    const availableMembers = members.filter(m => 
        m.family === '望月李氏' && 
        m.status === 'healthy' && 
        m.assignment === 'Idle' &&
        m.realm !== Realm.Mortal
    );

    const getMissionType = () => {
        if (region.owner === '望月李氏') return 'Guard'; // 驻守
        if (region.owner === '无') return 'Explore';    // 探索
        if (region.category === 'Stakeholder') return 'Diplomacy'; // 外交/贸易
        return 'Occupy'; // 攻占
    };

    const missionType = getMissionType();
    const missionLabels: Record<string, string> = {
        'Guard': '驻守据点',
        'Explore': '探寻秘境',
        'Diplomacy': '外交通商',
        'Occupy': '开疆拓土'
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-[100] flex items-center justify-center">
            <div className="pointer-events-auto animate-fade-in">
                <div className="w-[500px] bg-[#120a08]/98 backdrop-blur-3xl border-[3px] border-yellow-900/70 rounded shadow-[0_40px_120px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/10">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-yellow-900/50 bg-[#1e1310] flex justify-between items-center shrink-0">
                        <div className="flex flex-col">
                            <h3 className="text-yellow-500 font-bold text-2xl tracking-[0.25em] font-serif uppercase">{region.name}</h3>
                            <span className="text-[10px] text-accent-gold/40 tracking-widest mt-1">REGION COGNITION ◈ {region.category}</span>
                        </div>
                        <button onClick={onClose} className="text-gray-600 hover:text-red-500 text-4xl font-bold transition-colors">×</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-gradient-to-b from-[#120a08] to-[#080302]">
                        
                        {!isDispatching ? (
                            <>
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/60 p-5 rounded border border-yellow-900/20 flex flex-col items-center gap-2">
                                        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">推荐境界</span>
                                        <span className="text-xl font-bold font-serif tracking-widest text-yellow-500">
                                            {requiredRealm}
                                        </span>
                                    </div>
                                    <div className="bg-black/60 p-5 rounded border border-yellow-900/20 flex flex-col items-center gap-2">
                                        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">当前归属</span>
                                        <span className="text-xl font-bold font-serif tracking-widest text-accent-jade">
                                            {region.owner}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Description */}
                                <div className="relative p-6 bg-black/40 rounded italic border-l-[4px] border-yellow-900/60 shadow-lg">
                                    <p className="text-[14px] text-gray-400 leading-relaxed font-serif tracking-wide">{region.description}</p>
                                </div>

                                {/* Resources */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-accent-gold/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-1 h-1 bg-accent-gold rounded-full"></span> 产出概况
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {region.resources.map(res => (
                                            <span key={res} className="px-3 py-1 bg-bg-panel border border-border-soft text-text-muted text-xs rounded-full">
                                                {res}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Button */}
                                {region.id !== 'li_clan_home' && !region.activeMission && (
                                    <button 
                                        onClick={() => setIsDispatching(true)}
                                        className="w-full py-5 bg-accent-gold/10 hover:bg-accent-gold/20 border border-accent-gold/40 text-accent-gold text-lg font-bold rounded-sm tracking-[0.4em] transition-all shadow-[0_0_30px_rgba(201,160,99,0.1)]"
                                    >
                                        镜照因果 ◈ 派遣族人
                                    </button>
                                )}

                                {region.activeMission && (
                                    <div className="w-full py-5 bg-blue-900/10 border border-blue-500/40 text-blue-400 text-center rounded-sm">
                                        <p className="font-bold tracking-widest">族人派遣中...</p>
                                        <p className="text-xs mt-1 opacity-60">预计余 {region.activeMission.turnsRemaining} 载归还</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-yellow-500 font-bold tracking-widest flex items-center gap-2">
                                        <button onClick={() => setIsDispatching(false)} className="text-gray-500 hover:text-white mr-2">←</button>
                                        选择领命族人
                                    </h4>
                                    <span className="text-[10px] text-gray-500 font-mono">任务：{missionLabels[missionType]}</span>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {availableMembers.length > 0 ? availableMembers.map(m => {
                                        const memberIdx = REALM_ORDER.indexOf(m.realm);
                                        const isSafe = memberIdx >= requiredIdx;
                                        
                                        return (
                                            <div 
                                                key={m.id}
                                                onClick={() => onAssignMission(m.id, missionType)}
                                                className={`p-4 bg-black/40 border rounded transition-all cursor-pointer group flex justify-between items-center
                                                    ${isSafe ? 'border-border-soft hover:border-accent-jade/50 hover:bg-accent-jade/5' : 'border-red-900/30 hover:border-red-600/50 hover:bg-red-900/10'}`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-200 group-hover:text-white">{m.name}</span>
                                                    <span className="text-[11px] text-gray-500">{getRealmText(m.realm, m.subRealm)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isSafe ? 'text-accent-jade' : 'text-red-500'}`}>
                                                        {isSafe ? '胜算极高' : '灵压过重'}
                                                    </span>
                                                    <p className="text-[9px] text-gray-600 mt-0.5">资质: {m.aptitude}</p>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="py-20 text-center border border-dashed border-white/5 rounded">
                                            <p className="text-gray-600 text-sm italic">族中暂无闲置且健康的修行者</p>
                                            <p className="text-[10px] text-gray-700 mt-2">（请确保族人未被分配“闭关”或“研习”任务）</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-black/60 border-t border-white/5 text-center">
                        <span className="font-cursive text-text-disabled text-xs opacity-30">昊天镜照 ◈ 运筹帷幄</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegionInfoPanel;