import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Region, ClanMember } from '../../types';
import { REALM_ORDER } from '../../constants';
import RegionMarker from './RegionMarker';
import FactionTerritoryLayer from './FactionTerritoryLayer';

interface Props {
    regions: Region[];
    members: ClanMember[];
    reputation: Record<string, number>;
    onSelectRegion: (region: Region | null) => void;
    onUpdateMember: (id: string, updates: Partial<ClanMember>) => void;
    onUpdateRegion: (id: string, updates: Partial<Region>) => void;
    currentRegionId: string;
    onOverviewChange?: (isOverview: boolean) => void;
}

const WorldMap: React.FC<Props> = ({ 
    regions, 
    members, 
    onSelectRegion, 
    currentRegionId, 
    onOverviewChange 
}) => {
    const VIEW_W = 1920;
    const VIEW_H = 1080;
    const OVERVIEW_SCALE = 1.0; 
    const MIN_PLAY_SCALE = 1.2;
    const MAX_SCALE = 4.0;

    const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1.4 }); 
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredFaction, setHoveredFaction] = useState<string | null>(null);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const isOverview = camera.scale <= OVERVIEW_SCALE;

    useEffect(() => {
        onOverviewChange?.(isOverview);
    }, [isOverview, onOverviewChange]);

    const getClampedPos = useCallback((x: number, y: number, scale: number) => {
        if (scale <= OVERVIEW_SCALE) return { x: 0, y: 0 };
        const scaledW = VIEW_W * scale;
        const scaledH = VIEW_H * scale;
        const limitX = Math.max(0, (scaledW - VIEW_W) / 2);
        const limitY = Math.max(0, (scaledH - VIEW_H) / 2);
        return {
            x: Math.max(-limitX, Math.min(limitX, x)),
            y: Math.max(-limitY, Math.min(limitY, y))
        };
    }, []);

    const handleZoom = (direction: 'in' | 'out') => {
        setCamera(prev => {
            let nextScale: number;
            if (direction === 'out') {
                if (prev.scale <= MIN_PLAY_SCALE) nextScale = OVERVIEW_SCALE;
                else nextScale = prev.scale * 0.8;
            } else {
                if (prev.scale <= OVERVIEW_SCALE) nextScale = MIN_PLAY_SCALE;
                else nextScale = Math.min(MAX_SCALE, prev.scale * 1.25);
            }
            nextScale = Math.max(OVERVIEW_SCALE, Math.min(MAX_SCALE, nextScale));
            const { x, y } = getClampedPos(prev.x, prev.y, nextScale);
            return { x, y, scale: nextScale };
        });
    };

    const handleWheel = (e: React.WheelEvent) => {
        handleZoom(e.deltaY > 0 ? 'out' : 'in');
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0 || isOverview) return;
        setIsDragging(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || isOverview) return;
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setCamera(prev => {
            const nextX = prev.x + dx;
            const nextY = prev.y + dy;
            const clamped = getClampedPos(nextX, nextY, prev.scale);
            return { ...clamped, scale: prev.scale };
        });
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => setIsDragging(false);

    // 绘制灵脉
    const spiritVeins = useMemo(() => [
        "M 960 1080 Q 900 800 960 540 T 960 0", 
        "M 200 1080 C 400 800 200 400 600 200", 
        "M 1720 1080 C 1520 800 1720 400 1320 200", 
    ], []);

    return (
        <div 
            className={`w-full h-full relative overflow-hidden bg-black ${isOverview ? 'cursor-default' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="absolute inset-0 w-[1920px] h-[1080px] left-1/2 top-1/2 world-map-main origin-center"
                style={{ 
                    transform: `translate(-50%, -50%) translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
                    transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0, 0.2, 1)', 
                    willChange: 'transform'
                }}>
                
                {/* 1. 地理底层 */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1920 1080">
                    {/* 区域着色装饰 */}
                    <rect width="1920" height="1080" fill="#f4e4bc" />
                    
                    {/* 岸标文字 */}
                    <text x="960" y="150" textAnchor="middle" className="font-cursive text-3xl fill-[#1a1310]/15 select-none tracking-[0.5em]">北岸 · 冰原</text>
                    <text x="960" y="930" textAnchor="middle" className="font-cursive text-3xl fill-[#1a1310]/15 select-none tracking-[0.5em]">南岸 · 沃野</text>
                    <text x="250" y="540" textAnchor="middle" className="font-cursive text-3xl fill-[#1a1310]/15 select-none tracking-[0.5em] [writing-mode:vertical-rl]">西岸 · 崇山</text>
                    <text x="1670" y="540" textAnchor="middle" className="font-cursive text-3xl fill-[#1a1310]/15 select-none tracking-[0.5em] [writing-mode:vertical-rl]">东岸 · 海滨</text>

                    {/* 灵脉流动 */}
                    {spiritVeins.map((d, i) => (
                        <path key={`vein-${i}`} d={d} fill="none" stroke={i === 0 ? "#C9A063" : "#4D7C6B"} strokeWidth="1.5" className="spirit-vein-path" />
                    ))}
                </svg>

                {/* 2. 势力范围层 (现在包含彩色板块与彩色虚线) */}
                <FactionTerritoryLayer 
                    regions={regions} 
                    hoveredFaction={hoveredFaction} 
                    isOverview={isOverview} 
                    scale={camera.scale}
                />

                {/* 3. 云海层 */}
                <div className="mist-layer z-10" />
                
                {/* 4. 地区标记层 */}
                {regions.map(region => {
                    if (!region.isDiscovered) return null;
                    const isSelected = currentRegionId === region.id;
                    return (
                        <div 
                            key={region.id}
                            onMouseEnter={() => setHoveredFaction(region.owner)}
                            onMouseLeave={() => setHoveredFaction(null)}
                        >
                            <RegionMarker 
                                region={region}
                                isHome={region.id === 'li_clan_home'}
                                isSelected={isSelected}
                                isOccupied={!!region.activeMission || !!region.guardMemberId}
                                showLabel={camera.scale > 1.3 || isSelected}
                                onSelect={onSelectRegion}
                            />
                        </div>
                    );
                })}
            </div>

            {/* 操作提示与控制 UI */}
            <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-bg-panel/80 backdrop-blur-md border border-accent-gold/20 rounded-full text-accent-gold/60 text-xs tracking-widest transition-opacity duration-1000 ${isOverview ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {hoveredFaction ? `观测势力：${hoveredFaction}` : '滚轮缩放查看两岸据点 ◈ 鼠标拖拽移动'}
            </div>
        </div>
    );
};

export default WorldMap;