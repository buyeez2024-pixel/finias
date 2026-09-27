import React, { useState, useRef } from 'react';
import { useErp } from '../../context/ErpContext';
import { X, Upload, Download, FileText, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { Product } from '../../types/erp';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductImportModal: React.FC<ProductImportModalProps> = ({ isOpen, onClose }) => {
  const { addProducts, taxGroups, settings, locations } = useErp();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [importCount, setImportCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const headers = [
      'Name*', 
      'SKU', 
      'Barcode', 
      'Category*', 
      'Brand', 
      'Unit*', 
      'CostPrice*', 
      'SellingPrice*', 
      'TaxRate', 
      'AlertQuantity',
      'OpeningStock'
    ];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n"
      + "Sample Product,,123456789,Electronics,BrandX,Nos,100,150,18,10,50";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "product_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportStatus('idle');
      setErrorMsg('');
    }
  };

  const parseCSV = (text: string) => {
    // Simple CSV parser supporting quotes (basic)
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) throw new Error('File must contain a header row and at least one data row.');
    
    const parseLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i+1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.replace('*', '').trim().toLowerCase());
    const data = lines.slice(1).map(parseLine);
    return { headers, data };
  };

  const processImport = async () => {
    if (!file) {
      setErrorMsg('Please select a file to import.');
      setImportStatus('error');
      return;
    }

    setIsProcessing(true);
    setImportStatus('idle');
    setErrorMsg('');

    try {
      const text = await file.text();
      const { headers, data } = parseCSV(text);
      
      const requiredCols = ['name', 'category', 'unit', 'costprice', 'sellingprice'];
      for (const col of requiredCols) {
        if (!headers.includes(col)) {
          throw new Error(`Missing required column: ${col}`);
        }
      }

      const getIdx = (col: string) => headers.indexOf(col);
      
      const defaultTaxGroup = taxGroups.find(g => g.id === settings.defaultTaxGroupId) || taxGroups[0];
      const fallbackTaxRate = defaultTaxGroup ? defaultTaxGroup.totalRate : 0;

      const newProducts: Omit<Product, 'id' | 'currentStock'>[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const name = row[getIdx('name')];
        if (!name) continue; // Skip empty rows

        const sku = getIdx('sku') !== -1 && row[getIdx('sku')] ? row[getIdx('sku')] : `${settings.productSkuPrefix || 'PROD-'}M${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
        const barcode = getIdx('barcode') !== -1 && row[getIdx('barcode')] ? row[getIdx('barcode')] : sku;
        const category = row[getIdx('category')] || 'General';
        const brand = getIdx('brand') !== -1 ? row[getIdx('brand')] : '';
        const unit = row[getIdx('unit')] || 'Nos';
        
        const costPrice = parseFloat(row[getIdx('costprice')]);
        const sellingPrice = parseFloat(row[getIdx('sellingprice')]);

        if (isNaN(costPrice) || isNaN(sellingPrice)) {
          throw new Error(`Row ${i+1}: Cost Price and Selling Price must be numbers.`);
        }

        const taxRateStr = getIdx('taxrate') !== -1 ? row[getIdx('taxrate')] : null;
        const taxRate = taxRateStr && !isNaN(parseFloat(taxRateStr)) ? parseFloat(taxRateStr) : fallbackTaxRate;
        const alertQtyStr = getIdx('alertquantity') !== -1 ? row[getIdx('alertquantity')] : '10';
        const alertQuantity = parseInt(alertQtyStr) || 10;
        
        const stockStr = getIdx('openingstock') !== -1 ? row[getIdx('openingstock')] : '0';
        const openingStock = parseInt(stockStr) || 0;
        
        const defaultLocId = locations && locations.length > 0 ? (locations.find(l => l.isDefault)?.id || locations[0].id) : 'loc_1';

        newProducts.push({
          name,
          sku,
          barcode,
          category,
          brand,
          unit,
          costPrice,
          sellingPrice,
          taxRate,
          alertQuantity,
          type: 'single',
          taxType: 'exclusive',
          source: 'bulk_import',
          creationSource: 'bulk_products_import',
          locationStocks: {
            [defaultLocId]: openingStock
          }
        });
      }

      if (newProducts.length === 0) {
        throw new Error('No valid products found to import.');
      }

      addProducts(newProducts);
      setImportCount(newProducts.length);
      setImportStatus('success');

    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during import.');
      setImportStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportStatus('idle');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Import Products</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          {importStatus === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Import Successful!</h3>
              <p className="text-slate-500 dark:text-slate-400">Successfully imported {importCount} products.</p>
              <button 
                onClick={handleClose}
                className={`mt-4 px-6 py-2.5 font-bold rounded-xl transition ${
                  settings.themeMode === 'light'
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                Close & Return
              </button>
            </div>
          ) : (
            <>
              {/* Instructions & Template */}
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
                <h3 className="text-sky-400 font-bold text-sm mb-2">How it works</h3>
                <ul className="text-xs text-sky-700 dark:text-sky-200/70 space-y-1.5 list-disc pl-4 mb-4">
                  <li>Download the CSV template below.</li>
                  <li>Fill in your product details offline. Columns with asterisks (*) are required.</li>
                  <li>Upload the saved CSV file to bulk import.</li>
                  <li>If SKU is left blank, the system will auto-generate one.</li>
                  <li>Use the <strong>OpeningStock</strong> column to set initial inventory levels.</li>
                </ul>
                <button 
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-bold transition border border-slate-200 dark:border-slate-700"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  Download CSV Template
                </button>
              </div>

              {/* Upload Area */}
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold text-sm block mb-2">Upload CSV File</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-sky-500/50 bg-sky-500/5' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50'}`}
                >
                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-10 h-10 text-sky-400" />
                      <div>
                        <p className="text-slate-900 dark:text-white font-medium">{file.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button 
                        onClick={() => setFile(null)}
                        className="text-xs text-rose-500 hover:text-rose-400 underline mt-2"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">CSV files only</p>
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {importStatus === 'error' && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-rose-700 dark:text-rose-200">
                    <strong className="block text-rose-600 dark:text-rose-400 mb-1">Import Failed</strong>
                    {errorMsg}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        {importStatus !== 'success' && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition disabled:opacity-50 ${
                settings.themeMode === 'light'
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={processImport}
              disabled={!file || isProcessing}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Import Products'
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
