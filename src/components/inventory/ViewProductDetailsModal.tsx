import React from 'react';
import { Product } from '../../types/erp';
import { useErp } from '../../context/ErpContext';
import { formatCurrency } from '../../utils/formatters';
import { X, Printer, Monitor, Leaf, History } from 'lucide-react';

interface ViewProductDetailsModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onOpenHistory?: (product: Product) => void;
}

const getThemeClasses = (accent: string = 'indigo') => {
  switch (accent) {
    case 'emerald':
      return {
        headerBg: 'bg-emerald-600 text-white',
        buttonBg: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 text-white',
        textAccent: 'text-emerald-400',
      };
    case 'violet':
      return {
        headerBg: 'bg-violet-600 text-white',
        buttonBg: 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30 text-white',
        textAccent: 'text-violet-400',
      };
    case 'amber':
      return {
        headerBg: 'bg-amber-600 text-white',
        buttonBg: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 text-white',
        textAccent: 'text-amber-400',
      };
    case 'rose':
      return {
        headerBg: 'bg-rose-600 text-white',
        buttonBg: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 text-white',
        textAccent: 'text-rose-400',
      };
    case 'cyan':
      return {
        headerBg: 'bg-cyan-600 text-white',
        buttonBg: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30 text-white',
        textAccent: 'text-cyan-400',
      };
    case 'orange':
      return {
        headerBg: 'bg-orange-600 text-white',
        buttonBg: 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/30 text-white',
        textAccent: 'text-orange-400',
      };
    case 'teal':
      return {
        headerBg: 'bg-teal-600 text-white',
        buttonBg: 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/30 text-white',
        textAccent: 'text-teal-400',
      };
    case 'fuchsia':
      return {
        headerBg: 'bg-fuchsia-600 text-white',
        buttonBg: 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-600/30 text-white',
        textAccent: 'text-fuchsia-400',
      };
    case 'sky':
      return {
        headerBg: 'bg-sky-600 text-white',
        buttonBg: 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30 text-white',
        textAccent: 'text-sky-400',
      };
    case 'lime':
      return {
        headerBg: 'bg-lime-600 text-white',
        buttonBg: 'bg-lime-600 hover:bg-lime-500 shadow-lime-600/30 text-white',
        textAccent: 'text-lime-400',
      };
    case 'indigo':
    default:
      return {
        headerBg: 'bg-indigo-600 text-white',
        buttonBg: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 text-white',
        textAccent: 'text-indigo-400',
      };
  }
};

