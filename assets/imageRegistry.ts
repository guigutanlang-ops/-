/**
 * 游戏视觉资产注册表
 * 集中管理地图背景、UI框架、建筑物、地形图标以及势力图标
 */

export const IMAGE_ASSETS = {
    // 地图基础层
    MAP: {
        PAPER_TEXTURE: 'https://www.transparenttextures.com/patterns/aged-paper.png',
        MOUNTAIN_MASK: '/assets/images/map/mountain_height.png', // 山体高度图/遮罩
        VEIN_GLOW: '/assets/images/map/vein_glow.png',         // 灵脉发光纹理
        MIST_TILE: 'https://www.transparenttextures.com/patterns/asfalt-dark.png', // 云雾纹理
    },

    // 势力晕染 (水墨扩散效果)
    TERRITORY: {
        INK_BLOB: '/assets/images/map/ink_diffusion.png',
        GLOW_AURA: '/assets/images/map/spiritual_field.png',
    },

    // UI 通用装饰
    UI: {
        PARCHMENT_BG: 'https://www.transparenttextures.com/patterns/parchment.png', 
        FRAME_GOLD: '/assets/images/ui/frame_gold.png',
        INK_SPLAT: '/assets/images/ui/ink_splat.png',
    },
    
    // 建筑图标
    BUILDINGS: {
        Market: 'https://api.iconify.design/game-icons:pagoda.svg?color=%23C9A063',
        Library: 'https://api.iconify.design/game-icons:scroll-unfurled.svg?color=%23C9A063',
        AlchemyRoom: 'https://api.iconify.design/game-icons:cauldron.svg?color=%23C9A063',
        Smithy: 'https://api.iconify.design/game-icons:anvil-impact.svg?color=%23C9A063',
        CultivationRoom: 'https://api.iconify.design/game-icons:meditation.svg?color=%23C9A063',
        XianFu: 'https://api.iconify.design/game-icons:castle.svg?color=%23C9A063',
    },
    
    // 势力/组织图标
    FACTIONS: {
        CLAN: {
            LV1: 'https://api.iconify.design/game-icons:village.svg?color=%234D7C6B',
            LV2: 'https://api.iconify.design/game-icons:fortress.svg?color=%234D7C6B',
            LV3: 'https://api.iconify.design/game-icons:palace.svg?color=%23C9A063',
        },
        SECT: {
            LV1: 'https://api.iconify.design/game-icons:mountain-cave.svg?color=%234D7C6B',
            LV2: 'https://api.iconify.design/game-icons:temple-gate.svg?color=%234D7C6B',
            LV3: 'https://api.iconify.design/game-icons:floating-platforms.svg?color=%23C9A063',
        }
    },

    // 地形图标 (Region Marker)
    REGIONS: {
        lake: 'https://api.iconify.design/game-icons:lake.svg?color=%234D7C6B',
        mountain: 'https://api.iconify.design/game-icons:mountain-range.svg?color=%234D7C6B',
        forest: 'https://api.iconify.design/game-icons:forest.svg?color=%234D7C6B',
        city: 'https://api.iconify.design/game-icons:pagoda.svg?color=%23C9A063',
        sect: 'https://api.iconify.design/game-icons:temple-gate.svg?color=%23C9A063',
        ruins: 'https://api.iconify.design/game-icons:stone-stack.svg?color=%235F6B66',
        cave: 'https://api.iconify.design/game-icons:cave-entrance.svg?color=%234D7C6B',
        island: 'https://api.iconify.design/game-icons:island.svg?color=%234D7C6B',
        desert: 'https://api.iconify.design/game-icons:dunes.svg?color=%23C9A063',
        mine: 'https://api.iconify.design/game-icons:crystals.svg?color=%234D7C6B',
        field: 'https://api.iconify.design/game-icons:sprouts.svg?color=%234D7C6B',
        mystic: 'https://api.iconify.design/game-icons:vortex.svg?color=%23A855F7', 
    }
};

export const getBuildingImage = (type: string): string => (IMAGE_ASSETS.BUILDINGS as any)[type] || '';
export const getFactionTierImage = (isSect: boolean, difficulty: number): string => {
    const cat = isSect ? IMAGE_ASSETS.FACTIONS.SECT : IMAGE_ASSETS.FACTIONS.CLAN;
    if (difficulty < 10) return cat.LV1;
    if (difficulty < 30) return cat.LV2;
    return cat.LV3;
};
export const getRegionImage = (type: string, isMystic: boolean = false): string => {
    if (isMystic) return IMAGE_ASSETS.REGIONS.mystic;
    return (IMAGE_ASSETS.REGIONS as any)[type] || '';
};