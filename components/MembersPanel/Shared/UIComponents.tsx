
import React from 'react';
import { ClanMember, MethodType } from '../../../types';
import { getTitleColor, getGradeStyle, getGradeColor } from './utils';
import { ALL_ITEM_DETAILS, CULTIVATION_METHODS } from '../../../constants';

export const NamePlaque: React.FC<{ member: ClanMember }> = ({ member }) => (
    <div className="relative text-center py-6 px-12 border-b border-border-soft">
        <h2 className="font-serif font-semibold font-display text-text-main tracking-widest">
            {member.name}
        </h2>
        {member.title && (
            <p className={`mt-2 font-sans font-medium font-h2 ${getTitleColor(member.tier)}`}>
                {member.title}
            </p>
        )}
    </div>
);

export const EquipSlot: React.FC<{
    itemId: number | null;
    label: string;
    icon: string;
    isFocused: boolean;
    onClick: () => void;
    onMouseEnter: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
    onUnequip: () => void;
    isLeftSide: boolean;
}> = ({ itemId, label, icon, isFocused, onClick, onMouseEnter, onMouseLeave, onUnequip, isLeftSide }) => {
    const itemDetails = itemId !== null ? ALL_ITEM_DETAILS[itemId] as any : null;
    const style = itemDetails ? getGradeStyle(itemDetails.grade) : null;

    return (
        <div className="flex flex-col items-center gap-2 relative group/slot">
            <div 
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className={`w-16 h-16 rounded-sm border transition-all duration-200 cursor-pointer flex items-center justify-center relative
                    ${itemDetails 
                        ? `${style?.border} ${style?.bg} hover:brightness-125` 
                        : 'bg-bg-panel border-border-soft text-text-disabled hover:border-accent-jade/50'}`}
            >
                {itemDetails ? (
                    <span className="text-2xl drop-shadow-md">{icon}</span>
                ) : (
                    <span className="text-xl opacity-20">{icon}</span>
                )}
                
                {itemId !== null && isFocused && (
                    <div className="absolute inset-0 ring-2 ring-accent-gold/50 pointer-events-none"></div>
                )}
            </div>

            {itemId !== null && isFocused && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onUnequip(); }}
                    className={`absolute top-1/2 -translate-y-1/2 z-50 bg-red-900/80 text-white text-[11px] font-bold py-1 px-3 rounded-sm border border-red-400/30
                        ${isLeftSide ? '-right-14' : '-left-14'}`}
                >
                    卸下
                </button>
            )}

            <span className={`font-sans font-caption ${itemDetails ? style?.text : 'text-text-disabled'}`}>
                {itemDetails ? itemDetails.name : label}
            </span>
        </div>
    );
};

export const SlotItem: React.FC<{
    methodId: number | null;
    type: MethodType;
    label: string;
    isFocused: boolean;
    onClick: () => void;
    onMouseEnter: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
    onUnequip: () => void;
}> = ({ methodId, type, label, isFocused, onClick, onMouseEnter, onMouseLeave, onUnequip }) => {
    const method = CULTIVATION_METHODS.find(m => m.id === methodId);
    const style = method ? getGradeStyle(method.grade) : null;

    return (
        <div className="flex flex-col items-center gap-2 group relative">
            <div 
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className={`w-14 h-14 rounded-sm border cursor-pointer transition-all flex items-center justify-center
                    ${isFocused ? 'ring-2 ring-accent-gold/50' : ''}
                    ${method ? `${style?.border} ${style?.bg}` : 'bg-bg-panel border-border-soft'}`}
            >
                {method ? (
                    <span className="text-xl">📖</span> 
                ) : (
                    <span className="text-text-disabled text-[10px] font-medium opacity-30">空</span>
                )}
                
                {methodId !== null && isFocused && (
                    <div className="absolute inset-0 bg-bg-main/90 flex items-center justify-center p-1 animate-fade-in">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onUnequip(); }}
                            className="bg-red-900/80 text-white text-[10px] py-1 px-2 rounded-sm"
                        >
                            卸下
                        </button>
                    </div>
                )}
            </div>
            <span className={`font-sans font-caption ${method ? style?.text : 'text-text-disabled'}`}>
                {method ? method.name : label}
            </span>
        </div>
    );
};
