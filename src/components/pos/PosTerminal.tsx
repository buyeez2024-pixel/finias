import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useErp } from '../../context/ErpContext';
import { Product, Customer } from '../../types/erp';
import { getCategoryName, getBrandName, formatCurrency, applyAmountRounding } from '../../utils/formatters';
import { NetworkSyncStatusBadge } from '../common/NetworkSyncStatusBadge';
import { SearchableDropdown } from '../common/SearchableDropdown';
import { OfflineSyncManagerModal } from './OfflineSyncManagerModal';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { soundEffects } from '../../utils/audioFeedback';
import { RegisterModal } from './RegisterModal';
import { PosRegisterLockModal } from './PosRegisterLockModal';
import { PosSaleReturnModal } from './PosSaleReturnModal';
import { PosCalculatorModal } from './PosCalculatorModal';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  CreditCard,
  RotateCcw,
  UserCheck,
  Users,
  UserPlus,
  ShoppingCart,
  Sparkles,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  ChevronRight,
  Package,
  WifiOff,
  Database,
  CheckCircle2,
  LogOut,
  ArrowLeft,
  Coffee,
  Power,
  X,
  Lock,
  Unlock,
  ShieldAlert,
  ExternalLink,
  Maximize,
  Minimize,
  Building,
  Banknote,
  ArrowRight,
  Monitor,
  Calculator,
} from 'lucide-react';

