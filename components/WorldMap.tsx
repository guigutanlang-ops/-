
import React, { useState, useMemo } from 'react';
import { Region, RegionType, ClanMember, RegionCategory, Realm, FactionType } from '../types';
import { REALM_ORDER } from '../constants';

interface Props {
    regions: Region[];
    members: ClanMember[];
    reputation: Record<string, number>;
    onSelectRegion: (region: Region | null) => void;
    onUpdateMember: (id: string, updates: Partial<ClanMember>) => void;
    onUpdateRegion: (id: string, updates: Partial<Region>) => void;
    currentRegionId: string;
}

const WorldMap: React.FC<Props> = ({ regions, members, reputation, onSelectRegion, onUpdateMember, onUpdateRegion, currentRegionId }) => {
    const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
    const [pendingMissionType, setPendingMissionType] = useState<string | null>(null);
    
    const selectedRegion = regions.find(r => r.id === currentRegionId);
    
    // 计算家族当前最高境界索引
    const maxClanRealmIdx = useMemo(() => {
        return members
            .filter(m => m.family === '望月李氏')
            .reduce((max, m) => {
                const idx = REALM_ORDER.indexOf(m.realm);
                return idx > max ? idx : max;
            }, 0);
    }, [members]);

    const guardingMember = useMemo(() => {
        if (!selectedRegion?.guardMemberId) return null;
        return members.find(m => m.id === selectedRegion.guardMemberId);
    }, [selectedRegion, members]);

    const getRequiredRealm = (difficulty: number): Realm => {
        if (difficulty <= 10) return Realm.QiRefinement;
        if (difficulty <= 20) return Realm.FoundationEstablishment;
        if (difficulty <= 30) return Realm.Zifu;
        if (difficulty <= 40) return Realm.JinDan;
        if (difficulty <= 50) return Realm.YuanYing;
        return Realm.YuanShen;
    };
    
    // 修改处：逻辑变更为仅筛选状态为“Idle”(无) 的族人
    const dispatchableMembers = useMemo(() => {
        return members
            .filter(m => 
                m.family === '望月李氏' && 
                m.status === 'healthy' && 
                m.realm !== Realm.Mortal && 
                m.assignment === 'Idle'
            )
            .sort((a, b) => {
                const idxA = REALM_ORDER.indexOf(a.realm);
                const idxB = REALM_ORDER.indexOf(b.realm);
                if (idxA !== idxB) return idxB - idxA;
                return b.subRealm - a.subRealm;
            });
    }, [members]);

    const getReputationColor = (val: number) => {
        if (val < 0) return 'bg-red-600';     
        if (val < 30) return 'bg-gray-500';   
        if (val < 60) return 'bg-amber-500';  
        if (val < 90) return 'bg-blue-500';   
        return 'bg-green-500';                
    };

    const getReputationTextColor = (val: number) => {
        if (val < 0) return 'text-red-500';
        if (val < 30) return 'text-gray-400';
        if (val < 60) return 'text-amber-500';
        if (val < 90) return 'text-blue-400';
        return 'text-green-400';
    };

    const getFactionColor = (faction: FactionType) => {
        switch (faction) {
            case '望月李氏': return 'rgba(234, 179, 8, 0.4)'; 
            case '北寒宗': return 'rgba(59, 130, 246, 0.4)'; 
            case '天一剑宗': return 'rgba(239, 68, 68, 0.4)'; 
            case '离火门': return 'rgba(249, 115, 22, 0.4)'; 
            case '魏家': return 'rgba(139, 92, 246, 0.4)'; 
            case '邵家': return 'rgba(34, 197, 94, 0.4)'; 
            default: return 'transparent';
        }
    };

    const getTypeIcon = (type: RegionType, category: RegionCategory) => {
        if (category === 'Mystic') return '✨';
        if (category === 'Resource') {
            if (type === 'mine') return '💎';
            if (type === 'field') return '🌾';
        }
        switch (type) {
            case 'lake': return '🌊';
            case 'mountain': return '⛰️';
            case 'forest': return '🌿';
            case 'city': return '🏮';
            case 'sect': return '⛩️';
            case 'ruins': return '🏺';
            case 'cave': return '🕳️';
            case 'island': return '🏝️';
            case 'desert': return '🏜️';
            default: return '📍';
        }
    };

    const getCategorySizeClasses = (category: RegionCategory, id: string) => {
        const isHome = id === 'li_clan_home';
        switch (category) {
            case 'Stakeholder': return isHome ? 'w-14 h-14 text-2xl' : 'w-12 h-12 text-xl';
            case 'Natural': return 'w-11 h-11 text-lg';
            case 'Mystic': return 'w-11 h-11 text-lg';
            case 'Resource': return 'w-9 h-9 text-base';
            default: return 'w-10 h-10 text-lg';
        }
    };

    const handleDispatch = (memberId: string, region: Region, missionType: string) => {
        if (missionType === 'Guard') {
            if (region.guardMemberId) {
                onUpdateMember(region.guardMemberId, { assignment: 'Idle' });
            }
            onUpdateMember(memberId, { assignment: 'Mission' });
            onUpdateRegion(region.id, { guardMemberId: memberId });
            setPendingMissionType(null);
            return;
        }

        let baseTurns = 1;
        if (missionType === 'Occupy') baseTurns = 2 + Math.floor(region.difficulty / 5);
        if (missionType === 'Explore') baseTurns = 1;
        if (missionType === 'War') baseTurns = 3 + Math.floor(region.difficulty / 8);
        if (missionType === 'Diplomacy') baseTurns = 2; 
        if (missionType === 'Trade') baseTurns = 2; 
        
        onUpdateMember(memberId, { assignment: 'Mission' });
        onUpdateRegion(region.id, {
            activeMission: {
                memberId,
                turnsRemaining: baseTurns,
                totalTurns: baseTurns,
                type: missionType
            }
        });
        setPendingMissionType(null);
    };

    const handleWithdrawGuard = (regionId: string, memberId: string) => {
        onUpdateMember(memberId, { assignment: 'Idle' });
        onUpdateRegion(regionId, { guardMemberId: undefined });
    };

    const getPanelStyle = () => {
        if (!selectedRegion) return {};
        const isRightSide = selectedRegion.x < 50;
        const isBottomSide = selectedRegion.y < 50;
        return {
            left: isRightSide ? `${selectedRegion.x}%` : 'auto',
            right: !isRightSide ? `${100 - selectedRegion.x}%` : 'auto',
            top: isBottomSide ? `${selectedRegion.y}%` : 'auto',
            bottom: !isBottomSide ? `${100 - selectedRegion.y}%` : 'auto',
            transform: `translate(${isRightSide ? '40px' : '-40px'}, ${isBottomSide ? '20px' : '-20px'})`,
        };
    };

    const factionZones = useMemo(() => {
        return regions.filter(r => r.isDiscovered && r.owner !== '无').map(r => (
            <div 
                key={`zone-${r.id}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] pointer-events-none transition-all duration-1000"
                style={{ 
                    left: `${r.x}%`, 
                    top: `${r.y}%`, 
                    width: '300px', 
                    height: '300px', 
                    background: getFactionColor(r.owner),
                    opacity: 0.15
                }}
            />
        ));
    }, [regions]);

    return (
        <div className="relative w-full h-full parchment scroll-shadow overflow-hidden border-8 border-[#4a3728] bg-[#e6d5b8]">
            <div className="absolute inset-0 z-0">{factionZones}</div>
            {regions.map(region => {
                const isDiscovered = region.isDiscovered;
                const isHome = region.id === 'li_clan_home';
                const isOccupied = !!region.activeMission || !!region.guardMemberId;
                const sizeClass = getCategorySizeClasses(region.category, region.id);

                if (!isDiscovered) return null;

                return (
                    <button
                        key={region.id}
                        onClick={() => {
                            onSelectRegion(region);
                            setPendingMissionType(null);
                        }}
                        onMouseEnter={() => setHoveredRegionId(region.id)}
                        onMouseLeave={() => setHoveredRegionId(null)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 group
                            ${currentRegionId === region.id ? 'scale-125 z-20' : 'hover:scale-110 z-10'}`}
                        style={{ left: `${region.x}%`, top: `${region.y}%` }}
                    >
                        <div className="flex flex-col items-center">
                            <div className={`${sizeClass} flex items-center justify-center rounded-full border-2 relative transition-all duration-300
                                ${isHome ? 'bg-amber-900 border-yellow-500 shadow-[0_0_20px_rgba(245,158,11,0.6)]' : 
                                  (region.category === 'Mystic' ? 'bg-purple-900 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-pulse' :
                                  (currentRegionId === region.id ? 'bg-red-900 border-yellow-400' : 
                                  (region.owner === '望月李氏' ? 'bg-amber-700 border-yellow-500' :
                                  (region.category === 'Stakeholder' ? 'bg-indigo-900 border-indigo-400' : 'bg-[#4a3728] border-[#2c1810]'))))} 
                                shadow-lg`}>
                                {getTypeIcon(region.type, region.category)}
                                {isOccupied && <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-600 rounded-full border border-white text-[10px] flex items-center justify-center animate-bounce text-white font-bold">⏳</div>}
                            </div>
                            <div className="mt-1">
                                <span className="text-[10px] font-bold bg-[#f4e4bc]/95 px-1.5 py-0.5 rounded border border-[#4a3728] text-amber-900">{region.name}</span>
                            </div>
                        </div>
                    </button>
                );
            })}

            {selectedRegion && selectedRegion.isDiscovered && (
                <div className={`absolute z-30 animate-scale-in flex flex-col pointer-events-auto`} style={getPanelStyle()}>
                    <div className="w-72 sm:w-80 bg-[#120a08] border-2 border-yellow-900/40 rounded shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[70vh]">
                        <div className="p-3 border-b border-yellow-900/20 bg-[#1e1310] flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-yellow-500 font-bold text-sm tracking-wider">{selectedRegion.name}</h3>
                                <span className="text-[10px] text-green-500 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{selectedRegion.owner}</span>
                            </div>
                            <button onClick={() => { onSelectRegion(null); setPendingMissionType(null); }} className="text-gray-500 hover:text-red-500 text-xl font-bold transition-colors">×</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-[#120a08] to-[#0a0504]">
                            <div className="bg-black/40 p-2 rounded border border-white/5 flex justify-between items-center">
                                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">建议境界</span>
                                {(() => {
                                    const requiredRealm = getRequiredRealm(selectedRegion.difficulty);
                                    const requiredIdx = REALM_ORDER.indexOf(requiredRealm);
                                    const isHigher = requiredIdx > maxClanRealmIdx;
                                    return (
                                        <span className={`text-[11px] font-bold font-serif ${isHigher ? 'text-red-500' : 'text-yellow-500'}`}>
                                            {requiredRealm}
                                        </span>
                                    );
                                })()}
                            </div>

                            {selectedRegion.category === 'Stakeholder' && selectedRegion.owner !== '望月李氏' && selectedRegion.owner !== '无' && (
                                <div className="bg-white/5 p-2 rounded border border-white/5 space-y-1.5">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] text-gray-500 font-bold tracking-tighter uppercase">势力好感度</span>
                                        <span className={`text-[10px] font-mono font-bold ${getReputationTextColor(reputation[selectedRegion.owner] || 0)}`}>
                                            {reputation[selectedRegion.owner] || 0}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${getReputationColor(reputation[selectedRegion.owner] || 0)}`}
                                            style={{ width: `${Math.min(100, Math.max(0, reputation[selectedRegion.owner] || 0))}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <p className="text-[10px] text-gray-500 italic leading-relaxed">{selectedRegion.description}</p>
                            
                            {guardingMember && (
                                <div className="bg-amber-900/10 p-3 rounded border border-amber-900/30 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">当前驻守</span>
                                        <span className="text-11px] text-amber-100 font-bold">{guardingMember.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        {(() => {
                                            const requiredRealm = getRequiredRealm(selectedRegion.difficulty);
                                            const isSufficient = REALM_ORDER.indexOf(guardingMember.realm) >= REALM_ORDER.indexOf(requiredRealm);
                                            return (
                                                <span className={`text-[10px] font-bold italic ${isSufficient ? 'text-green-500' : 'text-red-500'}`}>
                                                    {guardingMember.realm}{guardingMember.subRealm}层
                                                </span>
                                            );
                                        })()}
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleWithdrawGuard(selectedRegion.id, guardingMember.id)}
                                                className="px-2 py-1 bg-red-900/20 border border-red-900/40 text-red-400 text-[9px] rounded hover:bg-red-900/40 transition-colors"
                                            >
                                                撤回
                                            </button>
                                            <button 
                                                onClick={() => setPendingMissionType('Guard')}
                                                className="px-2 py-1 bg-blue-900/20 border border-blue-900/40 text-blue-400 text-[9px] rounded hover:bg-blue-900/40 transition-colors"
                                            >
                                                换人
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedRegion.activeMission ? (
                                <div className="p-4 bg-orange-900/10 rounded border border-orange-900/30 text-center animate-pulse">
                                    <p className="text-xs text-orange-400 font-bold">族人任务进行中</p>
                                    <p className="text-[10px] text-gray-600 mt-1"> 剩 {selectedRegion.activeMission.turnsRemaining} 回合</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingMissionType ? (
                                        <div className="animate-fade-in space-y-3">
                                            <div className="flex justify-between items-center border-b border-yellow-900/20 pb-1">
                                                <span className="text-[10px] text-yellow-600 font-bold">选择派遣人员</span>
                                                <button onClick={() => setPendingMissionType(null)} className="text-[10px] text-gray-600 hover:text-white">返回</button>
                                            </div>
                                            {dispatchableMembers.length > 0 ? (
                                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                                    {dispatchableMembers.map(m => {
                                                        const requiredRealm = getRequiredRealm(selectedRegion.difficulty);
                                                        const isSufficient = REALM_ORDER.indexOf(m.realm) >= REALM_ORDER.indexOf(requiredRealm);
                                                        
                                                        return (
                                                            <div key={m.id} className="bg-white/5 p-2 rounded flex justify-between items-center border border-white/5 hover:border-yellow-900/40 transition-all group">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] text-yellow-100/90">{m.name}</span>
                                                                    <span className={`text-[10px] font-bold ${isSufficient ? 'text-green-500' : 'text-red-500'}`}>
                                                                        {m.realm}{m.subRealm}层
                                                                    </span>
                                                                </div>
                                                                <button 
                                                                    onClick={() => handleDispatch(m.id, selectedRegion, pendingMissionType)} 
                                                                    className={`px-3 py-1 border text-[9px] rounded font-bold transition-all shadow-lg
                                                                        ${isSufficient 
                                                                            ? 'bg-yellow-900/40 border-yellow-700 text-yellow-500 hover:bg-yellow-700 hover:text-white' 
                                                                            : 'bg-red-900/20 border-red-900/40 text-red-400 hover:bg-red-900/40 hover:text-red-100'}`}
                                                                >
                                                                    派遣
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 border border-dashed border-gray-800 rounded">
                                                    <p className="text-[10px] text-gray-600 italic">暂无处于“无事务”状态的族人</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedRegion.category === 'Stakeholder' && (
                                                selectedRegion.id === 'li_clan_home' ? (
                                                    <p className="text-[10px] text-gray-700 italic text-center py-4">家族祖地，护佑族运</p>
                                                ) : selectedRegion.owner === '望月李氏' ? (
                                                    !guardingMember && <button onClick={() => setPendingMissionType('Guard')} className="w-full py-2.5 bg-slate-900/60 border border-slate-700 text-slate-400 text-[11px] font-bold rounded hover:bg-slate-800 hover:text-white transition-all">🛡️ 驻守</button>
                                                ) : (
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setPendingMissionType('Diplomacy')} className="flex-1 py-3 bg-[#1e2a4a]/40 border border-blue-900 text-blue-400 text-[11px] font-bold rounded hover:bg-blue-900 hover:text-white transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3)]">🤝 拜访</button>
                                                            <button onClick={() => setPendingMissionType('Trade')} className="flex-1 py-3 bg-[#1e3a2a]/40 border border-emerald-900 text-emerald-500 text-[11px] font-bold rounded hover:bg-emerald-900 hover:text-white transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3)]">💰 贸易</button>
                                                        </div>
                                                        <button onClick={() => setPendingMissionType('War')} className="w-full py-3 bg-[#3a1a1a]/40 border border-red-900 text-red-500 text-[11px] font-bold rounded hover:bg-red-900 hover:text-white transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3)]">⚔️ 攻打</button>
                                                    </div>
                                                )
                                            )}

                                            {selectedRegion.category === 'Resource' && (
                                                selectedRegion.owner === '望月李氏' ? (
                                                    !guardingMember && <button onClick={() => setPendingMissionType('Guard')} className="w-full py-2.5 bg-slate-900/60 border border-slate-700 text-slate-400 text-[11px] font-bold rounded hover:bg-slate-800 hover:text-white transition-all">🛡️ 驻守</button>
                                                ) : selectedRegion.owner === '无' ? (
                                                    <button onClick={() => setPendingMissionType('Occupy')} className="w-full py-3 bg-orange-900/30 border border-orange-700 text-orange-500 text-[11px] font-bold rounded hover:bg-orange-800 hover:text-white transition-all shadow-lg">🚩 占领</button>
                                                ) : (
                                                    <button onClick={() => setPendingMissionType('War')} className="w-full py-3 bg-[#3a1a1a]/40 border border-red-900 text-red-500 text-[11px] font-bold rounded hover:bg-red-900 hover:text-white transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3)]">⚔️ 攻打</button>
                                                )
                                            )}

                                            {(selectedRegion.category === 'Natural' || selectedRegion.category === 'Mystic') && (
                                                <button onClick={() => setPendingMissionType('Explore')} className="w-full py-3 bg-purple-900/20 border border-purple-700 text-purple-400 text-[11px] font-bold rounded hover:bg-purple-800 hover:text-white transition-all shadow-lg">🔍 探索</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorldMap;
