
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle, Keyboard, ChevronRight } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    // If manual input is shown, don't start camera
    if (showManualInput) return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      setError(null);
      setPermissionGranted(false);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("مرورگر شما از دوربین پشتیبانی نمی‌کند.");
        setShowManualInput(true); // Auto switch to manual
        return;
      }

      try {
        // First try: Rear camera with ideal resolution
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
          // Second try: Any available video source
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (err2) {
          console.error("Error accessing camera:", err2);
          setError("عدم دسترسی به دوربین. لطفا مجوز دسترسی را بررسی کنید یا از ورود دستی استفاده کنید.");
          // Don't auto switch here, let user see error
          return;
        }
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
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
  }, [showManualInput]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 absolute top-0 w-full z-20 backdrop-blur-sm">
        <span className="text-white font-bold text-lg">اسکن کد تجهیز</span>
        <button onClick={onClose} className="text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        
        {showManualInput ? (
            // Manual Input View
            <div className="w-full max-w-sm px-6 animate-fade-in-up">
                <div className="bg-slate-900/90 border border-slate-700 p-6 rounded-3xl backdrop-blur-xl">
                    <div className="flex flex-col items-center mb-6 text-white">
                        <Keyboard size={48} className="mb-4 text-accent opacity-80" />
                        <h3 className="text-xl font-bold">ورود دستی کد</h3>
                        <p className="text-sm text-slate-400 mt-2 text-center">کد تجهیز را به صورت دستی وارد کنید</p>
                    </div>
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <input 
                            type="text" 
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="مثال: EHALBF0001"
                            className="w-full bg-black/50 border border-slate-600 rounded-xl px-4 py-4 text-center text-white placeholder:text-slate-600 focus:border-accent outline-none text-lg font-mono tracking-wider"
                            autoFocus
                        />
                        <button type="submit" className="w-full bg-accent hover:bg-sky-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-sky-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <span>تایید و ادامه</span>
                            <ChevronRight className="rtl:rotate-180" />
                        </button>
                        <button type="button" onClick={() => setShowManualInput(false)} className="w-full text-slate-400 text-sm py-2 hover:text-white transition-colors">
                            بازگشت به دوربین
                        </button>
                    </form>
                </div>
            </div>
        ) : (
            // Camera View
            <>
                {permissionGranted ? (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="absolute min-w-full min-h-full object-cover"
                />
                ) : (
                <div className="text-white text-center p-6 max-w-xs z-10">
                    {error ? (
                        <div className="flex flex-col items-center gap-4 bg-red-900/20 p-6 rounded-2xl border border-red-500/30 backdrop-blur-md">
                            <AlertCircle size={48} className="text-red-500" />
                            <p className="text-red-200 font-medium text-sm leading-relaxed">{error}</p>
                            <button 
                                onClick={() => setShowManualInput(true)}
                                className="mt-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-900/40 transition-all"
                            >
                                ورود دستی کد
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-t-accent border-white/20 rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-300 text-sm">در حال راه‌اندازی دوربین...</p>
                        </div>
                    )}
                </div>
                )}
                
                {/* Scanner Overlay - Only show if camera is working */}
                {permissionGranted && (
                    <>
                        <div className="relative w-72 h-72 border-2 border-accent/50 rounded-3xl z-10 flex items-center justify-center overflow-hidden">
                             <div className="absolute inset-0 border-[40px] border-black/50 mask-image-scanner"></div>
                             {/* Corner accents */}
                             <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-accent rounded-tl-xl"></div>
                             <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-accent rounded-tr-xl"></div>
                             <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-accent rounded-bl-xl"></div>
                             <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-accent rounded-br-xl"></div>
                             
                             {/* Scanning line */}
                             <div className="absolute top-0 w-full h-1 bg-accent/80 shadow-[0_0_20px_rgba(14,165,233,0.8)] animate-[scan_2s_infinite]"></div>
                        </div>
                        <div className="absolute bottom-24 text-white/90 text-sm bg-black/60 px-6 py-3 rounded-full backdrop-blur-md border border-white/10 shadow-xl">
                             QR Code را در کادر قرار دهید
                        </div>
                        
                        {/* Switch to Manual Button */}
                        <button 
                            onClick={() => setShowManualInput(true)}
                            className="absolute bottom-8 text-white text-sm flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl backdrop-blur-md transition-all border border-white/5"
                        >
                            <Keyboard size={18} />
                            <span>ورود دستی کد</span>
                        </button>
                    </>
                )}
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
