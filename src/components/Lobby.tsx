"use client";
import React, { useState } from 'react';
import { useLayout } from '@/context/LayoutContext';

import CreateRoomModal, { RoomData } from './CreateRoomModal';
import AuthModal from './AuthModal';
import UserAccountSettings from './UserAccountSettings';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const Lobby: React.FC = () => {
    const { setAppView, setCurrentRoomId, setIsSettingsOpen } = useLayout();
    const { user, profile, signOut } = useAuth();
    const [joinCode, setJoinCode] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);

    // Supabase State
    const [rooms, setRooms] = useState<any[]>([]);

    // Password Prompt State
    const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [passwordInput, setPasswordInput] = useState('');

    // Fetch Rooms & Subscribe to Realtime
    React.useEffect(() => {
        const fetchRooms = async () => {
            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching rooms:', JSON.stringify(error, null, 2));
                // Also alert strictly for debugging
                console.log("Full Error Object:", error);
            } else if (data) {
                const mappedRooms = data.map((r: any) => ({
                    id: r.id,
                    host: r.host_name,
                    format: r.format,
                    language: r.language,
                    currentPlayers: r.current_players,
                    maxPlayers: r.max_players,
                    isPublic: r.is_public,
                    password: r.password
                }));
                setRooms(mappedRooms);
            }
        };

        fetchRooms();

        const channel = supabase
            .channel('public:rooms')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
                fetchRooms(); // Refresh on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleJoinGame = () => {
        // In a real app, validation would happen here
        // Set a mock ID if none provided
        setCurrentRoomId(joinCode || 'mock-room-id');
        setAppView('game');
    };

    const handleCreateRoom = async (data: RoomData) => {
        if (!user) {
            alert("Devi effettuare il login per creare una stanza!");
            return;
        }
        try {
            const hostName = profile?.username || user.email?.split('@')[0] || 'Unknown';
            const newRoom = {
                host_name: hostName,
                format: data.format,
                language: data.language,
                is_public: data.isPublic,
                current_players: 1,
                max_players: 2,
                password: data.isPublic ? null : '123', // TODO: Add password field to modal
                settings: { time_limit: data.timeLimit }
            };

            const { error } = await supabase.from('rooms').insert([newRoom]);

            if (error) throw error;
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error("Error creating room:", err);
            alert("Errore nella creazione della stanza");
        }
    };

    const handleRoomClick = (room: any) => {
        if (room.currentPlayers >= room.maxPlayers) {
            alert("Questa lobby è piena!");
            return;
        }

        if (!room.isPublic) {
            setSelectedRoom(room);
            setPasswordInput('');
            setIsPasswordPromptOpen(true);
        } else {
            // Join immediately
            setCurrentRoomId(room.id);
            setAppView('game');
        }
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRoom && passwordInput === selectedRoom.password) {
            setCurrentRoomId(selectedRoom.id);
            setAppView('game');
            setIsPasswordPromptOpen(false);
        } else {
            alert("Password non corretta!");
        }
    };

    return (
        <div className="lobby-container">
            <div className="lobby-content">
                <header className="lobby-header" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    padding: '20px 40px'
                }}>
                    <div style={{ visibility: 'hidden' }}>
                        {/* Empty left column for balance */}
                        <button className="primary-btn small">Placeholder</button>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <h1 className="game-title">Yu-Gi-Oh! Platform</h1>
                        <p className="game-subtitle">Select your game mode</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                        {user ? (
                            <div
                                className="user-avatar"
                                style={{ cursor: 'pointer', border: '2px solid #F4C430', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#333' }}
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                title={profile?.username || user.email || 'User'}
                            >
                                <span style={{ fontWeight: 'bold' }}>{profile?.username?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}</span>
                            </div>
                        ) : (
                            <button className="primary-btn small" onClick={() => setIsAuthModalOpen(true)}>Accedi</button>
                        )}

                        {isProfileDropdownOpen && user && (
                            <div className="dropdown-menu" style={{
                                position: 'absolute',
                                top: '50px',
                                right: '0',
                                background: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                padding: '10px',
                                zIndex: 100,
                                minWidth: '150px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
                            }}>
                                <div style={{ padding: '8px', borderBottom: '1px solid #333', marginBottom: '8px', color: '#888', fontSize: '12px' }}>
                                    {profile?.username || user.email}
                                </div>
                                <button
                                    style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    onClick={() => {
                                        setIsUserSettingsOpen(true);
                                        setIsProfileDropdownOpen(false);
                                    }}
                                >
                                    <span>⚙️</span> Impostazioni
                                </button>
                                <button
                                    style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    onClick={() => {
                                        signOut();
                                        setIsProfileDropdownOpen(false);
                                    }}
                                >
                                    <span>🚪</span> Esci
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <div className="lobby-main">
                    {/* Matchmaking Section */}
                    <section className="lobby-section matchmaking">
                        <h2 className="section-heading">Matchmaking</h2>
                        <div className="card-grid">
                            <div className="lobby-card ranked" onClick={handleJoinGame}>
                                <div className="card-icon">🏆</div>
                                <div className="card-info">
                                    <h3>Ranked Match</h3>
                                    <p>Compete for the top spot on the leaderboard.</p>
                                </div>
                            </div>
                            <div className="lobby-card quick" onClick={handleJoinGame}>
                                <div className="card-icon">⚡</div>
                                <div className="card-info">
                                    <h3>Quick Match</h3>
                                    <p>Jump into a casual game instantly.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Custom Games Section */}
                    <section className="lobby-section custom-games">
                        <div className="section-header-row">
                            <h2 className="section-heading">Custom Games</h2>
                            <button className="secondary-btn" onClick={() => setIsCreateModalOpen(true)}>+ Create Room</button>
                        </div>

                        <div className="join-room-row">
                            <input
                                type="text"
                                placeholder="Enter Room Code..."
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="lobby-input"
                            />
                            <button className="primary-btn small" onClick={handleJoinGame}>Join</button>
                        </div>

                        <div className="room-list">
                            <div className="room-list-header">
                                <span style={{ flex: 2.5 }}>Host</span>
                                <span style={{ flex: 1.5 }}>Format</span>
                                <span style={{ flex: 1 }}>Lang</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>Players</span>
                                <span style={{ flex: 1, textAlign: 'right' }}>Action</span>
                            </div>
                            {rooms.map(room => {
                                const isFull = room.currentPlayers >= room.maxPlayers;
                                return (
                                    <div key={room.id} className={`room-item ${isFull ? 'full' : ''}`}>
                                        <div style={{ flex: 2.5, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontWeight: 600 }}>{room.host}</span>
                                            {room.isPublic ? (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ opacity: 0.8 }}>
                                                    <title>Public</title>
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                    <path d="M7 11V7a5 5 0 0 1 10 0" />
                                                </svg>
                                            ) : (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ opacity: 0.8 }}>
                                                    <title>Private</title>
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                            )}
                                        </div>
                                        <span style={{ flex: 1.5, color: '#9CA3AF' }}>{room.format}</span>
                                        <span style={{ flex: 1, color: '#9CA3AF' }}>{room.language || 'ITA'}</span>
                                        <span style={{ flex: 1, textAlign: 'center', color: isFull ? '#EF4444' : '#10B981' }}>
                                            {room.currentPlayers}/{room.maxPlayers}
                                        </span>
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                className={`action-btn ${isFull ? 'disabled' : ''}`}
                                                onClick={() => handleRoomClick(room)}
                                                disabled={isFull}
                                            >
                                                {isFull ? 'Full' : 'Join'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>

            <CreateRoomModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateRoom}
            />

            {/* Password Prompt Modal (Simple Inline) */}
            {isPasswordPromptOpen && (
                <div className="modal-overlay">
                    <div className="create-room-modal" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Password Richiesta</h2>
                            <button className="close-btn" onClick={() => setIsPasswordPromptOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handlePasswordSubmit} className="modal-form">
                            <div className="form-section">
                                <label className="input-label">Inserisci la password per entrare</label>
                                <input
                                    type="password"
                                    className="text-input"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setIsPasswordPromptOpen(false)}>Annulla</button>
                                <button type="submit" className="btn-primary">Conferma</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <UserAccountSettings isOpen={isUserSettingsOpen} onClose={() => setIsUserSettingsOpen(false)} />
        </div>
    );
};

export default Lobby;
