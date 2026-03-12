"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        // Free TURN relay servers (Open Relay) — required for symmetric NAT / mobile networks
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        // Backup free TURN — numb.viagenie.ca
        {
            urls: 'turn:numb.viagenie.ca',
            username: 'webrtc@live.com',
            credential: 'muazkh'
        },
    ]
};

export const useWebRTC = (roomId: string | null, localStream: MediaStream | null, username: string = 'User') => {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [remoteUsername, setRemoteUsername] = useState<string | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const channel = useRef<RealtimeChannel | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const clientId = useRef(Math.random().toString(36).substring(7));

    // Track whether we're subscribed to Supabase (so we don't send signals too early)
    const isSubscribed = useRef(false);
    // Track whether we are the offerer (lower clientId wins the tie-breaker)
    const isOfferer = useRef(false);

    // DATA CHANNEL REFS
    const dataChannel = useRef<RTCDataChannel | null>(null);

    const [latestReceivedCard, setLatestReceivedCard] = useState<any | null>(null);
    const [latestReceivedLP, setLatestReceivedLP] = useState<number | null>(null);
    const [latestReceivedPhase, setLatestReceivedPhase] = useState<string | null>(null);
    const [latestReceivePassTurn, setLatestReceivePassTurn] = useState<number | null>(null);

    const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

    // DEBUG STATE
    const [dataChannelState, setDataChannelState] = useState<string>('closed');
    const [iceConnectionState, setIceConnectionState] = useState<string>('new');
    const [connectionLogs, setConnectionLogs] = useState<string[]>([]);

    const addLog = useCallback((msg: string) => {
        const log = `[${new Date().toLocaleTimeString()}] ${msg}`;
        console.log(log);
        setConnectionLogs(prev => [log, ...prev].slice(0, 50));
    }, []);

    // ─────────────────────────────────────────────────────────────────
    // UTILITY: Setup data channel message handler (shared by offerer/answerer)
    // ─────────────────────────────────────────────────────────────────
    const setupDataChannelHandlers = useCallback((dc: RTCDataChannel) => {
        let keepaliveInterval: ReturnType<typeof setInterval> | null = null;

        dc.onopen = () => {
            addLog('DataChannel open');
            setDataChannelState('open');
            // Send a keepalive ping every 10s to prevent ICE from timing out
            keepaliveInterval = setInterval(() => {
                if (dc.readyState === 'open') {
                    try { dc.send(JSON.stringify({ type: 'ping', data: Date.now() })); } catch (_) { }
                }
            }, 10000);
        };
        dc.onclose = () => {
            addLog('DataChannel closed');
            setDataChannelState('closed');
            if (keepaliveInterval) clearInterval(keepaliveInterval);
        };
        dc.onmessage = (msg) => {
            try {
                const parsed = JSON.parse(msg.data);
                if (parsed.type === 'ping') return; // ignore keepalive pings
                if (parsed.type === 'card-declared') setLatestReceivedCard(parsed.data);
                if (parsed.type === 'lp-update') setLatestReceivedLP(parsed.data);
                if (parsed.type === 'phase-update') setLatestReceivedPhase(parsed.data);
                if (parsed.type === 'pass-turn') setLatestReceivePassTurn(parsed.data);
            } catch (e) { }
        };
    }, [addLog]);

    // ─────────────────────────────────────────────────────────────────
    // UTILITY: createAndSendOffer — called both on negotiationneeded and on ready
    // ─────────────────────────────────────────────────────────────────
    const createAndSendOffer = useCallback(async (pc: RTCPeerConnection) => {
        try {
            addLog('Creating offer...');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            addLog('Sending OFFER...');
            channel.current?.send({ type: 'broadcast', event: 'offer', payload: { offer, username } });
        } catch (e) {
            addLog(`Error creating OFFER: ${e}`);
        }
    }, [addLog, username]);

    // ─────────────────────────────────────────────────────────────────
    // EFFECT 1 — PeerConnection + Supabase Signaling (depends only on roomId)
    // ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!roomId) return;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnection.current = pc;
        iceCandidatesQueue.current = [];
        isSubscribed.current = false;
        isOfferer.current = false;
        addLog('PeerConnection initialized');

        // Handle incoming tracks from remote peer
        pc.ontrack = (event) => {
            addLog(`Received remote track: ${event.track.kind} — stream id: ${event.streams[0]?.id}`);
            setRemoteStream(event.streams[0]);
            setIsConnected(true);
        };

        // Send ICE candidates via Supabase broadcast
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.current?.send({
                    type: 'broadcast',
                    event: 'ice-candidate',
                    payload: event.candidate
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            addLog(`ICE State: ${state}`);
            setIceConnectionState(state);
            if (state === 'failed') {
                addLog('ICE failed — trying restartIce()');
                pc.restartIce();
            }
            // Also restart on disconnected (recovers faster than waiting for 'failed')
            if (state === 'disconnected') {
                addLog('ICE disconnected — scheduling restartIce() in 2s...');
                setTimeout(() => {
                    if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                        pc.restartIce();
                    }
                }, 2000);
            }
        };

        pc.onconnectionstatechange = () => {
            addLog(`Connection State: ${pc.connectionState}`);
            if (pc.connectionState === 'connected') setIsConnected(true);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') setIsConnected(false);
        };

        // ── KEY FIX: Handle onnegotiationneeded ──
        // This fires when addTrack() is called. We create a new offer automatically.
        // Only the offerer side initiates renegotiation to avoid collisions.
        pc.onnegotiationneeded = async () => {
            if (!isOfferer.current || !isSubscribed.current) {
                addLog(`negotiationneeded skipped (offerer=${isOfferer.current}, subscribed=${isSubscribed.current})`);
                return;
            }
            addLog('negotiationneeded — re-creating offer with tracks...');
            await createAndSendOffer(pc);
        };

        // Answerer receives a data channel created by the offerer
        pc.ondatachannel = (event) => {
            addLog(`Received DataChannel: ${event.channel.label}`);
            dataChannel.current = event.channel;
            setupDataChannelHandlers(event.channel);
        };

        // ── Supabase Signaling ──
        const signaling = supabase.channel(`webrtc:${roomId}`);
        channel.current = signaling;

        signaling
            .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
                const candidate = new RTCIceCandidate(payload);
                if (pc.remoteDescription?.type) {
                    await pc.addIceCandidate(candidate).catch(e => addLog(`addIceCandidate error: ${e}`));
                } else {
                    iceCandidatesQueue.current.push(candidate);
                }
            })
            // ── Supabase fallback for game state (when DataChannel is not ready) ──
            .on('broadcast', { event: 'card-declared' }, ({ payload }) => { setLatestReceivedCard(payload); })
            .on('broadcast', { event: 'lp-update' }, ({ payload }) => { setLatestReceivedLP(payload); })
            .on('broadcast', { event: 'phase-update' }, ({ payload }) => { setLatestReceivedPhase(payload); })
            .on('broadcast', { event: 'pass-turn' }, ({ payload }) => { setLatestReceivePassTurn(payload); })
            // ── Offer/Answer ──
            .on('broadcast', { event: 'offer' }, async ({ payload }) => {
                try {
                    addLog(`Received OFFER from ${payload.username}`);
                    if (payload.username) setRemoteUsername(payload.username);
                    if (pc.signalingState !== 'stable' || pc.currentRemoteDescription) {
                        addLog('Ignored duplicate OFFER (already have remote desc or not stable)');
                        return;
                    }
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
                    // Flush queued ICE candidates
                    while (iceCandidatesQueue.current.length > 0) {
                        await pc.addIceCandidate(iceCandidatesQueue.current.shift()!);
                    }
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    addLog('Sending ANSWER...');
                    channel.current?.send({ type: 'broadcast', event: 'answer', payload: { answer, username } });
                } catch (e) { addLog(`Error handling OFFER: ${e}`); }
            })
            .on('broadcast', { event: 'answer' }, async ({ payload }) => {
                try {
                    addLog(`Received ANSWER from ${payload.username}`);
                    if (payload.username) setRemoteUsername(payload.username);
                    if (pc.currentRemoteDescription) {
                        addLog('Ignored duplicate ANSWER');
                        return;
                    }
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
                    while (iceCandidatesQueue.current.length > 0) {
                        await pc.addIceCandidate(iceCandidatesQueue.current.shift()!);
                    }
                } catch (e) { addLog(`Error handling ANSWER: ${e}`); }
            })
            .on('broadcast', { event: 'ready' }, async ({ payload }) => {
                const myId = clientId.current;
                const theirId = payload.clientId;
                if (payload.username) setRemoteUsername(payload.username);
                addLog(`READY received from ${theirId} (${payload.username})`);

                // Tie-breaker: lexicographically lower ID becomes the Offerer
                if (myId < theirId) {
                    isOfferer.current = true;
                    addLog('I am the OFFERER — creating DataChannel...');

                    // Only create DataChannel if not already existing
                    if (!dataChannel.current) {
                        const dc = pc.createDataChannel('game-events');
                        dataChannel.current = dc;
                        setupDataChannelHandlers(dc);
                    }

                    // ── KEY FIX: Add local tracks FIRST (if available), then negotiate ──
                    // onnegotiationneeded will fire automatically after addTrack,
                    // but we trigger manually here in case tracks were already added
                    // (onnegotiationneeded may have fired before isOfferer was set)
                    addLog('Triggering offer creation (post-ready)...');
                    await createAndSendOffer(pc);

                } else if (myId > theirId) {
                    isOfferer.current = false;
                    addLog('I am the ANSWERER — sending READY back just in case');
                    channel.current?.send({ type: 'broadcast', event: 'ready', payload: { clientId: myId, username } });
                }
            })
            .subscribe((status) => {
                addLog(`Supabase: ${status}`);
                if (status === 'SUBSCRIBED') {
                    isSubscribed.current = true;
                    addLog('Broadcasting READY...');
                    channel.current?.send({ type: 'broadcast', event: 'ready', payload: { clientId: clientId.current, username } });
                }
            });

        return () => {
            addLog('Cleaning up WebRTC...');
            isSubscribed.current = false;
            isOfferer.current = false;
            pc.close();
            peerConnection.current = null;
            dataChannel.current = null;
            supabase.removeChannel(signaling);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]); // ← ONLY roomId. localStream handled separately below.

    // ─────────────────────────────────────────────────────────────────
    // EFFECT 2 — Add/Replace tracks when localStream becomes available
    // This runs independently so a delayed stream still gets added correctly.
    // onnegotiationneeded will fire automatically after addTrack() if we are the offerer.
    // ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const pc = peerConnection.current;
        if (!pc || !localStream) return;

        const existingSenders = pc.getSenders();
        const newTracks = localStream.getTracks();

        addLog(`LocalStream ready — ${newTracks.length} track(s) to add/replace`);

        newTracks.forEach(track => {
            const existingSender = existingSenders.find(s => s.track?.kind === track.kind);
            if (existingSender) {
                // Re-negotiation: replace existing track (no new offer needed for same kind)
                addLog(`Replacing existing ${track.kind} track`);
                existingSender.replaceTrack(track).catch(e => addLog(`replaceTrack error: ${e}`));
            } else {
                // First time: add track — triggers onnegotiationneeded on the offerer side
                addLog(`Adding new ${track.kind} track`);
                pc.addTrack(track, localStream);
            }
        });
    }, [localStream, addLog]);

    // ─────────────────────────────────────────────────────────────────
    // GAME STATE SYNC — Data Channel with Supabase fallback
    // ─────────────────────────────────────────────────────────────────
    const sendViaChannel = useCallback((payload: string, supabaseEvent: string, supabasePayload: unknown) => {
        if (dataChannel.current?.readyState === 'open') {
            try {
                dataChannel.current.send(payload);
                return;
            } catch (e) { console.error('DC send error', e); }
        }
        // Fallback to Supabase broadcast
        channel.current?.send({ type: 'broadcast', event: supabaseEvent, payload: supabasePayload })
            .catch(e => console.error(`Supabase send error (${supabaseEvent}):`, e));
    }, []);

    const sendCard = useCallback((cardData: any) => {
        sendViaChannel(
            JSON.stringify({ type: 'card-declared', data: cardData }),
            'card-declared',
            cardData
        );
    }, [sendViaChannel]);

    const sendLP = useCallback((lp: number) => {
        sendViaChannel(
            JSON.stringify({ type: 'lp-update', data: lp }),
            'lp-update',
            lp
        );
    }, [sendViaChannel]);

    const sendPhase = useCallback((phase: string) => {
        sendViaChannel(
            JSON.stringify({ type: 'phase-update', data: phase }),
            'phase-update',
            phase
        );
    }, [sendViaChannel]);

    const sendPassTurn = useCallback(() => {
        sendViaChannel(
            JSON.stringify({ type: 'pass-turn', data: Date.now() }),
            'pass-turn',
            Date.now()
        );
    }, [sendViaChannel]);

    // ─────────────────────────────────────────────────────────────────
    // PING / RECONNECT utilities (referenced by GameRoom.tsx)
    // ─────────────────────────────────────────────────────────────────
    const sendPing = useCallback(() => {
        if (dataChannel.current?.readyState === 'open') {
            dataChannel.current.send(JSON.stringify({ type: 'ping', data: Date.now() }));
        }
    }, []);

    const reconnect = useCallback(() => {
        const pc = peerConnection.current;
        if (!pc) return;
        addLog('Manual reconnect: restarting ICE...');
        pc.restartIce();
    }, [addLog]);

    return {
        remoteStream,
        isConnected,
        remoteUsername,
        sendCard,
        latestReceivedCard,
        dataChannelState,
        sendLP,
        latestReceivedLP,
        sendPhase,
        latestReceivedPhase,
        sendPassTurn,
        latestReceivePassTurn,
        iceConnectionState,
        connectionLogs,
        sendPing,
        reconnect,
    };
};
