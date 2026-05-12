import React, { useEffect, useRef } from 'react';

interface Sparkle {
    x: number;
    y: number;
    life: number;
    size: number;
    vx: number;
    vy: number;
}

const SpiritCursor: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const sparkles = useRef<Sparkle[]>([]);
    const lastEmitTime = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const onMove = (x: number, y: number) => {
            mousePos.current = { x, y };
            
            const now = Date.now();
            // 调整频率：每 50ms 记录一次位置
            if (now - lastEmitTime.current < 50) return;
            lastEmitTime.current = now;

            // 延迟 0.01s 生成粒子
            setTimeout(() => {
                if (!canvasRef.current) return;
                
                // 每次生成 2 个粒子
                for(let i = 0; i < 2; i++) {
                    sparkles.current.push({
                        x: x + (Math.random() - 0.5) * 10,
                        y: y + (Math.random() - 0.5) * 10,
                        life: 1.0,
                        size: Math.random() * 3 + 1.5,
                        vx: (Math.random() - 0.5) * 1.5,
                        vy: (Math.random() - 0.5) * 1.5
                    });
                }
            }, 10);
        };

        const onMouseMove = (e: MouseEvent) => {
            onMove(e.clientX, e.clientY);
        };

        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                onMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        const onTouchEnd = () => {
            mousePos.current = { x: 0, y: 0 };
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 移除原本跟随鼠标的固定光点 (Lines 69-79 original code)

            sparkles.current = sparkles.current.filter(s => s.life > 0);
            
            sparkles.current.forEach(s => {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(147, 197, 253, ${s.life * 0.4})`; // Lighter blue
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#3b82f6';
                ctx.fill();
                
                s.x += s.vx;
                s.y += s.vy;
                s.life -= 0.015; // Slower fade
            });

            animationFrameId.current = requestAnimationFrame(draw);
        };

        let animationFrameId = { current: 0 };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchstart', onTouchMove);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchend', onTouchEnd);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchstart', onTouchMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            cancelAnimationFrame(animationFrameId.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[9999] pointer-events-none"
        />
    );
};

export default SpiritCursor;
