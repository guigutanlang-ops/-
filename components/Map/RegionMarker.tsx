import React from 'react';
import { Region, RegionCategory } from '../../types';
import { getRegionImage, getFactionTierImage } from '../../assets/imageRegistry';

interface RegionMarkerProps {
    region: Region;
    isHome: boolean;
    isSelected: boolean;
    isOccupied: boolean;
    showLabel: boolean;
    onSelect: (region: Region) => void;
}

const RegionMarker: React.FC<RegionMarkerProps> = ({ 
    region, 
    isHome, 
    isSelected, 
    isOccupied, 
    showLabel, 
    onSelect 
}) => {
    const getCategorySizeClasses = (category: RegionCategory, id: string) => {
        const isHome = id === 'li_clan_home';
        switch (category) {
            case 'Stakeholder': return isHome ? 'w-24 h-24' : 'w-16 h-16';
            case 'Natural': return 'w-14 h-14';
            case 'Mystic': return 'w-18 h-18';
            case 'Resource': return 'w-12 h-12';
            default: return 'w-14 h-14';
        }
    };

    const renderIcon = () => {
        let imageUrl: string;
        if (region.category === 'Stakeholder') {
            const isSect = region.type === 'sect' || region.owner.includes('宗') || region.owner.includes('门');
            imageUrl = getFactionTierImage(isSect, region.difficulty);
        } else {
            imageUrl = getRegionImage(region.type, region.category === 'Mystic');
        }
        return (
            <div className="w-full h-full flex items-center justify-center p-2">
                <img 
                    src={imageUrl} 
                    alt={region.type} 
                    className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                />
            </div>
        );
    };

    const sizeClass = getCategorySizeClasses(region.category, region.id);

    return (
        <div 
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all duration-700 ${isSelected ? 'z-40 scale-110' : 'z-20 hover:scale-105'}`}
            style={{ left: `${region.x}%`, top: `${region.y}%` }}
        >
            <button 
                onClick={(e) => { e.stopPropagation(); onSelect(region); }} 
                className="flex flex-col items-center group/btn relative"
            >
                {/* 动态光环：老祖视角下的气运观照 */}
                <div className={`absolute -inset-6 rounded-full blur-2xl opacity-0 group-hover/btn:opacity-40 transition-opacity duration-700 pointer-events-none
                    ${isHome ? 'bg-accent-gold/50' : (region.category === 'Mystic' ? 'bg-purple-500/50' : 'bg-accent-jade/40')}`} 
                />
                
                <div className={`${sizeClass} flex items-center justify-center rounded-full border-2 relative transition-all duration-500
                    ${isHome ? 'bg-[#1e1310] border-accent-gold shadow-[0_0_40px_rgba(201,160,99,0.3)]' : 
                      (region.category === 'Mystic' ? 'bg-[#1a1215] border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' :
                      (isSelected ? 'bg-bg-panel border-accent-gold' : 
                      (region.owner === '望月李氏' ? 'bg-bg-panel border-accent-jade/40' :
                      'bg-black/60 border-border-soft')))} 
                    backdrop-blur-sm`}
                >
                    {renderIcon()}
                    
                    {/* 任务状态动画 */}
                    {isOccupied && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full border-2 border-[#f4e4bc] flex items-center justify-center animate-pulse z-30">
                            <span className="text-[10px]">!</span>
                        </div>
                    )}
                </div>

                {/* 水墨标签 */}
                {showLabel && (
                    <div className="mt-4 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] animate-fade-in pointer-events-none">
                        <span className="text-[13px] font-bold bg-[#f4e4bc] px-4 py-1.5 rounded-sm border-x border-y-[#2c1810] text-[#1a1310] font-serif whitespace-nowrap tracking-widest shadow-2xl relative">
                            <div className="absolute -left-1 top-0 bottom-0 w-1 bg-[#2c1810] opacity-30"></div>
                            {region.name}
                            <div className="absolute -right-1 top-0 bottom-0 w-1 bg-[#2c1810] opacity-30"></div>
                        </span>
                    </div>
                )}
            </button>
        </div>
    );
};

export default RegionMarker;