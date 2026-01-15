
import { GameState } from "../types";
import { ORACLE_POOL } from "../data/events/oracleData";

export class OracleService {
  /**
   * 根据当前游戏状态，从静态池中抽取最贴切的谕令
   */
  static getYearlyOracle(state: GameState): string {
    // 过滤出符合条件的谕令
    const validOracles = ORACLE_POOL.filter(entry => {
        if (!entry.condition) return true;
        return entry.condition(state);
    });

    // 随机选择一条
    if (validOracles.length === 0) return "岁时有序，万物生长。";
    const randomIndex = Math.floor(Math.random() * validOracles.length);
    return validOracles[randomIndex].text;
  }
}
