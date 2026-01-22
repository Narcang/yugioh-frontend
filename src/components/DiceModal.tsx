"use client";
import React, { useState } from 'react';
import { useLayout } from '@/context/LayoutContext';

const DiceModal: React.FC = () => {
    const { isDiceModalOpen, setIsDiceModalOpen } = useLayout();
    const [result, setResult] = useState<string | null>(null);
    const [resultType, setResultType] = useState<'coin' | 'dice' | null>(null);

    if (!isDiceModalOpen) return null;

    const handleClose = () => {
        setIsDiceModalOpen(false);
        setResult(null); // Reset result on close
        setResultType(null);
    };

    const handleCoinFlip = () => {
        const isHeads = Math.random() > 0.5;
        // Animation simulation here if needed, keeping it simple for now
        setResult(isHeads ? "Testa" : "Croce");
        setResultType('coin');
    };

    const handleDiceRoll = (sides: number) => {
        const value = Math.floor(Math.random() * sides) + 1;
        setResult(value.toString());
        setResultType('dice');
    };

    const diceOptions = [
        { label: "Lancio della moneta", action: handleCoinFlip },
        { label: "D4", action: () => handleDiceRoll(4) },
        { label: "D6", action: () => handleDiceRoll(6) },
        { label: "D8", action: () => handleDiceRoll(8) },
        { label: "D10", action: () => handleDiceRoll(10) },
        { label: "D12", action: () => handleDiceRoll(12) },
        { label: "D20", action: () => handleDiceRoll(20) },
    ];

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>

                {result ? (
                    <div className="dice-result-view">
                        <h2 className="view-title">Risultato</h2>

                        <div className="result-display">
                            {resultType === 'coin' && (
                                <div className="coin-icon">
                                    {result === "Testa" ? "🪙" : "🏵️"}
                                </div>
                            )}
                            {resultType === 'dice' && (
                                <div className="dice-icon">🎲</div>
                            )}
                            <div className="result-value">{result}</div>
                        </div>

                        <div className="modal-footer-single-btn">
                            <button className="primary-btn" onClick={() => setResult(null)}>Indietro</button>
                        </div>
                    </div>
                ) : (
                    <div className="modal-content" style={{ padding: 0 }}>
                        <div className="settings-group">
                            {diceOptions.map((option, index) => (
                                <div
                                    key={index}
                                    className="settings-item"
                                    onClick={option.action}
                                >
                                    <span className="item-label">{option.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiceModal;
