import React, { useState, useMemo, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { PaymentMethod } from '../../types/erp';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Banknote,
  Building,
  FileCheck,
  UserCheck,
  Users,
  CheckCircle2,
  DollarSign,
  Receipt,
  X,
  WifiOff,
  Database,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (sale: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const {
    cart = [],
    selectedCustomer = null,
    settings = {},
    createSale,
    isEffectiveOnline = true,
    users = [],
    currentUser = null,
    salesCommissionAgents = [],
    paymentMethods = [],
    posCommissionAgentId = null,
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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tenderAmount, setTenderAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [referenceNo, setReferenceNo] = useState<string>('');

  // Card Payment Details State
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolderName: '',
    cardTransactionNo: '',
    cardType: 'Credit Card',
    month: '',
    year: '',
    securityCode: ''
  });

  // Additional Payment Details State
  const [extraPaymentDetails, setExtraPaymentDetails] = useState({
    bankAccountNo: '',
    chequeNo: '',
    transactionNo: ''
  });

  const updateCardDetail = (field: string, value: string) => {
    setCardDetails(prev => ({ ...prev, [field]: value }));
  };

  const updateExtraDetail = (field: string, value: string) => {
    setExtraPaymentDetails(prev => ({ ...prev, [field]: value }));
  };

  // Commission agent state
  const isCommissionEnabled = settings?.salesCommissionAgent && settings.salesCommissionAgent !== 'disable';
  const commissionMode = settings?.salesCommissionAgent || 'disable';

  const [commissionAgentId, setCommissionAgentId] = useState<string>(() => {
    if (posCommissionAgentId) return posCommissionAgentId;
    if (settings?.salesCommissionAgent === 'logged_in_user') {
      return currentUser?.id || 'usr_sarah';
    }
    return '';
  });

  // Re-sync if posCommissionAgentId changes before opening
  useEffect(() => {
    if (isOpen && posCommissionAgentId) {
      setCommissionAgentId(posCommissionAgentId);
    }
  }, [isOpen, posCommissionAgentId]);

  // Cart financial totals
  const subtotal = useMemo(() => {
    return (cart || []).reduce((acc, item) => acc + (item?.total || 0), 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return (subtotal * (settings?.defaultTaxRate || 0)) / 100;
  }, [subtotal, settings?.defaultTaxRate]);

  const payableTotal = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  // Set default tender amount when modal opens
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTenderAmount(payableTotal.toFixed(2));
      if (settings?.salesCommissionAgent === 'logged_in_user') {
        setCommissionAgentId(currentUser?.id || 'usr_sarah');
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, payableTotal, settings?.salesCommissionAgent, currentUser]);

  const numericTender = parseFloat(tenderAmount) || 0;
  const changeDue = Math.max(0, numericTender - payableTotal);
  const remainingDue = Math.max(0, payableTotal - numericTender);

  const effectivePaid = paymentMethod === 'credit' ? 0 : Math.min(numericTender, payableTotal);

  // Selected commission agent info & calculation
  const selectedAgentInfo = useMemo(() => {
    if (commissionMode === 'logged_in_user') {
      return {
        id: currentUser?.id || 'usr_sarah',
        name: currentUser?.name || 'Admin Sarah',
        role: currentUser?.role || 'admin',
        rate: currentUser?.commissionPercentage ?? 5.0,
      };
    }
    if (commissionMode === 'user') {
      const u = (users || []).find((usr) => usr.id === commissionAgentId);
      if (u) {
        return {
          id: u.id,
          name: u.name,
          role: u.role,
          rate: u.commissionPercentage ?? 0,
        };
      }
    }
    if (commissionMode === 'commission_agent') {
      const a = (salesCommissionAgents || []).find((agent) => agent.id === commissionAgentId);
      if (a) {
        return {
          id: a.id,
          name: `${a.firstName} ${a.lastName}`.trim(),
          role: 'Sales Commission Agent',
          rate: a.commissionPercentage ?? 0,
        };
      }
    }
    return null;
  }, [commissionMode, commissionAgentId, currentUser, users, salesCommissionAgents]);

  const commissionRate = selectedAgentInfo?.rate || 0;

  const commissionCalculationMode = settings?.commissionCalculationType || (settings?.commissionAgentMethod === 'payment' ? 'payment_received' : 'invoice_value');

  const calculatedCommission = useMemo(() => {
    if (!isCommissionEnabled || !selectedAgentInfo || commissionRate <= 0) {
      return 0;
    }
    const baseVal = commissionCalculationMode === 'payment_received' ? effectivePaid : payableTotal;
    return (baseVal * commissionRate) / 100;
  }, [isCommissionEnabled, selectedAgentInfo, commissionRate, commissionCalculationMode, effectivePaid, payableTotal]);

  const quickDenominations = useMemo(() => {
    const raw = settings?.cashDenominations || '100, 50, 20, 10, 5, 2, 1, 0.50, 0.25';
    return raw
      .split(',')
      .map((item) => parseFloat(item.trim()))
      .filter((num) => !isNaN(num) && num > 0);
  }, [settings?.cashDenominations]);

  const methods = useMemo(() => {
    const rawMethods = (paymentMethods || []).filter((m) => m.enabled);
    if (rawMethods.length === 0) {
      return [
        { id: 'cash' as PaymentMethod, label: 'Cash', icon: Banknote },
        { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard },
        { id: 'bank_transfer' as PaymentMethod, label: 'Bank Transfer', icon: Building },
        { id: 'cheque' as PaymentMethod, label: 'Cheque', icon: FileCheck },
      ];
    }
    return rawMethods.map((m) => ({
      id: m.code as PaymentMethod,
      label: m.name,
      icon: m.code === 'cash' ? Banknote : m.code === 'card' ? CreditCard : m.code === 'bank_transfer' ? Building : m.code === 'cheque' ? FileCheck : CreditCard,
    }));
  }, [paymentMethods]);

  if (!isOpen) return null;

  const handleQuickCash = (amt: number) => {
    setTenderAmount(amt.toFixed(2));
  };

  const methodLabel = methods.find(m => m.id === paymentMethod)?.label.toLowerCase() || '';
  
  const isCardOrTerminal = paymentMethod === 'card' || (methodLabel.includes('pos') && !methodLabel.includes('terminal'));
  const isBankTransfer = paymentMethod === 'bank_transfer' || methodLabel.includes('bank');
  const isCheque = paymentMethod === 'cheque' || methodLabel.includes('cheque');
  
  // UPI/QR, Phone pay and others
  const isOtherDigital = !['cash', 'credit'].includes(paymentMethod) && !isBankTransfer && !isCheque && !isCardOrTerminal;
  const isUpiOrPay = methodLabel.includes('upi') || methodLabel.includes('qr') || methodLabel.includes('pay') || methodLabel.includes('terminal');
  const showTransactionNo = isOtherDigital || isUpiOrPay;

  const handleCompleteSale = () => {
    const paid = Math.min(numericTender, payableTotal);

    try {
      const newSale = createSale({
        customerId: activeCustomer.id,
        items: cart,
        subtotal,
        taxAmount,
        discountAmount: 0,
        shippingCharges: 0,
        totalAmount: payableTotal,
        paidAmount: paymentMethod === 'credit' ? 0 : paid,
        paymentMethod,
        cardDetails: isCardOrTerminal ? cardDetails : undefined,
        extraPaymentDetails: (isBankTransfer || isCheque || showTransactionNo) ? extraPaymentDetails : undefined,
        notes: paymentNote ? `${paymentNote} ${referenceNo ? `(Ref: ${referenceNo})` : ''}` : referenceNo,
        status: 'final',
        commissionAgentId: selectedAgentInfo ? selectedAgentInfo.id : undefined,
        commissionAgentType: isCommissionEnabled ? (commissionMode as any) : undefined,
        commissionAgentName: selectedAgentInfo ? selectedAgentInfo.name : undefined,
        commissionPercentage: selectedAgentInfo ? commissionRate : undefined,
        commissionAmount: isCommissionEnabled && selectedAgentInfo ? calculatedCommission : undefined,
        isPos: true,
        saleChannel: 'pos',
      });

      // Fire joyful confetti animation
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      onPaymentSuccess(newSale);
      onClose();
    } catch (error) {
      // Error is already handled via showFlashNotification in ErpContext
      console.error('Sale creation failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-4 sm:p-5 shadow-2xl shadow-black space-y-3 animate-in fade-in zoom-in duration-200 max-h-[95vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Checkout & Payment</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Customer: <span className="text-slate-200 font-semibold">{activeCustomer.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition ${
              settings?.themeMode === 'dark'
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-white hover:bg-indigo-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grand Total Banner */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Payable</div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">
              {settings.currencySymbol}
              {payableTotal.toFixed(2)}
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div>Items: {cart.reduce((a, b) => a + b.quantity, 0)}</div>
            <div>Tax: {settings.currencySymbol}{taxAmount.toFixed(2)}</div>
          </div>
        </div>

        {/* Sales Representative Section */}
        {isCommissionEnabled && (
          <div className="bg-slate-950 p-2.5 rounded-xl border border-indigo-900/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-indigo-300 flex items-center gap-1.5 uppercase">
                <Users className="w-3 h-3 text-indigo-400" />
                <span>Representative</span>
              </label>
            </div>

            {commissionMode === 'logged_in_user' && (
              <div className="flex items-center justify-between p-1.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                <div>
                  <div className="font-bold text-white leading-tight">
                    {currentUser?.name || 'Sarah Jenkins'}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Auto-assigned ({commissionRate}%)
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold font-mono text-emerald-400">
                    {formatCurrency(calculatedCommission, settings)}
                  </div>
                </div>
              </div>
            )}

            {(commissionMode === 'user' || commissionMode === 'commission_agent') && (
              <div className="space-y-1">
                <select
                  value={commissionAgentId}
                  onChange={(e) => setCommissionAgentId(e.target.value)}
                  className="w-full bg-slate-900 text-white text-[11px] px-2 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Representative --</option>
                  {commissionMode === 'user' 
                    ? users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.commissionPercentage ?? 0}%)
                        </option>
                      ))
                    : salesCommissionAgents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.firstName} {a.lastName} ({a.commissionPercentage}%)
                        </option>
                      ))
                  }
                </select>
                {selectedAgentInfo && (
                  <div className="flex items-center justify-between text-[10px] px-1 text-slate-500">
                    <span>Payable: <strong className="text-emerald-400 font-mono font-bold">{formatCurrency(calculatedCommission, settings)}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Payment Method Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Payment Method
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {methods.map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  id={`pay-method-${m.id}`}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-1.5 rounded-lg text-[9px] font-bold flex flex-col items-center gap-1 transition border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20 hover:bg-indigo-500 hover:border-indigo-300'
                      : settings?.themeMode === 'dark'
                        ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-center leading-tight truncate w-full">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Specific Details (Conditional) */}
        {isCardOrTerminal && (
          <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Card Record Details</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-0.5">Card Number</label>
                <input
                  type="text"
                  value={cardDetails.cardNumber}
                  onChange={(e) => updateCardDetail('cardNumber', e.target.value)}
                  placeholder="Card Number"
                  className="w-full bg-slate-900 text-white text-[11px] px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-0.5">Card holder name</label>
                <input
                  type="text"
                  value={cardDetails.cardHolderName}
                  onChange={(e) => updateCardDetail('cardHolderName', e.target.value)}
                  placeholder="Card holder name"
                  className="w-full bg-slate-900 text-white text-[11px] px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-0.5">Card Transaction No.</label>
                <input
                  type="text"
                  value={cardDetails.cardTransactionNo}
                  onChange={(e) => updateCardDetail('cardTransactionNo', e.target.value)}
                  placeholder="Card Transaction No."
                  className="w-full bg-slate-900 text-white text-[11px] px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-0.5">Card Type</label>
                <select
                  value={cardDetails.cardType}
                  onChange={(e) => updateCardDetail('cardType', e.target.value)}
                  className="w-full bg-slate-900 text-white text-[11px] px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="Amex">Amex</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-0.5">Month</label>
                <input
                  type="text"
                  value={cardDetails.month}
                  onChange={(e) => updateCardDetail('month', e.target.value)}
                  placeholder="Month"
                  className="w-full bg-slate-900 text-white text-[11px] px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-0.5">Year</label>
                <input
                  type="text"
                  value={cardDetails.year}
                  onChange={(e) => updateCardDetail('year', e.target.value)}
                  placeholder="Year"
                  className="w-full bg-slate-900 text-white text-[11px] px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-0.5">Security Code</label>
                <input
                  type="text"
                  value={cardDetails.securityCode}
                  onChange={(e) => updateCardDetail('securityCode', e.target.value)}
                  placeholder="Security Code"
                  className="w-full bg-slate-900 text-white text-[11px] px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bank Transfer Details */}
        {isBankTransfer && (
          <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Bank Transfer Details</span>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-0.5">Bank Account No</label>
              <input
                type="text"
                value={extraPaymentDetails.bankAccountNo}
                onChange={(e) => updateExtraDetail('bankAccountNo', e.target.value)}
                placeholder="Enter Bank Account Number"
                className="w-full bg-slate-900 text-white text-[11px] px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Cheque Details */}
        {isCheque && (
          <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Cheque Details</span>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-0.5">Cheque No.</label>
              <input
                type="text"
                value={extraPaymentDetails.chequeNo}
                onChange={(e) => updateExtraDetail('chequeNo', e.target.value)}
                placeholder="Enter Cheque Number"
                className="w-full bg-slate-900 text-white text-[11px] px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Digital / UPI Details */}
        {showTransactionNo && (
          <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Transaction Details</span>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-0.5">Transaction No</label>
              <input
                type="text"
                value={extraPaymentDetails.transactionNo}
                onChange={(e) => updateExtraDetail('transactionNo', e.target.value)}
                placeholder="Enter Transaction/Reference Number"
                className="w-full bg-slate-900 text-white text-[11px] px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Cash Tender & Change Calculations */}
        {paymentMethod !== 'credit' && (
          <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-slate-400">Received Amount</label>
              <button
                onClick={() => setTenderAmount(payableTotal.toFixed(2))}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
              >
                Exact ({settings.currencySymbol}{payableTotal.toFixed(2)})
              </button>
            </div>

            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="tender-amount-input"
                type="number"
                step="0.01"
                value={tenderAmount}
                onChange={(e) => setTenderAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900 text-white text-sm font-bold font-mono pl-8 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Quick Cash Buttons */}
            {paymentMethod === 'cash' && (
              <div className="flex flex-wrap items-center gap-1">
                {quickDenominations.slice(0, 6).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-indigo-600/30 hover:border-indigo-500 text-slate-300 border border-slate-800 rounded-md text-[10px] font-semibold transition font-mono"
                  >
                    {settings.currencySymbol || '$'}{amt % 1 === 0 ? amt : amt.toFixed(2)}
                  </button>
                ))}
              </div>
            )}

            {/* Change or Balance Due */}
            <div className="pt-1.5 border-t border-slate-900 flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Change:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {settings.currencySymbol}
                {changeDue.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Transaction Ref & Notes */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 font-semibold">Ref No.</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="Auth ID"
              className="w-full bg-slate-950 text-slate-200 text-[11px] px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none mt-0.5"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-semibold">Notes</label>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Internal notes"
              className="w-full bg-slate-950 text-slate-200 text-[11px] px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none mt-0.5"
            />
          </div>
        </div>

        {/* Offline Notice Banner if offline */}
        {!isEffectiveOnline && (
          <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 flex items-center gap-2 text-[10px] text-amber-300">
            <WifiOff className="w-3 h-3 shrink-0 text-amber-400" />
            <span>Save to offline queue for later sync.</span>
          </div>
        )}

        {/* Complete Payment Button */}
        <div className="pt-1">
          <button
            id="finalize-payment-btn"
            onClick={handleCompleteSale}
            className={`w-full py-3 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition ${
              !isEffectiveOnline
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/40'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-950/40'
            }`}
          >
            {!isEffectiveOnline ? <Database className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{isEffectiveOnline ? 'COMPLETE TRANSACTION & SAVE' : 'SAVE OFFLINE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
