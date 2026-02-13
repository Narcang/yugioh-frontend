"use client";
import React, { useEffect, Suspense } from 'react';
import { useLayout } from '@/context/LayoutContext';
import GameRoom from '@/components/GameRoom';
import LandingPage from '@/components/LandingPage';
import Lobby from '@/components/Lobby';
import SettingsModal from '@/components/SettingsModal';
import { useSearchParams } from 'next/navigation';

import { supabase } from '@/lib/supabaseClient';

function RoomUrlHandler() {
  const { setAppView, setCurrentRoomId, setGameType, setCurrentPhase } = useLayout();
  const searchParams = useSearchParams();

  useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId) {
      const fetchRoomDetails = async () => {
        try {
          const { data: room, error } = await supabase
            .from('rooms')
            .select('settings')
            .eq('id', roomId)
            .single();

          if (room && room.settings && room.settings.gameType) {
            const gameType = room.settings.gameType;
            setGameType(gameType);

            // Initialize phase based on game type
            let firstPhase = 'Draw Phase';
            if (gameType === 'Magic') firstPhase = 'Beginning Phase';
            else if (gameType === 'Pokemon') firstPhase = 'Draw Phase';
            else if (gameType === 'One Piece') firstPhase = 'Refresh Phase';
            else if (gameType === 'Dragon Ball') firstPhase = 'Charge Phase';
            else if (gameType === 'Riftbound') firstPhase = 'Awaken Phase';

            setCurrentPhase(firstPhase);
          }
        } catch (err) {
          console.error("Error fetching room details:", err);
        }

        setCurrentRoomId(roomId);
        setAppView('game');
      };

      fetchRoomDetails();
    }
  }, [searchParams, setCurrentRoomId, setAppView, setGameType, setCurrentPhase]);

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


