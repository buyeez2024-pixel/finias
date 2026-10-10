import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { TaxRate, TaxGroup, TaxSystemType, TaxCalculationMode } from '../../types/erp';
import {
  Percent,
  Plus,
  Edit2,
  Trash2,
  Check,
  Save,
  Info,
  Globe,
  Sliders,
  Layers,
  FileText,
  Calculator,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  Receipt,
  X,
} from 'lucide-react';

const INDIAN_STATES = [
  '01 - Jammu & Kashmir',
  '02 - Himachal Pradesh',
  '03 - Punjab',
  '04 - Chandigarh',
  '05 - Uttarakhand',
  '06 - Haryana',
  '07 - Delhi',
  '08 - Rajasthan',
  '09 - Uttar Pradesh',
  '10 - Bihar',
  '19 - West Bengal',
  '24 - Gujarat',
  '27 - Maharashtra',
  '29 - Karnataka',
  '32 - Kerala',
  '33 - Tamil Nadu',
  '36 - Telangana',
  '37 - Andhra Pradesh',
];

export const TaxSettingsTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    taxRates,
    taxGroups,
    addTaxRate,
    updateTaxRate,
    deleteTaxRate,
    addTaxGroup,
    updateTaxGroup,
    deleteTaxGroup,
    applyCountryTaxPreset,
    calculateItemTax,
  } = useErp();

  const isLight = settings?.themeMode === 'light';

  // Local settings state
  const [enableTax, setEnableTax] = useState<boolean>(settings.enableTax ?? true);
  const [enableInlineTax, setEnableInlineTax] = useState<boolean>(settings.enableInlineTax ?? true);
  const [taxSystem, setTaxSystem] = useState<TaxSystemType>(settings.taxSystem || 'gst_india');
  const [taxCalcType, setTaxCalcType] = useState<TaxCalculationMode>(settings.taxCalculationType || 'exclusive');
  const [gstin, setGstin] = useState<string>(settings.gstin || settings.taxNumber || (settings as any).tax1No || '');
  const [stateCode, setStateCode] = useState<string>(settings.stateCode || '27 - Maharashtra');
  const [enableHsn, setEnableHsn] = useState<boolean>(settings.enableHsnCode ?? true);
  const [isInterstate, setIsInterstate] = useState<boolean>(settings.isInterstate ?? false);
  const [defaultTaxGroupId, setDefaultTaxGroupId] = useState<string>(settings.defaultTaxGroupId || 'tg_gst_18');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Automatically take registered or configured Tax Number into consideration
  React.useEffect(() => {
    const currentTaxNumber = settings.gstin || settings.taxNumber || (settings as any)?.tax1No || '';
    if (currentTaxNumber) {
      setGstin(currentTaxNumber);
    }
  }, [settings.gstin, settings.taxNumber, (settings as any)?.tax1No]);

  // Modals state
  const [isRateModalOpen, setIsRateModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      if (p.includes('tax_rates/add') || p.includes('tax_rates/edit')) {
        return true;
      }
    }
    return false;
  });

  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      if (p.includes('tax_groups/add') || p.includes('tax_groups/edit')) {
        return true;
      }
    }
    return false;
  });

  React.useEffect(() => {
    if (isRateModalOpen) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('tax_rates/add') && !window.location.pathname.includes('tax_rates/edit')) {
        window.history.replaceState(null, '', '/settings/tax_rates/add');
      }
    } else {
      if (typeof window !== 'undefined' && (window.location.pathname.includes('tax_rates/add') || window.location.pathname.includes('tax_rates/edit') || window.location.hash.includes('tax_rates/add') || window.location.hash.includes('tax_rates/edit'))) {
        window.history.replaceState(null, '', '/settings/tax');
      }
    }
  }, [isRateModalOpen]);

  React.useEffect(() => {
    if (isGroupModalOpen) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('tax_groups/add') && !window.location.pathname.includes('tax_groups/edit')) {
        window.history.replaceState(null, '', '/settings/tax_rates/add_group');
      }
    } else {
      if (typeof window !== 'undefined' && (window.location.pathname.includes('tax_groups/add') || window.location.pathname.includes('tax_groups/edit') || window.location.hash.includes('tax_groups/add') || window.location.hash.includes('tax_groups/edit'))) {
        window.history.replaceState(null, '', '/settings/tax');
      }
    }
  }, [isGroupModalOpen]);

  const [editingRate, setEditingRate] = useState<TaxRate | null>(null);
  const [rateForm, setRateForm] = useState<{
    name: string;
    rate: number;
    code: string;
    type: 'cgst' | 'sgst' | 'igst' | 'vat' | 'sales_tax' | 'cess' | 'other';
    description: string;
  }>({
    name: '',
    rate: 0,
    code: '',
    type: 'cgst',
    description: '',
  });
  const [editingGroup, setEditingGroup] = useState<TaxGroup | null>(null);
  const [groupForm, setGroupForm] = useState<{
    name: string;
    subTaxIds: string[];
    description: string;
    isDefault: boolean;
  }>({
    name: '',
    subTaxIds: [],
    description: '',
    isDefault: false,
  });

  // Simulator test inputs
  const [simPrice, setSimPrice] = useState<number>(1000);
  const [simQty, setSimQty] = useState<number>(1);
  const [simDiscount, setSimDiscount] = useState<number>(0);
  const [simSelectedGroupId, setSimSelectedGroupId] = useState<string>(defaultTaxGroupId);

  // Handle Master Save
  const handleSaveMasterTax = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const effectiveInlineTax = enableTax && taxSystem !== 'disabled' ? enableInlineTax : false;
    updateSettings({
      enableTax,
      taxSystem,
      taxCalculationType: taxCalcType,
      gstin: gstin.trim(),
      taxNumber: gstin.trim(),
      tax1No: gstin.trim(),
      stateCode,
      enableHsnCode: enableHsn,
      enableInlineTax: effectiveInlineTax,
      isInterstate,
      defaultTaxGroupId,
      defaultTaxRate: taxGroups.find((g) => g.id === defaultTaxGroupId)?.totalRate || 18,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Open Add/Edit Tax Rate Modal
  const handleOpenRateModal = (rate?: TaxRate) => {
    if (rate) {
      setEditingRate(rate);
      setRateForm({
        name: rate.name,
        rate: rate.rate,
        code: rate.code || '',
        type: rate.type || 'cgst',
        description: rate.description || '',
      });
    } else {
      setEditingRate(null);
      setRateForm({
        name: '',
        rate: 9,
        code: 'GST_9',
        type: 'cgst',
        description: '',
      });
    }
    setIsRateModalOpen(true);
  };

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateForm.name.trim()) return;

    if (editingRate) {
      updateTaxRate(editingRate.id, {
        name: rateForm.name.trim(),
        rate: Number(rateForm.rate),
        code: rateForm.code.trim().toUpperCase(),
        type: rateForm.type,
        description: rateForm.description.trim(),
      });
    } else {
      addTaxRate({
        name: rateForm.name.trim(),
        rate: Number(rateForm.rate),
        code: rateForm.code.trim().toUpperCase(),
        type: rateForm.type,
        description: rateForm.description.trim(),
        isActive: true,
      });
    }
    setIsRateModalOpen(false);
  };

  // Open Add/Edit Tax Group Modal
  const handleOpenGroupModal = (group?: TaxGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupForm({
        name: group.name,
        subTaxIds: group.subTaxIds || [],
        description: group.description || '',
        isDefault: group.isDefault || false,
      });
    } else {
      setEditingGroup(null);
      setGroupForm({
        name: '',
        subTaxIds: taxRates.length >= 2 ? [taxRates[0].id, taxRates[1].id] : [],
        description: '',
        isDefault: false,
      });
    }
    setIsGroupModalOpen(true);
  };

  const handleToggleSubTax = (taxId: string) => {
    setGroupForm((prev) => {
      const exists = prev.subTaxIds.includes(taxId);
      if (exists) {
        return { ...prev, subTaxIds: prev.subTaxIds.filter((id) => id !== taxId) };
      } else {
        return { ...prev, subTaxIds: [...prev.subTaxIds, taxId] };
      }
    });
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim() || groupForm.subTaxIds.length === 0) return;

    const calculatedTotal = groupForm.subTaxIds.reduce((sum, tid) => {
      const r = taxRates.find((t) => t.id === tid);
      return sum + (r?.rate || 0);
    }, 0);

    if (editingGroup) {
      updateTaxGroup(editingGroup.id, {
        name: groupForm.name.trim(),
        subTaxIds: groupForm.subTaxIds,
        totalRate: +calculatedTotal.toFixed(2),
        description: groupForm.description.trim(),
        isDefault: groupForm.isDefault,
      });
    } else {
      addTaxGroup({
        name: groupForm.name.trim(),
        subTaxIds: groupForm.subTaxIds,
        totalRate: +calculatedTotal.toFixed(2),
        description: groupForm.description.trim(),
        isDefault: groupForm.isDefault,
      });
    }
    setIsGroupModalOpen(false);
  };

  // Simulation calculation
  const simResult = calculateItemTax(simPrice, simQty, simDiscount, {
    taxGroupId: simSelectedGroupId || defaultTaxGroupId || (taxGroups[0]?.id),
    forceCalculate: true,
  });

  const selectedGroup = taxGroups.find((g) => g.id === simSelectedGroupId);

  return (
    <div className="space-y-4 sm:space-y-8 animate-fadeIn w-full max-w-full min-w-0 flex-shrink-0 mx-auto">
      {/* Master Configuration & Presets Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden w-full max-w-full min-w-0 shadow-sm dark:shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-slate-800 w-full min-w-0">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5 shrink-0">
                <Globe className="w-3.5 h-3.5" />
                Tax Engine & GST Configuration
              </span>
              <span className="text-[11px] text-slate-400 shrink-0">Compliant with Indian GST & Global Regimes</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2 break-words min-w-0">
              <span>Tax Configuration</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl break-words">
              Configure CGST, SGST, IGST split rules for India, item HSN codes, tax calculation modes (Inclusive vs. Exclusive), or disable taxes altogether.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => handleSaveMasterTax()}
              id="save-tax-settings-btn"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-center"
            >
              {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{saveSuccess ? 'Settings Saved!' : 'Save Tax Settings'}</span>
            </button>
          </div>
        </div>

        {/* Quick Country Presets Switcher */}
        <div className="pt-4 sm:pt-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Country Tax System Presets</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            <button
              type="button"
              id="preset-india-gst"
              onClick={() => {
                applyCountryTaxPreset('india_gst');
                setEnableTax(true);
                setTaxSystem('gst_india');
                setTaxCalcType('exclusive');
                setEnableHsn(true);
                setDefaultTaxGroupId('tg_gst_18');
                setSimSelectedGroupId('tg_gst_18');
              }}
              className={`p-3.5 rounded-2xl border text-left transition relative ${
                taxSystem === 'gst_india' && enableTax
                  ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">🇮🇳</span>
                {taxSystem === 'gst_india' && enableTax && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20"></span>
                )}
              </div>
              <p className="text-xs font-black text-white mt-2">India GST</p>
              <p className="text-[10px] text-slate-400">CGST/SGST/IGST + HSN</p>
            </button>

            <button
              type="button"
              id="preset-usa-sales"
              onClick={() => {
                applyCountryTaxPreset('usa_sales');
                setEnableTax(true);
                setTaxSystem('sales_tax');
                setTaxCalcType('exclusive');
                setEnableHsn(false);
                setDefaultTaxGroupId('tg_us_sales_8_25');
                setSimSelectedGroupId('tg_us_sales_8_25');
              }}
              className={`p-3.5 rounded-2xl border text-left transition relative ${
                taxSystem === 'sales_tax' && enableTax
                  ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">🇺🇸</span>
                {taxSystem === 'sales_tax' && enableTax && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20"></span>
                )}
              </div>
              <p className="text-xs font-black text-white mt-2">USA Sales Tax</p>
              <p className="text-[10px] text-slate-400">State / Local 8.25%</p>
            </button>

            <button
              type="button"
              id="preset-uk-vat"
              onClick={() => {
                applyCountryTaxPreset('uk_vat');
                setEnableTax(true);
                setTaxSystem('vat');
                setTaxCalcType('inclusive');
                setEnableHsn(true);
                setDefaultTaxGroupId('tg_vat_20');
                setSimSelectedGroupId('tg_vat_20');
              }}
              className={`p-3.5 rounded-2xl border text-left transition relative ${
                taxSystem === 'vat' && taxCalcType === 'inclusive' && enableTax
                  ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">🇬🇧</span>
                {taxSystem === 'vat' && taxCalcType === 'inclusive' && enableTax && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20"></span>
                )}
              </div>
              <p className="text-xs font-black text-white mt-2">UK / EU VAT</p>
              <p className="text-[10px] text-slate-400">20% Tax Inclusive</p>
            </button>

            <button
              type="button"
              id="preset-uae-vat"
              onClick={() => {
                applyCountryTaxPreset('uae_vat');
                setEnableTax(true);
                setTaxSystem('vat');
                setTaxCalcType('exclusive');
                setEnableHsn(false);
                setDefaultTaxGroupId('tg_vat_5');
                setSimSelectedGroupId('tg_vat_5');
              }}
              className={`p-3.5 rounded-2xl border text-left transition relative ${
                taxSystem === 'vat' && taxCalcType === 'exclusive' && enableTax
                  ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">🇦🇪</span>
                {taxSystem === 'vat' && taxCalcType === 'exclusive' && enableTax && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20"></span>
                )}
              </div>
              <p className="text-xs font-black text-white mt-2">UAE / GCC VAT</p>
              <p className="text-[10px] text-slate-400">5% TRN Tax Exclusive</p>
            </button>

            <button
              type="button"
              id="preset-tax-exempt"
              onClick={() => {
                applyCountryTaxPreset('tax_exempt');
                setEnableTax(false);
                setTaxSystem('disabled');
                setEnableInlineTax(false);
                setEnableHsn(false);
                setDefaultTaxGroupId('tg_exempt');
                setSimSelectedGroupId('tg_exempt');
              }}
              className={`p-3.5 rounded-2xl border text-left transition relative ${
                !enableTax || taxSystem === 'disabled'
                  ? 'bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">🚫</span>
                {(!enableTax || taxSystem === 'disabled') && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20"></span>
                )}
              </div>
              <p className="text-xs font-black text-amber-200 mt-2">Tax Disabled</p>
              <p className="text-[10px] text-slate-400">Zero Tax Calculation</p>
            </button>
          </div>
        </div>
      </div>

      {/* Core Tax Rules & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 w-full max-w-full min-w-0">
        {/* Left Column: Master Settings & Toggles */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6 w-full min-w-0">
          {/* Master Toggles Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm dark:shadow-xl w-full max-w-full min-w-0 overflow-hidden">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Tax System Controls</span>
            </h3>

            <div className="space-y-4">
              {/* Enable / Disable Tax Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Enable Automated Tax Engine</span>
                    {enableTax && taxSystem !== 'disabled' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        DISABLED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    When disabled, all purchase and sale inline taxes, cart items, and invoices will have zero tax applied.
                  </p>
                </div>

                <button
                  type="button"
                  id="toggle-enable-tax"
                  onClick={() => {
                    const nextVal = !enableTax;
                    setEnableTax(nextVal);
                    if (!nextVal) {
                      setEnableInlineTax(false);
                    }
                  }}
                  className={`p-2 rounded-xl border transition ${
                    enableTax && taxSystem !== 'disabled'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  {enableTax && taxSystem !== 'disabled' ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                </button>
              </div>

              {/* Enable / Disable Purchase & Sale Inline Tax Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Enable Purchase and Sale Inline Tax</span>
                    {enableTax && taxSystem !== 'disabled' && enableInlineTax ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        INLINE TAX ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        INLINE TAX DISABLED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Shows per-item inline tax rate breakdown on Purchase and Sell line items. Automatically disabled when Master Tax Engine is turned off.
                  </p>
                </div>

                <button
                  type="button"
                  id="toggle-enable-inline-tax"
                  disabled={!enableTax || taxSystem === 'disabled'}
                  onClick={() => setEnableInlineTax(!enableInlineTax)}
                  className={`p-2 rounded-xl border transition ${
                    !enableTax || taxSystem === 'disabled'
                      ? 'bg-slate-950 border-slate-800 text-slate-700 cursor-not-allowed opacity-50'
                      : enableInlineTax
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  {enableTax && taxSystem !== 'disabled' && enableInlineTax ? (
                    <ToggleRight className="w-7 h-7" />
                  ) : (
                    <ToggleLeft className="w-7 h-7" />
                  )}
                </button>
              </div>

              {/* HSN Code Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Enable HSN / SAC Codes for Products</span>
                    {enableHsn && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        HSN REQUIRED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Adds HSN code fields to product catalog, POS line items, and GST invoices.
                  </p>
                </div>

                <button
                  type="button"
                  id="toggle-enable-hsn"
                  onClick={() => setEnableHsn(!enableHsn)}
                  className={`p-2 rounded-xl border transition ${
                    enableHsn
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  {enableHsn ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                </button>
              </div>

              {/* Tax Calculation Mode: Exclusive vs. Inclusive */}
              <div className={`p-4 rounded-2xl space-y-3 ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-950 border border-slate-800'}`}>
                <label className={`block text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Tax Calculation Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    id="calc-mode-exclusive"
                    onClick={() => setTaxCalcType('exclusive')}
                    className={`p-3 rounded-xl border text-left transition ${
                      isLight
                        ? taxCalcType === 'exclusive'
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-600/30'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-indigo-100/20'
                        : taxCalcType === 'exclusive'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold">Tax Exclusive</p>
                      {isLight && (
                        taxCalcType === 'exclusive' ? (
                          <X className="w-4 h-4 text-white shrink-0" />
                        ) : (
                          <Percent className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        )
                      )}
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isLight && taxCalcType !== 'exclusive' ? 'text-indigo-600/80' : isLight ? 'text-indigo-100' : 'text-slate-400'}`}>Price + Tax (e.g. ₹100 + 18% = ₹118)</p>
                  </button>

                  <button
                    type="button"
                    id="calc-mode-inclusive"
                    onClick={() => setTaxCalcType('inclusive')}
                    className={`p-3 rounded-xl border text-left transition ${
                      isLight
                        ? taxCalcType === 'inclusive'
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-600/30'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-indigo-100/20'
                        : taxCalcType === 'inclusive'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold">Tax Inclusive</p>
                      {isLight && (
                        taxCalcType === 'inclusive' ? (
                          <X className="w-4 h-4 text-white shrink-0" />
                        ) : (
                          <Percent className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        )
                      )}
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isLight && taxCalcType !== 'inclusive' ? 'text-indigo-600/80' : isLight ? 'text-indigo-100' : 'text-slate-400'}`}>MRP includes Tax (e.g. ₹118 gross)</p>
                  </button>
                </div>
              </div>

              {/* Indian GST Specific Inputs */}
              {taxSystem === 'gst_india' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                    <FileText className="w-4 h-4" />
                    <span>Indian GST Details & State Jurisdiction</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">GSTIN or Tax Number</label>
                      <input
                        type="text"
                        id="input-gstin"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        placeholder="e.g. 27AABCR1234F1Z5 or Tax ID"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Automatically taken from business registration & considered across invoicing, POS, and tax returns.
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Home State / POS State Code</label>
                      <select
                        id="select-state-code"
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Interstate vs Intra-state switch */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div>
                      <p className="text-xs font-bold text-slate-200">Transaction Scope Mode</p>
                      <p className="text-[11px] text-slate-400">
                        {isInterstate
                          ? 'Interstate Sale: Applies IGST full rate'
                          : 'Intrastate Sale: Splits equally into CGST + SGST (50% / 50%)'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsInterstate(false)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          !isInterstate ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        CGST + SGST
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInterstate(true)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          isInterstate ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        IGST
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Non-Indian Tax System GSTIN or Tax Number section */}
              {taxSystem !== 'gst_india' && taxSystem !== 'disabled' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                    <FileText className="w-4 h-4" />
                    <span>Company Tax Identification Details</span>
                  </div>
                  <div className="text-xs">
                    <label className="block text-slate-400 font-semibold mb-1">GSTIN or Tax Number</label>
                    <input
                      type="text"
                      id="input-tax-number"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. VAT / Tax Identification Number"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Automatically taken from business registration & considered across invoicing, POS, and tax returns.
                    </p>
                  </div>
                </div>
              )}

              {/* Default Tax Group Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Default Fallback Tax Group for New Products
                </label>
                <select
                  id="select-default-tax-group"
                  value={defaultTaxGroupId}
                  onChange={(e) => setDefaultTaxGroupId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                >
                  {taxGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.totalRate}%) {g.isDefault ? '— [Default]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Tax Breakdown Simulator */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6 w-full min-w-0">
          <div className={`border rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm transition-all w-full max-w-full min-w-0 overflow-hidden ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center gap-2">
                <Calculator className={`w-5 h-5 ${isLight ? 'text-indigo-600' : 'text-emerald-400'}`} />
                <h3 className={`text-sm font-black ${isLight ? 'text-slate-800' : 'text-white'}`}>Live Tax Calculation Simulator</h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isLight ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                Real-Time
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Unit Price ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={simPrice}
                    onChange={(e) => setSimPrice(parseFloat(e.target.value) || 0)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono font-bold mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'}`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={simQty}
                    onChange={(e) => setSimQty(parseInt(e.target.value) || 1)}
                    className={`w-full border rounded-xl px-3 py-2 font-mono font-bold mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Select Tax Group</label>
                <select
                  value={simSelectedGroupId}
                  onChange={(e) => setSimSelectedGroupId(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'}`}
                >
                  {taxGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.totalRate}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Computation Receipt Card */}
              <div className={`border rounded-2xl p-4 space-y-2.5 font-mono text-xs ${isLight ? 'bg-white border-slate-200/80 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <div className={`flex justify-between pb-2 border-b ${isLight ? 'text-slate-500 border-slate-100' : 'text-slate-400 border-slate-800/80'}`}>
                  <span>Gross Value ({simQty} x {settings.currencySymbol}{simPrice}):</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{settings.currencySymbol}{(simPrice * simQty).toFixed(2)}</span>
                </div>

                <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span>Taxable Subtotal:</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{settings.currencySymbol}{simResult.lineSubtotal.toFixed(2)}</span>
                </div>

                {taxSystem === 'gst_india' && !isInterstate ? (
                  <>
                    <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>CGST ({simResult.cgstRate}%):</span>
                      <span className={`font-bold ${isLight ? 'text-indigo-600' : 'text-indigo-300'}`}>{settings.currencySymbol}{simResult.cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>SGST ({simResult.sgstRate}%):</span>
                      <span className={`font-bold ${isLight ? 'text-indigo-600' : 'text-indigo-300'}`}>{settings.currencySymbol}{simResult.sgstAmount.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    <span>
                      {taxSystem === 'gst_india' ? `IGST (${simResult.igstRate}%)` : `Tax (${simResult.taxRate}%)`}:
                    </span>
                    <span className={`font-bold ${isLight ? 'text-indigo-600' : 'text-indigo-300'}`}>{settings.currencySymbol}{simResult.taxAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className={`pt-2 border-t flex justify-between items-center text-sm font-black ${isLight ? 'border-slate-100 text-slate-900' : 'border-slate-800 text-white'}`}>
                  <span>FINAL INVOICE TOTAL:</span>
                  <span className={`${isLight ? 'text-indigo-600' : 'text-emerald-400'} text-base font-extrabold`}>
                    {settings.currencySymbol}{simResult.lineTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className={`flex items-start gap-2 border rounded-xl p-3 text-[11px] ${isLight ? 'bg-indigo-50/40 border-indigo-100 text-indigo-900' : 'bg-indigo-950/30 border-indigo-500/20 text-slate-300'}`}>
                <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
                <p>
                  Calculation mode is set to <strong className={`capitalize ${isLight ? 'text-indigo-950' : 'text-white'}`}>{taxCalcType}</strong>.
                  {taxCalcType === 'inclusive'
                    ? ' Tax is computed as a reverse fraction out of the gross total.'
                    : ' Tax is calculated on top of the taxable subtotal.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Groups Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-sm dark:shadow-xl w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-800 w-full min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
              <h3 className="text-base font-black text-white">Tax Groups (Compound / Component Taxes)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 break-words">
              Combine component tax rates into tax groups (e.g. GST 18% = CGST 9% + SGST 9%) for assignment to products.
            </p>
          </div>

          <button
            type="button"
            id="add-tax-group-btn"
            onClick={() => handleOpenGroupModal()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tax Group</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full min-w-0">
          {taxGroups.map((group) => {
            const subRates = (group.subTaxIds || [])
              .map((id) => taxRates.find((r) => r.id === id))
              .filter(Boolean) as TaxRate[];

            return (
              <div
                key={group.id}
                className={`bg-slate-950 border rounded-2xl p-4.5 space-y-3 transition relative ${
                  defaultTaxGroupId === group.id
                    ? 'border-indigo-500/80 shadow-md shadow-indigo-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">{group.name}</h4>
                      {defaultTaxGroupId === group.id && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{group.description}</p>
                    )}
                  </div>

                  <span className="text-base font-black font-mono text-emerald-400">
                    {group.totalRate}%
                  </span>
                </div>

                {/* Sub-tax Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {subRates.length > 0 ? (
                    subRates.map((sr) => (
                      <span
                        key={sr.id}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1"
                      >
                        <span>{sr.name}:</span>
                        <strong className="text-indigo-400">{sr.rate}%</strong>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No sub-taxes assigned</span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setDefaultTaxGroupId(group.id)}
                    className={`text-[11px] font-bold transition ${
                      defaultTaxGroupId === group.id
                        ? 'text-indigo-400 cursor-default'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {defaultTaxGroupId === group.id ? '✓ Active Default' : 'Set as Default'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenGroupModal(group)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit Tax Group"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {taxGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteTaxGroup(group.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete Tax Group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Tax Rates Master Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-sm dark:shadow-xl w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-800 w-full min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-indigo-400 shrink-0" />
              <h3 className="text-base font-black text-white">Component Tax Rates</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 break-words">
              Individual tax components (e.g. CGST 9%, SGST 9%, IGST 18%, Cess 12%, VAT 5%) used to formulate Tax Groups.
            </p>
          </div>

          <button
            type="button"
            id="add-tax-rate-btn"
            onClick={() => handleOpenRateModal()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tax Rate</span>
          </button>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 sm:hidden">
          <span>⇄ Swipe table horizontally to view all tax rate columns & actions</span>
        </div>

        {/* Dedicated Smooth Touch-Swipe Scroll Container */}
        <div
          className="overflow-x-auto scrollbar-thin rounded-xl border border-slate-800 w-full max-w-full min-w-0"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pan-y',
            overscrollBehaviorX: 'contain',
          }}
        >
          <table className="w-full text-left text-xs min-w-[640px] sm:min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Tax Name</th>
                <th className="py-3 px-3">Tax Code</th>
                <th className="py-3 px-3 text-center">Tax Rate (%)</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {taxRates.map((rate) => (
                <tr key={rate.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 text-white font-bold whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
                      <span>{rate.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-indigo-300 whitespace-nowrap">{rate.code || '—'}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400 text-sm text-center whitespace-nowrap">
                    {rate.rate}%
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {rate.type || 'standard'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 max-w-xs whitespace-nowrap">
                    {rate.description || '—'}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenRateModal(rate)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Rate"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {taxRates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteTaxRate(rate.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                          title="Delete Rate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add / Edit Tax Rate */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-400" />
                <span>{editingRate ? 'Edit Tax Rate' : 'Add New Component Tax Rate'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRateModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tax Rate Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CGST 9%, SGST 9%, VAT 5%"
                  value={rateForm.name}
                  onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Percentage Rate (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={rateForm.rate}
                    onChange={(e) => setRateForm({ ...rateForm, rate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tax Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CGST_9"
                    value={rateForm.code}
                    onChange={(e) => setRateForm({ ...rateForm, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tax Classification / Type</label>
                <select
                  value={rateForm.type}
                  onChange={(e) => setRateForm({ ...rateForm, type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="cgst">Central GST (CGST)</option>
                  <option value="sgst">State GST (SGST / UTGST)</option>
                  <option value="igst">Integrated GST (IGST)</option>
                  <option value="vat">Value Added Tax (VAT)</option>
                  <option value="sales_tax">Sales Tax</option>
                  <option value="cess">Cess / Surcharge</option>
                  <option value="other">Other Component</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Central Goods and Services Tax standard slab"
                  value={rateForm.description}
                  onChange={(e) => setRateForm({ ...rateForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  Save Tax Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Tax Group */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>{editingGroup ? 'Edit Tax Group' : 'Create Tax Group'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tax Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST 18% (CGST 9% + SGST 9%)"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-2">
                  Select Component Sub-Taxes (Calculates Total Rate Automatically) *
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {taxRates.map((rate) => {
                    const isChecked = groupForm.subTaxIds.includes(rate.id);
                    return (
                      <div
                        key={rate.id}
                        onClick={() => handleToggleSubTax(rate.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-indigo-950/60 border-indigo-500'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{rate.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase">{rate.type || 'tax'}</p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">{rate.rate}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Computed Rate Preview */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <span className="text-slate-400 font-sans text-xs font-bold">Total Effective Rate:</span>
                <span className="text-emerald-400 font-black text-sm">
                  {groupForm.subTaxIds
                    .reduce((sum, tid) => {
                      const r = taxRates.find((t) => t.id === tid);
                      return sum + (r?.rate || 0);
                    }, 0)
                    .toFixed(2)}
                  %
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Standard rate for electronics and services"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={groupForm.subTaxIds.length === 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  Save Tax Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
