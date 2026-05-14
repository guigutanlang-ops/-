import { ClanMember, Realm, RootGrade, TaskType, InjuryStatus } from '../types';
import { REALM_ORDER, TASK_INFO } from '../constants';
import { calculateQuarterlyExpGain, getRequiredExp } from '../components/Xiulian/CultivationSystem';

export class CharacterController {
    /**
     * 自动判定并更新灵根等级
     */
    static getAutoRootGrade(roots: ClanMember['roots']): RootGrade {
        const maxRoot = Math.max(roots.gold, roots.wood, roots.water, roots.fire, roots.earth);
        if (maxRoot === 0) return '凡人';
        if (maxRoot <= 2) return '伪灵根';
        if (maxRoot <= 4) return '下品灵根';
        if (maxRoot <= 6) return '中品灵根';
        if (maxRoot <= 8) return '上品灵根';
        return '极品灵根';
    }

    /**
     * 处理修为进度增长，支持跨级升级
     */
    static applyCultivationProgress(member: ClanMember, logs: string[], year: number): ClanMember {
        if (member.realm === Realm.Mortal) return member;

        let nm = { ...member };
        let progress = nm.spiritPower;
        let subRealm = nm.subRealm;
        const realmIdx = REALM_ORDER.indexOf(nm.realm);

        let currentReq = getRequiredExp(realmIdx, subRealm);
        
        // 处理自动连续升级
        while (progress >= currentReq && subRealm < 9) {
            progress -= currentReq;
            subRealm += 1;
            currentReq = getRequiredExp(realmIdx, subRealm);
            logs.push(`【${year}载·晋升】${nm.name} 灵力周天圆满，突破至 ${nm.realm} · ${subRealm}层。`);
        }

        // 处理大圆满瓶颈
        if (subRealm === 9 && progress >= currentReq) {
            progress = currentReq;
            if (member.subRealm < 9 || member.spiritPower < currentReq) {
                logs.push(`【${year}载·瓶颈】${nm.name} 灵力已达当前境界极限，需寻求突破契机。`);
            }
        }

        nm.spiritPower = progress;
        nm.subRealm = subRealm;
        return nm;
    }

    /**
     * 在世族人的回合逻辑处理
     * @param externalMultiplier 可选：来自建筑槽位的特定加成（默认1.0）
     */
    static processTurn(member: ClanMember, year: number, isYearIncrement: boolean, externalMultiplier: number = 1.0): { updatedMember: ClanMember; logs: string[]; travelTriggered?: boolean } {
        let nm = { ...member };
        let turnLogs: string[] = [];

        if (nm.status === InjuryStatus.Dead) return { updatedMember: nm, logs: [] };

        // 1. 寿命增长与伤病情报处理
        if (isYearIncrement) {
            nm.age += 1;
        }

        // 2. 濒死、道基破损扣除最大寿命 (每回合扣除)
        if (nm.status === InjuryStatus.Dying || nm.status === InjuryStatus.FoundationBroken) {
            const loss = 2; // 每次扣2点最大寿命
            nm.maxAge -= loss;
            if (nm.status === InjuryStatus.Dying) {
                nm.maxAgeLost = (nm.maxAgeLost || 0) + loss;
            }
        }

        // 死亡判定
        if (nm.age >= nm.maxAge) {
            nm.status = InjuryStatus.Dead;
            nm.deathYear = year;
            turnLogs.push(`【${year}载】${nm.name} 寿元耗尽，溘然长逝。`);
            return { updatedMember: nm, logs: turnLogs };
        }

        // 3. 伤势康复逻辑
        const randomRecover = Math.random();
        if (nm.status === InjuryStatus.Heavy) {
            nm.assignment = 'Recovery';
            if (randomRecover > 0.8) {
                nm.status = InjuryStatus.Light;
                turnLogs.push(`【${year}载】${nm.name} 伤势有所好转，从重伤转为轻伤。`);
            }
        } else if (nm.status === InjuryStatus.Light) {
            nm.assignment = 'Recovery';
            if (randomRecover > 0.7) {
                nm.status = InjuryStatus.Healthy;
                nm.assignment = 'Idle'; 
                turnLogs.push(`【${year}载】${nm.name} 伤势大见起色，身体已完全康复。`);
            }
        } else if (nm.status === InjuryStatus.Healthy) {
            // Already healthy, do nothing for recovery
        } else {
            // Dying or FoundationBroken: Only recoverable by pills (not here)
            nm.assignment = 'Recovery';
        }

        // 4. 修为增长逻辑
        const hasRoots = Object.values(nm.roots).some(v => v > 0);
        if (hasRoots && nm.realm !== Realm.Mortal) {
            // 首先计算基于当前属性和功法的理论产出
            const potentialGain = calculateQuarterlyExpGain(nm);
            
            // 获取任务相关的效率系数
            const taskMultiplier = TASK_INFO[nm.assignment]?.multiplier ?? 1.0;
            
            // 获取外部环境（如灵脉、建筑）的加成系数
            const environmentalMultiplier = externalMultiplier;

            // 最终获取灵力值 = (理论产出 * 环境加成) * 任务倍率
            const finalGain = (potentialGain * environmentalMultiplier) * taskMultiplier;

            nm.spiritPower += finalGain;
            nm = this.applyCultivationProgress(nm, turnLogs, year);
        } else if (nm.realm === Realm.Mortal) {
            nm.assignment = 'Idle';
        }

        // 4. 游历触发概率
        const travelTriggered = nm.status === InjuryStatus.Healthy && nm.assignment === 'Cultivation' && Math.random() < 0.05;

        return { updatedMember: nm, logs: turnLogs, travelTriggered };
    }

