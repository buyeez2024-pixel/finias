import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useErp } from '../../context/ErpContext';
import { Product } from '../../types/erp';
import { validateSpreadsheetFile } from '../../utils/fileValidation';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Boxes,
  FileText,
  Sparkles,
  Layers,
  HelpCircle,
  X
} from 'lucide-react';

interface ParsedProductRow {
  id: string;
  selected: boolean;
  name: string;
  sku?: string;
  barcode?: string;
  category: string;
  brand?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  alertQuantity: number;
  openingStock: number;
  hsnCode?: string;
  isValid: boolean;
  validationError?: string;
  raw: Record<string, any>;
}

export const ImportProductsPage: React.FC = () => {
  const {
    addProducts,
    categories,
    brands,
    units,
    taxGroups,
    locations,
    settings,
    navigateToInventory,
    showFlashNotification,
  } = useErp();

  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Default Tax Rate fallback
  const defaultTaxGroup = taxGroups.find((g) => g.id === settings?.defaultTaxGroupId) || taxGroups[0];
  const fallbackTaxRate = defaultTaxGroup ? defaultTaxGroup.totalRate : 0;
  const defaultLocId = locations && locations.length > 0 ? (locations.find((l) => l.isDefault)?.id || locations[0].id) : 'loc_1';

  // Template Data Generator
  const generateTemplateData = () => {
    const headers = [
      'Name*',
      'SKU',
      'Barcode',
      'Category*',
      'Brand',
      'Unit*',
      'Cost Price*',
      'Selling Price*',
      'Tax Rate (%)',
      'Alert Quantity',
      'Opening Stock',
      'HSN Code',
    ];

    const sampleRows = [
      [
        'Wireless Bluetooth Headphones',
        'SKU-BTH-01',
        '8901234567891',
        'Electronics',
        'ApexTech',
        'Pcs',
        '45.00',
        '79.99',
        '18',
        '10',
        '50',
        '85183000',
      ],
      [
        'Organic Coffee Beans (500g)',
        'SKU-CB-500',
        '8901234567892',
        'Groceries',
        'RoastMaster',
        'Pack',
        '8.50',
        '15.00',
        '5',
        '15',
        '120',
        '09012100',
      ],
      [
        'Ergonomic Desk Chair',
        'SKU-CHR-99',
        '8901234567893',
        'Furniture',
        'ComfortPlus',
        'Nos',
        '120.00',
         me => '199.99',
        '18',
        '5',
        '15',
        '94013000',
      ],
    ];

    return [headers, ...sampleRows];
  };

  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const data = generateTemplateData();
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set auto column width
    worksheet['!cols'] = data[0].map(() => ({ wch: 22 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Import Template');

    const fileName = `product_import_template.${format}`;
    if (format === 'xlsx') {
      XLSX.writeFile(workbook, fileName);
    } else {
      XLSX.writeFile(workbook, fileName, { bookType: 'csv' });
    }

    showFlashNotification(`Downloaded Product ${format.toUpperCase()} template file.`, 'info');
  };

  // Process File Parsing
  const processWorkbook = (wb: XLSX.WorkBook, sheetNameToParse?: string) => {
    const nameToUse = sheetNameToParse || wb.SheetNames[0];
    setSelectedSheet(nameToUse);

    const worksheet = wb.Sheets[nameToUse];
    if (!worksheet) return;

    const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawJson || rawJson.length === 0) {
      setParsedRows([]);
      showFlashNotification('The uploaded file is empty or contains no data rows.', 'error');
      return;
    }

    const parsed: ParsedProductRow[] = rawJson.map((row, index) => {
      const findVal = (...aliases: string[]): string => {
        for (const alias of aliases) {
          const matchedKey = Object.keys(row).find(
            (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === alias.toLowerCase().replace(/[^a-z0-9]/g, '')
          );
          if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
            return String(row[matchedKey]).trim();
          }
        }
        return '';
      };

      const name = findVal('Name', 'Product Name', 'Title', 'Item Name');
      const sku = findVal('SKU', 'Item Code', 'Product Code');
      const barcode = findVal('Barcode', 'EAN', 'UPC', 'GTIN');
      const category = findVal('Category', 'Product Category') || 'General';
      const brand = findVal('Brand', 'Brand Name', 'Manufacturer');
      const unit = findVal('Unit', 'Unit of Measure', 'UoM') || 'Nos';
      const costStr = findVal('Cost Price', 'CostPrice', 'Buy Price', 'Purchase Price', 'Cost');
      const sellStr = findVal('Selling Price', 'SellingPrice', 'Sale Price', 'Price', 'MRP');
      const taxStr = findVal('Tax Rate', 'TaxRate', 'Tax (%)', 'GST Rate', 'VAT');
      const alertStr = findVal('Alert Quantity', 'AlertQuantity', 'Min Stock', 'Alert Qty');
      const stockStr = findVal('Opening Stock', 'OpeningStock', 'Initial Stock', 'Stock Qty', 'Quantity');
      const hsnCode = findVal('HSN Code', 'HSN', 'SAC Code', 'HSN/SAC');

      const costPrice = parseFloat(costStr);
      const sellingPrice = parseFloat(sellStr);
      const taxRate = taxStr !== '' && !isNaN(parseFloat(taxStr)) ? parseFloat(taxStr) : fallbackTaxRate;
      const alertQuantity = alertStr !== '' && !isNaN(parseInt(alertStr)) ? parseInt(alertStr) : 10;
      const openingStock = stockStr !== '' && !isNaN(parseInt(stockStr)) ? parseInt(stockStr) : 0;

      let isValid = true;
      let validationError = '';

      if (!name) {
        isValid = false;
        validationError = 'Missing Product Name';
      } else if (isNaN(costPrice)) {
        isValid = false;
        validationError = 'Invalid or Missing Cost Price';
      } else if (isNaN(sellingPrice)) {
        isValid = false;
        validationError = 'Invalid or Missing Selling Price';
      }

      return {
        id: `row_${index}_${Date.now()}`,
        selected: isValid,
        name,
        sku: sku || undefined,
        barcode: barcode || undefined,
        category,
        brand: brand || undefined,
        unit,
        costPrice: isNaN(costPrice) ? 0 : costPrice,
        sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
        taxRate,
        alertQuantity,
        openingStock,
        hsnCode: hsnCode || undefined,
        isValid,
        validationError,
        raw: row,
      };
    });

    setParsedRows(parsed);
  };

  const handleFileUpload = (f: File) => {
    if (!f) return;
    const valRes = validateSpreadsheetFile(f);
    if (!valRes.isValid) {
      showFlashNotification(valRes.error || 'Invalid file format.', 'error');
      return;
    }

    setIsProcessing(true);
    setFile(f);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        setSheetNames(wb.SheetNames);
        processWorkbook(wb);
        showFlashNotification(`Successfully parsed "${f.name}".`, 'success');
      } catch (err) {
        console.error('Error parsing file:', err);
        showFlashNotification('Failed to parse Excel/CSV file.', 'error');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      showFlashNotification('Failed to read file.', 'error');
    };
    reader.readAsArrayBuffer(f);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSelectRowToggle = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleSelectAllToggle = (selectAll: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: selectAll ? r.isValid : false })));
  };

  const handleExecuteImport = () => {
    const selectedRows = parsedRows.filter((r) => r.selected && r.name);
    if (selectedRows.length === 0) {
      showFlashNotification('No valid product rows selected for import.', 'error');
      return;
    }

    const formattedProducts: Omit<Product, 'id' | 'currentStock'>[] = selectedRows.map((r, idx) => {
      const prefix = settings.productSkuPrefix || 'PROD-';
      const generatedSku = r.sku || `${prefix}M${Math.floor(100000 + Math.random() * 900000)}`;
      const generatedBarcode = r.barcode || generatedSku;

      return {
        name: r.name,
        sku: generatedSku,
        barcode: generatedBarcode,
        category: r.category || 'General',
        brand: r.brand || '',
        unit: r.unit || 'Nos',
        costPrice: r.costPrice,
        sellingPrice: r.sellingPrice,
        taxRate: r.taxRate,
        alertQuantity: r.alertQuantity,
        hsnCode: r.hsnCode,
        type: 'single',
        taxType: 'exclusive',
        source: 'bulk_import',
        creationSource: 'bulk_products_import',
        locationStocks: {
          [defaultLocId]: r.openingStock,
        },
      };
    });

    addProducts(formattedProducts);
    navigateToInventory('matrix');
  };

  const validRowsCount = parsedRows.filter((r) => r.isValid).length;
  const selectedRowsCount = parsedRows.filter((r) => r.selected).length;
  const invalidRowsCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateToInventory('matrix')}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
            title="Back to Products"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              <span>Bulk Import Products</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Bulk import inventory items, pricing, categories, and opening stock levels from Excel (.xlsx) or CSV (.csv) spreadsheets.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Download Template & File Upload Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Download Predesigned Templates */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">1</span>
              <span>Download Product Template</span>
            </div>
            <p className="text-xs text-slate-400">
              Download the predesigned product spreadsheet template with pre-formatted column headers and sample inventory rows.
            </p>

            <div className="mt-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs text-slate-300">
              <div className="font-semibold text-slate-200">Required & Optional Headers:</div>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4">
                <li><strong className="text-slate-200">Name*</strong>: Product Title</li>
                <li><strong className="text-slate-200">Cost Price*</strong> & <strong className="text-slate-200">Selling Price*</strong></li>
                <li><strong className="text-slate-200">Category*</strong> & <strong className="text-slate-200">Unit*</strong></li>
                <li>SKU, Barcode, Brand, Tax Rate (%), Opening Stock, HSN Code</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleDownloadTemplate('xlsx')}
              className="w-full py-2.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel (.xlsx) Template</span>
            </button>
            <button
              onClick={() => handleDownloadTemplate('csv')}
              className="w-full py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Download CSV (.csv) Template</span>
            </button>
          </div>
        </div>

        {/* Step 2: Upload File Box */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">2</span>
            <span>Upload Product Spreadsheet</span>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                : file
                ? 'border-indigo-500/60 bg-indigo-500/5'
                : 'border-slate-700 hover:border-slate-500 bg-slate-950/50 hover:bg-slate-950'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {file ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white">{file.name}</div>
                <div className="text-xs text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB &bull; Click or drag new file to replace
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center mx-auto border border-slate-700">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-200">
                  Click to select file or drag & drop here
                </div>
                <div className="text-xs text-slate-400">
                  Supports Excel (.xlsx, .xls) and CSV (.csv) spreadsheet formats
                </div>
              </div>
            )}
          </div>

          {sheetNames.length > 1 && (
            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="font-semibold text-slate-300">Select Worksheet:</span>
              <select
                value={selectedSheet}
                onChange={(e) => {
                  const name = e.target.value;
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const buffer = evt.target?.result;
                      const wb = XLSX.read(buffer, { type: 'array' });
                      processWorkbook(wb, name);
                    };
                    reader.readAsArrayBuffer(file);
                  }
                }}
                className="bg-slate-900 text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                {sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Data Table Preview & Import Execution */}
      {parsedRows.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">3</span>
                <span>Review Parsed Product Records ({parsedRows.length})</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Review extracted items and prices before importing into stock.
              </p>
            </div>

            {/* Quick Stats & Import CTA */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {validRowsCount} Valid
                </span>
                {invalidRowsCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-400 font-bold pl-2 border-l border-slate-800">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {invalidRowsCount} Invalid
                  </span>
                )}
              </div>

              <button
                onClick={handleExecuteImport}
                disabled={selectedRowsCount === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition ${
                  selectedRowsCount > 0
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Import {selectedRowsCount} Products</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRowsCount > 0 && selectedRowsCount === validRowsCount}
                      onChange={(e) => handleSelectAllToggle(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">SKU / Barcode</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">Cost Price</th>
                  <th className="p-3.5 text-right">Selling Price</th>
                  <th className="p-3.5 text-center">Tax Rate</th>
                  <th className="p-3.5 text-center">Opening Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
                {parsedRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-800/40 transition ${
                      !row.isValid
                        ? 'bg-amber-500/5'
                        : row.selected
                        ? 'bg-indigo-600/5'
                        : 'opacity-60'
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        disabled={!row.isValid}
                        onChange={() => handleSelectRowToggle(row.id)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4 disabled:opacity-30"
                      />
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> {row.validationError || 'Invalid'}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-white whitespace-nowrap">
                      {row.name || <span className="text-slate-500 italic">Empty Name</span>}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300 whitespace-nowrap">
                      {row.sku || <span className="text-slate-500 italic">Auto-generate</span>}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700 text-[11px]">
                        {row.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold text-slate-300 whitespace-nowrap">
                      ${row.costPrice.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                      ${row.sellingPrice.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-400 whitespace-nowrap">
                      {row.taxRate}%
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-indigo-400 whitespace-nowrap">
                      {row.openingStock} {row.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
