"use client";
import React, { useRef, useEffect } from 'react';
import { useMedia } from '@/context/MediaContext';
import { useLayout } from '@/context/LayoutContext';
import PlayerOverlay from './PlayerOverlay';

interface GameAreaProps {
    remoteStream: MediaStream | null;
    opponentName?: string;
    selfName?: string;
}

const GameArea: React.FC<GameAreaProps> = ({ remoteStream, opponentName = 'Opponent', selfName = 'Duelist' }) => {
    const { localStream, isVideoEnabled, error } = useMedia();
    const { layoutMode, spotlightTarget, setLayoutMode, setSpotlightTarget, videoFitMode } = useLayout();
    const videoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
        }
    }, [localStream, isVideoEnabled]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const handlePlayerClick = (clickedPlayer: 'self' | 'opponent') => {
        // If click on a player, set spotlight to them
        setSpotlightTarget(clickedPlayer);
        // Auto-switch to fullscreen or boxed if in grid? 
        // Defaulting to 'fullscreen' as "layout in primo piano" usually implies full focus.
        if (layoutMode === 'grid') setLayoutMode('fullscreen');
    };

    const getSlotClass = (player: 'self' | 'opponent') => {
        if (layoutMode === 'grid') return '';

        const isTarget = spotlightTarget === player;

        if (layoutMode === 'fullscreen') {
            return isTarget ? 'maximized' : 'hidden';
        }

        if (layoutMode === 'boxed') {
            return isTarget ? 'maximized' : 'minimized';
        }
        return '';
    };

    return (
        <div className={`game-area ${layoutMode}`}>

            {/* Top Half - Opponent */}
            <div
                className={`player-slot top ${getSlotClass('opponent')}`}
                onClick={() => handlePlayerClick('opponent')}
                style={{ cursor: 'pointer' }}
            >
                {/* Video Feed */}
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: videoFitMode }}
                    />
                ) : (
                    <div className="video-placeholder">
                        <p style={{ color: 'var(--text-muted)' }}>Waiting for {opponentName}...</p>
                        <div style={{ width: '30px', height: '30px', border: '2px solid var(--text-muted)', borderTopColor: 'transparent', borderRadius: '50%', margin: '10px auto', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                )}

                <PlayerOverlay name={opponentName} />

                <div className="mute-icon-container">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                </div>
            </div>

            {/* Bottom Half - Self */}
            <div
                className={`player-slot bottom ${getSlotClass('self')}`}
                onClick={() => handlePlayerClick('self')}
                style={{ cursor: 'pointer' }}
            >
                {error && (
                    <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', background: '#EF4444', color: 'white', padding: '8px', borderRadius: '4px', zIndex: 100, fontSize: '12px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {localStream && isVideoEnabled ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: videoFitMode }}
                    />
                ) : (
                    <div className="video-placeholder">
                        {localStream ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto 10px' }}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                <p>Audio Only Active</p>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>Camera Off</p>
                        )}
                    </div>
                )}

                <PlayerOverlay name={selfName} isSelf />

            </div>

            {/* Floating Controls (Mute/Hide) */}
            <div className="floating-controls">
                <button
                    className="icon-btn"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                    title="Schermo Intero"
                    onClick={() => {
                        if (!document.fullscreenElement) {
                            document.documentElement.requestFullscreen().catch(e => {
                                console.error(`Error attempting to enable fullscreen mode: ${e.message} (${e.name})`);
                            });
                        } else {
                            if (document.exitFullscreen) {
                                document.exitFullscreen();
                            }
                        }
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                </button>
            </div>
        </div>
    );
};

export default GameArea;
