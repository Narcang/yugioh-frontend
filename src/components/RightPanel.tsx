import React, { useState, useEffect } from 'react';
import { useLayout } from '@/context/LayoutContext';

interface RightPanelProps {
    remoteStream?: MediaStream | null;
    onDeclareCard?: (card: any) => void;
    lastReceivedCard?: any | null;
    dataChannelState?: string;
}

interface CardData {
    id: string; // unique scan id
    name: string;
    desc: string;
    image_url: string;
    image_url_small: string;
    timestamp: number;
    // Optional extras for other games
    gameType?: string;
}

interface SearchResult {
    id: string; // YGO ID
    name: string;
    image_url: string;
    oracle_text?: string; // For Magic
    text?: string; // For One Piece
}

const RightPanel: React.FC<RightPanelProps> = ({ remoteStream, onDeclareCard, lastReceivedCard, dataChannelState }) => {
    const { gameType } = useLayout();

    // DEBUG: Log gameType on mount and changes
    useEffect(() => {
        console.log('[RightPanel] Current gameType:', gameType);
    }, [gameType]);

    const [activeTab, setActiveTab] = useState<'cards' | 'log'>('cards');
    const [scannedCards, setScannedCards] = useState<CardData[]>([]);
    const [zoomedCard, setZoomedCard] = useState<CardData | null>(null);

    // Sync: Listen for incoming cards
    useEffect(() => {
        if (lastReceivedCard) {
            // Check if we already have this card (by scanning ID or similar logic)
            // But usually we just add it because it's a new event
            setScannedCards(prev => {
                // Prevent duplicate if same data comes twice in ms
                if (prev.length > 0 && prev[0].timestamp === lastReceivedCard.timestamp && prev[0].name === lastReceivedCard.name) {
                    return prev;
                }
                return [lastReceivedCard, ...prev];
            });
            setActiveTab('cards');
        }
    }, [lastReceivedCard]);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Debounce Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setIsSearching(true);
                try {
                    // Include gameType in search
                    const currentType = gameType || 'Yugioh';
                    console.log(`[RightPanel] Searching for "${searchQuery}" in game: ${currentType}`);

                    const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&gameType=${encodeURIComponent(currentType)}`);
                    const data = await res.json();

                    console.log(`[RightPanel] Search results:`, data);

                    if (data.results) {
                        setSearchResults(data.results);
                    }
                } catch (e) {
                    console.error("Search error", e);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, gameType]); // Added gameType to dependencies!

    // Handle "Declare" (Clicking a result)
    const handleDeclareCard = async (result: SearchResult) => {
        const tempId = Math.random().toString(36).substr(2, 9);
        const timestamp = Date.now();

        // Initial Object (Optimistic)
        const newCard: CardData = {
            id: tempId,
            name: result.name,
            desc: "Caricamento effetti...",
            image_url: result.image_url,
            image_url_small: result.image_url,
            timestamp: timestamp
        };

        // 1. Show immediately locally
        setScannedCards(prev => [newCard, ...prev]);
        setSearchQuery('');
        setSearchResults([]);

        // 2. Fetch Details
        // Logic branches based on Game Type
        const currentGameType = gameType || 'Yugioh';

        if (currentGameType === 'Pokemon') {
            // Pokemon cards: the image contains all the information
            // Just set a simple description
            const updatedDesc = "Visualizza i dettagli sulla carta.";

            setScannedCards(prev => prev.map(c =>
                c.id === tempId ? { ...c, desc: updatedDesc } : c
            ));

            // Broadcast to opponent
            if (onDeclareCard) {
                console.log("Broadcasting Pokemon card:", newCard.name);
                onDeclareCard({ ...newCard, desc: updatedDesc });
            }

        } else if (currentGameType === 'Magic' || currentGameType === 'Magic: The Gathering') {
            // Magic Logic
            // The text is already in the search result (passed from Python > route.ts)
            const magicDesc = result.oracle_text || "Nessun effetto disponibile.";

            setScannedCards(prev => prev.map(c =>
                c.id === tempId ? { ...c, desc: magicDesc } : c
            ));


            if (onDeclareCard) {
                console.log("Broadcasting Magic card:", newCard.name);
                onDeclareCard({ ...newCard, desc: magicDesc });
            }

        } else if (currentGameType === 'OnePiece' || currentGameType === 'One Piece') {
            // One Piece Logic
            const opDesc = result.text || "Nessun effetto disponibile.";

            setScannedCards(prev => prev.map(c =>
                c.id === tempId ? { ...c, desc: opDesc } : c
            ));

            if (onDeclareCard) {
                console.log("Broadcasting One Piece card:", newCard.name);
                onDeclareCard({ ...newCard, desc: opDesc });
            }

        } else {
            // YUGIOH Logic (Existing)
            const fetchDetails = async (lang?: string) => {
                const langParam = lang ? `&language=${lang}` : '';
                const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${result.id}${langParam}`);
                if (!res.ok) throw new Error("API Error");
                return await res.json();
            };

            try {
                let data;
                // A. Try Italian first
                try {
                    data = await fetchDetails('it');
                } catch {
                    console.warn("IT fetch warning, retrying EN...");
                }

                // B. Fallback to English if Italian failed
                if (!data || !data.data) {
                    try {
                        data = await fetchDetails();
                    } catch (e) {
                        console.error("EN fetch failed too", e);
                    }
                }

                let finalDesc = "Nessun effetto disponibile.";
                if (data && data.data && data.data.length > 0) {
                    finalDesc = data.data[0].desc;
                }

                // Update local state
                setScannedCards(prev => prev.map(c =>
                    c.id === tempId ? { ...c, desc: finalDesc } : c
                ));

                // Broadcast to opponent
                if (onDeclareCard) {
                    console.log("Broadcasting YuGiOh card:", newCard.name);
                    onDeclareCard({ ...newCard, desc: finalDesc });
                }
            } catch (e) {
                console.error("Desc fetch fatal error", e);
                const errorDesc = "Errore di connessione. Impossibile scaricare l'effetto.";

                setScannedCards(prev => prev.map(c =>
                    c.id === tempId ? { ...c, desc: errorDesc } : c
                ));

                if (onDeclareCard) {
                    onDeclareCard({ ...newCard, desc: errorDesc });
                }
            }
        }
    };

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
                    Logs
                </button>
            </div>

            {/* SEARCH / DECLARE SECTION */}
            <div className="search-section">
                <div className="search-wrapper">
                    <input
                        type="text"
                        placeholder="Cerca carta (es. Mago Nero)..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    {isSearching && <div className="search-spinner"></div>}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="search-results-list">
                        {searchResults.map(res => (
                            <div
                                key={res.id}
                                className="search-result-item"
                                onClick={() => handleDeclareCard(res)}
                            >
                                <img src={res.image_url} alt="" />
                                <span>{res.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="panel-content">
                {activeTab === 'cards' ? (
                    <div className="cards-view">

                        {/* Latest Card */}
                        {scannedCards.length > 0 && (
                            <div className="latest-card-section">
                                <h4 className="section-title">IN GIOCO (ULTIMA)</h4>
                                <div
                                    className="card-display-large"
                                    onClick={() => setZoomedCard(scannedCards[0])}
                                >
                                    <img src={scannedCards[0].image_url} alt={scannedCards[0].name} />
                                    <div className="card-name-overlay">{scannedCards[0].name}</div>
                                </div>

                                {/* INLINE DESCRIPTION */}
                                <div className="active-card-desc">
                                    {scannedCards[0].desc}
                                </div>
                            </div>
                        )}

                        <div className="separator-line"></div>

                        {/* History */}
                        <div className="history-section">
                            <h4 className="section-title">STORICO GIOCATE</h4>
                            <div className="history-list">
                                {scannedCards.slice(1).map(card => (
                                    <div
                                        key={card.id}
                                        className="history-item"
                                        onClick={() => setZoomedCard(card)}
                                    >
                                        <img src={card.image_url_small} alt={card.name} className="history-thumb" />
                                        <div className="history-info">
                                            <div className="history-name">{card.name}</div>
                                            <div className="history-time">{new Date(card.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                    </div>
                                ))}
                                {scannedCards.length <= 1 && (
                                    <div className="empty-history">Nessuna carta giocata</div>
                                )}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="log-view">
                        <div className="debug-log-container" style={{ padding: '10px', fontSize: '11px', fontFamily: 'monospace', color: '#888' }}>
                            <div style={{ marginBottom: '10px', color: '#FCD34D' }}>DEBUG STATUS</div>
                            <div>Stream: {remoteStream ? "ACTIVE" : "NO STREAM"}</div>
                            <div>DataChannel: {dataChannelState || "CLOSED"}</div>
                            <div>Sync Listener: {lastReceivedCard ? "ACTIVE" : "WAITING"}</div>
                            <div style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '5px' }}>EVENT LOG:</div>
                            {scannedCards.map(c => (
                                <div key={c.id + "-log"}>[{new Date(c.timestamp).toLocaleTimeString()}] Rx: {c.name}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Zoom Modal */}
            {zoomedCard && (
                <div className="card-zoom-modal" onClick={() => setZoomedCard(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setZoomedCard(null)}>✕</button>
                        <div className="modal-body">
                            <img src={zoomedCard.image_url} alt={zoomedCard.name} className="zoomed-image" />
                            <div className="zoomed-details">
                                <h2>{zoomedCard.name}</h2>
                                <p className="card-desc">{zoomedCard.desc || "Caricamento effetto..."}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .active-card-desc {
                    padding: 10px;
                    font-size: 13px;
                    color: #ddd;
                    background: #222;
                    border: 1px solid #333;
                    border-radius: 4px;
                    max-height: 200px;
                    overflow-y: auto;
                    white-space: pre-wrap;
                    margin-top: 10px;
                    line-height: 1.4;
                    box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
                }
                .search-section {
                    padding: 10px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    position: relative;
                }
                .search-wrapper {
                    position: relative;
                }
                .search-input {
                    width: 100%;
                    padding: 10px;
                    background: #222;
                    border: 1px solid #444;
                    color: white;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .search-input:focus {
                    outline: none;
                    border-color: #FCD34D;
                }
                .search-spinner {
                    position: absolute;
                    right: 10px;
                    top: 10px;
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                .search-results-list {
                    max-height: 250px;
                    overflow-y: auto;
                    background: #222;
                    border-radius: 6px;
                    border: 1px solid #444;
                    position: absolute;
                    top: 50px;
                    left: 10px;
                    right: 10px;
                    z-index: 100;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                }
                .search-result-item {
                    padding: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    border-bottom: 1px solid #333;
                }
                .search-result-item:hover {
                    background-color: #333;
                }
                .search-result-item img {
                    width: 30px;
                    height: 44px;
                    object-fit: cover;
                }
                .search-result-item span {
                    font-size: 14px;
                }

                .section-title {
                    font-size: 11px;
                    color: var(--text-muted);
                    margin: 10px 0 5px 0;
                    letter-spacing: 1px;
                    font-weight: bold;
                }
                .card-display-large {
                    width: 100%;
                    max-width: 180px; /* STRICT LIMIT */
                    margin: 0 auto;
                    aspect-ratio: 0.65;
                    border-radius: 6px;
                    overflow: hidden;
                    position: relative;
                    cursor: pointer;
                    border: 2px solid #FCD34D;
                    box-shadow: 0 0 10px rgba(252, 211, 77, 0.2);
                    background: #222;
                }
                .card-display-large img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain; /* Ensure full art visible */
                }
                .card-name-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0,0,0,0.85);
                    color: white;
                    padding: 8px;
                    font-size: 14px;
                    text-align: center;
                    font-weight: bold;
                    border-top: 1px solid #444;
                }
                .separator-line {
                    height: 1px;
                    background: var(--border-color);
                    margin: 20px 0;
                }
                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .history-item {
                    display: flex;
                    gap: 10px;
                    padding: 8px;
                    background: var(--bg-secondary);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background 0.2s;
                    border: 1px solid transparent;
                }
                .history-item:hover {
                    background: var(--bg-hover);
                    border-color: #555;
                }
                .history-thumb {
                    width: 40px;
                    height: 58px;
                    object-fit: cover;
                    border-radius: 4px;
                }
                .history-info {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .history-name {
                    font-weight: bold;
                    font-size: 13px;
                }
                .history-time {
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .empty-history {
                    font-size: 12px;
                    color: var(--text-muted);
                    font-style: italic;
                    text-align: center;
                    padding: 10px;
                }

                /* Modal Styles */
                .card-zoom-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0,0,0,0.85);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(5px);
                }
                .modal-content {
                    background: #1a1a1a;
                    width: 90%;
                    max-width: 800px;
                    height: 80vh;
                    border-radius: 12px;
                    position: relative;
                    display: flex;
                    overflow: hidden;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    border: 1px solid #333;
                }
                .close-btn {
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    z-index: 10;
                }
                .modal-body {
                    display: flex;
                    width: 100%;
                    height: 100%;
                }
                .zoomed-image {
                    height: 100%;
                    width: auto;
                    max-width: 55%;
                    object-fit: contain;
                    background: #0d0d0d;
                }
                .zoomed-details {
                    padding: 30px;
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    background: #1a1a1a;
                }
                .zoomed-details h2 {
                    margin-top: 0;
                    color: #ffd700;
                    font-family: 'Times New Roman', serif;
                    font-size: 32px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .card-desc {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #e0e0e0;
                    white-space: pre-wrap;
                }

                @media (max-width: 768px) {
                    .modal-content {
                        flex-direction: column;
                        height: 90vh;
                    }
                    .zoomed-image {
                        max-width: 100%;
                        height: 50%;
                    }
                    .zoomed-details {
                        height: 50%;
                        padding: 20px;
                    }
                }
            `}</style>
        </aside>
    );
};

export default RightPanel;
