
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { GameState, ClanMember, Building, Inventory } from '../../types';
import Tooltip from '../Shared/Tooltip';
import { useTooltip } from '../Shared/useTooltip';

// 基础标签页
import StatusTab from './Tabs/StatusTab';
import WarehouseTab from './Tabs/WarehouseTab';
import BuildingsTab from './Tabs/BuildingsTab';
import PositionsTab from './Tabs/PositionsTab';

// 建筑功能标签页
import AlchemyRoomTab from './Tabs/BuildingsTabs/AlchemyRoomTab';
import SmithyTab from './Tabs/BuildingsTabs/SmithyTab';
import LibraryTab from './Tabs/BuildingsTabs/LibraryTab';
import CultivationRoomTab from './Tabs/BuildingsTabs/CultivationRoomTab';

interface Props {
    state: GameState;
    onUpdateMember: (id: string, updates: Partial<ClanMember>) => void;
    onUpdateBuilding: (id: string, updates: Partial<Building>) => void;
    onUpdateInventory: (updates: Partial<Inventory>) => void;
    onAddBuilding: (type: string) => void;
    onCancelBuilding?: (id: string) => void;
    onAssignBuilding: (buildingId: string, memberId: string | null, slotIndex?: number) => void;
    onAssignItem?: (memberId: string, itemId: number, category: string, quantity: number) => void;
    onClose: () => void;
    onUnlockPosition?: (pos: string, cost: number) => void;
}

