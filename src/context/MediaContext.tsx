"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MediaContextType {
    localStream: MediaStream | null;
    isMicMuted: boolean;
    isVideoEnabled: boolean;
    isLoading: boolean;
    error: string | null;
    videoDevices: MediaDeviceInfo[];
    audioInputDevices: MediaDeviceInfo[];
    audioOutputDevices: MediaDeviceInfo[];
    selectedVideoDeviceId: string | undefined;
    selectedAudioInputDeviceId: string | undefined;
    selectedAudioOutputDeviceId: string | undefined;
    toggleMic: () => void;
    toggleVideo: () => void;
    changeDevice: (kind: MediaDeviceKind, deviceId: string) => Promise<void>;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);

    const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>();
    const [selectedAudioInputDeviceId, setSelectedAudioInputDeviceId] = useState<string>();
    const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] = useState<string>();

    useEffect(() => {
        const initStream = async () => {
            try {
                // First try requesting both video and audio
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                setLocalStream(stream);
                setIsLoading(false);
                setError(null);
            } catch (err: any) {
                console.warn("Camera/Mic access failed, retrying with audio only...", err);

                try {
                    // Fallback: Try audio only (user might not have a camera)
                    const audioStream = await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: true
                    });
                    setLocalStream(audioStream);
                    setIsVideoEnabled(false); // Force video off
                    setIsLoading(false);
                    setError(null); // Clear error if audio works
                } catch (audioErr: any) {
                    console.error("Audio access also failed:", audioErr);
                    setError("Nessun dispositivo rilevato (o permessi negati).");
                    setIsLoading(false);
                }
            }
        };

        const getDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
                setAudioInputDevices(devices.filter(d => d.kind === 'audioinput'));
                setAudioOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
            } catch (err) {
                console.error("Error enumerating devices:", err);
            }
        };

        initStream().then(() => {
            getDevices();
        });

        return () => {
            // Cleanup stream on unmount
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const changeDevice = async (kind: MediaDeviceKind, deviceId: string) => {
        if (kind === 'audiooutput') {
            // Audio output (speaker) handling is different (uses setSinkId on video element usually)
            // For now just update state as React usually handles audio routing implicitly or via ref
            setSelectedAudioOutputDeviceId(deviceId);
            // In a real app with <video>, you'd do videoRef.current.setSinkId(deviceId)
            return;
        }

        try {
            const constraints: MediaStreamConstraints = {
                video: kind === 'videoinput' ? { deviceId: { exact: deviceId } } : isVideoEnabled,
                audio: kind === 'audioinput' ? { deviceId: { exact: deviceId } } : true,
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Stop old tracks to release device
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    // Only stop the track we are replacing to keep the other active if possible?
                    // Actually usually easiest to restart stream.
                    // But if we want to keep state of other track:
                    if (track.kind === (kind === 'videoinput' ? 'video' : 'audio')) {
                        track.stop();
                    }
                });
            }

            // If we replaced one track, we might want to merge with existing other track 
            // OR just replace the whole stream for simplicity in this context
            setLocalStream(newStream);

            if (kind === 'videoinput') setSelectedVideoDeviceId(deviceId);
            if (kind === 'audioinput') setSelectedAudioInputDeviceId(deviceId);

        } catch (err) {
            console.error("Failed to change device:", err);
            setError("Impossibile cambiare dispositivo.");
        }
    };

    return (
        <MediaContext.Provider value={{
            localStream,
            isMicMuted,
            isVideoEnabled,
            isLoading,
            error,
            videoDevices,
            audioInputDevices,
            audioOutputDevices,
            selectedVideoDeviceId,
            selectedAudioInputDeviceId,
            selectedAudioOutputDeviceId,
            toggleMic,
            toggleVideo,
            changeDevice
        }}>
            {children}
        </MediaContext.Provider>
    );
};

export const useMedia = () => {
    const context = useContext(MediaContext);
    if (context === undefined) {
        throw new Error('useMedia must be used within a MediaProvider');
    }
    return context;
};
