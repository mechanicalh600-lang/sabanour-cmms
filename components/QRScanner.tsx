
import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, Keyboard, ChevronRight, RefreshCw, WifiOff } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const requestRef = useRef<number>(0);
  
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Function to scan frames
  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
            // Optimization: Only scan the center part of the video (where the box is)
            const scanSize = Math.min(video.videoWidth, video.videoHeight) * 0.6; // Scan 60% of center
            const sx = (video.videoWidth - scanSize) / 2;
            const sy = (video.videoHeight - scanSize) / 2;

            canvas.width = 400; 
            canvas.height = 400;
            
            ctx.drawImage(video, sx, sy, scanSize, scanSize, 0, 0, 400, 400);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Access global jsQR loaded from index.html script tag
            // @ts-ignore
            const jsQR = window.jsQR;

            if (jsQR) {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                
                if (code && code.data && code.data.trim() !== "") {
                    onScan(code.data);
                    return; 
                }
            }
        }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (permissionGranted && !showManualInput) {
        requestRef.current = requestAnimationFrame(tick);
    }
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [permissionGranted, showManualInput]);

  useEffect(() => {
    if (showManualInput) return;
    
    // Check if library loaded
    // @ts-ignore
    if (!window.jsQR) {
        setError("کتابخانه اسکنر بارگذاری نشده است. (مشکل اینترنت)");
        return;
    }

    let stream: MediaStream | null = null;
    let isMounted = true;

    const startCamera = async () => {
      setError(null);
      setPermissionGranted(false);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) {
            setError("مرورگر شما از دوربین پشتیبانی نمی‌کند.");
            setShowManualInput(true);
        }
        return;
      }

      try {
        const constraints = {
            audio: false,
            video: {
                facingMode: "environment",
                width: { ideal: 1280 }, 
                height: { ideal: 720 },
                focusMode: "continuous" 
            }
        } as MediaStreamConstraints;

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (isMounted && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", "true"); 
            
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().then(() => {
                    if (isMounted) setPermissionGranted(true);
                }).catch(e => {
                    console.error("Play error", e);
                    if (isMounted) setError("خطا در پخش تصویر.");
                });
            };
        }
      } catch (err: any) {
        console.error("Camera error:", err);
        if (isMounted) {
            setError("عدم دسترسی به دوربین.");
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [showManualInput, retryCount]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  const handleRetry = () => {
      setRetryCount(prev => prev + 1);
      setError(null);
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
            <div className="w-full max-w-sm px-6 animate-fade-in-up z-30">
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
                            تلاش مجدد دوربین
                        </button>
                    </form>
                </div>
            </div>
        ) : (
            // Camera View
            <>
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className={`absolute min-w-full min-h-full object-cover transition-opacity duration-500 ${permissionGranted ? 'opacity-100' : 'opacity-0'}`}
                />
                
                {/* Loading / Error State */}
                {(!permissionGranted || error) && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
                        <div className="text-white text-center p-6 max-w-xs">
                        {error ? (
                            <div className="flex flex-col items-center gap-4 bg-red-900/20 p-6 rounded-2xl border border-red-500/30 backdrop-blur-md">
                                {error.includes("اینترنت") ? <WifiOff size={48} className="text-red-500" /> : <AlertCircle size={48} className="text-red-500" />}
                                <p className="text-red-200 font-medium text-sm leading-relaxed">{error}</p>
                                <div className="flex gap-2 w-full">
                                    <button 
                                        onClick={handleRetry}
                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={16} />
                                        <span>تلاش مجدد</span>
                                    </button>
                                    <button 
                                        onClick={() => setShowManualInput(true)}
                                        className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-900/40 transition-all"
                                    >
                                        ورود دستی
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 border-4 border-t-accent border-white/20 rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-300 text-sm">در حال راه‌اندازی دوربین...</p>
                            </div>
                        )}
                        </div>
                    </div>
                )}
                
                {/* Scanner Overlay - Only show if camera is working */}
                {permissionGranted && (
                    <>
                        <div className="relative w-72 h-72 border-2 border-accent/50 rounded-3xl z-10 flex items-center justify-center overflow-hidden box-content">
                             {/* Darken outside area to emphasize scanning zone */}
                             <div className="absolute top-0 left-0 w-[4000px] h-[4000px] -translate-x-1/2 -translate-y-1/2 border-[2000px] border-black/50 pointer-events-none"></div>
                             
                             {/* Corner accents */}
                             <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-xl"></div>
                             <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-xl"></div>
                             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-xl"></div>
                             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-xl"></div>
                             
                             {/* Scanning line */}
                             <div className="absolute top-0 w-full h-1 bg-accent/80 shadow-[0_0_20px_rgba(14,165,233,0.8)] animate-[scan_2s_infinite]"></div>
                        </div>
                        <div className="absolute bottom-24 text-white/90 text-sm bg-black/60 px-6 py-3 rounded-full backdrop-blur-md border border-white/10 shadow-xl z-10">
                             QR Code را در کادر قرار دهید
                        </div>
                        
                        {/* Switch to Manual Button */}
                        <button 
                            onClick={() => setShowManualInput(true)}
                            className="absolute bottom-8 text-white text-sm flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl backdrop-blur-md transition-all border border-white/5 z-10"
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
