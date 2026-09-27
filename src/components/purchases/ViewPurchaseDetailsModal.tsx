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

interface ViewPurchaseDetailsModalProps {
  isOpen: boolean;
  purchase: Transaction | null;
  onClose: () => void;
  onOpenReceipt?: (purchase: Transaction) => void;
}

export const ViewPurchaseDetailsModal: React.FC<ViewPurchaseDetailsModalProps> = ({
  isOpen,
  purchase,
  onClose,
  onOpenReceipt,
}) => {
  const { suppliers, settings, locations } = useErp();

  if (!isOpen || !purchase) return null;

  const handlePrint = () => {
    printElement('printable-purchase-details-content', `Purchase-Order-${purchase.invoiceNo}`);
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
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {getDynamicDetailModalHeading(purchase, 'Purchase Details')} <span className="text-indigo-400 font-mono">(Reference No: #{purchase.invoiceNo})</span>
              </h2>
              <p className="text-xs text-slate-400">Comprehensive summary of purchase order items, payments, and supplier metadata</p>
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
        <div id="printable-purchase-details-content" className="p-6 space-y-6 flex-1 text-xs text-slate-200">
          {/* Document Heading Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="text-xl font-black uppercase tracking-wider text-emerald-400">
              {getDynamicInvoiceTitle(purchase, 'PURCHASE INVOICE')}
            </div>
            <div className="text-xs font-mono text-slate-400">
              Ref: <span className="text-white font-bold">#{purchase.invoiceNo}</span>
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
              <div className="text-slate-400">Reference No: <span className="font-mono font-bold text-white">#{purchase.invoiceNo}</span></div>
              <div className="text-slate-400">Date: <span className="text-white">{purchase.date}</span></div>
              <div className="text-slate-400 flex items-center md:justify-end gap-1.5">
                <span>Purchase Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  purchase.status === 'received' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
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

          {/* Products Table matching reference pur_view.png */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Purchase Items</h3>
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-emerald-600 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 w-10">#</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Purchase Quantity</th>
                    <th className="py-3 px-3 text-right">Unit Cost (Before Discount)</th>
                    <th className="py-3 px-3 text-right">Discount Percent</th>
                    <th className="py-3 px-3 text-right">Unit Cost (Before Tax)</th>
                    <th className="py-3 px-3 text-right">Subtotal (Before Tax)</th>
                    <th className="py-3 px-3 text-right">Tax</th>
                    <th className="py-3 px-3 text-right">Unit Cost Price (After Tax)</th>
                    <th className="py-3 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {purchase.items.map((item, idx) => {
                    const unitCostBeforeDisc = item.unitPrice / (1 - (item.discount || 0) / 100);
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
                        <td className="py-3 px-3 text-right font-mono">{formatCurrency(unitCostBeforeDisc || item.unitPrice, settings)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">{(item.discount || 0).toFixed(2)} %</td>
                        <td className="py-3 px-3 text-right font-mono">{formatCurrency(unitCostBeforeTax, settings)}</td>
                        <td className="py-3 px-3 text-right font-mono">{formatCurrency(subtotalBeforeTaxItem, settings)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">{formatCurrency(taxAmt, settings)}</td>
                        <td className="py-3 px-3 text-right font-mono">{formatCurrency(unitCostAfterTax, settings)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(item.total, settings)}</td>
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
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Payment info:</h3>
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-emerald-600 text-white font-bold uppercase text-[10px] tracking-wider">
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
                          <td className="py-3 px-3 font-mono text-indigo-300">{p.referenceNo || purchase.invoiceNo}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(p.amount, settings)}</td>
                          <td className="py-3 px-3 uppercase">{p.method || 'cash'}</td>
                          <td className="py-3 px-3 italic text-slate-400">{p.note || '--'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500 italic">No payments found</td>
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
                <span>Purchase Tax:</span>
                <span className="font-mono text-blue-400">(+) {formatCurrency(purchase.taxAmount || 0, settings)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Additional Shipping charges:</span>
                <span className="font-mono text-slate-300">(+) {formatCurrency(purchase.shippingCharges || 0, settings)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-sm">
                <span>Purchase Total:</span>
                <span className="font-mono text-indigo-400">{formatCurrency(purchase.totalAmount, settings)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Total Paid:</span>
                <span className="font-mono">{formatCurrency(purchase.paidAmount, settings)}</span>
              </div>
              <div className="flex justify-between text-rose-400 font-bold">
                <span>Total Due:</span>
                <span className="font-mono">{formatCurrency(Math.max(0, purchase.totalAmount - purchase.paidAmount), settings)}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shipping Details:</div>
              <div className="text-slate-300 italic">{purchase.shippingDetails || '--'}</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Additional Notes:</div>
              <div className="text-slate-300 italic">{purchase.notes || '--'}</div>
            </div>
          </div>

          {/* Activities Audit Log */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Activities:</h3>
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">Date:</span>
                  <span className="font-mono font-semibold text-white">{purchase.date} 18:29</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">Action:</span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold uppercase">Added</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">By:</span>
                  <span className="font-medium text-white">{purchase.cashierName || 'Mr Syed Khajanoor'}</span>
                </div>
              </div>

              <div className="space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs min-w-[200px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">{purchase.status || 'Received'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total:</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(purchase.totalAmount, settings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>{paymentStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between sticky bottom-0 z-20">
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
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
