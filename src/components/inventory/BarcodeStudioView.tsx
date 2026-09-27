import React, { useState, useMemo, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { Product } from '../../types/erp';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import { printElement } from '../../utils/printHelper';
import { formatCurrency } from '../../utils/formatters';
import {
  Printer,
  Barcode,
  Tag,
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
  ArrowLeft,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Info,
} from 'lucide-react';

export type SheetFormat =
  | 'a4_24' // 3 cols x 8 rows (70mm x 37mm)
  | 'a4_30' // 3 cols x 10 rows (70mm x 29.7mm)
  | 'a4_40' // 4 cols x 10 rows (52.5mm x 29.7mm)
  | 'roll_50x30' // Continuous 50mm x 30mm thermal
  | 'roll_38x25' // Compact jewelry 38mm x 25mm
  | 'shelf_75x50'; // Large retail shelf talker 75mm x 50mm

export const BarcodeStudioView: React.FC = () => {
  const {
    products,
    settings,
    setActiveTab,
    barcodeStudioTargetProduct,
    setBarcodeStudioTargetProduct,
  } = useErp();

  const isLight = settings?.themeMode === 'light';

  // Mode: 'single' | 'batch'
  const [printMode, setPrintMode] = useState<'single' | 'batch'>('single');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [singleQty, setSingleQty] = useState<number>(12);

  // Batch products quantity map (productId -> quantity)
  const [batchQuantities, setBatchQuantities] = useState<Record<string, number>>({});

  // Search in batch selector
  const [batchSearch, setBatchSearch] = useState('');
  const [batchFilterCategory, setBatchFilterCategory] = useState('All');

  // Code source: 'barcode' | 'sku' | 'custom'
  const [codeSource, setCodeSource] = useState<'barcode' | 'sku' | 'custom'>('barcode');
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

  // Initialize selected product from context (e.g. if navigated from product row)
  useEffect(() => {
    if (barcodeStudioTargetProduct) {
      setSelectedProductId(barcodeStudioTargetProduct.id);
      setPrintMode('single');
      setBatchQuantities({ [barcodeStudioTargetProduct.id]: 12 });
      // Reset target product after consuming
      setBarcodeStudioTargetProduct(null);
    } else if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
      const initial: Record<string, number> = {};
      products.slice(0, 4).forEach((p) => {
        initial[p.id] = 4;
      });
      setBatchQuantities(initial);
    }
  }, [barcodeStudioTargetProduct, products]);

  const currentSingleProduct =
    products.find((p) => p.id === selectedProductId) ||
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
  const labelItems = useMemo(() => {
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
  }, [printMode, currentSingleProduct, singleQty, batchQuantities, codeSource, customCodeVal, customCodePrefix, products]);

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

  const handleSelectLowStockOnly = () => {
    const updated: Record<string, number> = {};
    products.forEach((p) => {
      if (p.currentStock <= p.alertQuantity) {
        updated[p.id] = Math.max(1, p.alertQuantity);
      }
    });
    setBatchQuantities(updated);
    setPrintMode('batch');
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
        return 24;
      case 'a4_40':
        return 26;
      case 'shelf_75x50':
        return 44;
      default:
        return 34;
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredBatchProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(batchSearch.toLowerCase()) ||
        p.barcode.toLowerCase().includes(batchSearch.toLowerCase());
      const matchesCat = batchFilterCategory === 'All' || p.category === batchFilterCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, batchSearch, batchFilterCategory]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto selection:bg-indigo-600 selection:text-white">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
            <Barcode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Barcode & Labels
              </h1>
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm">
                {totalLabelCount} Labels Queued
              </span>
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Preset: {sheetFormat.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Professional label generation with vector symbology, multi-page paper presets, and high-speed batch printing.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inventory</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={totalLabelCount === 0}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 active:scale-95 flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print {totalLabelCount} Labels</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Configuration + Right Live Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Control Center (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Mode Switcher */}
          <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 grid grid-cols-2 gap-1.5 text-xs shadow-sm">
            <button
              type="button"
              onClick={() => setPrintMode('single')}
              className={`py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 active:scale-95 ${
                printMode === 'single'
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30'
                  : 'text-slate-400 hover:bg-sky-600 hover:text-white hover:shadow-lg hover:shadow-sky-600/30'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Single Product</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintMode('batch')}
              className={`py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 active:scale-95 ${
                printMode === 'batch'
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30'
                  : 'text-slate-400 hover:bg-sky-600 hover:text-white hover:shadow-lg hover:shadow-sky-600/30'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Multi-Item Batch</span>
            </button>
          </div>

          {/* Mode 1: Single Product Selector */}
          {printMode === 'single' ? (
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white text-sm">Product Selection</span>
                <span className="text-slate-400 text-[11px] font-mono">
                  Stock: {currentSingleProduct.currentStock} {currentSingleProduct.unit}
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Select Inventory Item</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — [SKU: {p.sku}] ({formatCurrency(Number(p.sellingPrice || 0), settings)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Single Product Details Card */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Barcode Value:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {currentSingleProduct.barcode || currentSingleProduct.sku || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Selling Price:</span>
                  <span className="font-mono text-white font-bold">
                    {formatCurrency(Number(currentSingleProduct.sellingPrice || 0), settings)}
                  </span>
                </div>
                {currentSingleProduct.hsnCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">HSN Code:</span>
                    <span className="font-mono text-indigo-400 font-bold">
                      {currentSingleProduct.hsnCode}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-bold">Label Copies to Print</label>
                  <span className="text-indigo-400 font-bold">{singleQty} Labels</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSingleQty(Math.max(1, singleQty - 6))}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={singleQty}
                    onChange={(e) => setSingleQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 text-white text-center font-bold px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setSingleQty(singleQty + 6)}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setSingleQty(12)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[11px]"
                    >
                      12x
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleQty(24)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[11px]"
                    >
                      24x
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Multi-Item Batch Selector */
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3.5 text-xs shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white text-sm">Batch Item Quantities</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleMatchCurrentStock}
                    className="text-[10px] bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold transition"
                    title="Set label quantity to current on-hand stock"
                  >
                    Match Stock
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectLowStockOnly}
                    className="text-[10px] bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold transition"
                    title="Queue labels only for items below alert threshold"
                  >
                    Low Stock
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

              {/* Filters for batch products */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    placeholder="Search product..."
                    className="w-full bg-slate-950 text-slate-200 text-xs pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
                  />
                </div>

                <select
                  value={batchFilterCategory}
                  onChange={(e) => setBatchFilterCategory(e.target.value)}
                  className="bg-slate-950 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Quantities List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 border border-slate-800 rounded-xl bg-slate-950/60 scrollbar-thin">
                {filteredBatchProducts.map((p) => {
                  const qty = batchQuantities[p.id] || 0;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-800/40 transition"
                    >
                      <div className="truncate pr-2">
                        <p className="font-bold text-white truncate text-[11px]">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          SKU: {p.sku} | Stock: {p.currentStock} {p.unit}
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
                          max="200"
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

          {/* Paper Format & Symbology Configuration */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-white text-sm">Format & Symbology</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Sticker Paper Preset</label>
                <select
                  value={sheetFormat}
                  onChange={(e) => setSheetFormat(e.target.value as SheetFormat)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
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
                <label className="text-slate-300 font-bold block mb-1.5">Barcode Symbology</label>
                <select
                  value={symbology}
                  onChange={(e) => setSymbology(e.target.value as any)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none font-mono"
                >
                  <option value="CODE128">Code 128 (Universal)</option>
                  <option value="EAN13">EAN-13 (Retail Standard)</option>
                  <option value="UPC">UPC-A (12 Digits)</option>
                  <option value="CODE39">Code 39 (Alphanumeric)</option>
                </select>
              </div>
            </div>

            {/* Code Value Source */}
            <div>
              <label className="text-slate-300 font-bold block mb-1.5">Barcode Value Source</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCodeSource('barcode')}
                  className={`py-2 px-2.5 rounded-xl font-bold text-[11px] transition text-center active:scale-95 ${
                    isLight
                      ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30'
                      : codeSource === 'barcode'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Product Barcode
                </button>
                <button
                  type="button"
                  onClick={() => setCodeSource('sku')}
                  className={`py-2 px-2.5 rounded-xl font-bold text-[11px] transition text-center active:scale-95 ${
                    isLight
                      ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30'
                      : codeSource === 'sku'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Product SKU
                </button>
                <button
                  type="button"
                  onClick={() => setCodeSource('custom')}
                  className={`py-2 px-2.5 rounded-xl font-bold text-[11px] transition text-center active:scale-95 ${
                    isLight
                      ? 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30'
                      : codeSource === 'custom'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Custom Lot Code
                </button>
              </div>

              {codeSource === 'custom' && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2">
                  <label className="text-[11px] text-slate-400 block">
                    Custom Code Value / Lot Prefix:
                  </label>
                  <input
                    type="text"
                    value={customCodeVal}
                    onChange={(e) => setCustomCodeVal(e.target.value)}
                    placeholder="Enter barcode characters..."
                    className="w-full bg-slate-950 text-white font-mono text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Label Fields Visibility Toggles */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-sm">Label Fields Customization</span>
              <span className="text-[10px] text-indigo-400 font-semibold">Live Real-Time Sync</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-950">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Store Name Branding</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-950">
                <input
                  type="checkbox"
                  checked={showProductName}
                  onChange={(e) => setShowProductName(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Product Title</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-950">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="font-semibold text-emerald-400">Selling Price (MRP)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-950">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>SKU Code</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-950">
                <input
                  type="checkbox"
                  checked={showHsn}
                  onChange={(e) => setShowHsn(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>HSN / Tax Rate</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-950">
                <input
                  type="checkbox"
                  checked={showBarcodeText}
                  onChange={(e) => setShowBarcodeText(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Readable Digits</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-1">
                Custom Tagline / Promo Ribbon (Optional):
              </label>
              <input
                type="text"
                value={customPromoText}
                onChange={(e) => setCustomPromoText(e.target.value)}
                placeholder="e.g. Premium Quality • Special Discount"
                className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live High-Resolution Printable Sheet (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col min-h-[600px]">
            {/* Live Sheet Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-indigo-400" />
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    Live Sticker Sheet Simulation
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Exact print scale rendered at 300 DPI vector clarity
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">Zoom:</span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(Math.max(50, previewZoom - 25))}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition"
                >
                  -
                </button>
                <span className="font-mono text-slate-300 text-xs w-10 text-center font-bold">
                  {previewZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(Math.min(150, previewZoom + 25))}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Scrollable Printable Canvas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/80 rounded-2xl my-3 border border-slate-800/80 flex items-start justify-center min-h-[480px]">
              <div
                id="printable-barcode-sheet"
                style={{
                  transform: `scale(${previewZoom / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease',
                  width: sheetFormat.startsWith('roll') ? '380px' : '100%',
                  maxWidth: '820px',
                }}
                className="bg-white text-black p-6 rounded-xl shadow-2xl space-y-4 font-sans select-text border border-slate-300"
              >
                {labelItems.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 space-y-3">
                    <Tag className="w-12 h-12 mx-auto text-slate-400 opacity-40" />
                    <p className="font-bold text-base text-slate-700">No barcode labels queued.</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Select items or increase quantities on the left panel to populate the printable sheet.
                    </p>
                  </div>
                ) : (
                  <div className={getGridClasses()}>
                    {labelItems.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className={`bg-white text-black rounded-lg border border-slate-300 flex flex-col items-center justify-between text-center transition-all shadow-sm ${
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

                        {/* Barcode Vector Graphic */}
                        <div className="my-1.5 w-full flex justify-center overflow-hidden">
                          <BarcodeRenderer
                            value={item.code}
                            format={symbology}
                            width={getBarcodeWidth()}
                            height={getBarcodeHeight()}
                            displayValue={showBarcodeText}
                            fontSize={sheetFormat === 'roll_38x25' ? 9 : 10}
                          />
                        </div>

                        {/* Shelf Tag Promo Ribbon */}
                        {customPromoText && (
                          <div className="text-[8px] font-bold text-indigo-700 uppercase tracking-tight py-0.5 line-clamp-1">
                            {customPromoText}
                          </div>
                        )}

                        {/* Bottom Row Details: SKU & MRP */}
                        <div className="w-full flex items-center justify-between text-[10px] font-bold border-t border-slate-200 pt-1.5 mt-0.5">
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
                                {formatCurrency(Number(item.price || 0), settings)}
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

            {/* Bottom Bar: Print Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 shrink-0 text-xs">
              <div className="text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  Preset: <strong className="text-slate-200 uppercase">{sheetFormat.replace('_', ' ')}</strong> ({totalLabelCount} labels)
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={totalLabelCount === 0}
                  className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 active:scale-95 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Confirm & Print {totalLabelCount} Labels</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
