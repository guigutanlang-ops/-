
import React, { useState, useCallback } from 'react';

export interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode;
    placement: 'left' | 'right';
}

export function useTooltip() {
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    const showTooltip = useCallback((e: React.MouseEvent, content: React.ReactNode) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 获取容器的缩放比例和偏移量（处理 App.tsx 中的 scale 变换）
        const canvas = document.querySelector('.game-canvas') as HTMLElement;
        let scale = 1;
        let canvasLeft = 0;
        let canvasTop = 0;
        
        if (canvas) {
            const canvasRect = canvas.getBoundingClientRect();
            // 通过获取渲染宽度与原始宽度 (1920) 的比例来推断当前 scale
            scale = canvasRect.width / 1920;
            canvasLeft = canvasRect.left;
            canvasTop = canvasRect.top;
        }

        // 预估浮窗宽度为 300px
        const estimatedWidth = 320;
        // 使用相对 viewport 的坐标来判断放置方向
        const canPlaceRight = rect.right + estimatedWidth + 20 < windowWidth;
        const placement = canPlaceRight ? 'right' : 'left';

        // 计算 X 坐标（相对于 .game-canvas 的内部坐标系）：
        // 1. (rect.x - canvasLeft) 将坐标转换至以 canvas 为起点的坐标系
        // 2. 除以 scale 将其转换回原始的 1920px 设计空间坐标
        const relativeLeft = (rect.left - canvasLeft) / scale;
        const relativeRight = (rect.right - canvasLeft) / scale;

        // 如果是右侧放置，起点在物品右侧外 5px
        // 如果是左侧放置，起点在物品左侧外 6px
        const x = placement === 'right' ? relativeRight + 5 : relativeLeft - 5;
        
        // Y 坐标同理转换
        const relativeTop = (rect.top - canvasTop) / scale;
        let y = relativeTop;
        
        // 确保不会超出屏幕底部（基于 1080 的原始高度预判）
        if (y + 400 > 1080) {
            y = Math.max(20, 1080 - 420);
        }

        setTooltip({
            visible: true,
            x,
            y,
            content,
            placement
        });
    }, []);

    const hideTooltip = useCallback(() => {
        setTooltip(prev => prev ? { ...prev, visible: false } : null);
    }, []);

    return { tooltip, showTooltip, hideTooltip };
}
