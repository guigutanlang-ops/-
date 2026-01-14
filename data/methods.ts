
import { CultivationMethod, Element, Realm } from '../types';

export const METHODS_DATA: CultivationMethod[] = [
    { 
        id: 1000, 
        name: '吐纳功', 
        grade: 1, 
        quality: '下等', 
        type: 'Cultivation', 
        element: '无', 
        desc: '天罡大陆流传最广的基础功法，中规中矩。', 
        bonus: '基础修炼效率提升', 
        buffs: { cultivationSpeed: 5 },
        requirements: {  minRootGrade: '伪灵根' }
    },
    { 
        id: 1001, 
        name: '归元诀', 
        grade: 2, 
        quality: '中等', 
        type: 'Cultivation', 
        element: '无', 
        desc: '比起吐纳功更进一步的修行之法，讲究气息绵长。', 
        bonus: '气血悠长，延年益寿', 
        buffs: { cultivationSpeed: 15 },
        requirements: { realm: Realm.QiRefinement}
    },
    { 
        id: 1002, 
        name: '金锋术', 
        grade: 1, 
        quality: '下等', 
        type: 'Combat', 
        element: Element.Gold, 
        desc: '将灵力化作锋利的金芒，基础攻击法门。', 
        bonus: '锐不可当', 
        buffs: { attack: 10 },
        requirements: { realm: Realm.QiRefinement, minRoots: { gold: 2 } }
    },
    { 
        id: 1003, 
        name: '疾风步', 
        grade: 1, 
        quality: '下等', 
        type: 'Movement', 
        element: '无', 
        desc: '基础的身法，消耗灵力换取爆发性的移动速度。', 
        bonus: '身轻如燕', 
        buffs: { defense: 5 },
        requirements: { realm: Realm.QiRefinement }
    },
    { 
        id: 1004, 
        name: '离火焚心经', 
        grade: 3, 
        quality: '上等', 
        type: 'Cultivation', 
        element: Element.Fire, 
        desc: '需纯阳之体方可修行，法力霸道无比。', 
        bonus: '离火之精，焚山煮海', 
        buffs: { cultivationSpeed: 30, attack: 20 },
        requirements: { realm: Realm.QiRefinement, minRoots: { fire: 6 } }
    },
    { 
        id: 1005, 
        name: '太清养元功', 
        grade: 4, 
        quality: '上等', 
        type: 'Cultivation', 
        element: '无', 
        desc: '吸纳天地灵气，调和自身元气，奠定修行之基。', 
        bonus: '大幅提升修行速度', 
        buffs: { cultivationSpeed: 45 },
        requirements: { realm: Realm.QiRefinement, minRootGrade: '下品灵根' }
    }
];
