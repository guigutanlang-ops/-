
import { TaskType, DevelopmentPlan } from '../types';

export const TASK_INFO_DATA: Record<TaskType, { label: string; color: string; desc: string; multiplier: number }> = {
    Cultivation: { label: '闭关修炼', color: 'text-blue-200', desc: '提升修为进度', multiplier: 1.0 },
    Research: { label: '研习典籍', color: 'text-purple-400', desc: '增加家族底蕴', multiplier: 0.6 },
    Alchemy: { label: '炼制丹药', color: 'text-pink-400', desc: '在炼丹室开炉炼丹', multiplier: 0.6 },
    Smithing: { label: '炼制法器', color: 'text-cyan-400', desc: '在炼器坊打铁炼器', multiplier: 0.6 },
    Recovery: { label: '修养生息', color: 'text-red-400', desc: '静养伤势，恢复元气', multiplier: 0.2 },
    Mission: { label: '外出派遣', color: 'text-orange-400', desc: '正在执行家族领地任务', multiplier: 0.4 },
    Travel: { label: '外出游历', color: 'text-amber-500', desc: '行走大川，寻觅机缘', multiplier: 0.1 },
    Idle: { label: '无', color: 'text-gray-400', desc: '暂无特定事务', multiplier: 0 }
};

export const DEVELOPMENT_PLANS_DATA: Record<DevelopmentPlan, { label: string; desc: string }> = {
    Combat: { label: '战修之道', desc: '侧重斗法。' },
    Alchemy: { label: '丹鼎之道', desc: '侧重炼丹。' },
    Smithing: { label: '百器之道', desc: '侧重炼器。' },
    Talisman: { label: '符箓之道', desc: '侧重画符。' },
    Balanced: { label: '中庸平衡', desc: '平稳增长。' }
};
