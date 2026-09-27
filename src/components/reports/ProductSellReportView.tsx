import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { Transaction, TransactionItem } from '../../types/erp';
import { getCategoryName, getBrandName, formatCurrency } from '../../utils/formatters';
import {
  TrendingUp,
  Filter,
  Search,
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  Building,
  Users,
  Boxes,
  Percent,
  DollarSign,
  Tag,
  Layers,
  ChevronDown,
  ChevronUp,
  Columns,
  RotateCcw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Package,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ShoppingBag,
  X,
  Plus,
  ArrowUpRight,
  CreditCard,
  Receipt,
  Store,
  BadgePercent
} from 'lucide-react';

interface SellLineItemRecord {
  id: string;
  transactionId: string;
  invoiceNo: string;
  date: string;
  customerId?: string;
  customerName: string;
  customerBusiness?: string;
  customerPhone?: string;
  locationId: string;
  locationName: string;
  status: 'final' | 'draft' | 'quotation' | 'ordered' | 'received' | 'pending';
  paymentStatus: 'paid' | 'partial' | 'due';
  isPos?: boolean;
  saleChannel?: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  brand: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalCost: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  totalIncTax: number;
  grossProfit: number;
  marginPercent: number;
  currentStock: number;
  alertQuantity: number;
  image?: string;
  originalTransaction: Transaction;
}

