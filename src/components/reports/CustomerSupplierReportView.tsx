import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { formatCurrency, formatDate, normalizeDateToYMD } from '../../utils/formatters';
import { ExportButtons } from '../common/ExportButtons';
import {
  Users,
  Building,
  Phone,
  Mail,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  BookOpen,
  DollarSign,
  TrendingUp,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Percent,
  Columns,
  ChevronDown,
  ChevronUp,
  Eye,
  ShieldCheck,
} from 'lucide-react';

export const CustomerSupplierReportView: React.FC = () => {
  const {
    customers,
    suppliers,
    transactions,
    customerGroups,
    settings,
    openCustomerLedger,
    openSupplierLedger,
  } = useErp();

  const isLight = settings?.themeMode === 'light';

  // Column Visibility State
  const [showColumnVisibility, setShowColumnVisibility] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    contact: true,
    contactId: true,
    type: true,
    group: true,
    totalPurchase: true,
    purchaseReturn: true,
    totalSale: true,
    sellReturn: true,
    openingBal: true,
    advanceBal: true,
    dueAmount: true,
    action: true,
  });

  const CONTACT_COLUMN_DEFINITIONS = [
    { key: 'contact', label: 'Contact', description: 'Customer or supplier name & phone', locked: true },
    { key: 'contactId', label: 'Contact ID', description: 'Unique identification code', locked: false },
    { key: 'type', label: 'Type', description: 'Customer or supplier classification', locked: false },
    { key: 'group', label: 'Group', description: 'Assigned customer/supplier group', locked: false },
    { key: 'totalPurchase', label: 'Total Purchase', description: 'Total purchases made', locked: false },
    { key: 'purchaseReturn', label: 'Purchase Return', description: 'Returned purchase amount', locked: false },
    { key: 'totalSale', label: 'Total Sale', description: 'Total sales made', locked: false },
    { key: 'sellReturn', label: 'Sell Return', description: 'Returned sales amount', locked: false },
    { key: 'openingBal', label: 'Opening Bal', description: 'Initial account balance', locked: false },
    { key: 'advanceBal', label: 'Advance Bal', description: 'Advance deposit balance', locked: false },
    { key: 'dueAmount', label: 'Due Amount', description: 'Outstanding pending balance', locked: false },
    { key: 'action', label: 'Action', description: 'Quick ledger and report actions', locked: false },
  ];

  const handleColumnPreset = (type: 'all' | 'standard' | 'compact' | 'reset') => {
    if (type === 'all' || type === 'reset') {
      setVisibleColumns({ contact: true, contactId: true, type: true, group: true, totalPurchase: true, purchaseReturn: true, totalSale: true, sellReturn: true, openingBal: true, advanceBal: true, dueAmount: true, action: true });
    } else if (type === 'standard') {
      setVisibleColumns({ contact: true, contactId: false, type: true, group: true, totalPurchase: true, purchaseReturn: false, totalSale: true, sellReturn: false, openingBal: false, advanceBal: false, dueAmount: true, action: true });
    } else if (type === 'compact') {
      setVisibleColumns({ contact: true, contactId: false, type: true, group: false, totalPurchase: false, purchaseReturn: false, totalSale: true, sellReturn: false, openingBal: false, advanceBal: false, dueAmount: true, action: true });
    }
  };

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
  const [contactTypeFilter, setContactTypeFilter] = useState<'all' | 'customer' | 'supplier'>('all');
  const [customerGroupFilter, setCustomerGroupFilter] = useState<string>('all');
  const [dueFilter, setDueFilter] = useState<'all' | 'has_due' | 'zero_due'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, contactTypeFilter, customerGroupFilter, dueFilter, searchQuery]);

  // Selected Contact for quick transactions detail modal
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<'sales' | 'purchases' | 'payments' | 'returns'>('sales');

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
    } else if (preset === 'Yesterday') {
      const past = new Date();
      past.setDate(today.getDate() - 1);
      setStartDate(format(past));
      setEndDate(format(past));
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
    } else if (preset === 'Current Financial Year') {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      let fyStartYear = currentYear;
      if (currentMonth < 3) {
        fyStartYear = currentYear - 1;
      }
      const start = new Date(fyStartYear, 3, 1);
      const end = new Date(fyStartYear + 1, 2, 31);
      setStartDate(format(start));
      setEndDate(format(end));
    } else if (preset === 'Last Financial Year') {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      let fyStartYear = currentYear;
      if (currentMonth < 3) {
        fyStartYear = currentYear - 1;
      }
      const start = new Date(fyStartYear - 1, 3, 1);
      const end = new Date(fyStartYear, 2, 31);
      setStartDate(format(start));
      setEndDate(format(end));
    } else if (preset === 'All Time') {
      setStartDate('2020-01-01');
      setEndDate(format(today));
    }
  };

  // Contacts Aggregation and Calculations
  const reportData = useMemo(() => {
    const filteredTxns = transactions.filter((t) => {
      const transDateStr = normalizeDateToYMD(t.date);
      return (!startDate || transDateStr >= startDate) && (!endDate || transDateStr <= endDate);
    });

    const contactList: any[] = [];

    // Process Customers
    customers.forEach((cust) => {
      const custSales = filteredTxns.filter(
        (t) => (t.type === 'sale' || t.type === 'pos') && t.status !== 'draft' && t.status !== 'quotation' && t.customerId === cust.id
      );
      const custReturns = filteredTxns.filter(
        (t) => (t.type === 'sale_return' || t.type === 'sell_return') && t.customerId === cust.id
      );

      const totalSale = custSales.reduce((sum, t) => sum + (t.totalAmount || t.subtotal || 0), 0);
      const totalSalePaid = custSales.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
      const totalSaleDue = custSales.reduce((sum, t) => sum + (t.dueAmount || 0), 0);
      const totalSaleReturn = custReturns.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

      // Customer due is receivable
      const dueAmount = cust.totalDue !== undefined ? cust.totalDue : totalSaleDue;

      contactList.push({
        uniqueKey: `customer_${cust.id}`,
        id: cust.id,
        name: cust.name,
        businessName: cust.businessName || '',
        email: cust.email || '',
        phone: cust.phone || cust.alternatePhone || '',
        taxNumber: cust.taxNumber || cust.gstin || '',
        customerGroup: cust.customerGroup || '',
        customerGroupId: cust.customerGroupId || '',
        type: 'customer' as const,
        openingBalance: cust.openingBalance || 0,
        advanceBalance: cust.advanceBalance || 0,
        creditLimit: cust.creditLimit || 0,
        totalPurchase: 0,
        totalPurchaseReturn: 0,
        totalPurchasePaid: 0,
        totalPurchaseDue: 0,
        totalSale,
        totalSaleReturn,
        totalSellReturn: totalSaleReturn,
        totalSalePaid,
        totalSaleDue,
        salesCount: custSales.length,
        purchasesCount: 0,
        dueAmount,
        netBalance: dueAmount, // positive = receivable
        rawCustomer: cust,
        rawSupplier: null,
      });
    });

    // Process Suppliers
    suppliers.forEach((supp) => {
      const suppPurchases = filteredTxns.filter(
        (t) => t.type === 'purchase' && t.supplierId === supp.id
      );
      const suppReturns = filteredTxns.filter(
        (t) => t.type === 'purchase_return' && t.supplierId === supp.id
      );

      const totalPurchase = suppPurchases.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const totalPurchasePaid = suppPurchases.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
      const totalPurchaseDue = suppPurchases.reduce((sum, t) => sum + (t.dueAmount || 0), 0);
      const totalPurchaseReturn = suppReturns.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

      // Supplier payable is negative in net balance terms
      const dueAmount = supp.totalPayable !== undefined ? supp.totalPayable : totalPurchaseDue;

      contactList.push({
        uniqueKey: `supplier_${supp.id}`,
        id: supp.id,
        name: supp.name,
        businessName: supp.businessName || '',
        email: supp.email || '',
        phone: supp.phone || supp.alternatePhone || '',
        taxNumber: supp.taxNumber || supp.gstin || '',
        customerGroup: '',
        customerGroupId: '',
        type: 'supplier' as const,
        openingBalance: supp.openingBalance || 0,
        advanceBalance: supp.advanceBalance || 0,
        creditLimit: 0,
        totalPurchase,
        totalPurchaseReturn,
        totalPurchasePaid,
        totalPurchaseDue,
        totalSale: 0,
        totalSaleReturn: 0,
        totalSellReturn: 0,
        totalSalePaid: 0,
        totalSaleDue: 0,
        salesCount: 0,
        purchasesCount: suppPurchases.length,
        dueAmount,
        netBalance: -dueAmount, // negative = payable
        rawCustomer: null,
        rawSupplier: supp,
      });
    });

    return contactList;
  }, [customers, suppliers, transactions, startDate, endDate]);

  // Filtered contacts based on UI search and filter criteria
  const filteredContacts = useMemo(() => {
    return reportData.filter((c) => {
      // Contact Type Filter
      if (contactTypeFilter !== 'all' && c.type !== contactTypeFilter) {
        return false;
      }

      // Customer Group Filter
      if (customerGroupFilter !== 'all') {
        if (c.type !== 'customer') return false;
        if (c.customerGroupId !== customerGroupFilter && c.customerGroup !== customerGroupFilter) {
          return false;
        }
      }

      // Due Filter
      if (dueFilter === 'has_due' && Math.abs(c.dueAmount) <= 0.01) {
        return false;
      }
      if (dueFilter === 'zero_due' && Math.abs(c.dueAmount) > 0.01) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesBusiness = c.businessName.toLowerCase().includes(q);
        const matchesPhone = c.phone.toLowerCase().includes(q);
        const matchesId = c.id.toLowerCase().includes(q);
        const matchesTax = c.taxNumber.toLowerCase().includes(q);
        if (!matchesName && !matchesBusiness && !matchesPhone && !matchesId && !matchesTax) {
          return false;
        }
      }

      return true;
    });
  }, [reportData, contactTypeFilter, customerGroupFilter, dueFilter, searchQuery]);

  const totalPages = Math.ceil(filteredContacts.length / rowsPerPage) || 1;
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredContacts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredContacts, currentPage, rowsPerPage]);

  // Summary Metrics across filtered contacts
  const summaryMetrics = useMemo(() => {
    const totalPurchase = filteredContacts.reduce((sum, c) => sum + c.totalPurchase, 0);
    const totalPurchaseReturn = filteredContacts.reduce((sum, c) => sum + c.totalPurchaseReturn, 0);
    const totalPurchaseDue = filteredContacts.reduce((sum, c) => sum + (c.type === 'supplier' ? c.dueAmount : c.totalPurchaseDue), 0);

    const totalSale = filteredContacts.reduce((sum, c) => sum + (c.totalSale || 0), 0);
    const totalSaleReturn = filteredContacts.reduce((sum, c) => sum + (c.totalSaleReturn || 0), 0);
    const totalSellReturn = totalSaleReturn;
    const totalSaleDue = filteredContacts.reduce((sum, c) => sum + (c.type === 'customer' ? c.dueAmount : (c.totalSaleDue || 0)), 0);

    const totalOpeningBalance = filteredContacts.reduce((sum, c) => sum + c.openingBalance, 0);
    const totalAdvanceBalance = filteredContacts.reduce((sum, c) => sum + c.advanceBalance, 0);

    const netReceivables = totalSaleDue;
    const netPayables = totalPurchaseDue;
    const netDuePosition = netReceivables - netPayables;

    const totalSalesCount = filteredContacts.reduce((sum, c) => sum + c.salesCount, 0);
    const totalPurchasesCount = filteredContacts.reduce((sum, c) => sum + c.purchasesCount, 0);

    return {
      totalPurchase,
      totalPurchaseReturn,
      totalPurchaseDue,
      totalSale,
      totalSaleReturn,
      totalSellReturn,
      totalSaleDue,
      totalOpeningBalance,
      totalAdvanceBalance,
      netReceivables,
      netPayables,
      netDuePosition,
      totalSalesCount,
      totalPurchasesCount,
      totalCount: filteredContacts.length,
      customerCount: filteredContacts.filter((c) => c.type === 'customer').length,
      supplierCount: filteredContacts.filter((c) => c.type === 'supplier').length,
    };
  }, [filteredContacts]);

  // Export to CSV
  const exportToCsv = () => {
    const headers = [
      'Contact Name',
      'Business Name',
      'Contact ID',
      'Type',
      'Customer Group',
      'Phone / Mobile',
      'Tax / GST No',
      'Total Purchase',
      'Total Purchase Return',
      'Total Sale',
      'Total Sell Return',
      'Opening Balance',
      'Advance Balance',
      'Due Balance',
    ];

    const rows = filteredContacts.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.businessName || '').replace(/"/g, '""')}"`,
      `"${c.id}"`,
      `"${c.type.toUpperCase()}"`,
      `"${(c.customerGroup || '-').replace(/"/g, '""')}"`,
      `"${(c.phone || '-').replace(/"/g, '""')}"`,
      `"${(c.taxNumber || '-').replace(/"/g, '""')}"`,
      c.totalPurchase.toFixed(2),
      c.totalPurchaseReturn.toFixed(2),
      c.totalSale.toFixed(2),
      c.totalSaleReturn.toFixed(2),
      c.openingBalance.toFixed(2),
      c.advanceBalance.toFixed(2),
      c.dueAmount.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_supplier_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get transactions for selected contact modal
  const contactTransactions = useMemo(() => {
    if (!selectedContact) return { sales: [], purchases: [], returns: [], payments: [] };

    const contactId = selectedContact.id;
    const isCust = selectedContact.type === 'customer';

    const sales = transactions.filter(
      (t) => (t.type === 'sale' || t.type === 'pos') && t.customerId === contactId
    );
    const purchases = transactions.filter(
      (t) => t.type === 'purchase' && t.supplierId === contactId
    );
    const returns = transactions.filter(
      (t) =>
        (isCust && t.type === 'sale_return' && t.customerId === contactId) ||
        (!isCust && t.type === 'purchase_return' && t.supplierId === contactId)
    );

    // Payments recorded in transactions
    const payments: any[] = [];
    sales.forEach((s) => {
      if (s.paidAmount > 0) {
        payments.push({
          date: s.date,
          referenceNo: s.invoiceNo,
          type: 'Customer Sale Payment',
          amount: s.paidAmount,
          method: s.paymentMethod || 'Cash',
          status: 'Completed',
        });
      }
    });
    purchases.forEach((p) => {
      if (p.paidAmount > 0) {
        payments.push({
          date: p.date,
          referenceNo: p.invoiceNo || p.id,
          type: 'Supplier Purchase Payment',
          amount: p.paidAmount,
          method: p.paymentMethod || 'Bank Transfer',
          status: 'Completed',
        });
      }
    });

    return { sales, purchases, returns, payments };
  }, [selectedContact, transactions]);

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-7xl mx-auto" id="customer-supplier-report-view">
      {/* Top Header & Export Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <span>Customer & Supplier Report</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile purchases, sales, returns, opening balances, and outstanding dues across all business contacts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <ExportButtons
            headers={[
              'Contact Name',
              'Business Name',
              'Contact ID',
              'Type',
              'Customer Group',
              'Phone / Mobile',
              'Tax / GST No',
              'Total Purchase',
              'Total Purchase Return',
              'Total Sale',
              'Total Sell Return',
              'Opening Balance',
              'Advance Balance',
              'Due Balance',
            ]}
            keys={[
              'name',
              'businessName',
              'id',
              'type',
              'customerGroup',
              'phone',
              'taxNumber',
              'totalPurchase',
              'totalPurchaseReturn',
              'totalSale',
              'totalSaleReturn',
              'openingBalance',
              'advanceBalance',
              'dueAmount',
            ]}
            data={filteredContacts}
            filename="customer_supplier_report"
            title="Customer & Supplier Report"
            isLight={isLight}
          />

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>



      {/* Summary KPI Cards Grid (finias POS Contacts Summary 8-Card Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Purchase */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Purchase</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-purple-400 block tracking-tight">
              {formatCurrency(summaryMetrics.totalPurchase, settings)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {summaryMetrics.totalPurchasesCount} purchase orders in period
            </span>
          </div>
        </div>

        {/* Total Purchase Return */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Purchase Return</span>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-rose-400 block tracking-tight">
              {formatCurrency(summaryMetrics.totalPurchaseReturn, settings)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Returned to suppliers</span>
          </div>
        </div>

        {/* Total Purchase Due (Payables) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase Due (Payable)</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-amber-400 block tracking-tight">
              {formatCurrency(summaryMetrics.totalPurchaseDue, settings)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Total owed to suppliers</span>
          </div>
        </div>

        {/* Total Sale */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sale</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-emerald-400 block tracking-tight">
              {formatCurrency(summaryMetrics.totalSale, settings)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {summaryMetrics.totalSalesCount} customer invoices in period
            </span>
          </div>
        </div>

        {/* Total Sell Return */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sell Return</span>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-rose-400 block tracking-tight">
              {formatCurrency(summaryMetrics.totalSellReturn, settings)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Returns from customers</span>
          </div>
        </div>

        {/* Total Sale Due (Receivables) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sale Due (Receivable)</span>
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-cyan-400 block tracking-tight">
              {formatCurrency(summaryMetrics.totalSaleDue, settings)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Total owed by customers</span>
          </div>
        </div>

        {/* Opening Balance Due */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opening Balance Due</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-indigo-400 block tracking-tight">
              {formatCurrency(summaryMetrics.totalOpeningBalance, settings)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Starting balance positions</span>
          </div>
        </div>

        {/* Net Due Position */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Position</span>
            <div className={`p-2 rounded-xl ${summaryMetrics.netDuePosition >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-black font-mono block tracking-tight ${summaryMetrics.netDuePosition >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(Math.abs(summaryMetrics.netDuePosition), settings)}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${summaryMetrics.netDuePosition >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {summaryMetrics.netDuePosition >= 0 ? 'Net Receivable from Customers' : 'Net Payable to Suppliers'}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Section (finias POS Standard) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
        {/* Preset Date Range Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-white font-semibold text-xs">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Date Range & Contact Filters</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              'Today',
              'Yesterday',
              'Last 7 Days',
              'Last 30 Days',
              'This Month',
              'Last Month',
              'Current Financial Year',
              'Last Financial Year',
              'All Time',
            ].map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  datePreset === preset
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-1">
          {/* Contact Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Contact Type
            </label>
            <select
              value={contactTypeFilter}
              onChange={(e) => setContactTypeFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="all">All Contacts (Customers & Suppliers)</option>
              <option value="customer">Customers Only</option>
              <option value="supplier">Suppliers Only</option>
            </select>
          </div>

          {/* Customer Group Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Customer Group
            </label>
            <select
              value={customerGroupFilter}
              onChange={(e) => setCustomerGroupFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="all">All Customer Groups</option>
              {customerGroups.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Due Balance Status
            </label>
            <select
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="all">All (With or Without Due)</option>
              <option value="has_due">Has Outstanding Due Only</option>
              <option value="zero_due">Fully Settled (Zero Due)</option>
            </select>
          </div>

          {/* Custom Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('Custom');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Custom End Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('Custom');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        {/* Table Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search contact name, business, phone, ID, tax no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              Showing <span className="text-indigo-400 font-bold">{filteredContacts.length}</span> of{' '}
              {reportData.length} contacts
            </span>
          </div>
        </div>

        {/* Column Visibility Section (Reference Screenshot Style) */}
        <div className={`border-b ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800 bg-slate-950/80'}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 ${showColumnVisibility ? (isLight ? 'border-b border-slate-200' : 'border-b border-slate-800') : ''}`}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
                <Columns className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <span>Column Visibility</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {Object.values(visibleColumns).filter(Boolean).length} of {CONTACT_COLUMN_DEFINITIONS.length} Visible
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 hidden sm:inline-flex">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Admin Privileges</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                  Select which columns to display in the Customer & Supplier Report table.
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
              {showColumnVisibility && (
                <div className="flex items-center gap-1.5 mr-2">
                  <button
                    type="button"
                    onClick={() => handleColumnPreset('all')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleColumnPreset('standard')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleColumnPreset('compact')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer hidden sm:inline-block"
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    onClick={() => handleColumnPreset('reset')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-950/50 text-rose-400 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                    title="Reset to default columns"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setShowColumnVisibility(!showColumnVisibility)}
                className={
                  isLight
                    ? 'relative transition active:scale-95 active:opacity-80 cursor-pointer px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-indigo-100/20 rounded-xl text-xs font-bold flex items-center gap-1.5'
                    : showColumnVisibility
                    ? 'px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                    : 'px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }
              >
                {showColumnVisibility ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Hide Fields</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Show Fields</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showColumnVisibility && (
            <div className={`border-t p-4 ${isLight ? 'border-slate-200 bg-white/50' : 'border-slate-800/50 bg-slate-900/50'}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {CONTACT_COLUMN_DEFINITIONS.map((col) => {
                  const isVisible = visibleColumns[col.key as keyof typeof visibleColumns];
                  const isLocked = col.locked;

                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => {
                        if (!isLocked) {
                          setVisibleColumns(prev => ({ ...prev, [col.key]: !isVisible }));
                        }
                      }}
                      disabled={isLocked}
                      className={`flex flex-col items-start justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isVisible
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/20'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-800/40'
                      } ${isLocked ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <div className={`p-1 rounded-md ${
                          isVisible ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isVisible ? <CheckCircle2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </div>
                        {isLocked ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-0.5">
                            Locked
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-slate-500">
                            {isVisible ? 'Visible' : 'Hidden'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white truncate w-full">{col.label}</span>
                      <span className="text-[10px] text-slate-400 truncate w-full mt-0.5">{col.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar-thin overscroll-x-contain">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                {visibleColumns.contact && <th className="py-3.5 px-4">Contact</th>}
                {visibleColumns.contactId && <th className="py-3.5 px-3">Contact ID</th>}
                {visibleColumns.type && <th className="py-3.5 px-3">Type</th>}
                {visibleColumns.group && <th className="py-3.5 px-3">Group</th>}
                {visibleColumns.totalPurchase && <th className="py-3.5 px-3 text-right">Total Purchase</th>}
                {visibleColumns.purchaseReturn && <th className="py-3.5 px-3 text-right">Purchase Return</th>}
                {visibleColumns.totalSale && <th className="py-3.5 px-3 text-right">Total Sale</th>}
                {visibleColumns.sellReturn && <th className="py-3.5 px-3 text-right">Sell Return</th>}
                {visibleColumns.openingBal && <th className="py-3.5 px-3 text-right">Opening Bal</th>}
                {visibleColumns.advanceBal && <th className="py-3.5 px-3 text-right">Advance Bal</th>}
                {visibleColumns.dueAmount && <th className="py-3.5 px-4 text-right">Due Amount</th>}
                {visibleColumns.action && <th className="py-3.5 px-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-slate-300">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length || 1} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-50" />
                    <p className="text-sm font-medium">No customer or supplier contacts match the filter criteria</p>
                    <p className="text-xs text-slate-600 mt-1">Try broadening your date range or adjusting contact filters</p>
                  </td>
                </tr>
              ) : (
                paginatedContacts.map((contact) => {
                  const isCustomer = contact.type === 'customer';
                  const isSupplier = contact.type === 'supplier';
                  const hasDue = contact.dueAmount > 0.01;

                  return (
                    <tr
                      key={contact.uniqueKey}
                      className="hover:bg-slate-850/50 transition group"
                    >
                      {/* Contact Info */}
                      {visibleColumns.contact && (
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setSelectedContact(contact)}
                            className="text-left group-hover:text-indigo-300 transition"
                          >
                            <span className="font-bold text-white block text-xs hover:underline">
                              {contact.name}
                            </span>
                            {contact.businessName && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-sans">
                                <Building className="w-3 h-3 text-slate-500" />
                                {contact.businessName}
                              </span>
                            )}
                            {contact.phone && (
                              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-600" />
                                {contact.phone}
                              </span>
                            )}
                          </button>
                        </td>
                      )}

                      {/* Contact ID */}
                      {visibleColumns.contactId && (
                        <td className="py-3.5 px-3 font-mono text-slate-400 font-bold text-[11px]">
                          {contact.id}
                        </td>
                      )}

                      {/* Type Badge */}
                      {visibleColumns.type && (
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                              isCustomer
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            }`}
                          >
                            {contact.type}
                          </span>
                        </td>
                      )}

                      {/* Group */}
                      {visibleColumns.group && (
                        <td className="py-3.5 px-3 text-slate-400 text-xs">
                          {contact.customerGroup ? (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-medium">
                              {contact.customerGroup}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      )}

                      {/* Total Purchase */}
                      {visibleColumns.totalPurchase && (
                        <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                          {contact.totalPurchase > 0 ? (
                            <span className="font-semibold text-purple-300">
                              {formatCurrency(contact.totalPurchase, settings)}
                            </span>
                          ) : (
                            <span className="text-slate-600">{formatCurrency(0, settings)}</span>
                          )}
                        </td>
                      )}

                      {/* Purchase Return */}
                      {visibleColumns.purchaseReturn && (
                        <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                          {contact.totalPurchaseReturn > 0 ? (
                            <span className="text-rose-400/90">
                              {formatCurrency(contact.totalPurchaseReturn, settings)}
                            </span>
                          ) : (
                            <span className="text-slate-600">{formatCurrency(0, settings)}</span>
                          )}
                        </td>
                      )}

                      {/* Total Sale */}
                      {visibleColumns.totalSale && (
                        <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                          {contact.totalSale > 0 ? (
                            <span className="font-semibold text-emerald-300">
                              {formatCurrency(contact.totalSale, settings)}
                            </span>
                          ) : (
                            <span className="text-slate-600">{formatCurrency(0, settings)}</span>
                          )}
                        </td>
                      )}

                      {/* Sell Return */}
                      {visibleColumns.sellReturn && (
                        <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                          {contact.totalSellReturn > 0 ? (
                            <span className="text-rose-400/90">
                              {formatCurrency(contact.totalSellReturn, settings)}
                            </span>
                          ) : (
                            <span className="text-slate-600">{formatCurrency(0, settings)}</span>
                          )}
                        </td>
                      )}

                      {/* Opening Balance */}
                      {visibleColumns.openingBal && (
                        <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                          {contact.openingBalance > 0 ? (
                            <span>
                              {formatCurrency(contact.openingBalance, settings)}
                            </span>
                          ) : (
                            <span className="text-slate-600">{formatCurrency(0, settings)}</span>
                          )}
                        </td>
                      )}

                      {/* Advance Balance */}
                      {visibleColumns.advanceBal && (
                        <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                          {contact.advanceBalance > 0 ? (
                            <span className="text-indigo-400 font-semibold">
                              {formatCurrency(contact.advanceBalance, settings)}
                            </span>
                          ) : (
                            <span className="text-slate-600">{formatCurrency(0, settings)}</span>
                          )}
                        </td>
                      )}

                      {/* Due Amount */}
                      {visibleColumns.dueAmount && (
                        <td className="py-3.5 px-4 text-right font-mono font-bold">
                          {contact.dueAmount > 0.01 ? (
                            <span className={isCustomer ? 'text-amber-400' : 'text-rose-400'}>
                              {formatCurrency(contact.dueAmount, settings)}
                              <span className="text-[9px] font-sans font-medium block opacity-75">
                                {isCustomer ? '(Receivable)' : '(Payable)'}
                              </span>
                            </span>
                          ) : (
                            <span className="text-emerald-400/80 font-normal">
                              {formatCurrency(0, settings)} <span className="text-[9px] font-sans block text-slate-500">(Settled)</span>
                            </span>
                          )}
                        </td>
                      )}

                      {/* Action */}
                      {visibleColumns.action && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedContact(contact)}
                              className={`p-1.5 rounded-lg border transition ${
                                isLight
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                  : 'p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-indigo-600 border-transparent'
                              }`}
                              title="Quick View Details"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (isCustomer) {
                                  openCustomerLedger(contact.id);
                                } else {
                                  openSupplierLedger(contact.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg border transition ${
                                isLight
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                  : 'p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-emerald-600 border-transparent'
                              }`}
                              title="Open Full Contact Ledger"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredContacts.length > 0 && (
              <tfoot className="bg-slate-950 font-bold text-slate-200 border-t-2 border-slate-800 text-xs font-mono">
                <tr>
                  <td colSpan={4} className="py-3.5 px-4 uppercase text-[11px] text-slate-400 font-sans tracking-wide">
                    Total Summary ({filteredContacts.length} Contacts)
                  </td>
                  <td className="py-3.5 px-3 text-right text-purple-400">
                    {formatCurrency(summaryMetrics.totalPurchase, settings)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-rose-400">
                    {formatCurrency(summaryMetrics.totalPurchaseReturn, settings)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-emerald-400">
                    {formatCurrency(summaryMetrics.totalSale, settings)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-rose-400">
                    {formatCurrency(summaryMetrics.totalSellReturn, settings)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-slate-300">
                    {formatCurrency(summaryMetrics.totalOpeningBalance, settings)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-indigo-400">
                    {formatCurrency(summaryMetrics.totalAdvanceBalance, settings)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-white">
                    {formatCurrency(summaryMetrics.totalSaleDue + summaryMetrics.totalPurchaseDue, settings)}
                  </td>
                  <td className="py-3.5 px-4 text-center text-[10px] text-slate-500 font-sans">
                    Summary
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 text-xs text-slate-400 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {[5, 10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="ml-2">
              Showing {filteredContacts.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
              {Math.min(currentPage * rowsPerPage, filteredContacts.length)} of {filteredContacts.length} contacts
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  currentPage === page
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Quick Contact Details Modal (finias POS standard popup) */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" id="contact-details-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${selectedContact.type === 'customer' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-base tracking-wide">
                      {selectedContact.name}
                    </h3>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                      selectedContact.type === 'customer'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}>
                      {selectedContact.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                    <span>ID: <strong className="font-mono text-slate-300">{selectedContact.id}</strong></span>
                    {selectedContact.phone && (
                      <span>Phone: <strong className="font-mono text-slate-300">{selectedContact.phone}</strong></span>
                    )}
                    {selectedContact.email && (
                      <span>Email: <strong className="text-slate-300">{selectedContact.email}</strong></span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = selectedContact.id;
                    const isCust = selectedContact.type === 'customer';
                    setSelectedContact(null);
                    if (isCust) {
                      openCustomerLedger(id);
                    } else {
                      openSupplierLedger(id);
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Full Ledger</span>
                </button>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-slate-400 hover:text-white bg-slate-800/60 hover:bg-rose-500/10 hover:text-rose-400 p-2 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Financial Snapshot Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Invoiced / Purchased</span>
                  <span className="text-sm font-mono font-bold text-white block">
                    {formatCurrency(selectedContact.totalSale + selectedContact.totalPurchase, settings)}
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Paid</span>
                  <span className="text-sm font-mono font-bold text-emerald-400 block">
                    {formatCurrency(selectedContact.totalSalePaid + selectedContact.totalPurchasePaid, settings)}
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Opening Balance</span>
                  <span className="text-sm font-mono font-bold text-slate-300 block">
                    {formatCurrency(selectedContact.openingBalance, settings)}
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Due</span>
                  <span className={`text-sm font-mono font-black block ${selectedContact.dueAmount > 0.01 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {formatCurrency(selectedContact.dueAmount, settings)}
                  </span>
                </div>
              </div>

              {/* Detail Tabs */}
              <div>
                <div className="flex border-b border-slate-800 gap-2 mb-4">
                  {selectedContact.type === 'customer' ? (
                    <>
                      <button
                        onClick={() => setModalTab('sales')}
                        className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                          modalTab === 'sales'
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Sales Invoices ({contactTransactions.sales.length})</span>
                      </button>
                      <button
                        onClick={() => setModalTab('returns')}
                        className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                          modalTab === 'returns'
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Sale Returns ({contactTransactions.returns.length})</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setModalTab('purchases')}
                        className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                          modalTab === 'purchases'
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Purchase Bills ({contactTransactions.purchases.length})</span>
                      </button>
                      <button
                        onClick={() => setModalTab('returns')}
                        className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                          modalTab === 'returns'
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Purchase Returns ({contactTransactions.returns.length})</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setModalTab('payments')}
                    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                      modalTab === 'payments'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Payment History ({contactTransactions.payments.length})</span>
                  </button>
                </div>

                {/* Tab 1: Sales Table */}
                {modalTab === 'sales' && (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-850 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Invoice No</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Payment</th>
                          <th className="py-2.5 px-3 text-right">Total</th>
                          <th className="py-2.5 px-3 text-right">Paid</th>
                          <th className="py-2.5 px-3 text-right">Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60 font-mono text-slate-300">
                        {contactTransactions.sales.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-500 font-sans">
                              No sales transactions recorded for this customer
                            </td>
                          </tr>
                        ) : (
                          contactTransactions.sales.map((txn, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40 transition">
                              <td className="py-2.5 px-3 font-bold text-indigo-400">{txn.invoiceNo}</td>
                              <td className="py-2.5 px-3 text-slate-400">{txn.date.substring(0, 16)}</td>
                              <td className="py-2.5 px-3 font-sans">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                                  {txn.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-sans">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  txn.paymentStatus === 'paid'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : txn.paymentStatus === 'partial'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  {txn.paymentStatus || 'Unpaid'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-white font-bold">
                                {formatCurrency(txn.totalAmount || 0, settings)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-emerald-400">
                                {formatCurrency(txn.paidAmount || 0, settings)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-amber-400 font-bold">
                                {formatCurrency(txn.dueAmount || 0, settings)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 2: Purchases Table */}
                {modalTab === 'purchases' && (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-850 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Reference / Order No</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Payment</th>
                          <th className="py-2.5 px-3 text-right">Total</th>
                          <th className="py-2.5 px-3 text-right">Paid</th>
                          <th className="py-2.5 px-3 text-right">Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60 font-mono text-slate-300">
                        {contactTransactions.purchases.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-500 font-sans">
                              No purchase records found for this supplier
                            </td>
                          </tr>
                        ) : (
                          contactTransactions.purchases.map((txn, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40 transition">
                              <td className="py-2.5 px-3 font-bold text-purple-400">{txn.invoiceNo || txn.id}</td>
                              <td className="py-2.5 px-3 text-slate-400">{txn.date.substring(0, 16)}</td>
                              <td className="py-2.5 px-3 font-sans">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                                  {txn.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-sans">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  txn.paymentStatus === 'paid'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : txn.paymentStatus === 'partial'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  {txn.paymentStatus || 'Unpaid'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-white font-bold">
                                {formatCurrency(txn.totalAmount || 0, settings)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-emerald-400">
                                {formatCurrency(txn.paidAmount || 0, settings)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-rose-400 font-bold">
                                {formatCurrency(txn.dueAmount || 0, settings)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 3: Returns Table */}
                {modalTab === 'returns' && (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-850 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Return Ref</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3 text-right">Total Returned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60 font-mono text-slate-300">
                        {contactTransactions.returns.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-slate-500 font-sans">
                              No return transactions recorded
                            </td>
                          </tr>
                        ) : (
                          contactTransactions.returns.map((txn, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40 transition">
                              <td className="py-2.5 px-3 font-bold text-rose-400">{txn.invoiceNo || txn.id}</td>
                              <td className="py-2.5 px-3 text-slate-400">{txn.date.substring(0, 16)}</td>
                              <td className="py-2.5 px-3 font-sans capitalize text-slate-300">{txn.type.replace('_', ' ')}</td>
                              <td className="py-2.5 px-3 text-right text-rose-400 font-bold">
                                {formatCurrency(txn.totalAmount || 0, settings)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 4: Payments Table */}
                {modalTab === 'payments' && (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-850 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Reference No</th>
                          <th className="py-2.5 px-3">Payment Category</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60 font-mono text-slate-300">
                        {contactTransactions.payments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                              No payment transactions recorded
                            </td>
                          </tr>
                        ) : (
                          contactTransactions.payments.map((pay, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40 transition">
                              <td className="py-2.5 px-3 text-slate-400">{pay.date.substring(0, 16)}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-200">{pay.referenceNo}</td>
                              <td className="py-2.5 px-3 font-sans text-slate-300">{pay.type}</td>
                              <td className="py-2.5 px-3 font-sans">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold">
                                  {pay.method}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                                {formatCurrency(pay.amount || 0, settings)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-850 flex justify-end gap-3">
              <button
                onClick={() => setSelectedContact(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
