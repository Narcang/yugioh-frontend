"use client";
import React, { useState } from 'react';
import { useLayout } from '@/context/LayoutContext';

import CreateRoomModal, { RoomData } from './CreateRoomModal';
import AuthModal from './AuthModal';
import UserAccountSettings from './UserAccountSettings';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const Lobby: React.FC = () => {
    const { setAppView, setCurrentRoomId, setIsSettingsOpen, setGameType, setCurrentPhase } = useLayout();
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
            // 1. Fetch Rooms normally
            const { data: roomsData, error: roomsError } = await supabase
                .from('rooms')
                .select('*')
                .order('created_at', { ascending: false });

            if (roomsError) {
                console.error('Error fetching rooms:', JSON.stringify(roomsError, null, 2));
            } else if (roomsData) {
                // 2. Extract unique host IDs
                const hostIds = Array.from(new Set(roomsData.map((r: any) => r.host_id).filter(Boolean)));

                // 3. Fetch profiles for these hosts
                let profilesMap: Record<string, string> = {};
                if (hostIds.length > 0) {
                    const { data: profilesData } = await supabase
                        .from('profiles')
                        .select('id, username')
                        .in('id', hostIds);

                    if (profilesData) {
                        profilesData.forEach((p: any) => {
                            profilesMap[p.id] = p.username;
                        });
                    }
                }

                // 4. Map rooms using the fetched profiles
                const mappedRooms = roomsData.map((r: any) => ({
                    id: r.id,
                    // Use username from profilesMap if found, else fallback to room.host_name
                    host: profilesMap[r.host_id] || r.host_name,
                    format: r.format,
                    language: r.language,
                    currentPlayers: r.current_players,
                    maxPlayers: r.max_players,
                    isPublic: r.is_public,
                    password: r.password,
                    hostId: r.host_id,
                    gameType: r.settings?.gameType || 'Yugioh' // Fallback for old rooms
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

    const handleJoinGame = async (roomToJoin?: any) => {
        const targetRoomId = roomToJoin?.id || joinCode;
        if (!targetRoomId) return;

        // In a real app we'd check if full logic on server or with RLS, but here we optimistically update.
        if (roomToJoin) {
            // Fix: If user is the host, DO NOT increment player count
            const isHost = user && user.id === roomToJoin.hostId;

            if (!isHost) {
                const { error } = await supabase
                    .from('rooms')
                    .update({ current_players: Math.min(roomToJoin.currentPlayers + 1, roomToJoin.maxPlayers) })
                    .eq('id', targetRoomId);

                if (error) console.error("Error updating player count:", error);
            }
        }

        // Set Game Type
        const gameType = roomToJoin?.gameType || roomToJoin?.settings?.gameType || 'Yugioh';
        setGameType(gameType);

        let firstPhase = 'Draw Phase';
        if (gameType === 'Magic') firstPhase = 'Beginning Phase';
        else if (gameType === 'Pokemon') firstPhase = 'Draw Phase';
        else if (gameType === 'One Piece') firstPhase = 'Refresh Phase';
        else if (gameType === 'Dragon Ball') firstPhase = 'Charge Phase';
        else if (gameType === 'Riftbound') firstPhase = 'Awaken Phase';

        setCurrentPhase(firstPhase);

        setCurrentRoomId(targetRoomId);
        setAppView('game');
    };

    const handleCreateRoom = async (data: RoomData) => {
        if (!user) {
            alert("Devi effettuare il login per creare una stanza!");
            return;
        }
        try {
            // Prioritize username from profile
            const hostName = profile?.username || user.email?.split('@')[0] || 'Duelist';

            const newRoom = {
                host_id: user.id, // Explicitly set host_id
                host_name: hostName,
                format: data.format,
                language: data.language,
                is_public: data.isPublic,
                current_players: 1,
                max_players: 2,
                password: data.isPublic ? null : '123', // TODO: Add password field to modal
                settings: {
                    gameType: data.gameType
                }
            };

            console.log("Attempting to create room with:", newRoom);

            const { data: createdRoom, error } = await supabase.from('rooms').insert([newRoom]).select().single();

            if (error) {
                console.error("Supabase Insert Error:", JSON.stringify(error, null, 2));
                throw error;
            }

            setIsCreateModalOpen(false);
            // Auto Join properly
            const newGameType = newRoom.settings.gameType;
            setGameType(newGameType);

            let firstPhase = 'Draw Phase';
            if (newGameType === 'Magic') firstPhase = 'Beginning Phase';
            else if (newGameType === 'Pokemon') firstPhase = 'Draw Phase';
            else if (newGameType === 'One Piece') firstPhase = 'Refresh Phase';
            else if (newGameType === 'Dragon Ball') firstPhase = 'Charge Phase';
            else if (newGameType === 'Riftbound') firstPhase = 'Awaken Phase';

            setCurrentPhase(firstPhase);

            setCurrentRoomId(createdRoom.id);
            setAppView('game');

        } catch (err: any) {
            console.error("Error creating room (Catch):", JSON.stringify(err, null, 2));
            alert(`Errore nella creazione della stanza: ${err.message || JSON.stringify(err)}`);
        }
    };

    const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this room?")) return;

        try {
            const { error } = await supabase
                .from('rooms')
                .delete()
                .eq('id', roomId);

            if (error) throw error;
            // Room list will auto-update via subscription
        } catch (err) {
            console.error("Error deleting room:", err);
            alert("Error deleting room");
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
            handleJoinGame(room);
        }
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRoom && passwordInput === selectedRoom.password) {
            handleJoinGame(selectedRoom);
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
                        <img
                            src="/logo.png"
                            alt="PlayTCG.Online"
                            style={{
                                height: '120px',
                                width: 'auto',
                                marginBottom: '20px'
                            }}
                        />
                        <p className="game-subtitle">Select your game mode</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                        {user ? (
                            <div
                                className="user-avatar"
                                style={{
                                    cursor: 'pointer',
                                    border: '2px solid #FFFFFF',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    background: '#EF4444',
                                    color: '#FFFFFF'
                                }}
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                title={profile?.username || user.email || 'User'}
                            >
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontWeight: 'bold' }}>{profile?.username?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}</span>
                                )}
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
                            <div className="lobby-card ranked disabled" style={{ position: 'relative', opacity: 0.7, cursor: 'not-allowed' }}>
                                <div className="card-icon">🏆</div>
                                <div className="card-info">
                                    <h3>Ranked Match</h3>
                                    <p>Compete for the top spot on the leaderboard.</p>
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(0,0,0,0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '12px',
                                    backdropFilter: 'blur(2px)'
                                }}>
                                    <span style={{
                                        color: '#fff',
                                        fontWeight: '900',
                                        fontSize: '1.2rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                        border: '2px solid #fff',
                                        padding: '8px 16px',
                                        transform: 'rotate(-5deg)'
                                    }}>Coming Soon</span>
                                </div>
                            </div>
                            <div className="lobby-card quick disabled" style={{ position: 'relative', opacity: 0.7, cursor: 'not-allowed' }}>
                                <div className="card-icon">⚡</div>
                                <div className="card-info">
                                    <h3>Quick Match</h3>
                                    <p>Jump into a casual game instantly.</p>
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(0,0,0,0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '12px',
                                    backdropFilter: 'blur(2px)'
                                }}>
                                    <span style={{
                                        color: '#fff',
                                        fontWeight: '900',
                                        fontSize: '1.2rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                        border: '2px solid #fff',
                                        padding: '8px 16px',
                                        transform: 'rotate(-5deg)'
                                    }}>Coming Soon</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Custom Games Section */}
                    <section className="lobby-section custom-games">
                        <div className="section-header-row">
                            <h2 className="section-heading">Custom Games</h2>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="secondary-btn btn-custom-game"
                            >
                                + Create Room
                            </button>
                        </div>

                        <div className="join-room-row">
                            <input
                                type="text"
                                placeholder="Enter Room Code..."
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="lobby-input"
                            />
                            <button
                                onClick={() => handleJoinGame()}
                                className="primary-btn small btn-custom-game"
                            >
                                Join
                            </button>
                        </div>

                        <div className="room-list">
                            <div className="room-list-header">
                                <span style={{ flex: 2.5 }}>Host</span>
                                <span style={{ flex: 1.5 }}>Game & Format</span>
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
                                        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{room.gameType}</span>
                                            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{room.format}</span>
                                        </div>
                                        <span style={{ flex: 1, color: '#9CA3AF' }}>{room.language || 'ITA'}</span>
                                        <span style={{ flex: 1, textAlign: 'center', color: isFull ? '#EF4444' : '#10B981' }}>
                                            {room.currentPlayers}/{room.maxPlayers}
                                        </span>
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                className={`action-btn ${isFull ? 'disabled' : ''}`}
                                                onClick={() => handleRoomClick(room)}
                                                disabled={isFull}
                                                style={{
                                                    color: isFull ? '#9CA3AF' : '#FFFFFF',
                                                    borderColor: isFull ? 'transparent' : '#FFFFFF',
                                                    background: isFull ? '#4B5563' : 'rgba(255,255,255,0.1)'
                                                }}
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
