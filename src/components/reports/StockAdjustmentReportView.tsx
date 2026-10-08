import React, { useState, useMemo, useRef } from 'react';
import { useErp } from '../../context/ErpContext';
import { ExportButtons } from '../common/ExportButtons';
import { StockAdjustment, StockAdjustmentItem } from '../../types/erp';
import { StockAdjustmentModal } from '../inventory/StockAdjustmentModal';
import { getCategoryName, formatDate, normalizeDateToYMD } from '../../utils/formatters';
import {
  AlertTriangle,
  Boxes,
  Calendar,
  Building,
  Filter,
  Search,
  Download,
  Printer,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Copy,
  Info,
  DollarSign,
  TrendingDown,
  ShieldAlert,
  ArrowUpDown,
  Tag,
  User,
  FileText,
  RotateCcw,
  Check,
  Columns,
  ShieldCheck,
} from 'lucide-react';

export const StockAdjustmentReportView: React.FC = () => {
  const {
    stockAdjustments,
    locations,
    products,
    settings,
    formatMoney,
  } = useErp();

  const isLight = settings?.themeMode === 'light';

  // Modals & Active Detail state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Tab view: "adjustments" (transaction list) or "product_summary" (product-wise breakdown)
  const [activeTab, setActiveTab] = useState<'adjustments' | 'product_summary'>('adjustments');

  // Filter States
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all'); // all | normal | abnormal
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Date Filter & Presets
  const [datePreset, setDatePreset] = useState<string>('This Month');
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Table Sorting & Pagination
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Column Visibility
  const [showColumnVisibility, setShowColumnVisibility] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    action: true,
    date: true,
    referenceNo: true,
    location: true,
    adjustmentType: true,
    totalAmount: true,
    totalAmountRecovered: true,
    netLoss: true,
    reason: true,
    addedBy: true,
  });

  const STOCK_ADJUSTMENT_COLUMN_DEFINITIONS = [
    { key: 'action', label: 'Action', description: 'View details & receipts', locked: false },
    { key: 'date', label: 'Date', description: 'Adjustment timestamp', locked: true },
    { key: 'referenceNo', label: 'Reference No', description: 'Adjustment voucher ID', locked: false },
    { key: 'location', label: 'Location', description: 'Warehouse / Store branch', locked: false },
    { key: 'adjustmentType', label: 'Adjustment Type', description: 'Normal or Abnormal type', locked: false },
    { key: 'totalAmount', label: 'Total Amount', description: 'Gross value adjusted', locked: false },
    { key: 'totalAmountRecovered', label: 'Amount Recovered', description: 'Insurance / Stock salvage', locked: false },
    { key: 'netLoss', label: 'Net Loss', description: 'Final net loss value', locked: false },
    { key: 'reason', label: 'Reason', description: 'Audit notes & justification', locked: false },
    { key: 'addedBy', label: 'Added By', description: 'Authorizing user account', locked: false },
  ];

  const handleColumnPreset = (type: 'all' | 'standard' | 'compact' | 'reset') => {
    if (type === 'all' || type === 'reset') {
      setVisibleColumns({ action: true, date: true, referenceNo: true, location: true, adjustmentType: true, totalAmount: true, totalAmountRecovered: true, netLoss: true, reason: true, addedBy: true });
    } else if (type === 'standard') {
      setVisibleColumns({ action: true, date: true, referenceNo: true, location: true, adjustmentType: true, totalAmount: true, totalAmountRecovered: false, netLoss: true, reason: true, addedBy: false });
    } else if (type === 'compact') {
      setVisibleColumns({ action: true, date: true, referenceNo: true, location: false, adjustmentType: true, totalAmount: true, totalAmountRecovered: false, netLoss: true, reason: false, addedBy: false });
    }
  };

  // Handle Date Preset Selection
  const handleDatePresetChange = (preset: string) => {
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
      const isPostMarch = today.getMonth() >= 3;
      const startYear = isPostMarch ? currentYear : currentYear - 1;
      const endYear = startYear + 1;
      setStartDate(`${startYear}-04-01`);
      setEndDate(`${endYear}-03-31`);
    }
  };

  const handleResetFilters = () => {
    setLocationFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
    handleDatePresetChange('This Month');
    setCurrentPage(1);
  };

  // Copy Reference Number
  const handleCopyRef = (refNo: string) => {
    navigator.clipboard?.writeText(refNo);
    setCopiedRef(refNo);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Processed Adjustment Records with enriched fields
  const processedAdjustments = useMemo(() => {
    return stockAdjustments.map((adj) => {
      // Calculate total value if not explicitly given
      const calculatedTotal = adj.items.reduce((sum, i) => {
        const cost = i.unitCost || 0;
        const qty = i.quantity || 0;
        return sum + (cost * qty);
      }, 0);

      const totalAmount = adj.totalAmount !== undefined ? adj.totalAmount : calculatedTotal;
      const totalAmountRecovered = adj.totalAmountRecovered || 0;
      const netLoss = Math.max(0, totalAmount - totalAmountRecovered);
      const totalItemsCount = adj.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
      
      const loc = locations.find((l) => l.id === adj.locationId);
      const locationName = loc ? loc.name : 'Main Store';
      
      // Default to 'normal' if adjustmentType is undefined
      const adjustmentType = adj.adjustmentType || 'normal';

      return {
        ...adj,
        totalAmount,
        totalAmountRecovered,
        netLoss,
        totalItemsCount,
        locationName,
        adjustmentType,
      };
    });
  }, [stockAdjustments, locations]);

  // Filtered Adjustments based on user filters
  const filteredAdjustments = useMemo(() => {
    return processedAdjustments.filter((adj) => {
      // Location Filter
      if (locationFilter !== 'all' && adj.locationId !== locationFilter) {
        return false;
      }

      // Adjustment Type Filter
      if (typeFilter !== 'all' && adj.adjustmentType !== typeFilter) {
        return false;
      }

      // Date Range Filter
      const adjDate = normalizeDateToYMD(adj.date);
      if (adjDate) {
        if (startDate && adjDate < startDate) return false;
        if (endDate && adjDate > endDate) return false;
      }

      // Text Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesRef = adj.referenceNo.toLowerCase().includes(query);
        const matchesLocation = adj.locationName.toLowerCase().includes(query);
        const matchesReason = (adj.reason || '').toLowerCase().includes(query);
        const matchesNotes = (adj.notes || '').toLowerCase().includes(query);
        const matchesUser = (adj.adjustedBy || '').toLowerCase().includes(query);
        const matchesProducts = adj.items.some(
          (item) =>
            item.productName.toLowerCase().includes(query) ||
            (item.sku && item.sku.toLowerCase().includes(query))
        );

        if (!matchesRef && !matchesLocation && !matchesReason && !matchesNotes && !matchesUser && !matchesProducts) {
          return false;
        }
      }

      return true;
    });
  }, [processedAdjustments, locationFilter, typeFilter, startDate, endDate, searchQuery]);

  // Sorted Adjustments
  const sortedAdjustments = useMemo(() => {
    return [...filteredAdjustments].sort((a, b) => {
      let aVal: any = a[sortField as keyof typeof a];
      let bVal: any = b[sortField as keyof typeof b];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAdjustments, sortField, sortDirection]);

  // Paginated Adjustments
  const paginatedAdjustments = useMemo(() => {
    if (pageSize === -1) return sortedAdjustments;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedAdjustments.slice(startIndex, startIndex + pageSize);
  }, [sortedAdjustments, currentPage, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(sortedAdjustments.length / pageSize);

  // Financial KPI Summaries (Matching finias POS exact metrics)
  const kpiMetrics = useMemo(() => {
    let totalNormal = 0;
    let totalAbnormal = 0;
    let totalStockAdjustment = 0;
    let totalAmountRecovered = 0;
    let totalUnitsCount = 0;

    filteredAdjustments.forEach((adj) => {
      if (adj.adjustmentType === 'abnormal') {
        totalAbnormal += adj.totalAmount;
      } else {
        totalNormal += adj.totalAmount;
      }
      totalStockAdjustment += adj.totalAmount;
      totalAmountRecovered += adj.totalAmountRecovered;
      totalUnitsCount += adj.totalItemsCount;
    });

    const netLoss = Math.max(0, totalStockAdjustment - totalAmountRecovered);

    return {
      totalNormal,
      totalAbnormal,
      totalStockAdjustment,
      totalAmountRecovered,
      netLoss,
      totalUnitsCount,
      totalAdjustmentsCount: filteredAdjustments.length,
    };
  }, [filteredAdjustments]);

  // Product-Wise Adjustment Breakdown Data
  const productWiseBreakdown = useMemo(() => {
    const map = new Map<string, {
      productId: string;
      productName: string;
      sku: string;
      category: string;
      unitCost: number;
      totalQuantityAdjusted: number;
      totalValue: number;
      adjustmentReasons: { [reason: string]: number };
      currentStock: number;
    }>();

    filteredAdjustments.forEach((adj) => {
      adj.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const sku = item.sku || prod?.sku || 'N/A';
        const category = getCategoryName(prod?.category);
        const unitCost = item.unitCost || prod?.costPrice || 0;
        const key = item.productId || item.productName;

        if (!map.has(key)) {
          map.set(key, {
            productId: item.productId,
            productName: item.productName,
            sku,
            category,
            unitCost,
            totalQuantityAdjusted: 0,
            totalValue: 0,
            adjustmentReasons: {},
            currentStock: prod?.currentStock || 0,
          });
        }

        const entry = map.get(key)!;
        entry.totalQuantityAdjusted += item.quantity || 1;
        entry.totalValue += (item.quantity || 1) * unitCost;

        const reasonKey = item.type || 'damage';
        entry.adjustmentReasons[reasonKey] = (entry.adjustmentReasons[reasonKey] || 0) + (item.quantity || 1);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredAdjustments, products]);

  // Sorting helper
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Reference No',
      'Location',
      'Adjustment Type',
      'Total Amount',
      'Total Recovered',
      'Net Loss',
      'Reason',
      'Added By',
      'Items Count',
    ];

    const rows = filteredAdjustments.map((a) => [
      `"${a.date}"`,
      `"${a.referenceNo}"`,
      `"${a.locationName}"`,
      `"${a.adjustmentType.toUpperCase()}"`,
      a.totalAmount.toFixed(2),
      a.totalAmountRecovered.toFixed(2),
      a.netLoss.toFixed(2),
      `"${(a.reason || '').replace(/"/g, '""')}"`,
      `"${a.adjustedBy || ''}"`,
      a.totalItemsCount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Adjustment_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-7xl mx-auto pb-12">
      {/* Top Header & Quick Action Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Reports</span>
            <span>/</span>
            <span className="text-amber-400 font-semibold">Stock Adjustment Report</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span>Stock Adjustment Report</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track and audit stock discrepancies, damage write-offs, normal vs abnormal adjustments, and insurance recoveries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <ExportButtons
            headers={[
              'Date',
              'Reference No',
              'Location',
              'Adjustment Type',
              'Total Amount',
              'Total Recovered',
              'Net Loss',
              'Reason',
              'Added By',
              'Items Count',
            ]}
            keys={[
              'date',
              'referenceNo',
              'locationName',
              'adjustmentType',
              'totalAmount',
              'totalAmountRecovered',
              'netLoss',
              'reason',
              'adjustedBy',
              'totalItemsCount',
            ]}
            data={filteredAdjustments}
            filename="stock_adjustment_report"
            title="Stock Adjustment Report"
            isLight={isLight}
          />

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition border border-slate-700 hover:border-slate-600"
            title="Print Report"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards (finias POS Standard Formulas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Normal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Normal</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Routine / Audit
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-sky-400">
              {formatMoney(kpiMetrics.totalNormal)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Normal operational losses</div>
          </div>
        </div>

        {/* Total Abnormal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Abnormal</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Accident / Theft
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-400">
              {formatMoney(kpiMetrics.totalAbnormal)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Fire, water, breakages</div>
          </div>
        </div>

        {/* Total Stock Adjustment */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Stock Adjustment</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Gross Write-off
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400">
              {formatMoney(kpiMetrics.totalStockAdjustment)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Normal + Abnormal total</div>
          </div>
        </div>

        {/* Total Amount Recovered */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Recovered</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Insurance / Scrap
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400">
              {formatMoney(kpiMetrics.totalAmountRecovered)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Recovered from claims & scrap</div>
          </div>
        </div>

        {/* Net Stock Adjustment Loss (P&L Impact) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between bg-gradient-to-br from-slate-900 to-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Net P&L Loss</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Net Impact
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {formatMoney(kpiMetrics.netLoss)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Total Adjustment - Recovered</div>
          </div>
        </div>
      </div>

      {/* Filter Ribbon Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Filter className="w-4 h-4 text-amber-400" />
            <span>Filters & Search</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              {isFilterCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isFilterCollapsed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80 text-xs">
            {/* Location Filter */}
            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Business Location</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-950 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Adjustment Type Filter */}
            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Adjustment Type</label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-950 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Types (Normal & Abnormal)</option>
                  <option value="normal">Normal (Routine discrepancy / Expiry)</option>
                  <option value="abnormal">Abnormal (Damages / Theft / Water / Fire)</option>
                </select>
              </div>
            </div>

            {/* Date Range Preset Selector */}
            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Date Range Preset</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={datePreset}
                  onChange={(e) => handleDatePresetChange(e.target.value)}
                  className="w-full bg-slate-950 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Current Financial Year">Current Financial Year</option>
                  <option value="Custom">Custom Date Range</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label className="text-slate-300 font-semibold mb-1 block">Search Adjustments</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Ref No, Product, User, Reason..."
                  className="w-full bg-slate-950 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Custom Date Range Inputs (if needed) */}
            {datePreset === 'Custom' && (
              <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Perspective Tabs (Stock Adjustments List vs Product Breakdown) */}
      <div className={`flex items-center gap-2 border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
            isLight
              ? activeTab === 'adjustments'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
              : activeTab === 'adjustments'
                ? 'bg-amber-500 text-black border-transparent shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Stock Adjustments ({filteredAdjustments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('product_summary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
            isLight
              ? activeTab === 'product_summary'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
              : activeTab === 'product_summary'
                ? 'bg-amber-500 text-black border-transparent shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Product-Wise Adjustment Summary ({productWiseBreakdown.length})</span>
        </button>
      </div>

      {/* Tab 1: All Stock Adjustments Table */}
      {activeTab === 'adjustments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
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
                      {Object.values(visibleColumns).filter(Boolean).length} of {STOCK_ADJUSTMENT_COLUMN_DEFINITIONS.length} Visible
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 hidden sm:inline-flex">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Admin Privileges</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                    Select which columns to display in the Stock Adjustment Report table.
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
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    showColumnVisibility 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {STOCK_ADJUSTMENT_COLUMN_DEFINITIONS.map((col) => {
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

          <div className="overflow-x-auto scrollbar-thin overscroll-x-contain">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-300 font-semibold border-b border-slate-800">
                  {visibleColumns.action && <th className="py-3.5 px-4 sticky left-0 z-10 bg-slate-950">Action</th>}
                  {visibleColumns.date && (
                    <th
                      onClick={() => handleSort('date')}
                      className="py-3.5 px-4 cursor-pointer hover:text-white select-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.referenceNo && (
                    <th
                      onClick={() => handleSort('referenceNo')}
                      className="py-3.5 px-4 cursor-pointer hover:text-white select-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Reference No</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.location && (
                    <th
                      onClick={() => handleSort('locationName')}
                      className="py-3.5 px-4 cursor-pointer hover:text-white select-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Location</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.adjustmentType && (
                    <th
                      onClick={() => handleSort('adjustmentType')}
                      className="py-3.5 px-4 cursor-pointer hover:text-white select-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Adjustment Type</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.totalAmount && (
                    <th
                      onClick={() => handleSort('totalAmount')}
                      className="py-3.5 px-4 text-right cursor-pointer hover:text-white select-none whitespace-nowrap"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Total Amount</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.totalAmountRecovered && (
                    <th
                      onClick={() => handleSort('totalAmountRecovered')}
                      className="py-3.5 px-4 text-right cursor-pointer hover:text-white select-none whitespace-nowrap"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Total Amount Recovered</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.netLoss && (
                    <th
                      onClick={() => handleSort('netLoss')}
                      className="py-3.5 px-4 text-right cursor-pointer hover:text-white select-none whitespace-nowrap"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Net Loss</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.reason && <th className="py-3.5 px-4 min-w-[180px]">Reason</th>}
                  {visibleColumns.addedBy && (
                    <th
                      onClick={() => handleSort('adjustedBy')}
                      className="py-3.5 px-4 cursor-pointer hover:text-white select-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Added By</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="w-8 h-8 text-slate-600" />
                        <span className="font-semibold text-slate-300">No stock adjustment records found</span>
                        <span className="text-[11px] text-slate-500">
                          Try adjusting your filters or click "+ Add Stock Adjustment" above.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAdjustments.map((adj) => (
                    <tr
                      key={adj.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Action */}
                      {visibleColumns.action && (
                        <td className="py-3 px-4 sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-800/90 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedAdjustment(adj)}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                            title="View Adjustment Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      )}

                      {/* Date */}
                      {visibleColumns.date && (
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap font-medium">
                          {adj.date}
                        </td>
                      )}

                      {/* Reference No */}
                      {visibleColumns.referenceNo && (
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => setSelectedAdjustment(adj)}
                              className="font-mono font-bold text-amber-400 hover:underline cursor-pointer"
                            >
                              {adj.referenceNo}
                            </span>
                            <button
                              onClick={() => handleCopyRef(adj.referenceNo)}
                              className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition"
                              title="Copy Reference"
                            >
                              {copiedRef === adj.referenceNo ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Location */}
                      {visibleColumns.location && (
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-slate-200">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {adj.locationName}
                          </span>
                        </td>
                      )}

                      {/* Adjustment Type */}
                      {visibleColumns.adjustmentType && (
                        <td className="py-3 px-4 whitespace-nowrap">
                          {adj.adjustmentType === 'abnormal' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                              Abnormal
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                              Normal
                            </span>
                          )}
                        </td>
                      )}

                      {/* Total Amount */}
                      {visibleColumns.totalAmount && (
                        <td className="py-3 px-4 text-right font-bold text-slate-100 whitespace-nowrap">
                          <div>{formatMoney(adj.totalAmount)}</div>
                          <div className="text-[10px] text-slate-500 font-normal font-sans">
                            {adj.items.length} item(s) ({adj.totalItemsCount} units)
                          </div>
                        </td>
                      )}

                      {/* Total Amount Recovered */}
                      {visibleColumns.totalAmountRecovered && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {adj.totalAmountRecovered > 0 ? (
                            <span className="font-semibold text-emerald-400">
                              {formatMoney(adj.totalAmountRecovered)}
                            </span>
                          ) : (
                            <span className="text-slate-500">{formatMoney(0)}</span>
                          )}
                        </td>
                      )}

                      {/* Net Loss */}
                      {visibleColumns.netLoss && (
                        <td className="py-3 px-4 text-right font-bold text-rose-400 whitespace-nowrap">
                          {formatMoney(adj.netLoss)}
                        </td>
                      )}

                      {/* Reason */}
                      {visibleColumns.reason && (
                        <td className="py-3 px-4 text-slate-300">
                          <div className="max-w-xs truncate" title={adj.reason}>
                            {adj.reason || <span className="text-slate-500 italic">No reason provided</span>}
                          </div>
                          {adj.notes && (
                            <div className="text-[10px] text-slate-400 truncate mt-0.5" title={adj.notes}>
                              Note: {adj.notes}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Added By */}
                      {visibleColumns.addedBy && (
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {adj.adjustedBy || 'System Admin'}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>

              {/* Totals Footer */}
              {paginatedAdjustments.length > 0 && (
                <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-700 text-slate-200">
                  <tr>
                    {visibleColumns.action && <td className="py-3.5 px-4 sticky left-0 bg-slate-950">Total:</td>}
                    {visibleColumns.date && <td className="py-3.5 px-4">-</td>}
                    {visibleColumns.referenceNo && (
                      <td className="py-3.5 px-4 text-amber-400 font-mono">
                        {filteredAdjustments.length} Record(s)
                      </td>
                    )}
                    {visibleColumns.location && <td className="py-3.5 px-4">-</td>}
                    {visibleColumns.adjustmentType && <td className="py-3.5 px-4">-</td>}
                    {visibleColumns.totalAmount && (
                      <td className="py-3.5 px-4 text-right text-white">
                        {formatMoney(kpiMetrics.totalStockAdjustment)}
                      </td>
                    )}
                    {visibleColumns.totalAmountRecovered && (
                      <td className="py-3.5 px-4 text-right text-emerald-400">
                        {formatMoney(kpiMetrics.totalAmountRecovered)}
                      </td>
                    )}
                    {visibleColumns.netLoss && (
                      <td className="py-3.5 px-4 text-right text-rose-400">
                        {formatMoney(kpiMetrics.netLoss)}
                      </td>
                    )}
                    {visibleColumns.reason && <td className="py-3.5 px-4">-</td>}
                    {visibleColumns.addedBy && <td className="py-3.5 px-4">-</td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 text-white px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none"
              >
                <option value={10}>10 entries</option>
                <option value={25}>25 entries</option>
                <option value={50}>50 entries</option>
                <option value={100}>100 entries</option>
                <option value={-1}>All entries</option>
              </select>
              <span>
                Showing {sortedAdjustments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                {pageSize === -1 ? sortedAdjustments.length : Math.min(currentPage * pageSize, sortedAdjustments.length)} of{' '}
                {sortedAdjustments.length} records
              </span>
            </div>

            {pageSize !== -1 && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-semibold">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Product-Wise Adjustment Breakdown */}
      {activeTab === 'product_summary' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Product-Centric Adjustment Breakdown</h3>
              <p className="text-xs text-slate-400">Aggregated quantities and cost impact per item across all selected stock adjustments</p>
            </div>
            <div className="text-xs font-semibold text-amber-400">
              {productWiseBreakdown.length} Affected Product(s)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-300 font-semibold border-b border-slate-800">
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Total Qty Adjusted</th>
                  <th className="py-3.5 px-4 text-right">Unit Purchase Cost</th>
                  <th className="py-3.5 px-4 text-right">Total Adjusted Value</th>
                  <th className="py-3.5 px-4">Reasons Breakdown</th>
                  <th className="py-3.5 px-4 text-center">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {productWiseBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No product adjustments found in the selected range.
                    </td>
                  </tr>
                ) : (
                  productWiseBreakdown.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                        {item.sku}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {item.productName}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-200">
                        {item.totalQuantityAdjusted} unit(s)
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-300">
                        {formatMoney(item.unitCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-400">
                        {formatMoney(item.totalValue)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(item.adjustmentReasons).map(([r, count]) => (
                            <span
                              key={r}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-amber-300 border border-slate-700 capitalize"
                            >
                              {r.replace('_', ' ')}: {count}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-300">
                        {item.currentStock}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Detail Modal */}
      {selectedAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-amber-400">
                    {selectedAdjustment.referenceNo}
                  </span>
                  {selectedAdjustment.adjustmentType === 'abnormal' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                      Abnormal Adjustment
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                      Normal Adjustment
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Adjusted on {selectedAdjustment.date} at{' '}
                  {locations.find((l) => l.id === selectedAdjustment.locationId)?.name || 'Main Store'}
                </p>
              </div>

              <button
                onClick={() => setSelectedAdjustment(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-bold text-white">
                  {locations.find((l) => l.id === selectedAdjustment.locationId)?.name || 'Main Store'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Adjusted By</span>
                <span className="font-bold text-white">{selectedAdjustment.adjustedBy || 'Admin'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Total Items</span>
                <span className="font-bold text-amber-400">
                  {selectedAdjustment.items.reduce((sum, i) => sum + (i.quantity || 1), 0)} unit(s)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Amount Recovered</span>
                <span className="font-bold text-emerald-400">
                  {formatMoney(selectedAdjustment.totalAmountRecovered || 0)}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                Adjusted Products List
              </h4>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Reason / Type</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Purchase Price</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedAdjustment.items.map((item, idx) => {
                      const cost = item.unitCost || 0;
                      const qty = item.quantity || 1;
                      const subtotal = item.subtotal !== undefined ? item.subtotal : cost * qty;
                      return (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            <div>{item.productName}</div>
                            {item.sku && <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-amber-300 border border-slate-700 capitalize">
                              {item.type || 'damage'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-200">
                            {qty}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300 font-medium">
                            {formatMoney(cost)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                            {formatMoney(subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Reasons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block">Reason & Notes</span>
                <p className="text-slate-300 italic">
                  "{selectedAdjustment.reason || 'No description provided'}"
                </p>
                {selectedAdjustment.notes && (
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="font-semibold text-slate-300">Internal Audit Note:</span> {selectedAdjustment.notes}
                  </p>
                )}
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Stock Adjustment Value:</span>
                  <span className="font-bold text-white">
                    {formatMoney(
                      selectedAdjustment.totalAmount ||
                        selectedAdjustment.items.reduce((s, i) => s + (i.unitCost || 0) * (i.quantity || 1), 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Recovered (Insurance/Salvage):</span>
                  <span className="font-bold text-emerald-400">
                    {formatMoney(selectedAdjustment.totalAmountRecovered || 0)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                  <span className="font-bold text-slate-200">Net Loss on Adjustment:</span>
                  <span className="font-bold text-rose-400">
                    {formatMoney(
                      Math.max(
                        0,
                        (selectedAdjustment.totalAmount ||
                          selectedAdjustment.items.reduce((s, i) => s + (i.unitCost || 0) * (i.quantity || 1), 0)) -
                          (selectedAdjustment.totalAmountRecovered || 0)
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border border-slate-700"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                <span>Print Slip</span>
              </button>

              <button
                onClick={() => setSelectedAdjustment(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Add Stock Adjustment Modal */}
      {isAddModalOpen && (
        <StockAdjustmentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};
