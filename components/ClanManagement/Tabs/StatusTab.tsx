
import React, { useMemo } from 'react';
import { GameState, Realm, InjuryStatus } from '../../../types';
import { REALM_ORDER } from '../../../constants';

interface Props {
    state: GameState;
}

const StatusTab: React.FC<Props> = ({ state }) => {
    const aliveMembers = useMemo(() => state.members.filter(m => m.status !== InjuryStatus.Dead && m.family === '望月李氏'), [state.members]);

    const realmStats = useMemo(() => {
        const stats: Record<string, number> = {};
        let maxRealmIdx = 0;
        aliveMembers.forEach(m => {
            stats[m.realm] = (stats[m.realm] || 0) + 1;
            maxRealmIdx = Math.max(maxRealmIdx, REALM_ORDER.indexOf(m.realm));
        });
        return REALM_ORDER.slice(0, maxRealmIdx + 1).reverse();
    }, [aliveMembers]);

    const resourceCards = [
        { label: '家族灵石', value: state.spiritStones, icon: '✨', color: 'text-yellow-500', bg: 'bg-yellow-900/10', border: 'border-yellow-900/20' },
        { label: '族中功德', value: state.merit, icon: '💠', color: 'text-blue-500', bg: 'bg-blue-900/10', border: 'border-blue-900/20' },
        { label: '家族底蕴', value: state.heritagePool, icon: '🧬', color: 'text-purple-500', bg: 'bg-purple-900/10', border: 'border-purple-900/20' },
    ];

    return (
        <div className="space-y-12 animate-fade-in max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {resourceCards.map(card => (
                    <div key={card.label} className={`p-6 ${card.bg} border ${card.border} rounded shadow-inner`}>
                        <h3 className={`${card.color} text-[11px] font-bold uppercase mb-6 tracking-widest flex items-center gap-2`}>
                            <span>{card.icon}</span> {card.label}
                        </h3>
                        <div className="flex items-baseline gap-2">
                            <span className={`${card.color} text-3xl font-mono font-bold`}>{card.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-black/40 border border-border-soft rounded shadow-inner">
                    <h3 className="text-accent-jade text-[11px] font-bold uppercase mb-6 tracking-widest flex items-center gap-2">
                        <span>📈</span> 境界分布
                    </h3>
                    <div className="space-y-4">
                        {realmStats.map(r => (
                            <div key={r} className="flex justify-between items-center group">
                                <span className="text-gray-500 group-hover:text-text-main transition-colors">{r}</span>
                                <div className="flex-1 mx-4 h-px bg-border-soft/50"></div>
                                <span className="text-gray-300 font-bold font-mono">{aliveMembers.filter(m => m.realm === r).length} <span className="text-[10px] font-normal text-gray-500">位</span></span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-black/40 border border-border-soft rounded shadow-inner">
                    <h3 className="text-accent-gold text-[11px] font-bold uppercase mb-6 tracking-widest flex items-center gap-2">
                        <span>🌿</span> 核心物产
                    </h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">灵草存量</span>
                            <span className="text-accent-jade font-bold font-mono">{(Object.values(state.inventory.herbs) as number[]).reduce((a, b) => a + b, 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">矿石储备</span>
                            <span className="text-gray-400 font-bold font-mono">{(Object.values(state.inventory.minerals) as number[]).reduce((a, b) => a + b, 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">丹药库存</span>
                            <span className="text-pink-500 font-bold font-mono">{(Object.values(state.inventory.pills) as number[]).reduce((a, b) => a + b, 0)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusTab;
