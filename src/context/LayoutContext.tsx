"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

type LayoutMode = 'grid' | 'fullscreen' | 'boxed'; // grid=50/50, fullscreen=100/0, boxed=PIP
type SpotlightTarget = 'self' | 'opponent';

interface LayoutContextType {
    layoutMode: LayoutMode;
    spotlightTarget: SpotlightTarget;
    isSidebarCollapsed: boolean;
    isSettingsOpen: boolean;
    autoSwitchSpotlight: boolean;
    isDiceModalOpen: boolean;
    appView: 'lobby' | 'game';
    currentRoomId: string | null;
    setLayoutMode: (mode: LayoutMode) => void;
    setSpotlightTarget: (target: SpotlightTarget) => void;
    setIsSidebarCollapsed: (collapsed: boolean) => void;
    setIsSettingsOpen: (isOpen: boolean) => void;
    setAutoSwitchSpotlight: (autoSwitch: boolean) => void;
    setIsDiceModalOpen: (isOpen: boolean) => void;
    setAppView: (view: 'lobby' | 'game') => void;
    setCurrentRoomId: (id: string | null) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
    const [spotlightTarget, setSpotlightTarget] = useState<SpotlightTarget>('opponent'); // Default to watching opponent
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [autoSwitchSpotlight, setAutoSwitchSpotlight] = useState(false);
    const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
    const [appView, setAppView] = useState<'lobby' | 'game'>('lobby');
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

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
            setCurrentRoomId
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
