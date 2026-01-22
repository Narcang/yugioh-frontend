"use client";
import React, { useState } from 'react';
import { useLayout } from '@/context/LayoutContext';
import { useMedia } from '@/context/MediaContext';

const SettingsModal: React.FC = () => {
    const { isSettingsOpen, setIsSettingsOpen, autoSwitchSpotlight, setAutoSwitchSpotlight, setAppView, videoFitMode, setVideoFitMode } = useLayout();
    const {
        videoDevices,
        audioInputDevices,
        audioOutputDevices,
        selectedVideoDeviceId,
        selectedAudioInputDeviceId,
        selectedAudioOutputDeviceId,
        changeDevice,
        zoom,
        setZoomLevel,
        zoomCapabilities
    } = useMedia();

    const [view, setView] = useState<'menu' | 'input' | 'preferences'>('menu');

    if (!isSettingsOpen) return null;

    const handleClose = () => {
        setIsSettingsOpen(false);
        setView('menu'); // Reset view on close
    };

    const handleLeaveGame = () => {
        setIsSettingsOpen(false);
        setAppView('lobby');
    };

    // Groups based on the screenshot structure
    const menuGroups = [
        [
            { label: "Configura input", action: () => setView('input') },
            { label: "Preferenze", action: () => setView('preferences') },
        ],
        [
            { label: "Abbandona partita", action: handleLeaveGame },
        ],
        [
            { label: "Ripristina partita", action: () => console.log("Ripristina partita") },
            { label: "Cambia partita in pubblica", action: () => console.log("Cambia partita in pubblica") },
            { label: "Attiva fasi", action: () => console.log("Attiva fasi") },
            { label: "Gestisci giocatori", action: () => console.log("Gestisci giocatori") },
            { label: "Rendi casuale l'ordine dei giocatori", action: () => console.log("Rendi casuale l'ordine") },
        ],
        [
            { label: "Chiudi partita", action: () => console.log("Chiudi partita") },
        ]
    ];

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>

                {view === 'menu' && (
                    <div className="modal-content" style={{ padding: 0 }}>
                        {menuGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="settings-group">
                                {group.map((item, itemIndex) => (
                                    <div
                                        key={itemIndex}
                                        className="settings-item"
                                        onClick={item.action}
                                    >
                                        <span className="item-label">{item.label}</span>
                                    </div>
                                ))}
                                {groupIndex < menuGroups.length - 1 && <div className="group-divider"></div>}
                            </div>
                        ))}
                    </div>
                )}

                {view === 'input' && (
                    <div className="input-config-view">
                        <h2 className="view-title">Configura input</h2>

                        <div className="config-form">
                            <div className="form-group">
                                <label>Fonte videocamera</label>
                                <select
                                    value={selectedVideoDeviceId}
                                    onChange={(e) => changeDevice('videoinput', e.target.value)}
                                >
                                    {videoDevices.map(device => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Fonte microfono</label>
                                <select
                                    value={selectedAudioInputDeviceId}
                                    onChange={(e) => changeDevice('audioinput', e.target.value)}
                                >
                                    {audioInputDevices.map(device => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Microfono ${device.deviceId.slice(0, 5)}...`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Fonte altoparlante</label>
                                <select
                                    value={selectedAudioOutputDeviceId}
                                    onChange={(e) => changeDevice('audiooutput', e.target.value)}
                                >
                                    {audioOutputDevices.map(device => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Speaker ${device.deviceId.slice(0, 5)}...`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="group-divider" style={{ margin: '20px 0' }}></div>

                        <h3 style={{ fontSize: '1rem', marginBottom: '15px', color: '#ccc' }}>Regolazioni Video</h3>

                        <div className="form-group">
                            <label style={{ marginBottom: '10px', display: 'block' }}>Inquadratura</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    className={`action-btn ${videoFitMode === 'cover' ? 'primary' : 'secondary'}`}
                                    onClick={() => setVideoFitMode('cover')}
                                    style={{ flex: 1, padding: '8px', opacity: videoFitMode === 'cover' ? 1 : 0.6, background: videoFitMode === 'cover' ? 'var(--accent-purple)' : '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Riempi (Cover)
                                </button>
                                <button
                                    className={`action-btn ${videoFitMode === 'contain' ? 'primary' : 'secondary'}`}
                                    onClick={() => setVideoFitMode('contain')}
                                    style={{ flex: 1, padding: '8px', opacity: videoFitMode === 'contain' ? 1 : 0.6, background: videoFitMode === 'contain' ? 'var(--accent-purple)' : '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Adatta (Intera)
                                </button>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                                "Riempi" taglia i bordi per riempire lo schermo. "Adatta" mostra tutta l'immagine della camera.
                            </p>
                        </div>

                        {zoomCapabilities && (
                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    Zoom Digitale
                                    <span>{zoom}x</span>
                                </label>
                                <input
                                    type="range"
                                    min={zoomCapabilities.min}
                                    max={zoomCapabilities.max}
                                    step={zoomCapabilities.step}
                                    value={zoom}
                                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                                    style={{ width: '100%', marginTop: '10px' }}
                                />
                            </div>
                        )}

                        <div className="modal-footer-single-btn">
                            <button className="primary-btn" onClick={handleClose}>Chiudi</button>
                        </div>
                    </div>
                )}

                {view === 'preferences' && (
                    <div className="input-config-view">
                        <h2 className="view-title">Preferenze</h2>

                        <div className="preferences-section">
                            <h4 className="section-title">LAYOUT IN PRIMO PIANO</h4>

                            <div className="preference-row">
                                <span className="preference-label">Cambia visuale in primo piano al cambio del turno</span>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={autoSwitchSpotlight}
                                        onChange={(e) => setAutoSwitchSpotlight(e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>

                        <div className="modal-footer-single-btn">
                            <button className="primary-btn" onClick={handleClose}>Chiudi</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsModal;
