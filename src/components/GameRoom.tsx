"use client";
import React from 'react';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import GameArea from '@/components/GameArea';
import DiceModal from '@/components/DiceModal';
import TurnNotification from '@/components/TurnNotification';
import { useLayout } from '@/context/LayoutContext';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';
import { useWebRTC } from '@/hooks/useWebRTC';


const GameRoom: React.FC = () => {
    const { currentRoomId } = useLayout();
    const { localStream } = useMedia();
    const { profile, user } = useAuth(); // Get user profile
    const username = profile?.username || user?.email?.split('@')[0] || 'Duelist';

    const { remoteStream, remoteUsername, sendCard, latestReceivedCard, dataChannelState, sendLP, latestReceivedLP } = useWebRTC(currentRoomId, localStream, username);

    return (
        <div className="game-room-container" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <GameArea
                remoteStream={remoteStream}
                opponentName={remoteUsername || 'Opponent'}
                selfName={username}
                sendLP={sendLP}
                latestReceivedLP={latestReceivedLP}
            />
            <RightPanel
                remoteStream={remoteStream}
                onDeclareCard={sendCard}
                lastReceivedCard={latestReceivedCard}
                dataChannelState={dataChannelState}
            />

            <DiceModal />
            <TurnNotification />
        </div>
    );
};

export default GameRoom;
