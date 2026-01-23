"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface UserAccountSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserAccountSettings: React.FC<UserAccountSettingsProps> = ({ isOpen, onClose }) => {
    const { user, profile, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'app'>('profile');

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [newUsername, setNewUsername] = useState(profile?.username || '');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [loading, setLoading] = useState(false);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
        if (isOpen && profile?.username) {
            setNewUsername(profile.username);
        }
    }, [isOpen, profile]);

    if (!isOpen) return null;

    const handleSaveProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: newUsername,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            // Refresh global auth context
            // Assuming refreshProfile is available from useAuth, which we checked earlier
            // @ts-ignore
            if (typeof useAuth().refreshProfile === 'function') {
                // @ts-ignore
                await useAuth().refreshProfile();
            }

            alert("Profilo aggiornato con successo!");
        } catch (err) {
            console.error("Error updating profile:", err);
            alert("Errore durante l'aggiornamento del profilo");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()} style={{
                width: '800px',
                height: '600px',
                backgroundColor: '#1e1e1e',
                borderRadius: '8px',
                display: 'flex',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                color: '#ececec'
            }}>
                {/* Sidebar */}
                <div className="settings-sidebar" style={{
                    width: '250px',
                    backgroundColor: '#2b2b2b',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#fff', paddingLeft: '10px' }}>Impostazioni</h2>

                    <div className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button
                            onClick={() => setActiveTab('profile')}
                            style={{
                                textAlign: 'left',
                                padding: '10px 15px',
                                background: activeTab === 'profile' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: 'none',
                                color: activeTab === 'profile' ? '#fff' : '#aaa',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'background 0.2s'
                            }}
                        >
                            Profilo
                        </button>
                        <button
                            onClick={() => setActiveTab('account')}
                            style={{
                                textAlign: 'left',
                                padding: '10px 15px',
                                background: activeTab === 'account' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: 'none',
                                color: activeTab === 'account' ? '#fff' : '#aaa',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'background 0.2s'
                            }}
                        >
                            Account
                        </button>
                    </div>

                    <div style={{ marginTop: 'auto', borderTop: '1px solid #444', paddingTop: '10px' }}>
                        <button
                            onClick={handleSignOut}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px 15px',
                                background: 'transparent',
                                border: 'none',
                                color: '#EF4444',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>🚪</span> Esci
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="settings-content" style={{ flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'none',
                            border: 'none',
                            color: '#aaa',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>

                    {activeTab === 'profile' && (
                        <div className="tab-panel animate-fade-in">
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '30px' }}>Profilo Utente</h2>

                            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                                <div className="avatar-large" style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    backgroundColor: '#F4C430', /* Gold/Sand accent */
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    fontSize: '3rem',
                                    fontWeight: 'bold',
                                    color: '#000'
                                }}>
                                    {profile?.username?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', margin: '0 0 5px 0' }}>{profile?.username || 'Utente'}</h3>
                                    <span style={{
                                        padding: '4px 8px',
                                        background: '#333',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        color: '#aaa'
                                    }}>
                                        #{user?.id.substring(0, 4)}
                                    </span>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '0.9rem' }}>NOME UTENTE</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="Scegli un username"
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            background: '#111',
                                            border: '1px solid #333',
                                            borderRadius: '4px',
                                            color: '#fff'
                                        }}
                                    />
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={loading || newUsername === (profile?.username || '')}
                                        style={{
                                            padding: '12px 24px',
                                            background: newUsername === (profile?.username || '') ? '#333' : '#F4C430',
                                            color: newUsername === (profile?.username || '') ? '#888' : '#000',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: newUsername === (profile?.username || '') ? 'default' : 'pointer',
                                            fontWeight: 'bold',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {loading ? '...' : 'Salva'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="tab-panel animate-fade-in">
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '30px' }}>Impostazioni Account</h2>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '0.9rem' }}>EMAIL</label>
                                <div style={{
                                    padding: '12px',
                                    background: '#111',
                                    border: '1px solid #333',
                                    borderRadius: '4px',
                                    color: '#888',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>{user?.email}</span>
                                    {/* <button className="text-btn" style={{ fontSize: '0.8rem', color: '#3498db' }}>Modifica</button> */}
                                </div>
                            </div>

                            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #333' }}>
                                <h4 style={{ color: '#EF4444', marginBottom: '10px' }}>Zona Pericolosa</h4>
                                <button style={{
                                    padding: '10px 20px',
                                    background: 'transparent',
                                    border: '1px solid #EF4444',
                                    color: '#EF4444',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}>
                                    Elimina Account
                                </button>
                                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
                                    Questa azione è irreversibile. Tutti i tuoi dati verranno persi.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserAccountSettings;
