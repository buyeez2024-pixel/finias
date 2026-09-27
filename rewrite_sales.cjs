const fs = require('fs');
let content = fs.readFileSync('src/components/sales/SalesView.tsx', 'utf8');

// 1. Add locations to useErp extraction
const useErpMatch = 'const { transactions, customers, settings, setActiveTab, offlineQueue } = useErp();';
const newUseErpMatch = 'const { transactions, customers, settings, setActiveTab, offlineQueue, locations } = useErp();';
if (content.includes(useErpMatch)) {
    content = content.replace(useErpMatch, newUseErpMatch);
}

// 2. Modify icons imported
const iconImports = `  Clock,
  WifiOff,
  CloudCheck,
} from 'lucide-react';`;
const newIconImports = `  Clock,
  WifiOff,
  CloudCheck,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  Banknote,
  Landmark,
} from 'lucide-react';`;
if (content.includes(iconImports)) {
    content = content.replace(iconImports, newIconImports);
}

// 3. Update the table headers
const oldThead = `<thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3 px-3">Invoice No.</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Items Sold</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">Tax</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-center">Cloud Sync</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>`;

const newThead = `<thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Reference No</th>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 text-center">Payment Status</th>
                <th className="py-3 px-3 text-center">Payment Method</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3 text-right">Total Paid</th>
                <th className="py-3 px-3 text-right">Sell Due</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>`;

if (content.includes(oldThead)) {
    content = content.replace(oldThead, newThead);
}

// 4. Update the tbody content
const oldTbody = `<tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredSales.map((sale) => {
                const customer = customers.find((c) => c.id === sale.customerId);
                const due = Math.max(0, sale.totalAmount - sale.paidAmount);
                const isItemOffline = sale.isOffline || sale.syncStatus === 'pending';

                return (
                  <tr key={sale.id} className="hover:bg-slate-850 transition">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{sale.invoiceNo}</span>
                        {isItemOffline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Offline Queue" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{sale.date}</td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {customer?.name || 'Walk-In Customer'}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {sale.items.map((i, idx) => (
                        <div key={idx} className="text-slate-400">
                          {i.productName} ({i.quantity}x @ {settings.currencySymbol}{i.unitPrice.toFixed(2)})
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {settings.currencySymbol}{sale.subtotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {settings.currencySymbol}{sale.taxAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-400 text-sm">
                      {settings.currencySymbol}{sale.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase \${
                          sale.status === 'final'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }\`}
                      >
                        {sale.status === 'draft' ? 'Quotation' : sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase \${
                          sale.paymentStatus === 'paid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : sale.paymentStatus === 'partial'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }\`}
                      >
                        {sale.paymentStatus} {due > 0 ? \`(\${settings.currencySymbol}\${due.toFixed(0)} due)\` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isItemOffline ? (
                        <button
                          onClick={() => setShowOfflineModal(true)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1 hover:bg-amber-500/30 transition cursor-pointer"
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>Local Queue</span>
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Synced</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onOpenReceipt(sale)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-auto"
                        title="Print POS Slip"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Print Slip</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>`;

const newTbody = `<tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredSales.map((sale) => {
                const customer = customers.find((c) => c.id === sale.customerId);
                const location = locations?.find((l) => l.id === sale.locationId);
                const due = Math.max(0, sale.totalAmount - sale.paidAmount);
                const isItemOffline = sale.isOffline || sale.syncStatus === 'pending';
                
                // Get primary payment method if available
                let paymentMethodStr = 'N/A';
                if (sale.paymentEntries && sale.paymentEntries.length > 0) {
                  const methods = sale.paymentEntries.map(p => p.method);
                  paymentMethodStr = [...new Set(methods)].map(m => m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')).join(', ');
                }

                return (
                  <tr key={sale.id} className="hover:bg-slate-850 transition">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{sale.date}</td>
                    <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{sale.invoiceNo}</span>
                        {isItemOffline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Offline Queue" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {customer?.name || 'Walk-In Customer'}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {location?.name || 'Main Location'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase \${
                          sale.paymentStatus === 'paid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : sale.paymentStatus === 'partial'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }\`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-300 text-xs">
                        {paymentMethodStr.toLowerCase().includes('cash') && <Banknote className="w-3.5 h-3.5 text-emerald-400" />}
                        {paymentMethodStr.toLowerCase().includes('card') && <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                        {paymentMethodStr.toLowerCase().includes('bank') && <Landmark className="w-3.5 h-3.5 text-indigo-400" />}
                        <span>{paymentMethodStr}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                      {settings.currencySymbol}{sale.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {settings.currencySymbol}{sale.paidAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                      {settings.currencySymbol}{due.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenReceipt(sale)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          title="View Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenReceipt(sale)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition"
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>`;

if (content.includes(oldTbody)) {
    content = content.replace(oldTbody, newTbody);
}

fs.writeFileSync('src/components/sales/SalesView.tsx', content);
console.log("Rewrite complete.");
