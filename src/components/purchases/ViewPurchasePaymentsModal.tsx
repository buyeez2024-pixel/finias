import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { Transaction } from '../../types/erp';
import { formatCurrency } from '../../utils/formatters';
import { printElement } from '../../utils/printHelper';
import {
  X,
  Printer,
  Mail,
  Calendar,
  DollarSign,
  CreditCard,
  Banknote,
  Landmark,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Plus,
  Save,
  Sparkles
} from 'lucide-react';

interface ViewPurchasePaymentsModalProps {
  isOpen: boolean;
  purchase: Transaction | null;
  onClose: () => void;
  onOpenReceipt?: (purchase: Transaction) => void;
}

export const ViewPurchasePaymentsModal: React.FC<ViewPurchasePaymentsModalProps> = ({
  isOpen,
  purchase,
  onClose,
  onOpenReceipt,
}) => {
  const { suppliers, settings, updatePurchase, locations, paymentMethods } = useErp();
  const [notificationSent, setNotificationSent] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Form state for Add/Edit Payment
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [paymentAccount, setPaymentAccount] = useState('Primary Business Bank Account');
  const [paymentNote, setPaymentNote] = useState('');

  // Additional Payment Details
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [transactionNo, setTransactionNo] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardType, setCardType] = useState('Visa');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardSecurityCode, setCardSecurityCode] = useState('');
  const [cardTransactionNo, setCardTransactionNo] = useState('');

  if (!isOpen || !purchase) return null;

  const handlePrint = () => {
    printElement('printable-purchase-payments-content', `Purchase-Payments-${purchase.invoiceNo}`);
  };

  const supplier = suppliers.find((s) => s.id === purchase.supplierId);
  const location = locations.find((l) => l.id === purchase.locationId);

  // Ensure payment entries
  const paymentEntries = purchase.paymentEntries && purchase.paymentEntries.length > 0
    ? purchase.paymentEntries
    : [
        {
          id: 'default-po-entry-' + purchase.id,
          method: 'bank_transfer' as const,
          amount: purchase.paidAmount ?? purchase.totalAmount,
          date: purchase.date,
          note: purchase.notes || '',
          referenceNo: purchase.invoiceNo,
          account: 'Primary Business Bank Account',
        },
      ];

  const totalPaid = paymentEntries.reduce((sum, e) => sum + e.amount, 0);
  const dueAmount = Math.max(0, purchase.totalAmount - totalPaid);

  const handleOpenAddModal = () => {
    setEditingEntryId(null);
    setAmount(dueAmount > 0 ? dueAmount : purchase.totalAmount);
    setPaymentMethod('bank_transfer');
    setPaymentDate(new Date().toISOString().slice(0, 16));
    setPaymentAccount('Primary Business Bank Account');
    setPaymentNote('');

    // Reset details
    setBankAccountNo('');
    setChequeNo('');
    setTransactionNo('');
    setCardNumber('');
    setCardHolderName('');
    setCardType('Visa');
    setCardExpiry('');
    setCardSecurityCode('');
    setCardTransactionNo('');

    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (entry: any) => {
    setEditingEntryId(entry.id);
    setAmount(entry.amount);
    setPaymentMethod(entry.method || 'bank_transfer');
    setPaymentDate(entry.date ? entry.date.replace(' ', 'T') : new Date().toISOString().slice(0, 16));
    setPaymentAccount(entry.account || 'Primary Business Bank Account');
    setPaymentNote(entry.note || '');

    // Populate details from entry
    setBankAccountNo(entry.extraPaymentDetails?.bankAccountNo || '');
    setChequeNo(entry.extraPaymentDetails?.chequeNo || '');
    setTransactionNo(entry.extraPaymentDetails?.transactionNo || '');
    setCardNumber(entry.cardDetails?.cardNumber || '');
    setCardHolderName(entry.cardDetails?.cardHolderName || '');
    setCardType(entry.cardDetails?.cardType || 'Visa');
    setCardExpiry(entry.cardDetails?.cardExpiry || '');
    setCardSecurityCode(entry.cardDetails?.cardSecurityCode || '');
    setCardTransactionNo(entry.cardDetails?.cardTransactionNo || '');

    setIsAddEditModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();

    const extraPaymentDetails = {
      bankAccountNo: bankAccountNo || undefined,
      chequeNo: chequeNo || undefined,
      transactionNo: transactionNo || undefined,
    };

    const cardDetails = {
      cardNumber: cardNumber || undefined,
      cardHolderName: cardHolderName || undefined,
      cardType: cardType || undefined,
      cardExpiry: cardExpiry || undefined,
      cardSecurityCode: cardSecurityCode || undefined,
      cardTransactionNo: cardTransactionNo || undefined,
    };

    let updatedEntries = [...paymentEntries];

    if (editingEntryId) {
      updatedEntries = updatedEntries.map((en) =>
        en.id === editingEntryId
          ? {
              ...en,
              amount: Number(amount),
              method: paymentMethod,
              date: paymentDate.replace('T', ' '),
              account: paymentAccount,
              note: paymentNote,
              extraPaymentDetails: (bankAccountNo || chequeNo || transactionNo) ? extraPaymentDetails : undefined,
              cardDetails: (cardNumber || cardHolderName || cardTransactionNo) ? cardDetails : undefined,
            }
          : en
      );
    } else {
      const newEntry = {
        id: 'po-pay-' + Date.now(),
        amount: Number(amount),
        method: paymentMethod,
        date: paymentDate.replace('T', ' '),
        account: paymentAccount,
        note: paymentNote,
        referenceNo: purchase.invoiceNo + '-P' + (paymentEntries.length + 1),
        extraPaymentDetails: (bankAccountNo || chequeNo || transactionNo) ? extraPaymentDetails : undefined,
        cardDetails: (cardNumber || cardHolderName || cardTransactionNo) ? cardDetails : undefined,
      };
      updatedEntries.push(newEntry);
    }

    const newPaidAmount = updatedEntries.reduce((sum, en) => sum + en.amount, 0);
    const newStatus = newPaidAmount >= purchase.totalAmount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'due';

    updatePurchase(purchase.id, {
      paymentEntries: updatedEntries,
      paidAmount: newPaidAmount,
      paymentStatus: newStatus,
    });

    setIsAddEditModalOpen(false);
  };

  const handleDeletePayment = (entryId: string) => {
    const updatedEntries = paymentEntries.filter((e) => e.id !== entryId);
    const newPaidAmount = updatedEntries.reduce((sum, e) => sum + e.amount, 0);
    const newStatus = newPaidAmount >= purchase.totalAmount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'due';

    updatePurchase(purchase.id, {
      paymentEntries: updatedEntries,
      paidAmount: newPaidAmount,
      paymentStatus: newStatus,
    });
  };

  const handleSendNotification = () => {
    setNotificationSent(true);
    setTimeout(() => setNotificationSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                View Purchase Payments <span className="text-indigo-400 font-mono">( PO Invoice No.: {purchase.invoiceNo} )</span>
              </h2>
              <p className="text-xs text-slate-400">Manage vendor payments, disbursement receipts, and procurement settlements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div id="printable-purchase-payments-content" className="p-6 space-y-6 flex-1">
          {/* Notification Alert */}
          {notificationSent && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Payment disbursement notification successfully sent to vendor!</span>
            </div>
          )}

          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            {/* Supplier Info */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier:</span>
              <div className="font-bold text-white text-sm">
                {supplier?.name || 'Primary Supplier'}
              </div>
              <div className="text-slate-400">
                {supplier?.address || 'Vendor Headquarters'}
              </div>
              <div className="text-slate-400">
                Mobile: {supplier?.phone || '(555) 019-2834'}
              </div>
            </div>

            {/* Business Info / Location */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business / Location:</span>
              <div className="font-bold text-white text-sm">
                {settings.businessName || 'Awesome Shop'}
              </div>
              <div className="text-slate-400">
                Location: {location?.name || 'Main Branch'}
              </div>
              <div className="text-slate-400">
                GSTIN: {settings.taxNumber || settings.gstin || '3412569900'}
              </div>
            </div>

            {/* Purchase Meta */}
            <div className="space-y-1 md:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purchase Details:</span>
              <div className="font-bold text-white">
                PO No.: <span className="text-indigo-400 font-mono">#{purchase.invoiceNo}</span>
              </div>
              <div className="text-slate-300">
                Date: <span className="font-mono">{purchase.date}</span>
              </div>
              <div className="text-slate-300 flex items-center md:justify-end gap-1.5 mt-1">
                <span>Payment Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  purchase.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  purchase.paymentStatus === 'partial' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {purchase.paymentStatus || 'paid'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar: Notification & Add Payment */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleSendNotification}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition"
            >
              <Mail className="w-4 h-4" />
              <span>Send Payment Disbursement Notification</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Payment</span>
            </button>
          </div>

          {/* Payments Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recorded Payment Entries</h3>
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reference No</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Payment Note</th>
                    <th className="py-3 px-4">Payment Account</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {paymentEntries.map((entry, idx) => (
                    <tr key={entry.id || idx} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4 text-slate-300 font-mono whitespace-nowrap">
                        {entry.date || purchase.date}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                        {entry.referenceNo || purchase.invoiceNo}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(entry.amount, settings)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 uppercase font-medium text-slate-300">
                            {entry.method === 'cash' && <Banknote className="w-3.5 h-3.5 text-emerald-400" />}
                            {entry.method === 'card' && <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                            {entry.method === 'bank_transfer' && <Landmark className="w-3.5 h-3.5 text-indigo-400" />}
                            {(['upi', 'qr', 'phonepay'].includes(entry.method) || (entry.method && entry.method.toString().toLowerCase().includes('terminal'))) && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                            <span>{(entry.method || 'bank_transfer').replace('_', ' ')}</span>
                          </div>

                          {/* Extra Payment Details Display */}
                          {(entry.extraPaymentDetails || (idx === 0 && purchase.extraPaymentDetails)) && (
                            <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 font-mono">
                              {(entry.extraPaymentDetails?.bankAccountNo || (idx === 0 && purchase.extraPaymentDetails?.bankAccountNo)) && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400 font-bold uppercase">Bank A/C:</span>
                                  <span className="text-indigo-400">{entry.extraPaymentDetails?.bankAccountNo || purchase.extraPaymentDetails?.bankAccountNo}</span>
                                </div>
                              )}
                              {(entry.extraPaymentDetails?.chequeNo || (idx === 0 && purchase.extraPaymentDetails?.chequeNo)) && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400 font-bold uppercase">Cheque No:</span>
                                  <span className="text-indigo-400">{entry.extraPaymentDetails?.chequeNo || purchase.extraPaymentDetails?.chequeNo}</span>
                                </div>
                              )}
                              {(entry.extraPaymentDetails?.transactionNo || (idx === 0 && purchase.extraPaymentDetails?.transactionNo)) && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400 font-bold uppercase">Trans No:</span>
                                  <span className="text-amber-400">{entry.extraPaymentDetails?.transactionNo || purchase.extraPaymentDetails?.transactionNo}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Card Details Display */}
                          {(entry.cardDetails || (idx === 0 && purchase.cardDetails)) && (
                            <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 font-mono">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 font-bold uppercase">Card:</span>
                                <span className="text-blue-400">
                                  {entry.cardDetails?.cardType || purchase.cardDetails?.cardType} **** {(entry.cardDetails?.cardNumber || purchase.cardDetails?.cardNumber)?.slice(-4) || 'XXXX'}
                                </span>
                              </div>
                              {(entry.cardDetails?.cardTransactionNo || (idx === 0 && purchase.cardDetails?.cardTransactionNo)) && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400 font-bold uppercase">Auth No:</span>
                                  <span className="text-indigo-400">{entry.cardDetails?.cardTransactionNo || purchase.cardDetails?.cardTransactionNo}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 italic">
                        {entry.note || purchase.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {entry.account || 'Primary Business Bank Account'} ({settings.currency || 'USD'})
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenReceipt(purchase)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition"
                            title="View / Print Receipt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(entry)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                            title="Edit Payment"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {paymentEntries.length > 1 && (
                            <button
                              onClick={() => handleDeletePayment(entry.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-lg transition"
                              title="Delete Payment"
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
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Download Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Add / Edit Purchase Payment Modal Sub-window */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
              <h3 className="text-base font-bold text-white">
                {editingEntryId ? 'Edit Purchase Payment' : 'Add Purchase Payment'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-xs">
              {/* Info summary boxes */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Supplier:</span>
                  <span className="font-bold text-white">{supplier?.name || 'Primary Supplier'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">PO No & Branch:</span>
                  <span className="font-mono text-indigo-400 font-bold">#{purchase.invoiceNo}</span>
                  <div className="text-slate-400">{location?.name || 'Main'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Total Amount & Due:</span>
                  <span className="font-mono text-emerald-400 font-bold">{formatCurrency(purchase.totalAmount, settings)}</span>
                  <div className="text-rose-400 font-mono">Due: {formatCurrency(dueAmount, settings)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Payment Method:*</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                  >
                    {paymentMethods.filter(m => m.enabled).map(m => (
                      <option key={m.id} value={m.code}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Paid On:*</label>
                  <input
                    type="datetime-local"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Amount:*</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Payment Account:</label>
                  <select
                    value={paymentAccount}
                    onChange={(e) => setPaymentAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Primary Business Bank Account">Primary Business Bank Account</option>
                    <option value="Main Cash Drawer">Main Cash Drawer</option>
                    <option value="Petty Cash">Petty Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Attach Document:</label>
                  <input
                    type="file"
                    className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                  />
                </div>
              </div>

              {/* Dynamic Payment Fields */}
              {(paymentMethod === 'card' || paymentMethod.toString().toLowerCase().includes('pos')) && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolderName}
                      onChange={(e) => setCardHolderName(e.target.value)}
                      placeholder="J. DOE"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Transaction Number</label>
                    <input
                      type="text"
                      value={cardTransactionNo}
                      onChange={(e) => setCardTransactionNo(e.target.value)}
                      placeholder="Auth #"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Card Type</label>
                    <select
                      value={cardType}
                      onChange={(e) => setCardType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Visa">Visa</option>
                      <option value="MasterCard">MasterCard</option>
                      <option value="Amex">Amex</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Security Code (CVV)</label>
                    <input
                      type="password"
                      value={cardSecurityCode}
                      onChange={(e) => setCardSecurityCode(e.target.value)}
                      placeholder="***"
                      maxLength={4}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {(paymentMethod === 'bank_transfer' || paymentMethod.toString().toLowerCase().includes('bank')) && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Bank Account No</label>
                  <input
                    type="text"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    placeholder="Enter account number..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {(paymentMethod === 'cheque' || paymentMethod.toString().toLowerCase().includes('cheque')) && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Cheque No.</label>
                  <input
                    type="text"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    placeholder="Enter cheque number..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {(['upi', 'qr', 'phonepay'].includes(paymentMethod) || 
                paymentMethod.toString().toLowerCase().includes('terminal') ||
                (!['cash', 'card', 'bank_transfer', 'cheque', 'credit'].includes(paymentMethod) && 
                 !paymentMethod.toString().toLowerCase().includes('pos'))) && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Transaction No</label>
                  <input
                    type="text"
                    value={transactionNo}
                    onChange={(e) => setTransactionNo(e.target.value)}
                    placeholder="Enter transaction/reference ID..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">Payment Note:</label>
                <textarea
                  rows={3}
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Enter disbursement notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
