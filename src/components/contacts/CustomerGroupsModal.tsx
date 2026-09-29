import React, { useState } from 'react';
import { CustomerGroup } from '../../types/erp';
import { useErp } from '../../context/ErpContext';
import { Users, Plus, Edit, Trash2, X, CheckCircle2, Percent, Calculator, Info, ShieldAlert } from 'lucide-react';

interface CustomerGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGroup?: CustomerGroup | null;
}

export const CustomerGroupFormModal: React.FC<CustomerGroupFormModalProps> = ({
  isOpen,
  onClose,
  editingGroup,
}) => {
  const { addCustomerGroup, updateCustomerGroup, settings } = useErp();
  const isLight = settings?.themeMode === 'light';

  const [name, setName] = useState(editingGroup?.name || '');
  const [calculationPercentage, setCalculationPercentage] = useState<string>(
    editingGroup !== undefined && editingGroup !== null
      ? String(editingGroup.calculationPercentage)
      : '-20'
  );
  const [description, setDescription] = useState(editingGroup?.description || '');

  React.useEffect(() => {
    if (editingGroup) {
      setName(editingGroup.name);
      setCalculationPercentage(String(editingGroup.calculationPercentage));
      setDescription(editingGroup.description || '');
    } else {
      setName('');
      setCalculationPercentage('-20');
      setDescription('');
    }
  }, [editingGroup, isOpen]);

  if (!isOpen) return null;

  const numericPct = parseFloat(calculationPercentage) || 0;
  const sampleBasePrice = 200;
  const sampleCalculatedPrice = Math.round(sampleBasePrice * (1 + numericPct / 100) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    if (editingGroup) {
      updateCustomerGroup(editingGroup.id, {
        name: cleanName,
        calculationPercentage: numericPct,
        description: description.trim(),
      });
    } else {
      addCustomerGroup({
        name: cleanName,
        calculationPercentage: numericPct,
        description: description.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pt-10 sm:pt-4 p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-hidden">
      <div className={`w-full max-w-lg h-[calc(100dvh-2.5rem)] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60' : 'bg-slate-900 border-slate-800 text-white shadow-black/90'
      }`}>
        {/* Mobile Pull Handle & Top Margin */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 bg-amber-500/20 rounded-xl text-amber-500 border border-amber-500/30 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-base font-bold tracking-tight truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {editingGroup ? 'Edit Customer Group' : 'Add Customer Group'}
              </h3>
              <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Configure selling price percentage calculations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl transition flex items-center justify-center border shrink-0 cursor-pointer active:scale-95 shadow-2xs ${
              isLight
                ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 custom-scrollbar touch-pan-y">
          {/* Customer Group Name */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Customer Group Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              id="input-customer-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Friend, Wholesale, VIP Client"
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition font-medium ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  : 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500'
              }`}
            />
          </div>

          {/* Calculation Percentage */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <span className="flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-500" />
                <span>Calculation Percentage (%)</span>
                <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                {numericPct > 0 ? `+${numericPct}% Mark-up` : numericPct < 0 ? `${numericPct}% Discount` : '0% Standard'}
              </span>
            </label>
            <input
              type="number"
              step="any"
              required
              id="input-customer-group-percentage"
              value={calculationPercentage}
              onChange={(e) => setCalculationPercentage(e.target.value)}
              placeholder="-20 or 20"
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:border-indigo-500 focus:outline-none transition font-mono font-bold text-lg ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900'
                  : 'bg-slate-950 border-slate-700 text-slate-100'
              }`}
            />
            <p className={`text-[11px] mt-2 leading-relaxed p-2.5 rounded-xl border ${
              isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-950/60 text-slate-400 border-slate-800'
            }`}>
              <Info className="w-3.5 h-3.5 text-indigo-500 inline shrink-0 mr-1.5 -mt-0.5" />
              Note: Use negative sign (e.g. <strong className="text-emerald-600 dark:text-emerald-300">-20</strong>) for 20% discount on selling price, or positive (e.g. <strong className="text-amber-600 dark:text-amber-300">20</strong>) for +20% price increase.
            </p>
          </div>

          {/* Calculation Example Preview Box */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isLight ? 'bg-indigo-50/60 border-indigo-200 text-slate-800' : 'bg-indigo-950/40 border-indigo-500/30'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-300">
              <Calculator className="w-4 h-4 text-indigo-500" />
              <span>Selling Price Calculation Example:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-indigo-200 dark:border-indigo-500/20">
              <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>Base Selling Price:</div>
              <div className={`text-right font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>${sampleBasePrice.toFixed(2)}</div>
              
              <div className={isLight ? 'text-slate-600' : 'text-slate-400'}>Customer Group ({name || 'Group'}):</div>
              <div className={`text-right font-bold ${numericPct < 0 ? 'text-emerald-600 dark:text-emerald-400' : numericPct > 0 ? 'text-amber-600 dark:text-amber-400' : isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {numericPct > 0 ? `+${numericPct}%` : `${numericPct}%`}
              </div>

              <div className="text-indigo-600 dark:text-indigo-200 font-bold border-t border-indigo-200 dark:border-indigo-500/30 pt-1.5">Effective Price (POS/Sell):</div>
              <div className={`text-right font-black text-sm border-t border-indigo-200 dark:border-indigo-500/30 pt-1.5 ${isLight ? 'text-indigo-700' : 'text-white'}`}>
                ${sampleCalculatedPrice.toFixed(2)}
              </div>
            </div>
            <p className={`text-[10px] italic pt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              * The system applies this calculation internally to product selling prices without showing a separate discount line.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Description / Internal Notes
            </label>
            <textarea
              rows={2}
              id="input-customer-group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Special pricing tier for friends and family members"
              className={`w-full text-xs p-3 rounded-xl border focus:border-indigo-500 focus:outline-none transition resize-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  : 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500'
              }`}
            />
          </div>

          {/* Footer Actions */}
          <div className={`flex items-center justify-end gap-2.5 pt-3 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl transition border text-center cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-customer-group"
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{editingGroup ? 'Update Group' : 'Save Customer Group'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
