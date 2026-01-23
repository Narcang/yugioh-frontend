"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { refreshProfile } = useAuth();
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Signup fields
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username,
                            full_name: fullName,
                        },
                    },
                });

                if (error) throw error;

                if (data.user) {
                    // Explicitly create/update profile
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: data.user.id,
                            username: username,
                            full_name: fullName,
                            updated_at: new Date().toISOString(),
                        });

                    if (profileError) {
                        console.error("Error creating profile:", profileError);
                        // We don't block the user, but we log it.
                    }
                }

                if (error) throw error;
                // If email confirmation is required, Supabase won't sign in immediately.
                // Assuming default "Confirm Email" is OFF for this demo, or we notify user.
                alert("Registrazione completata! Controlla la tua email per confermare (se richiesto).");
                await refreshProfile();
                onClose();
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
                await refreshProfile();
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'Errore durante l\'autenticazione');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="create-room-modal" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2>{mode === 'signin' ? 'Accedi' : 'Registrati'}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #333' }}>
                    <button
                        className={`tab-btn ${mode === 'signin' ? 'active' : ''}`}
                        style={{ background: 'none', border: 'none', color: mode === 'signin' ? '#F4C430' : '#888', padding: '10px', cursor: 'pointer', borderBottom: mode === 'signin' ? '2px solid #F4C430' : 'none' }}
                        onClick={() => setMode('signin')}
                    >
                        Accedi
                    </button>
                    <button
                        className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
                        style={{ background: 'none', border: 'none', color: mode === 'signup' ? '#F4C430' : '#888', padding: '10px', cursor: 'pointer', borderBottom: mode === 'signup' ? '2px solid #F4C430' : 'none' }}
                        onClick={() => setMode('signup')}
                    >
                        Registrati
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {error && (
                        <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px', borderRadius: '4px', marginBottom: '10px', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    {mode === 'signup' && (
                        <>
                            <div className="form-section">
                                <label className="input-label">Username</label>
                                <input
                                    type="text"
                                    className="text-input"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required={mode === 'signup'}
                                    minLength={3}
                                />
                            </div>
                            <div className="form-section">
                                <label className="input-label">Nome Completo</label>
                                <input
                                    type="text"
                                    className="text-input"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="form-section">
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            className="text-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-section">
                        <label className="input-label">Password</label>
                        <input
                            type="password"
                            className="text-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Annulla</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Caricamento...' : (mode === 'signin' ? 'Entra' : 'Crea Account')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthModal;
