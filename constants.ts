import { SpecializedTalents, BuildingCategory, Realm } from './types';
import { RECIPES_DATA } from './data/recipes';
import { METHODS_DATA } from './data/methods';
import { BUILDING_TYPES_DATA } from './data/buildings';
import { INITIAL_REGIONS_DATA } from './data/regions';
import { INITIAL_MEMBERS_DATA } from './data/members';
import { PHYSIQUES_LIST, PHYSIQUE_DETAILS_DATA } from './data/physiques';
import { ABILITIES_LIST, ABILITY_DETAILS_DATA } from './data/abilities';
import { TASK_INFO_DATA, DEVELOPMENT_PLANS_DATA } from './data/tasks';
import { SURNAMES_DATA, REALM_ORDER_DATA, SECTS_DATA, POSITIONS_DATA } from './data/metadata';
import { equipments } from './data/equipments';
import { PILLS } from './data/pills';
import { HERBS } from './data/herbs';
import { MINERALS } from './data/minerals';
import { ASPIRATIONS_DATA } from './data/aspirations';
import { IMAGE_ASSETS } from './assets/imageRegistry';

export interface BuildingMetadata {
    name: string;
    desc: string;
    baseCost: number;
    icon: string;       // 仍然保留 Emoji 作为兜底
    image?: string;     // 新增：图片资源路径
    category: BuildingCategory;
    baseTurns: number;
    requirements: {
        realm?: Realm;
        talent?: { type: keyof SpecializedTalents['百艺天赋'], rank: number };
    };
}

export const VEIN_LEVELS = [
    { name: '微型灵脉', exp: 0, bonus: 1.25, unlock: '丙等', color: 'text-emerald-500', glow: 'shadow-emerald-500/20' },
    { name: '小型灵脉', exp: 1000, bonus: 1.5, unlock: '乙等', color: 'text-blue-500', glow: 'shadow-blue-500/20' },
    { name: '中型灵脉', exp: 3000, bonus: 2.0, unlock: '甲等', color: 'text-amber-500', glow: 'shadow-amber-500/20' },
    { name: '大型灵脉', exp: 8000, bonus: 3.0, unlock: '全速', color: 'text-purple-500', glow: 'shadow-purple-500/20' },
    { name: '龙脉', exp: 20000, bonus: 5.0, unlock: '天命', color: 'text-red-500', glow: 'shadow-red-500/40' }
];

export const CULTIVATION_SLOT_BONUSES: Record<string, number[]> = {
    'Jia': [3.5, 3.2, 3.0, 2.8],
    'Yi': [2.5, 2.2, 2.0, 1.8],
    'Bing': [1.6, 1.5, 1.4, 1.3]
};

// 注入图片路径到建筑配置
export const BUILDING_TYPES: Record<string, BuildingMetadata> = Object.fromEntries(
    Object.entries(BUILDING_TYPES_DATA).map(([key, value]) => [
        key,
        { ...value, image: (IMAGE_ASSETS.BUILDINGS as any)[key] }
    ])
);

export const RECIPES = RECIPES_DATA;
export const INITIAL_REGIONS = INITIAL_REGIONS_DATA;
export const INITIAL_MEMBERS = INITIAL_MEMBERS_DATA;
export const TASK_INFO = TASK_INFO_DATA;
export const CULTIVATION_METHODS = METHODS_DATA;
export const DEVELOPMENT_PLANS = DEVELOPMENT_PLANS_DATA;
export const SURNAMES = SURNAMES_DATA;
export const REALM_ORDER = REALM_ORDER_DATA;
export const PHYSIQUES = PHYSIQUES_LIST;
export const ABILITIES = ABILITIES_LIST;
export const PHYSIQUE_DETAILS = PHYSIQUE_DETAILS_DATA;
export const ABILITY_DETAILS = ABILITY_DETAILS_DATA;
export const SECTS = SECTS_DATA;
export const POSITIONS = POSITIONS_DATA;
export const ASPIRATIONS = ASPIRATIONS_DATA;

