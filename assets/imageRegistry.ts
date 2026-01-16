
/**
 * 游戏视觉资产注册表
 * 开发者提示：请将你的资源放置在根目录的 public/assets/Image/ 文件夹下
 */

const ASSET_ROOT = '/assets/Images';

export const IMAGE_ASSETS = {
    // 1. 地图与环境
    MAP: {
        WORLD_BASE: `${ASSET_ROOT}/Map/Map.png`,             // 整合后的地形主图
        PAPER_TEXTURE: `${ASSET_ROOT}/Map/paper_bg.jpg`,      // 地图宣纸底纹
        MIST_TILE: `${ASSET_ROOT}/Map/mist.png`,             // 云雾纹理
        SPIRIT_VEIN: `${ASSET_ROOT}/Map/vein_line.png`,      // 灵脉线条
        COMPASS: `${ASSET_ROOT}/Map/compass.png`,            // 罗盘/司南
    },

    // 2. UI 通用装饰
    UI: {
        PANEL_BG: `${ASSET_ROOT}/UI/panel_parchment.png`,   // 弹窗背景图
        BORDER_GOLD: `${ASSET_ROOT}/UI/border_gold.png`,     // 金色边框
        BUTTON_MAIN: `${ASSET_ROOT}/UI/btn_main.png`,        // 主按钮样式
        SLOT_EMPTY: `${ASSET_ROOT}/UI/slot_empty.png`,       // 空槽位
        DIVIDER: `${ASSET_ROOT}/UI/divider.png`,             // 装饰分割线
    },
    
    // 3. 家族建筑
    BUILDINGS: {
        Market: `${ASSET_ROOT}/Buildings/market.png`,
        Library: `${ASSET_ROOT}/Buildings/library.png`,
        AlchemyRoom: `${ASSET_ROOT}/Buildings/alchemy.png`,
        Smithy: `${ASSET_ROOT}/Buildings/smithy.png`,
        CultivationRoom: `${ASSET_ROOT}/Buildings/cultivation.png`,
        XianFu: `${ASSET_ROOT}/Buildings/xianfu.png`,
    },
    
    // 4. 势力与据点
    FACTIONS: {
        LEI_CLAN: `${ASSET_ROOT}/Factions/lei_emblem.png`,
        SECT_DEFAULT: `${ASSET_ROOT}/Factions/sect_generic.png`,
        TOWN_DEFAULT: `${ASSET_ROOT}/Factions/town_generic.png`,
    },

    // 5. 地形图标
    REGIONS: {
        lake: `${ASSET_ROOT}/Regions/lake.png`,
        mountain: `${ASSET_ROOT}/Regions/mountain.png`,
        forest: `${ASSET_ROOT}/Regions/forest.png`,
        city: `${ASSET_ROOT}/Regions/city.png`,
        sect: `${ASSET_ROOT}/Regions/sect.png`,
        ruins: `${ASSET_ROOT}/Regions/ruins.png`,
        cave: `${ASSET_ROOT}/Regions/cave.png`,
        island: `${ASSET_ROOT}/Regions/island.png`,
        mine: `${ASSET_ROOT}/Regions/mine.png`,
        field: `${ASSET_ROOT}/Regions/field.png`,
        mystic: `${ASSET_ROOT}/Regions/mystic_node.png`, 
    }
};

/**
 * 辅助获取函数
 */

export const getRegionImage = (type: string, isMystic: boolean = false): string => {
    if (isMystic) return IMAGE_ASSETS.REGIONS.mystic;
    return (IMAGE_ASSETS.REGIONS as any)[type] || '';
};

export const getBuildingImage = (type: string): string => {
    return (IMAGE_ASSETS.BUILDINGS as any)[type] || '';
};

export const getFactionTierImage = (isSect: boolean, difficulty: number): string => {
    if (isSect) return IMAGE_ASSETS.REGIONS.sect;
    return IMAGE_ASSETS.REGIONS.city;
};
