import { ClanMember, Realm, Element } from '../types';

const emptyInventory = () => ({
    herbs: {},
    minerals: {},
    paper: 0,
    pills: {},
    weapons: {},
    methods: {},
    scrolls: {}
});

const emptyEquipment = () => ({
    weapon: null,
    armor: null,
    accessory: null,
    treasure: null
});

export const INITIAL_MEMBERS_DATA: Omit<ClanMember, 'rootGrade'>[] = [
    // --- 望月李氏 ---
    { 
        id: 'mutian', name: '李木田', gender: '男', realm: Realm.Mortal, subRealm: 0, age: 42, maxAge: 72, 
        physique: '凡体', aptitude: 1, comprehension: 15, divineSense: 5, aspiration: 'FamilyProsperity', contributionPoints: 500,
        roots: { gold: 0, wood: 0, water: 0, fire: 0, earth: 0 },
        talents: { 战斗天赋: { 剑法: 1, 拳法: 1, 枪法: 1, 刀法: 1, 弓箭: 1 }, 百艺天赋: { 炼丹: 0, 炼器: 0, 制符: 0, 阵法: 0 } },
        proficiencies: { 炼丹: 0, 炼器: 0, 制符: 0, 阵法: 0 },
        combatProficiencies: { 剑法: 10, 拳法: 50, 枪法: 0, 刀法: 0, 弓箭: 0 },
        equippedItems: { ...emptyEquipment()},
        personalInventory: { ...emptyInventory(), pills: { 1201: 1 } },
        tier: '凡人', element: Element.Earth, status: 'healthy', loyalty: 100, assignment: 'Idle', legacyPoints: 100,
        mainMethodId: 0, movementMethodId: null, auxMethodIds: [], cultivationProgress: 0, developmentPlan: 'Balanced', divineAbilities: [], 
        family: '望月李氏', sect: '无', position: '家主',
        fatherId: null, motherId: null
    },
    { 
        id: 'changhu', name: '李长湖', gender: '男', realm: Realm.QiRefinement, subRealm: 2, age: 19, maxAge: 85, 
        physique: '凡体', aptitude: 15, comprehension: 20, divineSense: 8, aspiration: 'FamilyProsperity', contributionPoints: 0,
        roots: { gold: 2, wood: 3, water: 1, fire: 2, earth: 4 },
        talents: { 战斗天赋: { 剑法: 2, 拳法: 2, 枪法: 1, 刀法: 2, 弓箭: 1 }, 百艺天赋: { 炼丹: 2, 炼器: 1, 制符: 1, 阵法: 1 } },
        proficiencies: { 炼丹: 0, 炼器: 0, 制符: 0, 阵法: 0 },
        combatProficiencies: { 剑法: 120, 拳法: 80, 枪法: 0, 刀法: 40, 弓箭: 0 },
        equippedItems: emptyEquipment(),
        personalInventory:{ ...emptyInventory(), pills: { 1200: 100,1202: 100, 1203:100} },
        tier: '平庸', element: Element.Earth, status: 'healthy', loyalty: 100, assignment: 'Idle', legacyPoints: 50,
        mainMethodId: 0, movementMethodId: null, auxMethodIds: [], cultivationProgress: 10, developmentPlan: 'Balanced', divineAbilities: [], 
        family: '望月李氏', sect: '无', position: '弟子',
        fatherId: 'mutian'
    },
    { 
        id: 'tongya', name: '李通崖', gender: '男', realm: Realm.QiRefinement, subRealm: 4, age: 18, maxAge: 95, 
        physique: '天生剑心', aptitude: 65, comprehension: 55, divineSense: 25, aspiration: 'Longevity', contributionPoints: 0,
        roots: { gold: 8, wood: 1, water: 5, fire: 2, earth: 1 },
        talents: { 战斗天赋: { 剑法: 8, 拳法: 2, 枪法: 1, 刀法: 2, 弓箭: 1 }, 百艺天赋: { 炼丹: 1, 炼器: 4, 制符: 1, 阵法: 3 } },
        proficiencies: { 炼丹: 0, 炼器: 0, 制符: 0, 阵法: 0 },
        combatProficiencies: { 剑法: 850, 拳法: 100, 枪法: 20, 刀法: 50, 弓箭: 0 },
        equippedItems: { ...emptyEquipment(), weapon: 1100 },
        personalInventory: { ...emptyInventory(), pills: { 1200: 100,1204:50, 1202:100} },
        tier: '超凡', element: Element.Gold, status: 'healthy', loyalty: 100, assignment: 'Idle', legacyPoints: 200,
        mainMethodId: 0, movementMethodId: null, auxMethodIds: [], cultivationProgress: 45, developmentPlan: 'Combat', divineAbilities: [], 
        family: '望月李氏', sect: '无', position: '弟子',
        fatherId: 'mutian'
    },
    { 
        id: 'xiangping', name: '李项平', gender: '男', realm: Realm.QiRefinement, subRealm: 3, age: 16, maxAge: 90, 
        physique: '凡体', aptitude: 35, comprehension: 40, divineSense: 15, aspiration: 'FamilyProsperity', contributionPoints: 0,
        roots: { gold: 1, wood: 5, water: 2, fire: 4, earth: 3 },
        talents: { 战斗天赋: { 剑法: 3, 拳法: 3, 枪法: 1, 刀法: 1, 弓箭: 3 }, 百艺天赋: { 炼丹: 3, 炼器: 1, 制符: 2, 阵法: 1 } },
        proficiencies: { 炼丹: 0, 炼器: 0, 制符: 0, 阵法: 0 },
        combatProficiencies: { 剑法: 300, 拳法: 250, 枪法: 0, 刀法: 0, 弓箭: 420 },
        equippedItems: emptyEquipment(),
        personalInventory: emptyInventory(),
        tier: '普通', element: Element.Wood, status: 'healthy', loyalty: 100, assignment: 'Idle', legacyPoints: 100,
        mainMethodId: 0, movementMethodId: null, auxMethodIds: [], cultivationProgress: 20, developmentPlan: 'Balanced', divineAbilities: [], 
        family: '望月李氏', sect: '无', position: '弟子',
        fatherId: 'mutian'
    },
    { 
        id: 'chijing', name: '李尺泾',  gender: '男', realm: Realm.QiRefinement, subRealm: 8, age: 15, maxAge: 99, 
        physique: '剑道通神', aptitude: 98, comprehension: 95, divineSense: 60, aspiration: 'FamilyProsperity', contributionPoints: 0,
        roots: { gold: 5, wood: 4, water: 10, fire: 3, earth: 5 },
        talents: { 战斗天赋: { 剑法: 10, 拳法: 1, 枪法: 1, 刀法: 1, 弓箭: 1 }, 百艺天赋: { 炼丹: 1, 炼器: 2, 制符: 2, 阵法: 3 } },
        proficiencies: { 炼丹: 0, 炼器: 0, 制符: 0, 阵法: 0 },
        combatProficiencies: { 剑法: 1200, 拳法: 10, 枪法: 0, 刀法: 0, 弓箭: 0 },
        equippedItems: { ...emptyEquipment(), weapon: 1107 },
        personalInventory: { ...emptyInventory(), weapons:{},minerals: { 1402: 1 }, methods: { 1001: 1, 1002:1, 1004:1, 1005:1} ,pills: { 1202: 100, 1203:100, 1204:50}, scrolls:{1500:1},},
        tier: '绝世天骄', element: Element.Water, status: 'healthy', loyalty: 100, assignment: 'Idle', legacyPoints: 1000,
        mainMethodId: 0, movementMethodId: null, auxMethodIds: [], cultivationProgress: 80, developmentPlan: 'Combat', divineAbilities: [], 
        family: '望月李氏', sect: '无', position: '弟子',
        fatherId: 'mutian'
    },
    { 
        id: 'xiaoyao', name: '李逍遥',  gender: '男', realm: Realm.QiRefinement, subRealm: 3, age: 14, maxAge: 95, 
        physique: '天生剑心', aptitude: 85, comprehension: 78, divineSense: 22, aspiration: 'Wanderer', contributionPoints: 0,
        roots: { gold: 9, wood: 2, water: 5, fire: 2, earth: 3 },
        talents: { 战斗天赋: { 剑法: 9, 拳法: 2, 枪法: 1, 刀法: 2, 弓箭: 1 }, 百艺天赋: { 炼丹: 1, 炼器: 2, 制符: 1, 阵法: 2 } },
        proficiencies: { 炼丹: 0, 炼器: 0,制符: 0, 阵法: 0 },
        combatProficiencies: { 剑法: 600, 拳法: 50, 枪法: 0, 刀法: 0, 弓箭: 0 },
        equippedItems: emptyEquipment(),
        personalInventory: emptyInventory(),
        tier: '天才', element: Element.Gold, status: 'healthy', loyalty: 100, assignment: 'Idle', legacyPoints: 200,
        mainMethodId: 0, movementMethodId: null, auxMethodIds: [], cultivationProgress: 35, developmentPlan: 'Combat', divineAbilities: [], 
        family: '望月李氏', sect: '天一剑宗', position: '弟子',
        fatherId: 'mutian'
    },
    
    // --- 邵家 (练气家族) ---
    {
        id: 'shao_degeng', name: '邵得庚', gender: '男', realm: Realm.QiRefinement, subRealm: 9, age: 72, maxAge: 88,
        physique: '火灵之体', aptitude: 45, comprehension: 30, divineSense: 18, aspiration: 'PowerSeeker', contributionPoints: 0,
        roots: { gold: 1, wood: 2, water: 1, fire: 7, earth: 2 },
        talents: { 战斗天赋: { 剑法: 1, 拳法: 4, 枪法: 1, 刀法: 6, 弓箭: 1 }, 百艺天赋: { 炼丹: 2, 炼器: 5, 制符: 1, 阵法: 2 } },
        proficiencies: { 炼丹: 0, 炼器: 120, 制符: 0, 阵法: 0 },
        combatProficiencies: { 剑法: 0, 拳法: 200, 枪法: 0, 刀法: 650, 弓箭: 0 },
        equippedItems: emptyEquipment(), personalInventory: emptyInventory(),
        tier: '普通', element: Element.Fire, status: 'healthy', loyalty: 100, assignment: 'Idle', legacyPoints: 0,
        mainMethodId: 0, movementMethodId: null, auxMethodIds: [], cultivationProgress: 95, developmentPlan: 'Balanced', divineAbilities: [],
        family: '邵家', sect: '无', position: '家主', fatherId: null
    },

    // --- 魏家 (筑基家族) ---
    {
        id: 'wei_qishuang', name: '魏启霜', gender: '女', realm: Realm.FoundationEstablishment, subRealm: 3, age: 112, maxAge: 240,
        physique: '玄冰寒体', aptitude: 72, comprehension: 80, divineSense: 120, aspiration: 'Longevity', contributionPoints: 0,
        roots: { gold: 2, wood: 1, water: 8, fire: 1, earth: 1 },
        talents: { 战斗天赋: { 剑法: 2, 拳法: 1, 枪法: 1, 刀法: 1, 弓箭: 1 }, 百艺天赋: { 炼丹: 1, 炼器: 2, 制符: 4, 阵法: 9 } },
        proficiencies: { 炼丹: 0, 炼器: 0, 制符: 200, 阵法: 1500 },
        combatProficiencies: { 剑法: 100, 拳法: 50, 枪法: 0, 刀法: 0, 弓箭: 0 },
        equippedItems: emptyEquipment(), personalInventory: emptyInventory(),
        tier: '超凡', element: Element.Water, status: 'healthy', loyalty: 100, assignment: 'Idle', legacyPoints: 0,
        mainMethodId: 0, movementMethodId: null, auxMethodIds: [], cultivationProgress: 30, developmentPlan: 'Balanced', divineAbilities: ['霜天阵'],
        family: '魏家', sect: '无', position: '长老', fatherId: null
    },

    // --- 北寒宗 (顶尖宗门) ---
    {
        id: 'hanyue_fairy', name: '寒月仙子', gender: '女', realm: Realm.Zifu, subRealm: 1, age: 350, maxAge: 600,
        physique: '广寒灵躯', aptitude: 92, comprehension: 94, divineSense: 800, aspiration: 'Longevity', contributionPoints: 0,
        roots: { gold: 1, wood: 1, water: 10, fire: 0, earth: 0 },
        talents: { 战斗天赋: { 剑法: 9, 拳法: 1, 枪法: 1, 刀法: 1, 弓箭: 1 }, 百艺天赋: { 炼丹: 8, 炼器: 4, 制符: 5, 阵法: 6 } },
        proficiencies: { 炼丹: 1000, 炼器: 500, 制符: 800, 阵法: 1200 },
        combatProficiencies: { 剑法: 3500, 拳法: 200, 枪法: 0, 刀法: 0, 弓箭: 0 },
        equippedItems: emptyEquipment(), personalInventory: emptyInventory(),
        tier: '绝世', element: Element.Water, status: 'healthy', loyalty: 100, assignment: 'Idle', legacyPoints: 0,
        mainMethodId: 0, movementMethodId: null, auxMethodIds: [], cultivationProgress: 10, developmentPlan: 'Combat', divineAbilities: ['玄冰贯穿', '月落乌啼'],
        family: '无', sect: '北寒宗', position: '执法长老', fatherId: null
    }
];