const ClanManagement: React.FC<Props> = ({ state, onUpdateMember, onUpdateBuilding, onUpdateInventory, onAddBuilding, onCancelBuilding, onAssignBuilding, onAssignItem, onClose, onUnlockPosition }) => {
    const [activeTab, setActiveTab] = useState<string>('status');
    const { tooltip, showTooltip, hideTooltip } = useTooltip();

    const alreadyAssignedIds = useMemo(() => {
        return state.buildings.flatMap(b => [b.assignedMemberId, ...(b.assignedMemberIds || [])]).filter(id => id !== null) as string[];
    }, [state.buildings]);

    // 查找已建成的建筑
    const alchemyRoom = state.buildings.find(b => b.type === 'AlchemyRoom' && b.isFinished);
    const smithy = state.buildings.find(b => b.type === 'Smithy' && b.isFinished);
    const library = state.buildings.find(b => b.type === 'Library' && b.isFinished);
    const cultivationRoom = state.buildings.find(b => b.type === 'CultivationRoom' && b.isFinished);

    const baseTabs = [
        { id: 'status', name: '概况', icon: '📜', color: 'yellow' },
        { id: 'warehouse', name: '仓库', icon: '🏯', color: 'amber' },
        { id: 'buildings', name: '营造', icon: '🏗️', color: 'yellow' },
        { id: 'positions', name: '职位', icon: '👔', color: 'yellow' },
    ];

    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    return createPortal(
        <div className="absolute inset-0 z-[5000] flex items-center justify-center bg-black/90 p-4 overflow-hidden select-none pointer-events-auto">
            <Tooltip state={tooltip} />

            <div className="relative w-[1500px] h-[920px] bg-[#1a1310] border-[8px] border-[#4a3728] rounded-sm shadow-2xl flex flex-col font-serif overflow-hidden">
                {/* 页眉导航 */}
                <div className="h-16 bg-[#2c1810] border-b border-yellow-900/30 flex items-center px-6 shrink-0 gap-6">
                    <h2 className="text-2xl font-cursive text-yellow-600 pr-4 border-r border-yellow-900/20 whitespace-nowrap">望月大社</h2>
                    <div className="flex h-full overflow-x-auto scrollbar-hide">
                        {baseTabs.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setActiveTab(t.id)} 
                                className={`whitespace-nowrap px-6 h-full text-sm font-bold border-b-2 transition-all flex items-center gap-2 
                                    ${activeTab === t.id 
                                        ? `border-${t.color}-500 text-${t.color}-500 bg-${t.color}-900/10` 
                                        : 'border-transparent text-gray-500 hover:text-gray-400'}`}
                            >
                                <span className="text-lg opacity-70">{t.icon}</span> {t.name}
                            </button>
                        ))}
                        
                        {library && (
                            <button onClick={() => setActiveTab('library')} className={`whitespace-nowrap px-6 h-full text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'library' ? 'border-amber-500 text-amber-500 bg-amber-900/10' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>
                                <span>📚</span> 藏经阁
                            </button>
                        )}
                        {alchemyRoom && (
                            <button onClick={() => setActiveTab('alchemy')} className={`whitespace-nowrap px-6 h-full text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'alchemy' ? 'border-pink-500 text-pink-500 bg-pink-900/10' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>
                                <span>⚗️</span> 炼丹
                            </button>
                        )}
                        {smithy && (
                            <button onClick={() => setActiveTab('smithing')} className={`whitespace-nowrap px-6 h-full text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'smithing' ? 'border-blue-500 text-blue-500 bg-blue-900/10' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>
                                <span>🔨</span> 炼器
                            </button>
                        )}
                        {cultivationRoom && (
                            <button onClick={() => setActiveTab('cultivation_room')} className={`whitespace-nowrap px-6 h-full text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'cultivation_room' ? 'border-emerald-500 text-emerald-500 bg-emerald-900/10' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>
                                <span>🧘</span> 修炼室
                            </button>
                        )}
                    </div>
                    <button onClick={onClose} className="ml-auto w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white text-3xl transition-colors font-bold">×</button>
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#140f0d]">
                    {activeTab === 'status' && <StatusTab state={state} />}
                    {activeTab === 'warehouse' && (
                        <WarehouseTab 
                            inventory={state.inventory} 
                            members={state.members}
                            onAssignItem={onAssignItem}
                            showTooltip={showTooltip} 
                            hideTooltip={hideTooltip} 
                        />
                    )}
                    {activeTab === 'buildings' && (
                        <BuildingsTab 
                            buildings={state.buildings} 
                            spiritStones={state.spiritStones} 
                            onAddBuilding={onAddBuilding} 
                            onCancelBuilding={onCancelBuilding}
                        />
                    )}
                    {activeTab === 'positions' && (
                        <PositionsTab 
                            members={state.members} 
                            unlockedPositions={state.unlockedPositions} 
                            merit={state.merit} 
                            onUpdateMember={onUpdateMember} 
                            onUnlockPosition={onUnlockPosition || (() => {})} 
                        />
                    )}
                    
                    {activeTab === 'library' && library && (
                        <LibraryTab 
                            building={library} 
                            members={state.members} 
                            inventory={state.inventory}
                            alreadyAssignedIds={alreadyAssignedIds} 
                            onAssignBuilding={onAssignBuilding} 
                            showTooltip={showTooltip}
                            hideTooltip={hideTooltip}
                        />
                    )}
                    {activeTab === 'alchemy' && alchemyRoom && (
                        <AlchemyRoomTab 
                            building={alchemyRoom} 
                            members={state.members} 
                            inventory={state.inventory}
                            alreadyAssignedIds={alreadyAssignedIds} 
                            onAssignBuilding={onAssignBuilding} 
                            onUpdateBuilding={onUpdateBuilding}
                            onUpdateInventory={onUpdateInventory}
                            showTooltip={showTooltip}
                            hideTooltip={hideTooltip}
                        />
                    )}
                    {activeTab === 'smithing' && smithy && (
                        <SmithyTab 
                            building={smithy} 
                            members={state.members} 
                            alreadyAssignedIds={alreadyAssignedIds} 
                            onAssignBuilding={onAssignBuilding} 
                        />
                    )}
                    {activeTab === 'cultivation_room' && cultivationRoom && (
                        <CultivationRoomTab 
                            building={cultivationRoom} 
                            members={state.members} 
                            inventory={state.inventory}
                            alreadyAssignedIds={alreadyAssignedIds} 
                            onAssignBuilding={onAssignBuilding} 
                            onUpdateBuilding={onUpdateBuilding}
                            onUpdateInventory={onUpdateInventory}
                            showTooltip={showTooltip}
                            hideTooltip={hideTooltip}
                        />
                    )}
                </div>
            </div>
        </div>,
        portalRoot
    );
};

export default ClanManagement;
