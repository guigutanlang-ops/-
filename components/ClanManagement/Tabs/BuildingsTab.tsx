import React, { useState } from 'react';
import { Building, BuildingCategory } from '../../../types';
import { BUILDING_TYPES } from '../../../constants';

interface Props {
    buildings: Building[];
    spiritStones: number;
    onAddBuilding: (type: string) => void;
    onCancelBuilding?: (id: string) => void;
}

const BuildingsTab: React.FC<Props> = ({ buildings, spiritStones, onAddBuilding, onCancelBuilding }) => {
    const [confirmingBuildType, setConfirmingBuildType] = useState<string | null>(null);
    const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null);

    const getBuildingProgress = (b: Building) => {
        const total = BUILDING_TYPES[b.type].baseTurns;
        const current = total - b.turnsRemaining;
        return (current / total) * 100;
    };

    const handleConfirmBuild = () => {
        if (confirmingBuildType) {
            onAddBuilding(confirmingBuildType);
            setConfirmingBuildType(null);
        }
    };

    const handleConfirmCancel = () => {
        if (confirmingCancelId && onCancelBuilding) {
            onCancelBuilding(confirmingCancelId);
            setConfirmingCancelId(null);
        }
    };

    const renderBuildingList = (category: BuildingCategory) => {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(BUILDING_TYPES)
                    .filter(([_, info]) => info.category === category)
                    .map(([type, info]) => {
                        const b = buildings.find(building => building.type === type);
                        const isBuilding = b && !b.isFinished;
                        const isFinished = b && b.isFinished;
                        const canAfford = spiritStones >= info.baseCost;

                        return (
                            <div key={type} className={`p-6 bg-black/40 border rounded shadow-lg transition-all flex flex-col justify-between ${isFinished ? 'border-yellow-900/40 opacity-70' : 'border-yellow-900/20'}`}>
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="w-16 h-16 bg-black/60 rounded border border-white/5 flex items-center justify-center p-2 overflow-hidden">
                                            {info.image ? (
                                                <img src={info.image} alt={info.name} className="w-full h-full object-contain" onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    const parent = (e.target as HTMLElement).parentElement;
                                                    if(parent) {
                                                        const span = document.createElement('span');
                                                        span.className = "text-3xl";
                                                        span.innerText = info.icon;
                                                        parent.appendChild(span);
                                                    }
                                                }} />
                                            ) : (
                                                <span className="text-3xl">{info.icon}</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] bg-yellow-900/20 px-2 py-1 rounded text-yellow-600 font-bold uppercase tracking-widest">{info.category}</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-yellow-500 mb-2">{info.name}</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{info.desc}</p>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-yellow-900/10">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">营造费用</span>
                                        <span className={`font-mono font-bold ${canAfford ? 'text-yellow-400' : 'text-red-500'}`}>✨ {info.baseCost}</span>
                                    </div>
                                    
                                    {isBuilding ? (
                                        <div className="space-y-3">
                                            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-yellow-600 h-full transition-all" style={{ width: `${getBuildingProgress(b)}%` }}></div>
                                            </div>
                                            <p className="text-[10px] text-gray-500 text-center">正在营造... 还需 {b.turnsRemaining} 载</p>
                                            <button 
                                                onClick={() => setConfirmingCancelId(b.id)}
                                                className="w-full py-1.5 bg-red-900/10 border border-red-900/30 text-red-500 text-[10px] font-bold rounded hover:bg-red-900/30 transition-all uppercase tracking-tighter"
                                            >
                                                取消营造
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            disabled={isFinished || !canAfford}
                                            onClick={() => setConfirmingBuildType(type)}
                                            className={`w-full py-2 rounded font-bold text-xs tracking-widest transition-all ${isFinished ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : (canAfford ? 'bg-yellow-800 text-yellow-100 hover:bg-yellow-700' : 'bg-red-900/20 text-red-500 border border-red-900/30 cursor-not-allowed')}`}
                                        >
                                            {isFinished ? '已经拥有' : (canAfford ? '开始建造' : '灵石不足')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
            </div>
        );
    };

    return (
        <div className="space-y-12 animate-fade-in max-w-5xl mx-auto pb-10">
            <div>
                <h3 className="text-blue-700 text-sm font-bold mb-6 border-l-4 border-blue-700 pl-4 tracking-widest">家族功能建筑</h3>
                {renderBuildingList('家族功能')}
            </div>
            <div>
                <h3 className="text-emerald-700 text-sm font-bold mb-6 border-l-4 border-emerald-700 pl-4 tracking-widest">修行基础建筑</h3>
                {renderBuildingList('修行基础')}
            </div>

            {confirmingBuildType && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="-translate-y-[70px]">
                    <div className="bg-[#1a1310] border-4 border-[#4a3728] p-8 rounded-sm shadow-2xl max-w-sm w-full text-center animate-fade-in ">
                        <h4 className="text-2xl font-cursive text-yellow-500 mb-6 tracking-widest">营造诏书</h4>
                        <div className="bg-black/60 p-6 rounded-sm border border-white/5 mb-8">
                            <p className="text-gray-300 text-sm leading-relaxed font-serif">
                                是否消耗灵石 <span className="text-yellow-500 font-bold">✨ {BUILDING_TYPES[confirmingBuildType].baseCost}</span> 开始营造 <span className="text-yellow-400 font-bold">{BUILDING_TYPES[confirmingBuildType].name}</span>？
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setConfirmingBuildType(null)} className="flex-1 py-2.5 bg-black/40 border border-[#4a3728] text-gray-500 rounded-sm font-bold hover:text-gray-300 transition-all text-xs tracking-widest">暂缓</button>
                            <button onClick={handleConfirmBuild} className="flex-1 py-2.5 bg-yellow-900/80 text-yellow-100 rounded-sm font-bold hover:bg-yellow-800 transition-all shadow-xl text-xs tracking-widest border border-yellow-600/30">动工</button>
                        </div>
                  </div>      
                    </div>
                </div>
            )}

            {confirmingCancelId && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="-translate-y-[70px]">
                    <div className="bg-[#1a1310] border-4 border-[#4a3728] p-8 rounded-sm shadow-2xl max-w-sm w-full text-center animate-fade-in ">
                        <h4 className="text-2xl font-cursive text-red-500 mb-6 tracking-widest">废止营造</h4>
                        <div className="bg-black/60 p-6 rounded-sm border border-white/5 mb-8">
                            <p className="text-gray-300 text-sm leading-relaxed font-serif">
                                是否取消 <span className="text-yellow-400 font-bold">{BUILDING_TYPES[buildings.find(b => b.id === confirmingCancelId)!.type].name}</span> 的营造计划？<br/>
                                确认后将全额返还灵石 <span className="text-yellow-500 font-bold">✨ {BUILDING_TYPES[buildings.find(b => b.id === confirmingCancelId)!.type].baseCost}</span>。
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setConfirmingCancelId(null)} className="flex-1 py-2.5 bg-black/40 border border-[#4a3728] text-gray-500 rounded-sm font-bold hover:text-gray-300 transition-all text-xs tracking-widest">继续营造</button>
                            <button onClick={handleConfirmCancel} className="flex-1 py-2.5 bg-red-900/80 text-white rounded-sm font-bold hover:bg-red-800 transition-all shadow-xl text-xs tracking-widest border border-red-600/30">确认废止</button>
                        </div>
                  </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuildingsTab;
