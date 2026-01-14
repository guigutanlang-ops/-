
import { Region } from '../types';

export const INITIAL_REGIONS_DATA: Region[] = [
    // --- 望月李氏核心区域 ---
    { 
        id: 'li_clan_home', 
        name: '李氏大宅', 
        description: '望月李氏祖地，老祖李木田在此定居。依山傍湖，风水极佳。', 
        difficulty: 0, owner: '望月李氏', x: 50, y: 75, 
        type: 'city', category: 'Stakeholder', isDiscovered: true, 
        resources: ['凡间赋税', '李氏子弟'],
        controlValue: 100, occupancyStatus: 'secured',
        production: { stones: 100, merit: 5 }
    },
    { 
        id: 'da_li_mountain', 
        name: '大黎山', 
        description: '传言曾有仙人在此悟道，山中偶有灵药诞生。', 
        difficulty: 4, owner: '无', x: 50, y: 92, 
        type: 'mountain', category: 'Natural', isDiscovered: true, 
        resources: ['赤脉藤', '白石髓', '野生灵药'],
        controlValue: 0, occupancyStatus: 'idle',
        production: { items: { 1304: 3, 1305: 2, 1301: 5 } } // 赤脉藤, 白石髓, 清灵花
    },
    { 
        id: 'wangyue_lake_abyss', 
        name: '望月湖底', 
        description: '幽深莫测的湖底，水气浓郁。常有水灵精粹生成。', 
        difficulty: 11, owner: '无', x: 50, y: 55,
        type: 'lake', category: 'Natural', isDiscovered: true, 
        resources: ['水精髓', '深海灵珠'],
        controlValue: 0, occupancyStatus: 'idle',
        production: { items: { 1303: 4, 1404: 1 } } // 玉露根, 云英石
    },
    { 
        id: 'wangyue_lingfield', 
        name: '湖畔灵田', 
        description: '李家经营多年的上好灵田，位于湖岸一侧，土地肥沃。', 
        difficulty: 1, owner: '望月李氏', x: 65, y: 80, 
        type: 'field', category: 'Resource', isDiscovered: true, 
        resources: ['灵谷草', '清灵花'],
        controlValue: 100, occupancyStatus: 'secured',
        production: { items: { 1300: 10, 1301: 2 } }
    },
    { 
        id: 'iron_mine_vein', 
        name: '精铁矿脉', 
        description: '山脉深处的一处露天矿脉，虽然矿石品质寻常，但胜在量大。', 
        difficulty: 3, owner: '无', x: 35, y: 60, 
        type: 'mine', category: 'Resource', isDiscovered: true, 
        resources: ['精铁', '玄金石'],
        controlValue: 0, occupancyStatus: 'idle',
        production: { items: { 1400: 5 } }
    },

    // --- 邵家势力范围 (练气家族) ---
    { 
        id: 'shao_clan_manor', 
        name: '邵家庄', 
        description: '望月湖周边的练气大家族，与李家积怨已久。', 
        difficulty: 9, owner: '邵家', x: 20, y: 85, 
        type: 'city', category: 'Stakeholder', isDiscovered: true, 
        resources: ['邵家密辛'],
        controlValue: 0, occupancyStatus: 'secured'
    },
    { 
        id: 'copper_vein_shao', 
        name: '赤铜精矿', 
        description: '原本属于望月湖公有资源，现被邵家强行占据。', 
        difficulty: 7, owner: '邵家', x: 15, y: 75, 
        type: 'mine', category: 'Resource', isDiscovered: true, 
        resources: ['赤铜精', '火纹草'],
        controlValue: 0, occupancyStatus: 'secured',
        production: { items: { 1401: 3 } }
    },

    // --- 魏家势力范围 (筑基家族) ---
    { 
        id: 'wei_clan_valley', 
        name: '魏家谷', 
        description: '魏家领地，以阵法闻名，族中有筑基修士坐镇。', 
        difficulty: 15, owner: '魏家', x: 20, y: 35, 
        type: 'cave', category: 'Stakeholder', isDiscovered: false, 
        resources: ['阵盘', '灵墨'],
        controlValue: 0, occupancyStatus: 'secured'
    },

    // --- 远方势力与秘境 ---
    { 
        id: 'beihan_sect_main', 
        name: '北寒宗', 
        description: '北方巨头，掌控万载冰原，门内有化神期老祖坐镇。', 
        difficulty: 50, owner: '北寒宗', x: 50, y: 10, 
        type: 'sect', category: 'Stakeholder', isDiscovered: false, 
        resources: ['寒铁', '玄冰髓'],
        controlValue: 0, occupancyStatus: 'secured'
    },
    { 
        id: 'mystic_cave_01', 
        name: '紫云洞府', 
        description: '近期突然现世的上古洞府，紫气氤氲，内部危险重重。', 
        difficulty: 35, owner: '无', x: 85, y: 40, 
        type: 'cave', category: 'Mystic', isDiscovered: false, 
        resources: ['古法宝', '传承丹药'],
        controlValue: 0, occupancyStatus: 'idle',
        production: { items: { 1206: 1, 1306: 3, 1106: 1 } } // 化神丹, 紫罗花, 紫薇软剑 (示例)
    }
];
