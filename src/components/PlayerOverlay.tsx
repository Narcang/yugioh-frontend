"use client";
import React, { useState, useRef, useEffect } from 'react';

interface PlayerOverlayProps {
    name: string;
    isSelf?: boolean;
}

const PlayerOverlay: React.FC<PlayerOverlayProps> = ({ name, isSelf }) => {
    const [lifePoints, setLifePoints] = useState(8000);
    const [isEditing, setIsEditing] = useState<'add' | 'subtract' | null>(null);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleEditStart = (mode: 'add' | 'subtract') => {
        setIsEditing(mode);
        setInputValue('');
    };

    const handleConfirm = () => {
        const amount = parseInt(inputValue, 10);
        if (!isNaN(amount) && isEditing) {
            setLifePoints(prev => isEditing === 'add' ? prev + amount : prev - amount);
        }
        setIsEditing(null);
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            setIsEditing(null);
        }
    };

    return (
        <div className="player-overlay">
            {/* Top Bar with Name and Life Points */}
            <div className="overlay-header">

                {/* Life Points Counter */}
                <div className="lp-counter">
                    {isSelf && (
                        <button
                            className="lp-btn"
                            onClick={() => handleEditStart('subtract')}
                            title="Subtract LP"
                        >
                            −
                        </button>
                    )}

                    <div className="lp-value-container">
                        {isEditing ? (
                            <div className="lp-input-wrapper">
                                <span className="lp-operator">
                                    {isEditing === 'add' ? '+' : '−'}
                                </span>
                                <input
                                    ref={inputRef}
                                    type="number"
                                    className="lp-input"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onBlur={() => setTimeout(() => setIsEditing(null), 200)}
                                    placeholder="0"
                                />
                            </div>
                        ) : (
                            <div className="lp-value">
                                {lifePoints}
                            </div>
                        )}
                    </div>

                    {isSelf && (
                        <button
                            className="lp-btn"
                            onClick={() => handleEditStart('add')}
                            title="Add LP"
                        >
                            +
                        </button>
                    )}
                </div>

                {/* Player Name and Icons */}
                <div className="player-info">
                    <div className="center" style={{ gap: '8px' }}>
                        <span className={isSelf ? 'self-indicator' : 'hidden'}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        </span>
                        <span className="player-name">{name}</span>
                    </div>

                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                    </button>
                </div>

            </div>

        </div>
    );
};

export default PlayerOverlay;
