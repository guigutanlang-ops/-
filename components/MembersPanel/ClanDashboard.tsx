import React, { useState, useMemo } from 'react';
import { GameState, ClanMember, Realm, CultivationMethod } from '../../types';
import { REALM_ORDER, TASK_INFO } from '../../constants';
import { getRealmStyle, getRealmText, getTierColor, getRootGradeColor } from './Shared/utils';
import MemberDetailModal from './MemberDetailModal';
import Tooltip from '../Shared/Tooltip';
import { useTooltip } from '../Shared/useTooltip';
import { renderItemContent, renderPhysiqueContent } from '../Shared/TooltipRenderers';

interface Props {
    state: GameState;
    onUpdateMember: (id: string, updates: Partial<ClanMember>) => void;
    onAddMember: () => void;
    onOpenBreakthrough?: (id: string) => void;
    onContributeItem?: (memberId: string, itemId: number, category: string, quantity: number) => void;
}

const ITEMS_PER_PAGE = 20; // 增加每页显示人数

const ClanDashboard: React.FC<Props> = ({ state, onUpdateMember, onAddMember, onOpenBreakthrough, onContributeItem }) => {
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'alive' | 'deceased'>('alive');
    const [currentPage, setCurrentPage] = useState(0);

    const { tooltip, showTooltip, hideTooltip } = useTooltip();

    const selectedMember = useMemo(() => state.members.find(m => m.id === selectedMemberId), [state.members, selectedMemberId]);

    const filteredMembers = useMemo(() => {
        const list = state.members.filter(m => {
            const isTargetFamily = m.family === '望月李氏';
            const isCorrectStatus = activeTab === 'alive' ? m.status !== 'dead' : m.status === 'dead';
            return isTargetFamily && isCorrectStatus;
        });
        
        return list.sort((a, b) => {
            const realmDiff = REALM_ORDER.indexOf(b.realm) - REALM_ORDER.indexOf(a.realm);
            return realmDiff !== 0 ? realmDiff : b.subRealm - a.subRealm;
        });
    }, [state.members, activeTab]);

    const pagedMembers = filteredMembers.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            <Tooltip state={tooltip} />

            <div className="p-8 border-b border-border-soft/40 bg-bg-main/40 shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl font-bold text-accent-gold/90 tracking-widest">族谱常青</h2>
                    <span className="text-[10px] text-text-disabled border border-border-soft/30 px-2 py-0.5 rounded-sm">李氏嫡系：{filteredMembers.length} 人</span>
                </div>
                <div className="flex bg-black/40 p-1.5 rounded-sm border border-border-soft/30 gap-1.5 shadow-inner">
                    <button onClick={() => { setActiveTab('alive'); setCurrentPage(0); }} className={`flex-1 py-2 font-sans text-xs tracking-widest rounded-sm transition-all ${activeTab === 'alive' ? 'bg-accent-jade/30 text-accent-jade font-bold shadow-md' : 'text-text-disabled hover:text-text-muted hover:bg-white/5'}`}>在世族人</button>
                    <button onClick={() => { setActiveTab('deceased'); setCurrentPage(0); }} className={`flex-1 py-2 font-sans text-xs tracking-widest rounded-sm transition-all ${activeTab === 'deceased' ? 'bg-accent-jade/30 text-accent-jade font-bold shadow-md' : 'text-text-disabled hover:text-text-muted hover:bg-white/5'}`}>英灵祠堂</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-gradient-to-b from-transparent to-black/10">
                {pagedMembers.map(m => (
                    <div 
                        key={m.id} 
                        onClick={() => activeTab === 'alive' && setSelectedMemberId(m.id)} 
                        className={`p-5 rounded-sm border transition-all cursor-pointer group animate-fade-in
                            ${selectedMemberId === m.id 
                                ? 'bg-accent-jade/15 border-accent-jade/50 shadow-[0_0_20px_rgba(77,124,107,0.2)] scale-[1.02]' 
                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-border-soft/60'}`}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <span className={`font-serif text-lg tracking-widest transition-colors ${selectedMemberId === m.id ? 'text-accent-gold font-bold' : 'text-gray-300 group-hover:text-accent-jade'}`}>
                                {m.name}
                            </span>
                            <span className={`font-serif text-sm px-2 py-0.5 rounded-sm bg-black/40 border border-white/5 ${selectedMemberId === m.id ? 'text-accent-gold' : 'text-text-muted'}`}>
                                {getRealmText(m.realm, m.subRealm)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] tracking-wider">
                            <span className={`font-bold ${getRootGradeColor(m.rootGrade)}`}>◈ {m.rootGrade}</span>
                            <span className={`font-medium px-2 py-0.5 rounded-sm bg-black/20 ${TASK_INFO[m.assignment]?.color || 'text-text-disabled'}`}>
                                {TASK_INFO[m.assignment]?.label || '未知'}
                            </span>
                        </div>
                        {selectedMemberId === m.id && (
                             <div className="mt-4 pt-3 border-t border-accent-jade/20 flex justify-end">
                                <span className="text-[9px] text-accent-jade font-bold animate-pulse uppercase tracking-[0.2em]">镜照虚实 ◈ 详情</span>
                             </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedMember && (
                <MemberDetailModal 
                    member={selectedMember} state={state} 
                    onClose={() => setSelectedMemberId(null)}
                    onUpdateMember={onUpdateMember}
                    onSelectMember={(id) => setSelectedMemberId(id)}
                    onOpenBreakthrough={onOpenBreakthrough || (() => {})}
                    onContributeItem={onContributeItem}
                    showTooltip={showTooltip} hideTooltip={hideTooltip}
                    renderPhysiqueTooltip={(physique) => renderPhysiqueContent(physique)}
                    renderItemTooltip={(id) => renderItemContent(id, selectedMember)}
                    renderMethodTooltip={(m) => renderItemContent(m.id, selectedMember)}
                />
            )}
        </div>
    );
};

export default ClanDashboard;