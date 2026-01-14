
import React from 'react';
import { ClanMember, DevelopmentPlan } from '../../../types';
import { DEVELOPMENT_PLANS } from '../../../constants';

interface Props {
    member: ClanMember;
    onUpdatePlan: (plan: DevelopmentPlan) => void;
}

const PlanTab: React.FC<Props> = ({ member, onUpdatePlan }) => {
    return (
        <div className="h-full overflow-y-auto custom-scrollbar space-y-4 animate-fade-in max-w-2xl mx-auto pr-2">
            <div className="mb-6 p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">
                <p className="text-xs text-purple-400 font-bold mb-1">【道途指引】</p>
                <p className="text-[11px] text-gray-400 leading-relaxed italic">
                    设定族人的修行侧重。不同的计划会影响其在岁时轮转中获得相应百艺熟练度或战斗造诣的概率。
                </p>
            </div>
            
            {(Object.keys(DEVELOPMENT_PLANS) as DevelopmentPlan[]).map(planKey => (
                <button
                    key={planKey}
                    onClick={() => onUpdatePlan(planKey)}
                    className={`w-full p-6 rounded-2xl border transition-all text-left shadow-lg group relative overflow-hidden ${
                        member.developmentPlan === planKey 
                        ? 'bg-purple-900/30 border-purple-500 ring-1 ring-purple-500/50' 
                        : 'bg-black/30 border-white/5 hover:bg-black/50 hover:border-white/20'
                    }`}
                >
                    <div className="relative z-10">
                        <p className={`text-base font-bold mb-1 ${member.developmentPlan === planKey ? 'text-white' : 'text-gray-300'}`}>
                            {DEVELOPMENT_PLANS[planKey].label}
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            {DEVELOPMENT_PLANS[planKey].desc}
                        </p>
                    </div>
                    {member.developmentPlan === planKey && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl opacity-40">✨</div>
                    )}
                </button>
            ))}
        </div>
    );
};

// Add missing default export
export default PlanTab;
