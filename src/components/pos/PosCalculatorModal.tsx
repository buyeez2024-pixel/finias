import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  Calculator as CalcIcon,
  X,
  Copy,
  Check,
  Delete,
  Sparkles,
} from 'lucide-react';

interface PosCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
  cartTotal?: number;
  onApplyDiscount?: (discountPercent: number) => void;
}

export const PosCalculatorModal: React.FC<PosCalculatorModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = '$',
  cartTotal = 0,
  onApplyDiscount,
}) => {
  const { settings } = useErp();
  const isLight = settings?.themeMode === 'light';

  const [display, setDisplay] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'standard' | 'change' | 'discount'>('standard');

  // Change Calculator States
  const [billTotalInput, setBillTotalInput] = useState<string>(cartTotal > 0 ? cartTotal.toFixed(2) : '0.00');
  const [cashTenderedInput, setCashTenderedInput] = useState<string>('0.00');

  // Discount Calculator States
  const [originalPriceInput, setOriginalPriceInput] = useState<string>(cartTotal > 0 ? cartTotal.toFixed(2) : '100.00');
  const [discountPercentInput, setDiscountPercentInput] = useState<string>('10');

  useEffect(() => {
    if (cartTotal > 0) {
      setBillTotalInput(cartTotal.toFixed(2));
      setOriginalPriceInput(cartTotal.toFixed(2));
    }
  }, [cartTotal, isOpen]);

  // Handle keyboard inputs when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (activeTab === 'standard') {
        if (/^[0-9]$/.test(e.key)) {
          handleDigit(e.key);
        } else if (e.key === '.') {
          handleDecimal();
        } else if (['+', '-', '*', '/'].includes(e.key)) {
          const opMap: Record<string, string> = { '+': '+', '-': '-', '*': '×', '/': '÷' };
          handleOperator(opMap[e.key]);
        } else if (e.key === 'Enter' || e.key === '=') {
          e.preventDefault();
          handleEqual();
        } else if (e.key === 'Backspace') {
          handleBackspace();
        } else if (e.key.toLowerCase() === 'c') {
          handleClear();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, display, equation, activeTab]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(digit);
    } else {
      if (display.length < 16) {
        setDisplay(display + digit);
      }
    }
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    if (display.length === 1 || display === 'Error') {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleToggleSign = () => {
    if (display === '0' || display === 'Error') return;
    if (display.startsWith('-')) {
      setDisplay(display.slice(1));
    } else {
      setDisplay('-' + display);
    }
  };

  const handlePercentage = () => {
    const val = parseFloat(display);
    if (!isNaN(val)) {
      setDisplay((val / 100).toString());
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    setEquation(`${display} ${op} `);
    setDisplay('0');
  };

  const handleEqual = () => {
    if (!equation) return;
    try {
      const parts = equation.trim().split(' ');
      if (parts.length < 2) return;

      const firstOperand = parseFloat(parts[0]);
      const op = parts[1];
      const secondOperand = parseFloat(display);

      let result = 0;
      if (op === '+') result = firstOperand + secondOperand;
      else if (op === '-') result = firstOperand - secondOperand;
      else if (op === '×' || op === '*') result = firstOperand * secondOperand;
      else if (op === '÷' || op === '/') {
        if (secondOperand === 0) {
          setDisplay('Error');
          setEquation('');
          return;
        }
        result = firstOperand / secondOperand;
      } else {
        return;
      }

      // Format cleanly to avoid floating point anomalies
      const formatted = Number.isInteger(result)
        ? result.toString()
        : parseFloat(result.toFixed(6)).toString();

      setEquation(`${firstOperand} ${op} ${secondOperand} =`);
      setDisplay(formatted);
    } catch {
      setDisplay('Error');
      setEquation('');
    }
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Change Calculation
  const billTotal = parseFloat(billTotalInput) || 0;
  const cashTendered = parseFloat(cashTenderedInput) || 0;
  const changeDue = Math.max(0, cashTendered - billTotal);
  const isShortage = cashTendered > 0 && cashTendered < billTotal;

  // Discount Calculation
  const originalPrice = parseFloat(originalPriceInput) || 0;
  const discountPercent = parseFloat(discountPercentInput) || 0;
  const discountAmount = (originalPrice * discountPercent) / 100;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return (
    <div className={`fixed inset-0 z-[120] flex items-center justify-center p-4 ${isLight ? 'bg-slate-900/40' : 'bg-black/80'} backdrop-blur-xs animate-fadeIn`}>
      <div
        className={`w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scaleIn border ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
            : 'bg-slate-900 border-slate-700 text-white shadow-black/80'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isLight
              ? 'bg-slate-50/90 border-slate-200'
              : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${
                isLight
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-2xs'
                  : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
              }`}
            >
              <CalcIcon className="w-5 h-5" />
            </div>
            <div>
              <h3
                className={`text-sm font-bold tracking-tight flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                <span>POS Calculator</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                    isLight
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  F9
                </span>
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
                Retail & cashier calculations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition active:scale-95 ${
              isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'
            }`}
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b p-1.5 gap-1.5 text-xs bg-slate-900 border-slate-900">
          <button
            onClick={() => setActiveTab('standard')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${
              activeTab === 'standard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs active:scale-95'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            Calculator
          </button>
          <button
            onClick={() => setActiveTab('change')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${
              activeTab === 'change'
                ? 'bg-indigo-600 text-white shadow-xs'
                : isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs active:scale-95'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            Change Due
          </button>
          <button
            onClick={() => setActiveTab('discount')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition text-center ${
              activeTab === 'discount'
                ? 'bg-indigo-600 text-white shadow-xs'
                : isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs active:scale-95'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            Discount Math
          </button>
        </div>

        {/* Content Body */}
        <div className={`p-4 flex-1 overflow-y-auto ${isLight ? 'bg-white' : 'bg-slate-900'}`}>
          {activeTab === 'standard' && (
            <div className="space-y-3.5">
              {/* Display Screen */}
              <div
                className={`rounded-2xl p-4 flex flex-col items-end justify-between min-h-[95px] relative group border transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-200/90 shadow-2xs'
                    : 'bg-slate-950 border-slate-800 shadow-inner'
                }`}
              >
                <div
                  className={`text-xs font-mono h-4 overflow-hidden text-right w-full font-semibold ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {equation}
                </div>
                <div
                  className={`text-3xl font-black font-mono tracking-tight overflow-x-auto w-full text-right custom-scrollbar ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {display}
                </div>
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                  <button
                    onClick={handleCopyResult}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition border ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300 shadow-2xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                    }`}
                    title="Copy calculation result"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  {onApplyDiscount && parseFloat(display) > 0 && parseFloat(display) <= 100 && (
                    <button
                      onClick={() => {
                        onApplyDiscount(parseFloat(display));
                        onClose();
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 border ${
                        isLight
                          ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                          : 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border-indigo-500/40'
                      }`}
                      title="Apply as Cart Discount %"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Apply %</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Presets for Retail / Cashiers */}
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setDisplay(pct.toString())}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold transition text-center border ${
                      isLight
                        ? 'bg-white hover:bg-indigo-50 text-indigo-700 border-slate-200 hover:border-indigo-300 shadow-2xs'
                        : 'bg-slate-800/80 hover:bg-indigo-900/40 text-indigo-300 border-slate-700/60 hover:border-indigo-500/40'
                    }`}
                    title={`Set ${pct}%`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-4 gap-2">
                {/* Row 1 */}
                <button
                  onClick={handleClear}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-2xs'
                      : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/50'
                  }`}
                >
                  C
                </button>
                <button
                  onClick={handleBackspace}
                  className={`p-3 rounded-2xl text-base font-bold transition flex items-center justify-center active:scale-95 border ${
                    isLight
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePercentage}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  %
                </button>
                <button
                  onClick={() => handleOperator('÷')}
                  className={`p-3 rounded-2xl text-lg font-black transition active:scale-95 border ${
                    isLight
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                      : 'bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 border-indigo-700/50'
                  }`}
                >
                  ÷
                </button>

                {/* Row 2 */}
                <button
                  onClick={() => handleDigit('7')}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-2xs'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-750'
                  }`}
                >
                  7
                </button>
                <button
                  onClick={() => handleDigit('8')}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-2xs'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-750'
                  }`}
                >
                  8
                </button>
                <button
                  onClick={() => handleDigit('9')}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-2xs'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-750'
                  }`}
                >
                  9
                </button>
                <button
                  onClick={() => handleOperator('×')}
                  className={`p-3 rounded-2xl text-lg font-black transition active:scale-95 border ${
                    isLight
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                      : 'bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 border-indigo-700/50'
                  }`}
                >
                  ×
                </button>

                {/* Row 3 */}
                <button
                  onClick={() => handleDigit('4')}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-2xs'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-750'
                  }`}
                >
                  4
                </button>
                <button
                  onClick={() => handleDigit('5')}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-2xs'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-750'
                  }`}
                >
                  5
                </button>
                <button
                  onClick={() => handleDigit('6')}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-2xs'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-750'
                  }`}
                >
                  6
                </button>
                <button
                  onClick={() => handleOperator('-')}
                  className={`p-3 rounded-2xl text-lg font-black transition active:scale-95 border ${
                    isLight
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                      : 'bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 border-indigo-700/50'
                  }`}
                >
                  -
                </button>

                {/* Row 4 */}
                <button
                  onClick={() => handleDigit('1')}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-2xs'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-750'
                  }`}
                >
                  1
                </button>
                <button
                  onClick={() => handleDigit('2')}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-2xs'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-750'
                  }`}
                >
                  2
                </button>
                <button
                  onClick={() => handleDigit('3')}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-2xs'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-750'
                  }`}
                >
                  3
                </button>
                <button
                  onClick={() => handleOperator('+')}
                  className={`p-3 rounded-2xl text-lg font-black transition active:scale-95 border ${
                    isLight
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                      : 'bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 border-indigo-700/50'
                  }`}
                >
                  +
                </button>

                {/* Row 5 */}
                <button
                  onClick={handleToggleSign}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  ±
                </button>
                <button
                  onClick={() => handleDigit('0')}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-2xs'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-750'
                  }`}
                >
                  0
                </button>
                <button
                  onClick={handleDecimal}
                  className={`p-3 rounded-2xl text-base font-bold transition active:scale-95 border ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-2xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  }`}
                >
                  .
                </button>
                <button
                  onClick={handleEqual}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 rounded-2xl text-lg font-black transition active:scale-95 border border-emerald-500"
                >
                  =
                </button>
              </div>
            </div>
          )}

          {activeTab === 'change' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border space-y-3.5 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 shadow-2xs'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <label className={`text-xs font-bold block mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Bill / Cart Total
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-bold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={billTotalInput}
                      onChange={(e) => setBillTotalInput(e.target.value)}
                      className={`w-full rounded-xl pl-8 pr-3.5 py-2.5 font-mono text-sm font-bold focus:outline-none transition border ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Cash Tendered
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-bold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={cashTenderedInput}
                      onChange={(e) => setCashTenderedInput(e.target.value)}
                      placeholder="0.00"
                      className={`w-full rounded-xl pl-8 pr-3.5 py-2.5 font-mono text-sm font-bold focus:outline-none transition border ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Quick Cash Presets */}
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Quick Bill Presets
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[10, 20, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCashTenderedInput(amt.toString())}
                        className={`py-2 text-xs font-mono font-bold rounded-xl border transition text-center ${
                          isLight
                            ? 'bg-white hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 border-slate-200 hover:border-indigo-300 shadow-2xs'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        {currencySymbol}{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Change Result Box */}
              <div
                className={`p-4 rounded-2xl border text-center transition ${
                  isShortage
                    ? isLight
                      ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-2xs'
                      : 'bg-rose-950/40 border-rose-800 text-rose-200'
                    : isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-2xs'
                    : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                }`}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-wider block ${
                    isLight
                      ? isShortage ? 'text-rose-700' : 'text-emerald-700'
                      : 'text-slate-400'
                  }`}
                >
                  {isShortage ? 'Amount Short' : 'Change Due to Customer'}
                </span>
                <div
                  className={`text-3xl font-black font-mono mt-1 tracking-tight ${
                    isLight
                      ? isShortage ? 'text-rose-800' : 'text-emerald-800'
                      : 'text-white'
                  }`}
                >
                  {currencySymbol}
                  {isShortage ? (billTotal - cashTendered).toFixed(2) : changeDue.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'discount' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border space-y-3.5 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 shadow-2xs'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <label className={`text-xs font-bold block mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Original Item / Order Price
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-bold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={originalPriceInput}
                      onChange={(e) => setOriginalPriceInput(e.target.value)}
                      className={`w-full rounded-xl pl-8 pr-3.5 py-2.5 font-mono text-sm font-bold focus:outline-none transition border ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Discount Rate (%)
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-bold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      %
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={discountPercentInput}
                      onChange={(e) => setDiscountPercentInput(e.target.value)}
                      className={`w-full rounded-xl pl-8 pr-3.5 py-2.5 font-mono text-sm font-bold focus:outline-none transition border ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Preset Discounts */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 15, 25].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPercentInput(pct.toString())}
                      className={`py-2 text-xs font-mono font-bold rounded-xl border transition text-center ${
                        isLight
                          ? 'bg-white hover:bg-indigo-50 text-indigo-700 border-slate-200 hover:border-indigo-300 shadow-2xs'
                          : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                      }`}
                    >
                      {pct}% OFF
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Summary Card */}
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 shadow-2xs'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex justify-between text-xs">
                  <span className={isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}>Customer Saves:</span>
                  <span className={`font-bold font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    {currencySymbol}{discountAmount.toFixed(2)}
                  </span>
                </div>
                <div
                  className={`flex justify-between items-baseline pt-2 border-t ${
                    isLight ? 'border-slate-200' : 'border-slate-800'
                  }`}
                >
                  <span className={`text-xs font-bold uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Discounted Price:
                  </span>
                  <span
                    className={`text-2xl font-black font-mono ${
                      isLight ? 'text-slate-950' : 'text-white'
                    }`}
                  >
                    {currencySymbol}{finalPrice.toFixed(2)}
                  </span>
                </div>

                {onApplyDiscount && (
                  <button
                    onClick={() => {
                      onApplyDiscount(discountPercent);
                      onClose();
                    }}
                    className="w-full mt-2.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-98"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply {discountPercent}% Discount to POS Cart</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-[11px] ${
            isLight
              ? 'bg-slate-50/90 border-slate-200 text-slate-500 font-medium'
              : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}
        >
          <span>Keys: 0-9, +, -, *, /, Enter (=), Esc</span>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl font-bold transition active:scale-95 border ${
              isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
