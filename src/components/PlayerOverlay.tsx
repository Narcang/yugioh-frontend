"use client";
import React, { useState, useRef, useEffect } from 'react';

interface PlayerOverlayProps {
    name: string;
    isSelf?: boolean;
    onLpChange?: (lp: number) => void;
    currentLP?: number;
}

const PlayerOverlay: React.FC<PlayerOverlayProps> = ({ name, isSelf, onLpChange, currentLP }) => {
    const [lifePoints, setLifePoints] = useState(8000);
    const [step, setStep] = useState<number>(1000); // Default step 1000
    const [isHovered, setIsHovered] = useState(false);

    // Sync from props (Remote updates)
    useEffect(() => {
        if (typeof currentLP !== 'undefined') {
            setLifePoints(currentLP);
        }
    }, [currentLP]);

    const handleLpChange = (delta: 'add' | 'subtract') => {
        setLifePoints(prev => {
            const newVal = delta === 'add' ? prev + step : Math.max(0, prev - step);
            // Broadcast changes
            if (onLpChange) {
                onLpChange(newVal);
            }
            return newVal;
        });
    };

    return (
        <div
            className="player-overlay"
            onClick={(e) => e.stopPropagation()} // Prevent Full Screen toggle
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Top Bar with Name and Life Points */}
            <div className="overlay-header">

                {/* Life Points Counter */}
                <div className="lp-counter">
                    {isSelf && (
                        <button
                            className="lp-btn"
                            onClick={() => handleLpChange('subtract')}
                            title={`-${step} LP`}
                        >
                            −
                        </button>
                    )}

                    <div className="lp-value-container" style={{ flexDirection: 'column', gap: '2px' }}>
                        <div className="lp-value">
                            {lifePoints}
                        </div>
                        {/* Custom Step Input (Visible on Hover for Self) */}
                        {isSelf && isHovered && (
                            <div className="step-input-container" title="Change +/- Step">
                                <span style={{ fontSize: '10px', color: '#888' }}>STEP:</span>
                                <input
                                    type="number"
                                    className="step-input"
                                    value={step}
                                    onChange={(e) => setStep(Math.max(1, parseInt(e.target.value) || 0))}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                    </div>

                    {isSelf && (
                        <button
                            className="lp-btn"
                            onClick={() => handleLpChange('add')}
                            title={`+${step} LP`}
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

            <style jsx>{`
                .step-input-container {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    background: rgba(0,0,0,0.5);
                    padding: 2px 5px;
                    border-radius: 4px;
                    margin-top: -5px;
                }
                .step-input {
                    background: transparent;
                    border: none;
                    color: gold;
                    font-size: 11px;
                    width: 40px;
                    text-align: center;
                    outline: none;
                    font-family: monospace;
                    border-bottom: 1px solid #444;
                }
                .step-input:focus {
                    border-bottom-color: gold;
                }
                /* Remove spinner from number input */
                .step-input::-webkit-inner-spin-button, 
                .step-input::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
            `}</style>
        </div>
    );
};

export default PlayerOverlay;