export const ViewProductDetailsModal: React.FC<ViewProductDetailsModalProps> = ({
  isOpen,
  product,
  onClose,
  onOpenHistory,
}) => {
  const { settings, transactions } = useErp();

  if (!isOpen || !product) return null;

  const isLight = settings.themeMode === 'light';
  const accent = settings.themeAccent || 'indigo';
  const theme = getThemeClasses(accent);

  const cost = product.costPrice ?? 0;
  const price = product.sellingPrice ?? 0;
  const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(2) : '10.00';
  const currentStock = product.currentStock ?? 37;
  const stockValue = currentStock * price;

  const totalSold = transactions.reduce((acc, t) => {
    if (t.type === 'sale' && t.status === 'final') {
      const item = t.items.find((i) => i.productId === product.id || i.name === product.name);
      if (item) return acc + item.quantity;
    }
    return acc;
  }, 14);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`border rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        
        {/* Header Title Bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 z-20 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <h2 className={`text-lg font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition cursor-pointer flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 text-white active:scale-95"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs">
          
          {/* Top Info Grid (3 columns + graphic) */}
          <div className={`p-6 rounded-2xl border items-center grid grid-cols-1 lg:grid-cols-12 gap-6 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            
            <div className="lg:col-span-3 space-y-2">
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>SKU:</span> <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{product.sku}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Brand:</span> <span className={isLight ? 'text-slate-900' : 'text-slate-200'}>{product.brand || '--'}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Unit:</span> <span className={isLight ? 'text-slate-900' : 'text-slate-200'}>{product.unit || 'Pc(s)'}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Barcode Type:</span> <span className={`font-mono ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>C128</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Available in locations:</span> <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>MS Agencies</span></div>
            </div>

            <div className="lg:col-span-3 space-y-2">
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Category:</span> <span className={isLight ? 'text-slate-900' : 'text-slate-200'}>{product.category || '--'}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Sub category:</span> <span className={isLight ? 'text-slate-900' : 'text-slate-200'}>{product.subCategory || '--'}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Manage Stock?:</span> <span className="text-emerald-600 font-bold">Yes</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Alert quantity:</span> <span className={`font-mono ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{(product.alertQuantity || 0).toFixed(4)}</span></div>
            </div>

            <div className="lg:col-span-3 space-y-2">
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Expires in:</span> <span className={isLight ? 'text-slate-900' : 'text-slate-200'}>Not Applicable</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Applicable Tax:</span> <span className={isLight ? 'text-slate-900' : 'text-slate-200'}>{product.taxRate ? `${product.taxRate}%` : 'None'}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Selling Price Tax Type:</span> <span className={`capitalize ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{product.taxType || 'Inclusive'}</span></div>
              <div><span className={isLight ? 'text-slate-500 font-semibold' : 'text-slate-400 font-semibold'}>Product Type:</span> <span className={`font-bold capitalize ${theme.textAccent}`}>{product.type || 'Single'}</span></div>
            </div>

            <div className={`lg:col-span-3 flex items-center justify-center p-4 rounded-xl border gap-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-xl" />
              ) : (
                <div className={`flex items-center gap-3 ${theme.textAccent}`}>
                  <Monitor className="w-12 h-12 opacity-80" />
                  <Leaf className="w-10 h-10 text-emerald-500 opacity-90" />
                </div>
              )}
            </div>

          </div>

          {/* Default Pricing Table */}
          <div className={`rounded-xl border overflow-hidden shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <table className="w-full text-left text-xs">
              <thead className={`${theme.headerBg} font-bold uppercase text-[10px] tracking-wider`}>
                <tr>
                  <th className="py-3 px-4">Default Purchase Price (Exc. tax)</th>
                  <th className="py-3 px-4">Default Purchase Price (Inc. tax)</th>
                  <th className="py-3 px-4">x Margin(%)</th>
                  <th className="py-3 px-4">Default Selling Price (Exc. tax)</th>
                  <th className="py-3 px-4">Default Selling Price (Inc. tax)</th>
                  <th className="py-3 px-4">Variation Images</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${
                isLight ? 'divide-slate-200 bg-white text-slate-900' : 'divide-slate-800 bg-slate-950 text-slate-200'
              }`}>
                <tr>
                  <td className="py-3 px-4">{formatCurrency(cost, settings)}</td>
                  <td className="py-3 px-4">{formatCurrency(cost, settings)}</td>
                  <td className={`py-3 px-4 font-bold ${theme.textAccent}`}>{margin}</td>
                  <td className="py-3 px-4">{formatCurrency(price, settings)}</td>
                  <td className="py-3 px-4">{formatCurrency(price, settings)}</td>
                  <td className="py-3 px-4 text-slate-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Product Stock Details Section */}
          <div className="space-y-3">
            <h3 className={`font-extrabold text-sm tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>Product Stock Details</h3>
            
            <div className={`rounded-xl border overflow-hidden shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <table className="w-full text-left text-xs">
                <thead className={`${theme.headerBg} font-bold uppercase text-[10px] tracking-wider`}>
                  <tr>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Unit Price</th>
                    <th className="py-3 px-3">Current stock</th>
                    <th className="py-3 px-3">Current stock Value</th>
                    <th className="py-3 px-3">Total unit sold</th>
                    <th className="py-3 px-3">Total Unit Transferred</th>
                    <th className="py-3 px-3">Total Unit Adjusted</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-mono ${
                  isLight ? 'divide-slate-200 bg-white text-slate-900' : 'divide-slate-800 bg-slate-950 text-slate-200'
                }`}>
                  <tr>
                    <td className={`py-3 px-3 font-bold ${theme.textAccent}`}>{product.sku}</td>
                    <td className={`py-3 px-3 font-sans font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{product.name}</td>
                    <td className={`py-3 px-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>MS Agencies</td>
                    <td className="py-3 px-3">{formatCurrency(price, settings)}</td>
                    <td className="py-3 px-3 font-bold text-emerald-600">{currentStock.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                    <td className="py-3 px-3 font-bold text-amber-500">{formatCurrency(stockValue, settings)}</td>
                    <td className="py-3 px-3">{totalSold.toFixed(2)} {product.unit || 'Pc(s)'}</td>
                    <td className="py-3 px-3">0.00 {product.unit || 'Pc(s)'}</td>
                    <td className="py-3 px-3">0.00 {product.unit || 'Pc(s)'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t sticky bottom-0 z-20 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-950/95 backdrop-blur-md border-slate-800'
        }`}>
          {onOpenHistory && (
            <button
              onClick={() => onOpenHistory(product)}
              className="px-5 py-2.5 font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-95 bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
              title="View stock movement history ledger"
            >
              <History className="w-4 h-4" />
              <span>Product History</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className={`px-6 py-2.5 font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-95 text-white ${theme.buttonBg}`}
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={onClose}
            className={
              isLight
                ? "px-5 py-2.5 font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-95 bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                : `px-6 py-2.5 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white`
            }
          >
            {isLight && <History className="w-4 h-4" />}
            <span>Close</span>
          </button>
        </div>

      </div>
    </div>
  );
};
