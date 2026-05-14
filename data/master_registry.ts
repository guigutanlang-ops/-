
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
            40100: 20, // 灵谷草 (基础口粮)
            40101: 5,  // 清灵花
            40102: 10   // 回气草
        },
        minerals: {
            50100: 30, // 精铁 (李家铁匠铺常用)
            50101: 2   // 赤铜精
        },
        paper: 10,
        pills: {
            30100: 10, // 止血散
            30101: 5,  // 补气丸
            30102: 2, //凝气丹 
            30202:10
        },
        weapons: {
            20100: 2,  // 凡铁剑
            20901: 1   // 望月玉佩 
        },
        methods: {
            10100: 1,  // 吐纳功
            10102: 1   // 疾风步
        },
        scrolls: {
            60103: 1
        }
    },

    learnedRecipes: {
        alchemy: [30100, 30101], // 止血散、补气丸
        smithing: [20100],      // 凡铁剑
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
            herbs: { 40100: 50, 40104: 10 },
            minerals: { 50100: 100, 50101: 20 }, // 邵家多矿脉
            paper: 5,
            pills: { 30100: 20, 30102: 5 },
            weapons: { 20200: 5 }, // 符纹快刀
            methods: { 10100: 1, 10200: 1 },
            scrolls: {}
        }
    },
    '魏家': {
        spiritStones: 85000, // 魏家是筑基家族，底蕴远超练气家族
        luck: 75,
        inventory: {
            herbs: { 40103: 15, 40105: 10, 40106: 2 },
            minerals: { 50200: 20, 50300: 5 }, // 玄金石, 玄铁母
            paper: 50,
            pills: { 30102: 20, 30300: 3, 30401: 1 }, // 包含筑基丹和降尘丹
            weapons: { 20300: 3, 20600: 1 }, // 寒铁剑, 镇海印
            methods: { 10200: 1, 10300: 1 }, // 太清养元功
            scrolls: { } // 青锋剑器谱
        }
    },
    '北寒宗': {
        spiritStones: 677813,
        luck: 100,
        inventory: {
            herbs: { 40107: 50 }, // 天星叶
            minerals: { 50400: 100 }, // 云英石
            paper: 1000,
            pills: { 30800: 5, 30900: 1 }, // 金丹, 涅槃丹
            weapons: { 20700: 5, 20900: 1 }, // 紫薇软剑, 羲和重剑
            methods: { 10300: 1, 10400: 1 },
            scrolls: {}
        }
    }
};
