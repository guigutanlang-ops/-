import { ClanMember, Realm, RootGrade, TaskType } from '../types';
import { REALM_ORDER } from '../constants';
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
        let progress = nm.cultivationProgress;
        let subRealm = nm.subRealm;
        const realmIdx = REALM_ORDER.indexOf(nm.realm);

        let currentReq = getRequiredExp(realmIdx, subRealm);
        
        // 处理自动连续升级
        while (progress >= currentReq && subRealm < 9) {
            progress -= currentReq;
            subRealm += 1;
            currentReq = getRequiredExp(realmIdx, subRealm);
            logs.push(`【${year}载·晋升】${nm.name} 气息升华，实时突破至 ${nm.realm} ${subRealm}层。`);
        }

        // 处理大圆满瓶颈
        if (subRealm === 9 && progress >= currentReq) {
            progress = currentReq;
            if (member.subRealm < 9 || member.cultivationProgress < currentReq) {
                logs.push(`【${year}载·瓶颈】${nm.name} 触碰天门，已达 ${nm.realm}巅峰之境。`);
            }
        }

        nm.cultivationProgress = progress;
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

        if (nm.status === 'dead') return { updatedMember: nm, logs: [] };

        // 1. 寿命增长
        if (isYearIncrement) {
            nm.age += 1;
            if (nm.age >= nm.maxAge) {
                nm.status = 'dead';
                nm.deathYear = year;
                turnLogs.push(`【${year}载·春】${nm.name} 寿元耗尽，溘然长逝。`);
                return { updatedMember: nm, logs: turnLogs };
            }
        }

        // 2. 伤势康复逻辑
        if (nm.status === 'injured') {
            nm.assignment = 'Recovery';
            if (Math.random() > 0.4) {
                nm.status = 'healthy';
                nm.assignment = 'Idle'; 
                turnLogs.push(`【${year}载】${nm.name} 伤势痊愈，重回家族待命。`);
            }
        }

        // 3. 修为增长逻辑
        const hasRoots = Object.values(nm.roots).some(v => v > 0);
        if (hasRoots && nm.realm !== Realm.Mortal) {
            const baseGain = calculateQuarterlyExpGain(nm);
            let taskMultiplier = 0.1;

            switch (nm.assignment) {
                case 'Cultivation': taskMultiplier = 1.0; break;
                case 'Research':
                case 'Alchemy':
                case 'Smithing': taskMultiplier = 0.6; break;
                case 'Mission': taskMultiplier = 0.4; break;
                case 'Recovery': taskMultiplier = 0.2; break;
                case 'Travel':
                case 'Idle': taskMultiplier = 0.1; break;
                default: taskMultiplier = 0.1;
            }

            // 应用任务基础倍率 * 槽位特定倍率
            nm.cultivationProgress += baseGain * taskMultiplier * externalMultiplier;
            nm = this.applyCultivationProgress(nm, turnLogs, year);
        } else if (nm.realm === Realm.Mortal) {
            nm.assignment = 'Idle';
        }

        // 4. 游历触发概率
        const travelTriggered = nm.status === 'healthy' && nm.assignment === 'Cultivation' && Math.random() < 0.05;

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

        if (updates.cultivationProgress !== undefined) {
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
                    cultivationProgress: 0,
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
                    cultivationProgress: 0,
                    status: 'injured',
                    assignment: 'Recovery'
                },
                log: `【${year}载·突破】${nm.name} 叩问天门失败，遭灵力反噬，修为跌落。`
            };
        }
    }
}