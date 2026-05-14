import React, { useEffect, useRef } from 'react';

interface Props {
    progress: number; // 0 to 1
    level: number; // Current sub-realm
    color: string;
    glowColor: string;
    height?: number;
    className?: string;
    resetKey?: string; // e.g. member.id to reset animation when switching members
    onLevelChange?: (level: number) => void;
    onAnimationComplete?: () => void;
}

const CanvasSpiritBar: React.FC<Props> = ({ progress, level, color, glowColor, height = 10, className = "", resetKey, onLevelChange, onAnimationComplete }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const displayLevelRef = useRef(level);
    const displayProgressRef = useRef(progress);
    const stateRef = useRef({ progress, level, isAnimating: false });
    const callbacksRef = useRef({ onLevelChange, onAnimationComplete });

    useEffect(() => {
        displayLevelRef.current = level;
        displayProgressRef.current = progress;
    }, [resetKey]);

    useEffect(() => {
        stateRef.current = { ...stateRef.current, progress, level };
    }, [progress, level]);

    useEffect(() => {
        callbacksRef.current = { onLevelChange, onAnimationComplete };
    }, [onLevelChange, onAnimationComplete]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let offset = 0;
        
        let isFirstFrame = true;
        
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            // We need to use the CSS dimensions for drawing logic within the scaled context
            (canvas as any)._drawWidth = rect.width;
            (canvas as any)._drawHeight = rect.height;
        };

        // Use refs for persistent display state
        const draw = () => {
            if (!canvasRef.current) return;
            const width = (canvas as any)._drawWidth || canvas.width;
            const h = (canvas as any)._drawHeight || canvas.height;
            
            const targetLevel = stateRef.current.level;
            const targetProgress = stateRef.current.progress;

            let isAnimating = false;

            // Handle multi-level transition logic
            if (displayLevelRef.current < targetLevel) {
                isAnimating = true;
                // Moving up to next level: fill current bar first
                displayProgressRef.current += 0.02; // Smooth fill to 100%
                if (displayProgressRef.current >= 1) {
                    displayProgressRef.current = 0;
                    displayLevelRef.current += 1;
                    if (callbacksRef.current.onLevelChange) {
                        callbacksRef.current.onLevelChange(displayLevelRef.current);
                    }
                }
            } else if (displayLevelRef.current > targetLevel) {
                // Level decreased (e.g. breakthrough or fail)
                displayLevelRef.current = targetLevel;
                displayProgressRef.current = targetProgress;
                if (callbacksRef.current.onLevelChange) {
                    callbacksRef.current.onLevelChange(displayLevelRef.current);
                }
            } else {
                // Same level: lerp to target progress
                const diff = targetProgress - displayProgressRef.current;
                if (Math.abs(diff) > 0.0001) {
                    isAnimating = true;
                    displayProgressRef.current += diff * 0.15;
                } else {
                    displayProgressRef.current = targetProgress;
                }
            }

            // Snap to 1 if very close
            if (displayProgressRef.current > 0.9995) {
                displayProgressRef.current = 1;
            }

            const wasAnimating = stateRef.current.isAnimating ?? (isFirstFrame ? !isAnimating : false);
            stateRef.current.isAnimating = isAnimating;

            if ((wasAnimating || isFirstFrame) && !isAnimating && callbacksRef.current.onAnimationComplete) {
                callbacksRef.current.onAnimationComplete();
            }
            
            isFirstFrame = false;

            ctx.clearRect(0, 0, width, h);
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, width, h);

            if (displayProgressRef.current > 0) {
                // Use floor for consistent pixel alignment but ensure 100% hits the edge
                const barWidth = displayProgressRef.current >= 1 ? width : width * displayProgressRef.current;

                // Main bar
                const gradient = ctx.createLinearGradient(0, 0, barWidth, 0);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, glowColor);
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, barWidth, h);

                // Flow effect
                offset += 1.5;
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, barWidth, h);
                ctx.clip();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 4;
                ctx.setLineDash([20, 40]);
                ctx.lineDashOffset = -offset;
                
                ctx.beginPath();
                ctx.moveTo(0, h / 2);
                ctx.lineTo(barWidth, h / 2);
                ctx.stroke();
                ctx.restore();

                // Glow at the end
                if (displayProgressRef.current < 1) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = glowColor;
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(barWidth - 2, 0, 2, h);
                } else {
                    // Full state: highlight the end brightly to show completeness
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = glowColor;
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(width - 2, 0, 2, h);
                    
                    // Add an extra overlay for "Full" intensity
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.fillRect(0, 0, width, h);
                }
            }

            // Draw level segments indicator
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for (let i = 1; i < 10; i++) {
                const segX = Math.round(width * (i / 10));
                ctx.fillRect(segX, 0, 1, h);
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color, glowColor, resetKey]);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full ${className}`}
            style={{ height: `${height}px`, display: 'block' }}
        />
    );
};

export default CanvasSpiritBar;
