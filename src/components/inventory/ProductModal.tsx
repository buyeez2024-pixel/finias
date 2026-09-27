import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { Product } from '../../types/erp';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import {
  Package,
  X,
  CheckCircle2,
  DollarSign,
  Layers,
  Barcode,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  Image as ImageIcon,
} from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { products, locations, addProduct, updateProduct, settings, taxGroups, taxRates, units } = useErp();

  const [name, setName] = useState(productToEdit?.name || '');
  const [sku, setSku] = useState(productToEdit?.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [barcode, setBarcode] = useState(productToEdit?.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  const [hsnCode, setHsnCode] = useState(productToEdit?.hsnCode || '8528.52');
  const [taxGroupId, setTaxGroupId] = useState(productToEdit?.taxGroupId || settings.defaultTaxGroupId || 'tg_gst_18');
  const [taxType, setTaxType] = useState<'exclusive' | 'inclusive' | 'exempt'>(productToEdit?.taxType || settings.taxCalculationType || 'exclusive');
  const [category, setCategory] = useState(productToEdit?.category || 'Electronics');
  const [brand, setBrand] = useState(productToEdit?.brand || 'Apex Tech');
  const [unit, setUnit] = useState(productToEdit?.unit || 'Pcs');
  const [costPrice, setCostPrice] = useState(productToEdit?.costPrice?.toString() || '50.00');
  const [sellingPrice, setSellingPrice] = useState(productToEdit?.sellingPrice?.toString() || '99.00');
  const [taxRate, setTaxRate] = useState(
    productToEdit?.taxRate?.toString() ||
    (taxGroups.find((g) => g.id === (productToEdit?.taxGroupId || settings.defaultTaxGroupId))?.totalRate?.toString() || '18.0')
  );
  const [alertQuantity, setAlertQuantity] = useState(productToEdit?.alertQuantity?.toString() || '10');
  const [image, setImage] = useState(productToEdit?.image || '');
  const [description, setDescription] = useState(productToEdit?.description || '');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) setImage(result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Multi-location stock allocation
  const [locationStocks, setLocationStocks] = useState<Record<string, number>>(() => {
    if (productToEdit?.locationStocks) return productToEdit.locationStocks;
    const initial: Record<string, number> = {};
    locations.forEach((loc) => {
      initial[loc.id] = 10;
    });
    return initial;
  });

  // Check for duplicate barcode in other products
  const duplicateBarcodeProduct = useMemo(() => {
    if (!barcode.trim()) return null;
    return products.find(
      (p) => p.barcode === barcode.trim() && p.id !== productToEdit?.id
    );
  }, [barcode, products, productToEdit]);

  // Check for duplicate SKU in other products
  const duplicateSkuProduct = useMemo(() => {
    if (!sku.trim()) return null;
    return products.find(
      (p) => p.sku.toLowerCase() === sku.trim().toLowerCase() && p.id !== productToEdit?.id
    );
  }, [sku, products, productToEdit]);

  const isLight = settings.themeMode === 'light';

  if (!isOpen) return null;

  // Generate Standard EAN-13 with valid checksum
  const generateEan13 = () => {
    const prefix = '890'; // Standard GS1 prefix
    let code = prefix;
    for (let i = 0; i < 9; i++) {
      code += Math.floor(Math.random() * 10);
    }
    // Calculate 13th digit (checksum)
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checksum = (10 - (sum % 10)) % 10;
    setBarcode(code + checksum);
  };

  // Generate Code-128 SKU
  const generateCode128Sku = () => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    const prefix = settings.productSkuPrefix || 'PROD-';
    setSku(`${prefix}${rand}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cost = parseFloat(costPrice) || 0;
    const price = parseFloat(sellingPrice) || 0;
    const tax = parseFloat(taxRate) || 0;
    const alertQty = parseInt(alertQuantity) || 5;

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        name,
        sku,
        barcode,
        hsnCode: hsnCode.trim(),
        taxGroupId,
        taxType,
        category,
        brand,
        unit,
        costPrice: cost,
        sellingPrice: price,
        taxRate: tax,
        alertQuantity: alertQty,
        image,
        description,
        locationStocks,
      });
    } else {
      addProduct({
        sku,
        barcode,
        hsnCode: hsnCode.trim(),
        taxGroupId,
        taxType,
        name,
        category,
        brand,
        unit,
        costPrice: cost,
        sellingPrice: price,
        taxRate: tax,
        alertQuantity: alertQty,
        image: image || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=300&q=80',
        description,
        locationStocks,
      });
    }

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className={`border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Package className="w-5 h-5 text-indigo-500" />
              <span>{productToEdit ? 'Edit Product Item' : 'Add New Product (ERP Inventory)'}</span>
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Basic Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold`}>Product Name *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ultra HD Smart LED Display"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-500 mt-1 ${
                    isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                  }`}
                />
              </div>

              {/* SKU Field with auto-generator */}
              <div>
                <div className="flex items-center justify-between">
                  <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold`}>SKU / Item Code *</label>
                  <button
                    type="button"
                    onClick={generateCode128Sku}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                    title="Auto-generate SKU"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Auto-generate</span>
                  </button>
                </div>
                <input
                  required
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className={`w-full font-mono px-3 py-2 rounded-xl border focus:outline-none mt-1 ${
                    isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                  }`}
                />
                {duplicateSkuProduct && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>SKU used by: {duplicateSkuProduct.name}</span>
                  </p>
                )}
              </div>

              {/* Barcode Field with EAN-13 Generator */}
              <div>
                <div className="flex items-center justify-between">
                  <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold`}>Barcode (EAN/UPC/Code128)</label>
                  <button
                    type="button"
                    onClick={generateEan13}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-semibold"
                    title="Generate valid EAN-13"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Generate EAN-13</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Type or USB scanner barcode..."
                  className={`w-full font-mono px-3 py-2 rounded-xl border focus:outline-none mt-1 ${
                    isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                  }`}
                />
                {duplicateBarcodeProduct && (
                  <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Warning: Matches {duplicateBarcodeProduct.name}</span>
                  </p>
                )}
              </div>

              {/* HSN / SAC Code */}
              <div>
                <div className="flex items-center justify-between">
                  <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold flex items-center gap-1`}>
                    <span>HSN / SAC Code</span>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-600/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                      GST Compliant
                    </span>
                  </label>
                </div>
                <input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="e.g. 8528.52, 8471, 6109"
                  className={`w-full font-mono font-bold px-3 py-2 rounded-xl border focus:outline-none focus:border-indigo-500 mt-1 ${
                    isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                  }`}
                />
              </div>

              {/* Category */}
              {Boolean(settings.enableCategory) && (
                <div>
                  <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold`}>Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Electronics, Grocery, Apparel"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none mt-1 ${
                      isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                    }`}
                  />
                </div>
              )}

              {/* Brand */}
              {Boolean(settings.enableBrand) && (
                <div>
                  <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold`}>Brand / Manufacturer</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Apex Tech"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none mt-1 ${
                      isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                    }`}
                  />
                </div>
              )}

              <div>
                <label className={`${isLight ? 'text-slate-700' : 'text-slate-300'} font-semibold flex items-center justify-between`}>
                  <span>Unit of Measurement</span>
                  <span className="text-[10px] text-indigo-500 font-semibold">Configured in Units</span>
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none mt-1 font-medium text-xs ${
                    isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
                  }`}
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.shortName}>
                      {u.name} ({u.shortName}) {u.allowDecimal ? '• Decimals allowed' : ''} {!u.isBaseUnit && u.baseUnitMultiplier ? `• [1 = ${u.baseUnitMultiplier} base]` : ''}
                    </option>
                  ))}
                  {!units.some((u) => u.shortName.toLowerCase() === (unit || '').toLowerCase()) && unit && (
                    <option value={unit}>{unit} (Custom)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Live Barcode Graphic Preview Card */}
            {barcode && (
              <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="space-y-0.5 text-left">
                  <span className={`text-[11px] font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <Barcode className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Rendered Barcode Graphic</span>
                  </span>
                  <p className="text-[10px] text-slate-500">
                    High-resolution vector barcode ready for POS laser & optical scanners
                  </p>
                </div>
                <div className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white border-slate-700'
                }`}>
                  <BarcodeRenderer
                    value={barcode}
                    width={1.4}
                    height={32}
                    fontSize={9}
                  />
                </div>
              </div>
            )}

            {/* Pricing, Tax Group & Margins */}
            <div className={`space-y-3 p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`${isLight ? 'text-slate-600' : 'text-slate-400'} font-semibold text-xs block mb-1`}>
                    Cost Price ({settings.currencySymbol})
                  </label>
                  <div className={`flex items-center rounded-lg border overflow-hidden focus-within:border-emerald-500 transition ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
                  }`}>
                    <div className={`px-2.5 py-1.5 font-mono font-bold text-xs select-none border-r ${
                      isLight ? 'bg-slate-100 text-emerald-700 border-slate-200' : 'bg-slate-950 text-emerald-400 border-slate-800'
                    }`}>
                      {settings.currencySymbol}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className={`w-full bg-transparent font-mono font-bold text-xs px-2.5 py-1.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        isLight ? 'text-emerald-700' : 'text-emerald-400'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`${isLight ? 'text-slate-600' : 'text-slate-400'} font-semibold text-xs block mb-1`}>
                    Selling Price ({settings.currencySymbol})
                  </label>
                  <div className={`flex items-center rounded-lg border overflow-hidden focus-within:border-indigo-500 transition ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
                  }`}>
                    <div className={`px-2.5 py-1.5 font-mono font-bold text-xs select-none border-r ${
                      isLight ? 'bg-slate-100 text-indigo-700 border-slate-200' : 'bg-slate-950 text-indigo-400 border-slate-800'
                    }`}>
                      {settings.currencySymbol}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className={`w-full bg-transparent font-mono font-bold text-xs px-2.5 py-1.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`${isLight ? 'text-slate-600' : 'text-slate-400'} font-semibold text-xs block mb-1`}>Reorder Alert Qty</label>
                  <input
                    type="number"
                    value={alertQuantity}
                    onChange={(e) => setAlertQuantity(e.target.value)}
                    className={`w-full font-mono text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      isLight ? 'bg-white text-amber-700 border-slate-200' : 'bg-slate-900 text-amber-300 border-slate-700'
                    }`}
                  />
                </div>
              </div>

              {/* Tax Group & Tax Type Selection */}
              {Boolean(settings.enablePriceAndTaxInfo) && (
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <div className="sm:col-span-2">
                    <label className={`${isLight ? 'text-slate-600' : 'text-slate-400'} font-semibold flex items-center justify-between`}>
                      <span>Applicable Tax Group</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                        Rate: {taxRate}%
                      </span>
                    </label>
                    <select
                      value={taxGroupId}
                      onChange={(e) => {
                        const gid = e.target.value;
                        setTaxGroupId(gid);
                        const found = taxGroups.find((g) => g.id === gid);
                        if (found) {
                          setTaxRate(found.totalRate.toString());
                        }
                      }}
                      className={`w-full font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none mt-1 ${
                        isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-700'
                      }`}
                    >
                      {taxGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.totalRate}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`${isLight ? 'text-slate-600' : 'text-slate-400'} font-semibold`}>Selling Price Tax</label>
                    <select
                      value={taxType}
                      onChange={(e) => setTaxType(e.target.value as any)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border focus:outline-none mt-1 capitalize font-medium ${
                        isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-700'
                      }`}
                    >
                      <option value="exclusive">Exclusive</option>
                      <option value="inclusive">Inclusive</option>
                      <option value="exempt">Exempt (0%)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Multi-Location Initial Stock Distribution */}
            <div className="space-y-2">
              <label className={`${isLight ? 'text-slate-600' : 'text-slate-300'} font-bold uppercase tracking-wider text-[11px]`}>
                Multi-Location Stock Distribution
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {locations.map((loc) => (
                  <div key={loc.id} className={`p-2.5 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className={`text-[11px] font-semibold truncate ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{loc.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={locationStocks[loc.id] ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setLocationStocks((prev) => ({ ...prev, [loc.id]: val }));
                        }}
                        className={`w-full font-bold px-2 py-1 rounded border focus:outline-none ${
                          isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-700'
                        }`}
                      />
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Image & Upload */}
            <div className={`space-y-2 p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center justify-between">
                <label className={`${isLight ? 'text-slate-600' : 'text-slate-300'} font-semibold text-xs flex items-center gap-1.5`}>
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Product Image</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {image?.startsWith('data:') ? 'Local File' : image ? 'Web URL' : 'No Image'}
                </span>
              </div>

              {image && (
                <div className={`relative aspect-video w-full rounded-lg border overflow-hidden flex items-center justify-center ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <img src={image} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-md text-xs font-bold shadow hover:bg-rose-500"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-1.5 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-white transition flex items-center justify-center gap-1.5 text-xs font-bold shrink-0"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Image File</span>
                </button>
                <input
                  type="text"
                  value={image.startsWith('data:') ? '' : image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder={image.startsWith('data:') ? 'Custom file attached' : 'Or paste Image URL (https://...)'}
                  className={`w-full text-xs px-3 py-1.5 rounded-xl border focus:outline-none focus:border-indigo-500 truncate ${
                    isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-700'
                  }`}
                />
              </div>
            </div>

            <div className={`pt-3 border-t flex justify-end gap-2.5 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-2.5 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95 flex items-center justify-center ${
                  isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

