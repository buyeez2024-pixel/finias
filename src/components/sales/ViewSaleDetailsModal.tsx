import React from 'react';
import { useErp } from '../../context/ErpContext';
import { Transaction } from '../../types/erp';
import { formatCurrency } from '../../utils/formatters';
import { getDynamicDetailModalHeading } from '../../utils/invoiceHeadingHelper';
import {
  X,
  Printer,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  Package,
  User,
  MapPin,
  Truck,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

interface ViewSaleDetailsModalProps {
  isOpen: boolean;
  sale: Transaction | null;
  onClose: () => void;
  onOpenReceipt: (sale: Transaction) => void;
}

export const ViewSaleDetailsModal: React.FC<ViewSaleDetailsModalProps> = ({
  isOpen,
  sale,
  onClose,
  onOpenReceipt,
}) => {
  const { customers, settings, locations } = useErp();

  if (!isOpen || !sale) return null;

  const customer = customers.find((c) => c.id === sale.customerId);
  const location = locations.find((l) => l.id === sale.locationId);
  const due = Math.max(0, sale.totalAmount - sale.paidAmount);

  const paymentEntries = sale.paymentEntries && sale.paymentEntries.length > 0
    ? sale.paymentEntries
    : [
        {
          id: 'def-' + sale.id,
          date: sale.date,
          referenceNo: sale.invoiceNo,
          amount: sale.paidAmount,
          method: 'cash',
          note: sale.notes || '--',
        },
      ];

  const handlePrintPackingSlip = () => {
    onOpenReceipt(sale);
  };

  const handleSendWhatsAppInvoice = () => {
    const custName = customer?.name || 'Valued Customer';
    const cleanPhone = (customer?.phone || '').replace(/[^0-9]/g, '');
    const textMsg = `Hello *${custName}* 👋\n\nThank you for your business with *${settings.name || 'Royal POS ERP'}*!\n\n📄 *Invoice Details:*\n• Invoice No: *#${sale.invoiceNo}*\n• Date: ${sale.date}\n• Total Amount: *${formatCurrency(sale.totalAmount, settings.currencySymbol)}*\n• Paid Amount: *${formatCurrency(sale.paidAmount, settings.currencySymbol)}*\n• Balance Due: *${formatCurrency(due, settings.currencySymbol)}*\n• Status: *${sale.status.toUpperCase()}*\n\n📍 *Store Location:* ${location?.name || settings.name || 'Main Branch'}\n📞 ${location?.mobile || settings.phone || ''}\n\nHave a wonderful day! ✨`;
    const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

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
                {getDynamicDetailModalHeading(sale, 'Sell Details')} <span className="text-indigo-400 font-mono">( Invoice No. : #{sale.invoiceNo} )</span>
              </h2>
              <p className="text-xs text-slate-400">Comprehensive summary of invoice items, payments, and activity audit logs</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-300 font-mono">
              Date: <span className="text-white font-bold">{sale.date}</span>
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
        <div className="p-6 space-y-6 flex-1 text-xs text-slate-200">
          {/* Top Meta Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <div className="text-slate-400">Invoice No.: <span className="font-mono font-bold text-white">#{sale.invoiceNo}</span></div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <span>Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {sale.status || 'Final'}
                </span>
              </div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <span>Payment Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  sale.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  sale.paymentStatus === 'partial' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {sale.paymentStatus}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Customer:</div>
              <div className="font-bold text-white text-sm">{customer?.name || sale.customerName || 'Walk-In Customer'}</div>
              <div className="text-slate-400">Address: {customer?.address || 'Walk-in-customer address'}</div>
              <div className="text-slate-400">Location: {location?.name || 'Main Location'}</div>
            </div>

            <div className="space-y-1 md:text-right">
              <div className="text-slate-400">Shipping Details: <span className="text-white">{sale.shippingDetails || '--'}</span></div>
              <div className="text-slate-400">Shipping Address: <span className="text-white">{sale.shippingAddress || '--'}</span></div>
              <div className="text-slate-400">Delivery Status: <span className="text-indigo-300 uppercase font-bold">{sale.shippingStatus || 'Ordered'}</span></div>
            </div>
          </div>

          {/* Products Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Products Ordered</h3>
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-emerald-600 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 w-12">#</th>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3 text-center">Quantity</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right">Discount</th>
                    <th className="py-3 px-3 text-right">Tax</th>
                    <th className="py-3 px-3 text-right">Price inc. tax</th>
                    <th className="py-3 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {sale.items.map((item, idx) => {
                    const priceIncTax = item.unitPrice * (1 + (item.taxRate || 0) / 100);
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-white">
                          <div>{item.productName}</div>
                          {item.sku && <span className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</span>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {item.quantity.toFixed(2)} {item.unit || 'Pc(s)'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.unitPrice, settings)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {formatCurrency(item.discount || 0, settings)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {formatCurrency((item.unitPrice * (item.taxRate || 0)) / 100, settings)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-200">
                          {formatCurrency(priceIncTax, settings)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(item.total, settings)}
                        </td>
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
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Payment Info</h3>
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-emerald-600 text-white font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3 w-12">#</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Reference No</th>
                      <th className="py-3 px-3 text-right">Amount</th>
                      <th className="py-3 px-3">Payment mode</th>
                      <th className="py-3 px-3">Payment note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {paymentEntries.map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">{p.date}</td>
                        <td className="py-3 px-3 font-mono font-bold text-indigo-300">{p.referenceNo || sale.invoiceNo}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(p.amount, settings)}
                        </td>
                        <td className="py-3 px-3 uppercase font-medium text-slate-300">
                          {(p.method || 'cash').replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3 text-slate-400 italic">{p.note || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-1 border-b border-slate-800">Financial Breakdown</h3>
              <div className="flex justify-between text-slate-300">
                <span>Total:</span>
                <span className="font-mono font-semibold">{formatCurrency(sale.subtotal, settings)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Discount:</span>
                <span className="font-mono text-amber-400">(-) {formatCurrency(sale.discountAmount || 0, settings)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Order Tax:</span>
                <span className="font-mono text-blue-400">(+) {formatCurrency(sale.taxAmount || 0, settings)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Shipping:</span>
                <span className="font-mono text-slate-300">(+) {formatCurrency(sale.shippingCharges || 0, settings)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Round Off:</span>
                <span className="font-mono text-slate-400">₹0.00</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-sm">
                <span>Total Payable:</span>
                <span className="font-mono text-indigo-400">{formatCurrency(sale.totalAmount, settings)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Total paid:</span>
                <span className="font-mono">{formatCurrency(sale.paidAmount, settings)}</span>
              </div>
              <div className="flex justify-between text-rose-400 font-bold pb-1 border-b border-slate-800">
                <span>Total remaining:</span>
                <span className="font-mono">{formatCurrency(due, settings)}</span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sell note:</div>
              <div className="text-slate-300 italic">{sale.notes || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Staff note:</div>
              <div className="text-slate-300 italic">{sale.deliveredTo ? `Delivered to: ${sale.deliveredTo}` : '—'}</div>
            </div>
          </div>

          {/* Activities Audit Log */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Activities Audit Log</h3>
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">By</th>
                    <th className="py-3 px-4">Note / Meta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  <tr className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-400">{sale.date}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400 uppercase text-[10px]">Added</td>
                    <td className="py-3 px-4 font-medium text-slate-300">{sale.cashierName || 'Mr Syed Khajanoor'}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-bold uppercase">Status: Final</span>
                        <span className="px-1.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded font-bold font-mono">Total: {formatCurrency(sale.totalAmount, settings)}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                          sale.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          sale.paymentStatus === 'partial' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>Payment: {sale.paymentStatus}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between sticky bottom-0 z-20">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSendWhatsAppInvoice}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
              title="Open WhatsApp Web / Mobile with encoded invoice details"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </button>
            <button
              onClick={handlePrintPackingSlip}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition"
            >
              <Package className="w-4 h-4" />
              <span>Packing Slip</span>
            </button>
            <button
              onClick={() => onOpenReceipt(sale)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
          </div>
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
