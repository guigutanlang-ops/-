
export enum Realm {
    Mortal = '凡人',
    QiRefinement = '练气',
    FoundationEstablishment = '筑基',
    Zifu = '紫府',
    JinDan = '金丹',
    YuanYing = '元婴',
    YuanShen = '化神'
}

export enum Element {
    Gold = '金',
    Wood = '木',
    Water = '水',
    Fire = '火',
    Earth = '土'
}

export type SettlementType = 'Capital' | 'Minor' | 'Fort' | 'Resource' | 'Landmark';
export type TaskType = 'Cultivation' | 'Research' | 'Idle' | 'Mission' | 'Alchemy' | 'Smithing' | 'Recovery' | 'Travel';
export type TalentTier = '凡人' | '平庸' | '普通' | '超凡' | '天才' | '绝世' | '绝世天骄';
export type RootGrade = '凡人' | '伪灵根' | '下品灵根' | '中品灵根' | '上品灵根' | '极品灵根';
export type DevelopmentPlan = 'Combat' | 'Alchemy' | 'Smithing' | 'Talisman' | 'Balanced';

export type BuildingCategory = '资源产出' | '家族功能' | '修行基础';
export type RegionType = 'lake' | 'mountain' | 'forest' | 'city' | 'sect' | 'ruins' | 'cave' | 'island' | 'desert' | 'mine' | 'field' | 'volcano';
export type RegionCategory = 'Stakeholder' | 'Natural' | 'Mystic' | 'Resource';
export type FactionType = '望月李氏' | '北寒宗' | '天一剑宗' | '离火门' | '魏家' | '邵家' | '齐家' | '万花谷' | '无';
export type MethodType = 'Cultivation' | 'Combat' | 'Movement';

export interface EventChoice {
    text: string;
    effect: string;
    nextEventId?: string;
    flagsSet?: Record<string, boolean | number>;
}

export interface GameEvent {
    id: string;
    title: string;
    content: string;
    choiceA: EventChoice;
    choiceB: EventChoice;
    requirements?: {
        minYear?: number;
        minMerit?: number;
        requiredFlags?: string[];
        forbiddenFlags?: string[];
        minSpiritStones?: number;
    };
    impact: {
        spiritStones?: number;
        merit?: number;
        luck?: number;
        log?: string;
        eventType?: 'standard' | 'travel' | 'plot' | 'mission';
        memberId?: string;
        regionId?: string;
        newOwner?: FactionType;
        reputationChange?: Record<string, number>;
        items?: Record<number, number>; 
    };
}

export interface Building {
    id: string;
    type: string;
    level: number;
    assignedMemberId: string | null;
    assignedMemberIds?: (string | null)[];
    isFinished: boolean;
    turnsRemaining: number;
    activeProduction?: {
        recipeId: number;
        turnsRemaining: number;
        type: 'Alchemy' | 'Smithing';
    };
    veinLevel?: number;
    veinExp?: number;
}

export interface Inventory {
    herbs: Record<number, number>;
    minerals: Record<number, number>;
    paper: number;
    pills: Record<number, number>;
    weapons: Record<number, number>;
    methods: Record<number, number>;
    scrolls: Record<number, number>;
}

export interface SpecializedTalents {
    战斗天赋: {
        剑法: number;
        拳法: number;
        枪法: number;
        刀法: number;
        弓箭: number;
    };
    百艺天赋: {
        炼丹: number;
        炼器: number;
        制符: number;
        阵法: number;
    };
}

export interface ClanMember {
    id: string;
    name: string;
    gender: '男' | '女';
    realm: Realm;
    subRealm: number; 
    age: number;
    maxAge: number;
    physique: string;
    aptitude: number;
    comprehension: number;
    divineSense: number;
    aspiration: string;
    contributionPoints: number;
    roots: {
        gold: number;
        wood: number;
        water: number;
        fire: number;
        earth: number;
    };
    rootGrade: RootGrade;
    talents: SpecializedTalents;
    proficiencies: Record<string, number>;
    combatProficiencies: Record<string, number>;
    tier: TalentTier;
    element: Element;
    status: 'healthy' | 'injured' | 'dead';
    loyalty: number; 
    assignment: TaskType;
    legacyPoints: number; 
    deathYear?: number;
    mainMethodId: number | null;
    movementMethodId: number | null;
    auxMethodIds: number[];
    equippedItems: {
        weapon: number | null;
        armor: number | null;
        accessory: number | null;
        treasure: number | null;
    };
    personalInventory: Inventory;
    cultivationProgress: number;
    developmentPlan: DevelopmentPlan;
    divineAbilities: string[];
    family: string;
    sect: string;
    position: string;
    fatherId?: string | null;
    motherId?: string | null;
    title?: string;
    spouseId?: string | null;
    mentorId?: string | null;
}

export interface CultivationMethod {
    id: number;
    name: string;
    grade: number;
    quality: string;
    type: MethodType;
    element: Element | '无';
    desc: string;
    bonus: string;
    buffs: {
        cultivationSpeed?: number;
        maxAge?: number;
        attack?: number;
        defense?: number;
    };
    requirements?: {
        realm?: Realm;
        minRootGrade?: RootGrade;
        minRoots?: Partial<Record<keyof ClanMember['roots'], number>>;
    };
}

export interface Region {
    id: string;
    name: string;
    description: string;
    difficulty: number;
    owner: FactionType;
    x: number;
    y: number;
    type: RegionType;
    category: RegionCategory;
    settlementType: SettlementType; // 新增：建筑规模
    isDiscovered: boolean;
    resources: string[];
    production?: {
        stones?: number;
        merit?: number;
        items?: Record<number, number>;
    };
    activeMission?: {
        memberId: string;
        turnsRemaining: number;
        totalTurns: number;
        type: string;
    };
    guardMemberId?: string; 
    controlValue?: number;
    occupancyStatus?: 'idle' | 'secured' | 'disputed';
}

export interface GameState {
    year: number;
    season: number;
    spiritStones: number;
    merit: number; 
    luck: number; 
    members: ClanMember[];
    regions: Region[];
    buildings: Building[];
    inventory: Inventory;
    currentRegionId: string;
    logs: string[];
    heritagePool: number;
    unlockedPositions: string[];
    flags: Record<string, any>;
    eventQueue: string[];
    factionReputation: Record<string, number>; 
}
