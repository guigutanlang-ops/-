
import React from 'react';
import { ClanMember, TaskType, Realm } from '../../../types';
import { TASK_INFO } from '../../../constants';

interface Props {
    member: ClanMember;
    onUpdateTask: (task: TaskType) => void;
}

const TaskTab: React.FC<Props> = ({ member, onUpdateTask }) => {
    // 凡人只能是“无”
    const isMortal = member.realm === Realm.Mortal;
    // 是否受伤
    const isInjured = member.status === 'injured';

    const getAvailableTasks = (): TaskType[] => {
        if (isMortal) return ['Idle'];
        if (isInjured) return ['Recovery'];
        
        const base: TaskType[] = ['Cultivation', 'Travel', 'Idle'];
        
        // 只有担任特定职务或根据属性开放（这里可以根据 position 扩展）
        if (member.position !== '弟子') {
            base.push('Research');
        }
        
        // 如果目前正在派遣中，也要保留该项以便显示
        if (member.assignment === 'Mission') base.push('Mission');
        
        return base;
    };

    const availableTasks = getAvailableTasks();

    return (
        <div className="h-full overflow-y-auto custom-scrollbar space-y-3 animate-fade-in max-w-2xl mx-auto pr-2">
            <div className="mb-6 p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-xl">
                <p className="text-xs text-yellow-400 font-bold mb-1">【家族调令】</p>
                <p className="text-[11px] text-gray-400 leading-relaxed italic">
                    {isMortal ? '凡人无根骨，无法参与修行事务，默认处于闲散状态。' : 
                     isInjured ? '族人经脉受损，目前强制处于“修养生息”状态，伤愈前不可更改。' :
                     '设定族人的当前事务。闭关修行可获得最快经验增长。'}
                </p>
            </div>

            {(Object.keys(TASK_INFO) as TaskType[]).map(taskKey => {
                if (!availableTasks.includes(taskKey)) return null;
                
                const info = TASK_INFO[taskKey];
                const isActive = member.assignment === taskKey;

                return (
                    <button
                        key={taskKey}
                        onClick={() => !isInjured && !isMortal && onUpdateTask(taskKey)}
                        disabled={isInjured || isMortal || taskKey === 'Mission'}
                        className={`w-full p-6 rounded-2xl border transition-all text-left shadow-lg relative overflow-hidden group ${
                            isActive 
                            ? 'bg-yellow-900/30 border-yellow-500 text-yellow-100 ring-1 ring-yellow-500/50' 
                            : 'bg-black/30 border-white/5 hover:bg-black/50 hover:border-white/20 text-gray-400'
                        } ${(isInjured || isMortal || (taskKey === 'Mission' && !isActive)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="flex justify-between items-center mb-1 relative z-10">
                            <div className="flex items-center gap-3">
                                <p className="text-base font-bold">{info.label}</p>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${info.color.replace('text', 'border')} ${info.color} bg-black/20`}>
                                    经验 {info.multiplier * 100}%
                                </span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${info.color.replace('text', 'border')}`}>
                                {taskKey}
                            </span>
                        </div>
                        <p className="text-xs opacity-60 leading-relaxed relative z-10">{info.desc}</p>
                        
                        {isActive && (
                            <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-500/5 blur-xl pointer-events-none"></div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

// Add missing default export
export default TaskTab;
