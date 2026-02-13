"use client";
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

export const useWebRTC = (roomId: string | null, localStream: MediaStream | null, username: string = 'User') => {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [remoteUsername, setRemoteUsername] = useState<string | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const channel = useRef<RealtimeChannel | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const clientId = useRef(Math.random().toString(36).substring(7));

    // DATA CHANNEL REFS
    const dataChannel = useRef<RTCDataChannel | null>(null);

    const [latestReceivedCard, setLatestReceivedCard] = useState<any | null>(null);
    const [latestReceivedLP, setLatestReceivedLP] = useState<number | null>(null);
    const [latestReceivedPhase, setLatestReceivedPhase] = useState<string | null>(null);
    const [latestReceivePassTurn, setLatestReceivePassTurn] = useState<number | null>(null);

    const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

    // DEBUG STATE
    const [dataChannelState, setDataChannelState] = useState<string>('closed');

    // NEW SYNCHRONIZATION: Send via Data Channel with Fallback
    const sendCard = (cardData: any) => {
        let sent = false;
        // 1. Try DataChannel
        if (dataChannel.current && dataChannel.current.readyState === 'open') {
            console.log("Sending via DataChannel:", cardData.name);
            const payload = JSON.stringify({ type: 'card-declared', data: cardData });
            try {
                dataChannel.current.send(payload);
                sent = true;
            } catch (e) { console.error("DC Send error", e); }
        }

        // 2. Fallback to Supabase Broadcast
        if (!sent) {
            console.warn("DataChannel not ready, falling back to Supabase Broadcast...", cardData.name);
            channel.current?.send({
                type: 'broadcast',
                event: 'card-declared',
                payload: cardData
            }).catch(err => console.error("Supabase Send error:", err));
        }
    };

    // LP SYNC
    const sendLP = (lp: number) => {
        let sent = false;
        const payload = JSON.stringify({ type: 'lp-update', data: lp });

        if (dataChannel.current && dataChannel.current.readyState === 'open') {
            try {
                dataChannel.current.send(payload);
                sent = true;
            } catch (e) { console.error("DC Send LP error", e); }
        }

        if (!sent) {
            channel.current?.send({
                type: 'broadcast',
                event: 'lp-update',
                payload: lp
            }).catch(err => console.error("Supabase Send LP error:", err));
        }
    };

    // PHASE SYNC
    const sendPhase = (phase: string) => {
        let sent = false;
        const payload = JSON.stringify({ type: 'phase-update', data: phase });

        if (dataChannel.current && dataChannel.current.readyState === 'open') {
            try {
                dataChannel.current.send(payload);
                sent = true;
            } catch (e) { console.error("DC Send Phase error", e); }
        }

        if (!sent) {
            channel.current?.send({
                type: 'broadcast',
                event: 'phase-update',
                payload: phase
            }).catch(err => console.error("Supabase Send Phase error:", err));
        }
    };

    // TURN SYNC
    const sendPassTurn = () => {
        let sent = false;
        const payload = JSON.stringify({ type: 'pass-turn', data: Date.now() });

        if (dataChannel.current && dataChannel.current.readyState === 'open') {
            try {
                dataChannel.current.send(payload);
                sent = true;
            } catch (e) { console.error("DC Send PassTurn error", e); }
        }

        if (!sent) {
            channel.current?.send({
                type: 'broadcast',
                event: 'pass-turn',
                payload: Date.now()
            }).catch(err => console.error("Supabase Send PassTurn error:", err));
        }
    };

    const [iceConnectionState, setIceConnectionState] = useState<string>('new');
    const [connectionLogs, setConnectionLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        const log = `[${new Date().toLocaleTimeString()}] ${msg}`;
        console.log(log);
        setConnectionLogs(prev => [log, ...prev].slice(0, 50)); // Keep last 50
    };

    useEffect(() => {
        if (!roomId) return;

        // Initialize Peer Connection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnection.current = pc;
        addLog(`PeerConnection initialized with STUN servers.`);

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
            addLog(`Local tracks added: ${localStream.getTracks().length}`);
        } else {
            addLog(`No local stream available yet.`);
        }

        // Handle incoming tracks
        pc.ontrack = (event) => {
            addLog(`Received remote track: ${event.streams[0].id}`);
            setRemoteStream(event.streams[0]);
            setIsConnected(true);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.current?.send({ type: 'broadcast', event: 'ice-candidate', payload: event.candidate });
            }
        };

        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            addLog(`ICE Connection State: ${state}`);
            setIceConnectionState(state);

            if (state === 'failed' || state === 'disconnected') {
                addLog("ICE connection lost. Consider manual reconnect.");
            }
        };

        pc.onconnectionstatechange = () => {
            addLog(`Peer Connection State: ${pc.connectionState}`);
        };

        // DATA CHANNEL: Handle Incoming Channel (Answerer side)
        pc.ondatachannel = (event) => {
            addLog(`Received Data Channel: ${event.channel.label}`);
            const receiveChannel = event.channel;
            dataChannel.current = receiveChannel;

            receiveChannel.onopen = () => setDataChannelState('open');
            receiveChannel.onclose = () => setDataChannelState('closed');

            receiveChannel.onmessage = (msg) => {
                try {
                    const parsed = JSON.parse(msg.data);
                    if (parsed.type === 'card-declared') setLatestReceivedCard(parsed.data);
                    if (parsed.type === 'lp-update') setLatestReceivedLP(parsed.data);
                    if (parsed.type === 'phase-update') setLatestReceivedPhase(parsed.data);
                    if (parsed.type === 'pass-turn') setLatestReceivePassTurn(parsed.data);
                } catch (e) { }
            };
        };

        // Initialize Supabase Signaling
        const signaling = supabase.channel(`room:${roomId}`);
        channel.current = signaling;

        signaling
            .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
                const candidate = new RTCIceCandidate(payload);
                if (pc.remoteDescription && pc.remoteDescription.type) await pc.addIceCandidate(candidate);
                else iceCandidatesQueue.current.push(candidate);
            })
            // LISTEN FOR SUPABASE FALLBACK MESSAGES
            .on('broadcast', { event: 'card-declared' }, ({ payload }) => {
                setLatestReceivedCard(payload);
            })
            .on('broadcast', { event: 'lp-update' }, ({ payload }) => {
                setLatestReceivedLP(payload);
            })
            .on('broadcast', { event: 'phase-update' }, ({ payload }) => {
                setLatestReceivedPhase(payload);
            })
            .on('broadcast', { event: 'pass-turn' }, ({ payload }) => {
                setLatestReceivePassTurn(payload);
            })
            .on('broadcast', { event: 'offer' }, async ({ payload }) => {
                try {
                    addLog(`Received OFFER from ${payload.username}`);
                    if (payload.username) setRemoteUsername(payload.username);
                    if (!pc.currentRemoteDescription) {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
                        while (iceCandidatesQueue.current.length > 0) await pc.addIceCandidate(iceCandidatesQueue.current.shift()!);

                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);

                        addLog(`Sending ANSWER...`);
                        channel.current?.send({ type: 'broadcast', event: 'answer', payload: { answer, username } });
                    } else {
                        addLog(`Ignored OFFER (RemoteDescription already set)`);
                    }
                } catch (e) { addLog(`Error handling offer: ${e}`); }
            })
            .on('broadcast', { event: 'answer' }, async ({ payload }) => {
                try {
                    addLog(`Received ANSWER from ${payload.username}`);
                    if (payload.username) setRemoteUsername(payload.username);
                    if (!pc.currentRemoteDescription) {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
                        while (iceCandidatesQueue.current.length > 0) await pc.addIceCandidate(iceCandidatesQueue.current.shift()!);
                    }
                } catch (e) { addLog(`Error handling answer: ${e}`); }
            })
            .on('broadcast', { event: 'ready' }, async ({ payload }) => {
                const myId = clientId.current;
                const theirId = payload.clientId;
                if (payload.username) setRemoteUsername(payload.username);
                addLog(`[Signaling] READY received from ${theirId} (${payload.username})`);

                // Tie-Breaker Logic
                if (!pc.currentRemoteDescription && myId < theirId) {
                    addLog("I am the OFFERER. Creating Data Channel...");

                    const dc = pc.createDataChannel("game-events");
                    dc.onopen = () => setDataChannelState('open');
                    dc.onclose = () => setDataChannelState('closed');
                    dc.onmessage = (msg) => {
                        try {
                            const parsed = JSON.parse(msg.data);
                            if (parsed.type === 'card-declared') setLatestReceivedCard(parsed.data);
                            if (parsed.type === 'lp-update') setLatestReceivedLP(parsed.data);
                            if (parsed.type === 'phase-update') setLatestReceivedPhase(parsed.data);
                            if (parsed.type === 'pass-turn') setLatestReceivePassTurn(parsed.data);
                        } catch (e) { }
                    };
                    dataChannel.current = dc;

                    try {
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        addLog(`Sending OFFER...`);
                        channel.current?.send({ type: 'broadcast', event: 'offer', payload: { offer, username } });
                    } catch (e) { addLog(`Error creating offer: ${e}`); }
                } else if (!pc.currentRemoteDescription && myId > theirId) {
                    addLog("I am the ANSWERER. Sending READY back just in case.");
                    channel.current?.send({ type: 'broadcast', event: 'ready', payload: { clientId: clientId.current, username } });
                }
            })
            .subscribe((status) => {
                addLog(`Supabase Subscription Status: ${status}`);
                if (status === 'SUBSCRIBED') {
                    addLog(`Broadcasting I AM READY...`);
                    channel.current?.send({ type: 'broadcast', event: 'ready', payload: { clientId: clientId.current, username } });
                }
            });

        return () => {
            addLog(`Cleaning up WebRTC...`);
            pc.close();
            supabase.removeChannel(signaling);
        };
    }, [roomId, localStream]);

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
        iceConnectionState, // Exported
        connectionLogs      // Exported
    };
};
