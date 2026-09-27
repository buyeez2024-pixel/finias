import React from 'react';
import { Product } from '../../types/erp';
import { ProductHistoryView } from './ProductHistoryView';
import { useErp } from '../../context/ErpContext';
import { X, History } from 'lucide-react';

interface ProductHistoryModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

export const ProductHistoryModal: React.FC<ProductHistoryModalProps> = ({
  isOpen,
  product,
  onClose,
}) => {
  const { settings } = useErp();
  if (!isOpen || !product) return null;

  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className={`rounded-2xl w-full max-w-6xl shadow-2xl border overflow-hidden flex flex-col my-6 max-h-[92vh] ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Product History & Movement Audit</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {product.sku}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {product.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl transition cursor-pointer flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 text-white active:scale-95"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <ProductHistoryView
            initialProductId={product.id}
            isModal={true}
            onCloseModal={onClose}
          />
        </div>
      </div>
    </div>
  );
};
