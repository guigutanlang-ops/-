
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

const ITEMS_PER_PAGE = 12;

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
        <div className="bg-bg-panel border-l border-border-soft h-full flex flex-col relative overflow-hidden shadow-2xl">
            <Tooltip state={tooltip} />

            <div className="p-6 border-b border-border-soft bg-bg-main/30 shrink-0">
                <h2 className="font-serif font-h1 text-accent-gold/90 mb-6">族谱常青</h2>
                <div className="flex bg-bg-main p-1 rounded-sm border border-border-soft gap-1">
                    <button onClick={() => { setActiveTab('alive'); setCurrentPage(0); }} className={`flex-1 py-2 font-sans font-caption rounded-sm transition-all ${activeTab === 'alive' ? 'bg-accent-jade/20 text-accent-jade font-bold' : 'text-text-disabled hover:text-text-muted'}`}>在世族人</button>
                    <button onClick={() => { setActiveTab('deceased'); setCurrentPage(0); }} className={`flex-1 py-2 font-sans font-caption rounded-sm transition-all ${activeTab === 'deceased' ? 'bg-accent-jade/20 text-accent-jade font-bold' : 'text-text-disabled hover:text-text-muted'}`}>英灵祠堂</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                <div className="space-y-1">
                    {pagedMembers.map(m => (
                        <div 
                            key={m.id} 
                            onClick={() => activeTab === 'alive' && setSelectedMemberId(m.id)} 
                            className={`p-4 rounded-sm border transition-all cursor-pointer group
                                ${selectedMemberId === m.id 
                                    ? 'bg-accent-jade/10 border-accent-jade/40 shadow-inner' 
                                    : 'bg-transparent border-transparent hover:bg-bg-main/40 hover:border-border-soft'}`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className={`font-sans font-body font-bold transition-colors ${selectedMemberId === m.id ? 'text-accent-gold' : 'text-gray-400 group-hover:text-accent-jade'}`}>
                                    {m.name}
                                </span>
                                <span className="font-sans font-caption text-text-muted opacity-70">
                                    {getRealmText(m.realm, m.subRealm)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={`font-sans font-caption ${getRootGradeColor(m.rootGrade)}`}>{m.rootGrade}</span>
                                <span className={`font-sans font-caption font-medium ${TASK_INFO[m.assignment]?.color || 'text-text-disabled'}`}>
                                    {TASK_INFO[m.assignment]?.label || '未知'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
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
