"use client";
import React, { useState } from 'react';
import { useMedia } from '@/context/MediaContext';
import { useLayout } from '@/context/LayoutContext';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
    sendPhase: (phase: string) => void;
    sendPassTurn: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sendPhase, sendPassTurn }) => {
    const { isMicMuted, isVideoEnabled, toggleMic, toggleVideo } = useMedia();
    const { user, profile } = useAuth();
    const { layoutMode, spotlightTarget, setLayoutMode, setSpotlightTarget, isSidebarCollapsed, setIsSidebarCollapsed, setIsSettingsOpen, setIsDiceModalOpen, currentRoomId, switchTurn, currentTurn, selfTimeLeft, timeLimit, currentPhase, setCurrentPhase, gameType } = useLayout();

    const GAME_PHASES: Record<string, string[]> = {
        'Yugioh': ['Draw Phase', 'Standby Phase', 'Main Phase 1', 'Battle Phase', 'Main Phase 2', 'End Phase'],
        'Magic': ['Beginning Phase', 'Main Phase 1', 'Combat Phase', 'Main Phase 2', 'Ending Phase'],
        'Pokemon': ['Draw Phase', 'Main Phase', 'Attack/End Phase'],
        'One Piece': ['Refresh Phase', 'Draw Phase', 'DON!! Phase', 'Main Phase', 'End Phase'],
        'Dragon Ball': ['Charge Phase', 'Main Phase', 'End Phase'],
        'Riftbound': ['Awaken Phase', 'Beginning Phase', 'Channel Phase', 'Draw Phase', 'Action Phase', 'End Phase']
    };

    const handleSpotlightClick = () => {
        if (layoutMode === 'fullscreen') {
            // Toggle target if already in fullscreen
            setSpotlightTarget(spotlightTarget === 'opponent' ? 'self' : 'opponent');
        } else {
            setLayoutMode('fullscreen'); // Default to fullscreen for "Primo piano"
            setSpotlightTarget('opponent');
        }
    };

    return (
        <nav className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            {/* 0. Logo (Top) */}
            <div className="sidebar-group">
                <div className="icon-btn logo-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
                </div>

            </div>

            {/* 0.5 Phase Controller */}
            <div className="sidebar-group">
                <button
                    className="icon-btn"
                    title={`Fase Corrente: ${currentPhase}. Clicca per avanzare.`}
                    onClick={() => {
                        if (currentTurn !== 'self') return;

                        const phases = GAME_PHASES[gameType] || GAME_PHASES['Yugioh'];
                        const currentIndex = phases.indexOf(currentPhase);

                        let nextPhase = '';

                        if (currentIndex !== -1 && currentIndex < phases.length - 1) {
                            nextPhase = phases[currentIndex + 1];
                        } else if (currentIndex === phases.length - 1) {
                            // If last phase, switch turn
                            switchTurn();
                            sendPassTurn();
                            return;
                        } else {
                            // Fallback/Reset if phase not found
                            nextPhase = phases[0];
                        }

                        if (nextPhase) {
                            setCurrentPhase(nextPhase);
                            sendPhase(nextPhase);
                        }
                    }}
                    style={{
                        color: currentTurn === 'self' ? '#F59E0B' : '#666', // Amber for phases
                        cursor: currentTurn === 'self' ? 'pointer' : 'not-allowed',
                        opacity: currentTurn === 'self' ? 1 : 0.5,
                        fontSize: '10px',
                        fontWeight: 'bold',
                        width: 'auto',
                        padding: '0 5px',
                        minWidth: '40px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        lineHeight: '1.2'
                    }}
                >
                    <span style={{ fontSize: '14px', marginBottom: '2px' }}>▶</span>
                    <span>{currentPhase.split(' ')[0]}</span>
                    <span>{currentPhase.split(' ').slice(1).join(' ')}</span>
                </button>
            </div>

            {/* 1. Passa il turno */}
            <div className="sidebar-group">
                <button
                    className="icon-btn"
                    title={currentTurn === 'self' ? "Passa il turno" : "È il turno dell'avversario"}
                    onClick={() => {
                        switchTurn();
                        sendPassTurn();
                    }}
                    style={{
                        color: currentTurn === 'self' ? '#3B82F6' : '#666',
                        cursor: currentTurn === 'self' ? 'pointer' : 'not-allowed',
                        opacity: currentTurn === 'self' ? 1 : 0.5
                    }}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '32px', height: '32px' }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
            </div>

            <div className="spacer" style={{ flex: '0 0 50px' }}></div>

            {/* 2. Mic & 3. Video */}
            <div className="sidebar-group">
                <button
                    className={`icon-btn ${!isMicMuted ? 'active' : ''}`}
                    onClick={toggleMic}
                    title={isMicMuted ? "Accendi Microfono" : "Disattiva Microfono"}
                    style={{ color: isMicMuted ? '#EF4444' : 'inherit' }}
                >
                    {isMicMuted ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                    )}
                </button>
                <button
                    className={`icon-btn ${isVideoEnabled ? 'active' : ''}`}
                    onClick={toggleVideo}
                    title={isVideoEnabled ? "Disattiva Camera" : "Accendi Camera"}
                    style={{ color: !isVideoEnabled ? '#EF4444' : 'inherit' }}
                >
                    {isVideoEnabled ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" /><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    )}
                </button>
            </div>

            <div className="divider" style={{ width: '40%', height: '1px', background: 'var(--border-color)', margin: '10px auto' }}></div>

            {/* Layouts: 4, 5, 6, 7 */}
            <div className="sidebar-group">
                <button
                    className={`icon-btn ${layoutMode === 'fullscreen' ? 'active' : ''}`}
                    title="Passa a Layout in primo piano"
                    onClick={() => {
                        setLayoutMode('fullscreen');
                        if (spotlightTarget === 'self') setSpotlightTarget('opponent');
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
                </button>
                <button
                    className={`icon-btn ${layoutMode === 'grid' ? 'active' : ''}`}
                    title="Passa a Layout a Griglia"
                    onClick={() => setLayoutMode('grid')}
                >
                    {/* 2 Staked Rectangles */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="8" rx="1" /><rect x="3" y="13" width="18" height="8" rx="1" /></svg>
                </button>
                <button
                    className={`icon-btn ${layoutMode === 'boxed' ? 'active' : ''}`}
                    title="Passa a Layout con riquadro"
                    onClick={() => {
                        setLayoutMode('boxed');
                        setSpotlightTarget('opponent');
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><rect x="12" y="12" width="7" height="7" /></svg>
                </button>
                <button
                    className="icon-btn"
                    title={isSidebarCollapsed ? "Blocca Barra Laterale" : "Nascondi pannello di gioco"}
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                >
                    {isSidebarCollapsed ? (
                        /* Lock Icon */
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    ) : (
                        /* Arrow Left/Collapse Icon */
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    )}
                </button>
            </div>

            <div className="divider" style={{ width: '40%', height: '1px', background: 'var(--border-color)', margin: '10px auto' }}></div>

            {/* 8. Invita, 9. Impostazioni, 10. Dadi */}
            <div className="sidebar-group">
                <button
                    className="icon-btn"
                    title="Invita giocatori"
                    onClick={() => {
                        if (currentRoomId) {
                            const url = `${window.location.origin}/?room=${currentRoomId}`;
                            navigator.clipboard.writeText(url).then(() => {
                                alert(`Link partita copiato: ${url}`);
                            });
                        } else {
                            alert("Nessuna partita attiva o ID stanza non trovato.");
                        }
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                </button>
                <button className="icon-btn" title="Menù di gioco e impostazioni" onClick={() => setIsSettingsOpen(true)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                </button>
                <button className="icon-btn" title="Tira i dadi o lancia una moneta" onClick={() => setIsDiceModalOpen(true)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="7.5" cy="7.5" r="1.5" /><circle cx="7.5" cy="16.5" r="1.5" /><circle cx="16.5" cy="7.5" r="1.5" /><circle cx="16.5" cy="16.5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="7.5" r="1.5" /><circle cx="12" cy="16.5" r="1.5" /></svg>
                </button>
            </div>

            <div className="divider" style={{ width: '40%', height: '1px', background: 'var(--border-color)', margin: '10px auto' }}></div>

            {/* 11. Shortcuts, 12. FAQ, 13. Intro */}
            <div className="sidebar-group">
                <button className="icon-btn" title="Tasti di scelta Rapida">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" /></svg>
                </button>
                <button className="icon-btn" title="FAQ">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </button>
                <button className="icon-btn" title="Visualizza Introduzione">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="4.93" y1="4.93" x2="9.17" y2="9.17" /><line x1="14.83" y1="14.83" x2="19.07" y2="19.07" /><line x1="14.83" y1="9.17" x2="19.07" y2="4.93" /><line x1="14.83" y1="9.17" x2="18.36" y2="5.64" /><line x1="4.93" y1="19.07" x2="9.17" y2="14.83" /></svg>
                </button>
            </div>

            <div className="spacer" style={{ flex: 1 }}></div>

            {/* User profile at bottom */}
            <div className="sidebar-group">
                <div className="user-avatar" title={profile?.username || 'User'}>
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                        <span>{profile?.username?.substring(0, 2).toUpperCase() || 'AX'}</span>
                    )}
                </div>
            </div>
        </nav >
    );
};

export default Sidebar;
