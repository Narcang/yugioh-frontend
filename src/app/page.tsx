"use client";
import React, { useEffect, Suspense } from 'react';
import { useLayout } from '@/context/LayoutContext';
import GameRoom from '@/components/GameRoom';
import LandingPage from '@/components/LandingPage';
import Lobby from '@/components/Lobby';
import SettingsModal from '@/components/SettingsModal';
import { useSearchParams } from 'next/navigation';

function RoomUrlHandler() {
  const { setAppView, setCurrentRoomId } = useLayout();
  const searchParams = useSearchParams();

  useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId) {
      setCurrentRoomId(roomId);
      setAppView('game');
    }
  }, [searchParams, setCurrentRoomId, setAppView]);

  return null;
}

export default function Home() {
  const { appView } = useLayout();

  return (
    <main className="app-container">
      <Suspense fallback={null}>
        <RoomUrlHandler />
      </Suspense>
      {appView === 'landing' && <LandingPage />}
      {appView === 'lobby' && <Lobby />}
      {appView === 'game' && <GameRoom />}
      <SettingsModal />
    </main>
  );
}


