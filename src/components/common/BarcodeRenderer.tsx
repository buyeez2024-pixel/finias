import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string | number | undefined | null;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'EAN8' | 'CODE39' | 'ITF14' | 'pharmacode';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  font?: string;
  textMargin?: number;
  lineColor?: string;
  background?: string;
  className?: string;
  id?: string;
}

// Fallback deterministic pseudo-barcode generator for non-standard inputs
function generateFallbackBars(input: string): number[] {
  const bars: number[] = [2, 1, 1, 2]; // Start guard
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) % 100000;
    const digit = input.charCodeAt(i) % 4 + 1;
    bars.push(digit, (digit % 3) + 1, (digit % 2) + 1);
  }
  bars.push(2, 1, 2, 2); // Stop guard
  return bars;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 1.4,
  height = 36,
  displayValue = true,
  fontSize = 10,
  font = 'monospace',
  textMargin = 2,
  lineColor = '#0f172a',
  background = '#ffffff',
  className = '',
  id,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [renderFailed, setRenderFailed] = useState(false);

  const safeValue = typeof value === 'number' ? String(value) : (value || '').trim();

  useEffect(() => {
    setRenderFailed(false);
    if (!svgRef.current || !safeValue) return;

    try {
      let activeFormat = format;

      // Validate format-specific requirements
      if (format === 'EAN13') {
        // EAN13 strictly requires 12 or 13 numeric digits
        if (!/^\d{12,13}$/.test(safeValue)) {
          activeFormat = 'CODE128';
        }
      } else if (format === 'UPC') {
        // UPC strictly requires 11 or 12 numeric digits
        if (!/^\d{11,12}$/.test(safeValue)) {
          activeFormat = 'CODE128';
        }
      } else if (format === 'CODE39') {
        // CODE39 only supports uppercase alphanumeric and - . $ / + % SPACE
        if (!/^[0-9A-Z\-.$/+% ]+$/i.test(safeValue)) {
          activeFormat = 'CODE128';
        }
      }

      JsBarcode(svgRef.current, safeValue, {
        format: activeFormat,
        width: Math.max(1, width),
        height: Math.max(20, height),
        displayValue: displayValue,
        fontSize: fontSize,
        font: font,
        textMargin: textMargin,
        lineColor: lineColor,
        background: background,
        margin: 4,
        valid: (valid) => {
          if (!valid) {
            setRenderFailed(true);
          }
        },
      });
    } catch (err) {
      console.warn('JsBarcode render warning, falling back to universal Code128:', err);
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, safeValue, {
            format: 'CODE128',
            width: Math.max(1, width),
            height: Math.max(20, height),
            displayValue: displayValue,
            fontSize: fontSize,
            font: font,
            textMargin: textMargin,
            lineColor: lineColor,
            background: background,
            margin: 4,
          });
        }
      } catch (fallbackErr) {
        console.warn('JsBarcode universal fallback also failed, using native SVG vector bar engine:', fallbackErr);
        setRenderFailed(true);
      }
    }
  }, [safeValue, format, width, height, displayValue, fontSize, font, textMargin, lineColor, background]);

  if (!safeValue) {
    return (
      <div className={`text-[10px] text-slate-400 font-mono italic p-1 bg-slate-100 rounded text-center ${className}`}>
        No Barcode
      </div>
    );
  }

  // Native fallback SVG vector representation in case JsBarcode is unable to encode unusual characters
  if (renderFailed) {
    const bars = generateFallbackBars(safeValue);
    return (
      <div className={`inline-flex flex-col items-center bg-white p-1 rounded ${className}`}>
        <svg
          id={id}
          className="max-w-full block mx-auto"
          height={height}
          viewBox={`0 0 ${bars.reduce((a, b) => a + b, 0) * 2} ${height}`}
        >
          {bars.map((barWidth, idx) => {
            let offset = 0;
            for (let j = 0; j < idx; j++) offset += bars[j] * 2;
            const isBlack = idx % 2 === 0;
            if (!isBlack) return null;
            return (
              <rect
                key={idx}
                x={offset}
                y={0}
                width={barWidth * 1.5}
                height={height}
                fill={lineColor}
              />
            );
          })}
        </svg>
        {displayValue && (
          <span className="font-mono text-[9px] text-slate-800 tracking-wider mt-0.5 select-all block text-center">
            {safeValue}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-block overflow-hidden rounded bg-white ${className}`}>
      <svg id={id} ref={svgRef} className="max-w-full h-auto block mx-auto" />
    </div>
  );
};
