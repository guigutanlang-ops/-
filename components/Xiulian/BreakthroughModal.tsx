
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClanMember, Realm } from '../../types';
import { REALM_ORDER, PILL_DETAILS } from '../../constants';

interface Props {
    member: ClanMember;
    onClose: () => void;
    onAttempt: (success: boolean, usedPillId?: number) => void;
}

const BreakthroughModal: React.FC<Props> = ({ member, onClose, onAttempt }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [result, setResult] = useState<'success' | 'failure' | null>(null);
    const [selectedPillId, setSelectedPillId] = useState<number | null>(null);

    const nextRealm = useMemo(() => {
        const idx = REALM_ORDER.indexOf(member.realm);
        return REALM_ORDER[idx + 1] || Realm.YuanShen;
    }, [member.realm]);

    const portalRoot = document.getElementById('portal-root');

    // 获取背包中可用的破镜丹药
    const availablePills = useMemo(() => {
        return Object.entries(member.personalInventory.pills)
            .map(([id, count]) => ({ id: parseInt(id), count }))
            .filter(item => {
                const pill = PILL_DETAILS[item.id] as any;
                return pill && pill.effects?.breakthroughBonus !== undefined;
            });
    }, [member.personalInventory.pills]);

    const stats = useMemo(() => {
        // Calculate success probability
        let baseProb = 30; // Base 30%
        const aptitudeBonus = Math.floor(member.aptitude / 5);
        const comprehensionBonus = Math.floor(member.comprehension / 10);
        
        let physiqueBonus = 0;
        if (member.physique === '天生剑心') physiqueBonus = 10;
        if (member.physique === '青穗剑仙') physiqueBonus = 20;
        if (member.physique === '剑道通神') physiqueBonus = 25;

        // Item bonuses
        let itemBonus = 0;
        if (member.equippedItems.accessory === 20901) itemBonus = 5;

        // Selected pill bonus
        let pillBonus = 0;
        if (selectedPillId !== null) {
            const pill = PILL_DETAILS[selectedPillId] as any;
            pillBonus = pill?.effects?.breakthroughBonus || 0;
        }

        const total = Math.min(100, baseProb + aptitudeBonus + comprehensionBonus + physiqueBonus + itemBonus + pillBonus);

        return {
            baseProb,
            aptitudeBonus,
            comprehensionBonus,
            physiqueBonus,
            itemBonus,
            pillBonus,
            total
        };
    }, [member, selectedPillId]);

    const handleBreakthrough = () => {
        setIsAnimating(true);
        
        // Simulate a delay for "fate calculation"
        setTimeout(() => {
            const roll = Math.random() * 100;
            const success = roll < stats.total;
            
            setResult(success ? 'success' : 'failure');
            setIsAnimating(false);
        }, 2000);
    };

    const handleFinalize = () => {
        onAttempt(result === 'success', selectedPillId || undefined);
    };

    if (!portalRoot) return null;

    return createPortal(
  <div className="absolute inset-0 z-[9000] flex items-center justify-center bg-black/90 animate-fade-in pointer-events-auto">
    <div className="
      relative w-[600px]
      bg-[#1b1512]
      border-[10px] border-[#6b4a2d]
      rounded-sm
      shadow-[0_0_120px_rgba(120,40,20,0.45)]
      p-8
      overflow-hidden
    ">
      {/* 背景纹理 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
      </div>

      {!result ? (
        <div className="relative z-10 text-center space-y-6">

          {/* 标题 */}
          <h2 className="
            text-4xl font-cursive tracking-widest
            bg-gradient-to-b from-[#e03a3a] to-[#7a0c0c]
            bg-clip-text text-transparent
            drop-shadow-[0_0_14px_rgba(180,20,20,0.7)]
          ">
            破 镜 之 劫
          </h2>

          {/* 剧情说明 */}
          <div className="bg-[#241a15] p-4 border border-[#6b4a2d]/40 rounded-lg">
            <p className="text-[#f2d6a2] font-serif mb-2">
              {member.name} 已至 <span className="font-bold text-red-600">{member.realm}</span> 大圆满之境
            </p>
            <p className="text-[11px] text-[#b89b7a] italic">
              仙路崎岖，夺天地造化以全自身。若成，则寿元大涨，通往
              <span className="text-sky-400 font-bold"> {nextRealm}</span>；
              若败，则道基受损，修为跌落。
            </p>
          </div>

          {/* 丹药选择 */}
          <div className="space-y-3">
            <h4 className="
              text-[11px] font-bold tracking-widest
              text-[#e6c27a]
              border-b border-[#6b4a2d]/30 pb-1
              flex items-center gap-2 text-left
            ">
              💊 辅佐丹药
            </h4>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">

              {/* 不使用 */}
              <button
                onClick={() => setSelectedPillId(null)}
                className={`shrink-0 w-16 h-16 rounded border-2 flex flex-col items-center justify-center transition-all
                  ${selectedPillId === null
                    ? 'border-[#b01212] bg-[#3a1515] shadow-inner'
                    : 'border-[#6b4a2d]/30 bg-[#1a1411] opacity-60'
                  }`}
              >
                <span className="text-lg">🚫</span>
                <span className="text-[8px] font-bold text-[#e6c27a] mt-1">不使用</span>
              </button>

              {/* 丹药列表 */}
              {availablePills.map(item => {
                const pill = PILL_DETAILS[item.id] as any;
                const isSelected = selectedPillId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedPillId(item.id)}
                    className={`
                        shrink-0
                        w-16 h-16          /* ⬅️ 高度增加 */
                        rounded
                        border-2
                        flex flex-col items-center justify-start
                        pt-2 pb-1             /* ⬅️ 给底部留空间 */
                        transition-all
                        relative
                        ${isSelected
                        ? 'border-[#c63a3a] bg-[#3a1515] shadow-[0_0_12px_rgba(198,58,58,0.6)]'
                        : 'border-[#6b4a2d]/30 bg-[#1a1411] hover:border-[#c63a3a]/50'}
                    `}
                    >
                    <span className="text-lg leading-none">💊</span>

                    <span className="text-[8px] font-bold text-[#f2d6a2] mt-0.5 truncate w-full px-1 text-center">
                        {pill.name}
                    </span>

                    {/* 数量角标 */}
                    <span
                        className="
                        absolute -top-1 -right-1
                        bg-[#6b4a2d]
                        text-[#f4e4bc]
                        text-[8px]
                        w-4 h-4 rounded-full
                        flex items-center justify-center
                        border border-[#f4e4bc]/30
                        "
                    >
                        {item.count}
                    </span>

                    {/* 加成显示（卡片内底部） */}
                    {isSelected && (
                        <span className="
                        mt-auto
                        text-[8px]
                        font-bold
                        text-[#ffb347]
                        leading-none
                        ">
                        +{pill.effects.breakthroughBonus}%
                        </span>
                    )}
                    </button>
                );
              })}

                        {availablePills.length === 0 && (
                            <div className="flex items-center justify-center w-full py-2 bg-[#1a1411] rounded border border-dashed border-[#6b4a2d]/30">
                            <span className="text-[9px] text-gray-500 italic">
                                囊中羞涩，暂无辅佐丹药
                            </span>
                            </div>
                        )}
                        </div>
                    </div>

                        {/* 概率拆分 */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] border-b border-[#6b4a2d]/20 pb-0.5">
                            <span className="text-gray-400">机缘底色（基础）</span>
                            <span className="text-emerald-400 font-mono">+{stats.baseProb}%</span>
                            </div>

                            <div className="flex justify-between text-[11px] border-b border-[#6b4a2d]/20 pb-0.5">
                            <span className="text-gray-400">资质禀赋加持</span>
                            <span className="text-green-500 font-mono">+{stats.aptitudeBonus}%</span>
                            </div>

                            {stats.pillBonus > 0 && (
                            <div className="flex justify-between text-[11px] border-b border-[#6b4a2d]/20 pb-0.5">
                                <span className="text-gray-400">
                                灵丹妙药加持（{PILL_DETAILS[selectedPillId!]?.name}）
                                </span>
                                <span className="text-orange-400 font-bold font-mono">
                                +{stats.pillBonus}%
                                </span>
                            </div>
                            )}

                            {stats.physiqueBonus > 0 && (
                            <div className="flex justify-between text-[11px] border-b border-[#6b4a2d]/20 pb-0.5">
                                <span className="text-gray-400">特殊体质（{member.physique}）</span>
                                <span className="text-purple-400 font-mono">
                                +{stats.physiqueBonus}%
                                </span>
                            </div>
                            )}

                            {/* 最终成功率 */}
                            <div className="flex justify-between items-center pt-2">
                            <span className="text-lg font-bold text-[#f2d6a2]">破镜成功概率</span>
                            <span className="
                                text-4xl font-cursive
                                text-[#e02d2d]
                                drop-shadow-[0_0_16px_rgba(224,45,45,0.7)]
                            ">
                                {stats.total}%
                            </span>
                            </div>
                        </div>

                       <div className="flex gap-4 pt-4">
                            <button 
                                onClick={onClose}
                                disabled={isAnimating}
                                className="
                                flex-1 py-3
                                border-2 border-[#6b4a2d]
                                text-[#cbb38a]
                                font-bold tracking-widest
                                bg-black/20
                                hover:bg-[#2c1810]
                                hover:text-[#f4e4bc]
                                transition-all
                                disabled:opacity-40
                                "
                            >
                                暂 缓 时 日
                            </button>

                            <button 
                                onClick={handleBreakthrough}
                                disabled={isAnimating}
                                className="
                                flex-1 py-3
                                bg-gradient-to-b from-[#6b2a2a] to-[#3a1515]
                                text-[#ffe6b0]
                                font-bold tracking-[0.3em]
                                hover:brightness-125
                                transition-all
                                shadow-[0_0_20px_rgba(198,58,58,0.4)]
                                relative overflow-hidden
                                disabled:opacity-50
                                "
                            >
                                {isAnimating ? (
                                <span className="flex items-center justify-center gap-3">
                                    <span className="w-4 h-4 border-2 border-[#ffe6b0] border-t-transparent rounded-full animate-spin"></span>
                                    叩 问 天 门
                                </span>
                                ) : (
                                '逆 天 而 行'
                                )}
                            </button>
                            </div>
                    </div>
                ) : (
                    <div className="relative z-10 text-center space-y-8 animate-fade-in">
                        {result === 'success' ? (
                            <>
                                <div className="text-7xl mb-4 animate-pulse drop-shadow-[0_0_20px_rgba(255,200,100,0.6)]">
                                    ✨
                                </div>

                                <h2 className="
                                    text-5xl font-cursive
                                    text-amber-500
                                    tracking-[0.4em]
                                    drop-shadow-lg
                                ">
                                    仙 道 功 成
                                </h2>

                                <p className="text-[#f4e4bc] font-serif text-lg leading-relaxed py-4">
                                    天降祥云，地涌金莲。<br/>
                                    <span className="font-bold text-amber-400">{member.name}</span>
                                    &nbsp;成功晋升至&nbsp;
                                    <span className="text-sky-400 font-bold">{nextRealm}</span>
                                </p>
                            </>
                        ) : (
                           <>
                                <div className="text-7xl mb-4 grayscale opacity-80 animate-pulse">
                                    ⛈️
                                </div>

                                <h2 className="
                                    text-5xl font-cursive
                                    text-gray-400
                                    tracking-[0.4em]
                                ">
                                    功 亏 一 篑
                                </h2>

                                <p className="text-gray-300 font-serif text-lg leading-relaxed py-4">
                                    天雷滚滚，道心蒙尘。<br/>
                                    <span className="font-bold text-red-400">{member.name}</span>
                                    &nbsp;突破失败，经脉受损，修为跌落。
                                </p>
                            </>
                        )}
                        
                       <button 
                            onClick={handleFinalize}
                            className="
                                w-full py-4
                                bg-[#1a1310]
                                border border-[#6b4a2d]/50
                                text-[#e6cfa3]
                                font-bold tracking-[0.4em]
                                hover:bg-[#2c1810]
                                hover:text-[#ffe6b0]
                                transition-all
                                shadow-inner
                            "
                            >
                            承 受 因 果
                            </button>
                    </div>
                )}

                {/* Animation Overlay */}
                {isAnimating && (
                    <div className="absolute inset-0 bg-white/20 z-20 pointer-events-none flex items-center justify-center">
                         <div className="w-full h-full bg-gradient-to-t from-yellow-500/10 to-transparent animate-pulse"></div>
                    </div>
                )}
            </div>
        </div>,
        portalRoot
    );
};

export default BreakthroughModal;
