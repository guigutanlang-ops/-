import React from 'react';
import { ClanMember, TaskType } from '../../../types';
import { getTierColor, getRootGradeColor, getElementColorClass, getElementName } from '../Shared/utils';
import { TASK_INFO, ASPIRATIONS } from '../../../constants';

interface Props {
    member: ClanMember;
    showPhysiqueTooltip: (e: React.MouseEvent) => void;
    hideTooltip: () => void;
}

const AttributeTab: React.FC<Props> = ({ member, showPhysiqueTooltip, hideTooltip }) => {
    const aspirationInfo = ASPIRATIONS[member.aspiration] || ASPIRATIONS['Unset'];
    const taskDetails = TASK_INFO[member.assignment];

    const InfoRow = ({ label, value, valueClass = "text-text-main" }: { label: string, value: string | number, valueClass?: string }) => (
        <div className="flex justify-between items-center py-2 border-b border-border-soft">
            <span className="font-sans font-body text-text-muted">{label}</span>
            <span className={`font-sans font-value ${valueClass}`}>{value}</span>
        </div>
    );

    const hasSpecialPhysique = member.physique !== '无' && member.physique !== '凡体' && member.physique !== '';

    return (
        <div className="h-full overflow-y-auto custom-scrollbar pr-4 pt-2 space-y-10 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                <section>
                    <h4 className="font-serif font-semibold font-h1 text-text-main/80 mb-6 flex items-center gap-3">
                        <span className="w-1.5 h-1.5 bg-text-main/80 rounded-full"></span>
                        基础属性
                    </h4>
                    <div className="space-y-1">
                        <InfoRow label="性别" value={member.gender} valueClass="text-gray-300" />
                        <InfoRow label="寿元" value={`${member.age} / ${member.maxAge} 载`} valueClass={member.maxAge - member.age < 10 ? 'text-red-400' : 'text-gray-300'} />
                        <InfoRow label="家族" value={member.family} valueClass="text-gray-300"/>
                        <InfoRow label="宗门" value={member.sect} valueClass="text-gray-300"/>
                        <InfoRow label="职位" value={member.position} valueClass="text-gray-300" />
                        <InfoRow label="贡献点" value={member.contributionPoints} valueClass="text-gray-300"/>
                        <InfoRow 
                            label="状态" 
                            value={taskDetails?.label || member.assignment} 
                            valueClass={taskDetails?.color || "text-text-main"}
                        />
                    </div>
                </section>

                <section>
                    <h4 className="font-serif font-semibold font-h1 text-text-main/80 mb-6 flex items-center gap-3">
                        <span className="w-1.5 h-1.5 bg-text-main/80 rounded-full"></span>
                        修行天赋
                    </h4>
                    <div className="space-y-1">
                        <InfoRow label="资质" value={member.aptitude} valueClass="text-gray-300 font-bold" />
                        <InfoRow label="悟性" value={member.comprehension} valueClass="text-gray-300 font-bold" />
                        <InfoRow label="神识" value={member.divineSense} valueClass="text-gray-300 font-bold" />
                        <div className="flex justify-between items-center py-2 border-b border-border-soft">
                            <span className="font-sans font-body text-text-muted">体质</span>
                            <span 
                                onMouseEnter={showPhysiqueTooltip}
                                onMouseLeave={hideTooltip}
                                className={`font-sans font-value underline decoration-accent-gold/30 underline-offset-4  ${hasSpecialPhysique ? 'text-pink-400' : 'text-gray-300'}`}
                            >
                                {member.physique}
                            </span>
                        </div>
                        <InfoRow label="评价" value={member.tier} valueClass={getTierColor(member.tier)} />
                        <InfoRow label="志向" value={aspirationInfo.label} valueClass="text-gray-300" />
                    </div>
                </section>
            </div>

            <section>
                <h4 className="font-serif font-semibold font-h1 text-text-main/80 mb-8 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-text-main/80 rounded-full"></span>
                    五行灵根 · <span className={getRootGradeColor(member.rootGrade)}>{member.rootGrade}</span>
                </h4>
                <div className="grid grid-cols-5 gap-4">
                    {(Object.entries(member.roots) as [string, number][]).map(([key, val]) => (
                        <div key={key} className={`p-4 bg-bg-panel/40 border border-border-soft rounded-sm text-center transition-all ${val === 0 ? 'opacity-20' : ''}`}>
                            <p className={`font-serif font-h2 mb-2 ${getElementColorClass(key).split(' ')[0]}`}>{getElementName(key)}</p>
                            <p className={`font-sans font-value-large ${val > 0 ? getElementColorClass(key).split(' ')[0] : 'text-text-disabled'}`}>{val}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default AttributeTab;