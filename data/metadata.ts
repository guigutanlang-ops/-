
import { Realm } from '../types';

/**
 * 辈分对字配置：[男, 女]
 * 0: 二世 (黎泾代) - 特殊处理
 * 1: 三世 (玄景代)
 * 2: 四世 (渊清代)
 * 3: 五世 (曦月代)
 * 4: 六世 (承明代)
 * 5: 七世 (周行代)
 * 6: 八世 (绛阙代)
 */
export const GENERATION_PAIRS: Record<number, [string, string]> = {
    1: ['玄', '景'],
    2: ['渊', '清'],
    3: ['曦', '月'],
    4: ['承', '明'],
    5: ['周', '行'],
    6: ['绛', '阙']
};

export const FAMILIES_DATA = ['望月李氏', '魏家', '邵家'];
export const SECTS_DATA = ['无', '北寒宗', '天一剑宗', '离火门'];
export const SURNAMES_DATA = ['李'];
export const REALM_ORDER_DATA = [
    Realm.Mortal,
    Realm.QiRefinement, 
    Realm.FoundationEstablishment, 
    Realm.Zifu, 
    Realm.JinDan, 
    Realm.YuanYing, 
    Realm.YuanShen
];

export const POSITIONS_DATA = ['家主', '长老', '执事', '弟子'];
