
import React from 'react';
import { Region } from '../../types';
import { getRegionImage, getFactionTierImage } from '../../assets/imageRegistry';

interface SettlementMarkerProps {
    region: Region;
    isSelected: boolean;
    scale: number;
    showLabel: boolean;
    onSelect: (region: Region) => void;
}

const FACTION_COLORS: Record<string, string> = {
    '望月李氏': '#C9A063', 
    '北寒宗': '#3BAFDA',  
    '天一剑宗': '#E6E6E6', 
    '离火门': '#DA4453',  
    '魏家': '#967ADC',    
    '邵家': '#8D6E63',    
    '齐家': '#37BC9B',    
};

const SettlementMarker: React.FC<SettlementMarkerProps> = ({ 
    region, 
    isSelected, 
    scale,
    showLabel,
    onSelect 
}) => {
    const isCapital = region.settlementType === 'Capital' || region.settlementType === 'Landmark';
    const factionColor = FACTION_COLORS[region.owner] || '#5F6B66';

    // UI层不随世界缩放，故大小保持相对恒定。
    // 但在远景档位(scale < 1)时，我们可以略微缩小图标，防止遮挡。
    const visualScale = scale < 1 ? 0.8 : 1.0;
    const baseSize = (isCapital ? 80 : 50) * visualScale;
    
    // 远景档位下，隐藏小型资源点，只保留核心城市
    const isVisible = isCapital || scale >= 1.3;

    if (!isVisible) return null;

    return (
        <div className={`transform -translate-x-1/2 -translate-y-[80%] transition-all duration-300 ${isSelected ? 'z-50' : 'z-30'}`}>
            <div 
                className="relative group cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onSelect(region); }}
                style={{ width: baseSize, height: baseSize }}
            >
                {/* 地面阴影：增加与缩放地形的融合感 */}
                <div 
                    className={`absolute bottom-[-5%] left-1/2 -translate-x-1/2 w-[110%] h-[30%] rounded-[50%] transition-all duration-500
                        ${isSelected ? 'opacity-100 scale-125' : 'opacity-40 group-hover:opacity-60'}`}
                    style={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        boxShadow: `0 0 15px ${isSelected ? factionColor + 'AA' : 'rgba(0,0,0,0.4)'}`,
                        filter: 'blur(5px)',
                        transform: 'translateX(-50%) rotateX(75deg)'
                    }}
                />

                {/* 建筑主体 */}
                <div 
                    className={`absolute inset-0 flex items-end justify-center transition-transform duration-500
                        ${isSelected ? '-translate-y-4' : 'translate-y-0 group-hover:-translate-y-1'}`}
                >
                    <div className="relative w-full h-full flex flex-col items-center justify-end">
                        <img 
                            src={region.category === 'Stakeholder' 
                                ? getFactionTierImage(region.type === 'sect', region.difficulty)
                                : getRegionImage(region.type, region.category === 'Mystic')
                            } 
                            alt={region.name}
                            className={`w-full h-full object-contain filter transition-all duration-500
                                ${isSelected ? 'brightness-125' : 'brightness-90 contrast-110'}
                                drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]`}
                        />
                    </div>
                </div>

                {/* 文本标签：根据 handleZoom 传入的 showLabel 控制 */}
                <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 transition-all duration-500 pointer-events-none
                    ${(showLabel || isSelected) ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-75'}`}>
                    <div className="flex flex-col items-center">
                        <span className="bg-[#1a1310]/95 text-[#f4e4bc] px-4 py-1.5 rounded-sm border border-[#c9a063]/30 text-[11px] font-serif tracking-[0.2em] shadow-2xl whitespace-nowrap block">
                            {region.name}
                        </span>
                        {isSelected && (
                             <div className="mt-1.5 w-1 h-1 bg-accent-gold rounded-full animate-ping"></div>
                        )}
                    </div>
                </div>

                {/* 动态任务提示 */}
                {region.activeMission && (
                    <div className="absolute -top-2 -right-2 animate-bounce z-40">
                        <div className="bg-red-600 w-8 h-8 rounded-full border-2 border-[#f4e4bc] flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-black italic">!</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettlementMarker;
