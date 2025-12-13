
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("مرورگر شما از دوربین پشتیبانی نمی‌کند.");
        return;
      }

      try {
        // Try to get rear camera with better resolution
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 } 
          } 
        });
      } catch (err: any) {
        console.warn("High res environment camera not found, trying default...", err);
        try {
          // Fallback to any available video source
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (err2) {
          console.error("Error accessing camera:", err2);
          setError("عدم دسترسی به دوربین. لطفا مجوز دسترسی را بررسی کنید.");
          return;
        }
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready to play
        videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Play error:", e));
        };
        setPermissionGranted(true);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-black/50 absolute top-0 w-full z-10">
        <span className="text-white font-bold text-lg">Scan Equipment QR</span>
        <button onClick={onClose} className="text-white p-2">
          <X size={24} />
        </button>
      </div>

      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {permissionGranted ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="absolute min-w-full min-h-full object-cover"
          />
        ) : (
          <div className="text-white text-center p-4 max-w-xs">
            {error ? (
                <div className="flex flex-col items-center gap-2">
                     <AlertCircle size={48} className="mx-auto mb-2 text-red-500" />
                     <p className="text-red-400 font-bold">{error}</p>
                     <p className="text-xs text-slate-400 mt-2">این خطا ممکن است به دلیل نداشتن دوربین یا عدم صدور مجوز دسترسی باشد.</p>
                </div>
            ) : (
                <>
                    <Camera size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Waiting for camera permission...</p>
                </>
            )}
          </div>
        )}
        
        {/* Scanner Overlay - Only show if no error */}
        {!error && (
            <>
                <div className="relative w-64 h-64 border-2 border-accent/70 rounded-lg z-10 flex items-center justify-center">
                <div className="absolute top-0 w-full h-1 bg-accent/80 shadow-[0_0_10px_rgba(14,165,233,0.8)] animate-[scan_2s_infinite]"></div>
                </div>
                <div className="absolute bottom-20 text-white/80 text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                QR Code را در کادر قرار دهید
                </div>
            </>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
