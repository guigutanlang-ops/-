
import { Realm, InjuryStatus } from '../types';

export const PILLS = [
  {
    "id": 30100, 
    "name": "止血散", 
    "desc": "由多种活血灵草经文火淬炼而成的细密粉末，色泽微红。敷于伤处能迅速止血化瘀，是李家子弟外出巡逻、入山采药的必备随身之物。", 
    "grade": 1,
    "effect": "恢复轻微伤势",
    "effects": { "status": InjuryStatus.Healthy }
  },
  {
    "id": 30301, 
    "name": "补气丸", 
    "desc": "丹身浑圆，隐有草木芳香。此丹旨在温养亏损，对过度消耗法力导致的根基虚浮有极佳的补益之效，传闻久服亦能润泽五脏，延年益寿。", 
    "grade": 3,
    "effect": "小幅增加寿元",
    "effects": { "maxAge": 1 }
  },
  {
    "id": 30102, 
    "name": "凝气丹", 
    "desc": "练气修士精进修为的资粮。丹内锁有一团纯净的灵雾，吞服后可省却数月打坐吐纳之功，乃是望月湖各大家族争相囤积的战略物资。", 
    "grade": 1,
    "requiredRealm": Realm.QiRefinement,
    "effect": "略微增加修为",
    "effects": { "spiritPower": 100 }
  },
  {
    "id": 30300, 
    "name": "养元散", 
    "desc": "温养经脉，恢复气血，适合初入修行者调理根基。其药力顺滑，即便凡人误服也能强身健体。", 
    "grade": 0,
    "effect": "恢复轻度伤势",
    "effects": { "status": InjuryStatus.Healthy }
  },
  {
    "id": 30400, 
    "name": "回气丸", 
    "desc": "短时间内回复灵力，常备于外出历练之时。是底层散修最常用的回复丹药。", 
    "grade": 1,
    "requiredRealm": Realm.QiRefinement,
    "effect": "回复少量灵力",
    "effects": { "spiritPower": 50 }
  },
  {
    "id": 30401, 
    "name": "健体丹", 
    "desc": "强筋健骨，改善凡人体魄，为踏入修行打下基础。", 
    "grade": 0,
    "effect": "体质略微提升",
    "effects": { "aptitude": 1 }
  },
  {
    "id": 30600, 
    "name": "清心丸", 
    "desc": "安神定志，减少修炼时心浮气躁的风险。对于突破瓶颈有微弱的辅助作用。", 
    "grade": 1,
    "effect": "减少走火入魔几率",
    "effects": { "comprehension": 1 }
  },
  {
    "id": 30201, 
    "name": "培元丹", 
    "desc": "用于稳固修炼根基的二品丹药。能极大程度弥补强行破境留下的虚弱。", 
    "grade": 2,
    "requiredRealm": Realm.QiRefinement,
    "effect": "大幅增加修为",
    "effects": { "spiritPower": 500 }
  },
  {
    "id": 30800, 
    "name": "九转金丹", 
    "desc": "历经九重雷劫淬炼的紫金仙丹。丹成之时百里之内皆有异象，蕴含的生机法力厚重如海，服一颗可抵凡夫俗子百载苦修。", 
    "grade": 8,
    "requiredRealm": Realm.JinDan,
    "effect": "突破成功率提升 50%",
    "effects": { "breakthroughBonus": 50 }
  },
  {
    "id": 30200, 
    "name": "破镜丹", 
    "desc": "专门为突破小境界瓶颈而研制的丹药。通过瞬间爆发法力冲击关隘，可提升突破概率，但平日里并无任何温养之功。", 
    "grade": 2,
    "effect": "突破概率提升 10%",
    "effects": { "breakthroughBonus": 10 }
  },
  {
    "id": 30202, 
    "name": "筑基丹", 
    "desc": "练气圆满修士突破筑基期的至宝。大名鼎鼎的筑基丹，能护住经脉，引导狂暴的灵力液化成真元，大幅提升凝聚道基的成功几率。", 
    "grade": 3,
    "effect": "突破筑基成功率提升 20%",
    "effects": { "breakthroughBonus": 20, "targetRealm": Realm.FoundationEstablishment }
  },
  {
    "id": 30900, 
    "name": "涅槃丹", 
    "desc": "取不死鸟神火余温炼制，乃李氏压箱底的绝品灵丹。即便神魂将散，肉身崩毁，亦能从中夺取一线造化，助其原地破茧，转死为生。", 
    "grade": 9,
    "effect": "全面恢复，寿元 +50 载",
    "effects": { "status": InjuryStatus.Healthy, "maxAge": 50 }
  },
  {
    "id": 30103, 
    "name": "回春丹", 
    "desc": "一品疗伤圣药，针对练气期修士的外伤有奇效，药力温和，不留隐患。", 
    "grade": 1,
    "effect": "恢复练气期轻微伤势",
    "effects": { "status": InjuryStatus.Healthy }
  }
];
