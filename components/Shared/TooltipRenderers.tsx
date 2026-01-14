import React from 'react';
import { ClanMember, RootGrade } from '../../types';
import { REALM_ORDER, ALL_ITEM_DETAILS, PHYSIQUE_DETAILS } from '../../constants';
import { getGradeColor, getElementName } from '../MembersPanel/Shared/utils';

/**
 * 渲染体质详情
 */
export const renderPhysiqueContent = (physique: string) => {
    const isNormal = physique === '凡体' || physique === '无' || physique === '' || physique === '凡胎俗骨';
    return (
        <div className="w-52 sm:w-64">
            <h4 className={`${isNormal ? 'text-gray-300' : 'text-pink-400'} font-bold mb-2`}>{physique}</h4>
            <p className="text-xs text-gray-200">{(PHYSIQUE_DETAILS as any)[physique] || '暂无记载'}</p>
        </div>
    );
};

/**
 * 渲染物品/功法详情
 */
export const renderItemContent = (id: number, member?: ClanMember) => {
    const item: any = (ALL_ITEM_DETAILS as any)[id];
    if (!item) return <div className="text-gray-500 text-xs">未知物品</div>;
    
    const gradeColor = getGradeColor(item.grade);
    const req = item.requirements || (item.requiredRealm ? { realm: item.requiredRealm } : null);
    
    const checkRealm = member && req?.realm ? REALM_ORDER.indexOf(member.realm) >= REALM_ORDER.indexOf(req.realm) : true;
    const rootGrades: RootGrade[] = ['凡人', '伪灵根', '下品灵根', '中品灵根', '上品灵根', '极品灵根'];
    const checkRootGrade = member && req?.minRootGrade ? (
        rootGrades.indexOf(member.rootGrade) >= rootGrades.indexOf(req.minRootGrade)
    ) : true;

    const renderBuffs = (buffs: any) => {
        if (!buffs) return null;
        const entries = Object.entries(buffs);
        if (entries.length === 0) return null;

        const buffLabels: Record<string, string> = {
            cultivationSpeed: '修炼速度',
            maxAge: '寿元上限',
            attack: '攻击力',
            defense: '防御力'
        };

        return (
            <div className="mb-3 p-2 bg-blue-900/10 rounded border border-blue-900/20 space-y-1">
                <p className="text-[10px] text-blue-400 font-bold mb-1">功法加持:</p>
                {entries.map(([key, val]) => (
                    <div key={key} className="flex justify-between text-[11px]">
                        <span className="text-gray-400">{buffLabels[key] || key}:</span>
                        <span className="text-blue-300 font-bold">+{(val as any)}{key === 'cultivationSpeed' ? '%' : ''}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-52 sm:w-64 font-serif">
            <div className="flex justify-between items-center mb-2 border-b border-yellow-900/20 pb-2">
                <span className={`font-bold text-sm ${gradeColor}`}>{item.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold border ${gradeColor}`}>
                    {typeof item.grade === 'number' ? `${item.gradeText}` : item.gradeText}
                </span>
            </div>
            
            <p className="text-xs text-gray-300 italic mb-3 leading-relaxed">{item.desc}</p>
            
            {item.effect && item.category === 'pill' && (
                <div className="mb-3 p-2 bg-blue-900/10 rounded border border-pink-900/20 flex justify-between text-[11px]">
                    <span className="text-blue-400 font-bold">使用效果:</span>
                    <span className="text-xs text-blue-300">{item.effect}</span>
                </div>
            )}

            {item.category === 'method' && renderBuffs(item.buffs)}
            
            {req && (
                <div className="mb-3 p-2 bg-black/40 rounded border border-white/5 space-y-1.5">                     
                    {req.realm && (
                        <div className="flex justify-between text-[11px]">
                            <span className="text-gray-400">境界需求:</span>
                            <span className={checkRealm ? "text-green-500" : "text-red-500 font-bold"}>
                                {req.realm}
                            </span>
                        </div>
                    )}
                    
                    {req.minRootGrade && (
                        <div className="flex justify-between text-[11px]">
                            <span className="text-gray-400">品质要求:</span>
                            <span className={checkRootGrade ? "text-green-500" : "text-red-500 font-bold"}>
                                {req.minRootGrade}
                            </span>
                        </div>
                    )}

                    {req.minRoots && Object.entries(req.minRoots).map(([element, value]) => {
                        const memberValue = member?.roots[element as keyof ClanMember['roots']] || 0;
                        const isMet = memberValue >= (value as number);
                        return (
                            <div key={element} className="flex justify-between text-[11px]">
                                <span className="text-gray-400">{getElementName(element)}灵根需求:</span>
                                <span className={isMet ? "text-green-500" : "text-red-500 font-bold"}>
                                    ≥{value as number}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
