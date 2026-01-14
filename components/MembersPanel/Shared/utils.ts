
import { Realm, TalentTier, RootGrade, ClanMember } from '../../../types';
import { GENERATION_PAIRS } from '../../../data/metadata';

/**
 * 递归计算族人的代数
 */
export const calculateMemberGeneration = (member: ClanMember, allMembers: ClanMember[]): number => {
    if (!member.fatherId) return -1;
    const father = allMembers.find(m => m.id === member.fatherId);
    if (!father) return -1;
    return calculateMemberGeneration(father, allMembers) + 1;
};

/**
 * 获取辈分详细称号
 */
export const getGenerationTitle = (gen: number): string => {
    if (gen === -1) return "一世·老祖";
    if (gen === 0) return "二世·黎泾五子";
    
    const titles: Record<number, string> = {
        1: "三世·玄景",
        2: "四世·渊清",
        3: "五世·曦月",
        4: "六世·承明",
        5: "七世·周行",
        6: "八世·绛阙"
    };
    
    return titles[gen] || `${gen + 1}世子弟`;
};

export const getGenerationChar = (gen: number, gender: '男' | '女'): string => {
    const pair = GENERATION_PAIRS[gen];
    if (pair) return gender === '男' ? pair[0] : pair[1];
    return '';
};

/**
 * 获取物品品级对应的视觉样式
 * 0-2: 凡品 (灰色/白色)
 * 3: 灵品 (绿色)
 * 4: 珍品 (蓝色)
 * 5: 紫色
 * 6: 橙色
 * 7: 金色
 * 8: 红色
 * 9: 彩色
 */
export const getGradeStyle = (grade: number | string | undefined) => {
    const g = typeof grade === 'number' ? grade : (grade === '神器残片' ? 9 : 0);
    
    if (g <= 2) return { 
        border: 'border-gray-500/30', 
        text: 'text-gray-300', 
        bg: 'bg-gray-900/20', 
        hover: 'hover:border-gray-400', 
        glow: '', 
        shadow: '' 
    };
    if (g === 3) return { 
        border: 'border-emerald-500/40', 
        text: 'text-emerald-400', 
        bg: 'bg-emerald-900/10', 
        hover: 'hover:border-emerald-400', 
        glow: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]', 
        shadow: 'drop-shadow-[0_0_3px_rgba(16,185,129,0.6)]' 
    };
    if (g === 4) return { 
        border: 'border-blue-500/40', 
        text: 'text-blue-400', 
        bg: 'bg-blue-900/10', 
        hover: 'hover:border-blue-400', 
        glow: 'shadow-[0_0_12px_rgba(59,130,246,0.2)]', 
        shadow: 'drop-shadow-[0_0_4px_rgba(59,130,246,0.7)]' 
    };
    if (g === 5) return { 
        border: 'border-purple-500/40', 
        text: 'text-purple-400', 
        bg: 'bg-purple-900/10', 
        hover: 'hover:border-purple-400', 
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]', 
        shadow: 'drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]' 
    };
    if (g === 6) return { 
        border: 'border-orange-500/40',
        text: 'text-orange-400',
        bg: 'bg-orange-900/20',
        hover: 'hover:border-orange-400',
        glow: 'shadow-[0_0_12px_rgba(251,146,60,0.45)]',
        shadow: 'shadow-orange-900/40'
    };
    if (g === 7) return { 
        bborder: 'border-yellow-400/50',
        text: 'text-yellow-300',
        bg: 'bg-yellow-900/20',
        hover: 'hover:border-yellow-300',
        glow: 'shadow-[0_0_14px_rgba(250,204,21,0.5)]',
        shadow: 'shadow-yellow-900/50'
    };
    if (g === 8) return { 
        border: 'border-red-500/45',
        text: 'text-red-400',
        bg: 'bg-red-900/25',
        hover: 'hover:border-red-400',
        glow: 'shadow-[0_0_14px_rgba(248,113,113,0.5)]',
        shadow: 'shadow-red-900/50'
    };
    return { 
        border: 'border-transparent',
        text: 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400',
        bg: 'bg-gradient-to-br from-pink-900/30 via-purple-900/30 to-cyan-900/30',
        hover: 'hover:from-pink-400 hover:to-cyan-400',
        glow: 'shadow-[0_0_18px_rgba(168,85,247,0.55)]',
        shadow: 'shadow-purple-900/60'
    };
};

export const getGradeColor = (grade: number | string | undefined) => {
    const style = getGradeStyle(grade);
    return `${style.text} ${style.shadow}`;
};

export const getTierColor = (tier: TalentTier) => {
    switch (tier) {
        case '凡人': return 'text-text-disabled';
        case '普通': return 'text-accent-jade';
        case '超凡': return 'text-blue-400';
        case '天才': return 'text-purple-400';
        case '绝世': return 'text-orange-400';
        case '绝世天骄': return 'text-orange-400 font-bold';
        default: return 'text-text-muted';
    }
};

export const getTitleColor = (tier: TalentTier) => {
    return getTierColor(tier);
};

export const getRootGradeColor = (grade: RootGrade) => {
    switch (grade) {
        case '凡人': return 'text-text-disabled';
        case '下品灵根': return 'text-accent-jade';
        case '中品灵根': return 'text-blue-400';
        case '上品灵根': return 'text-purple-400';
        case '极品灵根': return 'text-orange-400';
        default: return 'text-text-muted';
    }
};

export const getRealmStyle = (realm: Realm) => {
    return "border-border-soft bg-bg-panel text-text-muted";
};

export const getRealmText = (realm: Realm, subRealm: number) => {
    if (realm === Realm.Mortal) return '凡人';
    return `${realm}${subRealm}层`;
};

export const getElementColorClass = (key: string) => {
    switch (key) {
        case 'gold': return 'text-accent-gold border-accent-gold/20';
        case 'wood': return 'text-accent-jade border-accent-jade/20';
        case 'water': return 'text-blue-400 border-blue-400/20';
        case 'fire': return 'text-red-400/70 border-red-400/10';
        case 'earth': return 'text-yellow-700/70 border-yellow-700/10';
        default: return 'text-text-muted border-border-soft';
    }
};

export const getElementName = (key: string) => {
    switch (key) {
        case 'gold': return '金';
        case 'wood': return '木';
        case 'water': return '水';
        case 'fire': return '火';
        case 'earth': return '土';
        default: return key;
    }
};
