"use client";
import React, { useState } from 'react';

const RightPanel = () => {
    const [activeTab, setActiveTab] = useState<'cards' | 'log'>('cards');

    return (
        <aside className="right-panel">
            {/* Tab Header */}
            <div className="panel-tabs">
                <button
                    className={`panel-tab ${activeTab === 'cards' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cards')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 17l10 5 10-5M2 12l10 5 10-5M2 7l10 5 10-5" /></svg>
                    Carte
                </button>
                <button
                    className={`panel-tab ${activeTab === 'log' ? 'active' : ''}`}
                    onClick={() => setActiveTab('log')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    Registro di gioco
                </button>
            </div>

            {/* Content Area */}
            <div className="panel-content">
                {activeTab === 'cards' ? (
                    <div className="cards-view">
                        {/* Search Bar */}
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Ricerca..."
                                className="search-input"
                            />
                        </div>

                        {/* Filters */}
                        <div className="filters-container">
                            <label className="checkbox-item">
                                <input type="checkbox" />
                                <span>Includi carte speciali</span>
                            </label>
                            <label className="checkbox-item">
                                <input type="checkbox" />
                                <span>Includi più lingue</span>
                            </label>
                        </div>

                        <div className="separator"></div>

                        {/* Card Display Placeholder */}
                        <div className="card-preview-container">
                            <div className="card-placeholder-box">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="search-icon-placeholder"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            </div>
                            <span className="placeholder-text">Ultima carta</span>
                        </div>
                    </div>
                ) : (
                    <div className="log-view">
                        <div className="empty-log">
                            Nessuna attività registrata
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default RightPanel;
