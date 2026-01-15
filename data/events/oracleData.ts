
export interface OracleEntry {
    text: string;
    condition?: (state: any) => boolean;
}

export const ORACLE_POOL: OracleEntry[] = [
    // 通用类
    { text: "岁时轮转，望月湖畔潮起潮落。李氏根基当如磐石，方能在此大世站稳脚跟。" },
    { text: "仙路漫漫，唯勤勉与机缘并重。后辈需戒骄戒躁，切莫贪功冒进，自误前程。" },
    { text: "镜照虚空，察家族气运隐有波动。宜守成以待变，广积粮，慢称王。" },
    { text: "太平历下，李家血脉生生不息。望尔等谨记‘德’字，莫要欺师灭祖，坏了门户。" },
    { text: "金鳞岂是池中物，一遇风云便化龙。望月湖虽小，亦能养出翻天蛟龙。" },

    // 财富类
    { 
        text: "族中灵石充盈，当思反哺。不论是营造法阵还是选拔族人，皆需舍得下本钱。",
        condition: (s) => s.spiritStones > 8000 
    },
    { 
        text: "库府空虚，此乃衰败之象！老祖我心中甚是不安，后辈当开源节流，共克时艰。",
        condition: (s) => s.spiritStones < 500 
    },

    // 实力类
    { 
        text: "族中已有后辈触碰筑基门槛，甚慰。此乃李家崛起之基，全族当倾力护持。",
        condition: (s) => s.members.some((m: any) => m.realm === '筑基' && m.family === '望月李氏')
    },
    { 
        text: "凡胎俗骨者众，修行之才寡。老祖我照破虚妄，李家急需引入新鲜血脉啊。",
        condition: (s) => s.members.filter((m: any) => m.family === '望月李氏' && m.realm === '凡人').length > 5
    },

    // 功德类
    { 
        text: "李家功德积攒不易，此乃老祖我赐予尔等的最后一线生机。莫要随意挥霍。",
        condition: (s) => s.merit > 500 
    }
];
