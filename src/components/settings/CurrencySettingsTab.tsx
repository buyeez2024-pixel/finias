import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { Currency } from '../../types/erp';
import {
  Coins,
  DollarSign,
  Plus,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Globe,
  Sliders,
  Receipt,
  ShoppingBag,
  TrendingUp,
  X,
  HelpCircle,
} from 'lucide-react';

export const CurrencySettingsTab: React.FC = () => {
  const {
    currencies,
    activeCurrency,
    settings,
    updateSettings,
    addCurrency,
    updateCurrency,
    deleteCurrency,
    setActiveCurrency,
    setStoreCurrency,
    formatMoney,
  } = useErp();

  // Modal State for Add / Edit Currency
  const [isModalOpen, setIsModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      if (p.includes('currencies/add') || p.includes('currencies/edit')) {
        return true;
      }
    }
    return false;
  });

  React.useEffect(() => {
    if (isModalOpen) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('currencies/add') && !window.location.pathname.includes('currencies/edit')) {
        window.history.replaceState(null, '', '/settings/currencies/add');
      }
    } else {
      if (typeof window !== 'undefined' && (window.location.pathname.includes('currencies/add') || window.location.pathname.includes('currencies/edit') || window.location.hash.includes('currencies/add') || window.location.hash.includes('currencies/edit'))) {
        window.history.replaceState(null, '', '/settings/currencies');
      }
    }
  }, [isModalOpen]);

  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formPlacement, setFormPlacement] = useState<'prefix' | 'suffix'>('prefix');
  const [formDecimals, setFormDecimals] = useState<number>(2);
  const [formSetAsActive, setFormSetAsActive] = useState<boolean>(true);
  const [formRate, setFormRate] = useState<string>('1.0');

  // Simulator State
  const [testAmount, setTestAmount] = useState<number>(2499.5);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCodeChange = (rawCode: string) => {
    const code = rawCode.toUpperCase().trim();
    setFormCode(code);

    const currencyMap: Record<string, { symbol: string; name: string; placement?: 'prefix' | 'suffix'; decimals?: number }> = {
      USD: { symbol: '$', name: 'US Dollar', placement: 'prefix', decimals: 2 },
      EUR: { symbol: '€', name: 'Euro', placement: 'prefix', decimals: 2 },
      GBP: { symbol: '£', name: 'British Pound', placement: 'prefix', decimals: 2 },
      INR: { symbol: '₹', name: 'Indian Rupee', placement: 'prefix', decimals: 2 },
      CAD: { symbol: 'CA$', name: 'Canadian Dollar', placement: 'prefix', decimals: 2 },
      AUD: { symbol: 'A$', name: 'Australian Dollar', placement: 'prefix', decimals: 2 },
      AED: { symbol: 'د.إ', name: 'UAE Dirham', placement: 'suffix', decimals: 2 },
      SAR: { symbol: '﷼', name: 'Saudi Riyal', placement: 'suffix', decimals: 2 },
      JPY: { symbol: '¥', name: 'Japanese Yen', placement: 'prefix', decimals: 0 },
      SGD: { symbol: 'S$', name: 'Singapore Dollar', placement: 'prefix', decimals: 2 },
      CNY: { symbol: '¥', name: 'Chinese Yuan', placement: 'prefix', decimals: 2 },
      BRL: { symbol: 'R$', name: 'Brazilian Real', placement: 'prefix', decimals: 2 },
      CHF: { symbol: 'CHF', name: 'Swiss Franc', placement: 'prefix', decimals: 2 },
      KWD: { symbol: 'KD', name: 'Kuwaiti Dinar', placement: 'prefix', decimals: 3 },
      ZAR: { symbol: 'R', name: 'South African Rand', placement: 'prefix', decimals: 2 },
      MXN: { symbol: 'MX$', name: 'Mexican Peso', placement: 'prefix', decimals: 2 },
      NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', placement: 'prefix', decimals: 2 },
      HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', placement: 'prefix', decimals: 2 },
      SEK: { symbol: 'kr', name: 'Swedish Krona', placement: 'prefix', decimals: 2 },
      NOK: { symbol: 'kr', name: 'Norwegian Krone', placement: 'prefix', decimals: 2 },
      DKK: { symbol: 'kr', name: 'Danish Krone', placement: 'prefix', decimals: 2 },
      PKR: { symbol: '₨', name: 'Pakistani Rupee', placement: 'prefix', decimals: 2 },
      BDT: { symbol: '৳', name: 'Bangladeshi Taka', placement: 'prefix', decimals: 2 },
      LKR: { symbol: 'Rs', name: 'Sri Lankan Rupee', placement: 'prefix', decimals: 2 },
    };

    if (currencyMap[code]) {
      const match = currencyMap[code];
      setFormSymbol(match.symbol);
      if (!formName || formName.endsWith(' Currency') || formName === '') {
        setFormName(match.name);
      }
      if (match.placement) {
        setFormPlacement(match.placement);
      }
      if (match.decimals !== undefined) {
        setFormDecimals(match.decimals);
      }
    } else if (code.length === 3 && !formSymbol) {
      setFormSymbol(code);
    }
  };

  const handleOpenAdd = () => {
    setEditingCurrency(null);
    setFormName('');
    setFormCode('');
    setFormSymbol('');
    setFormPlacement('prefix');
    setFormDecimals(2);
    setFormSetAsActive(true);
    setFormRate('1.0');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (curr: Currency) => {
    setEditingCurrency(curr);
    setFormName(curr.name);
    setFormCode(curr.code);
    setFormSymbol(curr.symbol);
    setFormPlacement(curr.placement || 'prefix');
    setFormDecimals(curr.decimalPlaces ?? 2);
    setFormSetAsActive(curr.id === activeCurrency.id || !!curr.isDefault);
    setFormRate(curr.exchangeRate?.toString() || '1.0');
    setIsModalOpen(true);
  };

  const handleSaveCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formSymbol.trim()) {
      alert('Please provide both a Currency Code and a Currency Symbol.');
      return;
    }

    const cleanCode = formCode.trim().toUpperCase();
    const cleanSymbol = formSymbol.trim();
    const cleanName = formName.trim() || `${cleanCode} Currency`;
    const cleanDecimals = Number(formDecimals);
    const cleanRate = parseFloat(formRate) || 1.0;

    if (editingCurrency) {
      updateCurrency(editingCurrency.id, {
        name: cleanName,
        code: cleanCode,
        symbol: cleanSymbol,
        placement: formPlacement,
        decimalPlaces: cleanDecimals,
        exchangeRate: cleanRate,
        isDefault: formSetAsActive,
      });
      if (formSetAsActive) {
        setActiveCurrency(editingCurrency.id);
      }
      showToast(`Updated currency ${cleanCode} (${cleanSymbol})`);
    } else {
      addCurrency({
        name: cleanName,
        code: cleanCode,
        symbol: cleanSymbol,
        placement: formPlacement,
        decimalPlaces: cleanDecimals,
        exchangeRate: cleanRate,
        isDefault: formSetAsActive,
      });
      showToast(`Added and configured ${cleanCode} (${cleanSymbol})`);
    }

    setIsModalOpen(false);
  };

  const handleQuickPreset = (code: string, symbol: string, name: string, placement: 'prefix' | 'suffix' = 'prefix', decimals: number = 2) => {
    setStoreCurrency(code, symbol, name, placement, decimals);
    showToast(`Store currency switched to ${code} (${symbol})`);
  };

  const handleUpdatePlacement = (placement: 'prefix' | 'suffix') => {
    if (activeCurrency) {
      updateCurrency(activeCurrency.id, { placement });
    }
    updateSettings({ currencyPlacement: placement });
    showToast(`Currency symbol position set to ${placement}`);
  };

  const handleUpdateDecimals = (decimals: number) => {
    if (activeCurrency) {
      updateCurrency(activeCurrency.id, { decimalPlaces: decimals });
    }
    updateSettings({ currencyDecimalPlaces: decimals });
    showToast(`Decimal precision set to ${decimals} decimals`);
  };

  const popularPresets = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', placement: 'prefix' as const, decimals: 2 },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', placement: 'prefix' as const, decimals: 2 },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', placement: 'prefix' as const, decimals: 2 },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', placement: 'prefix' as const, decimals: 2 },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', placement: 'suffix' as const, decimals: 2 },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦', placement: 'suffix' as const, decimals: 2 },
    { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', placement: 'prefix' as const, decimals: 2 },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', placement: 'prefix' as const, decimals: 2 },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', placement: 'prefix' as const, decimals: 0 },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', placement: 'prefix' as const, decimals: 2 },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', placement: 'prefix' as const, decimals: 2 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0 flex-shrink-0 mx-auto animate-fadeIn">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs animate-bounce max-w-[90vw]">
          <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Primary Spotlight: Current Active Store Currency & Display Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full min-w-0">
        {/* Active Currency Display Card */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-indigo-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-xl shadow-indigo-950/30 flex flex-col justify-between w-full max-w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Store Currency
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-white mt-3 flex items-center gap-2 sm:gap-3 flex-wrap break-words">
                <span className="px-2.5 sm:px-3 py-1 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl text-indigo-300 font-mono text-2xl sm:text-3xl shrink-0">
                  {settings.currencySymbol || activeCurrency.symbol}
                </span>
                <span>{settings.currencyCode || settings.currency || activeCurrency.code}</span>
                <span className="text-slate-400 text-xs sm:text-sm font-semibold">({activeCurrency.name})</span>
              </h3>
            </div>

            <button
              onClick={() => handleOpenEdit(activeCurrency)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 self-start sm:self-auto shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>

          {/* Live Preview Box */}
          <div className="mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 w-full min-w-0 overflow-hidden">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between flex-wrap gap-1">
              <span>Live Formatted Store Preview</span>
              <span className="text-indigo-400 lowercase text-[10px]">applies across entire ERP & POS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 min-w-0">
                <span className="text-[11px] text-slate-500 block font-medium">Standard Amount:</span>
                <span className="text-lg sm:text-2xl font-black text-white font-mono truncate block">
                  {formatMoney(testAmount)}
                </span>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 min-w-0">
                <span className="text-[11px] text-slate-500 block font-medium">Zero Decimal / Large:</span>
                <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono truncate block">
                  {formatMoney(105400)}
                </span>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 min-w-0">
                <span className="text-[11px] text-slate-500 block font-medium">Discounted / Small:</span>
                <span className="text-lg sm:text-2xl font-black text-amber-400 font-mono truncate block">
                  {formatMoney(9.99)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Customization Controls */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            {/* Symbol Placement */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">Symbol Placement</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdatePlacement('prefix')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    (settings.currencyPlacement || activeCurrency.placement) === 'prefix'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>Prefix: </span>
                  <span className="font-mono text-indigo-200">{settings.currencySymbol || '$'}100</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdatePlacement('suffix')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    (settings.currencyPlacement || activeCurrency.placement) === 'suffix'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>Suffix: </span>
                  <span className="font-mono text-indigo-200">100 {settings.currencySymbol || '$'}</span>
                </button>
              </div>
            </div>

            {/* Decimal Precision */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">Decimal Precision</label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 2, 3].map((dec) => {
                  const isSelected = (settings.currencyDecimalPlaces ?? activeCurrency.decimalPlaces ?? 2) === dec;
                  return (
                    <button
                      key={dec}
                      type="button"
                      onClick={() => handleUpdateDecimals(dec)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span>{dec} {dec === 1 ? 'dec' : 'decimals'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Live Simulator & Where Used Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col justify-between w-full max-w-full min-w-0 shadow-sm dark:shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">Currency Simulator</h4>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Test custom figures to inspect instant formatting output across all core ERP touchpoints.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Test Amount Input</label>
                <input
                  type="number"
                  step="0.01"
                  value={testAmount}
                  onChange={(e) => setTestAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Module Previews */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>POS Register Checkout:</span>
                  </span>
                  <span className="text-xs font-black text-white font-mono">{formatMoney(testAmount)}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Printed Tax Invoice:</span>
                  </span>
                  <span className="text-xs font-black text-white font-mono">{formatMoney(testAmount)}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>Financial Report / P&L:</span>
                  </span>
                  <span className="text-xs font-black text-white font-mono">{formatMoney(testAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted local persistence active for currency state.</span>
          </div>
        </div>
      </div>

      {/* Quick 1-Click Preset Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-full min-w-0 shadow-sm dark:shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>1-Click Global Currency Presets</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 break-words">
              Click any global currency to immediately configure and adopt its ISO code, symbol, and standard formatting for the entire store.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 w-full min-w-0">
          {popularPresets.map((preset) => {
            const isActive =
              (settings.currencyCode || settings.currency)?.toUpperCase() === preset.code.toUpperCase() &&
              settings.currencySymbol === preset.symbol;

            return (
              <button
                key={preset.code}
                id={`btn-preset-curr-${preset.code.toLowerCase()}`}
                type="button"
                onClick={() => handleQuickPreset(preset.code, preset.symbol, preset.name, preset.placement, preset.decimals)}
                className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-600/10 ring-1 ring-indigo-500'
                    : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-lg">{preset.flag}</span>
                  <span className="font-mono font-bold text-sm text-indigo-300 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                    {preset.symbol}
                  </span>
                </div>
                <div className="font-black text-xs text-white">{preset.code}</div>
                <div className="text-[10px] text-slate-400 truncate">{preset.name}</div>
                {isActive && (
                  <span className="mt-2 text-[9px] font-extrabold text-emerald-400 flex items-center gap-1 uppercase">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Configured Store Currencies Master Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden w-full max-w-full min-w-0 shadow-sm dark:shadow-xl">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
          <div className="min-w-0">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Configured Store Currencies Catalog</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 break-words">
              Manage custom currencies, modify symbols, symbol positions, or switch the active currency used by cashiers and managers.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 self-start sm:self-auto shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Currency</span>
          </button>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="px-4 sm:px-6 pt-3 pb-1 flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 sm:hidden">
          <span>⇄ Swipe table horizontally to view all currency parameters & actions</span>
        </div>

        {/* Dedicated Smooth Touch-Swipe Scroll Container */}
        <div
          className="overflow-x-auto scrollbar-thin w-full max-w-full min-w-0"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pan-y',
            overscrollBehaviorX: 'contain',
          }}
        >
          <table className="w-full text-left text-xs min-w-[700px] sm:min-w-[760px] border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-extrabold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">Currency Name</th>
                <th className="py-3.5 px-4 whitespace-nowrap">ISO Code</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Symbol</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Placement</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Decimals</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Preview ($1,250)</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {currencies.map((curr) => {
                const isActive =
                  (settings.currencyCode || settings.currency)?.toUpperCase() === curr.code.toUpperCase() &&
                  settings.currencySymbol === curr.symbol;

                const previewAmount = 1250;
                const formattedPreview =
                  (curr.placement || 'prefix') === 'suffix'
                    ? `${previewAmount.toLocaleString(undefined, { minimumFractionDigits: curr.decimalPlaces ?? 2, maximumFractionDigits: curr.decimalPlaces ?? 2 })} ${curr.symbol}`
                    : `${curr.symbol}${previewAmount.toLocaleString(undefined, { minimumFractionDigits: curr.decimalPlaces ?? 2, maximumFractionDigits: curr.decimalPlaces ?? 2 })}`;

                return (
                  <tr
                    key={curr.id}
                    className={`hover:bg-slate-800/40 transition ${
                      isActive ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{curr.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {curr.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-mono font-black text-white text-sm px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 inline-block min-w-[36px]">
                        {curr.symbol}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-300 capitalize">
                        {curr.placement || 'prefix'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-300">{curr.decimalPlaces ?? 2} digits</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200 whitespace-nowrap">
                      {formattedPreview}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Available</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCurrency(curr.id);
                              showToast(`Store currency set to ${curr.code} (${curr.symbol})`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white font-bold text-[11px] transition border border-indigo-500/40 cursor-pointer"
                          >
                            Set Active
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-400 px-2 py-1">In Use</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(curr)}
                          title="Edit Currency"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {currencies.length > 1 && !isActive && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete currency ${curr.code} (${curr.name})?`)) {
                                deleteCurrency(curr.id);
                                showToast(`Deleted currency ${curr.code}`);
                              }
                            }}
                            title="Delete Currency"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Currency Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingCurrency ? 'Edit Currency' : 'Add Custom Currency'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure code, symbol, and formatting parameters
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrency} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Currency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brazilian Real, Swiss Franc, Kuwaiti Dinar"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">ISO Currency Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. BRL, CHF, KWD, USD"
                    value={formCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Currency Symbol *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. R$, Fr., KD, $, ₹, €"
                    value={formSymbol}
                    onChange={(e) => setFormSymbol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold text-center focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Symbol Position</label>
                  <select
                    value={formPlacement}
                    onChange={(e) => setFormPlacement(e.target.value as 'prefix' | 'suffix')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="prefix">Prefix (e.g. $100.00)</option>
                    <option value="suffix">Suffix (e.g. 100.00 $)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Decimal Places</label>
                  <select
                    value={formDecimals}
                    onChange={(e) => setFormDecimals(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={0}>0 (e.g. JPY ¥100)</option>
                    <option value={2}>2 (Standard $100.00)</option>
                    <option value={3}>3 (Precision 100.000)</option>
                  </select>
                </div>
              </div>

              {/* Formatted Preview Box */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Formatted Output Preview:</span>
                <span className="text-base font-black text-indigo-300 font-mono">
                  {formPlacement === 'suffix'
                    ? `1,250.${'0'.repeat(formDecimals)} ${formSymbol || 'SYM'}`
                    : `${formSymbol || 'SYM'}1,250.${'0'.repeat(formDecimals)}`}
                </span>
              </div>

              {/* Set as Active Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSetAsActive}
                  onChange={(e) => setFormSetAsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                />
                <div>
                  <span className="font-bold text-white block">Set as Primary Store Currency immediately</span>
                  <span className="text-[11px] text-slate-400">Updates POS, Inventory, and Invoices right away</span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCurrency ? 'Update Currency' : 'Save & Add Currency'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
