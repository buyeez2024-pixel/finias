import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { Product, Transaction, ProductLot } from '../../types/erp';
import { formatCurrency } from '../../utils/formatters';
import { ExportButtons } from '../common/ExportButtons';
import {
  History,
  Search,
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  AlertTriangle,
  RotateCcw,
  Printer,
  Download,
  Package,
  Boxes,
  TrendingUp,
  TrendingDown,
  Building2,
  CheckCircle2,
  Clock,
  Tag,
  Eye,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Columns, ChevronDown, ChevronUp,
  X,
  ShieldCheck,
  Lock,
  FileText,
  User,
  Copy,
  Check,
} from 'lucide-react';

interface ProductHistoryViewProps {
  initialProductId?: string;
  onCloseModal?: () => void;
  isModal?: boolean;
}

export interface StockMovementRecord {
  id: string;
  date: string;
  type: 'opening' | 'purchase' | 'sale' | 'pos_sale' | 'sale_return' | 'purchase_return' | 'adjustment' | 'transfer_in' | 'transfer_out';
  typeLabel: string;
  refNo: string;
  location: string;
  locationId?: string;
  contactName: string;
  qtyIn: number;
  qtyOut: number;
  qtyChange: number;
  unitCost: number;
  unitPrice: number;
  totalValue: number;
  runningBalance: number;
  lotNumber?: string;
  notes: string;
  userName?: string;
  status?: string;
}

export interface ProductHistoryTableColumnVisibility {
  date: boolean;
  type: boolean;
  refNo: boolean;
  location: boolean;
  contact: boolean;
  in: boolean;
  out: boolean;
  balance: boolean;
  lot: boolean;
  notes: boolean;
}

const DEFAULT_HISTORY_COLUMN_VISIBILITY: ProductHistoryTableColumnVisibility = {
  date: true,
  type: true,
  refNo: true,
  location: true,
  contact: true,
  in: true,
  out: true,
  balance: true,
  lot: true,
  notes: true,
};
const HISTORY_COLUMN_STORAGE_KEY = 'ultimate_erp_history_columns';

