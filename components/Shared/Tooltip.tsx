
import React from 'react';
import { TooltipState } from './useTooltip';

interface Props {
    state: TooltipState | null;
}

const Tooltip: React.FC<Props> = ({ state }) => {
    if (!state || !state.visible) return null;

    return (
        <div 
            className="fixed z-[10000] pointer-events-none bg-[#1a1310]/95 border-2 border-yellow-900/40 p-5 rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-md animate-fade-in font-serif max-w-[320px] ring-1 ring-white/5"
            style={{ 
                left: state.x, 
                top: state.y, 
                // placement 为 left 时，通过 -100% 偏移量将整个浮窗渲染在触发点的左侧
                transform: state.placement === 'left' ? 'translateX(-100%)' : 'none'
            }}
        >
            {/* 增加装饰性边角，更符合修仙风格 */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-600/30"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-600/30"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-600/30"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-600/30"></div>
            
            <div className="relative z-10">
                {state.content}
            </div>
        </div>
    );
};

export default Tooltip;
