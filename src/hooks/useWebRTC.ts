"use client";
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
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
    const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

    // NEW SYNCHRONIZATION: Send via Data Channel
    const sendCard = (cardData: any) => {
        if (dataChannel.current && dataChannel.current.readyState === 'open') {
            console.log("Sending card via DataChannel:", cardData.name);
            const payload = JSON.stringify({ type: 'card-declared', data: cardData });
            dataChannel.current.send(payload);
        } else {
            console.error("Data Channel not open. State:", dataChannel.current?.readyState);
        }
    };

    useEffect(() => {
        if (!roomId) return;

        // Initialize Peer Connection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnection.current = pc;

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }

        // Handle incoming tracks
        pc.ontrack = (event) => {
            console.log("Received remote track:", event.streams[0]);
            setRemoteStream(event.streams[0]);
            setIsConnected(true);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.current?.send({
                    type: 'broadcast', event: 'ice-candidate', payload: event.candidate
                });
            }
        };

        // DATA CHANNEL: Handle Incoming Channel (Answerer side)
        pc.ondatachannel = (event) => {
            console.log("Received Data Channel:", event.channel.label);
            const receiveChannel = event.channel;
            dataChannel.current = receiveChannel; // Store it to reply if needed

            receiveChannel.onmessage = (msg) => {
                console.log("DataChannel Message:", msg.data);
                try {
                    const parsed = JSON.parse(msg.data);
                    if (parsed.type === 'card-declared') {
                        setLatestReceivedCard(parsed.data);
                    }
                } catch (e) { console.error("Parse error", e); }
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
            .on('broadcast', { event: 'offer' }, async ({ payload }) => {
                try {
                    if (payload.username) setRemoteUsername(payload.username);
                    if (!pc.currentRemoteDescription) {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
                        while (iceCandidatesQueue.current.length > 0) await pc.addIceCandidate(iceCandidatesQueue.current.shift()!);

                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);

                        channel.current?.send({ type: 'broadcast', event: 'answer', payload: { answer, username } });
                    }
                } catch (e) { console.error("Error handling offer", e); }
            })
            .on('broadcast', { event: 'answer' }, async ({ payload }) => {
                try {
                    if (payload.username) setRemoteUsername(payload.username);
                    if (!pc.currentRemoteDescription) {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
                        while (iceCandidatesQueue.current.length > 0) await pc.addIceCandidate(iceCandidatesQueue.current.shift()!);
                    }
                } catch (e) { console.error("Error handling answer", e); }
            })
            .on('broadcast', { event: 'ready' }, async ({ payload }) => {
                const myId = clientId.current;
                const theirId = payload.clientId;
                if (payload.username) setRemoteUsername(payload.username);
                console.log(`[Signaling] Ready received from ${theirId}`);

                if (!pc.currentRemoteDescription && myId < theirId) {
                    console.log("I am the offerer. Creating Data Channel...");

                    // OFFERER Creates Data Channel
                    const dc = pc.createDataChannel("game-events");
                    dc.onopen = () => console.log("DataChannel OPEN (Offerer)");
                    dc.onmessage = (msg) => {
                        try {
                            const parsed = JSON.parse(msg.data);
                            if (parsed.type === 'card-declared') setLatestReceivedCard(parsed.data);
                        } catch (e) { }
                    };
                    dataChannel.current = dc;

                    try {
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        channel.current?.send({ type: 'broadcast', event: 'offer', payload: { offer, username } });
                    } catch (e) { console.error("Error creating offer", e); }
                } else if (!pc.currentRemoteDescription && myId > theirId) {
                    channel.current?.send({ type: 'broadcast', event: 'ready', payload: { clientId: clientId.current, username } });
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    channel.current?.send({ type: 'broadcast', event: 'ready', payload: { clientId: clientId.current, username } });
                }
            });

        return () => {
            pc.close();
            supabase.removeChannel(signaling);
        };
    }, [roomId, localStream]);

    return { remoteStream, isConnected, remoteUsername, sendCard, latestReceivedCard };
};
