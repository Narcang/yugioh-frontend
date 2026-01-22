"use client";
import React, { useState } from 'react';
import { useLayout } from '@/context/LayoutContext';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (roomData: RoomData) => void;
}

export interface RoomData {
    name: string;
    format: string;
    description: string;
    isPublic: boolean;
    language: string;
    timeLimit: number;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [format, setFormat] = useState('Advanced');
    const [language, setLanguage] = useState('ITA');
    const [isPublic, setIsPublic] = useState(true);
    const [description, setDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState(40);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ name, format, isPublic, description, language, timeLimit });
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
                            <label className="input-label">Formato</label>
                            <select
                                className="select-input"
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                            >
                                <option value="Advanced">Advanced (TCG)</option>
                                <option value="Traditional">Traditional</option>
                                <option value="GOAT">GOAT Format</option>
                                <option value="Edison">Edison Format</option>
                                <option value="Speed Duel">Speed Duel</option>
                                <option value="Rush Duel">Rush Duel</option>
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
                        <label className="input-label">Tempo Limite (Minuti)</label>
                        <select
                            className="select-input"
                            value={timeLimit}
                            onChange={(e) => setTimeLimit(Number(e.target.value))}
                        >
                            <option value="0">Nessun Limite</option>
                            <option value="20">20 Minuti</option>
                            <option value="40">40 Minuti (Standard)</option>
                            <option value="60">60 Minuti</option>
                        </select>
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
