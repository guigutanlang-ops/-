
import { Realm } from '../types';

export const PILLS = [
  {
    "id": 1200, 
    "name": "止血散", 
    "desc": "由多种活血灵草经文火淬炼而成的细密粉末，色泽微红。敷于伤处能迅速止血化瘀，是李家子弟外出巡逻、入山采药的必备随身之物。", 
    "grade": 1,
    "effect": "恢复轻微伤势",
    "effects": { "status": "healthy" }
  },
  {
    "id": 1201, 
    "name": "补气丸", 
    "desc": "丹身浑圆，隐有草木芳香。此丹旨在温养亏损，对过度消耗法力导致的根基虚浮有极佳的补益之效，传闻久服亦能润泽五脏，延年益寿。", 
    "grade": 1,
    "effect": "小幅增加寿元",
    "effects": { "maxAge": 1 }
  },
  {
    "id": 1202, 
    "name": "凝气丹", 
    "desc": "练气修士精进修为的资粮。丹内锁有一团纯净的灵雾，吞服后可省却数月打坐吐纳之功，乃是望月湖各大家族争相囤积的战略物资。", 
    "grade": 1,
    "requiredRealm": Realm.QiRefinement,
    "effect": "略微增加修为",
    "effects": { "cultivationProgress": 80 }
  },
  {
    "id": 1203, 
    "name": "通脉丹", 
    "desc": "药性如激流冲刷，非意志坚定者不可轻试。此丹通过外力强行扩张经络容积，使得法力流转之速倍增，自此修行之路事半功倍。", 
    "grade": 4,
    "requiredRealm": Realm.FoundationEstablishment,
    "effect": "资质 +1 , 小幅增加修为",
    "effects": { "aptitude": 1 ,"cultivationProgress": 500}
  },
  {
    "id": 1204, 
    "name": "筑基丹", 
    "desc": "仙凡有别之锁钥。丹纹流转间似有大道真义，其效在于护持修士法力气旋不散，辅助其在关头凝聚道基，实现脱胎换骨之变。", 
    "grade": 3,
    "requiredRealm": Realm.FoundationEstablishment,
    "effect": "突破概率小幅提升",
    "effects": { "breakthroughBonus": 15 }
  },
  {
    "id": 1205, 
    "name": "降尘丹", 
    "desc": "洗去识海垢尘，斩断凡俗杂念。服之可感六感敏锐，万物律动清晰可见，原本晦涩的功法关隘往往在此丹药力下迎刃而解。", 
    "grade": 4,
    "requiredRealm": Realm.FoundationEstablishment,
    "effect": "悟性 +2（永久）",
    "effects": { "comprehension": 2 }
  },
  {
    "id": 1206, 
    "name": "化神丹", 
    "desc": "紫府修士亦视若珍宝。此丹凝聚地脉神识精粹，吞服后可于冥冥中勾勒阴神本源，使神识探查范围与洞察力大幅跃升。", 
    "grade": 6,
    "requiredRealm": Realm.Zifu,
    "effect": "神识 +10，突破概率小幅提升",
    "effects": { "divineSense": 10 ,"breakthroughBonus": 20 }
  },
  {
    "id": 1207, 
    "name": "九转金丹", 
    "desc": "历经九重雷劫淬炼的紫金仙丹。丹成之时百里之内皆有异象，蕴含的生机法力厚重如海，服一颗可抵凡夫俗子百载苦修。", 
    "grade": 8,
    "requiredRealm": Realm.JinDan,
    "effect": "突破成功率提升 50%",
    "effects": { "breakthroughBonus": 50 }
  },
  {
    "id": 1208, 
    "name": "涅槃丹", 
    "desc": "取不死鸟神火余温炼制，乃李氏压箱底的绝品灵丹。即便神魂将散，肉身崩毁，亦能从中夺取一线造化，助其原地破茧，转死为生。", 
    "grade": 9,
    "effect": "全面恢复，寿元 +50 载",
    "effects": { "status": "healthy", "maxAge": 50 }
  },
  {
    "id": 1209, 
    "name": "回春丹", 
    "desc": "一品疗伤圣药，针对练气期修士的外伤有奇效，药力温和，不留隐患。", 
    "grade": 1,
    "effect": "恢复练气期轻微伤势",
    "effects": { "status": "healthy" }
  }
];
