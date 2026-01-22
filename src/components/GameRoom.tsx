"use client";
import React from 'react';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import GameArea from '@/components/GameArea';
import DiceModal from '@/components/DiceModal';
import TurnNotification from '@/components/TurnNotification';


const GameRoom: React.FC = () => {
    return (
        <div className="game-room-container" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <GameArea />
            <RightPanel />

            <DiceModal />
            <TurnNotification />
        </div>
    );
};

export default GameRoom;
