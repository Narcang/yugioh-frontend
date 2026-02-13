"use client";
import React, { useState, useEffect } from 'react';
import { useLayout } from '@/context/LayoutContext';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (roomData: RoomData) => void;
}

export interface RoomData {
    name: string;
    gameType: string;
    format: string;
    description: string;
    isPublic: boolean;
    language: string;
}

const GAME_FORMATS: Record<string, string[]> = {
    "Yugioh": [
        "Advanced (TCG)",
        "Traditional",
        "GOAT Format",
        "Edison Format",
        "Speed Duel",
        "Rush Duel"
    ],
    "Magic": ["Standard", "Modern", "Commander", "Legacy", "Vintage", "Pauper"],
    "Pokemon": ["Standard", "Expanded", "Unlimited"],
    "One Piece": ["Standard"],
    "Dragon Ball": ["Standard"],
    "Riftbound": ["Standard"]
};

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [gameType, setGameType] = useState('Yugioh');
    const [format, setFormat] = useState(GAME_FORMATS['Yugioh'][0]);
    const [language, setLanguage] = useState('ITA');
    const [isPublic, setIsPublic] = useState(true);
    const [description, setDescription] = useState('');

    // Update format when game type changes
    useEffect(() => {
        setFormat(GAME_FORMATS[gameType][0]);
    }, [gameType]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ name, gameType, format, isPublic, description, language });
        onClose();
        // Reset form
        setName('');
        setDescription('');
    };

    return (
        <div className="modal-overlay">
            <div className="create-room-modal">
                <div className="modal-header">
                    <h2>Crea nuova partita</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-section">
                        <label className="input-label">Nome Lobby</label>
                        <input
                            type="text"
                            className="text-input"
                            placeholder="Inserisci il nome della stanza..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                        <div className="form-section" style={{ flex: 1 }}>
                            <label className="input-label">Gioco</label>
                            <select
                                className="select-input"
                                value={gameType}
                                onChange={(e) => setGameType(e.target.value)}
                            >
                                {Object.keys(GAME_FORMATS).map(game => (
                                    <option key={game} value={game}>{game}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-section" style={{ flex: 1 }}>
                            <label className="input-label">Lingua</label>
                            <select
                                className="select-input"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="ITA">Italiano</option>
                                <option value="ENG">English</option>
                                <option value="ESP">Español</option>
                                <option value="DEU">Deutsch</option>
                                <option value="FRA">Français</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <label className="input-label">Formato</label>
                        <select
                            className="select-input"
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                        >
                            {GAME_FORMATS[gameType].map(fmt => (
                                <option key={fmt} value={fmt}>{fmt}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-section checkbox-section">
                        <label className="toggle-switch-container">
                            <span className="input-label" style={{ marginBottom: 0 }}>Partita Pubblica</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </label>
                        <p className="helper-text">
                            {isPublic ? 'Chiunque può unirsi alla partita.' : 'La partita sarà accessibile solo tramite invito.'}
                        </p>
                    </div>

                    <div className="form-section">
                        <label className="input-label">Descrizione (Facoltativa)</label>
                        <textarea
                            className="text-input textarea"
                            placeholder="Aggiungi dettagli..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Annulla</button>
                        <button type="submit" className="btn-primary">Crea Lobby</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRoomModal;
