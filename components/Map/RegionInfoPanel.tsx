import React, { useState } from 'react';
import { Region, Realm, ClanMember, TaskType } from '../../types';
import { REALM_ORDER } from '../../constants';
import { getRealmText } from '../MembersPanel/Shared/utils';

interface RegionInfoPanelProps {
    region: Region;
    members: ClanMember[];
    onClose: () => void;
    onAssignMission: (memberId: string, missionType: string) => void;
    position?: { left?: string; right?: string; top?: string; bottom?: string };
}

const RegionInfoPanel: React.FC<RegionInfoPanelProps> = ({ region, members, onClose, onAssignMission, position }) => {
    const [isDispatching, setIsDispatching] = useState(false);
    const [confirmingMemberId, setConfirmingMemberId] = useState<string | null>(null);
    const [isConfirmingRecall, setIsConfirmingRecall] = useState(false);

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

    // Filter and sort available clan members (highest realm first)
    const availableMembers = members
        .filter(m => 
            m.family === '望月李氏' && 
            m.status === 'healthy' && 
            m.assignment === 'Idle' &&
            m.realm !== Realm.Mortal
        )
        .sort((a, b) => {
            const idxA = REALM_ORDER.indexOf(a.realm);
            const idxB = REALM_ORDER.indexOf(b.realm);
            if (idxB !== idxA) return idxB - idxA;
            // If same realm, sort by sub-realm
            return b.subRealm - a.subRealm;
        });

    const getMissionType = () => {
        if (region.owner === '望月李氏') return 'Guard'; // 驻守
        if (region.category === 'Mystic' || region.category === 'Natural') return 'Explore'; // 探秘/探索
        if (region.category === 'Stakeholder') return 'Diplomacy'; // 外交
        if (region.owner === '无' && region.category === 'Resource') return 'Occupy'; // 占领
        return 'Attack'; // 攻打
    };

    const missionType = getMissionType();
    const missionLabels: Record<string, string> = {
        'Guard': '驻守据点',
        'Explore': '探索险地',
        'Diplomacy': '外交通商',
        'Occupy': '占领资源',
        'Attack': '攻打敌占'
    };

    const activeMemberId = region.activeMission?.memberId || region.guardMemberId;
    const activeMember = members.find(m => m.id === activeMemberId);

    return (
        <div 
            className="absolute z-[5000] pointer-events-none"
            style={position || { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
            <div className="pointer-events-auto animate-fade-in shadow-[0_30px_100px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden border-[2px] border-yellow-900/40">
                <div className="w-[400px] bg-[#0d0908]/95 backdrop-blur-2xl flex flex-col max-h-[60vh] ring-1 ring-white/5">
                    
                    {/* Ancient Title Header */}
                    <div className="px-6 py-4 border-b border-yellow-900/30 bg-[#1a1210] flex justify-between items-center relative overflow-hidden shrink-0">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-600/30 to-transparent"></div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <h3 className="text-yellow-500 font-bold text-xl tracking-[0.2em] font-serif">{region.name}</h3>
                                <span className="px-2 py-0.5 bg-yellow-900/30 border border-yellow-900/30 text-[10px] text-yellow-600/80 rounded-sm font-serif uppercase tracking-widest">
                                    {region.category === 'Resource' ? '灵地资源' : 
                                     region.category === 'Mystic' ? '秘境神异' : 
                                     region.category === 'Natural' ? '山川地理' : '雄踞一方'}
                                </span>
                            </div>
                            <span className="text-[9px] text-accent-gold/30 tracking-[0.3em] font-serif mt-1 italic uppercase">MOUNTAIN & RIVER RECORDS</span>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="w-8 h-8 flex items-center justify-center text-yellow-900/80 hover:text-red-800 transition-colors text-2xl font-serif"
                        >
                            ×
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-[#120a08] to-[#080302]">
                        
                        {!isDispatching ? (
                            <>
                                {/* Stats Summary */}
                                <div className="flex divide-x divide-yellow-900/20 bg-black/40 rounded-sm border border-yellow-900/10 shadow-inner">
                                    <div className="flex-1 p-3 flex flex-col items-center">
                                        <span className="text-[10px] text-gray-600 font-serif tracking-[0.2em] mb-1">推荐修为</span>
                                        <span className="text-sm font-serif tracking-widest text-yellow-600/90 font-bold">
                                            {requiredRealm}
                                        </span>
                                    </div>
                                    <div className="flex-1 p-3 flex flex-col items-center">
                                        <span className="text-[10px] text-gray-600 font-serif tracking-[0.2em] mb-1">势力归属</span>
                                        <span className="text-sm font-serif tracking-widest text-accent-jade font-bold">
                                            {region.owner}
                                        </span>
                                    </div>
                                    <div className="flex-1 p-3 flex flex-col items-center">
                                        <span className="text-[10px] text-gray-600 font-serif tracking-[0.2em] mb-1">险要程度</span>
                                        <span className={`text-sm font-serif tracking-widest font-bold ${region.difficulty > 20 ? 'text-red-500/80' : 'text-accent-gold/80'}`}>
                                            {region.difficulty > 35 ? '劫难' : region.difficulty > 20 ? '凶险' : '平稳'}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Description */}
                                <div className="relative p-5 bg-[#1a1210]/30 rounded-sm border-l-2 border-yellow-900/40 before:content-['“'] before:absolute before:top-2 before:left-2 before:text-2xl before:text-yellow-900/20 after:content-['”'] after:absolute after:bottom-1 after:right-4 after:text-2xl after:text-yellow-900/20">
                                    <p className="text-[14px] text-gray-400 leading-[1.8] font-serif tracking-wide italic indent-2">
                                        {region.description}
                                    </p>
                                </div>
 
                                {/* Resources Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-yellow-900/40 to-transparent"></div>
                                        <h4 className="text-[10px] font-serif text-yellow-600/40 uppercase tracking-[0.3em]">山川·特产</h4>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-yellow-900/40 to-transparent"></div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {region.resources.map(res => (
                                            <span key={res} className="px-3 py-1 bg-[#1a1210] border border-yellow-900/20 text-yellow-500/60 text-xs rounded-sm font-serif hover:text-yellow-500 transition-colors">
                                                {res}
                                            </span>
                                        ))}
                                    </div>
                                </div>
 
                {/* Action Area */}
                                <div className="pt-2">
                                    {region.id !== 'li_clan_home' && !region.activeMission && !region.guardMemberId && (
                                        <button 
                                            onClick={() => setIsDispatching(true)}
                                            className="group w-full py-3 bg-yellow-950/20 hover:bg-yellow-900/30 border border-yellow-900/50 text-yellow-500 text-sm font-bold rounded-sm tracking-[0.4em] transition-all relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            {missionLabels[missionType] || '派遣'}
                                        </button>
                                    )}
 
                                    {(region.activeMission || region.guardMemberId) && (
                                        <div className="space-y-3">
                                            <div className="w-full py-4 bg-blue-950/20 border border-blue-900/30 text-blue-400 text-center rounded-sm relative overflow-hidden">
                                                {region.activeMission && (
                                                    <div className="absolute top-0 left-0 h-full bg-blue-500/10 transition-all duration-1000" style={{ width: `${(1 - region.activeMission.turnsRemaining / region.activeMission.totalTurns) * 100}%` }}></div>
                                                )}
                                                <div className="relative z-10">
                                                    <p className="text-sm font-serif tracking-widest font-bold">
                                                        {activeMember?.name} {region.guardMemberId ? '镇守' : '敕命'}其间
                                                    </p>
                                                    {region.activeMission ? (
                                                        <p className="text-[10px] mt-1 opacity-60 font-serif tracking-widest uppercase">预计余 {region.activeMission.turnsRemaining} 载可复命</p>
                                                    ) : (
                                                        <p className="text-[10px] mt-1 text-accent-jade/70 font-serif tracking-widest uppercase">持续产出收益中</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Recall Button */}
                                            {!isConfirmingRecall ? (
                                                <button 
                                                    onClick={() => setIsConfirmingRecall(true)}
                                                    className="w-full py-2 bg-red-950/10 hover:bg-red-900/20 border border-red-900/30 text-red-700/80 hover:text-red-600 text-xs font-bold rounded-sm tracking-[0.2em] transition-all"
                                                >
                                                    撤销命令
                                                </button>
                                            ) : (
                                                <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <button 
                                                        onClick={() => {
                                                            if (activeMemberId) {
                                                                onAssignMission(activeMemberId, 'Recall');
                                                            }
                                                            setIsConfirmingRecall(false);
                                                        }}
                                                        className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-500 text-xs font-bold rounded-sm tracking-[0.2em] transition-all"
                                                    >
                                                        确定撤销
                                                    </button>
                                                    <button 
                                                        onClick={() => setIsConfirmingRecall(false)}
                                                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-500 text-xs font-bold rounded-sm tracking-[0.2em] transition-all"
                                                    >
                                                        取消
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="animate-fade-in flex flex-col h-full">
                                <div className="flex items-center justify-between mb-5">
                                    <h4 className="text-[10px] font-serif text-yellow-600/60 uppercase tracking-[0.3em] flex items-center gap-3">
                                         <span className="w-1.5 h-1.5 rotate-45 border border-yellow-600/40"></span>
                                         选择领命族人
                                    </h4>
                                    <button 
                                        onClick={() => {
                                            setIsDispatching(false);
                                            setConfirmingMemberId(null);
                                        }}
                                        className="text-[10px] text-gray-600 hover:text-yellow-600 font-serif transition-colors px-3 py-1 border border-yellow-900/20 rounded-sm uppercase tracking-widest"
                                    >
                                        返回 ⏎
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                                    {availableMembers.length > 0 ? availableMembers.map(m => {
                                        const memberIdx = REALM_ORDER.indexOf(m.realm);
                                        const isSafe = memberIdx >= requiredIdx;
                                        const isConfirming = confirmingMemberId === m.id;
                                        
                                        return (
                                            <div key={m.id} className="space-y-1">
                                                <div 
                                                    onClick={() => !isConfirming && setConfirmingMemberId(m.id)}
                                                    className={`p-4 bg-white/[0.02] border transition-all cursor-pointer group flex justify-between items-center rounded-sm relative overflow-hidden
                                                        ${isConfirming 
                                                            ? 'border-yellow-600 bg-yellow-600/10' 
                                                            : isSafe 
                                                                ? 'border-yellow-900/20 hover:border-yellow-600/40 hover:bg-yellow-600/5' 
                                                                : 'border-red-900/30 hover:border-red-600/40 hover:bg-red-950/20'}`}
                                                >
                                                    <div className="flex flex-col gap-1 z-10">
                                                        <span className="text-[15px] font-serif font-bold text-gray-200 group-hover:text-yellow-500 transition-colors tracking-widest">{m.name}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 z-10 text-right">
                                                        <span className={`text-xs font-serif font-bold tracking-widest ${isSafe ? 'text-accent-jade' : 'text-red-500/70'}`}>
                                                            {getRealmText(m.realm, m.subRealm)}
                                                        </span>
                                                        {!isConfirming && (
                                                            <span className="text-[10px] text-yellow-600/40 font-serif tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-all">
                                                                点击分配 ◈
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Confirmation Subpanel */}
                                                {isConfirming && (
                                                    <div className="p-3 bg-yellow-950/20 border-x border-b border-yellow-600/40 flex flex-col gap-3 animate-in slide-in-from-top-1 duration-200">
                                                        <p className="text-[11px] text-yellow-500/80 font-serif leading-relaxed italic text-center">
                                                            确定派遣【{m.name}】前往执行 {missionLabels[missionType]} 吗？
                                                        </p>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    onAssignMission(m.id, missionType);
                                                                    setIsDispatching(false);
                                                                    setConfirmingMemberId(null);
                                                                }}
                                                                className="flex-1 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/40 text-yellow-500 text-[10px] font-bold rounded-sm tracking-[0.2em] transition-all"
                                                            >
                                                                确认任命
                                                            </button>
                                                            <button 
                                                                onClick={() => setConfirmingMemberId(null)}
                                                                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-500 text-[10px] font-bold rounded-sm tracking-[0.2em] transition-all"
                                                            >
                                                                取消
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }) : (
                                        <div className="py-12 text-center border border-dashed border-yellow-900/10 rounded-sm bg-black/20">
                                            <p className="text-gray-600 text-sm font-serif italic tracking-widest">族中暂无合适人选待命</p>
                                            <span className="text-[9px] text-gray-800 font-serif mt-2 block uppercase tracking-tighter">no available clan members</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-black/60 border-t border-white/5 text-center flex justify-center items-center gap-4">
                         <div className="h-[1px] w-8 bg-yellow-900/20"></div>
                         <span className="font-serif text-yellow-900/30 text-[10px] tracking-[0.5em] uppercase">Hantian Mirror</span>
                         <div className="h-[1px] w-8 bg-yellow-900/20"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegionInfoPanel;