interface PosTerminalProps {
  onOpenPaymentModal: () => void;
  onOpenAddCustomerModal: () => void;
  onExitPos?: () => void;
  onOpenReceipt?: (sale: any) => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  onOpenPaymentModal,
  onOpenAddCustomerModal,
  onExitPos,
  onOpenReceipt,
}) => {
  const {
    products = [],
    selectedLocationId = 'loc_main',
    currentLocation = null,
    cart = [],
    addToCart = () => {},
    updateCartQty = () => {},
    updateCartDiscount = () => {},
    updateCartPrice = () => {},
    removeFromCart = () => {},
    clearCart = () => {},
    holdCart = () => {},
    suspendedSales = [],
    resumeSuspendedSale = () => {},
    deleteSuspendedSale = () => {},
    customers = [],
    selectedCustomer = null,
    setSelectedCustomer = () => {},
    settings = {},
    users = [],
    salesCommissionAgents = [],
    posCommissionAgentId = null,
    setPosCommissionAgentId = () => {},
    createSale = () => {},
    isEffectiveOnline = true,
    offlineQueue = [],
    syncStatus = 'idle',
    toggleSimulatedOffline = () => {},
    setActiveTab = () => {},
    currentUser = null,
    cashRegister = { status: 'closed', openingCash: 0 },
    openRegister = () => {},
    closeRegister = () => {},
    isPosExitAllowed = () => true,
    setPendingPosExitTarget = () => {},
    showRegisterExitLockModal = false,
    setShowRegisterExitLockModal = () => {},
  } = useErp() || {};

  const activeCustomer = useMemo(() => {
    return selectedCustomer || {
      id: 'walk_in',
      name: 'Walk-in Customer',
      contactId: 'CUST-0000',
      type: 'customer',
      loyaltyPoints: 0,
      totalSales: 0,
      totalDue: 0
    };
  }, [selectedCustomer]);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileViewTab, setMobileViewTab] = useState<'catalog' | 'cart'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(() => settings?.defaultSaleDiscount || 0);

  useEffect(() => {
    if (settings?.defaultSaleDiscount !== undefined) {
      setOrderDiscountPercent(settings.defaultSaleDiscount);
    }
  }, [settings?.defaultSaleDiscount]);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [showSuspendedDrawer, setShowSuspendedDrawer] = useState(false);
  const [lotSelectionProduct, setLotSelectionProduct] = useState<Product | null>(null);
  const [showSyncManager, setShowSyncManager] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCustomerDisplayModal, setShowCustomerDisplayModal] = useState(false);
  const [showSaleReturnModal, setShowSaleReturnModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [isStandbyMode, setIsStandbyMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  const [barcodeInput, setBarcodeInput] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Terminal inline opening cash in hand state
  const [terminalFloatInput, setTerminalFloatInput] = useState<string>('150.00');
  const [terminalCashierInput, setTerminalCashierInput] = useState<string>(currentUser?.name || 'Sarah Jenkins');
  const [terminalNotesInput, setTerminalNotesInput] = useState<string>('Shift opened with cash in hand.');

  useEffect(() => {
    if (currentUser?.name) {
      setTerminalCashierInput(currentUser.name);
    }
  }, [currentUser]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Digital clock timer for standby screen
  useEffect(() => {
    if (!isStandbyMode) return;
    const interval = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isStandbyMode]);

  // Extract categories & brands
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = getCategoryName(p?.category);
      if (cat && cat !== 'General') set.add(cat);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const brand = getBrandName(p?.brand);
      if (brand && brand !== 'Standard') set.add(brand);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      if (!p) return false;
      const cat = getCategoryName(p.category);
      const matchCat = selectedCategory === 'All' || cat === selectedCategory;
      const matchBrand = selectedBrand === 'All' || getBrandName(p.brand) === selectedBrand;
      if (!matchCat || !matchBrand) return false;

      if (!query) return true;

      const name = String(p.name || '').toLowerCase();
      const sku = String(p.sku || '').toLowerCase();
      const barcode = String(p.barcode || '').toLowerCase();

      return name.includes(query) || sku.includes(query) || barcode.includes(query);
    });
  }, [products, selectedCategory, selectedBrand, searchQuery]);

  const showFlashNotification = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 2800);
  }, []);

  const handleExecuteExit = useCallback(() => {
    if (onExitPos) {
      onExitPos();
    } else {
      setActiveTab('dashboard');
    }
  }, [onExitPos, setActiveTab]);

  const handleRequestExit = useCallback(() => {
    // 1. Role & Cash Register Security Policy Check:
    // Without opening and closing Cash Register, only Admin can exit POS screen
    if (!isPosExitAllowed()) {
      soundEffects.playScanError();
      setPendingPosExitTarget('dashboard');
      setShowRegisterExitLockModal(true);
      showFlashNotification(
        'Exit Blocked: Cash register shift is active. Reconcile drawer and close shift to exit, or request Admin override.',
        'error'
      );
      return;
    }

    // 2. If exit is allowed, check for active cart items
    if (cart.length === 0) {
      handleExecuteExit();
      showFlashNotification('Exited POS terminal to dashboard', 'info');
    } else {
      setShowExitConfirmModal(true);
    }
  }, [
    isPosExitAllowed,
    setPendingPosExitTarget,
    setShowRegisterExitLockModal,
    showFlashNotification,
    cart.length,
    handleExecuteExit,
  ]);

  const handleHoldAndExit = () => {
    holdCart('POS Exit - Auto Preserved');
    setShowExitConfirmModal(false);
    handleExecuteExit();
    showFlashNotification('Active cart preserved in Held Bills. Exited POS.', 'success');
  };

  const handleDiscardAndExit = () => {
    clearCart();
    setShowExitConfirmModal(false);
    handleExecuteExit();
    showFlashNotification('Cart cleared. Exited POS.', 'info');
  };

  // Barcode scan handler (used by Hardware wedge, Camera Scanner, and Manual Simulator)
  const handleBarcodeScan = (code: string) => {
    // If standby mode is active, wake up automatically upon scan
    if (isStandbyMode) {
      setIsStandbyMode(false);
    }

    const cleanCode = code.trim();
    if (!cleanCode) return;

    // 1. Search for a direct Product match (SKU or Barcode)
    let target = products.find(
      (p) =>
        p.barcode === cleanCode ||
        p.sku.toLowerCase() === cleanCode.toLowerCase()
    );

    // 2. If no direct product match, search if the code is a Lot Number
    let foundLotId: string | undefined = undefined;
    if (!target) {
      for (const p of products) {
        const lotMatch = p.lots?.find(l => l.lotNumber.toLowerCase() === cleanCode.toLowerCase());
        if (lotMatch) {
          target = p;
          foundLotId = lotMatch.id;
          break;
        }
      }
    }

    if (target) {
      const locStock = target.locationStocks?.[selectedLocationId] ?? target.currentStock;
      if (!settings?.allowOverselling && locStock <= 0) {
        soundEffects.playScanError();
        showFlashNotification(`Out of Stock: ${target.name} (0 in this branch)`, 'error');
        return;
      }

      // If we found a specific lot by barcode, use it directly
      if (foundLotId) {
        addToCart(target, 1, foundLotId);
        soundEffects.playScanSuccess();
        showFlashNotification(
          `⚡ Lot Scanned: ${target.name} (Batch ${cleanCode})`,
          'success'
        );
        setBarcodeInput('');
        return;
      }

      // If product has multiple lots and we haven't identified one yet, show selection modal
      if (target.lots && target.lots.length > 1) {
        setLotSelectionProduct(target);
        return;
      }

      const added = addToCart(target, 1);
      if (added) {
        soundEffects.playScanSuccess();
        showFlashNotification(
          `⚡ Scanned: ${target.name} (+1 @ ${settings?.currencySymbol || '$'}${target.sellingPrice.toFixed(2)})`,
          'success'
        );
      }
      setBarcodeInput('');
    } else {
      soundEffects.playScanError();
      showFlashNotification(`Barcode / SKU "${cleanCode}" not found in catalog`, 'error');
    }
  };

  // Hardware USB/Bluetooth laser scanner listener everywhere on POS screen
  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: true,
    playSoundOnScan: false, // handled inside handleBarcodeScan
  });

  // Express Cash Pay Handler
  const handleExpressCashCheckout = useCallback(() => {
    if (cart.length === 0) return;
    try {
      const sub = cart.reduce((acc, item) => acc + item.total, 0);
      const disc = (sub * orderDiscountPercent) / 100;
      const taxable = Math.max(0, sub - disc);
      const tax = settings?.enableTax !== false ? (taxable * (settings?.defaultTaxRate || 0)) / 100 : 0;
      const rawTotal = taxable + tax + shippingCost;
      const finalTotal = applyAmountRounding(rawTotal, settings?.amountRoundingMethod);

      createSale({
        customerId: activeCustomer.id,
        items: cart,
        subtotal: sub,
        taxAmount: tax,
        discountAmount: disc,
        shippingCharges: shippingCost,
        totalAmount: finalTotal,
        paidAmount: finalTotal,
        paymentMethod: 'cash',
        notes: 'Express Cash Checkout',
        status: 'final',
        commissionAgentId: posCommissionAgentId || undefined,
      });

      soundEffects.playScanSuccess();
      clearCart();
      setNotification({
        message: `Express Cash sale completed! Total: ${formatCurrency(finalTotal, settings)}`,
        type: 'success',
      });
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error(err);
    }
  }, [cart, orderDiscountPercent, shippingCost, activeCustomer, settings, createSale, clearCart]);

  // Keyboard shortcut listener
  useEffect(() => {
    const shortcuts = settings?.posKeyboardShortcuts || {};
    const expressPayKey = (shortcuts.expressPay || 'F4').toUpperCase();
    const multiplePayKey = (shortcuts.multiplePay || 'F5').toUpperCase();
    const draftKey = (shortcuts.draft || 'F7').toUpperCase();
    const cancelKey = (shortcuts.cancel || 'F8').toUpperCase();
    const editDiscountKey = (shortcuts.editDiscount || 'F9').toUpperCase();
    const focusBarcodeKey = (shortcuts.focusBarcode || 'F2').toUpperCase();

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyUpper = e.key.toUpperCase();

      // If standby mode is active, any key wakes up
      if (isStandbyMode) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          setIsStandbyMode(false);
          return;
        }
      }

      // If exit modal is open, Escape dismisses it
      if (showExitConfirmModal) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowExitConfirmModal(false);
          return;
        }
      }

      // Don't intercept if other sub-modals are active
      if (showSyncManager || showSuspendedDrawer || showCustomerDisplayModal || showSaleReturnModal || showCalculatorModal) {
        return;
      }

      if (keyUpper === 'F9' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setShowCalculatorModal(true);
      } else if (keyUpper === 'F7') {
        e.preventDefault();
        setShowSaleReturnModal(true);
      } else if (keyUpper === focusBarcodeKey) {
        e.preventDefault();
        const input = document.getElementById('pos-barcode-search-input');
        if (input) input.focus();
      } else if (keyUpper === expressPayKey) {
        e.preventDefault();
        if (cart.length > 0) {
          if (!settings?.disableExpressCheckout) {
            handleExpressCashCheckout();
          } else {
            onOpenPaymentModal();
          }
        }
      } else if (keyUpper === multiplePayKey) {
        e.preventDefault();
        if (cart.length > 0 && !settings?.disableMultiplePay) {
          onOpenPaymentModal();
        }
      } else if (keyUpper === draftKey) {
        e.preventDefault();
        if (cart.length > 0 && !settings?.disableDraft) {
          holdCart();
        }
      } else if (keyUpper === cancelKey) {
        e.preventDefault();
        if (cart.length > 0) {
          if (window.confirm('Clear all items from current cart?')) clearCart();
        }
      } else if (keyUpper === editDiscountKey) {
        e.preventDefault();
        if (!settings?.disableDiscount) {
          const discInput = document.getElementById('pos-order-discount-input');
          if (discInput) discInput.focus();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleRequestExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isStandbyMode,
    showExitConfirmModal,
    showSyncManager,
    showSuspendedDrawer,
    showCustomerDisplayModal,
    cart.length,
    onOpenPaymentModal,
    holdCart,
    clearCart,
    handleRequestExit,
    handleExpressCashCheckout,
    settings,
  ]);

  // Cart financial totals
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.total, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (subtotal * orderDiscountPercent) / 100;
  }, [subtotal, orderDiscountPercent]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(() => {
    if (!settings?.enableTax || settings?.taxSystem === 'disabled') return 0;
    return (taxableAmount * (settings?.defaultTaxRate || 0)) / 100;
  }, [taxableAmount, settings?.defaultTaxRate, settings?.enableTax, settings?.taxSystem]);

  const grandTotal = useMemo(() => {
    const rawTotal = taxableAmount + taxAmount + shippingCost;
    return applyAmountRounding(rawTotal, settings?.amountRoundingMethod);
  }, [taxableAmount, taxAmount, shippingCost, settings?.amountRoundingMethod]);

  // Quotation handler
  const handleSaveQuotation = () => {
    if (cart.length === 0) return;
    createSale({
      customerId: activeCustomer.id,
      items: cart,
      subtotal,
      taxAmount,
      discountAmount,
      shippingCharges: shippingCost,
      totalAmount: grandTotal,
      paidAmount: 0,
      paymentMethod: 'credit',
      notes: 'Customer Price Quotation / Estimate',
      status: 'draft',
      isPos: true,
      saleChannel: 'pos',
      commissionAgentId: posCommissionAgentId || undefined,
    });
    soundEffects.playPaymentComplete();
    showFlashNotification('Saved as Quotation Estimate!', 'info');
  };

  // MANDATORY CASH REGISTER OPEN GATE
  if (!cashRegister || cashRegister.status !== 'open') {
    return (
      <div className="h-full min-h-[calc(100vh-53px)] w-full bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <Banknote className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Open Cash Register</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Cash in Hand is mandatory before accessing the POS Screen. Please count physical cash in your drawer to initialize the shift.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span>Branch: {currentLocation?.name} ({currentLocation?.code})</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-bold flex items-center justify-between mb-1.5">
                <span>Cash in Hand (Opening Float) *</span>
                <span className="text-[11px] text-slate-400">Currency: {settings?.currency || 'USD'}</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-xl">
                  {settings?.currencySymbol || '$'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  autoFocus
                  value={terminalFloatInput}
                  onChange={(e) => setTerminalFloatInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 text-white font-black text-2xl pl-11 pr-4 py-3 rounded-2xl border border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner"
                />
              </div>

              {/* Quick Select Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[10px] font-semibold text-slate-400 mr-1">Quick Select:</span>
                {[0, 50, 100, 150, 200, 300, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTerminalFloatInput(amt.toFixed(2))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      parseFloat(terminalFloatInput) === amt
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {formatCurrency(amt, settings)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold mb-1 block">Cashier In-Charge</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={terminalCashierInput}
                  onChange={(e) => setTerminalCashierInput(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold mb-1 block">Opening Shift Notes (Optional)</label>
              <input
                type="text"
                value={terminalNotesInput}
                onChange={(e) => setTerminalNotesInput(e.target.value)}
                placeholder="e.g. Morning opening float counted and verified"
                className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              id="terminal-save-open-register-btn"
              onClick={() => {
                const floatAmt = parseFloat(terminalFloatInput);
                const validFloat = isNaN(floatAmt) || floatAmt < 0 ? 0 : floatAmt;
                openRegister(validFloat, terminalCashierInput, terminalNotesInput);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/60 flex items-center justify-center gap-2 transition"
            >
              <Unlock className="w-4 h-4" />
              <span>SAVE & OPEN CASH REGISTER</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onExitPos ? onExitPos() : setActiveTab('dashboard')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition text-center"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex flex-col lg:flex-row bg-slate-900 overflow-hidden relative">
      {/* Lot Selection Modal */}
      {lotSelectionProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                  <Layers className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Select Price Lot</h3>
                  <p className="text-xs text-slate-400 font-medium">{lotSelectionProduct.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setLotSelectionProduct(null)}
                className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200 leading-relaxed">
                  This product has multiple price batches (Lots). Please select the correct batch to continue.
                </p>
              </div>

              <div className="space-y-3">
                {lotSelectionProduct.lots?.map((lot, idx) => {
                  const isLotOutOfStock = lot.currentStock <= 0;
                  const isLotDisabled = isLotOutOfStock && !settings.allowOverselling;
                  return (
                    <button
                      key={lot.id}
                      disabled={isLotDisabled}
                      onClick={() => {
                        addToCart(lotSelectionProduct, 1, lot.id);
                        soundEffects.playScanSuccess();
                        setLotSelectionProduct(null);
                        showFlashNotification(`Added Lot ${lot.lotNumber} at ${settings.currencySymbol}${lot.sellingPrice.toFixed(2)}`, 'success');
                      }}
                      className={`w-full flex items-center justify-between p-4 border rounded-2xl transition group relative overflow-hidden ${
                        isLotDisabled 
                          ? 'bg-slate-900/50 border-slate-800 cursor-not-allowed opacity-60' 
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-start text-left">
                          <span className={`text-xs font-bold ${isLotOutOfStock ? 'text-slate-500' : 'text-slate-100 group-hover:text-white'}`}>
                            Lot: {lot.lotNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                            <Clock className="w-3 h-3" />
                            Created: {lot.createdDate}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-black tracking-tight ${isLotOutOfStock ? 'text-slate-600' : 'text-emerald-400'}`}>
                            {settings.currencySymbol}{lot.sellingPrice.toFixed(2)}
                          </div>
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${isLotOutOfStock ? 'text-rose-500' : 'text-slate-500'}`}>
                            Stock: {lot.currentStock} {isLotOutOfStock && '(OUT)'}
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition ${isLotOutOfStock ? 'text-slate-800' : 'text-slate-600 group-hover:text-indigo-400'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-slate-800/30 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setLotSelectionProduct(null)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification banner */}
      {notification && (
        <div
          className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 text-white font-bold text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce border ${
            notification.type === 'error'
              ? 'bg-rose-600 border-rose-400'
              : notification.type === 'info'
              ? 'bg-blue-600 border-blue-400'
              : 'bg-emerald-600 border-emerald-400'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-300" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Mobile/Tablet Screen View Switcher: Switch between Products Search & Cart */}
      <div className="lg:hidden flex items-center p-2 bg-slate-900 border-b border-slate-800 gap-2 shrink-0 z-20">
        <button
          type="button"
          onClick={() => setMobileViewTab('catalog')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
            mobileViewTab === 'catalog'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Products & Search ({filteredProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileViewTab('cart')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
            mobileViewTab === 'cart'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="bg-white text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1 font-mono">
              {settings.currencySymbol}{grandTotal.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      {/* LEFT: Product Catalog & Fast Grid */}
      <div className={`flex-1 flex flex-col border-r border-slate-800 bg-slate-950 overflow-hidden min-h-0 ${
        mobileViewTab === 'cart' ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Top Controls: Search, Barcode Scan, Cashier Tools */}
        <div className="p-2.5 sm:p-3 border-b border-slate-800 bg-slate-900/95 space-y-2 shrink-0">
          {/* Dedicated Full-Width Search Input Bar - Always 100% visible and wide */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="pos-product-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Product by Name, SKU, or Barcode..."
              className="w-full bg-slate-950 text-slate-100 pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Offline Mode Alert Strip */}
          {!isEffectiveOnline && (
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/70 flex items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>
                  <strong>Offline Mode:</strong> Invoices queue in local storage and sync automatically.
                </span>
              </div>
              <button
                id="pos-open-sync-manager-btn"
                onClick={() => setShowSyncManager(true)}
                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold shrink-0 transition"
              >
                Queue ({offlineQueue.length})
              </button>
            </div>
          )}

          {/* Secondary Controls Bar: Barcode Scanner, Shift & Fast Tools */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin touch-pan-x py-1 shrink-0 whitespace-nowrap">
            {/* Barcode Laser Input */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700 flex-1 min-w-[170px] sm:flex-initial">
              <Barcode className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                id="barcode-scanner-input"
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && barcodeInput.trim()) {
                    handleBarcodeScan(barcodeInput.trim());
                  }
                }}
                placeholder="Barcode Gun Input..."
                className="bg-transparent text-xs text-slate-200 w-full sm:w-32 focus:outline-none placeholder:text-slate-500 font-mono"
              />
              <button
                id="simulate-barcode-btn"
                onClick={() => {
                  const randomProd = products[Math.floor(Math.random() * products.length)];
                  if (randomProd) handleBarcodeScan(randomProd.barcode || randomProd.sku);
                }}
                className="px-2 py-0.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition shrink-0"
                title="Test hardware scanner"
              >
                Scan Demo
              </button>
            </div>

            {/* Cashier Shift Drawer & Quick Actions Group */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Immediate Sale Return quick button */}
              <button
                id="pos-sale-return-top-btn"
                onClick={() => setShowSaleReturnModal(true)}
                className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/40 hover:border-rose-500/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
                title="Immediate Sale Return & Refund (F7)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline text-[11px]">Sale Return</span>
              </button>

              {/* Shift status button */}
              <button
                id="pos-register-shift-quick-btn"
                onClick={() => setShowRegisterModal(true)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                  cashRegister.status === 'open'
                    ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-rose-950/70 border-rose-700/60 text-rose-300 hover:bg-rose-900/60'
                }`}
                title="Register shift and cash float drawer"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    cashRegister.status === 'open' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                <span className="text-[11px] font-mono">
                  {cashRegister.status === 'open'
                    ? `Drawer: ${settings.currencySymbol}${(
                        cashRegister.openingCash +
                        cashRegister.cashSales -
                        cashRegister.totalExpenses
                      ).toFixed(2)}`
                    : 'Shift Closed'}
                </span>
              </button>

              {/* Calculator Quick Button */}
              <button
                id="pos-calculator-top-btn"
                onClick={() => setShowCalculatorModal(true)}
                className="px-2.5 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-200 border border-indigo-500/40 hover:border-indigo-500/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
                title="POS Calculator & Change/Discount Tool (F9)"
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline text-[11px]">Calculator</span>
              </button>

              {/* Standby */}
              <button
                id="pos-standby-screen-btn"
                onClick={() => setIsStandbyMode(true)}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-xl text-xs border border-slate-700 transition"
                title="Idle / Lock Register"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>

              {/* Fullscreen */}
              <button
                id="pos-fullscreen-toggle-btn"
                onClick={toggleFullscreen}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs border border-slate-700 transition"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              </button>

              {/* Customer Facing Display Screen Button */}
              {settings.showCustomerDisplayScreen && (
                <button
                  id="pos-customer-display-btn"
                  onClick={() => setShowCustomerDisplayModal(true)}
                  className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold border border-indigo-500/30 flex items-center gap-1.5 transition"
                  title="Customer Facing Secondary Screen"
                >
                  <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden xl:inline text-[11px]">Customer Display</span>
                </button>
              )}

              {/* Network sync badge */}
              <NetworkSyncStatusBadge
                onClick={() => setShowSyncManager(true)}
                variant="compact"
              />

              {/* Exit POS */}
              <button
                id="pos-exit-terminal-btn"
                onClick={handleRequestExit}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 flex items-center gap-1.5 transition shadow-sm"
                title="Exit POS Terminal (Esc)"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          {(settings.showCategoryInPos !== false) && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin touch-pan-x whitespace-nowrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-3.5 overflow-y-auto min-h-0 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Package className="w-12 h-12 text-slate-600 mb-3" />
              <p className="font-semibold text-slate-300">No matching products found</p>
              <p className="text-xs text-slate-500 mt-1">Try another search query or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const locStock = product.locationStocks?.[selectedLocationId] ?? product.currentStock;
                const isOutOfStock = locStock <= 0;
                const canAdd = !isOutOfStock || settings.allowOverselling;
                const isLowStock = locStock > 0 && locStock <= product.alertQuantity;

                return (
                  <div
                    key={product.id}
                    id={`pos-item-${product.id}`}
                    onClick={() => {
                      if (canAdd) {
                        if (product.lots && product.lots.length > 1) {
                          setLotSelectionProduct(product);
                        } else {
                          addToCart(product, 1);
                          soundEffects.playScanSuccess();
                        }
                      }
                    }}
                    className={`relative bg-slate-900 border rounded-xl p-2.5 flex flex-col justify-between transition-all select-none ${
                      !canAdd
                        ? 'opacity-50 border-slate-800 cursor-not-allowed'
                        : 'border-slate-800 hover:border-indigo-500 hover:bg-slate-850 hover:shadow-lg active:scale-95 active:opacity-80 cursor-pointer group'
                    }`}
                  >
                    {/* Stock badge */}
                    <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                          {locStock} left
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {locStock} {product.unit}
                        </span>
                      )}
                      {product.lots && product.lots.length > 1 && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg bg-indigo-600 text-white border border-indigo-400 shadow-sm animate-pulse">
                          {product.lots.length} BATCHES
                        </span>
                      )}
                    </div>

                    {/* Image */}
                    <div className="w-full h-24 rounded-lg bg-slate-950 overflow-hidden mb-2 relative">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        {settings.showSkuInPos !== false ? <span>{product.sku}</span> : <span />}
                        <span className="text-amber-400 font-mono">{product.barcode}</span>
                      </div>
                      {(settings.showBrandInPos !== false && product.brand) && (
                        <div className="inline-block">
                          <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-indigo-950/80 text-indigo-300 rounded border border-indigo-800/60 leading-none">
                            {getBrandName(product.brand)}
                          </span>
                        </div>
                      )}
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-300 transition">
                        {product.name}
                      </h4>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-400">
                        {formatCurrency(product.sellingPrice, settings)}
                      </span>
                      <button
                        disabled={isOutOfStock}
                        className={`p-1.5 rounded-lg text-xs font-bold transition ${
                          isOutOfStock
                            ? 'bg-slate-800 text-slate-600'
                            : 'bg-indigo-600 text-white group-hover:bg-indigo-500 shadow-sm'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Active Cart & Billing Terminal */}
      <div className={`w-full lg:w-[410px] xl:w-[450px] bg-slate-900 flex flex-col h-full border-t lg:border-t-0 lg:border-l border-slate-800 shrink-0 min-h-0 relative shadow-2xl ${
        mobileViewTab === 'catalog' ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Cart Top: Customer selector & Header */}
        <div className="p-3 sm:p-3.5 border-b border-slate-800 bg-slate-950/90 shrink-0 space-y-2.5 relative z-20">
          {/* Mobile Back to Products Catalog Button */}
          <div className="lg:hidden flex items-center justify-between pb-1 border-b border-slate-800/80">
            <button
              type="button"
              onClick={() => setMobileViewTab('catalog')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 py-1 px-2 rounded-lg bg-indigo-950/60 border border-indigo-800/60 transition active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>+ Add More Items (Search Catalog)</span>
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} in cart
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Cart & Checkout
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="pos-sale-return-cart-header-btn"
                onClick={() => setShowSaleReturnModal(true)}
                className="text-[11px] text-rose-300 hover:text-white font-semibold flex items-center gap-1 px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 rounded-lg border border-rose-500/30 transition"
                title="Immediate Sale Return & Refund (F7)"
              >
                <RotateCcw className="w-3 h-3 text-rose-400" />
                <span>Return</span>
              </button>
              <button
                id="pos-add-customer-btn"
                onClick={onOpenAddCustomerModal}
                className="text-[11px] text-indigo-300 hover:text-white font-semibold flex items-center gap-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg border border-indigo-500/30 transition"
              >
                <UserPlus className="w-3 h-3 text-indigo-400" />
                <span>+ Customer</span>
              </button>
              {suspendedSales.length > 0 && (
                <button
                  id="view-held-bills-btn"
                  onClick={() => setShowSuspendedDrawer(true)}
                  className="text-[11px] text-amber-300 hover:text-white font-semibold flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg border border-amber-500/30 animate-pulse transition"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Held ({suspendedSales.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer & Rep Dropdowns */}
          <div className="space-y-1.5 relative z-30">
            {/* Customer */}
            <div>
              <SearchableDropdown
                options={[
                  { id: '', name: 'Walk-in Customer • Points: 0' },
                  ...customers.map(c => ({ 
                    id: c.id, 
                    name: `${c.name} ${c.businessName ? `(${c.businessName})` : ''} • Points: ${c.loyaltyPoints}`, 
                    phone: c.phone 
                  }))
                ]}
                value={selectedCustomer?.id || ''}
                onChange={(value) => {
                  if (!value) {
                    setSelectedCustomer(null as any);
                  } else {
                    const found = customers.find((c) => c.id === value);
                    if (found) setSelectedCustomer(found);
                    else setSelectedCustomer(null as any);
                  }
                }}
                placeholder="Search Customers..."
              />
            </div>

            {/* Sales Representative */}
            {settings?.salesCommissionAgent && settings.salesCommissionAgent !== 'disable' && (
              <div className="relative">
                <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="pos-sales-rep-select"
                  value={posCommissionAgentId || ''}
                  onChange={(e) => setPosCommissionAgentId(e.target.value || null)}
                  className="w-full bg-slate-900 text-[11px] font-medium text-slate-100 pl-8 pr-8 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                  disabled={settings.salesCommissionAgent === 'logged_in_user'}
                >
                  <option value="">
                    {settings.salesCommissionAgent === 'logged_in_user' 
                      ? `${currentUser?.name || 'Logged-in User'} (Auto-Assigned)` 
                      : '-- Select Sales Representative --'}
                  </option>
                  
                  {settings.salesCommissionAgent === 'user' && users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                  
                  {settings.salesCommissionAgent === 'commission_agent' && salesCommissionAgents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.firstName} {a.lastName}
                    </option>
                  ))}
                </select>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2 min-h-0 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-3 text-slate-600 shadow-inner">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-300">Cart is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                Click catalog items or scan barcodes to begin checkout.
              </p>
              <div className="mt-4 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Barcode scanning enabled</span>
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.lotId || 'no-lot'}`}
                id={`cart-item-${item.productId}-${item.lotId || 'no-lot'}`}
                className="bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-800/90 flex flex-col gap-2 shadow-sm hover:border-slate-700 transition"
              >
                {/* Item Name and Total */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-100 line-clamp-1 leading-snug">
                      {item.productName}
                    </h5>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{item.sku}</span>
                      {item.lotNumber && (
                        <span className="text-amber-400 font-bold bg-amber-950/50 px-1 py-0.2 rounded border border-amber-800/40">
                          Lot: {item.lotNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
                      {settings.currencySymbol}
                      {item.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Stepper, Unit Price, and Remove */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-900/90">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-800 shrink-0">
                    <button
                      onClick={() => updateCartQty(item.productId, item.quantity - 1, item.lotId)}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded transition"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-white min-w-[24px] text-center font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.productId, item.quantity + 1, item.lotId)}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded transition"
                      title="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Unit Price & Delete */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                      <span className="text-slate-500 font-mono">@</span>
                      <span className="text-slate-400 text-[10px]">{settings.currencySymbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={!settings.subtotalEditable}
                        readOnly={!settings.subtotalEditable}
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateCartPrice(
                            item.productId,
                            parseFloat(e.target.value) || 0,
                            item.lotId
                          )
                        }
                        className={`w-14 bg-slate-950 px-1 py-0.2 rounded border text-xs font-bold font-mono text-right ${
                          settings.subtotalEditable
                            ? 'border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500'
                            : 'border-slate-800/60 text-slate-500 opacity-60 cursor-not-allowed'
                        }`}
                        title={!settings.subtotalEditable ? 'Unit price edit is disabled in settings' : 'Edit unit price'}
                      />
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId, item.lotId)}
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 p-1.5 rounded-lg transition"
                      title="Remove item from cart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom: Calculations & Checkout Bar */}
        <div className="p-3 sm:p-3.5 bg-slate-950 border-t border-slate-800 shrink-0 space-y-2.5">
          {/* Subtotals & Taxes Breakdown */}
          <div className="space-y-1.5 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center">
              <span>Items Subtotal:</span>
              <span className="font-bold text-slate-200 font-mono">
                {settings.currencySymbol}
                {subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Discount:</span>
                <div className="relative inline-flex items-center">
                  <input
                    id="pos-order-discount-input"
                    type="number"
                    min="0"
                    max="100"
                    disabled={settings.disableDiscount}
                    value={orderDiscountPercent}
                    onChange={(e) =>
                      setOrderDiscountPercent(
                        Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                      )
                    }
                    className={`w-12 bg-slate-950 px-1.5 py-0.5 rounded border text-xs font-bold font-mono text-center ${
                      settings.disableDiscount
                        ? 'border-slate-800/60 text-slate-500 opacity-50 cursor-not-allowed'
                        : 'border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500'
                    }`}
                    title={settings.disableDiscount ? 'Discount is disabled in settings' : 'Edit discount %'}
                  />
                  <span className="text-[10px] text-slate-400 ml-1">%</span>
                </div>
              </span>
              <span className="font-bold text-rose-400 font-mono">
                {formatCurrency(discountAmount, settings).replace(settings.currencySymbol || '$', '-'+(settings.currencySymbol || '$'))}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>Sales Tax ({settings.defaultTaxRate}%):</span>
              <span className="font-bold text-slate-200 font-mono">
                {formatCurrency(taxAmount, settings).replace(settings.currencySymbol || '$', '+'+(settings.currencySymbol || '$'))}
              </span>
            </div>
          </div>

          {/* Grand Total Box */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-900/90 p-3 rounded-2xl border border-slate-700 flex items-center justify-between shadow-inner">
            <div>
              <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Total Payable
              </div>
              <div className="text-[10px] text-slate-500">Tax & Discount Incl.</div>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {formatCurrency(grandTotal, settings)}
            </div>
          </div>

          {/* Action Button Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {!settings.disableDraft && (
              <button
                id="pos-hold-sale-btn"
                disabled={cart.length === 0}
                onClick={() => holdCart()}
                className="py-2 px-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 active:opacity-80 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Hold / Suspend sale (F9)"
              >
                <PauseCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Hold</span>
              </button>
            )}

            <button
              id="pos-quotation-btn"
              disabled={cart.length === 0}
              onClick={handleSaveQuotation}
              className={`py-2 px-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 active:opacity-80 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                settings.disableDraft ? 'col-span-1.5' : ''
              }`}
              title="Save as Quotation Estimate"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quote</span>
            </button>

            <button
              id="pos-sale-return-cart-action-btn"
              onClick={() => setShowSaleReturnModal(true)}
              className="py-2 px-1.5 bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 active:opacity-80 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
              title="Immediate Sale Return (F7)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Return</span>
            </button>

            <button
              id="pos-clear-cart-btn"
              disabled={cart.length === 0}
              onClick={() => {
                if (window.confirm('Clear all items from current cart?')) clearCart();
              }}
              className={`py-2 px-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 active:opacity-80 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                settings.disableDraft ? 'col-span-1.5' : ''
              }`}
              title="Clear Cart"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Clear</span>
            </button>
          </div>

          {/* Checkout / Pay Triggers */}
          <div className="flex gap-2">
            {!settings.disableExpressCheckout && (
              <button
                id="pos-express-cash-btn"
                disabled={cart.length === 0}
                onClick={handleExpressCashCheckout}
                className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-950/60 flex items-center justify-center gap-1.5 transition active:scale-95 active:opacity-80 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Complete cash sale immediately with exact total"
              >
                <Banknote className="w-4 h-4" />
                <span>EXPRESS CASH</span>
              </button>
            )}

            <button
              id="pos-checkout-btn"
              disabled={cart.length === 0}
              onClick={onOpenPaymentModal}
              className={`py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-black text-xs sm:text-sm shadow-xl shadow-indigo-950/60 flex items-center justify-center gap-2 transition active:scale-95 active:opacity-80 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                !settings.disableExpressCheckout ? 'flex-[1.5]' : 'w-full'
              }`}
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>PAY / CHARGE — {formatCurrency(grandTotal, settings)}</span>
            </button>
          </div>

          {/* Keyboard Shortcuts Strip */}
          <div className="flex items-center justify-center gap-2.5 pt-0.5 text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-slate-900 text-slate-400 rounded border border-slate-800">F4</kbd> Pay
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-slate-900 text-rose-400 rounded border border-rose-900/50">F7</kbd> Return
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-slate-900 text-indigo-400 rounded border border-indigo-900/50">F9</kbd> Calc
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-slate-900 text-slate-400 rounded border border-slate-800">Esc</kbd> Exit
            </span>
          </div>
        </div>
      </div>

      {/* Exit POS Confirmation Modal */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Exit POS Screen?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  You have <strong className="text-white">{cart.length} active item(s)</strong> in your checkout cart worth <strong className="text-indigo-400">{formatCurrency(grandTotal, settings)}</strong>.
                </p>
              </div>
              <button
                onClick={() => setShowExitConfirmModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="font-semibold text-slate-200">How would you like to handle your current cart?</div>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                <li><strong className="text-indigo-300">Hold & Exit:</strong> Preserves cart in Held Bills so you can resume later.</li>
                <li><strong className="text-indigo-300">Discard & Exit:</strong> Clears current cart and exits to ERP.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <button
                id="pos-exit-hold-btn"
                onClick={handleHoldAndExit}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 transition"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Hold Current Bill & Exit POS</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="pos-exit-discard-btn"
                  onClick={handleDiscardAndExit}
                  className="py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard & Exit</span>
                </button>

                <button
                  onClick={() => setShowExitConfirmModal(false)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  <span>Stay in POS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standby / Idle Mode Overlay */}
      {isStandbyMode && (
        <div
          onClick={() => setIsStandbyMode(false)}
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer transition-all"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center space-y-6 cursor-default"
          >
            {/* Logo / Badge */}
            <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-2xl border border-indigo-500/30 flex items-center justify-center">
              <Coffee className="w-10 h-10 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800/80">
                POS Terminal Standby Mode
              </span>
              <h2 className="text-2xl font-black text-white pt-2">Register Inactive</h2>
              <p className="text-xs text-slate-400">
                Screen locked while register is idle. Click anywhere or scan a barcode to resume.
              </p>
            </div>

            {/* Live Clock & Info */}
            <div className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-around text-center">
              <div>
                <div className="text-2xl font-mono font-bold text-indigo-400">
                  {liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                  {liveTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {currentLocation?.name || 'Main Branch'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Cashier: {currentUser?.name || 'Staff'}
                </div>
              </div>
            </div>

            {/* Cart Status in Standby */}
            {cart.length > 0 ? (
              <div className="w-full p-3 bg-amber-950/40 rounded-xl border border-amber-800/50 flex items-center justify-between text-xs text-amber-200">
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span><strong>{cart.length} item(s)</strong> active in memory</span>
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {settings.currencySymbol}{grandTotal.toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Cart empty • Ready for next customer</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="pos-resume-terminal-btn"
                onClick={() => setIsStandbyMode(false)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 transition"
              >
                <Power className="w-4 h-4" />
                <span>Resume Cashier Checkout</span>
              </button>

              <button
                id="pos-standby-exit-btn"
                onClick={() => {
                  setIsStandbyMode(false);
                  handleRequestExit();
                }}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Exit POS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspended Sales Drawer Modal */}
      {showSuspendedDrawer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Suspended / Held Sales ({suspendedSales.length})</span>
              </h3>
              <button
                onClick={() => setShowSuspendedDrawer(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5">
              {suspendedSales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{sale.reference}</div>
                    <div className="text-[11px] text-slate-400">
                      Customer: {sale.customerName} • {sale.items.length} items
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Held at: {sale.date}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        resumeSuspendedSale(sale.id);
                        setShowSuspendedDrawer(false);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => deleteSuspendedSale(sale.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                      title="Discard"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* POS Quick Sale Return & Refund Modal */}
      <PosSaleReturnModal
        isOpen={showSaleReturnModal}
        onClose={() => setShowSaleReturnModal(false)}
        onOpenReceipt={onOpenReceipt}
      />

      {/* Offline Sync Manager Modal */}
      <OfflineSyncManagerModal
        isOpen={showSyncManager}
        onClose={() => setShowSyncManager(false)}
      />

      {/* Cash Register Management Modal */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onShiftClosed={() => {
          showFlashNotification('Cash register shift closed and reconciled.', 'info');
        }}
        onShiftOpened={() => {
          showFlashNotification('Cash register shift opened successfully.', 'success');
        }}
      />

      {/* Cash Register Exit Lock Modal */}
      <PosRegisterLockModal
        isOpen={showRegisterExitLockModal}
        onClose={() => setShowRegisterExitLockModal(false)}
        onExitSuccess={() => {
          handleExecuteExit();
          setShowRegisterExitLockModal(false);
        }}
      />

      {/* Customer Facing Display Screen Modal */}
      {showCustomerDisplayModal && (
        <div className="fixed inset-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md z-50 flex flex-col p-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 rounded-2xl border border-indigo-200 dark:border-indigo-500/30">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Customer Display Screen</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">Secondary monitor facing customer view</p>
              </div>
            </div>
            <button
              onClick={() => setShowCustomerDisplayModal(false)}
              className="px-4 py-2 bg-white hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 hover:text-slate-900 dark:text-white dark:hover:text-white border border-slate-300 hover:border-slate-300 dark:border-transparent dark:hover:border-transparent rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm dark:shadow-none"
            >
              <X className="w-4 h-4" />
              Close Display
            </button>
          </div>

          {/* Welcome Header */}
          <div className="bg-indigo-50 dark:bg-slate-900/80 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-500/30 mb-6 text-center shadow-md dark:shadow-xl shrink-0">
            <h1 className="text-2xl sm:text-3xl font-black text-indigo-950 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-indigo-200 dark:to-slate-100">
              {settings.customerDisplayHeader || 'Welcome to Royal POS & Enterprise Store'}
            </h1>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">Thank you for shopping with us today!</p>
          </div>

          {/* Live Cart Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col min-h-0 shadow-sm dark:shadow-none">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2 shrink-0">
                <ShoppingCart className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span>Itemized Order Summary</span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
                    <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-sm font-semibold">Ready for items...</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <div key={`${item.productId}-${item.lotId || 'no-lot'}`} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          {product?.image ? (
                            <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" />
                          ) : (
                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-sm">
                              <Package className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white">{item.productName}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {item.quantity} {item.unit} x {formatCurrency(item.unitPrice, settings)}
                              </p>
                              {item.discount > 0 && (
                                <span className="text-[10px] bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-md font-semibold">
                                  -{formatCurrency(item.discount, settings)} off
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-black text-indigo-700 dark:text-indigo-300 font-mono text-right whitespace-nowrap">
                          {formatCurrency(item.total, settings)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Financials & Status */}
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm dark:shadow-none">
              <div className="space-y-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Customer: <strong className="text-slate-800 dark:text-white">{activeCustomer.name}</strong>
                </div>
                <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">{formatCurrency(subtotal, settings)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
                    <span>Discount ({orderDiscountPercent}%):</span>
                    <span className="font-mono">-{formatCurrency(discountAmount, settings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sales Tax ({settings.defaultTaxRate}%):</span>
                    <span className="font-mono font-medium">+{formatCurrency(taxAmount, settings)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 dark:from-emerald-950 dark:via-slate-950 dark:to-teal-950 p-6 rounded-2xl border border-emerald-300 dark:border-emerald-500/40 text-center space-y-1 shadow-xl">
                <div className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Total Due</div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
                  {formatCurrency(grandTotal, settings)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS Interactive Calculator Modal */}
      <PosCalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        currencySymbol={settings.currencySymbol || '$'}
        cartTotal={grandTotal}
        onApplyDiscount={(discountPct) => {
          setOrderDiscountPercent(discountPct);
          showFlashNotification(`Applied ${discountPct}% discount to cart`, 'success');
        }}
      />
    </div>
  );
};

