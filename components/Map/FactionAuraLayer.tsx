
import React from 'react';
import { Region } from '../../types';

interface FactionAuraLayerProps {
    regions: Region[];
    scale: number;
}

const FACTION_COLORS: Record<string, string> = {
    '望月李氏': '#C9A063', 
    '北寒宗': '#3BAFDA',  
    '天一剑宗': '#656D78', 
    '离火门': '#DA4453',  
    '魏家': '#967ADC',    
    '邵家': '#8D6E63',    
    '齐家': '#37BC9B',    
};

const WORLD_W = 3200; 
const WORLD_H = 1800;

const FactionAuraLayer: React.FC<FactionAuraLayerProps> = ({ regions, scale }) => {
    return (
        <div className="absolute inset-0 z-10 pointer-events-none">
            <svg className="w-full h-full" viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
                {regions.map(region => {
                    if (!region.isDiscovered || region.owner === '无') return null;
                    const color = FACTION_COLORS[region.owner];
                    const isCapital = region.settlementType === 'Capital' || region.settlementType === 'Landmark';
                    
                    if (!isCapital && scale < 1.0) return null;

                    const rx = (region.x / 100) * WORLD_W;
                    const ry = (region.y / 100) * WORLD_H;
                    const auraSize = isCapital ? 100 : 60; // 适配大地图尺寸

                    return (
                        <g key={`aura-${region.id}`}>
                            <ellipse 
                                cx={rx} cy={ry} 
                                rx={auraSize * 1.5} ry={auraSize * 0.6}
                                fill={color}
                                fillOpacity="0.06"
                                style={{ filter: 'url(#territory-paper-ink)' }}
                            />
                            <ellipse 
                                cx={rx} cy={ry} 
                                rx={auraSize} ry={auraSize * 0.4}
                                fill="none"
                                stroke={color}
                                strokeWidth="2"
                                strokeOpacity="0.2"
                                strokeDasharray="10,10"
                                className="territory-dashed-border"
                            />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default FactionAuraLayer;
