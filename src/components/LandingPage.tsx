"use client";
import React, { useState } from 'react';
import { useLayout } from '@/context/LayoutContext';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';

const LandingPage: React.FC = () => {
    const { setAppView } = useLayout();
    const { user } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // If user is already logged in, maybe redirect to Lobby?
    // For now we'll let them click "Gioca"

    return (
        <div className="landing-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: 'var(--background)',
            color: 'var(--foreground)',
            textAlign: 'center'
        }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', color: '#F4C430' }}>
                Yu-Gi-Oh! Platform
            </h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px', lineHeight: '1.6' }}>
                Benvenuto nella piattaforma di duelli definitiva.
                Gioca online con i tuoi amici, gestisci i tuoi LP e lancia i dadi in tempo reale.
            </p>

            <div className="landing-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                {user ? (
                    <button
                        className="btn-primary"
                        style={{ padding: '15px', fontSize: '1.1rem' }}
                        onClick={() => setAppView('lobby')}
                    >
                        Entra nella Lobby
                    </button>
                ) : (
                    <>
                        <button
                            className="btn-primary"
                            style={{
                                padding: '15px',
                                fontSize: '1.1rem',
                                background: '#F4C430',
                                color: '#000',
                                fontWeight: 'bold',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '8px'
                            }}
                            onClick={() => setIsAuthModalOpen(true)}
                        >
                            Accedi / Registrati
                        </button>
                        <button
                            className="btn-secondary"
                            style={{ padding: '15px', fontSize: '1.1rem' }}
                            onClick={() => setAppView('lobby')}
                        >
                            Entra come Ospite
                        </button>
                    </>
                )}
            </div>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};

export default LandingPage;