export const ProductHistoryView: React.FC<ProductHistoryViewProps> = ({
  initialProductId,
  onCloseModal,
  isModal = false,
}) => {
  const {
    products,
    locations,
    transactions,
    stockAdjustments,
    stockTransfers,
    customers,
    suppliers,
    settings,
    inventorySubTab,
    setInventorySubTab,
    currentUser,
    showFlashNotification,
  } = useErp();

  const isLight = settings.themeMode === 'light' || (!settings.themeMode && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));

  const isAdminOrManager = useMemo(() => {
    if (!currentUser) return true;
    const role = currentUser.role;
    return role === 'supreme_admin' || role === 'admin' || role === 'manager' || role === 'inventory_manager';
  }, [currentUser]);

  const [columnVisibility, setColumnVisibility] = useState<ProductHistoryTableColumnVisibility>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_COLUMN_STORAGE_KEY);
      if (saved) return { ...DEFAULT_HISTORY_COLUMN_VISIBILITY, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_HISTORY_COLUMN_VISIBILITY;
  });
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const toggleColumn = (key: keyof ProductHistoryTableColumnVisibility) => {
    if (!isAdminOrManager) {
      showFlashNotification('Access Restricted: Only Administrators and Store Managers can configure table column visibility.', 'error');
      return;
    }
    const newVisibility = { ...columnVisibility, [key]: !columnVisibility[key] };
    setColumnVisibility(newVisibility);
    localStorage.setItem(HISTORY_COLUMN_STORAGE_KEY, JSON.stringify(newVisibility));
  };

  const handleApplyPreset = (preset: 'all' | 'standard' | 'compact' | 'reset') => {
    if (!isAdminOrManager) {
      showFlashNotification('Access Restricted: Only Administrators and Store Managers can configure table column visibility.', 'error');
      return;
    }
    let newVisibility: ProductHistoryTableColumnVisibility;
    if (preset === 'all') {
      newVisibility = { date: true, type: true, refNo: true, location: true, contact: true, in: true, out: true, balance: true, lot: true, notes: true };
    } else if (preset === 'standard') {
      newVisibility = { date: true, type: true, refNo: true, location: true, contact: true, in: true, out: true, balance: true, lot: false, notes: false };
    } else if (preset === 'compact') {
      newVisibility = { date: true, type: true, refNo: true, location: false, contact: false, in: true, out: true, balance: true, lot: false, notes: false };
    } else {
      newVisibility = { ...DEFAULT_HISTORY_COLUMN_VISIBILITY };
    }
    setColumnVisibility(newVisibility);
    localStorage.setItem(HISTORY_COLUMN_STORAGE_KEY, JSON.stringify(newVisibility));
  };

  // Selected product
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    if (initialProductId && products.some((p) => p.id === initialProductId)) {
      return initialProductId;
    }
    return '';
  });

  const [productSearchText, setProductSearchText] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  // Filter States
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days' | 'this_month' | 'this_year'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Notes viewing and inspection state
  const [activeNoteModal, setActiveNoteModal] = useState<StockMovementRecord | null>(null);
  const [copiedNote, setCopiedNote] = useState<boolean>(false);
  const [expandedNoteIds, setExpandedNoteIds] = useState<Record<string, boolean>>({});

  const filteredSearchProducts = useMemo(() => {
    const clean = productSearchText.trim().toLowerCase();
    if (!clean) return products;
    return products.filter((p) => 
      p.name?.toLowerCase().includes(clean) ||
      p.sku?.toLowerCase().includes(clean) ||
      p.brand?.toLowerCase().includes(clean) ||
      p.category?.toLowerCase().includes(clean)
    );
  }, [products, productSearchText]);

  const currentProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Compute all movement transactions for the selected product
  const allMovements = useMemo(() => {
    if (!currentProduct) return [];

    const list: StockMovementRecord[] = [];
    const pId = currentProduct.id;
    const unit = currentProduct.unit || 'Pcs';

    // 1. Opening Stock from Product Lots or Initial Setup
    // First identify all non-draft purchase transactions for this product so we do not duplicate purchase lots
    const productPurchaseTxns = transactions.filter(
      (t) => t.type === 'purchase' && t.status !== 'draft' && t.items?.some((i: any) => i.productId === pId)
    );

    if (currentProduct.lots && currentProduct.lots.length > 0) {
      currentProduct.lots.forEach((lot, idx) => {
        // A lot belongs to a purchase order if marked with source 'purchase', id starts with 'lot_pur_', or has purchaseId
        const isPurchaseLot =
          lot.source === 'purchase' ||
          (typeof lot.id === 'string' && lot.id.startsWith('lot_pur_')) ||
          Boolean(lot.purchaseId);

        // Calculate total purchased units for this specific lot from inward purchase transactions
        const purchasedQtyInThisLot = productPurchaseTxns.reduce((sum: number, t: any) => {
          const item = t.items?.find(
            (i: any) =>
              i.productId === pId &&
              (i.lotId === lot.id ||
                (lot.id && i.lotId === lot.id) ||
                (lot.lotNumber && (i.lotNumber?.toLowerCase() === lot.lotNumber.toLowerCase() || t.lotNumber?.toLowerCase() === lot.lotNumber.toLowerCase())))
          );
          return sum + (item ? Number(item.quantity || 0) : 0);
        }, 0);

        // Check if this lot is linked to a purchase transaction and wasn't explicitly flagged as opening stock
        const isLinkedToPurchase =
          purchasedQtyInThisLot > 0 &&
          lot.source !== 'opening_stock' &&
          !(typeof lot.id === 'string' && (lot.id.startsWith('lot_op_') || lot.id.startsWith('lot_init_')));

        // If the lot was created exclusively by a purchase order, skip it from Opening Stock.
        // Section 2 will record the Purchase Inward transaction directly, preventing double-counting.
        if (isPurchaseLot || isLinkedToPurchase) {
          return;
        }

        // For opening stock lots: calculate opening quantity (subtracting any subsequent purchase inwards allocated to this lot)
        const recordedInitial = Number(lot.initialStock);
        const recordedCurrent = Number(lot.currentStock) || 0;

        let initialQty = 0;
        if (!isNaN(recordedInitial) && recordedInitial > 0) {
          initialQty = purchasedQtyInThisLot > 0 && recordedInitial > purchasedQtyInThisLot
            ? recordedInitial - purchasedQtyInThisLot
            : (purchasedQtyInThisLot >= recordedInitial ? 0 : recordedInitial);
        } else {
          initialQty = Math.max(0, recordedCurrent - purchasedQtyInThisLot);
        }

        if (initialQty > 0) {
          const lotCreatedDate = lot.createdAt
            ? lot.createdAt.slice(0, 10)
            : (lot.createdDate
              ? lot.createdDate.slice(0, 10)
              : (currentProduct.createdAt ? currentProduct.createdAt.slice(0, 10) : '2026-01-01'));

          list.push({
            id: `opening_lot_${lot.id || idx}`,
            date: lotCreatedDate,
            type: 'opening',
            typeLabel: 'Opening Stock',
            refNo: lot.lotNumber || `OP-${pId.slice(0, 4)}-${idx + 1}`,
            location: 'Initial Warehouse',
            contactName: 'Inventory Initialization',
            qtyIn: initialQty,
            qtyOut: 0,
            qtyChange: initialQty,
            unitCost: lot.costPrice || currentProduct.costPrice || 0,
            unitPrice: lot.sellingPrice || currentProduct.sellingPrice || 0,
            totalValue: initialQty * (lot.costPrice || currentProduct.costPrice || 0),
            runningBalance: 0, // computed below
            lotNumber: lot.lotNumber,
            notes: 'Opening stock lot initialization',
            userName: 'System Admin',
            status: 'Completed',
          });
        }
      });
    }

    // Fallback: If no opening stock movements exist yet, check direct opening stock on product
    const hasOpeningMovement = list.some((m) => m.type === 'opening');
    if (!hasOpeningMovement) {
      const directOpening = Number(
        currentProduct.openingStock ??
        currentProduct.initialLotStock ??
        (currentProduct.variations?.reduce((s: number, v: any) => s + Number(v.openingStock || 0), 0) || 0)
      );
      if (directOpening > 0) {
        list.push({
          id: `opening_prod_${pId}`,
          date: currentProduct.createdAt ? currentProduct.createdAt.slice(0, 10) : '2026-01-01',
          type: 'opening',
          typeLabel: 'Opening Stock',
          refNo: `OP-${pId.slice(0, 6).toUpperCase()}`,
          location: 'Initial Warehouse',
          contactName: 'Inventory Initialization',
          qtyIn: directOpening,
          qtyOut: 0,
          qtyChange: directOpening,
          unitCost: currentProduct.costPrice || 0,
          unitPrice: currentProduct.sellingPrice || 0,
          totalValue: directOpening * (currentProduct.costPrice || 0),
          runningBalance: 0,
          notes: 'Product opening stock allocation',
          userName: 'System Admin',
          status: 'Completed',
        });
      }
    }

    // 2. Transactions: Purchases, Sales, Returns
    transactions.forEach((txn) => {
      if (txn.status === 'draft') return;

      const item = txn.items?.find((i) => i.productId === pId);
      if (!item) return;

      const loc = locations.find((l) => l.id === txn.locationId)?.name || 'Main Location';
      const cust = txn.contactId ? customers.find((c) => c.id === txn.contactId)?.name : '';
      const supp = txn.contactId ? suppliers.find((s) => s.id === txn.contactId)?.name : '';
      const party = cust || supp || txn.customerName || txn.supplierName || 'Walk-in Party';

      const qty = item.quantity || 0;
      const cost = item.unitCost || item.unitPrice || currentProduct.costPrice || 0;
      const price = item.unitPrice || currentProduct.sellingPrice || 0;

      if (txn.type === 'purchase') {
        list.push({
          id: `txn_${txn.id}`,
          date: txn.date,
          type: 'purchase',
          typeLabel: 'Purchase Inward',
          refNo: txn.invoiceNo || `PUR-${txn.id.slice(-6)}`,
          location: loc,
          locationId: txn.locationId,
          contactName: party,
          qtyIn: qty,
          qtyOut: 0,
          qtyChange: qty,
          unitCost: cost,
          unitPrice: price,
          totalValue: qty * cost,
          runningBalance: 0,
          lotNumber: item.lotNumber || item.lotId,
          notes: txn.notes || 'Goods receipt from supplier purchase invoice',
          userName: txn.createdBy || 'Purchase Dept',
          status: txn.paymentStatus || 'Paid',
        });
      } else if (txn.type === 'purchase_return') {
        list.push({
          id: `txn_${txn.id}`,
          date: txn.date,
          type: 'purchase_return',
          typeLabel: 'Purchase Return (Out)',
          refNo: txn.invoiceNo || `PR-${txn.id.slice(-6)}`,
          location: loc,
          locationId: txn.locationId,
          contactName: party,
          qtyIn: 0,
          qtyOut: qty,
          qtyChange: -qty,
          unitCost: cost,
          unitPrice: price,
          totalValue: qty * cost,
          runningBalance: 0,
          lotNumber: item.lotNumber || item.lotId,
          notes: txn.notes || 'Debit note / Supplier return',
          userName: txn.createdBy || 'Inventory',
          status: 'Returned',
        });
      } else if (txn.type === 'sale') {
        const isPos = txn.isPosSale || txn.paymentMethod === 'cash';
        list.push({
          id: `txn_${txn.id}`,
          date: txn.date,
          type: isPos ? 'pos_sale' : 'sale',
          typeLabel: isPos ? 'POS Terminal Sale' : 'Sales Invoice',
          refNo: txn.invoiceNo || `INV-${txn.id.slice(-6)}`,
          location: loc,
          locationId: txn.locationId,
          contactName: party,
          qtyIn: 0,
          qtyOut: qty,
          qtyChange: -qty,
          unitCost: currentProduct.costPrice || 0,
          unitPrice: price,
          totalValue: qty * price,
          runningBalance: 0,
          lotNumber: item.lotNumber || item.lotId,
          notes: txn.notes || (isPos ? 'Retail POS checkout' : 'Standard B2B / B2C Sale'),
          userName: txn.cashierName || txn.createdBy || 'Sales Staff',
          status: txn.paymentStatus || 'Completed',
        });
      } else if (txn.type === 'sell_return' || (txn as any).type === 'sale_return') {
        list.push({
          id: `txn_${txn.id}`,
          date: txn.date,
          type: 'sale_return',
          typeLabel: 'Sales Return (In)',
          refNo: txn.invoiceNo || `SR-${txn.id.slice(-6)}`,
          location: loc,
          locationId: txn.locationId,
          contactName: party,
          qtyIn: qty,
          qtyOut: 0,
          qtyChange: qty,
          unitCost: currentProduct.costPrice || 0,
          unitPrice: price,
          totalValue: qty * price,
          runningBalance: 0,
          lotNumber: item.lotNumber || item.lotId,
          notes: txn.notes || 'Restocked from customer return credit note',
          userName: txn.createdBy || 'Customer Service',
          status: 'Restocked',
        });
      }
    });

    // 3. Stock Adjustments
    stockAdjustments.forEach((adj) => {
      const item = adj.items?.find((i) => i.productId === pId);
      if (!item) return;

      const loc = locations.find((l) => l.id === adj.locationId)?.name || 'Store';
      const isAddition = item.type === 'found' || item.type === 'recovered' || item.type === 'addition';
      const qty = item.quantity || 0;
      const cost = item.unitCost || currentProduct.costPrice || 0;

      list.push({
        id: `adj_${adj.id}`,
        date: adj.date,
        type: 'adjustment',
        typeLabel: `Adjustment (${item.type.toUpperCase()})`,
        refNo: adj.referenceNo || `ADJ-${adj.id.slice(-6)}`,
        location: loc,
        locationId: adj.locationId,
        contactName: `Inventory Audit (${adj.adjustedBy || 'Auditor'})`,
        qtyIn: isAddition ? qty : 0,
        qtyOut: !isAddition ? qty : 0,
        qtyChange: isAddition ? qty : -qty,
        unitCost: cost,
        unitPrice: currentProduct.sellingPrice || 0,
        totalValue: qty * cost,
        runningBalance: 0,
        lotNumber: (item as any).lotNumber,
        notes: adj.reason || `Stock audit adjustment: ${item.type}`,
        userName: adj.adjustedBy || 'Auditor',
        status: 'Audited',
      });
    });

    // 4. Stock Transfers
    stockTransfers.forEach((trf) => {
      const item = trf.items?.find((i) => i.productId === pId);
      if (!item) return;

      const fromLoc = locations.find((l) => l.id === trf.fromLocationId)?.name || 'Branch A';
      const toLoc = locations.find((l) => l.id === trf.toLocationId)?.name || 'Branch B';
      const qty = item.quantity || 0;
      const cost = item.unitCost || currentProduct.costPrice || 0;

      list.push({
        id: `trf_${trf.id}`,
        date: trf.date,
        type: 'transfer_out',
        typeLabel: 'Branch Transfer',
        refNo: trf.referenceNo || `TRF-${trf.id.slice(-6)}`,
        location: `${fromLoc} → ${toLoc}`,
        locationId: trf.fromLocationId,
        contactName: `Inter-Branch: ${toLoc}`,
        qtyIn: 0,
        qtyOut: qty,
        qtyChange: -qty,
        unitCost: cost,
        unitPrice: currentProduct.sellingPrice || 0,
        totalValue: qty * cost,
        runningBalance: 0,
        lotNumber: (item as any).lotNumber,
        notes: trf.notes || `Transferred from ${fromLoc} to ${toLoc}`,
        userName: (trf as any).transferredBy || 'Logistics Staff',
        status: trf.status === 'completed' ? 'Delivered' : 'In Transit',
      });
    });

    // Sort chronologically ascending to accurately calculate Running Stock Balance
    list.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      if (a.type === 'opening' && b.type !== 'opening') return -1;
      if (b.type === 'opening' && a.type !== 'opening') return 1;
      return 0;
    });

    let running = 0;
    const computed = list.map((record) => {
      running += record.qtyChange;
      return {
        ...record,
        runningBalance: running,
      };
    });

    // Return reversed (newest first) for UI display
    return computed.reverse();
  }, [currentProduct, transactions, stockAdjustments, stockTransfers, locations, customers, suppliers]);

  // Filtered movements based on user filters
  const filteredMovements = useMemo(() => {
    return allMovements.filter((m) => {
      // Location Filter
      if (locationFilter !== 'all' && m.locationId && m.locationId !== locationFilter) {
        return false;
      }

      // Transaction Type Filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'purchases' && m.type !== 'purchase') return false;
        if (typeFilter === 'sales' && m.type !== 'sale' && m.type !== 'pos_sale') return false;
        if (typeFilter === 'returns' && m.type !== 'sale_return' && m.type !== 'purchase_return') return false;
        if (typeFilter === 'adjustments' && m.type !== 'adjustment') return false;
        if (typeFilter === 'transfers' && m.type !== 'transfer_out' && m.type !== 'transfer_in') return false;
        if (typeFilter === 'opening' && m.type !== 'opening') return false;
      }

      // Date Filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const mDate = new Date(m.date);
        if (dateFilter === 'today') {
          if (mDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === '7days') {
          const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (mDate < past7) return false;
        } else if (dateFilter === '30days') {
          const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (mDate < past30) return false;
        } else if (dateFilter === 'this_month') {
          if (mDate.getMonth() !== now.getMonth() || mDate.getFullYear() !== now.getFullYear()) return false;
        } else if (dateFilter === 'this_year') {
          if (mDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = m.refNo.toLowerCase().includes(q);
        const matchContact = m.contactName.toLowerCase().includes(q);
        const matchLoc = m.location.toLowerCase().includes(q);
        const matchNotes = m.notes.toLowerCase().includes(q);
        const matchLot = (m.lotNumber || '').toLowerCase().includes(q);
        if (!matchRef && !matchContact && !matchLoc && !matchNotes && !matchLot) return false;
      }

      return true;
    });
  }, [allMovements, locationFilter, typeFilter, dateFilter, searchQuery]);

  // Aggregate Metrics
  const summaryMetrics = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let totalPurchased = 0;
    let totalSold = 0;
    let totalAdjusted = 0;

    allMovements.forEach((m) => {
      totalIn += m.qtyIn;
      totalOut += m.qtyOut;
      if (m.type === 'purchase') totalPurchased += m.qtyIn;
      if (m.type === 'sale' || m.type === 'pos_sale') totalSold += m.qtyOut;
      if (m.type === 'adjustment') totalAdjusted += m.qtyChange;
    });

    const currentStock = currentProduct?.currentStock ?? 0;
    const costPrice = currentProduct?.costPrice ?? 0;
    const sellingPrice = currentProduct?.sellingPrice ?? 0;
    const valuation = currentStock * costPrice;

    return {
      totalIn,
      totalOut,
      totalPurchased,
      totalSold,
      totalAdjusted,
      currentStock,
      valuation,
      costPrice,
      sellingPrice,
    };
  }, [allMovements, currentProduct]);

  // Export Data Preparation for Unified ExportButtons
  const exportHeaders = [
    'Date & Time',
    'Transaction Type',
    'Ref / Invoice No.',
    'Location',
    'Party / Contact',
    'In (+)',
    'Out (-)',
    'Running Balance',
    'Lot / Batch',
    'User / Cashier',
    'Notes',
  ];

  const exportKeys = [
    'date',
    'type',
    'refNo',
    'location',
    'contact',
    'qtyIn',
    'qtyOut',
    'runningBalance',
    'lot',
    'user',
    'notes',
  ];

  const exportMovementsData = useMemo(() => {
    if (!currentProduct) return [];
    return filteredMovements.map((m) => ({
      date: m.date,
      type: m.typeLabel,
      refNo: m.refNo,
      location: m.location,
      contact: m.contactName || '—',
      qtyIn: m.qtyIn > 0 ? m.qtyIn : 0,
      qtyOut: m.qtyOut > 0 ? m.qtyOut : 0,
      runningBalance: m.runningBalance,
      lot: m.lotNumber || '—',
      user: m.userName || 'System',
      notes: m.notes || '',
    }));
  }, [filteredMovements, currentProduct]);

  const handlePrint = () => {
    window.print();
  };

  const accountingMethod = (settings.accountingMethod || 'fifo').toUpperCase();

  return (
    <div className={`space-y-6 max-w-7xl mx-auto ${isModal ? 'p-0' : 'p-6 animate-fadeIn'}`}>
      {/* Top Header Card */}
      {!isModal && (
        <div className={`p-6 rounded-2xl border transition-colors shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">Product History</h1>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  accountingMethod === 'FIFO'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {accountingMethod} Depletion
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Complete audit trail of stock movements, lot tracking, purchase entries, and POS checkout deductions.
              </p>
            </div>
          </div>

          {/* Header Action Controls: Premium Unified Export Panel & Print */}
          <div className="flex items-center flex-wrap gap-2.5">
            <ExportButtons
              headers={exportHeaders}
              keys={exportKeys}
              data={exportMovementsData}
              filename={`product_history_${currentProduct ? currentProduct.sku : 'all'}`}
              title={`Product Movement Ledger - ${currentProduct ? `${currentProduct.name} (${currentProduct.sku})` : 'All Products'}`}
              isLight={isLight}
            />
            <button
              onClick={handlePrint}
              disabled={!currentProduct}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              } ${!currentProduct ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Print Product History Ledger"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-500" />
              <span>Print</span>
            </button>
          </div>
        </div>
      )}

      {/* Product Information Details & Key Metrics Ribbon */}
      {currentProduct && (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Product Identity Box */}
        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          {currentProduct.image ? (
            <img
              src={currentProduct.image}
              alt={currentProduct.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
              <Package className="w-7 h-7" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {currentProduct.category || 'General'} • {currentProduct.brand || 'Standard'}
            </span>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate" title={currentProduct.name}>
              {currentProduct.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 font-mono text-xs">
              <span className={`px-1.5 py-0.5 rounded font-bold ${
                isLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800'
              }`}>
                {currentProduct.sku}
              </span>
              <span className="text-slate-400 text-[11px]">{currentProduct.unit || 'Pcs'}</span>
            </div>
          </div>
        </div>

        {/* Current Stock Metric */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Current Stock on Hand</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${
                summaryMetrics.currentStock <= (currentProduct.alertQuantity || 5)
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {summaryMetrics.currentStock}
              </span>
              <span className="text-xs font-bold text-slate-500">{currentProduct.unit || 'Pcs'}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Alert Min: {currentProduct.alertQuantity || 5} {currentProduct.unit || 'Pcs'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            summaryMetrics.currentStock <= (currentProduct.alertQuantity || 5)
              ? 'bg-rose-500/10 text-rose-500'
              : 'bg-emerald-500/10 text-emerald-500'
          }`}>
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Total Inward vs Outward */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cumulative Movements</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-mono font-bold">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" /> +{summaryMetrics.totalIn} In
              </span>
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> -{summaryMetrics.totalOut} Out
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Net Sold: {summaryMetrics.totalSold} | Purchases: {summaryMetrics.totalPurchased}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Pricing & Valuation */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Stock Valuation</p>
            <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              {formatCurrency(summaryMetrics.valuation, settings)}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
              <span>Cost: {formatCurrency(summaryMetrics.costPrice, settings)}</span>
              <span>•</span>
              <span>Sale: {formatCurrency(summaryMetrics.sellingPrice, settings)}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>
      )}

      {/* Active Lots Breakdown Card */}
      {currentProduct && currentProduct.lots && currentProduct.lots.length > 0 && (
        <div className={`p-5 rounded-2xl border space-y-4 shadow-sm relative overflow-hidden ${
          isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900 border-slate-800'
        }`}>
          {/* Subtle Background Accent Gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  Active Lot Inventory Layers
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                    {currentProduct.lots.filter(l => (l.currentStock || 0) > 0).length} / {currentProduct.lots.length} Active
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Real-time FIFO queue tracking individual purchase layers & initial quantities.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800/40 self-start sm:self-center">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                Auto-depleted via <span className="font-bold text-indigo-600 dark:text-indigo-400">{accountingMethod}</span> rules on sales
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentProduct.lots.map((lot, idx) => {
              const isDepleted = (lot.currentStock || 0) <= 0;
              const activeCount = currentProduct.lots.filter((l, i) => i < idx && (l.currentStock || 0) > 0).length;
              const isNextToDeduct = !isDepleted && activeCount === 0;
              const isSecondToDeduct = !isDepleted && activeCount === 1;

              // Progress bar math
              const initial = lot.initialStock || lot.currentStock || 1;
              const current = lot.currentStock || 0;
              const pct = Math.min(100, Math.max(0, Math.round((current / initial) * 100)));

              return (
                <div
                  key={lot.id || idx}
                  className={`p-4 rounded-xl border text-xs transition-all duration-200 relative group flex flex-col justify-between ${
                    isLight
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/30'
                      : isDepleted
                      ? 'bg-slate-900 border-slate-750 ring-1 ring-slate-800 shadow-md text-slate-100'
                      : 'bg-[#0f241a] border-emerald-600 ring-2 ring-emerald-500/35 shadow-lg shadow-emerald-950/40 text-emerald-50'
                  }`}
                >
                  <div>
                    {/* Lot Header */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Tag className={`w-3.5 h-3.5 ${isDepleted ? (isLight ? 'text-slate-400' : 'text-slate-300') : (isLight ? 'text-emerald-500' : 'text-emerald-400')}`} />
                        <span className={`font-mono font-black text-xs tracking-tight ${
                          isDepleted
                            ? isLight ? 'text-slate-500' : 'text-slate-200'
                            : isLight ? 'text-slate-900' : 'text-emerald-300'
                        }`}>
                          {lot.lotNumber}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isDepleted ? (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-extrabold ${
                            isLight
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-slate-800 text-slate-200 border border-slate-700'
                          }`}>
                            Depleted
                          </span>
                        ) : isNextToDeduct ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-full uppercase font-black bg-emerald-600 text-white tracking-wider animate-pulse">
                            Deducting Now
                          </span>
                        ) : isSecondToDeduct ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-full uppercase font-black bg-emerald-500 text-white tracking-wider">
                            Next Layer
                          </span>
                        ) : (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold ${
                            isLight
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            Reserve
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Meter & Bar */}
                    <div className="space-y-1.5 my-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={isDepleted ? (isLight ? 'text-slate-500' : 'text-slate-300') : (isLight ? 'text-slate-600' : 'text-slate-200 font-bold')}>
                          Stock Level
                        </span>
                        <span className={`font-mono font-bold ${
                          isDepleted
                            ? isLight ? 'text-slate-500' : 'text-slate-300'
                            : isLight ? 'text-slate-800' : 'text-white'
                        }`}>
                          {pct}% ({current} / {initial})
                        </span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                        isLight ? 'bg-slate-200/60' : 'bg-slate-850'
                      }`}>
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            isDepleted
                              ? isLight ? 'bg-slate-300' : 'bg-slate-600'
                              : pct <= 20
                              ? 'bg-rose-500'
                              : pct <= 50
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stock Metrics Footer Info */}
                  <div className={`pt-2.5 border-t space-y-1 text-[10px] ${
                    isLight ? 'border-slate-200/50' : 'border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-300 font-medium'}>Purchase Date:</span>
                      <span className={`font-mono ${isLight ? 'text-slate-600' : 'text-slate-200'}`}>
                        {lot.createdDate || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-300 font-medium'}>Unit Cost:</span>
                      <span className={`font-mono font-bold ${
                        isDepleted
                          ? isLight ? 'text-slate-500' : 'text-slate-300'
                          : isLight ? 'text-emerald-600' : 'text-emerald-300 font-extrabold'
                      }`}>
                        {formatCurrency(lot.costPrice || currentProduct.costPrice, settings)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-300 font-medium'}>Initial Stock:</span>
                      <span className={`font-mono ${isLight ? 'text-slate-600' : 'text-slate-200'}`}>
                        {initial} {currentProduct.unit || 'Pcs'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2-Column Controls: Column Visibility (Column 1) and Product Selection (Column 2) */}
      <div className={`rounded-2xl border overflow-visible shadow-sm transition-colors duration-300 mb-4 animate-in fade-in slide-in-from-top-2 duration-150 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
        <div className={`grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b ${
          isLight ? 'bg-slate-50/70 border-slate-200 divide-slate-200' : 'bg-slate-950/80 border-slate-800 divide-slate-800'
        }`}>
          {/* Column 1: Column Visibility */}
          <div className="p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border shrink-0 ${
                    isLight ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-indigo-600/15 text-indigo-400 border-indigo-500/20'
                  }`}>
                    <Columns className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      <span>Column Visibility</span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                  }`}>
                    {Object.values(columnVisibility).filter(Boolean).length} of 10 Visible
                  </span>
                  {isAdminOrManager ? (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${
                      isLight 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}>
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>Admin</span>
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${
                      isLight 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              </div>

              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Toggle ledger table columns, apply quick presets, or customize visible fields.
              </p>
            </div>

            {/* Column Presets & Toggle Button */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Presets:
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('standard')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('compact')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('reset')}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    isLight ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200' : 'bg-rose-950/50 hover:bg-rose-950 text-rose-400 border-rose-900/50'
                  }`}
                  title="Reset to default columns"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowColumnConfig(!showColumnConfig)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  showColumnConfig 
                    ? (isLight ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white')
                    : (isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700')
                }`}
              >
                {showColumnConfig ? (
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

          {/* Column 2: Product Selection Drop Down */}
          <div className={`p-4 flex flex-col justify-between gap-3 transition-colors duration-200 ${
            isLight && !currentProduct ? 'bg-amber-50/40' : ''
          }`}>
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border shrink-0 transition-colors ${
                    isLight
                      ? (!currentProduct ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200')
                      : 'bg-emerald-600/15 text-emerald-400 border-emerald-500/20'
                  }`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      <span>Product Selection</span>
                    </h4>
                  </div>
                </div>

                {currentProduct ? (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    summaryMetrics.currentStock <= (currentProduct.alertQuantity || 5)
                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                      : isLight
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-900'
                  }`}>
                    Stock: {summaryMetrics.currentStock} {currentProduct.unit || 'Pcs'}
                  </span>
                ) : (
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 transition-colors ${
                    isLight
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-amber-500 animate-pulse' : 'bg-slate-500'}`} />
                    <span>No Products Selected</span>
                  </span>
                )}
              </div>

              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Switch between inventory products to view audit history, lot movements, and balance logs.
              </p>
            </div>

            {/* Product Selection Field with Advanced Search Input & Dropdown */}
            <div className="space-y-1.5 relative">
              <label
                className={`block text-xs font-bold flex items-center justify-between ${
                  isLight ? 'text-slate-700' : 'text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>Advance Search Product</span>
                  <span className="text-rose-500 font-normal">*</span>
                </span>
                <span className={`text-[10px] font-normal ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {products.length} Products Available
                </span>
              </label>

              <div className="relative">
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by Name, SKU, Category, Brand..."
                    value={isProductDropdownOpen ? productSearchText : (currentProduct ? `${currentProduct.sku} — ${currentProduct.name}` : '')}
                    onFocus={() => {
                      setIsProductDropdownOpen(true);
                      if (currentProduct && !productSearchText) {
                        setProductSearchText(currentProduct.name);
                      }
                    }}
                    onChange={(e) => {
                      setProductSearchText(e.target.value);
                      setIsProductDropdownOpen(true);
                    }}
                    className={`w-full text-xs font-semibold pl-9 pr-14 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 shadow-xs hover:border-slate-400'
                        : 'bg-slate-950 border-slate-700 text-white shadow-xs hover:border-slate-600'
                    }`}
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    {(selectedProductId || productSearchText) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductId('');
                          setProductSearchText('');
                          setIsProductDropdownOpen(false);
                        }}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title="Clear selection"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {isProductDropdownOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Dropdown Popover List */}
                {isProductDropdownOpen && (
                  <>
                    {/* Fixed click away overlay */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsProductDropdownOpen(false)}
                    />
                    <div className={`absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl border shadow-xl z-50 transition-all duration-150 animate-fadeIn ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-800 shadow-2xl'
                        : 'bg-slate-950 border-slate-800 text-slate-100 shadow-2xl'
                    }`}>
                      {filteredSearchProducts.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-xs italic">
                          No matching products found
                        </div>
                      ) : (
                        <div className="p-1 divide-y divide-slate-100 dark:divide-slate-800/40">
                          {filteredSearchProducts.map((p) => {
                            const isSelected = p.id === selectedProductId;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedProductId(p.id);
                                  setProductSearchText('');
                                  setIsProductDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-lg transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white font-bold'
                                    : isLight
                                    ? 'hover:bg-slate-50 text-slate-700'
                                    : 'hover:bg-slate-900 text-slate-300'
                                }`}
                              >
                                <div className="flex flex-col min-w-0 flex-1 pr-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`font-mono font-bold ${isSelected ? 'text-indigo-100' : 'text-indigo-400'}`}>
                                      {p.sku}
                                    </span>
                                    {p.brand && (
                                      <span className={isLight
                                        ? 'px-1.5 py-0.5 rounded border text-[11px] font-bold bg-indigo-50 border-indigo-200 text-indigo-900'
                                        : 'text-[9px] px-1 py-0.2 rounded border bg-slate-800 border-slate-700 text-slate-400'
                                      }>
                                        {p.brand}
                                      </span>
                                    )}
                                  </div>
                                  <span className="truncate font-semibold mt-0.5">{p.name}</span>
                                </div>
                                <div className="text-right shrink-0 flex items-center gap-2">
                                  <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                                    Stock: {p.currentStock} {p.unit || 'Pcs'}
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {showColumnConfig && (
          <div className={`border-t animate-in slide-in-from-top-2 duration-200 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800/50 bg-slate-900/50'}`}>
            {/* Column Toggles Card Grid */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {(Object.keys(columnVisibility) as Array<keyof ProductHistoryTableColumnVisibility>).map((key) => {
                const labelMap: Record<string, { label: string; desc: string }> = {
                  date: { label: 'Date & Time', desc: 'Timestamp of movement' },
                  type: { label: 'Transaction Type', desc: 'Sale, purchase, transfer' },
                  refNo: { label: 'Ref / Invoice No.', desc: 'Document tracking ID' },
                  location: { label: 'Location', desc: 'Warehouse or branch' },
                  contact: { label: 'Party / Contact', desc: 'Customer or supplier' },
                  in: { label: 'In (+)', desc: 'Incoming stock units' },
                  out: { label: 'Out (-)', desc: 'Outgoing stock units' },
                  balance: { label: 'Running Balance', desc: 'Stock level after tx' },
                  lot: { label: 'Lot / Batch', desc: 'Batch number or expiry' },
                  notes: { label: 'Notes & User', desc: 'Staff and remarks' }
                };
                const isVisible = columnVisibility[key];
                const meta = labelMap[key] || { label: key, desc: 'Table column' };

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleColumn(key)}
                    className={`flex flex-col items-start justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
                      isVisible
                        ? (isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm ring-1 ring-indigo-500/10' : 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/20')
                        : (isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' : 'bg-slate-950/60 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-800/40')
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className={`p-1 rounded-md ${
                        isVisible 
                          ? (isLight ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white') 
                          : (isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500')
                      }`}>
                        {isVisible ? <CheckCircle2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        isVisible
                          ? (isLight ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30')
                          : (isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-500 border-slate-700')
                      }`}>
                        {isVisible ? 'SHOWN' : 'HIDDEN'}
                      </span>
                    </div>
                    <div className="w-full">
                      <div className={`text-xs font-bold ${isVisible ? (isLight ? 'text-slate-800' : 'text-white') : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>
                        {meta.label}
                      </div>
                      <div className={`text-[10px] truncate mt-0.5 hidden sm:block ${isVisible ? (isLight ? 'text-slate-600' : 'text-slate-400') : (isLight ? 'text-slate-400' : 'text-slate-500')}`}>
                        {meta.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Unified Container for Filters and Table (Gap Removed) */}
      {currentProduct ? (
      <div className="shadow-sm">
        {/* Filter Toolbar */}
        <div className={`p-4 rounded-t-2xl border border-b-0 flex flex-col md:flex-row items-center justify-between gap-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by invoice, reference, party, lot, notes..."
                className={`w-full text-xs pl-9 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500'
                    : 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className={`text-xs px-3 py-2 rounded-xl border focus:outline-none cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-200'
              }`}
            >
              <option value="all">All Locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`text-xs px-3 py-2 rounded-xl border focus:outline-none cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-200'
              }`}
            >
              <option value="all">All Movement Types</option>
              <option value="purchases">Purchases Inward</option>
              <option value="sales">Sales & POS Outward</option>
              <option value="returns">Sales & Purchase Returns</option>
              <option value="adjustments">Stock Adjustments</option>
              <option value="transfers">Branch Transfers</option>
              <option value="opening">Opening Stock</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className={`text-xs px-3 py-2 rounded-xl border focus:outline-none cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-slate-200'
              }`}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
            </select>

            {/* Unified Export Panel */}
            <ExportButtons
              headers={exportHeaders}
              keys={exportKeys}
              data={exportMovementsData}
              filename={`product_history_${currentProduct.sku}`}
              title={`Product Movement Ledger - ${currentProduct.name} (${currentProduct.sku})`}
              isLight={isLight}
            />

            <button
              onClick={handlePrint}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Print Product History Ledger"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Movement Ledger Table */}
        <div className={`rounded-b-2xl border border-t-0 overflow-hidden ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead className={`uppercase text-[10px] tracking-wider border-b font-extrabold select-none ${
              isLight
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-slate-950 text-slate-200 border-slate-800'
            }`}>
              <tr>
                {columnVisibility.date && <th className="py-3.5 px-3.5 border-r border-slate-700/60 dark:border-slate-800/80 whitespace-nowrap min-w-[125px]">Date & Time</th>}
                {columnVisibility.type && <th className="py-3.5 px-3 border-r border-slate-700/60 dark:border-slate-800/80 whitespace-nowrap min-w-[135px]">Transaction Type</th>}
                {columnVisibility.refNo && <th className="py-3.5 px-3 border-r border-slate-700/60 dark:border-slate-800/80 whitespace-nowrap min-w-[120px]">Ref / Invoice No.</th>}
                {columnVisibility.location && <th className="py-3.5 px-3 border-r border-slate-700/60 dark:border-slate-800/80 whitespace-nowrap min-w-[120px]">Location</th>}
                {columnVisibility.contact && <th className="py-3.5 px-3 border-r border-slate-700/60 dark:border-slate-800/80 whitespace-nowrap min-w-[140px]">Party / Contact</th>}
                {columnVisibility.in && <th className="py-3.5 px-3 text-right border-r border-slate-700/60 dark:border-slate-800/80 whitespace-nowrap min-w-[85px]">In (+)</th>}
                {columnVisibility.out && <th className="py-3.5 px-3 text-right border-r border-slate-700/60 dark:border-slate-800/80 whitespace-nowrap min-w-[85px]">Out (-)</th>}
                {columnVisibility.balance && <th className="py-3.5 px-3 text-right font-extrabold border-r border-slate-700/60 dark:border-slate-800/80 whitespace-nowrap min-w-[110px]">Running Balance</th>}
                {columnVisibility.lot && <th className="py-3.5 px-3 border-r border-slate-700/60 dark:border-slate-800/80 whitespace-nowrap min-w-[100px]">Lot / Batch</th>}
                {columnVisibility.notes && <th className="py-3.5 px-3.5 whitespace-nowrap min-w-[250px]">Notes & User</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isLight ? 'divide-slate-200 text-slate-800' : 'divide-slate-800 text-slate-200'
            }`}>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-sm">No Stock Movements Found</p>
                    <p className="text-xs text-slate-500 mt-1">There are no movement logs matching the current filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isInward = m.qtyChange > 0;
                  const isOutward = m.qtyChange < 0;

                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850/80'
                      }`}
                    >
                      {/* Date */}
                      {columnVisibility.date && (
                        <td className="py-3.5 px-3.5 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{m.date}</span>
                          </div>
                        </td>
                      )}

                      {/* Type Badge */}
                      {columnVisibility.type && (
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              m.type === 'purchase'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : m.type === 'sale'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                                : m.type === 'pos_sale'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                                : m.type === 'sale_return'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                                : m.type === 'purchase_return'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                : m.type === 'adjustment'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : m.type === 'transfer_out' || m.type === 'transfer_in'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                                : m.type === 'opening'
                                ? 'bg-teal-100 text-teal-950 dark:bg-slate-800 dark:text-slate-300 border border-teal-300 dark:border-slate-700'
                                : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {m.typeLabel}
                          </span>
                        </td>
                      )}

                      {/* Ref No */}
                      {columnVisibility.refNo && (
                        <td className="py-3.5 px-3 font-mono font-bold whitespace-nowrap text-indigo-600 dark:text-indigo-400">
                          {m.refNo}
                        </td>
                      )}

                      {/* Location */}
                      {columnVisibility.location && (
                        <td className="py-3.5 px-3 text-xs font-semibold whitespace-nowrap text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{m.location}</span>
                          </div>
                        </td>
                      )}

                      {/* Contact / Party */}
                      {columnVisibility.contact && (
                        <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-300 max-w-[140px] truncate" title={m.contactName}>
                          {m.contactName}
                        </td>
                      )}

                      {/* Qty In */}
                      {columnVisibility.in && (
                        <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          {m.qtyIn > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                              +{m.qtyIn} {currentProduct.unit || 'Pcs'}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      {/* Qty Out */}
                      {columnVisibility.out && (
                        <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          {m.qtyOut > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded">
                              -{m.qtyOut} {currentProduct.unit || 'Pcs'}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      {/* Balance */}
                      {columnVisibility.balance && (
                        <td className="py-3.5 px-3 text-right font-mono font-black text-xs whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded font-extrabold ${
                            isLight
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-800 text-indigo-300 border border-slate-700'
                          }`}>
                            {m.runningBalance} {currentProduct.unit || 'Pcs'}
                          </span>
                        </td>
                      )}

                      {/* Lot / Batch */}
                      {columnVisibility.lot && (
                        <td className="py-3.5 px-3 font-mono text-xs whitespace-nowrap">
                          {m.lotNumber ? (
                            <span className={`px-1.5 py-0.5 rounded border text-[11px] font-bold ${
                              isLight
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                                : 'bg-indigo-950/50 border-indigo-800 text-indigo-300'
                            }`}>
                              {m.lotNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">N/A</span>
                          )}
                        </td>
                      )}

                      {/* Notes & User */}
                      {columnVisibility.notes && (
                        <td className="py-3.5 px-3.5 text-xs min-w-[250px] max-w-[340px]">
                          {m.notes ? (
                            <div className="space-y-1.5">
                              <p className={`font-medium text-slate-700 dark:text-slate-200 leading-relaxed text-xs break-words ${
                                expandedNoteIds[m.id] ? '' : 'line-clamp-2'
                              }`}>
                                {m.notes}
                              </p>
                              {m.notes.length > 60 && (
                                <div className="flex items-center gap-2 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedNoteIds((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                  >
                                    {expandedNoteIds[m.id] ? 'Show less' : 'Show full note'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveNoteModal(m)}
                                    className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                                    title="View complete note details"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>Details</span>
                                  </button>
                                </div>
                              )}
                              {m.userName && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">By:</span>
                                  <span className="text-slate-600 dark:text-slate-300 font-medium">{m.userName}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-slate-400 italic text-[11px]">
                              No notes recorded
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/80 border-slate-800 text-slate-400'
        }`}>
          <div>
            Showing <span className="font-bold text-indigo-600 dark:text-indigo-400">{filteredMovements.length}</span> recorded movement event(s)
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>Total In: <strong className="text-emerald-600 dark:text-emerald-400">+{summaryMetrics.totalIn}</strong></span>
            <span>Total Out: <strong className="text-rose-600 dark:text-rose-400">-{summaryMetrics.totalOut}</strong></span>
            <span>Net Stock: <strong className="text-slate-900 dark:text-white font-extrabold">{summaryMetrics.currentStock} {currentProduct?.unit || 'Pcs'}</strong></span>
          </div>
        </div>
      </div>
      </div>
      ) : (
        <div className={`p-10 text-center rounded-2xl border ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-900 border-slate-800 text-white shadow-sm'
        }`}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-inner">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No Products Selected</h3>
          <p className={`text-xs mt-1.5 max-w-md mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Please choose an item from the <strong className="font-semibold text-indigo-600 dark:text-indigo-400">Select Product</strong> dropdown above to view its stock movement history, lot batches, and ledger audit trail.
          </p>
          {products.length > 0 && (
            <div className="mt-6 flex items-center justify-center gap-2 flex-wrap max-w-xl mx-auto">
              <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                Quick Pick:
              </span>
              {products.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProductId(p.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-700 border-slate-200 shadow-2xs'
                      : 'bg-slate-800 hover:bg-indigo-950/50 hover:text-indigo-300 hover:border-indigo-800 text-slate-200 border-slate-700 shadow-2xs'
                  }`}
                >
                  <span>{p.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">({p.sku})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complete Note & Movement Audit Details Modal */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  isLight ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Movement Note & Audit Details</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Ref: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{activeNoteModal.refNo}</span> &bull; {activeNoteModal.typeLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveNoteModal(null)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isLight ? 'hover:bg-slate-200 text-slate-500 border-slate-200' : 'hover:bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Date & Time</span>
                  <span className="font-semibold font-mono">{activeNoteModal.date}</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Recorded By</span>
                  <span className="font-semibold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {activeNoteModal.userName || 'System'}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Location</span>
                  <span className="font-semibold">{activeNoteModal.location}</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Party / Contact</span>
                  <span className="font-semibold">{activeNoteModal.contactName || '—'}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Complete Recorded Note
                </label>
                <div className={`p-4 rounded-xl border text-xs leading-relaxed font-medium whitespace-pre-wrap select-text ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}>
                  {activeNoteModal.notes}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeNoteModal.notes);
                    setCopiedNote(true);
                    setTimeout(() => setCopiedNote(false), 2000);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {copiedNote ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNote ? 'Copied to Clipboard' : 'Copy Note'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveNoteModal(null)}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
