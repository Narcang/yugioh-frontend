"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useMedia } from '@/context/MediaContext';

// USE LOCAL PROXY (Bypasses Mixed Content / CORS)
const API_URL = "/api/identify";

interface ScannerProps {
    onCardFound: (cardName: string) => void;
    remoteStream: MediaStream | null;
}

const CardScanner: React.FC<ScannerProps> = ({ onCardFound, remoteStream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [lastMatch, setLastMatch] = useState<string | null>(null);

    useEffect(() => {
        if (videoRef.current && remoteStream) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.play().catch(e => console.error("Scanner play error:", e));
        }
    }, [remoteStream]);

    // Scanning Loop
    useEffect(() => {
        if (!isScanning || !remoteStream) return;

        const interval = setInterval(async () => {
            if (!videoRef.current || !canvasRef.current) return;

            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;

            // Capture frame
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0);

            // Convert to Blob
            canvasRef.current.toBlob(async (blob) => {
                if (!blob) return;

                const formData = new FormData();
                formData.append('file', blob);

                try {
                    const res = await fetch(`${API_URL}`, {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await res.json();

                    if (data.match && data.card) {
                        console.log("Card Found:", data.card);
                        if (data.card !== lastMatch) {
                            setLastMatch(data.card);
                            onCardFound(data.card);
                        }
                    }
                } catch (e) {
                    console.error("Scan error:", e);
                }
            }, 'image/jpeg', 0.8);
        }, 1500); // Scan every 1.5 seconds

        return () => clearInterval(interval);
    }, [isScanning, remoteStream, lastMatch, onCardFound]);

    return (
        <div className="card-scanner">
            <div className="scanner-controls">
                <button
                    className={`scan-btn ${isScanning ? 'active' : ''}`}
                    onClick={() => setIsScanning(!isScanning)}
                >
                    {isScanning ? '⏹ Stop Scanner' : '👁 Start Live Scan'}
                </button>
            </div>
            {/* Hidden video/canvas for processing */}
            <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default CardScanner;
