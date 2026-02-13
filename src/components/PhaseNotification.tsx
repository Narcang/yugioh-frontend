"use client";
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLayout } from '@/context/LayoutContext';
import { Cinzel } from 'next/font/google';

const cinzel = Cinzel({
    subsets: ['latin'],
    weight: ['700', '900'],
    display: 'swap',
});

const PhaseNotification: React.FC = () => {
    const { currentPhase } = useLayout();
    const [mounted, setMounted] = useState(false);
    const [animationKey, setAnimationKey] = useState(0);
    const [show, setShow] = useState(false);
    const prevPhase = useRef(currentPhase);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Trigger only on CHANGE
        if (currentPhase !== prevPhase.current) {
            prevPhase.current = currentPhase;
            setAnimationKey(prev => prev + 1); // Force re-render of animation
            setShow(true);

            const timer = setTimeout(() => {
                setShow(false);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [currentPhase]);

    if (!show || !mounted) return null;

    // Use inline styles for the container to be absolutely sure it works
    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 2147483647,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div className="phase-content" key={animationKey}>
                <div className={`phase-label ${cinzel.className}`}>PHASE CHANGE</div>
                <div className={`phase-name ${cinzel.className}`}>{currentPhase}</div>
            </div>

            <style jsx>{`
                .phase-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle at center, rgba(20, 20, 30, 0.95), rgba(0, 0, 0, 0.98));
                    padding: 40px 100px;
                    border: 4px double #F59E0B;
                    border-radius: 4px;
                    box-shadow: 
                        0 0 20px rgba(0, 0, 0, 0.8),
                        0 0 40px rgba(245, 158, 11, 0.2),
                        inset 0 0 20px rgba(245, 158, 11, 0.1);
                    animation: phaseEnter 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards;
                    backdrop-filter: blur(8px);
                    position: relative;
                }

                .phase-content::before {
                    content: '';
                    position: absolute;
                    top: -2px; left: -2px; right: -2px; bottom: -2px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    z-index: -1;
                    pointer-events: none;
                }

                .phase-label {
                    color: #F59E0B;
                    font-size: 18px;
                    letter-spacing: 8px;
                    margin-bottom: 5px;
                    font-weight: 700;
                    text-transform: uppercase;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }

                .phase-name {
                    color: white;
                    font-size: 72px;
                    font-weight: 900;
                    text-transform: uppercase;
                    text-shadow: 
                        0 4px 0px rgba(0,0,0,1),
                        0 0 20px rgba(245, 158, 11, 0.6);
                    white-space: nowrap;
                    letter-spacing: 2px;
                    background: linear-gradient(180deg, #FFFFFF 0%, #E5E7EB 50%, #9CA3AF 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                @keyframes phaseEnter {
                    0% {
                        transform: scale(0.8) translateY(20px);
                        opacity: 0;
                        filter: blur(10px);
                    }
                    100% {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                        filter: blur(0);
                    }
                }

                @media (max-width: 768px) {
                    .phase-name {
                        font-size: 40px;
                    }
                    .phase-content {
                        padding: 20px 40px;
                        width: 90%;
                    }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default PhaseNotification;
