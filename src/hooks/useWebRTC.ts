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

    // Ref to queue ICE candidates received before remote description is ready
    const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

    useEffect(() => {
        if (!roomId) return; // Allow connection even if localStream is null (Receive-Only)

        // Initialize Peer Connection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnection.current = pc;

        // Add local tracks to peer connection ONLY if we have a stream
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
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
                    type: 'broadcast',
                    event: 'ice-candidate',
                    payload: event.candidate
                });
            }
        };

        // Initialize Supabase Signaling Channel
        const signaling = supabase.channel(`room:${roomId}`);
        channel.current = signaling;

        signaling
            .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
                const candidate = new RTCIceCandidate(payload);
                if (pc.remoteDescription && pc.remoteDescription.type) {
                    try {
                        await pc.addIceCandidate(candidate);
                    } catch (e) {
                        console.error("Error adding received ice candidate", e);
                    }
                } else {
                    console.log("Queueing ICE candidate (remote description not ready)");
                    iceCandidatesQueue.current.push(candidate);
                }
            })
            .on('broadcast', { event: 'offer' }, async ({ payload }) => {
                try {
                    if (payload.username) setRemoteUsername(payload.username);

                    if (!pc.currentRemoteDescription) {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));

                        // Process queued candidates
                        while (iceCandidatesQueue.current.length > 0) {
                            const candidate = iceCandidatesQueue.current.shift();
                            if (candidate) await pc.addIceCandidate(candidate);
                        }

                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);

                        channel.current?.send({
                            type: 'broadcast',
                            event: 'answer',
                            payload: { answer, username }
                        });
                    }
                } catch (e) {
                    console.error("Error handling offer", e);
                }
            })
            .on('broadcast', { event: 'answer' }, async ({ payload }) => {
                try {
                    if (payload.username) setRemoteUsername(payload.username);

                    if (!pc.currentRemoteDescription) {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));

                        // Process queued candidates
                        while (iceCandidatesQueue.current.length > 0) {
                            const candidate = iceCandidatesQueue.current.shift();
                            if (candidate) await pc.addIceCandidate(candidate);
                        }
                    }
                } catch (e) {
                    console.error("Error handling answer", e);
                }
            })
            .on('broadcast', { event: 'ready' }, async ({ payload }) => {
                const myId = clientId.current;
                const theirId = payload.clientId;
                if (payload.username) setRemoteUsername(payload.username);

                console.log(`[Signaling] Ready received from ${theirId} (${payload.username}). My ID: ${myId}`);

                // Tie-breaker: Lower ID offers
                if (!pc.currentRemoteDescription && myId < theirId) {
                    console.log("I am the offerer.");
                    try {
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);

                        channel.current?.send({
                            type: 'broadcast',
                            event: 'offer',
                            payload: { offer, username }
                        });
                    } catch (e) {
                        console.error("Error creating offer", e);
                    }
                } else if (!pc.currentRemoteDescription && myId > theirId) {
                    // Answerer ACK: Reply to ready so the other peer knows to offer
                    channel.current?.send({
                        type: 'broadcast',
                        event: 'ready',
                        payload: { clientId: clientId.current, username }
                    });
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    channel.current?.send({
                        type: 'broadcast',
                        event: 'ready',
                        payload: { clientId: clientId.current, username }
                    });
                }
            });

        return () => {
            pc.close();
            supabase.removeChannel(signaling);
            iceCandidatesQueue.current = [];
        };
    }, [roomId, localStream]);

    return { remoteStream, isConnected, remoteUsername };
};
