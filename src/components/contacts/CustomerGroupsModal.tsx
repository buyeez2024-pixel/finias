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
  const { addCustomerGroup, updateCustomerGroup } = useErp();

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingGroup ? 'Edit Customer Group' : 'Add Customer Group'}
              </h3>
              <p className="text-xs text-slate-400">Configure selling price percentage calculations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Customer Group Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Customer Group Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              id="input-customer-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Friend, Wholesale, VIP Client"
              className="w-full bg-slate-950 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none transition font-medium"
            />
          </div>

          {/* Calculation Percentage */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-400" />
                <span>Calculation Percentage (%)</span>
                <span className="text-rose-400">*</span>
              </span>
              <span className="text-[10px] text-amber-400 font-mono font-bold">
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
              className="w-full bg-slate-950 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none transition font-mono font-bold text-lg"
            />
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <Info className="w-3.5 h-3.5 text-indigo-400 inline shrink-0 mr-1.5 -mt-0.5" />
              Note: Use negative sign (e.g. <strong className="text-emerald-300">-20</strong>) for 20% discount on selling price, or positive (e.g. <strong className="text-amber-300">20</strong>) for +20% price increase.
            </p>
          </div>

          {/* Calculation Example Preview Box */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>Selling Price Calculation Example:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-indigo-500/20">
              <div className="text-slate-400">Base Selling Price:</div>
              <div className="text-right text-slate-200 font-bold">${sampleBasePrice.toFixed(2)}</div>
              
              <div className="text-slate-400">Customer Group ({name || 'Group'}):</div>
              <div className={`text-right font-bold ${numericPct < 0 ? 'text-emerald-400' : numericPct > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {numericPct > 0 ? `+${numericPct}%` : `${numericPct}%`}
              </div>

              <div className="text-indigo-200 font-bold border-t border-indigo-500/30 pt-1.5">Effective Price (POS/Sell):</div>
              <div className="text-right font-black text-white text-sm border-t border-indigo-500/30 pt-1.5">
                ${sampleCalculatedPrice.toFixed(2)}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic pt-1">
              * The system applies this calculation internally to product selling prices without showing a separate discount line.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description / Internal Notes
            </label>
            <textarea
              rows={2}
              id="input-customer-group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Special pricing tier for friends and family members"
              className="w-full bg-slate-950 text-slate-100 text-xs p-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none transition resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-customer-group"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingGroup ? 'Update Group' : 'Save Customer Group'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
