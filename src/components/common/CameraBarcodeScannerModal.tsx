import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        startDecodingLoop();
      }
    } catch (err: any) {
      setError(err.message || 'Unable to access camera. Please allow camera permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startDecodingLoop = () => {
    if (!('BarcodeDetector' in window)) {
      setError('BarcodeDetector API is not supported in this browser. Please use Chrome on Android or Desktop.');
      return;
    }

    const barcodeDetector = new (window as any).BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e']
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const detect = async () => {
      if (!streamRef.current || !videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        if (isScanning) requestAnimationFrame(detect);
        return;
      }

      try {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const barcodes = await barcodeDetector.detect(videoRef.current);
        if (barcodes && barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          if (code) {
            onScan(code);
            stopCamera();
            onClose();
            return;
          }
        }
      } catch (e) {
        // detection frame error
      }

      if (streamRef.current) {
        requestAnimationFrame(detect);
      }
    };

    requestAnimationFrame(detect);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Camera className="w-4 h-4 text-indigo-400" />
            <span>Mobile Camera Barcode Scanner</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Body */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Laser Scanner Animation Overlay */}
          {isScanning && (
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)] animate-pulse" />
          )}

          {/* Target Box Frame */}
          <div className="absolute inset-12 border-2 border-dashed border-indigo-400/50 rounded-xl pointer-events-none flex items-center justify-center">
            <span className="text-[11px] text-slate-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
              Align barcode inside frame
            </span>
          </div>

          {error && (
            <div className="absolute inset-4 bg-slate-950/90 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              <p className="text-xs text-slate-300 max-w-xs">{error}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center text-xs text-slate-400">
          Point your mobile camera at any product EAN, UPC, or Code-128 barcode to scan instantly.
        </div>
      </div>
    </div>
  );
};
