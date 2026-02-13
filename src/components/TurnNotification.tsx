import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLayout } from '@/context/LayoutContext';

const TurnNotification: React.FC = () => {
    const { currentTurn, isTurnChanging } = useLayout();
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isTurnChanging) {
            // Logic: `isTurnChanging` becomes true BEFORE currentTurn changes.
            // currentTurn is still the OLD turn (who pressed the button).
            // If I am 'self', I am passing to 'opponent'.
            // So if currentTurn is 'self', the turn is leaving me. I should NOT see "IL TUO TURNO".
            // If currentTurn is 'opponent', the turn is coming to me. I SHOULD see "IL TUO TURNO".

            // Wait, if I am 'self', `switchTurn` is called.
            // currentTurn is 'self'.
            // We want to show "IL TUO TURNO" ONLY if it is BECOMING my turn.
            // So if currentTurn is 'opponent'.

            if (currentTurn === 'opponent') {
                setVisible(true);

                const timer = setTimeout(() => {
                    setVisible(false);
                }, 3000); // Increased duration for dramatic effect
                return () => clearTimeout(timer);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTurnChanging]); // CRITICAL: Run only when isTurnChanging toggles, ignore currentTurn layout updates

    if (!visible || !mounted) return null;

    return createPortal(
        <div className="turn-notification-overlay">
            <div className="playtcg-text">
                IT'S YOUR TURN!
            </div>
            <style jsx>{`
                .turn-notification-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    pointer-events: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                .playtcg-text {
                    font-family: 'Times New Roman', serif;
                    font-size: 6rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    /* Logo Colors: Red/Orange Gradient or similar metallic style */
                    background: linear-gradient(180deg, #ffd700 0%, #daa520 40%, #8b6914 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.8));
                    
                    /* Stroke effect simulation using shadows since text-stroke transparent fill behavior is tricky */
                    /* Actually standard text-stroke with transparent fill works in modern browsers if background-clip is used carefully, 
                       but safer to use text-shadow for the black outline if gradients are involved. 
                       However, for the "Yu-Gi-Oh" look, we want a sharp outline. */
                    
                    position: relative;
                    animation: summonText 3s ease-in-out forwards;
                }
                
                /* Helper to create the black outline behind the gradient text */
                .playtcg-text::before {
                    content: "IT'S YOUR TURN!";
                    position: absolute;
                    left: 0;
                    top: 0;
                    z-index: -1;
                    /* Black outline */
                    -webkit-text-stroke: 12px black;
                    -webkit-text-fill-color: black;
                    text-shadow: 5px 5px 0px rgba(0,0,0,0.5);
                }

                 /* Inner White highlight for that "shiny" 3D feel */
                .playtcg-text::after {
                    content: "IT'S YOUR TURN!";
                    position: absolute;
                    left: 0;
                    top: 0;
                    z-index: -1;
                     -webkit-text-stroke: 2px white;
                    -webkit-text-fill-color: transparent;
                }

                @keyframes summonText {
                    0% { transform: scale(3); opacity: 0; letter-spacing: 20px; }
                    15% { transform: scale(1); opacity: 1; letter-spacing: 2px; }
                    80% { transform: scale(1); opacity: 1; letter-spacing: 2px; }
                    100% { transform: scale(1.1); opacity: 0; filter: blur(10px); }
                }

                /* Mobile adjustment */
                @media (max-width: 768px) {
                    .yugioh-text {
                        font-size: 3rem;
                    }
                    .yugioh-text::before {
                         -webkit-text-stroke: 6px black;
                    }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default TurnNotification;
