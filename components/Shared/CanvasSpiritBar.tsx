import React, { useEffect, useRef } from 'react';

interface Props {
    progress: number; // 0 to 1
    color: string;
    glowColor: string;
    height?: number;
    className?: string;
}

const CanvasSpiritBar: React.FC<Props> = ({ progress, color, glowColor, height = 10, className = "" }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const progressRef = useRef(progress);

    useEffect(() => {
        progressRef.current = progress;
    }, [progress]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let offset = 0;
        let currentDisplayProgress = progress;

        const draw = () => {
            const width = canvas.width;
            const h = canvas.height;
            
            ctx.clearRect(0, 0, width, h);

            // Lerp progress for smooth movement
            currentDisplayProgress += (progressRef.current - currentDisplayProgress) * 0.1;
            const barWidth = width * currentDisplayProgress;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, width, h);

            if (barWidth > 0) {
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
                ctx.shadowBlur = 15;
                ctx.shadowColor = glowColor;
                ctx.fillStyle = '#fff';
                ctx.fillRect(barWidth - 2, 0, 2, h);
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color, glowColor]);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full ${className}`}
            style={{ height: `${height}px`, display: 'block' }}
        />
    );
};

export default CanvasSpiritBar;
