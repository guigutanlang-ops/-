import React, { useMemo } from 'react';
import { Region, FactionType } from '../../types';

interface FactionTerritoryLayerProps {
    regions: Region[];
    hoveredFaction: string | null;
    isOverview: boolean;
    scale: number;
}

const FACTION_COLORS: Record<string, string> = {
    '望月李氏': '#C9A063', // 玄金
    '北寒宗': '#3BAFDA',  // 冰蓝
    '天一剑宗': '#656D78', // 铁灰
    '离火门': '#DA4453',  // 赤红
    '魏家': '#967ADC',    // 紫极
    '邵家': '#8D6E63',    // 赭石
    '齐家': '#37BC9B',    // 翡翠
};

/**
 * 势力领地层 - 动态计算仅包裹所属据点的虚线气场
 */
const FactionTerritoryLayer: React.FC<FactionTerritoryLayerProps> = ({ 
    regions,
    hoveredFaction, 
    scale 
}) => {
    // 1920x1080 坐标转换
    const x = (p: number) => (p / 100) * 1920;
    const y = (p: number) => (p / 100) * 1080;

    // 动态计算每个势力的包裹路径
    const factionPaths = useMemo(() => {
        // 过滤出所有非中立的势力
        const factions = Object.keys(FACTION_COLORS) as FactionType[];
        
        return factions.map(faction => {
            // 只寻找该势力【已发现】且【非自然/秘境】的据点
            // 大黎山(Natural)和坠龙滩(Mystic)会被此类过滤逻辑排除
            const ownedPoints = regions.filter(r => 
                r.owner === faction && 
                r.isDiscovered && 
                r.category !== 'Natural' && 
                r.category !== 'Mystic'
            );

            if (ownedPoints.length === 0) return null;

            // 根据点数决定形状
            let pathD = "";
            const padding = 3; // 气场外扩百分比

            if (ownedPoints.length === 1) {
                // 单个点：画一个完美的灵压圆
                const p = ownedPoints[0];
                const r = 50; // 圆半径
                pathD = `M ${x(p.x) - r},${y(p.y)} a ${r},${r} 0 1,0 ${r*2},0 a ${r},${r} 0 1,0 -${r*2},0`;
            } else {
                // 多个点：生成一个包裹所有点的平滑多边形 (简易版：计算边界并圆角)
                const minX = Math.min(...ownedPoints.map(p => p.x)) - padding;
                const maxX = Math.max(...ownedPoints.map(p => p.x)) + padding;
                const minY = Math.min(...ownedPoints.map(p => p.y)) - padding;
                const maxY = Math.max(...ownedPoints.map(p => p.y)) + padding;
                
                const w = x(maxX) - x(minX);
                const h = y(maxY) - y(minY);
                const rx = 40; // 圆角

                pathD = `M ${x(minX) + rx},${y(minY)} 
                         H ${x(maxX) - rx} Q ${x(maxX)},${y(minY)} ${x(maxX)},${y(minY) + rx} 
                         V ${y(maxY) - rx} Q ${x(maxX)},${y(maxY)} ${x(maxX) - rx},${y(maxY)} 
                         H ${x(minX) + rx} Q ${x(minX)},${y(maxY)} ${x(minX)},${y(maxY) - rx} 
                         V ${y(minY) + rx} Q ${x(minX)},${y(minY)} ${x(minX) + rx},${y(minY)} Z`;
            }

            return {
                owner: faction,
                path: pathD,
                color: FACTION_COLORS[faction]
            };
        }).filter(Boolean);
    }, [regions]);

    const opacity = useMemo(() => {
        if (scale > 3.2) return 0;
        if (scale > 2.4) return (3.2 - scale) * 1.25;
        return 1;
    }, [scale]);

    if (opacity <= 0) return null;

    return (
        <div className="absolute inset-0 z-5 pointer-events-none transition-opacity duration-700" style={{ opacity }}>
            <svg className="w-full h-full" viewBox="0 0 1920 1080">
                {factionPaths.map((item, idx) => {
                    const isHovered = hoveredFaction === item!.owner;
                    
                    return (
                        <g key={`faction-aura-${idx}`}>
                            {/* 气场底层：淡淡的洇墨感 */}
                            <path 
                                d={item!.path}
                                fill={item!.color}
                                fillOpacity={isHovered ? 0.15 : 0.04}
                                style={{ 
                                    transition: 'fill-opacity 0.4s ease',
                                    filter: 'url(#territory-paper-ink)'
                                }}
                            />
                            
                            {/* 气场边界：各色流动虚线 */}
                            <path 
                                d={item!.path}
                                fill="none"
                                stroke={item!.color}
                                strokeWidth={isHovered ? 3 : 1.5}
                                strokeOpacity={isHovered ? 0.8 : 0.3}
                                className="territory-dashed-border"
                                style={{ 
                                    transition: 'all 0.4s ease',
                                    strokeDasharray: isHovered ? '10, 5' : '6, 10',
                                    filter: 'url(#territory-paper-ink)'
                                }}
                            />

                            {/* 悬停时的额外气运脉动 */}
                            {isHovered && (
                                <path 
                                    d={item!.path}
                                    fill="none"
                                    stroke={item!.color}
                                    strokeWidth="10"
                                    strokeOpacity="0.1"
                                    style={{ filter: 'blur(10px)' }}
                                />
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default FactionTerritoryLayer;