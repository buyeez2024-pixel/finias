import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { formatCurrency } from '../../utils/formatters';
import {
  Calendar,
  Users,
  Search,
  Filter,
  DollarSign,
  ArrowDownUp,
  Download,
  Printer,
  FileText,
  UserCheck,
  TrendingUp,
  Receipt,
  Building,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export const SalesRepresentativeReportView: React.FC = () => {
  const { transactions, users, salesCommissionAgents, locations, expenses, settings, currentLocation } = useErp();

  // Date Filters
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [datePreset, setDatePreset] = useState('This Month');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'sales' | 'commission' | 'expenses' | 'payments'>('sales');
  const [searchQuery, setSearchQuery] = useState('');

  const [salesPage, setSalesPage] = useState(1);
  const [salesRows, setSalesRows] = useState(10);
  const [commissionPage, setCommissionPage] = useState(1);
  const [commissionRows, setCommissionRows] = useState(10);
  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesRows, setExpensesRows] = useState(10);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsRows, setPaymentsRows] = useState(10);

  React.useEffect(() => {
    setSalesPage(1);
    setCommissionPage(1);
    setExpensesPage(1);
    setPaymentsPage(1);
  }, [startDate, endDate, selectedLocationId, selectedAgentId, searchQuery, activeTab]);

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const format = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'Today') {
      setStartDate(format(today));
      setEndDate(format(today));
    } else if (preset === 'Last 7 Days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(format(past));
      setEndDate(format(today));
    } else if (preset === 'Last 30 Days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(format(past));
      setEndDate(format(today));
    } else if (preset === 'This Month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(format(start));
      setEndDate(format(today));
    } else if (preset === 'Last Month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(format(start));
      setEndDate(format(end));
    } else if (preset === 'All Time') {
      setStartDate('2020-01-01');
      setEndDate(format(today));
    }
  };

  // Compile list of available agents / representatives for filter
  const allRepresentatives = useMemo(() => {
    const list: { id: string; name: string; type: string }[] = [];
    users.forEach(u => {
      list.push({ id: u.id, name: `${u.name} (User)`, type: 'user' });
    });
    salesCommissionAgents.forEach(a => {
      list.push({ id: a.id, name: `${a.firstName} ${a.lastName} (Agent)`, type: 'agent' });
    });
    return list;
  }, [users, salesCommissionAgents]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (tx.type !== 'sale') return false;

      // Date check
      const txDate = (tx.date || '').slice(0, 10);
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;

      // Location check
      if (selectedLocationId !== 'all' && tx.locationId !== selectedLocationId) return false;

      // Agent check
      if (selectedAgentId !== 'all' && tx.commissionAgentId !== selectedAgentId) return false;

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInvoice = tx.invoiceNo.toLowerCase().includes(q);
        const matchesCustomer = tx.customerName?.toLowerCase().includes(q) || false;
        const matchesAgent = tx.commissionAgentName?.toLowerCase().includes(q) || false;
        if (!matchesInvoice && !matchesCustomer && !matchesAgent) return false;
      }

      return true;
    });
  }, [transactions, startDate, endDate, selectedLocationId, selectedAgentId, searchQuery]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const expDate = (exp.date || '').slice(0, 10);
      if (startDate && expDate < startDate) return false;
      if (endDate && expDate > endDate) return false;
      if (selectedLocationId !== 'all' && exp.locationId !== selectedLocationId) return false;
      return true;
    });
  }, [expenses, startDate, endDate, selectedLocationId]);

  // Calculate KPIs
  const totalSalesAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + tx.totalAmount, 0);
  }, [filteredTransactions]);

  const totalCommissionAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + (tx.commissionAmount || 0), 0);
  }, [filteredTransactions]);

  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  }, [filteredExpenses]);

  const netBalance = totalSalesAmount - totalExpenseAmount;

  // Payments extraction
  const paymentEntries = useMemo(() => {
    const list: any[] = [];
    filteredTransactions.forEach(tx => {
      if (tx.paymentEntries && tx.paymentEntries.length > 0) {
        tx.paymentEntries.forEach(entry => {
          list.push({
            ...entry,
            invoiceNo: tx.invoiceNo,
            customerName: tx.customerName || 'Walk-In',
            date: entry.date || tx.date,
            commissionAgentName: tx.commissionAgentName || 'Unassigned'
          });
        });
      }
    });
    return list;
  }, [filteredTransactions]);

  const totalSalesPages = Math.ceil(filteredTransactions.length / salesRows) || 1;
  const paginatedSales = useMemo(() => {
    return filteredTransactions.slice((salesPage - 1) * salesRows, salesPage * salesRows);
  }, [filteredTransactions, salesPage, salesRows]);

  const commissionTransactions = useMemo(() => {
    return filteredTransactions.filter(tx => (tx.commissionAmount || 0) > 0);
  }, [filteredTransactions]);

  const totalCommissionPages = Math.ceil(commissionTransactions.length / commissionRows) || 1;
  const paginatedCommission = useMemo(() => {
    return commissionTransactions.slice((commissionPage - 1) * commissionRows, commissionPage * commissionRows);
  }, [commissionTransactions, commissionPage, commissionRows]);

  const totalExpensesPages = Math.ceil(filteredExpenses.length / expensesRows) || 1;
  const paginatedExpenses = useMemo(() => {
    return filteredExpenses.slice((expensesPage - 1) * expensesRows, expensesPage * expensesRows);
  }, [filteredExpenses, expensesPage, expensesRows]);

  const totalPaymentsPages = Math.ceil(paymentEntries.length / paymentsRows) || 1;
  const paginatedPayments = useMemo(() => {
    return paymentEntries.slice((paymentsPage - 1) * paymentsRows, paymentsPage * paymentsRows);
  }, [paymentEntries, paymentsPage, paymentsRows]);

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-7xl mx-auto">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Sales Representative Report</h1>
            <p className="text-xs text-slate-400">Track sales performance, commissions, and activities per sales representative</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Location Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span>Business Location</span>
            </label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Sales Representative Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sales Representative</span>
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="all">All Representatives</option>
              {allRepresentatives.map((rep) => (
                <option key={rep.id} value={rep.id}>{rep.name}</option>
              ))}
            </select>
          </div>

          {/* Date Preset */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Date Range Preset</span>
            </label>
            <select
              value={datePreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Search Invoice / Customer</span>
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Date Inputs row */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sale</p>
              <h3 className="text-2xl font-black text-white font-mono mt-1">{formatCurrency(totalSalesAmount, settings)}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
            <span>{filteredTransactions.length} total invoices recorded</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sale Commission</p>
              <h3 className="text-2xl font-black text-emerald-400 font-mono mt-1">{formatCurrency(totalCommissionAmount, settings)}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Calculated commissions</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expense</p>
              <h3 className="text-2xl font-black text-amber-400 font-mono mt-1">{formatCurrency(totalExpenseAmount, settings)}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
            <span>{filteredExpenses.length} expense records</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Balance (Sale - Expense)</p>
              <h3 className={`text-2xl font-black font-mono mt-1 ${netBalance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                {formatCurrency(netBalance, settings)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Overall profitability</span>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'sales'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Sales Added ({filteredTransactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('commission')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'commission'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Sales With Commission</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Expenses ({filteredExpenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Payments ({paymentEntries.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {activeTab === 'sales' && (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Sales Representative</th>
                  <th className="py-3.5 px-4 text-center">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Total Paid</th>
                  <th className="py-3.5 px-4 text-right">Due Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {paginatedSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 italic">
                      No sales found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map(tx => {
                    const due = Math.max(0, tx.totalAmount - tx.paidAmount);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 text-slate-300 font-mono">{tx.date}</td>
                        <td className="py-3.5 px-4 font-bold text-indigo-400 font-mono">{tx.invoiceNo}</td>
                        <td className="py-3.5 px-4 font-semibold">{tx.customerName || 'Walk-In'}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-300">{tx.commissionAgentName || 'Unassigned'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tx.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                            tx.paymentStatus === 'partial' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                            'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {tx.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold">{formatCurrency(tx.totalAmount, settings)}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-400">{formatCurrency(tx.paidAmount, settings)}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-rose-400">{formatCurrency(due, settings)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Sales */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 text-[11px] text-slate-400 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={salesRows}
                onChange={(e) => {
                  setSalesRows(Number(e.target.value));
                  setSalesPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500"
              >
                {[5, 10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="ml-2">
                Showing {filteredTransactions.length > 0 ? (salesPage - 1) * salesRows + 1 : 0} to{' '}
                {Math.min(salesPage * salesRows, filteredTransactions.length)} of {filteredTransactions.length} entries
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSalesPage((prev) => Math.max(prev - 1, 1))}
                disabled={salesPage === 1}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
              >
                Previous
              </button>
              {Array.from({ length: totalSalesPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setSalesPage(page)}
                  className={`px-2.5 py-1 rounded border transition ${
                    salesPage === page
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setSalesPage((prev) => Math.min(prev + 1, totalSalesPages))}
                disabled={salesPage === totalSalesPages}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
              >
                Next
              </button>
            </div>
          </div>
          </>
        )}

        {activeTab === 'commission' && (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Sales Representative</th>
                  <th className="py-3.5 px-4 text-right">Invoice Total</th>
                  <th className="py-3.5 px-4 text-center">Commission %</th>
                  <th className="py-3.5 px-4 text-right">Commission Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {paginatedCommission.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                      No commissioned sales found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedCommission.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 text-slate-300 font-mono">{tx.date}</td>
                        <td className="py-3.5 px-4 font-bold text-indigo-400 font-mono">{tx.invoiceNo}</td>
                        <td className="py-3.5 px-4 font-semibold">{tx.customerName || 'Walk-In'}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-300">{tx.commissionAgentName || 'Unassigned'}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold">{formatCurrency(tx.totalAmount, settings)}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-indigo-300">{tx.commissionPercentage ?? 0}%</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(tx.commissionAmount || 0, settings)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Commissions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 text-[11px] text-slate-400 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={commissionRows}
                onChange={(e) => {
                  setCommissionRows(Number(e.target.value));
                  setCommissionPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500"
              >
                {[5, 10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="ml-2">
                Showing {commissionTransactions.length > 0 ? (commissionPage - 1) * commissionRows + 1 : 0} to{' '}
                {Math.min(commissionPage * commissionRows, commissionTransactions.length)} of {commissionTransactions.length} entries
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setCommissionPage((prev) => Math.max(prev - 1, 1))}
                disabled={commissionPage === 1}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
              >
                Previous
              </button>
              {Array.from({ length: totalCommissionPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCommissionPage(page)}
                  className={`px-2.5 py-1 rounded border transition ${
                    commissionPage === page
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCommissionPage((prev) => Math.min(prev + 1, totalCommissionPages))}
                disabled={commissionPage === totalCommissionPages}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
              >
                Next
              </button>
            </div>
          </div>
          </>
        )}

        {activeTab === 'expenses' && (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Reference No</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Paid To</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {paginatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                      No expenses found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-300 font-mono">{exp.date}</td>
                      <td className="py-3.5 px-4 font-bold text-indigo-400 font-mono">{exp.referenceNo}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">{exp.paidTo}</td>
                      <td className="py-3.5 px-4 uppercase font-mono text-[10px] text-slate-400">{exp.paymentMethod}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">{formatCurrency(exp.amount, settings)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Expenses */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 text-[11px] text-slate-400 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={expensesRows}
                onChange={(e) => {
                  setExpensesRows(Number(e.target.value));
                  setExpensesPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500"
              >
                {[5, 10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="ml-2">
                Showing {filteredExpenses.length > 0 ? (expensesPage - 1) * expensesRows + 1 : 0} to{' '}
                {Math.min(expensesPage * expensesRows, filteredExpenses.length)} of {filteredExpenses.length} entries
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setExpensesPage((prev) => Math.max(prev - 1, 1))}
                disabled={expensesPage === 1}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
              >
                Previous
              </button>
              {Array.from({ length: totalExpensesPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setExpensesPage(page)}
                  className={`px-2.5 py-1 rounded border transition ${
                    expensesPage === page
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setExpensesPage((prev) => Math.min(prev + 1, totalExpensesPages))}
                disabled={expensesPage === totalExpensesPages}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
              >
                Next
              </button>
            </div>
          </div>
          </>
        )}

        {activeTab === 'payments' && (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Sales Representative</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {paymentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                      No payment records found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  paymentEntries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-300 font-mono">{entry.date}</td>
                      <td className="py-3.5 px-4 font-bold text-indigo-400 font-mono">{entry.invoiceNo}</td>
                      <td className="py-3.5 px-4 font-semibold">{entry.customerName}</td>
                      <td className="py-3.5 px-4 text-slate-300">{entry.commissionAgentName}</td>
                      <td className="py-3.5 px-4 uppercase font-mono text-[10px] text-slate-400">{entry.method}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">{formatCurrency(entry.amount, settings)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Payments */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 text-[11px] text-slate-400 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={paymentsRows}
                onChange={(e) => {
                  setPaymentsRows(Number(e.target.value));
                  setPaymentsPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500"
              >
                {[5, 10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="ml-2">
                Showing {paymentEntries.length > 0 ? (paymentsPage - 1) * paymentsRows + 1 : 0} to{' '}
                {Math.min(paymentsPage * paymentsRows, paymentEntries.length)} of {paymentEntries.length} entries
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setPaymentsPage((prev) => Math.max(prev - 1, 1))}
                disabled={paymentsPage === 1}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
              >
                Previous
              </button>
              {Array.from({ length: totalPaymentsPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setPaymentsPage(page)}
                  className={`px-2.5 py-1 rounded border transition ${
                    paymentsPage === page
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setPaymentsPage((prev) => Math.min(prev + 1, totalPaymentsPages))}
                disabled={paymentsPage === totalPaymentsPages}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
              >
                Next
              </button>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
};
