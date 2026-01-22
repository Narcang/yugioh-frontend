"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

type LayoutMode = 'grid' | 'fullscreen' | 'boxed'; // grid=50/50, fullscreen=100/0, boxed=PIP
type SpotlightTarget = 'self' | 'opponent';
type TurnState = 'self' | 'opponent';

interface LayoutContextType {
    layoutMode: LayoutMode;
    spotlightTarget: SpotlightTarget;
    isSidebarCollapsed: boolean;
    isSettingsOpen: boolean;
    autoSwitchSpotlight: boolean;
    isDiceModalOpen: boolean;
    appView: 'landing' | 'lobby' | 'game';
    currentRoomId: string | null;
    videoFitMode: 'cover' | 'contain';
    currentTurn: TurnState;
    isTurnChanging: boolean;
    selfTimeLeft: number;
    opponentTimeLeft: number;
    timeLimit: number;
    setLayoutMode: (mode: LayoutMode) => void;
    setSpotlightTarget: (target: SpotlightTarget) => void;
    switchTurn: () => void;
    setIsSidebarCollapsed: (collapsed: boolean) => void;
    setIsSettingsOpen: (isOpen: boolean) => void;
    setAutoSwitchSpotlight: (autoSwitch: boolean) => void;
    setIsDiceModalOpen: (isOpen: boolean) => void;
    setAppView: (view: 'landing' | 'lobby' | 'game') => void;
    setCurrentRoomId: (id: string | null) => void;
    setVideoFitMode: (mode: 'cover' | 'contain') => void;
    setTimeLimit: (minutes: number) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
    const [spotlightTarget, setSpotlightTarget] = useState<SpotlightTarget>('opponent'); // Default to watching opponent
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [autoSwitchSpotlight, setAutoSwitchSpotlight] = useState(false);
    const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
    const [appView, setAppView] = useState<'landing' | 'lobby' | 'game'>('landing');
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [videoFitMode, setVideoFitMode] = useState<'cover' | 'contain'>('contain');

    // Turn State
    const [currentTurn, setCurrentTurn] = useState<TurnState>('self'); // Default to self for now
    const [isTurnChanging, setIsTurnChanging] = useState(false);

    // Timer State
    const [timeLimit, setTimeLimit] = useState(40); // Total Match Time in Minutes
    // Initialize split timers (e.g. 40 total -> 20 each)
    const [selfTimeLeft, setSelfTimeLeft] = useState((40 / 2) * 60);
    const [opponentTimeLeft, setOpponentTimeLeft] = useState((40 / 2) * 60);

    // Timer Countdown
    React.useEffect(() => {
        if (timeLimit === 0) return; // No limit

        const timer = setInterval(() => {
            if (currentTurn === 'self') {
                setSelfTimeLeft((prev) => {
                    if (prev <= 0) return 0; // Game Over Logic to be handled
                    return prev - 1;
                });
            } else {
                setOpponentTimeLeft((prev) => {
                    if (prev <= 0) return 0;
                    return prev - 1;
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLimit, currentTurn]);

    // Effect to update timers when timeLimit changes (Reset Game)
    React.useEffect(() => {
        const halfTimeSeconds = (timeLimit / 2) * 60;
        setSelfTimeLeft(halfTimeSeconds);
        setOpponentTimeLeft(halfTimeSeconds);
    }, [timeLimit]);

    const switchTurn = () => {
        if (isTurnChanging) return;
        setIsTurnChanging(true);
        setTimeout(() => {
            setCurrentTurn(prev => prev === 'self' ? 'opponent' : 'self');
            // Auto switch spotlight to active player? Maybe. Use preference.
            if (autoSwitchSpotlight) {
                setSpotlightTarget(currentTurn === 'self' ? 'opponent' : 'self');
            }
        }, 1000); // Wait for animation half-way? Or just change it immediately and let animation play?

        // Let's change state immediately for logic, but animation handles visual
        // Actually for "PASS TURN", usually we want a delay. 
        // Let's do: Start Animation -> Change State -> End Animation

        setTimeout(() => {
            setIsTurnChanging(false);
        }, 2000); // 2s total animation duration
    };

    return (
        <LayoutContext.Provider value={{
            layoutMode,
            spotlightTarget,
            isSidebarCollapsed,
            isSettingsOpen,
            autoSwitchSpotlight,
            isDiceModalOpen,
            appView,
            currentRoomId,
            setLayoutMode,
            setSpotlightTarget,
            setIsSidebarCollapsed,
            setIsSettingsOpen,
            setAutoSwitchSpotlight,
            setIsDiceModalOpen,
            setAppView,
            setCurrentRoomId,
            videoFitMode,
            setVideoFitMode,
            currentTurn,
            isTurnChanging,
            switchTurn,
            selfTimeLeft,
            opponentTimeLeft,
            timeLimit,
            setTimeLimit,
        }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
