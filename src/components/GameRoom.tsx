"use client";
import React from 'react';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import GameArea from '@/components/GameArea';
import DiceModal from '@/components/DiceModal';
import TurnNotification from '@/components/TurnNotification';
import PhaseNotification from '@/components/PhaseNotification';
import { useLayout } from '@/context/LayoutContext';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';
import { useWebRTC } from '@/hooks/useWebRTC';


const GameRoom: React.FC = () => {
    const { currentRoomId } = useLayout();
    const { localStream } = useMedia();
    const { profile, user } = useAuth(); // Get user profile
    const username = profile?.username || user?.email?.split('@')[0] || 'Duelist';

    const {
        remoteStream,
        remoteUsername,
        sendCard,
        latestReceivedCard,
        dataChannelState,
        sendLP,
        latestReceivedLP,
        sendPhase,
        latestReceivedPhase,
        sendPassTurn,
        latestReceivePassTurn,
        iceConnectionState,
        connectionLogs,
        sendPing
    } = useWebRTC(currentRoomId, localStream, username);

    const { setCurrentPhase, switchTurn, currentTurn, isTurnChanging } = useLayout();
    const lastProcessedTurnRef = React.useRef<number>(0);

    React.useEffect(() => {
        // Only update phase from opponent if it's THEIR turn and we aren't switching
        if (latestReceivedPhase && currentTurn === 'opponent' && !isTurnChanging) {
            setCurrentPhase(latestReceivedPhase);
        }
    }, [latestReceivedPhase, setCurrentPhase, currentTurn, isTurnChanging]);

    React.useEffect(() => {
        if (latestReceivePassTurn && latestReceivePassTurn > lastProcessedTurnRef.current) {
            // Opponent passed turn. It is now my turn.
            if (currentTurn === 'opponent') {
                switchTurn();
                lastProcessedTurnRef.current = latestReceivePassTurn;

                // FORCE RESET: Broadcast "Draw Phase" start to ensure opponent sees it too.
                setTimeout(() => {
                    sendPhase('Draw Phase');
                }, 500);
            }
        }
    }, [latestReceivePassTurn, currentTurn, switchTurn, sendPhase]);


    return (
        <div className="game-room-container" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <Sidebar sendPhase={sendPhase} sendPassTurn={sendPassTurn} />
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
                iceConnectionState={iceConnectionState}
                connectionLogs={connectionLogs}
                sendPing={sendPing}
            />

            <DiceModal />
            <TurnNotification />
            <PhaseNotification />
        </div>
    );
};

export default GameRoom;
