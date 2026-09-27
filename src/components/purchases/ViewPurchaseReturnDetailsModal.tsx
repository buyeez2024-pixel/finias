import React from 'react';
import { useErp } from '../../context/ErpContext';
import { Transaction } from '../../types/erp';
import { formatCurrency } from '../../utils/formatters';
import { printElement } from '../../utils/printHelper';
import { getDynamicInvoiceTitle, getDynamicDetailModalHeading } from '../../utils/invoiceHeadingHelper';
import {
  X,
  Printer,
  FileText,
  Package,
} from 'lucide-react';

interface ViewPurchaseReturnDetailsModalProps {
  isOpen: boolean;
  purchase: Transaction | null;
  onClose: () => void;
  onOpenReceipt?: (purchase: Transaction) => void;
}

export const ViewPurchaseReturnDetailsModal: React.FC<ViewPurchaseReturnDetailsModalProps> = ({
  isOpen,
  purchase,
  onClose,
  onOpenReceipt,
}) => {
  const { suppliers, settings, locations } = useErp();

  if (!isOpen || !purchase) return null;

  const handlePrint = () => {
    printElement('printable-purchase-return-content', `Purchase-Return-${purchase.invoiceNo}`);
  };

  const supplier = suppliers.find((s) => s.id === purchase.supplierId);
  const location = locations.find((l) => l.id === purchase.locationId);
  const paymentStatus = purchase.paymentStatus || 'due';

  const paymentEntries = purchase.paymentEntries && purchase.paymentEntries.length > 0
    ? purchase.paymentEntries
    : [];

  const subtotalBeforeTax = purchase.subtotal || purchase.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {getDynamicDetailModalHeading(purchase, 'Credit Note Details')} <span className="text-rose-400 font-mono">(Credit Note No: #{purchase.invoiceNo})</span>
              </h2>
              <p className="text-xs text-slate-400">Comprehensive summary of returned purchase items, refund payments, and supplier metadata</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-300 font-mono">
              Date: <span className="text-white font-bold">{purchase.date}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div id="printable-purchase-return-content" className="p-6 space-y-6 flex-1 text-xs text-slate-200">
          {/* Document Heading Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="text-xl font-black uppercase tracking-wider text-rose-400">
              {getDynamicInvoiceTitle(purchase, 'CREDIT NOTE')}
            </div>
            <div className="text-xs font-mono text-slate-400">
              Credit Note No: <span className="text-white font-bold">#{purchase.invoiceNo}</span>
            </div>
          </div>
          {/* Top Meta Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Supplier:</div>
              <div className="font-bold text-white text-sm">{supplier?.name || purchase.supplierName || 'Supplier'}</div>
              <div className="text-slate-400">Mobile: {supplier?.mobile || '--'}</div>
              <div className="text-slate-400">Address: {supplier?.address || '--'}</div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Business:</div>
              <div className="font-bold text-white text-sm">{supplier?.businessName || settings.storeName || 'Store Business'}</div>
              <div className="text-slate-400">Branch Location: {location?.name || 'Main Location'}</div>
              <div className="text-slate-400 font-mono">Tax / GST: {settings.taxNumber || '37BRGPR4647Q1ZT'}</div>
            </div>

            <div className="space-y-1 md:text-right">
              <div className="text-slate-400">Debit Note No: <span className="font-mono font-bold text-white">#{purchase.invoiceNo}</span></div>
              <div className="text-slate-400">Date: <span className="text-white">{purchase.date}</span></div>
              <div className="text-slate-400 flex items-center md:justify-end gap-1.5">
                <span>Return Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800">
                  {purchase.status || 'Received'}
                </span>
              </div>
              <div className="text-slate-400 flex items-center md:justify-end gap-1.5">
                <span>Payment Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  paymentStatus === 'partial' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Returned Purchase Items</h3>
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-rose-600 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 w-10">#</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Return Quantity</th>
                    <th className="py-3 px-3 text-right">Unit Cost (Before Tax)</th>
                    <th className="py-3 px-3 text-right">Subtotal (Before Tax)</th>
                    <th className="py-3 px-3 text-right">Tax</th>
                    <th className="py-3 px-3 text-right">Unit Cost Price (After Tax)</th>
                    <th className="py-3 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {purchase.items.map((item, idx) => {
                    const unitCostBeforeTax = item.unitPrice;
                    const subtotalBeforeTaxItem = item.quantity * unitCostBeforeTax;
                    const taxAmt = (subtotalBeforeTaxItem * (item.taxRate || 0)) / 100;
                    const unitCostAfterTax = unitCostBeforeTax * (1 + (item.taxRate || 0) / 100);

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-white">{item.productName}</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{item.sku || '---'}</td>
                        <td className="py-3 px-3 font-mono">{item.quantity.toFixed(2)} Pieces</td>
                        <td className="py-3 px-3 text-right font-mono">{formatCurrency(unitCostBeforeTax, settings)}</td>
                        <td className="py-3 px-3 text-right font-mono">{formatCurrency(subtotalBeforeTaxItem, settings)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">{formatCurrency(taxAmt, settings)}</td>
                        <td className="py-3 px-3 text-right font-mono">{formatCurrency(unitCostAfterTax, settings)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">{formatCurrency(item.total, settings)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Info Table & Calculation Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Info Table */}
            <div className="lg:col-span-2 space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Refund Payment Info:</h3>
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-rose-600 text-white font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3 w-10">#</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Reference No</th>
                      <th className="py-3 px-3 text-right">Amount</th>
                      <th className="py-3 px-3">Payment mode</th>
                      <th className="py-3 px-3">Payment note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {paymentEntries.length > 0 ? (
                      paymentEntries.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-900/40 transition">
                          <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono text-slate-300">{p.date}</td>
                          <td className="py-3 px-3 font-mono text-rose-300">{p.referenceNo || purchase.invoiceNo}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">{formatCurrency(p.amount, settings)}</td>
                          <td className="py-3 px-3 uppercase">{p.method || 'cash'}</td>
                          <td className="py-3 px-3 italic text-slate-400">{p.note || '--'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500 italic">No refund payments recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-1 border-b border-slate-800">Financial Summary</h3>
              <div className="flex justify-between text-slate-300">
                <span>Net Total Amount:</span>
                <span className="font-mono font-semibold">{formatCurrency(subtotalBeforeTax, settings)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Discount:</span>
                <span className="font-mono text-amber-400">(-) {formatCurrency(purchase.discountAmount || 0, settings)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Return Tax:</span>
                <span className="font-mono text-blue-400">(+) {formatCurrency(purchase.taxAmount || 0, settings)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-sm">
                <span>Return Total:</span>
                <span className="font-mono text-rose-400">{formatCurrency(purchase.totalAmount, settings)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Total Refunded:</span>
                <span className="font-mono">{formatCurrency(purchase.paidAmount, settings)}</span>
              </div>
              <div className="flex justify-between text-rose-400 font-bold">
                <span>Total Due:</span>
                <span className="font-mono">{formatCurrency(Math.max(0, purchase.totalAmount - purchase.paidAmount), settings)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Additional Notes:</div>
            <div className="text-slate-300 italic">{purchase.notes || '--'}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between sticky bottom-0 z-20">
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Debit Note</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
