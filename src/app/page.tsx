"use client";
import React, { useEffect, Suspense } from 'react';
import { useLayout } from '@/context/LayoutContext';
import GameRoom from '@/components/GameRoom';
import Lobby from '@/components/Lobby';
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
      {appView === 'lobby' ? <Lobby /> : <GameRoom />}
    </main>
  );
}