const allEquipments = [
    ...equipments.Weapons,
    ...equipments.Armors,
    ...equipments.Accessories,
    ...equipments.Treasures
];

export const WEAPON_DETAILS = Object.fromEntries(
    allEquipments.map(w => [w.id, { 
        ...w, 
        category: 'weapon', 
        gradeText: `${w.grade}品${w.grade <= 2 ? '装备' : w.grade <= 7 ? '法器' : w.grade <= 8 ? '仙器' : '神器'}` 
    }])
);

export const PILL_DETAILS = Object.fromEntries(
    PILLS.map(p => [p.id, { ...p, category: 'pill', gradeText: `${p.grade}品丹药` }])
);

export const HERB_DETAILS = Object.fromEntries(
    HERBS.map(h => [h.id, { ...h, category: 'herb', gradeText: `${h.grade}品${h.grade <= 2 ? '药草' : '灵药'}` }])
);

export const MINERAL_DETAILS = Object.fromEntries(
    MINERALS.map(m => [m.id, { ...m, category: 'mineral', gradeText: `${m.grade}品${m.grade <= 2 ? '矿石' : '灵矿'}` }])
);

export const RECIPES_DETAILS = Object.fromEntries([
    ...RECIPES_DATA.Alchemy.map(r => [r.id, { ...r, category: 'scrolls', gradeText: r.grade === 0 ? '凡品丹方' : `${r.grade}品丹方`}]),
    ...RECIPES_DATA.Smithing.map(r => [r.id, { ...r, category: 'scrolls', gradeText: r.grade === 0? '凡品器谱' : `${r.grade}品器谱` }])
]);

export const METHOD_DETAILS = Object.fromEntries(
    METHODS_DATA.map(m => [m.id, { 
        ...m, 
        category: 'method', 
        effect: m.bonus, 
        gradeText: `${m.grade}品${m.quality}${m.type === 'Cultivation' ? '功法' : m.type === 'Combat' ? '法术' : '遁术'}` 
    }])
);

export const ALL_ITEM_DETAILS = {
    ...WEAPON_DETAILS,
    ...PILL_DETAILS,
    ...HERB_DETAILS,
    ...MINERAL_DETAILS,
    ...METHOD_DETAILS,
    ...RECIPES_DETAILS
};

export const getArtisanBonus = (talentLevel: number): number => {
    if (talentLevel <= 5) return 0;
    if (talentLevel === 6) return 2;
    if (talentLevel === 7) return 5;
    if (talentLevel === 8) return 7;
    if (talentLevel === 9) return 10;
    if (talentLevel === 10) return 15;
    return 0;
};

export const getWeaponTalentBonus = (talentLevel: number): number => {
    if (talentLevel <= 5) return 0;
    if (talentLevel === 6) return 2;
    if (talentLevel === 7) return 5;
    if (talentLevel === 8) return 7;
    if (talentLevel === 9) return 10;
    if (talentLevel === 10) return 20;
    return 0;
};

export const getWeaponMasteryTitle = (type: string, proficiency: number): string => {
    if (proficiency < 100) return `${type}初学`;
    if (proficiency < 500) return `${type}小成`;
    if (proficiency < 1000) return `${type}大成`;
    if (proficiency < 2500) return `${type}圆满`;
    if (proficiency < 5000) return `${type.replace('法', '道')}大师`;
    return `${type.replace('法', '道')}宗师`;
};

export const getArtisanTitle = (type: string, proficiency: number): string => {
    const getThreshold = (rank: number): number => {
        if (rank <= 0) return 0;
        if (rank === 1) return 10;
        return 10 + 50 * rank * (rank - 1);
    };

    if (proficiency < getThreshold(1)) return `${type}学徒`;

    let currentRank = 1;
    for (let r = 9; r >= 1; r--) {
        if (proficiency >= getThreshold(r)) {
            currentRank = r;
            break;
        }
    }
    
    const numerals = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return `${numerals[currentRank]}品${type}师`;
};
