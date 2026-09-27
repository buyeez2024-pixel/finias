import React, { useState, useMemo, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { Product } from '../../types/erp';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import { printElement } from '../../utils/printHelper';
import {
  Printer,
  X,
  CheckCircle2,
  Copy,
  Tag,
  LayoutGrid,
  Layers,
  Sparkles,
  Search,
  Sliders,
  Settings2,
  RefreshCw,
  Plus,
  Minus,
  CheckSquare,
  Square,
  FileSpreadsheet,
  DollarSign,
  Maximize2,
  Eye,
} from 'lucide-react';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
  embedded?: boolean;
}

export type SheetFormat =
  | 'a4_24' // 3 cols x 8 rows (70mm x 37mm)
  | 'a4_30' // 3 cols x 10 rows (70mm x 29.7mm)
  | 'a4_40' // 4 cols x 10 rows (52.5mm x 29.7mm)
  | 'roll_50x30' // Continuous 50mm x 30mm thermal
  | 'roll_38x25' // Compact jewelry 38mm x 25mm
  | 'shelf_75x50'; // Large retail shelf talker 75mm x 50mm

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  initialProduct,
  embedded = false,
}) => {
  const { products, settings } = useErp();
  const isLight = settings?.themeMode === 'light';

  // Mode: 'single' or 'batch'
  const [printMode, setPrintMode] = useState<'single' | 'batch'>('single');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [singleQty, setSingleQty] = useState<number>(12);

  // Batch products quantity map (productId -> quantity)
  const [batchQuantities, setBatchQuantities] = useState<Record<string, number>>({});

  // Search in batch selector
  const [batchSearch, setBatchSearch] = useState('');

  // Code source: 'sku' | 'barcode' | 'custom'
  const [codeSource, setCodeSource] = useState<'sku' | 'barcode' | 'custom'>('barcode');
  const [customCodePrefix, setCustomCodePrefix] = useState('LOT-2026-');
  const [customCodeVal, setCustomCodeVal] = useState('890123456789');

  // Symbology
  const [symbology, setSymbology] = useState<'CODE128' | 'EAN13' | 'UPC' | 'CODE39'>('CODE128');

  // Sheet / Paper Format
  const [sheetFormat, setSheetFormat] = useState<SheetFormat>('a4_24');

  // Label fields toggles
  const [showStoreName, setShowStoreName] = useState(true);
  const [showProductName, setShowProductName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showHsn, setShowHsn] = useState(true);
  const [showBarcodeText, setShowBarcodeText] = useState(true);
  const [customPromoText, setCustomPromoText] = useState('');

  // Preview zoom level
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Sync selected product and initial batch state when modal opens or initialProduct changes
  useEffect(() => {
    if (isOpen || embedded) {
      if (initialProduct) {
        setSelectedProductId(initialProduct.id);
        setPrintMode('single');
        setBatchQuantities({ [initialProduct.id]: 12 });
      } else if (products.length > 0) {
        setSelectedProductId((prev) => (prev && products.some((p) => p.id === prev) ? prev : products[0].id));
        const initial: Record<string, number> = {};
        products.slice(0, 4).forEach((p) => {
          initial[p.id] = 4;
        });
        setBatchQuantities(initial);
      }
    }
  }, [isOpen, embedded, initialProduct, products]);

  if (!isOpen && !embedded) return null;

  const currentSingleProduct =
    products.find((p) => p.id === selectedProductId) ||
    initialProduct ||
    products[0] || {
      id: 'default',
      name: 'Sample Product',
      sku: 'SKU-001',
      barcode: '890123456789',
      sellingPrice: 19.99,
      currentStock: 10,
      category: 'General',
      unit: 'pcs',
    };

  // Build the list of labels to render
  const labelItems = (() => {
    interface LabelItem {
      id: string;
      productId: string;
      name: string;
      sku: string;
      code: string;
      price: number;
      hsn?: string;
      category: string;
    }

    const items: LabelItem[] = [];

    if (printMode === 'single' && currentSingleProduct) {
      let code = String(currentSingleProduct.barcode || currentSingleProduct.sku || '12345678');
      if (codeSource === 'sku') code = String(currentSingleProduct.sku || 'SKU-001');
      if (codeSource === 'custom') code = String(customCodeVal || '890123456789');

      for (let i = 0; i < singleQty; i++) {
        items.push({
          id: `${currentSingleProduct.id}-${i}`,
          productId: currentSingleProduct.id,
          name: currentSingleProduct.name || 'Product',
          sku: currentSingleProduct.sku || 'SKU',
          code: code,
          price: Number(currentSingleProduct.sellingPrice) || 0,
          hsn: currentSingleProduct.hsnCode,
          category: currentSingleProduct.category || 'General',
        });
      }
    } else {
      // Batch mode
      Object.entries(batchQuantities).forEach(([pId, rawQty]) => {
        const qty = Number(rawQty) || 0;
        if (qty > 0) {
          const p = products.find((prod) => prod.id === pId);
          if (p) {
            let code = String(p.barcode || p.sku || '12345678');
            if (codeSource === 'sku') code = String(p.sku || 'SKU');
            if (codeSource === 'custom') code = `${customCodePrefix}${p.sku || '001'}`;

            for (let i = 0; i < qty; i++) {
              items.push({
                id: `${p.id}-${i}`,
                productId: p.id,
                name: p.name || 'Product',
                sku: p.sku || 'SKU',
                code: code,
                price: Number(p.sellingPrice) || 0,
                hsn: p.hsnCode,
                category: p.category || 'General',
              });
            }
          }
        }
      });
    }

    return items;
  })();

  // Batch helper actions
  const handleBatchQtyChange = (productId: string, qty: number) => {
    setBatchQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, qty),
    }));
  };

  const handleMatchCurrentStock = () => {
    const updated: Record<string, number> = {};
    products.forEach((p) => {
      if (p.currentStock > 0) {
        updated[p.id] = p.currentStock;
      }
    });
    setBatchQuantities(updated);
  };

  const handleSetAllBatchQty = (qty: number) => {
    const updated: Record<string, number> = {};
    products.forEach((p) => {
      updated[p.id] = qty;
    });
    setBatchQuantities(updated);
  };

  const handleClearBatch = () => {
    setBatchQuantities({});
  };

  const handlePrint = () => {
    printElement('printable-barcode-sheet', 'Barcode Labels');
  };

  // Grid styling for preview sheet based on format
  const getGridClasses = () => {
    switch (sheetFormat) {
      case 'a4_24':
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3';
      case 'a4_30':
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2';
      case 'a4_40':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2';
      case 'roll_50x30':
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3';
      case 'roll_38x25':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2';
      case 'shelf_75x50':
        return 'grid grid-cols-1 sm:grid-cols-2 gap-4';
      default:
        return 'grid grid-cols-3 gap-3';
    }
  };

  const getBarcodeHeight = () => {
    switch (sheetFormat) {
      case 'roll_38x25':
        return 22;
      case 'a4_40':
        return 24;
      case 'shelf_75x50':
        return 42;
      default:
        return 32;
    }
  };

  const getBarcodeWidth = () => {
    switch (sheetFormat) {
      case 'roll_38x25':
        return 1.1;
      case 'a4_40':
        return 1.2;
      case 'shelf_75x50':
        return 1.6;
      default:
        return 1.4;
    }
  };

  const totalLabelCount = labelItems.length;

  const content = (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl ${embedded ? 'w-full' : 'max-w-6xl w-full max-h-[94vh] shadow-2xl my-auto'} p-4 sm:p-6 space-y-4 flex flex-col`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Barcode & Labels</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {totalLabelCount} Labels Queued
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Generate high-resolution vector adhesive stickers, retail shelf tags, and thermal roll labels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 active:scale-95 flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print {totalLabelCount} Labels</span>
          </button>
          {!embedded && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Studio Body: Config Sidebar + Live Sheet Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Configuration Column (Left 5 Cols) */}
        <div className="lg:col-span-5 space-y-3 overflow-y-auto pr-1">
          {/* Mode Switcher Tabs */}
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 grid grid-cols-2 gap-1 text-xs">
            <button
              type="button"
              onClick={() => setPrintMode('single')}
              className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-2 active:scale-95 ${
                printMode === 'single'
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30'
                  : 'text-slate-400 hover:bg-sky-600 hover:text-white hover:shadow-lg hover:shadow-sky-600/30'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Single Product</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintMode('batch')}
              className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-2 active:scale-95 ${
                printMode === 'batch'
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30'
                  : 'text-slate-400 hover:bg-sky-600 hover:text-white hover:shadow-lg hover:shadow-sky-600/30'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Item Batch</span>
            </button>
          </div>

          {/* Single Product Selection Panel */}
          {printMode === 'single' ? (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Choose Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-900 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — [SKU: {p.sku}] ({settings?.currencySymbol || '$'}
                      {Number(p.sellingPrice || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold">Number of Labels to Print</label>
                  <span className="text-indigo-400 font-bold">{singleQty} Labels</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSingleQty(Math.max(1, singleQty - 6))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={singleQty}
                    onChange={(e) => setSingleQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-900 text-white text-center font-bold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSingleQty(singleQty + 6)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setSingleQty(12)}
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[11px]"
                    >
                      12x
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleQty(24)}
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[11px]"
                    >
                      24x
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Batch Multi-Item Selection Panel */
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Select Items & Quantities</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleMatchCurrentStock}
                    className="text-[10px] bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 px-2 py-1 rounded-lg border border-emerald-500/30 font-bold"
                    title="Set label quantity to current on-hand stock"
                  >
                    Match Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllBatchQty(5)}
                    className="text-[10px] bg-slate-800 text-slate-300 hover:bg-slate-700 px-2 py-1 rounded-lg font-bold"
                  >
                    5 Each
                  </button>
                  <button
                    type="button"
                    onClick={handleClearBatch}
                    className="text-[10px] bg-slate-800 text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  placeholder="Search inventory products..."
                  className="w-full bg-slate-900 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
                />
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-855 border border-slate-800 rounded-xl bg-slate-900/50">
                {products
                  .filter(
                    (p) =>
                      p.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
                      p.sku.toLowerCase().includes(batchSearch.toLowerCase())
                  )
                  .map((p) => {
                    const qty = batchQuantities[p.id] || 0;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 hover:bg-slate-800/60 transition"
                      >
                        <div className="truncate pr-2">
                          <p className="font-bold text-white truncate text-[11px]">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            SKU: {p.sku} | Stock: {p.currentStock}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleBatchQtyChange(p.id, qty - 1)}
                            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={qty}
                            onChange={(e) =>
                              handleBatchQtyChange(p.id, parseInt(e.target.value) || 0)
                            }
                            className="w-12 bg-slate-950 text-white text-center font-mono font-bold text-xs py-1 rounded-lg border border-slate-700"
                          />
                          <button
                            type="button"
                            onClick={() => handleBatchQtyChange(p.id, qty + 1)}
                            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Paper Sheet Format & Symbology */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Sticker Paper Preset</label>
                <select
                  value={sheetFormat}
                  onChange={(e) => setSheetFormat(e.target.value as SheetFormat)}
                  className="w-full bg-slate-900 text-white px-2.5 py-2 rounded-xl border border-slate-700 focus:outline-none"
                >
                  <option value="a4_24">A4 Sheet — 24 Labels (3×8 Grid)</option>
                  <option value="a4_30">A4 Sheet — 30 Labels (3×10 Grid)</option>
                  <option value="a4_40">A4 Sheet — 40 Labels (4×10 Grid)</option>
                  <option value="roll_50x30">Thermal Roll (50mm × 30mm)</option>
                  <option value="roll_38x25">Jewelry / Compact (38mm × 25mm)</option>
                  <option value="shelf_75x50">Shelf Talker Tag (75mm × 50mm)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Barcode Symbology</label>
                <select
                  value={symbology}
                  onChange={(e) => setSymbology(e.target.value as any)}
                  className="w-full bg-slate-900 text-white px-2.5 py-2 rounded-xl border border-slate-700 focus:outline-none font-mono"
                >
                  <option value="CODE128">Code 128 (Universal)</option>
                  <option value="EAN13">EAN-13 (Retail Standard)</option>
                  <option value="UPC">UPC-A</option>
                  <option value="CODE39">Code 39 (Alphanumeric)</option>
                </select>
              </div>
            </div>

            {/* Code Value Source */}
            <div>
              <label className="text-slate-300 font-bold block mb-1">Barcode Value Source</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCodeSource('barcode')}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] transition text-center active:scale-95 ${
                    isLight
                      ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30'
                      : codeSource === 'barcode'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Product Barcode
                </button>
                <button
                  type="button"
                  onClick={() => setCodeSource('sku')}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] transition text-center active:scale-95 ${
                    isLight
                      ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30'
                      : codeSource === 'sku'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Product SKU
                </button>
                <button
                  type="button"
                  onClick={() => setCodeSource('custom')}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] transition text-center active:scale-95 ${
                    isLight
                      ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30'
                      : codeSource === 'custom'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Custom Code
                </button>
              </div>

              {codeSource === 'custom' && (
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Custom Code Value / Lot Prefix:
                  </label>
                  <input
                    type="text"
                    value={customCodeVal}
                    onChange={(e) => setCustomCodeVal(e.target.value)}
                    placeholder="Enter custom barcode digits..."
                    className="w-full bg-slate-900 text-white font-mono text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Label Content Visibility Toggles */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
            <span className="font-bold text-slate-200 block">Sticker Label Display Fields</span>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Store Branding</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showProductName}
                  onChange={(e) => setShowProductName(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Product Title</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="font-semibold text-emerald-400">Selling Price</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>SKU Code</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHsn}
                  onChange={(e) => setShowHsn(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>HSN / Tax Code</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBarcodeText}
                  onChange={(e) => setShowBarcodeText(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Human Readable Code</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-1">
                Optional Promo / Shelf Tagline:
              </label>
              <input
                type="text"
                value={customPromoText}
                onChange={(e) => setCustomPromoText(e.target.value)}
                placeholder="e.g. 100% Genuine Quality • Special Price"
                className="w-full bg-slate-900 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Print Sheet Preview (Right 7 Cols) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Live Printable Sticker Sheet Preview
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px] hidden sm:inline">Zoom:</span>
              <button
                type="button"
                onClick={() => setPreviewZoom(Math.max(50, previewZoom - 25))}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-bold text-[11px]"
              >
                -
              </button>
              <span className="font-mono text-slate-300 text-[11px] w-10 text-center">
                {previewZoom}%
              </span>
              <button
                type="button"
                onClick={() => setPreviewZoom(Math.min(150, previewZoom + 25))}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-bold text-[11px]"
              >
                +
              </button>
            </div>
          </div>

          {/* Scrollable Sheet Canvas */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-900/60 rounded-xl my-2 border border-slate-800/80 flex items-start justify-center min-h-[300px]">
            <div
              id="printable-barcode-sheet"
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease',
                width: sheetFormat.startsWith('roll') ? '360px' : '100%',
                maxWidth: '780px',
              }}
              className="bg-white text-black p-5 rounded-lg shadow-2xl space-y-3 font-sans select-text border border-slate-300"
            >
              {labelItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Tag className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-50" />
                  <p className="font-bold text-sm">No barcode labels queued for printing.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Select items or increase quantities on the left panel.
                  </p>
                </div>
              ) : (
                <div className={getGridClasses()}>
                  {labelItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={`bg-white text-black rounded-lg border border-slate-300 flex flex-col items-center justify-between text-center transition-all ${
                        sheetFormat === 'shelf_75x50'
                          ? 'p-4 border-2 border-slate-400'
                          : sheetFormat === 'roll_38x25'
                          ? 'p-2'
                          : 'p-3'
                      }`}
                    >
                      {/* Company Branding */}
                      {showStoreName && (
                        <div className="text-[9px] font-black tracking-wider uppercase text-slate-700 truncate w-full">
                          {settings?.name || settings?.companyName || 'Royal Enterprise POS'}
                        </div>
                      )}

                      {/* Product Name */}
                      {showProductName && (
                        <div
                          className={`font-bold text-black line-clamp-1 mt-0.5 ${
                            sheetFormat === 'shelf_75x50'
                              ? 'text-sm'
                              : sheetFormat === 'roll_38x25'
                              ? 'text-[10px]'
                              : 'text-xs'
                          }`}
                        >
                          {item.name}
                        </div>
                      )}

                      {/* Barcode Graphic */}
                      <div className="my-1 w-full flex justify-center overflow-hidden">
                        <BarcodeRenderer
                          value={item.code}
                          format={symbology}
                          width={getBarcodeWidth()}
                          height={getBarcodeHeight()}
                          displayValue={showBarcodeText}
                          fontSize={sheetFormat === 'roll_38x25' ? 9 : 10}
                        />
                      </div>

                      {/* Shelf Tag Promo / Tagline */}
                      {customPromoText && (
                        <div className="text-[8px] font-bold text-indigo-700 uppercase tracking-tight py-0.5 line-clamp-1">
                          {customPromoText}
                        </div>
                      )}

                      {/* Bottom Row Details */}
                      <div className="w-full flex items-center justify-between text-[10px] font-bold border-t border-slate-200 pt-1 mt-0.5">
                        <div className="text-left">
                          {showSku && (
                            <span className="text-slate-600 font-mono block text-[9px]">
                              SKU: {item.sku}
                            </span>
                          )}
                          {showHsn && item.hsn && (
                            <span className="text-slate-500 font-mono block text-[8px]">
                              HSN: {item.hsn}
                            </span>
                          )}
                        </div>

                        {showPrice && (
                          <div className="text-right">
                            <span
                              className={`text-black font-black font-mono block ${
                                sheetFormat === 'shelf_75x50' ? 'text-sm' : 'text-xs'
                              }`}
                            >
                              {settings?.currencySymbol || '$'}
                              {Number(item.price || 0).toFixed(2)}
                            </span>
                            <span className="text-[8px] text-slate-500 font-normal uppercase">
                              Incl. All Taxes
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview Sheet Summary Footer */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-400 shrink-0">
            <span>
              Sheet Layout: <strong className="text-slate-200 uppercase">{sheetFormat.replace('_', ' ')}</strong> |{' '}
              Total Labels: <strong className="text-indigo-400">{totalLabelCount} stickers</strong>
            </span>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-600/30 active:scale-95 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Confirm & Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      {content}
    </div>
  );
};
