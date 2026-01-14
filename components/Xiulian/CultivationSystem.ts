
import { Realm, ClanMember, Element } from '../../types';
import { REALM_ORDER, CULTIVATION_METHODS } from '../../constants';

/**
 * 修炼系统配置与公式实现
 * 
 * 1、每一大境界内升级经验：ΔEXP(m, n) = BaseEXP(m) × r^(n-1)
 *    m：境界序号 (练气=1, 筑基=2...)
 *    n：层级 (1 -> 2 为 n=1)
 *    r：境界内指数 (1.25)
 * 
 * 2、每一境界的首层基础经验：
 *    BaseEXP(m) = BaseEXP(m-1) × r^8 × C
 *    C：跨境界系数 (1.3)
 *    强限制：BaseEXP(练气) = 100
 */

const R_FACTOR = 1.25;
const C_FACTOR = 1.3;
const QI_BASE_EXP = 100;

/**
 * 获取大境界的基础经验值 BaseEXP(m)
 */
export const getBaseExpForRealm = (realmIndex: number): number => {
    if (realmIndex < 1) return 0; // 凡人
    if (realmIndex === 1) return QI_BASE_EXP; // 练气
    
    // BaseEXP(m) = BaseEXP(1) * (r^8 * C)^(m-1)
    const realmJumpMultiplier = Math.pow(R_FACTOR, 8) * C_FACTOR;
    return QI_BASE_EXP * Math.pow(realmJumpMultiplier, realmIndex - 1);
};

/**
 * 获取当前层级升到下一级所需的绝对经验值 ΔEXP(m, n)
 * @param realmIndex 境界序号 (练气=1)
 * @param subRealm 当前层级 (1-9)
 */
export const getRequiredExp = (realmIndex: number, subRealm: number): number => {
    if (realmIndex < 1) return 100; // 凡人引气入体需求
    if (subRealm >= 9) return getBaseExpForRealm(realmIndex) * Math.pow(R_FACTOR, 8); // 9层满经验即为瓶颈
    
    const baseExp = getBaseExpForRealm(realmIndex);
    // ΔEXP(m, n) = BaseEXP(m) * r^(n-1)
    return baseExp * Math.pow(R_FACTOR, subRealm - 1);
};

/**
 * 计算成员每回合（每季度）的修行产出
 * 
 * 公式遵循：
 * 1、baseGain(m) = 1.75 × [ ΔEXP(m,1) ]^0.6
 * 2、实际经验 = baseGain(m) × 灵根倍率 × 资质修正 × (1 + 功法修正)
 */
export const calculateQuarterlyExpGain = (member: ClanMember): number => {
    const realmIdx = REALM_ORDER.indexOf(member.realm);
    if (realmIdx < 1) return 0; // 凡人暂无修为产出

    // 1. 获取该境界 1->2 的经验需求 ΔEXP(m, 1)
    const deltaExpM1 = getRequiredExp(realmIdx, 1);
    
    // 2. 计算基础产出点数 baseGain(m) = 1.75 * [ ΔEXP(m,1) ]^0.6
    const baseGain = 1.75 * Math.pow(deltaExpM1, 0.6);

    // 3. 确定灵根倍率 (rootMultiplier)
    // 逻辑：0.6 + 0.1 * (灵根值 - 1)
    let rootValue = 0;
    const mainMethod = CULTIVATION_METHODS.find(m => m.id === member.mainMethodId);

    const elementMap: Record<string, keyof typeof member.roots> = {
        [Element.Gold]: 'gold',
        [Element.Wood]: 'wood',
        [Element.Water]: 'water',
        [Element.Fire]: 'fire',
        [Element.Earth]: 'earth'
    };

    const methodElement = mainMethod?.element;
    const mappedKey = (methodElement && methodElement !== '无') ? elementMap[methodElement] : undefined;

    if (mappedKey && member.roots[mappedKey] !== undefined) {
        // 如果功法有属性且对应灵根存在
        rootValue = member.roots[mappedKey];
    } else {
        // 若无功法、功法无属性('无')或属性不在映射表中，使用灵根最大值
        rootValue = Math.max(
            member.roots.gold,
            member.roots.wood,
            member.roots.water,
            member.roots.fire,
            member.roots.earth
        );
    }

    const rootMultiplier = rootValue > 0 ? (0.6 + 0.1 * (rootValue - 1)) : 0.5;

    // 4. 资质修正 (aptitudeFactor)
    // 公式：1 + aptitude / (aptitude + 150)
    const aptitudeFactor = 1 + (member.aptitude / (member.aptitude + 150));

    // 5. 功法修正 (methodBonus)
    let methodBonus = 0;
    if (mainMethod && mainMethod.buffs.cultivationSpeed) {
        methodBonus = mainMethod.buffs.cultivationSpeed / 100;
    }

    // 最终计算每季度产生的修为点
    // 实际经验 = baseGain(m) * 灵根倍率 * 资质修正 * (1 + 功法修正)
    const actualExp = baseGain * rootMultiplier * aptitudeFactor * (1 + methodBonus);
    
    return actualExp;
};
