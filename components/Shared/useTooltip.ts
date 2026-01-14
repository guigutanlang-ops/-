
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
        
        // 预估浮窗宽度为 300px
        const estimatedWidth = 320;
        // 检查右侧空间是否足够，留出一定的安全边距
        const canPlaceRight = rect.right + estimatedWidth + 20 < windowWidth;
        const placement = canPlaceRight ? 'right' : 'left';

        // 计算 X 坐标：
        // 如果是右侧放置，起点在物品右侧外 18px
        // 如果是左侧放置，起点在物品左侧外 20px，配合 Tooltip.tsx 中的 translateX(-100%) 实现完全左移
        const x = placement === 'right' ? rect.right + 10 : rect.left - 270;
        
        // Y 坐标：尝试让浮窗顶部稍微偏移物品顶部，防止视觉上过于死板
        // 同时确保不会超出屏幕底部（简单预判）
        let y = rect.top;
        if (y + 400 > windowHeight) {
            y = Math.max(20, windowHeight - 420); // 如果太靠下，则往上提
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
