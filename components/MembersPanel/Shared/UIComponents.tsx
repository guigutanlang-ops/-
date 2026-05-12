
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

            <span className={`font-sans font-caption ${itemDetails ? style?.text : 'text-text-disabled'} text-[11px] font-bold`}>
                {itemDetails ? itemDetails.name : label}
            </span>
            <div className="h-5 flex items-center justify-center w-full mt-[3px]">
                {itemId !== null && isFocused && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onUnequip(); }}
                        className="animate-fade-in bg-red-900/40 hover:bg-red-900/80 text-white text-[10px] py-0.5 px-3 rounded-sm border border-red-500/30 transition-colors"
                    >
                        卸下
                    </button>
                )}
            </div>
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
        <div className="flex flex-col items-center gap-1 group relative">
            <div 
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className={`w-14 h-14 rounded-sm border cursor-pointer transition-all flex items-center justify-center
                    ${isFocused ? 'ring-2 ring-accent-gold/50 shadow-[0_0_15px_rgba(201,160,99,0.2)]' : ''}
                    ${method ? `${style?.border} ${style?.bg}` : 'bg-bg-panel border-border-soft'}`}
            >
                {method ? (
                    <span className="text-xl">📖</span> 
                ) : (
                    <span className="text-text-disabled text-[10px] font-medium opacity-30">空</span>
                )}
            </div>
            <span className={`font-sans font-caption ${method ? style?.text : 'text-text-disabled'} text-[11px] font-bold`}>
                {method ? method.name : label}
            </span>
            <div className="h-5 flex items-center justify-center w-full mt-[1px]">
                {methodId !== null && isFocused && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onUnequip(); }}
                        className="animate-fade-in bg-red-900/40 hover:bg-red-900/80 text-white text-[10px] py-0.5 px-2 rounded-sm border border-red-500/30 transition-colors tracking-widest"
                    >
                        卸下
                    </button>
                )}
            </div>
        </div>
    );
};
