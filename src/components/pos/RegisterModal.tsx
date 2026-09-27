import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  Banknote,
  Clock,
  DollarSign,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Building,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftClosed?: () => void;
  onShiftOpened?: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onShiftClosed,
  onShiftOpened,
}) => {
  const {
    cashRegister = { openingCash: 0, cashSales: 0, totalExpenses: 0, status: 'closed', openedAt: '', cashierName: '' },
    openRegister,
    closeRegister,
    settings = {},
    currentLocation = null,
    currentUser = null,
    setActiveTab,
  } = useErp() || {};

  const [openingFloat, setOpeningFloat] = useState<string>('150.00');
  const [cashierName, setCashierName] = useState<string>(currentUser?.name || 'Sarah Jenkins');
  const [openingNotes, setOpeningNotes] = useState<string>('Morning shift opening verified with cash in hand.');
  const [closingCashCount, setClosingCashCount] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');

  const expectedCashInDrawer = useMemo(() => {
    if (!cashRegister) return 0;
    return cashRegister.openingCash + (cashRegister.cashSales || 0) - (cashRegister.totalExpenses || 0);
  }, [cashRegister]);

  React.useEffect(() => {
    if (isOpen) {
      if (currentUser?.name) {
        setCashierName(currentUser.name);
      }
      if (cashRegister.status === 'open') {
        setClosingCashCount(expectedCashInDrawer.toFixed(2));
      }
    }
  }, [isOpen, currentUser, cashRegister.status, expectedCashInDrawer]);

  if (!isOpen) return null;

  const countedVal = parseFloat(closingCashCount) || 0;
  const difference = countedVal - expectedCashInDrawer;

  const handleOpenShift = () => {
    const floatAmt = parseFloat(openingFloat);
    const validFloat = isNaN(floatAmt) || floatAmt < 0 ? 0 : floatAmt;
    openRegister(validFloat, cashierName, openingNotes || 'Shift initialized with cash in hand');
    if (onShiftOpened) onShiftOpened();
    onClose();
  };

  const handleCloseShift = () => {
    const counted = parseFloat(closingCashCount) || 0;
    closeRegister(counted, closingNotes);
    if (onShiftClosed) onShiftClosed();
    onClose();
  };

  const quickFloatPresets = [0, 50, 100, 150, 200, 300, 500];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                cashRegister.status === 'open'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {cashRegister.status === 'open'
                    ? 'Cash Register & Shift Details'
                    : 'Open Cash Register'}
                </h3>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    cashRegister.status === 'open'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {cashRegister.status === 'open' ? 'Shift Active' : 'Required for POS'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span>Branch: {currentLocation?.name} ({currentLocation?.code})</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cashRegister.status === 'open' ? (
          /* CURRENT OPEN SHIFT METRICS */
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Shift Opened At:</span>
                </span>
                <span className="font-semibold text-white font-mono">{cashRegister.openedAt}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Active Cashier:</span>
                </span>
                <span className="font-semibold text-white">{cashRegister.cashierName}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-center">
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">Opening Float</div>
                  <div className="text-xs font-bold text-slate-200 font-mono mt-0.5">
                    {settings.currencySymbol}
                    {cashRegister.openingCash.toFixed(2)}
                  </div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-emerald-400 font-medium">Cash Sales</div>
                  <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                    +{settings.currencySymbol}
                    {cashRegister.cashSales.toFixed(2)}
                  </div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-blue-400 font-medium">Card Sales</div>
                  <div className="text-xs font-bold text-blue-400 font-mono mt-0.5">
                    {settings.currencySymbol}
                    {cashRegister.cardSales.toFixed(2)}
                  </div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-rose-400 font-medium">Drawer Out</div>
                  <div className="text-xs font-bold text-rose-400 font-mono mt-0.5">
                    -{settings.currencySymbol}
                    {cashRegister.totalExpenses.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Expected Total in Drawer */}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-300 font-bold">Expected Cash in Drawer</div>
                  <div className="text-[11px] text-slate-500">(Opening Float + Cash In - Cash Out)</div>
                </div>
                <div className="text-xl font-extrabold text-emerald-400 font-mono">
                  {settings.currencySymbol}
                  {expectedCashInDrawer.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Closing Form */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Close Cashier Shift & Reconcile</span>
              </h4>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <label className="text-slate-400">Actual Counted Cash in Drawer</label>
                  {closingCashCount && (
                    Math.abs(difference) < 0.01 ? (
                      <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Exact Match
                      </span>
                    ) : difference > 0 ? (
                      <span className="text-amber-400 text-[11px] font-bold">
                        +{settings.currencySymbol}{difference.toFixed(2)} Overage
                      </span>
                    ) : (
                      <span className="text-rose-400 text-[11px] font-bold">
                        -{settings.currencySymbol}{Math.abs(difference).toFixed(2)} Shortage
                      </span>
                    )
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={closingCashCount}
                    onChange={(e) => setClosingCashCount(e.target.value)}
                    placeholder={`Expected: ${expectedCashInDrawer.toFixed(2)}`}
                    className="w-full bg-slate-900 text-white font-bold text-sm pl-8 pr-28 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setClosingCashCount(expectedCashInDrawer.toFixed(2))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold border border-slate-700 transition"
                  >
                    Match Expected
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold">Closing Shift Notes</label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="e.g. Shift ended with zero cash discrepancy"
                  className="w-full bg-slate-900 text-white text-xs px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none mt-1"
                />
              </div>

              <button
                id="close-register-shift-btn"
                onClick={handleCloseShift}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition"
              >
                <Lock className="w-4 h-4" />
                <span>CLOSE REGISTER SHIFT & RECONCILE</span>
              </button>
            </div>
          </div>
        ) : (
          /* MANDATORY OPEN REGISTER FORM */
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>Mandatory Cash in Hand:</strong> The cash register is currently closed. Please specify your physical cash in hand (opening float) to initialize your drawer before accessing the POS Screen.
                </div>
              </div>

              {/* Cash in Hand Input */}
              <div>
                <label className="text-xs text-slate-300 font-bold flex items-center justify-between mb-1.5">
                  <span>Cash in Hand (Opening Amount) *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Currency: {settings.currency}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-extrabold text-lg">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 text-white font-black text-xl pl-10 pr-4 py-3 rounded-2xl border border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner"
                  />
                </div>

                {/* Quick Float Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] font-semibold text-slate-400 mr-1">Quick Select:</span>
                  {quickFloatPresets.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setOpeningFloat(amount.toFixed(2))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                        parseFloat(openingFloat) === amount
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {settings.currencySymbol}{amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cashier Name */}
              <div>
                <label className="text-xs text-slate-300 font-bold mb-1 block">Cashier In-Charge</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    placeholder="Enter cashier name"
                    className="w-full bg-slate-900 text-white text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Opening Notes */}
              <div>
                <label className="text-xs text-slate-300 font-bold mb-1 block">Opening Shift Notes (Optional)</label>
                <input
                  type="text"
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                  placeholder="e.g. Verified opening bills and coin rolls"
                  className="w-full bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition text-center"
              >
                Cancel / Back
              </button>

              <button
                id="save-and-open-pos-register-btn"
                onClick={handleOpenShift}
                className="w-2/3 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/60 flex items-center justify-center gap-2 transition"
              >
                <Unlock className="w-4 h-4" />
                <span>SAVE & OPEN POS SCREEN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

