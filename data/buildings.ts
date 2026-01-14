
import { BuildingMetadata } from '../constants';
import { Realm } from '../types';

export const BUILDING_TYPES_DATA: Record<string, BuildingMetadata> = {
    Market: { 
        name: '坊市', desc: '每年产生固定的灵石收益，受派驻人员能力影响。', baseCost: 1000, icon: '⚖️', 
        category: '资源产出', baseTurns: 1, requirements: {} 
    },
    Library: { 
        name: '藏经阁', desc: '保存功法，提升家族底蕴。', baseCost: 1200, icon: '📚', 
        category: '家族功能', baseTurns: 1, requirements: { realm: Realm.FoundationEstablishment } 
    },
    AlchemyRoom: { 
        name: '炼丹室', desc: '可消耗药材炼制丹药。需要家族内有炼丹师。', baseCost: 800, icon: '⚗️', 
        category: '家族功能', baseTurns: 1, requirements: { talent: { type: '炼丹', rank: 2 } } 
    },
    Smithy: { 
        name: '炼器坊', desc: '可打造法器。需要家族内有炼器师。', baseCost: 800, icon: '🔨', 
        category: '家族功能', baseTurns: 1, requirements: { talent: { type: '炼器', rank: 2 } } 
    },
    CultivationRoom: { 
        name: '修炼室', desc: '加速族人闭关效率。', baseCost: 600, icon: '🧘', 
        category: '修行基础', baseTurns: 1, requirements: {} 
    },
    XianFu: { 
        name: '李氏仙府', desc: '老祖居所，提升家族气运。', baseCost: 5000, icon: '🏰', 
        category: '修行基础', baseTurns: 1, requirements: { realm: Realm.YuanYing } 
    }
};
