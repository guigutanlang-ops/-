import { Region } from '../types';

export const INITIAL_REGIONS_DATA: Region[] = [
    // --- 中央：望月湖 (不可占领核心区) ---
    { 
        id: 'wangyue_lake_center', 
        name: '望月湖心', 
        description: '大湖中心，灵气吞吐不定，不可占领。', 
        difficulty: 99, owner: '无', x: 50, y: 50, 
        type: 'island', category: 'Natural', isDiscovered: true, 
        resources: ['白露花', '太阴精'],
        controlValue: 0, occupancyStatus: 'idle',
        production: { items: { 1306: 5 } }
    },
    { 
        id: 'wangyue_lake_abyss', 
        name: '望月湖底', 
        description: '幽深莫测的湖底，隐藏着上古水脉。', 
        difficulty: 30, owner: '无', x: 45, y: 55,
        type: 'lake', category: 'Natural', isDiscovered: true, 
        resources: ['水精髓'],
        production: { items: { 1303: 4 } }
    },

    // --- 南岸：望月李氏 ---
    { 
        id: 'li_clan_home', 
        name: '李氏大宅', 
        description: '望月湖南岸祖地。依山而建，俯瞰大湖。', 
        difficulty: 0, owner: '望月李氏', x: 50, y: 85, 
        type: 'city', category: 'Stakeholder', isDiscovered: true, 
        resources: ['凡间赋税', '李氏子弟'],
        controlValue: 100, occupancyStatus: 'secured',
        production: { stones: 100, merit: 5 }
    },
    { 
        id: 'wangyue_lingfield', 
        name: '南岸灵田', 
        description: '李家辛苦开辟的灵田，靠近湖边。', 
        difficulty: 1, owner: '望月李氏', x: 58, y: 88, 
        type: 'field', category: 'Resource', isDiscovered: true, 
        resources: ['灵谷草', '清灵花'],
        controlValue: 100, occupancyStatus: 'secured',
        production: { items: { 1300: 10, 1301: 2 } }
    },
    { 
        id: 'da_li_mountain', 
        name: '大黎山', 
        description: '南岸屏障，山中多妖兽，灵材丰富。', 
        difficulty: 4, owner: '无', x: 40, y: 92, 
        type: 'mountain', category: 'Natural', isDiscovered: true, 
        resources: ['赤脉藤', '白石髓'],
        production: { items: { 1311: 3, 1312: 2 } }
    },
    { 
        id: 'abandoned_iron_mine', 
        name: '南岸废矿', 
        description: '南岸边缘的一处微型矿脉。', 
        difficulty: 2, owner: '无', x: 45, y: 80, 
        type: 'mine', category: 'Resource', isDiscovered: true, 
        resources: ['精铁'],
        production: { items: { 1400: 3 } }
    },

    // --- 西岸：邵家、魏家 ---
    { 
        id: 'shao_clan_manor', 
        name: '邵家山庄', 
        description: '西岸铁矿豪强，地势险要。', 
        difficulty: 9, owner: '邵家', x: 15, y: 65, 
        type: 'city', category: 'Stakeholder', isDiscovered: true, 
        resources: ['精铁'],
        controlValue: 100, occupancyStatus: 'secured'
    },
    { 
        id: 'iron_mine_shao', 
        name: '西岸铁矿', 
        description: '邵家核心产业，常年烟火弥漫。', 
        difficulty: 6, owner: '邵家', x: 10, y: 72, 
        type: 'mine', category: 'Resource', isDiscovered: true, 
        resources: ['精铁', '玄铁母'],
        controlValue: 100, occupancyStatus: 'secured',
        production: { items: { 1400: 8, 1403: 1 } }
    },
    { 
        id: 'wei_clan_valley', 
        name: '魏家阵谷', 
        description: '西岸西北方，隐于幻阵之中的山谷。', 
        difficulty: 15, owner: '魏家', x: 15, y: 35, 
        type: 'cave', category: 'Stakeholder', isDiscovered: true, 
        resources: ['阵盘'],
        controlValue: 100, occupancyStatus: 'secured'
    },
    { 
        id: 'dragon_ruins', 
        name: '坠龙滩', 
        description: '西岸最边缘的荒凉河滩。', 
        difficulty: 30, owner: '无', x: 5, y: 50, 
        type: 'ruins', category: 'Mystic', isDiscovered: true, 
        resources: ['龙血藤'],
        production: { items: { 1344: 1 } }
    },

    // --- 东岸：齐家、天一剑宗、离火门 ---
    { 
        id: 'qi_clan_town', 
        name: '齐云古镇', 
        description: '东岸枢纽，百货辐辏。', 
        difficulty: 18, owner: '齐家', x: 82, y: 50, 
        type: 'city', category: 'Stakeholder', isDiscovered: true, 
        resources: ['灵石'],
        controlValue: 100, occupancyStatus: 'secured'
    },
    { 
        id: 'tianyi_sword_peak', 
        name: '天一剑峰', 
        description: '东岸极地，剑气凌空。', 
        difficulty: 40, owner: '天一剑宗', x: 88, y: 25, 
        type: 'sect', category: 'Stakeholder', isDiscovered: true, 
        resources: ['庚金剑气'],
        controlValue: 100, occupancyStatus: 'secured'
    },
    { 
        id: 'lihuo_volcano', 
        name: '离火赤城', 
        description: '东岸东南，地火旺盛之城。', 
        difficulty: 38, owner: '离火门', x: 85, y: 75, 
        type: 'city', category: 'Stakeholder', isDiscovered: true, 
        resources: ['赤铜精'],
        controlValue: 100, occupancyStatus: 'secured'
    },
    { 
        id: 'mystic_cave_01', 
        name: '紫云洞府', 
        description: '东岸隐秘的仙人居所。', 
        difficulty: 35, owner: '无', x: 92, y: 45, 
        type: 'cave', category: 'Mystic', isDiscovered: false, 
        resources: ['古法宝'],
        production: { items: { 1206: 1 } }
    },

    // --- 北岸：北寒宗 ---
    { 
        id: 'beihan_sect_main', 
        name: '北寒圣山', 
        description: '北岸统治者，冰封万里。', 
        difficulty: 50, owner: '北寒宗', x: 50, y: 15, 
        type: 'sect', category: 'Stakeholder', isDiscovered: true, 
        resources: ['玄冰髓'],
        controlValue: 100, occupancyStatus: 'secured'
    },
    { 
        id: 'ice_sea_ruins', 
        name: '冰海遗迹', 
        description: '北岸极北冰洋。', 
        difficulty: 45, owner: '北寒宗', x: 55, y: 5, 
        type: 'ruins', category: 'Mystic', isDiscovered: true, 
        resources: ['寒魄花']
    },
];