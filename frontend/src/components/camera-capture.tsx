'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

/**
 * High-performance, native HTML5 camera capture component with visual alignment overlay.
 */
export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start video stream
  const startCamera = async () => {
    setError(null);
    setCapturedImage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // front camera
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Capture frame
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      
      canvas.width = width;
      canvas.height = height;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Mirror the image horizontally to match standard camera expectations
        context.translate(width, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCamera();

        // Convert base64 dataUrl back to a File
        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            onCapture(file);
          });
      }
    }
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-[400px] aspect-[4/3] bg-beleqet-slate border border-beleqet-border rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
        {/* Hidden canvas used to grab image frame */}
        <canvas ref={canvasRef} className="hidden" />

        {error ? (
          <div className="p-4 text-center">
            <p className="text-sm font-semibold text-red-400 mb-2">⚠️ Camera Access Denied</p>
            <p className="text-xs text-muted-foreground/60 mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="bg-beleqet-emerald hover:bg-beleqet-emerald/90 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Retry Camera
            </button>
          </div>
        ) : capturedImage ? (
          <div className="relative w-full h-full flex justify-center items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Captured Selfie Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-beleqet-emerald/10 border-4 border-beleqet-lime/50 rounded-2xl pointer-events-none" />
          </div>
        ) : cameraActive ? (
          <div className="relative w-full h-full flex justify-center items-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover scale-x-[-1]"
              muted
              playsInline
            />
            {/* Visual alignment overlay (oval helper) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[180px] h-[240px] border-[3px] border-dashed border-beleqet-lime/80 rounded-[50%] bg-beleqet-dark/30 shadow-[0_0_0_9999px_rgba(4,22,3,0.6)]" />
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-beleqet-dark/80 backdrop-blur text-[10px] font-semibold text-beleqet-lime px-3 py-1 rounded-full border border-beleqet-border">
                  Center your face inside the oval
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center p-6 text-center">
            <svg
              className="w-12 h-12 text-beleqet-emerald mb-3 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm font-semibold text-foreground/90 mb-1">Live Face Scan</p>
            <p className="text-xs text-muted-foreground/60 mb-4">
              Liveness detection requires a camera snapshot
            </p>
            <button
              onClick={startCamera}
              className="bg-beleqet-emerald hover:bg-beleqet-emerald/90 text-beleqet-lime text-xs font-bold px-5 py-2.5 rounded-xl border border-beleqet-lime/20 shadow-md transition-all duration-300"
            >
              Start Web Camera
            </button>
          </div>
        )}
      </div>

      {cameraActive && (
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={capturePhoto}
            className="w-14 h-14 bg-beleqet-emerald hover:bg-beleqet-emerald/90 active:scale-95 text-beleqet-lime border-4 border-beleqet-lime/30 rounded-full flex items-center justify-center shadow-lg transition-all"
            title="Capture Photo"
          >
            <div className="w-5 h-5 bg-beleqet-lime rounded-full" />
          </button>
          <button
            onClick={stopCamera}
            className="text-xs text-muted-foreground/60 hover:text-red-400 font-semibold underline px-2 py-1"
          >
            Cancel
          </button>
        </div>
      )}

      {capturedImage && (
        <button
          onClick={startCamera}
          className="text-xs text-beleqet-lime hover:underline font-semibold mt-3"
        >
          ↻ Take Another Photo
        </button>
      )}
    </div>
  );
}
