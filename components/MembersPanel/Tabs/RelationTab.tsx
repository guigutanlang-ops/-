
import React, { useMemo } from 'react';
import { ClanMember, GameState } from '../../../types';
import { getRealmStyle, getRealmText, getTierColor, getGenerationTitle, getGenerationChar, calculateMemberGeneration } from '../Shared/utils';

interface Props {
    member: ClanMember;
    state: GameState;
    onSelectMember: (id: string) => void;
}

const RelationTab: React.FC<Props> = ({ member, state, onSelectMember }) => {
    const findMember = (id?: string | null) => state.members.find(m => m.id === id);
    
    const father = findMember(member.fatherId);
    const mother = findMember(member.motherId);
    const spouse = findMember(member.spouseId);
    const mentor = findMember(member.mentorId);
    
    const children = state.members.filter(m => m.fatherId === member.id || m.motherId === member.id);
    const siblings = state.members.filter(m => 
        m.id !== member.id && 
        (m.fatherId === member.fatherId && member.fatherId !== null) &&
        (m.motherId === member.motherId && member.motherId !== null)
    );
    const disciples = state.members.filter(m => m.mentorId === member.id);

    // 动态计算代数
    const generation = useMemo(() => calculateMemberGeneration(member, state.members), [member, state.members]);

    // Use React.FC to properly handle props including key for the sub-component
    const MemberCard: React.FC<{ member: ClanMember, label: string, icon: string }> = ({ member: m, label, icon }) => (
        <div 
            onClick={() => onSelectMember(m.id)}
            className="bg-black/30 border border-yellow-900/20 p-3 rounded-lg flex items-center gap-3 hover:border-yellow-500/50 transition-all cursor-pointer group shadow-lg"
        >
            <div className="w-10 h-10 rounded-full bg-yellow-900/10 flex items-center justify-center border border-yellow-900/30 text-xl group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-yellow-100">{m.name}</span>
                    <span className="text-[8px] text-gray-500 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{label}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className={`text-[9px] ${getRealmStyle(m.realm).split(' ')[2]}`}>{getRealmText(m.realm, m.subRealm)}</span>
                    <span className={`text-[9px] font-black ${getTierColor(m.tier)}`}>{m.tier}</span>
                </div>
            </div>
        </div>
    );

    const genChar = getGenerationChar(generation, member.gender);

    return (
        <div className="h-full overflow-y-auto custom-scrollbar space-y-8 animate-fade-in pr-2 pt-2">
            <div className="bg-black/20 p-4 rounded-xl border border-yellow-900/10 flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500">当前辈分</p>
                    <p className="text-xl font-cursive text-yellow-500 mt-1">{getGenerationTitle(generation)}</p>
                    {genChar && (
                        <p className="text-[10px] text-yellow-800/60 font-bold mt-0.5">排字：【{genChar}】</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">家族职位</p>
                    <p className="text-sm font-bold text-orange-400 mt-1">{member.position}</p>
                </div>
            </div>

            {(father || mother || spouse) && (
                <div className="space-y-3">
                    <h4 className="text-yellow-600 text-[12px] font-bold uppercase tracking-[0.2em] border-b border-yellow-900/10 pb-1 flex items-center gap-2">💍 至亲眷属</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {father && <MemberCard member={father} label="尊父" icon="👴" />}
                        {mother && <MemberCard member={mother} label="慈母" icon="👵" />}
                        {spouse && <MemberCard member={spouse} label="道侣" icon="💍" />}
                    </div>
                </div>
            )}

            {siblings.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-yellow-600 text-[12px] font-bold uppercase tracking-[0.2em] border-b border-yellow-900/10 pb-1 flex items-center gap-2">🤝 同胞兄弟</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {siblings.map(m => <MemberCard key={m.id} member={m} label="同胞" icon="🤝" />)}
                    </div>
                </div>
            )}

            {children.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-yellow-600 text-[12px] font-bold uppercase tracking-[0.2em] border-b border-yellow-900/10 pb-1 flex items-center gap-2">👶 膝下子女</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {children.map(m => <MemberCard key={m.id} member={m} label="子女" icon="👶" />)}
                    </div>
                </div>
            )}
        </div>
    );
};

// Add missing default export
export default RelationTab;