export const ProductSellReportView: React.FC = () => {
  const {
    transactions,
    products,
    customers,
    locations,
    categories,
    brands,
    settings,
    setActiveTab,
  } = useErp();

  const isLight = settings?.themeMode === 'light';

  // Active perspective sub-tabs:
  // 1. detailed: Detailed line item ledger
  // 2. with_purchase: Detailed with purchase price & gross margin
  // 3. grouped: Grouped by date & product
  // 4. by_category: Grouped by category
  // 5. by_brand: Grouped by brand
  // 6. by_customer: Grouped by customer
  const [activeSubTab, setActiveSubTab] = useState<
    'detailed' | 'with_purchase' | 'grouped' | 'by_category' | 'by_brand' | 'by_customer'
  >('detailed');

  // Filters State
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedSaleType, setSelectedSaleType] = useState<string>('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // Date Range state
  const [datePreset, setDatePreset] = useState('All Time');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Table Controls
  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Column Visibility Controls for Detailed Ledger
  const [showColSettings, setShowColSettings] = useState(false);
  const [colVisibility, setColVisibility] = useState({
    action: true,
    product: true,
    sku: true,
    customer: true,
    invoiceNo: true,
    date: true,
    quantity: true,
    unitPrice: true,
    discount: true,
    tax: true,
    subtotal: true,
    paymentStatus: true,
    currentStock: true,
  });

  // Modal State for Invoice Details
  const [selectedSale, setSelectedSale] = useState<Transaction | null>(null);

  // Handle Preset Date Filter
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
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      setStartDate(format(yesterday));
      setEndDate(format(yesterday));
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
      const isPostApril = today.getMonth() >= 3;
      const startYear = isPostApril ? currentYear : currentYear - 1;
      setStartDate(`${startYear}-04-01`);
      setEndDate(format(today));
    } else if (preset === 'All Time') {
      setStartDate('2020-01-01');
      setEndDate(format(today));
    }
  };

  const handleResetFilters = () => {
    setProductSearch('');
    setSelectedProductId('all');
    setSelectedCustomerId('all');
    setSelectedLocationId('all');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedPaymentStatus('all');
    setSelectedSaleType('all');
    handlePresetChange('All Time');
    setTableSearch('');
  };

  const hasActiveFilters =
    productSearch !== '' ||
    selectedProductId !== 'all' ||
    selectedCustomerId !== 'all' ||
    selectedLocationId !== 'all' ||
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    selectedPaymentStatus !== 'all' ||
    selectedSaleType !== 'all' ||
    datePreset !== 'All Time';

  // Extract all sales line items
  const allSellLineItems = useMemo<SellLineItemRecord[]>(() => {
    const saleTxns = transactions.filter((t) => t.type === 'sale' && t.status !== 'quotation' && t.status !== 'draft');
    const records: SellLineItemRecord[] = [];

    saleTxns.forEach((txn) => {
      const customer = customers.find((c) => c.id === txn.customerId);
      const location = locations.find((l) => l.id === txn.locationId);

      txn.items.forEach((item, index) => {
        const product = products.find((p) => p.id === item.productId || p.sku === item.sku);

        const qty = Number(item.quantity) || 0;
        const unitSellingPrice = Number(item.unitPrice || product?.sellingPrice || 0);
        const costPrice = Number(item.costPrice || product?.costPrice || 0);
        const discount = Number(item.discount || 0);
        const netSellingPrice = Math.max(0, unitSellingPrice - discount);
        const taxRate = Number(item.taxRate ?? product?.taxRate ?? 0);
        const lineTax = (netSellingPrice * qty * taxRate) / 100;
        const lineSubtotal = netSellingPrice * qty;
        const lineTotal = lineSubtotal + lineTax;

        const totalCost = costPrice * qty;
        const grossProfit = lineTotal - totalCost;
        const marginPercent = lineTotal > 0 ? (grossProfit / lineTotal) * 100 : 0;

        records.push({
          id: `${txn.id}_item_${index}`,
          transactionId: txn.id,
          invoiceNo: txn.invoiceNo || `INV-${txn.id.slice(-6)}`,
          date: txn.date,
          customerId: txn.customerId,
          customerName: customer?.name || 'Walk-in Customer',
          customerBusiness: customer?.businessName,
          customerPhone: customer?.phone,
          locationId: txn.locationId || 'loc_main',
          locationName: location?.name || 'Main Warehouse',
          status: (txn.status as any) || 'final',
          paymentStatus: txn.paymentStatus || 'paid',
          isPos: txn.isPos,
          saleChannel: txn.saleChannel || (txn.isPos ? 'pos' : 'standard'),
          productId: item.productId || product?.id || `prod_unknown_${index}`,
          productName: item.productName || product?.name || 'Unknown Product',
          sku: item.sku || product?.sku || 'N/A',
          category: getCategoryName(product?.category),
          brand: getBrandName(product?.brand),
          unit: item.unit || product?.unit || 'Pcs',
          quantity: qty,
          unitPrice: unitSellingPrice,
          costPrice: costPrice,
          totalCost: totalCost,
          discount: discount,
          taxRate: taxRate,
          taxAmount: lineTax,
          subtotal: lineSubtotal,
          totalIncTax: lineTotal,
          grossProfit: grossProfit,
          marginPercent: marginPercent,
          currentStock: product ? Number(product.currentStock || 0) : 0,
          alertQuantity: product ? Number(product.alertQuantity || 5) : 5,
          image: product?.image,
          originalTransaction: txn,
        });
      });
    });

    return records;
  }, [transactions, customers, locations, products]);

  // Filtered Line Items
  const filteredLineItems = useMemo(() => {
    return allSellLineItems.filter((item) => {
      // Date filter
      if (startDate && item.date.substring(0, 10) < startDate) return false;
      if (endDate && item.date.substring(0, 10) > endDate) return false;

      // Product selector
      if (selectedProductId !== 'all' && item.productId !== selectedProductId) return false;

      // Product search text
      if (productSearch.trim()) {
        const query = productSearch.toLowerCase();
        const matchesName = item.productName.toLowerCase().includes(query);
        const matchesSku = item.sku.toLowerCase().includes(query);
        if (!matchesName && !matchesSku) return false;
      }

      // Customer filter
      if (selectedCustomerId !== 'all' && item.customerId !== selectedCustomerId) return false;

      // Location filter
      if (selectedLocationId !== 'all' && item.locationId !== selectedLocationId) return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;

      // Brand filter
      if (selectedBrand !== 'all' && item.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;

      // Payment Status filter
      if (selectedPaymentStatus !== 'all' && item.paymentStatus !== selectedPaymentStatus) return false;

      // Sale Type / Channel filter
      if (selectedSaleType !== 'all') {
        if (selectedSaleType === 'pos' && !item.isPos) return false;
        if (selectedSaleType === 'standard' && item.isPos) return false;
      }

      // Table search box (multi-field search)
      if (tableSearch.trim()) {
        const query = tableSearch.toLowerCase();
        const match =
          item.productName.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.invoiceNo.toLowerCase().includes(query) ||
          item.customerName.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query) ||
          item.locationName.toLowerCase().includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [
    allSellLineItems,
    startDate,
    endDate,
    selectedProductId,
    productSearch,
    selectedCustomerId,
    selectedLocationId,
    selectedCategory,
    selectedBrand,
    selectedPaymentStatus,
    selectedSaleType,
    tableSearch,
  ]);

  // Sorted Line Items
  const sortedLineItems = useMemo(() => {
    return [...filteredLineItems].sort((a, b) => {
      let valA: any = a[sortField as keyof SellLineItemRecord];
      let valB: any = b[sortField as keyof SellLineItemRecord];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLineItems, sortField, sortDirection]);

  // Paginated Line Items
  const paginatedLineItems = useMemo(() => {
    if (rowsPerPage === -1) return sortedLineItems;
    const start = (currentPage - 1) * rowsPerPage;
    return sortedLineItems.slice(start, start + rowsPerPage);
  }, [sortedLineItems, currentPage, rowsPerPage]);

  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(sortedLineItems.length / rowsPerPage);

  // Grouped by Date & Product Summary (Standard finias POS Grouped Tab)
  const dateProductGroupedSummary = useMemo(() => {
    const map: Record<
      string,
      {
        key: string;
        date: string;
        productId: string;
        productName: string;
        sku: string;
        category: string;
        brand: string;
        unit: string;
        totalQuantity: number;
        totalSubtotal: number;
        totalTax: number;
        totalGross: number;
        totalCost: number;
        totalProfit: number;
        currentStock: number;
        image?: string;
      }
    > = {};

    filteredLineItems.forEach((item) => {
      const dateKey = item.date.substring(0, 10);
      const key = `${dateKey}_${item.productId}`;

      if (!map[key]) {
        map[key] = {
          key,
          date: dateKey,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          category: item.category,
          brand: item.brand,
          unit: item.unit,
          totalQuantity: 0,
          totalSubtotal: 0,
          totalTax: 0,
          totalGross: 0,
          totalCost: 0,
          totalProfit: 0,
          currentStock: item.currentStock,
          image: item.image,
        };
      }

      const entry = map[key];
      entry.totalQuantity += item.quantity;
      entry.totalSubtotal += item.subtotal;
      entry.totalTax += item.taxAmount;
      entry.totalGross += item.totalIncTax;
      entry.totalCost += item.totalCost;
      entry.totalProfit += item.grossProfit;
    });

    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredLineItems]);

  // Grouped by Category Summary
  const categoryGroupedSummary = useMemo(() => {
    const map: Record<
      string,
      {
        category: string;
        uniqueProducts: Set<string>;
        totalQuantity: number;
        totalGross: number;
        totalCost: number;
        totalProfit: number;
        invoiceCount: number;
      }
    > = {};

    const totalReportSales = filteredLineItems.reduce((sum, i) => sum + i.totalIncTax, 0);

    filteredLineItems.forEach((item) => {
      const cat = item.category || 'Uncategorized';
      if (!map[cat]) {
        map[cat] = {
          category: cat,
          uniqueProducts: new Set<string>(),
          totalQuantity: 0,
          totalGross: 0,
          totalCost: 0,
          totalProfit: 0,
          invoiceCount: 0,
        };
      }

      const entry = map[cat];
      entry.uniqueProducts.add(item.productId);
      entry.totalQuantity += item.quantity;
      entry.totalGross += item.totalIncTax;
      entry.totalCost += item.totalCost;
      entry.totalProfit += item.grossProfit;
      entry.invoiceCount += 1;
    });

    return Object.values(map)
      .map((entry) => ({
        ...entry,
        sharePercent: totalReportSales > 0 ? (entry.totalGross / totalReportSales) * 100 : 0,
        marginPercent: entry.totalGross > 0 ? (entry.totalProfit / entry.totalGross) * 100 : 0,
      }))
      .sort((a, b) => b.totalGross - a.totalGross);
  }, [filteredLineItems]);

  // Grouped by Brand Summary
  const brandGroupedSummary = useMemo(() => {
    const map: Record<
      string,
      {
        brand: string;
        uniqueProducts: Set<string>;
        totalQuantity: number;
        totalGross: number;
        totalCost: number;
        totalProfit: number;
        invoiceCount: number;
      }
    > = {};

    const totalReportSales = filteredLineItems.reduce((sum, i) => sum + i.totalIncTax, 0);

    filteredLineItems.forEach((item) => {
      const br = item.brand || 'Generic';
      if (!map[br]) {
        map[br] = {
          brand: br,
          uniqueProducts: new Set<string>(),
          totalQuantity: 0,
          totalGross: 0,
          totalCost: 0,
          totalProfit: 0,
          invoiceCount: 0,
        };
      }

      const entry = map[br];
      entry.uniqueProducts.add(item.productId);
      entry.totalQuantity += item.quantity;
      entry.totalGross += item.totalIncTax;
      entry.totalCost += item.totalCost;
      entry.totalProfit += item.grossProfit;
      entry.invoiceCount += 1;
    });

    return Object.values(map)
      .map((entry) => ({
        ...entry,
        sharePercent: totalReportSales > 0 ? (entry.totalGross / totalReportSales) * 100 : 0,
        marginPercent: entry.totalGross > 0 ? (entry.totalProfit / entry.totalGross) * 100 : 0,
      }))
      .sort((a, b) => b.totalGross - a.totalGross);
  }, [filteredLineItems]);

  // Grouped by Customer Summary
  const customerGroupedSummary = useMemo(() => {
    const map: Record<
      string,
      {
        customerId?: string;
        customerName: string;
        customerBusiness?: string;
        uniqueProducts: Set<string>;
        totalQuantity: number;
        totalGross: number;
        totalProfit: number;
        invoiceCount: number;
        lastPurchaseDate: string;
      }
    > = {};

    filteredLineItems.forEach((item) => {
      const key = item.customerId || item.customerName || 'walkin';
      if (!map[key]) {
        map[key] = {
          customerId: item.customerId,
          customerName: item.customerName,
          customerBusiness: item.customerBusiness,
          uniqueProducts: new Set<string>(),
          totalQuantity: 0,
          totalGross: 0,
          totalProfit: 0,
          invoiceCount: 0,
          lastPurchaseDate: item.date,
        };
      }

      const entry = map[key];
      entry.uniqueProducts.add(item.productId);
      entry.totalQuantity += item.quantity;
      entry.totalGross += item.totalIncTax;
      entry.totalProfit += item.grossProfit;
      entry.invoiceCount += 1;
      if (item.date > entry.lastPurchaseDate) {
        entry.lastPurchaseDate = item.date;
      }
    });

    return Object.values(map).sort((a, b) => b.totalGross - a.totalGross);
  }, [filteredLineItems]);

  // Executive KPI Totals
  const kpis = useMemo(() => {
    const totalQty = filteredLineItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalSubtotal = filteredLineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalTax = filteredLineItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalGross = filteredLineItems.reduce((sum, item) => sum + item.totalIncTax, 0);
    const totalCost = filteredLineItems.reduce((sum, item) => sum + item.totalCost, 0);
    const totalGrossProfit = totalGross - totalCost;
    const overallMargin = totalGross > 0 ? (totalGrossProfit / totalGross) * 100 : 0;
    const uniqueProductsCount = new Set(filteredLineItems.map((i) => i.productId)).size;
    const uniqueCustomersCount = new Set(filteredLineItems.map((i) => i.customerId || i.customerName)).size;
    const uniqueInvoicesCount = new Set(filteredLineItems.map((i) => i.invoiceNo)).size;

    return {
      totalQty,
      totalSubtotal,
      totalTax,
      totalGross,
      totalCost,
      totalGrossProfit,
      overallMargin,
      uniqueProductsCount,
      uniqueCustomersCount,
      uniqueInvoicesCount,
    };
  }, [filteredLineItems]);

  // Handle Sort Toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Copy SKU handler
  const handleCopySku = (sku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Brand',
      'Customer',
      'Invoice No',
      'Date',
      'Quantity Sold',
      'Unit',
      'Unit Selling Price',
      'Cost Price',
      'Discount',
      'Tax Rate (%)',
      'Tax Amount',
      'Subtotal (Excl. Tax)',
      'Total (Inc. Tax)',
      'Gross Profit',
      'Margin (%)',
      'Current Stock',
      'Payment Status',
    ];

    const rows = filteredLineItems.map((item) => [
      `"${item.productName.replace(/"/g, '""')}"`,
      `"${item.sku}"`,
      `"${item.category}"`,
      `"${item.brand}"`,
      `"${item.customerName.replace(/"/g, '""')}"`,
      `"${item.invoiceNo}"`,
      `"${item.date}"`,
      item.quantity,
      `"${item.unit}"`,
      item.unitPrice.toFixed(2),
      item.costPrice.toFixed(2),
      item.discount.toFixed(2),
      item.taxRate.toFixed(2),
      item.taxAmount.toFixed(2),
      item.subtotal.toFixed(2),
      item.totalIncTax.toFixed(2),
      item.grossProfit.toFixed(2),
      item.marginPercent.toFixed(2),
      item.currentStock,
      `"${item.paymentStatus}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Product_Sell_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="product-sell-report-container" className="p-4 sm:p-6 space-y-6 w-full max-w-7xl mx-auto pb-12">
      {/* Top Header & Quick Action Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Product Sell Report</span>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  finias POS Standard
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive sales ledger, unit selling prices, customer demand, purchase cost margins, and category velocity.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('pos')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95"
            title="Open POS Terminal to make a sale"
          >
            <Store className="w-4 h-4" />
            <span>Open POS Terminal</span>
          </button>

          <button
            onClick={handleExportCsv}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition active:scale-95 ${
              isLight
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 shadow-sm'
            }`}
            title="Export CSV spreadsheet"
          >
            <FileSpreadsheet className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-emerald-400'}`} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Primary Executive KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Units Sold */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Total Units Sold</span>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
              {kpis.uniqueProductsCount} Items
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            {kpis.totalQty.toLocaleString()} <span className="text-xs font-sans text-slate-400 font-normal">Units</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span>Across {kpis.uniqueInvoicesCount} invoices</span>
          </div>
          <div className="absolute right-4 bottom-4 p-2.5 bg-slate-950 text-emerald-400 rounded-xl border border-slate-800/80">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Total Sales (Excl. Tax) */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="text-xs font-semibold text-slate-400">Total Net Sales (Excl. Tax)</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-2">
            {formatCurrency(kpis.totalSubtotal, settings)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            Base merchandise revenue
          </div>
          <div className="absolute right-4 bottom-4 p-2.5 bg-slate-950 text-slate-400 rounded-xl border border-slate-800/80">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Total Tax on Sold Products */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="text-xs font-semibold text-indigo-300">Total Sales Tax</div>
          <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-2">
            {formatCurrency(kpis.totalTax, settings)}
          </div>
          <div className="text-[11px] text-indigo-200 mt-1.5">
            Collected Output Tax (GST/VAT)
          </div>
          <div className="absolute right-4 bottom-4 p-2.5 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-800/40">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Total Gross Revenue (Inc. Tax) */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden ring-1 ring-emerald-500/20 group hover:border-emerald-500/40 transition">
          <div className="text-xs font-semibold text-emerald-300 flex items-center justify-between">
            <span>Gross Sales (Inc. Tax)</span>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded">
              Grand Total
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-2">
            {formatCurrency(kpis.totalGross, settings)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{kpis.uniqueCustomersCount} Customers</span>
          </div>
          <div className="absolute right-4 bottom-4 p-2.5 bg-emerald-950/30 text-emerald-400 rounded-xl border border-emerald-800/40">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 5: Total Gross Profit & Margin */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden ring-1 ring-cyan-500/20 group hover:border-cyan-500/40 transition">
          <div className="text-xs font-semibold text-cyan-300 flex items-center justify-between">
            <span>Gross Margin / Profit</span>
            <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
              {kpis.overallMargin.toFixed(1)}% Margin
            </span>
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-2">
            {formatCurrency(kpis.totalGrossProfit, settings)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            Total Acquisition Cost: {formatCurrency(kpis.totalCost, settings)}
          </div>
          <div className="absolute right-4 bottom-4 p-2.5 bg-cyan-950/30 text-cyan-400 rounded-xl border border-cyan-800/40">
            <BadgePercent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>Filters & Search Parameters</span>
            {hasActiveFilters && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Active Filter Applied
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Date Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['All Time', 'This Month', 'Last Month', 'Last 30 Days', 'Last 7 Days', 'Current Financial Year'].map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetChange(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                      datePreset === preset
                        ? isLight
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50'
                        : isLight
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                )
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800 transition"
              title={isFilterExpanded ? 'Collapse Filters' : 'Expand Filters'}
            >
              {isFilterExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isFilterExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Product Quick Search */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Search Product / SKU
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type Product Name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Specific Product Select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Select Specific Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="all">All Products ({products.length})</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="all">All Customers ({customers.length})</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.businessName ? `(${c.businessName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Location Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Business Location
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="all">All Business Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code || 'LOC'})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="all">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sale Channel / Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Sale Channel / Type
              </label>
              <select
                value={selectedSaleType}
                onChange={(e) => setSelectedSaleType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="all">All Sales Channels</option>
                <option value="pos">POS Terminal Register</option>
                <option value="standard">Standard Commercial Invoice</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Payment Status
              </label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid in Full</option>
                <option value="partial">Partially Paid</option>
                <option value="due">Payment Due</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('Custom');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition font-mono"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('Custom');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Column Visibility Section (Reference Screenshot Style) */}
      {activeSubTab === 'detailed' && (
        <div className="w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm transition-colors duration-300 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 bg-slate-950/80 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20">
                <Columns className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Column Visibility</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {Object.values(colVisibility).filter(Boolean).length} Visible
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                  Select which columns to display in the detailed sales ledger.
                </p>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
              {showColSettings && (
                <div className="flex items-center gap-1.5 mr-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allTrue: Record<string, boolean> = {};
                      Object.keys(colVisibility).forEach(k => allTrue[k] = true);
                      setColVisibility(allTrue as any);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    All
                  </button>
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setShowColSettings(!showColSettings)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  showColSettings 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {showColSettings ? (
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

          {showColSettings && (
            <div className="border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 bg-slate-900/50 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {Object.entries(colVisibility).map(([key, isVisible]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer hover:bg-slate-800/50 transition-colors ${
                      isVisible
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900/50 border-slate-800/60 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => setColVisibility(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-3.5 h-3.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-slate-900 bg-slate-900"
                    />
                    <span className="text-[11px] font-medium leading-tight select-none">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Table & Perspective Views */}
      <div className={`rounded-2xl border p-5 space-y-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        {/* Multi-Perspective Tab Bar (finias POS Standard tabs) */}
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-3 ${
          isLight ? 'border-slate-100' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setActiveSubTab('detailed');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'detailed'
                  ? isLight
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Detailed ({filteredLineItems.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('with_purchase');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'with_purchase'
                  ? isLight
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Detailed report with purchase price and gross margins"
            >
              <BadgePercent className="w-3.5 h-3.5" />
              <span>Detailed (With purchase)</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('grouped');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'grouped'
                  ? isLight
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Grouped by Date and Product Name"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Grouped ({dateProductGroupedSummary.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('by_category');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'by_category'
                  ? isLight
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>By Category ({categoryGroupedSummary.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('by_brand');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'by_brand'
                  ? isLight
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>By Brand ({brandGroupedSummary.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('by_customer');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'by_customer'
                  ? isLight
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>By Customer ({customerGroupedSummary.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
              <input
                type="text"
                placeholder="Search in table..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            </div>

          </div>
        </div>

        {/* TAB 1: Detailed Sales Ledger Table */}
        {activeSubTab === 'detailed' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold select-none">
                <tr>
                  {colVisibility.product && <th className="p-3">Product Name</th>}
                  {colVisibility.sku && <th className="p-3">SKU</th>}
                  {colVisibility.customer && <th className="p-3">Customer</th>}
                  {colVisibility.invoiceNo && <th className="p-3">Invoice No</th>}
                  {colVisibility.date && <th className="p-3">Date</th>}
                  {colVisibility.quantity && <th className="p-3 text-right">Qty</th>}
                  {colVisibility.unitPrice && <th className="p-3 text-right">Unit Price</th>}
                  {colVisibility.discount && <th className="p-3 text-right">Discount</th>}
                  {colVisibility.tax && <th className="p-3 text-right">Tax</th>}
                  {colVisibility.subtotal && <th className="p-3 text-right">Subtotal</th>}
                  {colVisibility.paymentStatus && <th className="p-3 text-center">Payment Status</th>}
                  {colVisibility.currentStock && <th className="p-3 text-right">Stock</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {paginatedLineItems.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-slate-500 text-xs">
                      No sales records found matching your current filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedLineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {colVisibility.product && (
                        <td className="p-3 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                <Package className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div>
                              <div className="text-white font-bold">{item.productName}</div>
                              <div className="text-[10px] text-slate-400">{item.category} • {item.brand}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      {colVisibility.sku && (
                        <td className="p-3 font-mono text-emerald-300 text-[11px]">
                          <span
                            onClick={(e) => handleCopySku(item.sku, e)}
                            className="cursor-pointer hover:underline flex items-center gap-1"
                            title="Click to copy SKU"
                          >
                            {item.sku}
                            {copiedSku === item.sku ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500 opacity-50" />}
                          </span>
                        </td>
                      )}
                      {colVisibility.customer && <td className="p-3 text-slate-300">{item.customerName}</td>}
                      {colVisibility.invoiceNo && <td className="p-3 font-mono text-slate-300">{item.invoiceNo}</td>}
                      {colVisibility.date && <td className="p-3 font-mono text-slate-400">{item.date}</td>}
                      {colVisibility.quantity && (
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {item.quantity} <span className="text-[10px] text-slate-500">{item.unit}</span>
                        </td>
                      )}
                      {colVisibility.unitPrice && (
                        <td className="p-3 text-right font-mono text-slate-300">
                          {formatCurrency(item.unitPrice, settings)}
                        </td>
                      )}
                      {colVisibility.discount && (
                        <td className="p-3 text-right font-mono text-rose-400">
                          {item.discount > 0 ? formatCurrency(item.discount, settings) : '-'}
                        </td>
                      )}
                      {colVisibility.tax && (
                        <td className="p-3 text-right font-mono text-slate-400">
                          {formatCurrency(item.taxAmount, settings)}
                        </td>
                      )}
                      {colVisibility.subtotal && (
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(item.totalIncTax, settings)}
                        </td>
                      )}
                      {colVisibility.paymentStatus && (
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {item.paymentStatus}
                          </span>
                        </td>
                      )}
                      {colVisibility.currentStock && (
                        <td className="p-3 text-right font-mono text-slate-400">
                          {item.currentStock}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Grouped By Date & Product */}
        {activeSubTab === 'grouped' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold select-none">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3 text-right">Units Sold</th>
                  <th className="p-3 text-right">Total Sales</th>
                  <th className="p-3 text-right">Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {dateProductGroupedSummary.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{item.date}</td>
                    <td className="p-3 font-bold text-white">{item.productName}</td>
                    <td className="p-3 font-mono text-emerald-300">{item.sku}</td>
                    <td className="p-3 text-right font-mono font-bold text-white">{item.totalQuantity} {item.unit}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(item.totalGross, settings)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-300">
                      {formatCurrency(item.totalProfit, settings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: By Category */}
        {activeSubTab === 'by_category' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold select-none">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Products</th>
                  <th className="p-3 text-right">Units Sold</th>
                  <th className="p-3 text-right">Total Revenue</th>
                  <th className="p-3 text-right">Sales Share</th>
                  <th className="p-3 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {categoryGroupedSummary.map((c) => (
                  <tr key={c.category} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white">{c.category}</td>
                    <td className="p-3 text-center font-mono text-slate-300">{c.uniqueProducts.size}</td>
                    <td className="p-3 text-right font-mono font-bold text-white">{c.totalQuantity}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(c.totalGross, settings)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-300">{c.sharePercent.toFixed(1)}%</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-300">
                      {formatCurrency(c.totalProfit, settings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: By Brand */}
        {activeSubTab === 'by_brand' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold select-none">
                <tr>
                  <th className="p-3">Brand</th>
                  <th className="p-3 text-center">Products</th>
                  <th className="p-3 text-right">Units Sold</th>
                  <th className="p-3 text-right">Total Revenue</th>
                  <th className="p-3 text-right">Sales Share</th>
                  <th className="p-3 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {brandGroupedSummary.map((b) => (
                  <tr key={b.brand} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white">{b.brand}</td>
                    <td className="p-3 text-center font-mono text-slate-300">{b.uniqueProducts.size}</td>
                    <td className="p-3 text-right font-mono font-bold text-white">{b.totalQuantity}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(b.totalGross, settings)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-300">{b.sharePercent.toFixed(1)}%</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-300">
                      {formatCurrency(b.totalProfit, settings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: By Customer */}
        {activeSubTab === 'by_customer' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold select-none">
                <tr>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3 text-center">Items Bought</th>
                  <th className="p-3 text-center">Invoices</th>
                  <th className="p-3 text-right">Total Spend</th>
                  <th className="p-3 text-right">Last Purchase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {customerGroupedSummary.map((cust, idx) => (
                  <tr key={cust.customerId || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>{cust.customerName}</span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-300">{cust.totalQuantity}</td>
                    <td className="p-3 text-center font-mono text-slate-300">{cust.invoiceCount}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(cust.totalGross, settings)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">{cust.lastPurchaseDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
