import { useEffect, useRef } from 'react';
import { soundEffects } from '../utils/audioFeedback';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minChars?: number;
  maxKeyIntervalMs?: number; // Maximum ms between keystrokes to be considered a scanner
  playSoundOnScan?: boolean;
}

/**
 * Hook to listen for hardware USB & Bluetooth laser barcode scanner input.
 * Barcode scanners act as rapid keyboard wedge devices ending with 'Enter'.
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minChars = 3,
  maxKeyIntervalMs = 50,
  playSoundOnScan = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const isScannerBurstRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = performance.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Ignore modifier keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }

      // Check if user is typing in an input or textarea that should not be intercepted
      const activeElement = document.activeElement;
      const isInputActive =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      // Barcode scanners type very rapidly (< 40-50ms between keys)
      if (timeSinceLastKey > maxKeyIntervalMs && bufferRef.current.length > 0) {
        // Gap too long, reset buffer unless we're already accumulating
        bufferRef.current = '';
        isScannerBurstRef.current = false;
      }

      if (e.key === 'Enter') {
        const scannedCode = bufferRef.current.trim();
        if (scannedCode.length >= minChars) {
          e.preventDefault();
          if (playSoundOnScan) {
            soundEffects.playScanSuccess();
          }
          onScan(scannedCode);
        }
        bufferRef.current = '';
        isScannerBurstRef.current = false;
        return;
      }

      // Printable single character
      if (e.key.length === 1) {
        // If typing fast enough or not in input, accumulate
        if (timeSinceLastKey <= maxKeyIntervalMs) {
          isScannerBurstRef.current = true;
        }

        // If in input and NOT a scanner burst, let standard input handle it
        if (isInputActive && !isScannerBurstRef.current && bufferRef.current.length === 0) {
          return;
        }

        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, minChars, maxKeyIntervalMs, onScan, playSoundOnScan]);
}