    /**
     * 处理外部手动更新
     */
    static updateMember(member: ClanMember, updates: Partial<ClanMember>, year: number): { updatedMember: ClanMember; logs: string[] } {
        let nm = { ...member, ...updates };
        let logs: string[] = [];

        if (updates.roots) {
            const newGrade = this.getAutoRootGrade(nm.roots);
            if (nm.rootGrade !== newGrade) {
                logs.push(`【${year}载·造化】${nm.name} 灵根升华，晋升为 ${newGrade}。`);
                nm.rootGrade = newGrade;
            }
        }

        if (updates.spiritPower !== undefined) {
            nm = this.applyCultivationProgress(nm, logs, year);
        }

        return { updatedMember: nm, logs };
    }

    /**
     * 执行大境界突破
     */
    static breakthrough(member: ClanMember, success: boolean, year: number, usedPillId?: number): { updatedMember: ClanMember; log: string } {
        let nm = { ...member };
        
        if (usedPillId) {
            const newPills = { ...nm.personalInventory.pills };
            if (newPills[usedPillId] > 0) {
                newPills[usedPillId]--;
                if (newPills[usedPillId] === 0) delete newPills[usedPillId];
            }
            nm.personalInventory = { ...nm.personalInventory, pills: newPills };
        }

        if (success) {
            const currentIdx = REALM_ORDER.indexOf(nm.realm);
            const nextRealm = REALM_ORDER[currentIdx + 1] || Realm.YuanShen;
            return {
                updatedMember: {
                    ...nm,
                    realm: nextRealm,
                    subRealm: 1,
                    spiritPower: 0,
                    maxAge: nm.maxAge + 100,
                    legacyPoints: (nm.legacyPoints || 0) + 10
                },
                log: `【${year}载·突破】${nm.name} 气息贯通天地，成功晋升至 ${nextRealm}。`
            };
        } else {
            return {
                updatedMember: {
                    ...nm,
                    subRealm: 8,
                    spiritPower: 0,
                    status: InjuryStatus.Light,
                    assignment: 'Recovery'
                },
                log: `【${year}载·突破】${nm.name} 叩问天门失败，遭灵力反噬，修为跌落。`
            };
        }
    }
}