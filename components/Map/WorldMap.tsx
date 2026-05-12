
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Region, ClanMember } from '../../types';
import SettlementMarker from './SettlementMarker';
import FactionAuraLayer from './FactionAuraLayer';
import { IMAGE_ASSETS } from '../../assets/imageRegistry';

import RegionInfoPanel from './RegionInfoPanel';

interface Props {
    regions: Region[];
    members: ClanMember[];
    reputation: Record<string, number>;
    onSelectRegion: (region: Region | null) => void;
    onUpdateMember: (id: string, updates: Partial<ClanMember>) => void;
    onUpdateRegion: (id: string, updates: Partial<Region>) => void;
    onAssignMission: (memberId: string, missionType: string) => void;
    currentRegionId: string;
    onOverviewChange?: (isOverview: boolean) => void;
}

// 定义世界地图的实际逻辑尺寸
const WORLD_W = 3200; 
const WORLD_H = 1800;
const VIEW_W = 1920;
const VIEW_H = 1080;

const ZOOM_STEPS = [0.6, 1, 1.5, 2.5]; 
const INITIAL_ZOOM_IDX = 1; 

const WorldMap: React.FC<Props> = ({ 
    regions, 
    members,
    onSelectRegion, 
    onAssignMission,
    currentRegionId, 
    onOverviewChange 
}) => {
    const [zoomIdx, setZoomIdx] = useState(INITIAL_ZOOM_IDX);
    const scale = ZOOM_STEPS[zoomIdx];
    
    // camera 存储的是摄像机中心在【原始世界坐标(3200x1800)】中的坐标
    const [camera, setCamera] = useState({ x: WORLD_W / 2, y: WORLD_H / 2 }); 
    const [isDragging, setIsDragging] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const lastPinchDistance = useRef<number | null>(null);

    const isOverview = scale < 0.8;

    const getDistance = (t1: React.Touch, t2: React.Touch) => {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    /**
     * 核心：计算摄像机合法位置
     * 规则：缩放后的地图边缘绝对不能进入视口内部
     */
    const getClampedCamera = useCallback((cx: number, cy: number, currentScale: number) => {
        // 缩放后地图在视口中表现的实际尺寸
        const scaledMapW = WORLD_W * currentScale;
        const scaledMapH = WORLD_H * currentScale;

        // 计算摄像机在原始坐标系下的可移动半幅范围
        // 如果缩放后的地图比视口还小，则强制居中
        const limitX = scaledMapW > VIEW_W 
            ? (scaledMapW - VIEW_W) / (2 * currentScale)
            : 0;
        const limitY = scaledMapH > VIEW_H 
            ? (scaledMapH - VIEW_H) / (2 * currentScale)
            : 0;

        const centerX = WORLD_W / 2;
        const centerY = WORLD_H / 2;

        return {
            x: Math.max(centerX - limitX, Math.min(centerX + limitX, cx)),
            y: Math.max(centerY - limitY, Math.min(centerY + limitY, cy))
        };
    }, []);

    useEffect(() => {
        onOverviewChange?.(isOverview);
        // 缩放变化时，校准摄像机位置
        setCamera(prev => getClampedCamera(prev.x, prev.y, scale));
    }, [isOverview, onOverviewChange, scale, getClampedCamera]);

    const handleZoom = (direction: 'in' | 'out') => {
        setZoomIdx(prev => {
            const nextIdx = direction === 'in' 
                ? Math.min(prev + 1, ZOOM_STEPS.length - 1) 
                : Math.max(0, prev - 1);
            return nextIdx;
        });
    };

    const handleWheel = (e: React.WheelEvent) => {
        handleZoom(e.deltaY > 0 ? 'out' : 'in');
    };

    const handleDragStart = (x: number, y: number) => {
        setIsPressed(true);
        lastMousePos.current = { x, y };
    };

    const handleDragMove = (x: number, y: number) => {
        if (!isPressed) return;
        
        const dx = x - lastMousePos.current.x;
        const dy = y - lastMousePos.current.y;

        // Threshold for drag
        if (!isDragging && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
            setIsDragging(true);
        }

        if (isDragging) {
            setCamera(prev => {
                const nextX = prev.x - dx / scale;
                const nextY = prev.y - dy / scale;
                return getClampedCamera(nextX, nextY, scale);
            });
        }
        
        lastMousePos.current = { x, y };
    };

    const handleDragEnd = () => {
        setIsPressed(false);
        setIsDragging(false);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        handleDragStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handleDragMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => handleDragEnd();

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
            lastPinchDistance.current = null;
        } else if (e.touches.length === 2) {
            setIsDragging(false);
            lastPinchDistance.current = getDistance(e.touches[0], e.touches[1]);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // Prevent scrolling while interacting with map
        if (e.cancelable) e.preventDefault();

        if (e.touches.length === 1) {
            handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.touches.length === 2 && lastPinchDistance.current !== null) {
            const currentDist = getDistance(e.touches[0], e.touches[1]);
            const delta = currentDist - lastPinchDistance.current;
            
            // Threshold for zoom
            if (Math.abs(delta) > 30) {
                handleZoom(delta > 0 ? 'in' : 'out');
                lastPinchDistance.current = currentDist;
            }
        }
    };

    const handleTouchEnd = () => {
        handleDragEnd();
        lastPinchDistance.current = null;
    };

    /**
     * 计算渲染位置：
     * 我们需要将世界中心对齐视口中心，然后应用缩放和摄像机位移。
     */
    const worldTransform = `
        translate(${VIEW_W/2}px, ${VIEW_H/2}px) 
        scale(${scale}) 
        translate(${-camera.x}px, ${-camera.y}px)
    `;

    // UI Marker 投影：不随 scale，但需要随 translate
    const getUIPosition = (regionX: number, regionY: number) => {
        // 1. 获取据点在世界坐标中的绝对像素位置
        const absX = (regionX / 100) * WORLD_W;
        const absY = (regionY / 100) * WORLD_H;
        
        // 2. 根据摄像机位置和缩放计算在视口中的屏幕坐标
        // 公式：(世界点 - 摄像机点) * 缩放 + 视口中心
        const screenX = (absX - camera.x) * scale + (VIEW_W / 2);
        const screenY = (absY - camera.y) * scale + (VIEW_H / 2);
        
        return { left: `${screenX}px`, top: `${screenY}px` };
    };

    // Cursor logic: default on hover, grab on press, grabbing on drag
    const cursorClass = isDragging ? 'cursor-grabbing' : (isPressed ? 'cursor-grab' : 'cursor-default');

    return (
        <div 
            className={`w-full h-full relative overflow-hidden bg-[#020403] border-4 border-red-500/20 ${cursorClass}`}
            style={{ touchAction: 'none' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            {/* 1. 世界层：地形、气场 */}
            <div 
                className="absolute inset-0 pointer-events-none origin-top-left"
                style={{ 
                    width: WORLD_W, 
                    height: WORLD_H,
                    transform: worldTransform,
                    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.1, 0.9, 0.2, 1)',
                    willChange: 'transform'
                }}
            >
                {/* 地形底图 - 此时它铺满 WORLD_W x WORLD_H */}
                <div className="absolute inset-0 z-0 bg-[#0d1310]" 
                     style={{ 
                        backgroundImage: `url('https://r.jina.ai/i/05825d706f964a2781d4a04d334e3a89')`, 
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        opacity: 0.9,
                     }} 
                />

                <div className="absolute inset-0 z-[1] opacity-[0.08] mix-blend-multiply" 
                     style={{ backgroundImage: `url(${IMAGE_ASSETS.MAP.PAPER_TEXTURE})`, backgroundSize: '500px' }} />

                <FactionAuraLayer regions={regions} scale={scale} />
            </div>

            {/* 2. UI层：据点 Marker */}
            <div className="absolute inset-0 pointer-events-none" onWheel={(e) => e.stopPropagation()}>
                {regions.map(region => {
                    if (!region.isDiscovered) return null;
                    const pos = getUIPosition(region.x, region.y);
                    
                    // 裁剪不在视口内的 Marker 提升性能
                    const leftVal = parseFloat(pos.left);
                    const topVal = parseFloat(pos.top);
                    if (leftVal < -200 || leftVal > VIEW_W + 200 || topVal < -200 || topVal > VIEW_H + 200) return null;

                    return (
                        <div 
                            key={region.id} 
                            className="absolute pointer-events-auto"
                            style={{ 
                                left: pos.left, 
                                top: pos.top,
                                transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.1, 0.9, 0.2, 1)'
                            }}
                        >
                            <SettlementMarker 
                                region={region}
                                isSelected={currentRegionId === region.id}
                                scale={scale}
                                showLabel={scale >= 0.8}
                                onSelect={onSelectRegion}
                            />
                        </div>
                    );
                })}
            </div>

            {/* 渐变边缘遮罩 - 增强摄像机聚焦感 */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />

            {/* 控制台 */}
            <div className="absolute bottom-8 right-12 flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl" onWheel={(e) => e.stopPropagation()}>
                <button onClick={() => handleZoom('out')} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-accent-gold transition-all text-2xl font-bold">－</button>
                <div className="flex gap-2">
                    {ZOOM_STEPS.map((_, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${idx === zoomIdx ? 'bg-accent-gold scale-150' : 'bg-white/10'}`} />
                    ))}
                </div>
                <button onClick={() => handleZoom('in')} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-accent-gold transition-all text-2xl font-bold">＋</button>
            </div>

            {/* Selected Region Info Panel */}
            {currentRegionId && currentRegionId !== 'li_clan_home' && (() => {
                const region = regions.find(r => r.id === currentRegionId);
                if (!region) return null;
                const pos = getUIPosition(region.x, region.y);
                const screenX = parseFloat(pos.left);
                const screenY = parseFloat(pos.top);
                
                // Position logic: prefer right side, but use left if too close to right edge
                const sideOffset = 20 * scale; 
                const panelWidth = 400;
                const panelMaxHeight = VIEW_H * 0.6; // Matches RegionInfoPanel max-h
                
                const isOnRight = screenX + sideOffset + panelWidth <= VIEW_W - 40;
                
                // Centering vertically at marker, then clamping
                let topPos = screenY - panelMaxHeight / 2;
                if (topPos + panelMaxHeight > VIEW_H - 40) {
                    topPos = VIEW_H - panelMaxHeight - 40;
                }
                if (topPos < 40) topPos = 40;

                const panelPosition = isOnRight 
                    ? { left: `${screenX + sideOffset}px`, top: `${topPos}px` }
                    : { right: `${VIEW_W - screenX + sideOffset}px`, top: `${topPos}px` };

                return (
                    <div onWheel={(e) => e.stopPropagation()}>
                        <RegionInfoPanel
                            region={region}
                            members={members}
                            position={panelPosition}
                            onClose={() => onSelectRegion(null)}
                            onAssignMission={onAssignMission}
                        />
                    </div>
                );
            })()}
        </div>
    );
};

export default WorldMap;
