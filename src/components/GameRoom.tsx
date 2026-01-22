"use client";
import React from 'react';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import GameArea from '@/components/GameArea';
import SettingsModal from '@/components/SettingsModal';
import DiceModal from '@/components/DiceModal';

const GameRoom: React.FC = () => {
    return (
        <div className="game-room-container" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <GameArea />
            <RightPanel />

            <SettingsModal />
            <DiceModal />
        </div>
    );
};

export default GameRoom;
