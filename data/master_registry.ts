
import { Inventory } from '../types';

/**
 * 势力资源总账本接口
 */
export interface ClanRegistry {
    spiritStones: number;
    merit: number;
    luck: number;
    heritagePool: number;
    inventory: Inventory;
    // 记录势力已永久掌握的配方
    learnedRecipes: {
        alchemy: number[];
        smithing: number[];
        talismans: number[];
    };
}

/**
 * 望月李氏 - 玩家家族初始底蕴
 * 基于《玄鉴仙族》初期李家在望月湖立足的状态
 */
export const CLAN_MASTER_REGISTRY: ClanRegistry = {
    // 基础货币：初期李家并不富裕，灵石主要用于维持坊市和购买基础丹药
    spiritStones: 5000, 
    merit: 100,        
    luck: 60,          
    heritagePool: 50,  

    // 核心仓库
    inventory: {
        herbs: {
            1300: 20, // 灵谷草 (基础口粮)
            1301: 5,  // 清灵花
            1302: 10   // 回气草
        },
        minerals: {
            1400: 30, // 精铁 (李家铁匠铺常用)
            1401: 2   // 赤铜精
        },
        paper: 10,
        pills: {
            1200: 10, // 止血散
            1201: 5,  // 补气丸
            1202: 2   // 凝气丹 (重宝)
        },
        weapons: {
            1100: 2,  // 凡铁剑
            1109: 1   // 望月玉佩 (家主信物)
        },
        methods: {
            1000: 1,  // 吐纳功
            1003: 1   // 疾风步
        },
        scrolls: {
            1600:1
        }
    },

    learnedRecipes: {
        alchemy: [1200, 1201], // 止血散、补气丸
        smithing: [1100],      // 凡铁剑
        talismans: []
    }
};

/**
 * 其他势力库存数据 (用于贸易、派遣奖励或势力攻占)
 */
export const OTHER_FACTIONS_REGISTRY: Record<string, Partial<ClanRegistry>> = {
    '邵家': {
        spiritStones: 1200,
        luck: 40,
        inventory: {
            herbs: { 1300: 50, 1304: 10 },
            minerals: { 1400: 100, 1401: 20 }, // 邵家多矿脉
            paper: 5,
            pills: { 1200: 20, 1202: 5 },
            weapons: { 1101: 5 }, // 符纹快刀
            methods: { 1000: 1, 1001: 1 },
            scrolls: {}
        }
    },
    '魏家': {
        spiritStones: 85000, // 魏家是筑基家族，底蕴远超练气家族
        luck: 75,
        inventory: {
            herbs: { 1303: 15, 1305: 10, 1306: 2 },
            minerals: { 1402: 20, 1403: 5 }, // 玄金石, 玄铁母
            paper: 50,
            pills: { 1202: 20, 1204: 3, 1205: 1 }, // 包含筑基丹和降尘丹
            weapons: { 1102: 3, 1105: 1 }, // 寒铁剑, 镇海印
            methods: { 1001: 1, 1004: 1 }, // 太清养元功
            scrolls: { } // 青锋剑器谱
        }
    },
    '北寒宗': {
        spiritStones: 677813,
        luck: 100,
        inventory: {
            herbs: { 1307: 50 }, // 天星叶
            minerals: { 1404: 100 }, // 云英石
            paper: 1000,
            pills: { 1207: 5, 1208: 1 }, // 金丹, 涅槃丹
            weapons: { 1106: 5, 1108: 1 }, // 紫薇软剑, 羲和重剑
            methods: { 1004: 1, 1005: 1 },
            scrolls: {}
        }
    }
};
