
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Region, ClanMember } from '../../types';
import SettlementMarker from './SettlementMarker';
import FactionAuraLayer from './FactionAuraLayer';
import { IMAGE_ASSETS } from '../../assets/imageRegistry';

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

// 定义世界地图的实际逻辑尺寸（大于视口 1920x1080）
const WORLD_W = 9600; 
const WORLD_H = 5400;
const VIEW_W = 1920;
const VIEW_H = 1080;

const ZOOM_STEPS = [0.2,0.3]; // 允许缩到比 1.0 小以看到全貌
const INITIAL_ZOOM_IDX = 0; // 默认 1.0

const WorldMap: React.FC<Props> = ({ 
    regions, 
    onSelectRegion, 
    currentRegionId, 
    onOverviewChange 
}) => {
    const [zoomIdx, setZoomIdx] = useState(INITIAL_ZOOM_IDX);
    const scale = ZOOM_STEPS[zoomIdx];
    
    // camera 存储的是摄像机中心在【原始世界坐标(3200x1800)】中的坐标
    const [camera, setCamera] = useState({ x: WORLD_W / 2, y: WORLD_H / 2 }); 
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const isOverview = scale < 0.8;

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

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        // 鼠标移动的像素距离
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        
        // 转换为世界坐标系下的移动（需要除以缩放倍率）
        setCamera(prev => {
            const nextX = prev.x - dx / scale;
            const nextY = prev.y - dy / scale;
            return getClampedCamera(nextX, nextY, scale);
        });
        
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => setIsDragging(false);

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

    return (
        <div 
            className={`w-full h-full relative overflow-hidden bg-[#020403] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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
                <div className="absolute inset-0 z-0 bg-[#0a0f0d]" 
                     style={{ 
                        backgroundImage: `url(${IMAGE_ASSETS.MAP.WORLD_BASE})`, 
                        backgroundSize: '100% 100%',
                     }} 
                />

                <div className="absolute inset-0 z-[1] opacity-[0.08] mix-blend-multiply" 
                     style={{ backgroundImage: `url(${IMAGE_ASSETS.MAP.PAPER_TEXTURE})`, backgroundSize: '500px' }} />

                <FactionAuraLayer regions={regions} scale={scale} />
            </div>

            {/* 2. UI层：据点 Marker */}
            <div className="absolute inset-0 pointer-events-none">
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
            <div className="absolute bottom-8 right-12 flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                <button onClick={() => handleZoom('out')} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-accent-gold transition-all text-2xl font-bold">－</button>
                <div className="flex gap-2">
                    {ZOOM_STEPS.map((_, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${idx === zoomIdx ? 'bg-accent-gold scale-150' : 'bg-white/10'}`} />
                    ))}
                </div>
                <button onClick={() => handleZoom('in')} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-accent-gold transition-all text-2xl font-bold">＋</button>
            </div>
        </div>
    );
};

export default WorldMap;
