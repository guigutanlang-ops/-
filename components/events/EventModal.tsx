
import React from 'react';
import { createPortal } from 'react-dom';
import { GameEvent } from '../../types';

interface Props {
    event: GameEvent;
    onChoice: (choiceKey: 'choiceA' | 'choiceB') => void;
}

const EventModal: React.FC<Props> = ({ event, onChoice }) => {
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-bg-main/90 backdrop-blur-md p-6 animate-fade-in">
            <div className="w-full max-w-2xl panel-ink p-10 rounded-sm border-t-4 border-t-accent-gold flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-6xl opacity-[0.03] pointer-events-none select-none font-serif font-black">
                    昊天
                </div>

                <div className="mb-8 pb-4 border-b border-border-soft">
                    <h2 className="font-serif font-h1 text-accent-gold tracking-[0.2em]">{event.title}</h2>
                </div>
                
                <div className="bg-bg-main/40 p-8 rounded-sm border border-border-soft mb-10 shadow-inner">
                    <p className="font-sans font-body text-text-main leading-relaxed text-lg tracking-wide text-justify">
                        {event.content}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button 
                        onClick={() => onChoice('choiceA')} 
                        className="group p-6 bg-bg-panel border border-border-soft hover:border-accent-gold/50 transition-all text-left relative overflow-hidden"
                    >
                        <p className="font-sans font-h2 font-bold text-text-main mb-2 group-hover:text-accent-gold transition-colors">
                            {event.choiceA.text}
                        </p>
                        <p className="font-sans font-caption text-text-muted leading-relaxed">
                            {event.choiceA.effect}
                        </p>
                        <div className="absolute top-0 right-0 w-12 h-12 bg-accent-gold/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>

                    <button 
                        onClick={() => onChoice('choiceB')} 
                        className="group p-6 bg-bg-panel border border-border-soft hover:border-accent-jade/50 transition-all text-left relative overflow-hidden"
                    >
                        <p className="font-sans font-h2 font-bold text-text-main mb-2 group-hover:text-accent-jade transition-colors">
                            {event.choiceB.text}
                        </p>
                        <p className="font-sans font-caption text-text-muted leading-relaxed">
                            {event.choiceB.effect}
                        </p>
                        <div className="absolute top-0 right-0 w-12 h-12 bg-accent-jade/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                </div>
                
                <div className="mt-8 pt-6 border-t border-border-soft text-right">
                    <span className="font-cursive text-text-disabled font-body opacity-40">望月李氏 · 老祖亲启</span>
                </div>
            </div>
        </div>,
        portalRoot
    );
};

export default EventModal;
