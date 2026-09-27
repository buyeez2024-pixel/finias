const fs = require('fs');
const content = `
import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  Calendar,
  Building,
  Search,
  Filter,
  DollarSign,
  ArrowDownUp,
  Download,
  CreditCard,
  Banknote,
  Landmark,
  Wallet
} from 'lucide-react';
import { PaymentMethod } from '../../types/erp';

export const PurchasePaymentReportView: React.FC = () => {
  const { transactions, suppliers, locations } = useErp();

  // Date Filters
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return now.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all payment entries from purchases
  const paymentEntries = useMemo(() => {
    const entries: any[] = [];
    
    transactions.forEach(tx => {
      if (tx.type === 'purchase' && tx.paymentEntries && tx.paymentEntries.length > 0) {
        tx.paymentEntries.forEach(payment => {
          entries.push({
            ...payment,
            transactionId: tx.id,
            purchaseNo: tx.invoiceNo,
            supplierId: tx.supplierId,
            locationId: tx.locationId,
          });
        });
      }
    });
    
    return entries;
  }, [transactions]);

  // Apply filters
  const filteredPayments = useMemo(() => {
    return paymentEntries.filter(entry => {
      // Date filter
      if (entry.date < startDate || entry.date > endDate) {
        return false;
      }
      
      // Supplier filter
      if (selectedSupplierId !== 'all' && entry.supplierId !== selectedSupplierId) {
        return false;
      }

      // Location filter
      if (selectedLocationId !== 'all' && entry.locationId !== selectedLocationId) {
        return false;
      }
      
      // Payment Method filter
      if (selectedPaymentMethod !== 'all' && entry.method !== selectedPaymentMethod) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const refNoMatch = entry.referenceNo?.toLowerCase().includes(query) || false;
        const purchaseNoMatch = entry.purchaseNo?.toLowerCase().includes(query) || false;
        
        const supplier = suppliers.find(s => s.id === entry.supplierId);
        const supplierMatch = supplier?.name.toLowerCase().includes(query) || false;

        if (!refNoMatch && !purchaseNoMatch && !supplierMatch) {
          return false;
        }
      }

      return true;
    });
  }, [paymentEntries, startDate, endDate, selectedSupplierId, selectedLocationId, selectedPaymentMethod, searchQuery, suppliers]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((sum, entry) => sum + entry.amount, 0);
  }, [filteredPayments]);

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4 text-emerald-400" />;
      case 'card': return <CreditCard className="w-4 h-4 text-blue-400" />;
      case 'bank_transfer': return <Landmark className="w-4 h-4 text-indigo-400" />;
      default: return <Wallet className="w-4 h-4 text-slate-400" />;
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    return method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const exportToCSV = () => {
    const headers = ['Reference No', 'Paid On', 'Amount', 'Supplier', 'Payment Method', 'Purchase No'];
    const rows = filteredPayments.map(entry => {
      const supplier = suppliers.find(s => s.id === entry.supplierId);
      return [
        \`"\${entry.referenceNo || '-'}"\`,
        \`"\${entry.date}"\`,
        entry.amount,
        \`"\${supplier?.name || 'Unknown'}"\`,
        \`"\${getMethodLabel(entry.method)}"\`,
        \`"\${entry.purchaseNo}"\`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`purchase_payment_report_\${new Date().getTime()}.csv\`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            Purchase Payment Report
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            View and manage all payments made to suppliers for purchases
          </p>
        </div>
        
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700 font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Date Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 text-white text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-slate-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 text-white text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Supplier</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-4 w-4 text-slate-500" />
              </div>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full bg-slate-950 text-white text-sm pl-10 pr-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none appearance-none"
              >
                <option value="all">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Location</label>
            <div className="relative">
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full bg-slate-950 text-white text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none appearance-none"
              >
                <option value="all">All Locations</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Payment Method</label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 text-white text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none appearance-none"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Ref No, Purchase No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 text-white text-sm pl-10 pr-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Reference No
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Purchase No
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((entry, index) => {
                  const supplier = suppliers.find(s => s.id === entry.supplierId);
                  
                  return (
                    <tr key={entry.id || index} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 text-sm text-slate-300">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-medium text-emerald-400">
                          {entry.referenceNo || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-medium text-indigo-400">
                          {entry.purchaseNo}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0 font-bold text-xs uppercase">
                            {supplier?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-200">
                              {supplier?.name || 'Unknown Supplier'}
                            </div>
                            {supplier?.company && (
                              <div className="text-xs text-slate-500">
                                {supplier.company}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getMethodIcon(entry.method)}
                          <span className="text-sm text-slate-300">
                            {getMethodLabel(entry.method)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-sm font-bold text-white">
                          ${entry.amount.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <DollarSign className="w-12 h-12 text-slate-700 mb-3" />
                      <p className="text-slate-400 font-medium">No purchase payments found</p>
                      <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-800/30 border-t border-slate-800">
              <tr>
                <td colSpan={5} className="py-4 px-6 text-right text-sm font-medium text-slate-400">
                  Total Payments:
                </td>
                <td className="py-4 px-6 text-right text-lg font-bold text-emerald-400">
                  ${totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
`
fs.writeFileSync('src/components/reports/PurchasePaymentReportView.tsx', content);
