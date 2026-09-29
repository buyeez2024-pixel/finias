import React, { useState, useMemo, useRef } from 'react';
import { useErp } from '../../context/ErpContext';
import { ExportButtons } from '../common/ExportButtons';
import { Customer, Supplier, Transaction, PaymentMethod } from '../../types/erp';
import { formatCurrency } from '../../utils/formatters';
import {
  BookOpen,
  Calendar,
  Filter,
  Users,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Printer,
  PlusCircle,
  Search,
  CheckSquare,
  Square,
  FileText,
  DollarSign,
  Building,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  ChevronDown,
  Percent,
  Tag,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Edit,
  Trash2,
  Info,
  ExternalLink,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  ArrowRight
} from 'lucide-react';

export type LedgerEntryType =
  | 'opening_balance'
  | 'sale'
  | 'pos_sale'
  | 'purchase'
  | 'payment'
  | 'return'
  | 'advance'
  | 'ledger_discount';

export interface LedgerRow {
  id: string;
  date: string;
  referenceNo: string;
  type: LedgerEntryType;
  typeLabel: string;
  badgeColor: string;
  category: 'invoice' | 'payment' | 'return' | 'opening' | 'advance' | 'discount';
  description: string;
  notes?: string;
  paymentMethod?: string;
  debit: number;
  credit: number;
  runningBalance: number;
  balanceIndicator: 'Dr' | 'Cr' | 'Balanced';
  transactionId?: string;
  paymentEntryId?: string;
  rawTransaction?: Transaction;
  isEditable?: boolean;
}

interface ContactLedgerViewProps {
  initialContactType?: 'customer' | 'supplier';
}

export const ContactLedgerView: React.FC<ContactLedgerViewProps> = ({ initialContactType }) => {
  const {
    customers,
    suppliers,
    transactions,
    settings,
    currentUser,
    recordCustomerPayment,
    recordSupplierPayment,
    recordCustomerLedgerDiscount,
    recordSupplierLedgerDiscount,
    updateLedgerDiscount,
    deleteLedgerDiscount,
    updateLedgerPayment,
    deleteLedgerPayment,
    openEditCustomerPage,
    openEditSupplierPage,
    openViewSalePage,
    openEditSalePage,
    openViewPurchasePage,
    openEditPurchasePage,
    selectedLedgerContactId,
    setSelectedLedgerContactId,
    contactsSubTab,
    navigateToContacts,
    showFlashNotification,
    paymentMethods,
  } = useErp();

  const currencySymbol = settings.currencySymbol || '₹';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supreme_admin';
  const isLight = settings?.themeMode === 'light';
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');
  const [activeSwipeIndex, setActiveSwipeIndex] = useState(0);

  // Active Ledger Type: Customer Ledger vs Supplier Ledger
  const [ledgerType, setLedgerType] = useState<'customer' | 'supplier'>(() => {
    if (initialContactType) return initialContactType;
    if (contactsSubTab === 'supplier_ledger') return 'supplier';
    return 'customer';
  });

  // Selected Contact ID (Customer or Supplier)
  const [activeContactId, setActiveContactId] = useState<string>(() => {
    if (selectedLedgerContactId) return selectedLedgerContactId;
    return '';
  });

  // Sync ledgerType with contactsSubTab
  React.useEffect(() => {
    if (contactsSubTab === 'supplier_ledger') {
      setLedgerType('supplier');
    } else {
      setLedgerType('customer');
    }
  }, [contactsSubTab]);

  // Keep activeContactId in sync if ledgerType changes
  React.useEffect(() => {
    if (activeContactId) {
      if (ledgerType === 'customer') {
        const exists = customers.some((c) => c.id === activeContactId);
        if (!exists) {
          setActiveContactId('');
        }
      } else {
        const exists = suppliers.some((s) => s.id === activeContactId);
        if (!exists) {
          setActiveContactId('');
        }
      }
    }
  }, [ledgerType, customers, suppliers, activeContactId]);

  // Selected Customer or Supplier object
  const currentCustomer: Customer | undefined = useMemo(() => {
    return customers.find((c) => c.id === activeContactId);
  }, [customers, activeContactId]);

  const currentSupplier: Supplier | undefined = useMemo(() => {
    return suppliers.find((s) => s.id === activeContactId);
  }, [suppliers, activeContactId]);

  // Date Range Presets & State
  const [datePreset, setDatePreset] = useState<
    'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'this_month' | 'last_month' | 'this_year' | 'custom'
  >('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Apply Date Preset helper
  const handleSelectPreset = (preset: 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'this_month' | 'last_month' | 'this_year' | 'custom') => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'last7') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === 'last30') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === 'last_month') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      setStartDate(firstDayLastMonth);
      setEndDate(lastDayLastMonth);
    } else if (preset === 'this_year') {
      const firstDayYear = `${now.getFullYear()}-01-01`;
      setStartDate(firstDayYear);
      setEndDate(todayStr);
    }
  };

  // CHECKBOX FILTERS FOR TRANSACTION TYPES
  const [filterInvoices, setFilterInvoices] = useState<boolean>(true); // Sales / Purchases
  const [filterPayments, setFilterPayments] = useState<boolean>(true); // Payments Received / Disbursed
  const [filterDiscounts, setFilterDiscounts] = useState<boolean>(true); // Ledger Discounts on balance due
  const [filterReturns, setFilterReturns] = useState<boolean>(true); // Sales & Purchase returns
  const [filterOpeningBalance, setFilterOpeningBalance] = useState<boolean>(true); // Opening balance row
  const [filterAdvances, setFilterAdvances] = useState<boolean>(true); // Advance deposit row

  // In-table Search Query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Payment Recording Modal State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // LEDGER DISCOUNT MODAL STATE (Admin Only)
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [discountDate, setDiscountDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [discountRef, setDiscountRef] = useState<string>('');
  const [discountNote, setDiscountNote] = useState<string>('');

  // EDIT ENTRY MODAL STATE
  const [editingRow, setEditingRow] = useState<LedgerRow | null>(null);
  const [editModalAmount, setEditModalAmount] = useState<string>('');
  const [editModalDate, setEditModalDate] = useState<string>('');
  const [editModalRef, setEditModalRef] = useState<string>('');
  const [editModalNote, setEditModalNote] = useState<string>('');
  const [editModalMethod, setEditModalMethod] = useState<PaymentMethod>('cash');

  // Unauthorized Permission Warning Modal
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState<boolean>(false);

  // Print Ref
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Current balance due / payable for calculations
  const activeBalanceDue = useMemo(() => {
    if (ledgerType === 'customer') return currentCustomer?.totalDue || 0;
    return currentSupplier?.totalPayable || 0;
  }, [ledgerType, currentCustomer, currentSupplier]);

  // BUILD ALL RAW LEDGER ENTRIES FOR SELECTED CONTACT
  const allLedgerEntries: LedgerRow[] = useMemo(() => {
    const entries: Omit<LedgerRow, 'runningBalance' | 'balanceIndicator'>[] = [];

    if (ledgerType === 'customer' && currentCustomer) {
      // 1. Customer Opening Balance
      const opBal = Number(currentCustomer.openingBalance || 0);
      const advBal = Number(currentCustomer.advanceBalance || 0);

      if (opBal > 0) {
        entries.push({
          id: `op_bal_${currentCustomer.id}`,
          date: currentCustomer.createdDate ? `${currentCustomer.createdDate} 00:00` : '2025-01-01 00:00',
          referenceNo: `OP-BAL-${currentCustomer.id.slice(-4).toUpperCase()}`,
          type: 'opening_balance',
          typeLabel: 'Opening Balance',
          badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          category: 'opening',
          description: 'Previous Account Opening Balance (Owed)',
          debit: opBal,
          credit: 0,
          isEditable: false,
        });
      }

      if (advBal > 0) {
        entries.push({
          id: `adv_bal_${currentCustomer.id}`,
          date: currentCustomer.createdDate ? `${currentCustomer.createdDate} 00:00` : '2025-01-01 00:00',
          referenceNo: `ADV-BAL-${currentCustomer.id.slice(-4).toUpperCase()}`,
          type: 'advance',
          typeLabel: 'Advance Deposit',
          badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          category: 'advance',
          description: 'Initial Advance Deposit Available',
          debit: 0,
          credit: advBal,
          isEditable: false,
        });
      }

      // 2. Sales & Invoices for this customer
      const customerSales = transactions.filter(
        (t) => t.type === 'sale' && t.customerId === currentCustomer.id && t.status !== 'quotation' && t.status !== 'draft'
      );

      customerSales.forEach((sale) => {
        const itemsSummary = sale.items
          .map((i) => `${i.productName} (x${i.quantity})`)
          .join(', ');

        if (sale.totalAmount > 0 || (sale.items && sale.items.length > 0)) {
          entries.push({
            id: `sale_${sale.id}`,
            date: sale.date,
            referenceNo: sale.invoiceNo,
            type: sale.isPos ? 'pos_sale' : 'sale',
            typeLabel: sale.isPos ? 'POS Sale' : 'Tax Invoice',
            badgeColor: sale.isPos
              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
            category: 'invoice',
            description: `Sale: ${itemsSummary || 'Retail Goods'}`,
            notes: sale.notes,
            paymentMethod: sale.isPos ? 'POS Terminal' : 'Standard Invoice',
            debit: sale.totalAmount,
            credit: 0,
            transactionId: sale.id,
            rawTransaction: sale,
            isEditable: true,
          });
        }

        // 3. Payment Entries inside this sale
        if (sale.paymentEntries && sale.paymentEntries.length > 0) {
          sale.paymentEntries.forEach((pay, pIdx) => {
            if (pay.amount > 0) {
              entries.push({
                id: `pay_${sale.id}_${pay.id || pIdx}`,
                date: pay.date || sale.date,
                referenceNo: pay.referenceNo || `RCPT-${sale.invoiceNo.replace(/^(INV|POS)-?/, '')}`,
                type: 'payment',
                typeLabel: 'Payment Received',
                badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                category: 'payment',
                description: `Payment for Invoice #${sale.invoiceNo}${pay.note ? ` (${pay.note})` : ''}`,
                notes: pay.note,
                paymentMethod: (pay.method || 'cash').toUpperCase(),
                debit: 0,
                credit: pay.amount,
                transactionId: sale.id,
                paymentEntryId: pay.id || `ent_${pIdx}`,
                rawTransaction: sale,
                isEditable: true,
              });
            }
          });
        } else if (sale.paidAmount > 0 && (!sale.items || sale.items.length === 0)) {
          // Standalone customer payment transaction
          entries.push({
            id: `pay_direct_${sale.id}`,
            date: sale.date,
            referenceNo: sale.invoiceNo,
            type: 'payment',
            typeLabel: 'Payment Received',
            badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
            category: 'payment',
            description: `Direct Payment: ${sale.notes || 'Customer settlement'}`,
            notes: sale.notes,
            paymentMethod: (sale.paymentMethod || 'CASH').toUpperCase(),
            debit: 0,
            credit: sale.paidAmount,
            transactionId: sale.id,
            paymentEntryId: sale.paymentEntries?.[0]?.id || `ent_0`,
            rawTransaction: sale,
            isEditable: true,
          });
        }
      });

      // 4. Sales Returns for this customer
      const customerReturns = transactions.filter(
        (t) => t.type === 'sell_return' && t.customerId === currentCustomer.id
      );

      customerReturns.forEach((ret) => {
        entries.push({
          id: `ret_${ret.id}`,
          date: ret.date,
          referenceNo: ret.invoiceNo || `RET-${ret.id.slice(-6)}`,
          type: 'return',
          typeLabel: 'Sales Return',
          badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          category: 'return',
          description: `Credit Note / Goods Returned: ${ret.notes || 'Inventory return'}`,
          notes: ret.notes,
          debit: 0,
          credit: ret.totalAmount,
          transactionId: ret.id,
          rawTransaction: ret,
          isEditable: false,
        });
      });

      // 5. LEDGER DISCOUNTS for this customer (Admin Authorized Balance Due Discount)
      const customerDiscounts = transactions.filter(
        (t) => t.type === 'ledger_discount' && t.customerId === currentCustomer.id
      );

      customerDiscounts.forEach((disc) => {
        const discAmount = disc.paidAmount || 0;
        entries.push({
          id: `ldisc_${disc.id}`,
          date: disc.date,
          referenceNo: disc.invoiceNo,
          type: 'ledger_discount',
          typeLabel: 'Ledger Discount',
          badgeColor: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40',
          category: 'discount',
          description: `Ledger Settlement Discount (Auth: ${disc.cashierName || 'Admin'})`,
          notes: disc.notes,
          paymentMethod: 'DUE WAIVER',
          debit: 0,
          credit: discAmount, // Credit reduces customer's debit balance
          transactionId: disc.id,
          rawTransaction: disc,
          isEditable: true,
        });
      });
    } else if (ledgerType === 'supplier' && currentSupplier) {
      // 1. Supplier Opening Balance
      const opBal = Number(currentSupplier.openingBalance || 0);
      const advBal = Number(currentSupplier.advanceBalance || 0);

      if (opBal > 0) {
        entries.push({
          id: `op_bal_${currentSupplier.id}`,
          date: currentSupplier.createdDate ? `${currentSupplier.createdDate} 00:00` : '2025-01-01 00:00',
          referenceNo: `OP-BAL-${currentSupplier.id.slice(-4).toUpperCase()}`,
          type: 'opening_balance',
          typeLabel: 'Opening Balance',
          badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          category: 'opening',
          description: 'Previous Supplier Bill Payable (Owed to Vendor)',
          debit: 0,
          credit: opBal, // Payable to supplier is Credit in supplier ledger
          isEditable: false,
        });
      }

      if (advBal > 0) {
        entries.push({
          id: `adv_bal_${currentSupplier.id}`,
          date: currentSupplier.createdDate ? `${currentSupplier.createdDate} 00:00` : '2025-01-01 00:00',
          referenceNo: `ADV-SUP-${currentSupplier.id.slice(-4).toUpperCase()}`,
          type: 'advance',
          typeLabel: 'Advance Paid',
          badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          category: 'advance',
          description: 'Advance Deposit Paid to Vendor',
          debit: advBal, // Advance paid reduces payable (Debit)
          credit: 0,
          isEditable: false,
        });
      }

      // 2. Purchases & POs for this supplier
      const supplierPurchases = transactions.filter(
        (t) => t.type === 'purchase' && t.supplierId === currentSupplier.id
      );

      supplierPurchases.forEach((po) => {
        const itemsSummary = po.items
          .map((i) => `${i.productName} (x${i.quantity})`)
          .join(', ');

        if (po.totalAmount > 0 || (po.items && po.items.length > 0)) {
          entries.push({
            id: `pur_${po.id}`,
            date: po.date,
            referenceNo: po.invoiceNo,
            type: 'purchase',
            typeLabel: 'Purchase Bill',
            badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
            category: 'invoice',
            description: `Purchase: ${itemsSummary || 'Inbound Goods'}`,
            notes: po.notes,
            paymentMethod: 'Vendor Terms',
            debit: 0,
            credit: po.totalAmount, // Increases liability owed to vendor (Credit)
            transactionId: po.id,
            rawTransaction: po,
            isEditable: true,
          });
        }

        // 3. Payment Entries inside this purchase
        if (po.paymentEntries && po.paymentEntries.length > 0) {
          po.paymentEntries.forEach((pay, pIdx) => {
            if (pay.amount > 0) {
              entries.push({
                id: `pay_pur_${po.id}_${pay.id || pIdx}`,
                date: pay.date || po.date,
                referenceNo: pay.referenceNo || `VND-PAY-${po.invoiceNo.replace(/^PO-?/, '')}`,
                type: 'payment',
                typeLabel: 'Payment Disbursed',
                badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                category: 'payment',
                description: `Payment for PO #${po.invoiceNo}${pay.note ? ` (${pay.note})` : ''}`,
                notes: pay.note,
                paymentMethod: (pay.method || 'bank_transfer').toUpperCase(),
                debit: pay.amount, // Payment made reduces liability (Debit)
                credit: 0,
                transactionId: po.id,
                paymentEntryId: pay.id || `ent_${pIdx}`,
                rawTransaction: po,
                isEditable: true,
              });
            }
          });
        } else if (po.paidAmount > 0 && (!po.items || po.items.length === 0)) {
          // Standalone supplier payment transaction
          entries.push({
            id: `pay_sup_direct_${po.id}`,
            date: po.date,
            referenceNo: po.invoiceNo,
            type: 'payment',
            typeLabel: 'Payment Disbursed',
            badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
            category: 'payment',
            description: `Direct Supplier Voucher: ${po.notes || 'Vendor payment'}`,
            notes: po.notes,
            paymentMethod: (po.paymentMethod || 'BANK_TRANSFER').toUpperCase(),
            debit: po.paidAmount,
            credit: 0,
            transactionId: po.id,
            paymentEntryId: po.paymentEntries?.[0]?.id || `ent_0`,
            rawTransaction: po,
            isEditable: true,
          });
        }
      });

      // 4. Purchase Returns for this supplier
      const supplierReturns = transactions.filter(
        (t) => t.type === 'purchase_return' && t.supplierId === currentSupplier.id
      );

      supplierReturns.forEach((ret) => {
        entries.push({
          id: `pur_ret_${ret.id}`,
          date: ret.date,
          referenceNo: ret.invoiceNo || `PUR-RET-${ret.id.slice(-6)}`,
          type: 'return',
          typeLabel: 'Purchase Return',
          badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          category: 'return',
          description: `Debit Note / Stock Returned: ${ret.notes || 'Vendor return'}`,
          notes: ret.notes,
          debit: ret.totalAmount, // Return to vendor reduces payable (Debit)
          credit: 0,
          transactionId: ret.id,
          rawTransaction: ret,
          isEditable: false,
        });
      });

      // 5. LEDGER DISCOUNTS for this supplier (Admin Authorized Balance Due Waiver / Rebate)
      const supplierDiscounts = transactions.filter(
        (t) => t.type === 'ledger_discount' && t.supplierId === currentSupplier.id
      );

      supplierDiscounts.forEach((disc) => {
        const discAmount = disc.paidAmount || 0;
        entries.push({
          id: `ldisc_${disc.id}`,
          date: disc.date,
          referenceNo: disc.invoiceNo,
          type: 'ledger_discount',
          typeLabel: 'Supplier Discount',
          badgeColor: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40',
          category: 'discount',
          description: `Supplier Balance Waiver / Rebate (Auth: ${disc.cashierName || 'Admin'})`,
          notes: disc.notes,
          paymentMethod: 'PAYABLE WAIVER',
          debit: discAmount, // Debit reduces supplier payable liability
          credit: 0,
          transactionId: disc.id,
          rawTransaction: disc,
          isEditable: true,
        });
      });
    }

    // Sort chronologically ascending
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let currentBalance = 0;
    const finalRows: LedgerRow[] = entries.map((entry) => {
      if (ledgerType === 'customer') {
        // Customer account: Balance = Prev + Debit (Invoices/OpBal) - Credit (Payments/Returns/Discounts)
        currentBalance = currentBalance + entry.debit - entry.credit;
      } else {
        // Supplier account: Balance = Prev + Credit (Purchases/OpBal) - Debit (Payments/Returns/Discounts)
        currentBalance = currentBalance + entry.credit - entry.debit;
      }

      return {
        ...entry,
        runningBalance: +currentBalance.toFixed(2),
        balanceIndicator:
          currentBalance > 0.009
            ? ledgerType === 'customer'
              ? 'Dr'
              : 'Cr'
            : currentBalance < -0.009
            ? ledgerType === 'customer'
              ? 'Cr'
              : 'Dr'
            : 'Balanced',
      };
    });

    return finalRows;
  }, [ledgerType, currentCustomer, currentSupplier, transactions]);

  // DATE-RANGE & CHECKBOX FILTERED ROWS
  const { filteredRows, summaryMetrics, openingBalancePriorToStartDate } = useMemo(() => {
    let priorBalance = 0;
    const startTimestamp = startDate ? new Date(`${startDate} 00:00:00`).getTime() : null;
    const endTimestamp = endDate ? new Date(`${endDate} 23:59:59`).getTime() : null;

    // First, compute prior balance before startDate
    if (startTimestamp) {
      allLedgerEntries.forEach((row) => {
        const rowTime = new Date(row.date).getTime();
        if (rowTime < startTimestamp) {
          if (ledgerType === 'customer') {
            priorBalance += row.debit - row.credit;
          } else {
            priorBalance += row.credit - row.debit;
          }
        }
      });
    }

    // Filter within Date Range
    const dateFiltered = allLedgerEntries.filter((row) => {
      const rowTime = new Date(row.date).getTime();
      if (startTimestamp && rowTime < startTimestamp) return false;
      if (endTimestamp && rowTime > endTimestamp) return false;
      return true;
    });

    // Filter by Transaction Type Checkboxes
    const typeFiltered = dateFiltered.filter((row) => {
      if (row.category === 'invoice' && !filterInvoices) return false;
      if (row.category === 'payment' && !filterPayments) return false;
      if (row.category === 'discount' && !filterDiscounts) return false;
      if (row.category === 'return' && !filterReturns) return false;
      if (row.category === 'opening' && !filterOpeningBalance) return false;
      if (row.category === 'advance' && !filterAdvances) return false;
      return true;
    });

    // Search Filter
    const searched = typeFiltered.filter((row) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        row.referenceNo.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        row.typeLabel.toLowerCase().includes(q) ||
        (row.paymentMethod || '').toLowerCase().includes(q) ||
        (row.notes || '').toLowerCase().includes(q)
      );
    });

    // Recalculate dynamic running balance for the displayed table
    let rolling = priorBalance;
    const displayRows: LedgerRow[] = [];

    // Synthetic Brought Forward row if date filtered
    if (startTimestamp && filterOpeningBalance && (priorBalance !== 0 || startDate)) {
      displayRows.push({
        id: 'brought_forward_row',
        date: `${startDate} 00:00`,
        referenceNo: 'B/F',
        type: 'opening_balance',
        typeLabel: 'Balance Brought Forward',
        badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
        category: 'opening',
        description: `Account Balance Brought Forward as of ${startDate}`,
        debit: ledgerType === 'customer' ? (priorBalance > 0 ? priorBalance : 0) : priorBalance < 0 ? Math.abs(priorBalance) : 0,
        credit: ledgerType === 'customer' ? (priorBalance < 0 ? Math.abs(priorBalance) : 0) : priorBalance > 0 ? priorBalance : 0,
        runningBalance: +priorBalance.toFixed(2),
        balanceIndicator:
          priorBalance > 0.009
            ? ledgerType === 'customer'
              ? 'Dr'
              : 'Cr'
            : priorBalance < -0.009
            ? ledgerType === 'customer'
              ? 'Cr'
              : 'Dr'
            : 'Balanced',
      });
    }

    let periodDiscounts = 0;

    searched.forEach((row) => {
      if (ledgerType === 'customer') {
        rolling = rolling + row.debit - row.credit;
        if (row.category === 'discount') {
          periodDiscounts += row.credit;
        }
      } else {
        rolling = rolling + row.credit - row.debit;
        if (row.category === 'discount') {
          periodDiscounts += row.debit;
        }
      }

      displayRows.push({
        ...row,
        runningBalance: +rolling.toFixed(2),
        balanceIndicator:
          rolling > 0.009
            ? ledgerType === 'customer'
              ? 'Dr'
              : 'Cr'
            : rolling < -0.009
            ? ledgerType === 'customer'
              ? 'Cr'
              : 'Dr'
            : 'Balanced',
      });
    });

    // Summary Totals
    const totalDebit = searched.reduce((sum, r) => sum + r.debit, 0);
    const totalCredit = searched.reduce((sum, r) => sum + r.credit, 0);
    const netClosing = rolling;

    return {
      filteredRows: displayRows,
      openingBalancePriorToStartDate: priorBalance,
      summaryMetrics: {
        totalDebit,
        totalCredit,
        periodDiscounts,
        netClosing,
        transactionCount: searched.length,
      },
    };
  }, [
    allLedgerEntries,
    startDate,
    endDate,
    filterInvoices,
    filterPayments,
    filterDiscounts,
    filterReturns,
    filterOpeningBalance,
    filterAdvances,
    searchQuery,
    ledgerType,
  ]);

  const ledgerExportData = useMemo(() => {
    return filteredRows.map((r) => ({
      date: r.date,
      referenceNo: r.referenceNo,
      typeLabel: r.typeLabel,
      description: r.description,
      paymentMethod: r.paymentMethod || 'N/A',
      debit: r.debit,
      credit: r.credit,
      runningBalance: r.runningBalance,
      balanceIndicator: r.balanceIndicator,
    }));
  }, [filteredRows]);

  // Handle Quick Payment Submit
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      showFlashNotification('Please enter a valid payment amount.', 'error');
      return;
    }

    if (ledgerType === 'customer' && currentCustomer) {
      recordCustomerPayment(
        currentCustomer.id,
        amountNum,
        paymentMethod,
        paymentNote,
        paymentRef,
        paymentDate
      );
      showFlashNotification(`Payment of ${formatCurrency(amountNum, settings)} recorded for ${currentCustomer.name}.`, 'success');
    } else if (ledgerType === 'supplier' && currentSupplier) {
      recordSupplierPayment(
        currentSupplier.id,
        amountNum,
        paymentMethod,
        paymentNote,
        paymentRef,
        paymentDate
      );
      showFlashNotification(`Payment of ${currencySymbol}${amountNum.toFixed(2)} disbursed to ${currentSupplier.businessName}.`, 'success');
    }

    setShowPaymentModal(false);
    setPaymentAmount('');
    setPaymentNote('');
    setPaymentRef('');
  };

  // Open Discount Popup (Admin check enforced)
  const handleOpenDiscountModal = () => {
    if (!isAdmin) {
      setShowUnauthorizedModal(true);
      return;
    }

    const defaultRef =
      ledgerType === 'customer'
        ? `LDISC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        : `SDISC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    setDiscountAmount('');
    setDiscountDate(new Date().toISOString().slice(0, 10));
    setDiscountRef(defaultRef);
    setDiscountNote('');
    setShowDiscountModal(true);
  };

  // Handle Submit Ledger Discount
  const handleRecordDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showFlashNotification('Unauthorized: Only Admin can authorize Ledger Discounts.', 'error');
      setShowDiscountModal(false);
      return;
    }

    const amountNum = parseFloat(discountAmount);
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      showFlashNotification('Please enter a valid discount amount greater than zero.', 'error');
      return;
    }

    if (ledgerType === 'customer' && currentCustomer) {
      const res = recordCustomerLedgerDiscount(
        currentCustomer.id,
        amountNum,
        discountNote,
        discountRef,
        discountDate
      );
      if (res.success) {
        setShowDiscountModal(false);
      }
    } else if (ledgerType === 'supplier' && currentSupplier) {
      const res = recordSupplierLedgerDiscount(
        currentSupplier.id,
        amountNum,
        discountNote,
        discountRef,
        discountDate
      );
      if (res.success) {
        setShowDiscountModal(false);
      }
    }
  };

  // Open Edit Modal for a row
  const handleOpenEditRowModal = (row: LedgerRow) => {
    if (row.type === 'ledger_discount') {
      if (!isAdmin) {
        setShowUnauthorizedModal(true);
        return;
      }
      setEditingRow(row);
      const amount = ledgerType === 'customer' ? row.credit : row.debit;
      setEditModalAmount(amount.toString());
      setEditModalDate(row.date.slice(0, 10));
      setEditModalRef(row.referenceNo);
      setEditModalNote(row.notes || '');
    } else if (row.type === 'payment') {
      setEditingRow(row);
      const amount = ledgerType === 'customer' ? row.credit : row.debit;
      setEditModalAmount(amount.toString());
      setEditModalDate(row.date.slice(0, 10));
      setEditModalRef(row.referenceNo);
      setEditModalNote(row.notes || '');
      setEditModalMethod((row.paymentMethod?.toLowerCase() as PaymentMethod) || 'cash');
    } else if (row.type === 'sale' || row.type === 'pos_sale') {
      if (row.rawTransaction) {
        openEditSalePage(row.rawTransaction);
      }
    } else if (row.type === 'purchase') {
      if (row.rawTransaction) {
        openEditPurchasePage(row.rawTransaction);
      }
    }
  };

  // Save Edit Row
  const handleSaveEditRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;

    const amountNum = parseFloat(editModalAmount);
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      showFlashNotification('Please enter a valid amount.', 'error');
      return;
    }

    if (editingRow.type === 'ledger_discount') {
      if (!isAdmin) {
        showFlashNotification('Unauthorized: Only Admin can modify Ledger Discounts.', 'error');
        return;
      }
      if (editingRow.transactionId) {
        updateLedgerDiscount(
          editingRow.transactionId,
          amountNum,
          editModalDate,
          editModalNote,
          editModalRef
        );
      }
    } else if (editingRow.type === 'payment') {
      if (editingRow.transactionId && editingRow.paymentEntryId) {
        updateLedgerPayment(
          editingRow.transactionId,
          editingRow.paymentEntryId,
          amountNum,
          editModalMethod,
          editModalDate,
          editModalNote,
          editModalRef
        );
      }
    }

    setEditingRow(null);
  };

  // Delete Row
  const handleDeleteRow = (row: LedgerRow) => {
    if (!window.confirm(`Are you sure you want to delete and void entry ${row.referenceNo}? This will re-adjust the ledger balance.`)) {
      return;
    }

    if (row.type === 'ledger_discount') {
      if (!isAdmin) {
        showFlashNotification('Unauthorized: Only Admin can delete Ledger Discounts.', 'error');
        return;
      }
      if (row.transactionId) {
        deleteLedgerDiscount(row.transactionId);
      }
    } else if (row.type === 'payment') {
      if (row.transactionId && row.paymentEntryId) {
        deleteLedgerPayment(row.transactionId, row.paymentEntryId);
      }
    }
    setEditingRow(null);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const contactName =
      ledgerType === 'customer'
        ? currentCustomer?.name || 'Customer'
        : currentSupplier?.businessName || 'Supplier';
    const filename = `${contactName.replace(/\s+/g, '_')}_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;

    const headers = [
      'Date',
      'Reference No',
      'Transaction Type',
      'Particulars / Description',
      'Payment Method',
      'Debit Amount',
      'Credit Amount',
      'Running Balance',
      'Dr/Cr',
    ];
    const rows = filteredRows.map((r) => [
      `"${r.date}"`,
      `"${r.referenceNo}"`,
      `"${r.typeLabel}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      `"${r.paymentMethod || ''}"`,
      r.debit.toFixed(2),
      r.credit.toFixed(2),
      r.runningBalance.toFixed(2),
      r.balanceIndicator,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFlashNotification(`Ledger statement exported as ${filename}`, 'info');
  };

  // Print Statement
  const handlePrint = () => {
    window.print();
  };

  // Quick Filters Select All / Deselect All
  const handleSelectAllTypes = () => {
    setFilterInvoices(true);
    setFilterPayments(true);
    setFilterDiscounts(true);
    setFilterReturns(true);
    setFilterOpeningBalance(true);
    setFilterAdvances(true);
  };

  const handleOnlyInvoices = () => {
    setFilterInvoices(true);
    setFilterPayments(false);
    setFilterDiscounts(false);
    setFilterReturns(false);
    setFilterOpeningBalance(false);
    setFilterAdvances(false);
  };

  const handleOnlyPayments = () => {
    setFilterInvoices(false);
    setFilterPayments(true);
    setFilterDiscounts(false);
    setFilterReturns(false);
    setFilterOpeningBalance(false);
    setFilterAdvances(false);
  };

  const handleOnlyDiscounts = () => {
    setFilterInvoices(false);
    setFilterPayments(false);
    setFilterDiscounts(true);
    setFilterReturns(false);
    setFilterOpeningBalance(false);
    setFilterAdvances(false);
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-fadeIn text-slate-100 min-w-0 w-full max-w-full overflow-x-hidden pb-28">
      {/* Top Header & Party Toggle Bar */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border shadow-md w-full min-w-0 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="min-w-0 w-full lg:w-auto">
          <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="truncate">
              {ledgerType === 'customer'
                ? 'Customer Ledger'
                : 'Supplier Ledger'}
            </span>
          </h1>
          <p className={`text-xs mt-0.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {ledgerType === 'customer'
              ? 'Complete statement of sales invoices, payments received, credit notes, ledger discounts, and running balance.'
              : 'Complete statement of purchase orders, vendor disbursements, purchase returns, payable waivers, and liabilities.'}
          </p>
        </div>

        {/* Action Buttons: Add Discount (Admin), Record Payment, Export CSV, Print, Edit Profile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
          {/* Admin Ledger Discount Button */}
          <button
            onClick={handleOpenDiscountModal}
            id="btn-open-add-ledger-discount"
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold shadow-md shadow-fuchsia-600/20 flex items-center justify-center gap-1.5 transition transform active:scale-95 border border-fuchsia-500/30 cursor-pointer"
            title={isAdmin ? 'Add Balance Due Discount (Admin Only)' : 'Admin Only Feature'}
          >
            <Percent className="w-4 h-4 shrink-0" />
            <span>Add Ledger Discount</span>
            {!isAdmin ? (
              <span className="px-1.5 py-0.5 bg-slate-900/60 text-slate-300 text-[10px] rounded flex items-center gap-1 font-normal">
                <Lock className="w-3 h-3 text-amber-400" /> Admin
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-fuchsia-950 text-fuchsia-200 text-[10px] rounded font-semibold">
                Admin
              </span>
            )}
          </button>

          {/* Payment Button */}
          <button
            onClick={() => {
              setPaymentAmount('');
              setPaymentNote('');
              setShowPaymentModal(true);
            }}
            id="btn-open-record-payment"
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition transform active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>{ledgerType === 'customer' ? 'Receive Payment' : 'Pay Supplier'}</span>
          </button>

          {/* Edit Contact Profile Button */}
          {ledgerType === 'customer' && currentCustomer && (
            <button
              onClick={() => openEditCustomerPage(currentCustomer)}
              id="btn-edit-customer-profile"
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold border border-indigo-500/30 flex items-center gap-1.5 transition cursor-pointer"
              title="Edit Customer Profile & Balances"
            >
              <Edit className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Edit</span>
            </button>
          )}

          {ledgerType === 'supplier' && currentSupplier && (
            <button
              onClick={() => openEditSupplierPage(currentSupplier)}
              id="btn-edit-supplier-profile"
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold border border-indigo-500/30 flex items-center gap-1.5 transition cursor-pointer"
              title="Edit Supplier Profile & Terms"
            >
              <Edit className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Edit</span>
            </button>
          )}

          <ExportButtons
            headers={[
              'Date',
              'Reference No',
              'Transaction Type',
              'Particulars / Description',
              'Payment Method',
              'Debit Amount',
              'Credit Amount',
              'Running Balance',
              'Dr/Cr',
            ]}
            keys={[
              'date',
              'referenceNo',
              'typeLabel',
              'description',
              'paymentMethod',
              'debit',
              'credit',
              'runningBalance',
              'balanceIndicator',
            ]}
            data={ledgerExportData}
            filename={`${(ledgerType === 'customer' ? currentCustomer?.name || 'Customer' : currentSupplier?.businessName || 'Supplier').replace(/\s+/g, '_')}_Ledger`}
            title={`${ledgerType === 'customer' ? 'Customer' : 'Supplier'} Account Ledger Statement`}
            isLight={isLight}
          />

          <button
            onClick={handlePrint}
            id="btn-print-ledger-statement"
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            title="Print Account Statement"
          >
            <Printer className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Print</span>
          </button>

          <button
            onClick={() => navigateToContacts(ledgerType === 'customer' ? 'customers' : 'suppliers')}
            className="px-3 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium border border-slate-800 transition cursor-pointer"
          >
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* CONTACT SELECTOR CARD */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 w-full min-w-0 ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className={`md:col-span-1 border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-5 min-w-0 w-full ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <label className={`block text-[11px] uppercase tracking-wider font-bold mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Select {ledgerType === 'customer' ? 'Customer Profile' : 'Supplier / Vendor'}
          </label>
          <div className="relative w-full min-w-0">
            <select
              value={activeContactId}
              onChange={(e) => {
                setActiveContactId(e.target.value);
                setSelectedLedgerContactId(e.target.value);
              }}
              id="select-active-ledger-contact"
              className={`w-full text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl border transition appearance-none pr-8 cursor-pointer truncate ${
                isLight 
                  ? 'bg-white text-slate-900 border-slate-300 focus:outline-none focus:border-indigo-600' 
                  : 'bg-slate-950 text-slate-100 border-slate-700 focus:outline-none focus:border-indigo-500'
              }`}
            >
              {ledgerType === 'customer' ? (
                <>
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className={isLight ? 'text-slate-900' : 'text-slate-100'}>
                      {c.name} {c.businessName ? `(${c.businessName})` : ''} - Due: {currencySymbol}
                      {Number(c.totalDue || 0).toFixed(2)}
                    </option>
                  ))}
                </>
              ) : (
                <>
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id} className={isLight ? 'text-slate-900' : 'text-slate-100'}>
                      {s.businessName || s.name} - Payable: {currencySymbol}
                      {Number(s.totalPayable || 0).toFixed(2)}
                    </option>
                  ))}
                </>
              )}
            </select>
            <ChevronDown className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>

          <div className={`mt-3 text-xs flex items-center justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Total Registered:</span>
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {ledgerType === 'customer'
                ? `${customers.length} Customers`
                : `${suppliers.length} Suppliers`}
            </span>
          </div>
        </div>

        {/* Selected Contact Details Card with Quick Edit Link */}
        <div className="md:col-span-2 flex flex-col justify-between min-w-0 w-full">
          {!activeContactId && (
            <div className={`flex flex-col items-center justify-center py-6 px-4 rounded-xl border border-dashed text-center h-full ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-500' 
                : 'bg-slate-950/30 border-slate-800 text-slate-400'
            }`}>
              <Users className="w-8 h-8 text-indigo-400 mb-2 animate-pulse" />
              <div className="font-bold text-sm">No Contact Selected</div>
              <div className="text-xs mt-1">Please select a {ledgerType === 'customer' ? 'customer' : 'supplier'} from the list to load their statement details.</div>
            </div>
          )}

          {ledgerType === 'customer' && currentCustomer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className={`p-3 rounded-xl border relative group ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Customer</div>
                <div className={`font-bold text-sm mt-0.5 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentCustomer.name}</div>
                <div className={`text-[11px] mt-0.5 truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {currentCustomer.businessName || 'Individual Account'}
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Contact & Tax</div>
                <div className={`font-mono mt-0.5 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{currentCustomer.phone}</div>
                <div className={`text-[10px] mt-0.5 truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {currentCustomer.taxNumber
                    ? `GST: ${currentCustomer.taxNumber}`
                    : currentCustomer.email || 'No Tax ID'}
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Address / Location</div>
                <div className={`mt-0.5 truncate ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                  {currentCustomer.city || currentCustomer.address || 'Standard Location'}
                </div>
                <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  {currentCustomer.state || currentCustomer.country || 'Default Zone'}
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Balance Due</div>
                <div className="text-rose-500 font-mono font-bold text-sm mt-0.5">
                  {currencySymbol}{Number(currentCustomer.totalDue || 0).toFixed(2)}
                </div>
                <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Credit Limit: <span className={`font-mono ${isLight ? 'text-indigo-600' : 'text-indigo-300'}`}>{currencySymbol}{Number(currentCustomer.creditLimit || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {ledgerType === 'supplier' && currentSupplier && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className={`p-3 rounded-xl border relative group ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Supplier Vendor</div>
                <div className={`font-bold text-sm mt-0.5 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currentSupplier.businessName || currentSupplier.name}
                </div>
                <div className={`text-[11px] mt-0.5 truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Attn: {currentSupplier.name}</div>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Contact & Tax</div>
                <div className={`font-mono mt-0.5 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{currentSupplier.phone}</div>
                <div className={`text-[10px] mt-0.5 truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {currentSupplier.taxNumber
                    ? `GST: ${currentSupplier.taxNumber}`
                    : currentSupplier.email || 'N/A'}
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Payment Terms</div>
                <div className={`font-semibold mt-0.5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                  {currentSupplier.payTerm || 'Net 30 Days'}
                </div>
                <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{currentSupplier.city || 'Headquarters'}</div>
              </div>

              <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total Payable</div>
                <div className="text-rose-500 font-mono font-bold text-sm mt-0.5">
                  {currencySymbol}{Number(currentSupplier.totalPayable || 0).toFixed(2)}
                </div>
                <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Total POs: {currencySymbol}{Number(currentSupplier.totalPurchases || 0).toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FILTER CONTROLS BAR: DATE-RANGE & TRANSACTION TYPE CHECKBOXES */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        {/* Section 1: Date Range Filter */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Filter by Date Range:</span>
            </div>

            {/* Quick Presets Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'last7', label: 'Last 7 Days' },
                { id: 'last30', label: 'Last 30 Days' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'this_year', label: 'This Year' },
              ].map((p) => (
                <button
                  key={p.id}
                  id={`btn-date-preset-${p.id}`}
                  onClick={() => handleSelectPreset(p.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                    datePreset === p.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : isLight
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                id="input-ledger-start-date"
                className="bg-slate-900 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                id="input-ledger-end-date"
                className="bg-slate-900 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => handleSelectPreset('all')}
                id="btn-reset-date-filter"
                className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 ml-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Dates</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 2: Checkbox Filters for Transaction Types (including Ledger Discounts) */}
        <div className={`border-t pt-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
            <div className={`flex items-center gap-2 text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <Filter className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
              <span>Show / Hide Transaction Types (Checkbox Filters):</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllTypes}
                className={`text-[11px] font-semibold ${isLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-indigo-400 hover:text-indigo-300'}`}
              >
                Select All
              </button>
              <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>|</span>
              <button
                onClick={handleOnlyInvoices}
                className={`text-[11px] ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Invoices Only
              </button>
              <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>|</span>
              <button
                onClick={handleOnlyPayments}
                className={`text-[11px] ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Payments Only
              </button>
              <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>|</span>
              <button
                onClick={handleOnlyDiscounts}
                className={`text-[11px] ${isLight ? 'text-fuchsia-600 hover:text-fuchsia-700' : 'text-fuchsia-400 hover:text-fuchsia-300'}`}
              >
                Discounts Only
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {/* Checkbox 1: Invoices */}
            <label
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition select-none ${
                filterInvoices
                  ? isLight
                    ? 'bg-indigo-50 text-indigo-900 border-indigo-300 shadow-sm font-semibold'
                    : 'bg-indigo-500/15 text-indigo-200 border-indigo-500/40 shadow-sm'
                  : isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={filterInvoices}
                onChange={(e) => setFilterInvoices(e.target.checked)}
                id="checkbox-filter-invoices"
                className="sr-only"
              />
              {filterInvoices ? (
                <CheckSquare className={`w-4 h-4 shrink-0 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
              ) : (
                <Square className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
              )}
              <span className="truncate">
                {ledgerType === 'customer' ? 'Sales Invoices' : 'Purchase Bills'}
              </span>
            </label>

            {/* Checkbox 2: Payments */}
            <label
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition select-none ${
                filterPayments
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-sm font-semibold'
                    : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40 shadow-sm'
                  : isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={filterPayments}
                onChange={(e) => setFilterPayments(e.target.checked)}
                id="checkbox-filter-payments"
                className="sr-only"
              />
              {filterPayments ? (
                <CheckSquare className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              ) : (
                <Square className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
              )}
              <span className="truncate">
                {ledgerType === 'customer' ? 'Payments Received' : 'Payments Paid'}
              </span>
            </label>

            {/* Checkbox 3: LEDGER DISCOUNTS */}
            <label
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition select-none ${
                filterDiscounts
                  ? isLight
                    ? 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-300 shadow-sm font-semibold'
                    : 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/40 shadow-sm'
                  : isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={filterDiscounts}
                onChange={(e) => setFilterDiscounts(e.target.checked)}
                id="checkbox-filter-ledger-discounts"
                className="sr-only"
              />
              {filterDiscounts ? (
                <CheckSquare className={`w-4 h-4 shrink-0 ${isLight ? 'text-fuchsia-600' : 'text-fuchsia-400'}`} />
              ) : (
                <Square className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
              )}
              <span className="truncate">Ledger Discounts</span>
            </label>

            {/* Checkbox 4: Returns */}
            <label
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition select-none ${
                filterReturns
                  ? isLight
                    ? 'bg-rose-50 text-rose-900 border-rose-300 shadow-sm font-semibold'
                    : 'bg-rose-500/15 text-rose-200 border-rose-500/40 shadow-sm'
                  : isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={filterReturns}
                onChange={(e) => setFilterReturns(e.target.checked)}
                id="checkbox-filter-returns"
                className="sr-only"
              />
              {filterReturns ? (
                <CheckSquare className={`w-4 h-4 shrink-0 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
              ) : (
                <Square className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
              )}
              <span className="truncate">
                {ledgerType === 'customer' ? 'Sales Returns' : 'Purchase Returns'}
              </span>
            </label>

            {/* Checkbox 5: Opening Balance */}
            <label
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition select-none ${
                filterOpeningBalance
                  ? isLight
                    ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-sm font-semibold'
                    : 'bg-amber-500/15 text-amber-200 border-amber-500/40 shadow-sm'
                  : isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={filterOpeningBalance}
                onChange={(e) => setFilterOpeningBalance(e.target.checked)}
                id="checkbox-filter-opening-balance"
                className="sr-only"
              />
              {filterOpeningBalance ? (
                <CheckSquare className={`w-4 h-4 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              ) : (
                <Square className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
              )}
              <span className="truncate">Opening Balance</span>
            </label>

            {/* Checkbox 6: Advance Deposits */}
            <label
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition select-none ${
                filterAdvances
                  ? isLight
                    ? 'bg-sky-50 text-sky-900 border-sky-300 shadow-sm font-semibold'
                    : 'bg-sky-500/15 text-sky-200 border-sky-500/40 shadow-sm'
                  : isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={filterAdvances}
                onChange={(e) => setFilterAdvances(e.target.checked)}
                id="checkbox-filter-advances"
                className="sr-only"
              />
              {filterAdvances ? (
                <CheckSquare className={`w-4 h-4 shrink-0 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
              ) : (
                <Square className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
              )}
              <span className="truncate">
                {ledgerType === 'customer' ? 'Advance Deposits' : 'Advance Paid'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* FINANCIAL SUMMARY METRICS & STATEMENT TABLE */}
      {activeContactId ? (
        <>
          {/* FINANCIAL SUMMARY METRIC CARDS (INCLUDING LEDGER DISCOUNTS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Debits */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">
              {ledgerType === 'customer' ? 'Total Debited (Sales)' : 'Total Debited (Payments)'}
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-2">
            {formatCurrency(summaryMetrics.totalDebit, settings)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {ledgerType === 'customer' ? 'Total sales invoiced to account' : 'Total payments & waivers applied'}
          </div>
        </div>

        {/* Card 2: Total Credits */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">
              {ledgerType === 'customer' ? 'Total Credited (Paid/Discounts)' : 'Total Credited (Purchases)'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
            {formatCurrency(summaryMetrics.totalCredit, settings)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {ledgerType === 'customer' ? 'Collections & credit adjustments' : 'Purchase orders billed'}
          </div>
        </div>

        {/* Card 3: Total Ledger Discounts Applied */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">
              Ledger Discounts
            </span>
            <div className="p-2 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-fuchsia-400 mt-2">
            {formatCurrency(summaryMetrics.periodDiscounts, settings)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Admin balance waivers & concessions
          </div>
        </div>

        {/* Card 4: Opening Balance */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">Opening Balance</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-2">
            {formatCurrency(Math.abs(
              openingBalancePriorToStartDate ||
                (ledgerType === 'customer'
                  ? currentCustomer?.openingBalance || 0
                  : currentSupplier?.openingBalance || 0)
            ), settings)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {startDate ? `As of ${startDate}` : 'Initial account balance'}
          </div>
        </div>

        {/* Card 5: Net Closing Balance Due */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">
              {ledgerType === 'customer' ? 'Closing Outstanding (Due)' : 'Closing Payable'}
            </span>
            <div
              className={`p-2 rounded-xl border ${
                summaryMetrics.netClosing > 0
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {summaryMetrics.netClosing > 0 ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`text-xl font-bold font-mono mt-2 ${
              summaryMetrics.netClosing > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {formatCurrency(Math.abs(summaryMetrics.netClosing), settings)}{' '}
            <span className="text-xs font-sans font-normal text-slate-400">
              {summaryMetrics.netClosing > 0.009
                ? ledgerType === 'customer'
                  ? '(Dr - Due)'
                  : '(Cr - Payable)'
                : '(Settled)'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{summaryMetrics.transactionCount} records filtered</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND STATUS BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-white font-bold">{filteredRows.length}</span> statement records
          {startDate && endDate && (
            <span className="ml-1 text-indigo-400 font-normal">
              (Period: {startDate} to {endDate})
            </span>
          )}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search statement by ref #, notes, method..."
            className="w-full bg-slate-900 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* DETAILED STATEMENT / LEDGER TABLE & MOBILE TOUCH CARDS */}
      <div
        ref={printContainerRef}
        className={`rounded-2xl border shadow-sm w-full min-w-0 overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Section Header with View Toggle for Mobile */}
        <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between gap-2 ${
          isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <h2 className={`text-xs sm:text-sm font-bold flex items-center gap-2 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Account Statement ({filteredRows.length} Records)</span>
          </h2>

          {/* Mobile View Mode Toggle */}
          <div className="flex sm:hidden items-center p-1 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <button
              type="button"
              onClick={() => setMobileViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mobileViewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Touch Swipe Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[10px]">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mobileViewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="text-[10px]">Table</span>
            </button>
          </div>
        </div>

        {/* Printable Header Details (Only rendered during print) */}
        <div className="hidden print:block p-6 border-b border-slate-300 text-slate-900 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{settings.name || 'Royal Enterprise POS'}</h2>
              <p className="text-xs text-slate-600">{settings.address || 'Company Location'}</p>
              <p className="text-xs text-slate-600">
                GSTIN / TAX ID: {settings.taxNumber || 'N/A'} | Phone: {settings.phone}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-indigo-900">
                {ledgerType === 'customer'
                  ? 'CUSTOMER ACCOUNT STATEMENT & LEDGER'
                  : 'SUPPLIER LEDGER STATEMENT'}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Party: {ledgerType === 'customer' ? currentCustomer?.name : currentSupplier?.businessName}
              </p>
              <p className="text-xs text-slate-500">
                Date Range: {startDate || 'All Time'} to {endDate || 'Present'}
              </p>
            </div>
          </div>
        </div>

        {/* 1. MOBILE TOUCH-SWIPE CARDS VIEW (Active on mobile when 'cards' mode selected) */}
        <div className={`sm:hidden ${mobileViewMode === 'cards' ? 'block' : 'hidden'} p-3 space-y-3`}>
          {filteredRows.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No transactions match the selected date range and filters.
            </div>
          ) : (
            <>
              {/* Swipe Instruction Banner */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-medium border ${
                isLight ? 'bg-indigo-50/70 text-indigo-800 border-indigo-100' : 'bg-indigo-950/30 text-indigo-300 border-indigo-900/40'
              }`}>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Swipe horizontally to browse ledger entries</span>
                </span>
                <span className="text-[10px] font-bold opacity-75">{filteredRows.length} Records</span>
              </div>

              {/* Horizontal Touch Swipe Carousel */}
              <div
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory py-1 pb-3 custom-scrollbar -webkit-overflow-scrolling-touch touch-pan-x w-full"
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const itemWidth = target.offsetWidth * 0.85;
                  const index = Math.round(target.scrollLeft / itemWidth);
                  setActiveSwipeIndex(Math.min(index, filteredRows.length - 1));
                }}
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {filteredRows.map((row) => (
                  <div
                    key={row.id}
                    className={`snap-center shrink-0 w-[86vw] max-w-[340px] p-4 rounded-2xl border shadow-md flex flex-col justify-between transition-all ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    <div>
                      {/* Card Header: Ref # & Date */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div>
                          <span className="font-mono font-bold text-sm text-indigo-400 block truncate">
                            {row.referenceNo}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {row.date}
                          </span>
                        </div>
                        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${row.badgeColor}`}>
                          {row.typeLabel}
                        </span>
                      </div>

                      {/* Particulars & Description */}
                      <p className={`text-xs font-medium mb-3 line-clamp-2 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {row.description}
                      </p>

                      {/* Debit, Credit & Running Balance Pill */}
                      <div className={`p-2.5 rounded-xl border text-xs font-mono space-y-1.5 ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900/90 border-slate-800 text-slate-300'
                      }`}>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Debit (Dr):</span>
                          <span className={row.debit > 0 ? (row.type === 'ledger_discount' ? 'text-fuchsia-400 font-bold' : 'font-bold text-slate-900 dark:text-white') : 'text-slate-500'}>
                            {row.debit > 0 ? formatCurrency(row.debit, settings) : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Credit (Cr):</span>
                          <span className={row.credit > 0 ? 'font-bold text-emerald-500' : 'text-slate-500'}>
                            {row.credit > 0 ? formatCurrency(row.credit, settings) : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span>Running Balance:</span>
                          <span className={row.runningBalance > 0 ? 'text-amber-500' : row.runningBalance < 0 ? 'text-emerald-400' : 'text-slate-400'}>
                            {formatCurrency(Math.abs(row.runningBalance), settings)} <span className="text-[10px] font-normal">{row.balanceIndicator}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500 font-mono truncate">
                        Method: {row.paymentMethod || 'Standard'}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {row.rawTransaction && (row.type === 'sale' || row.type === 'pos_sale') && (
                          <button
                            type="button"
                            onClick={() => openViewSalePage(row.rawTransaction!)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 text-xs transition cursor-pointer"
                            title="View Invoice"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {row.rawTransaction && row.type === 'purchase' && (
                          <button
                            type="button"
                            onClick={() => openViewPurchasePage(row.rawTransaction!)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 text-xs transition cursor-pointer"
                            title="View Bill"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(row.type === 'ledger_discount' || (row.type === 'payment' && row.isEditable)) && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditRowModal(row)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition cursor-pointer"
                            title="Edit Entry"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Swipe Pagination Dots */}
              {filteredRows.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {filteredRows.slice(0, 10).map((_, dotIdx) => (
                    <div
                      key={dotIdx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeSwipeIndex === dotIdx
                          ? 'w-5 bg-indigo-500'
                          : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 2. FULL RESPONSIVE TABLE VIEW */}
        <div className={`${mobileViewMode === 'table' ? 'block' : 'hidden sm:block'} w-full overflow-x-auto custom-scrollbar touch-pan-x -webkit-overflow-scrolling-touch pb-2`}>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Reference / Ref #</th>
                <th className="py-3.5 px-4">Transaction Type</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Particulars / Description</th>
                <th className="py-3.5 px-4 text-right">Debit (Dr)</th>
                <th className="py-3.5 px-4 text-right">Credit (Cr)</th>
                <th className="py-3.5 px-4 text-right">Running Balance</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-400">No ledger transactions found</p>
                      <p className="text-xs text-slate-500">
                        No transactions match the selected date range and checkbox filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-850/60 transition group">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {row.date}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                      {row.referenceNo}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.badgeColor}`}>
                        {row.typeLabel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {row.paymentMethod || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={row.description}>
                      <div className="flex items-center gap-1.5">
                        {row.type === 'ledger_discount' && (
                          <Percent className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                        )}
                        <span className={row.type === 'ledger_discount' ? 'text-fuchsia-200 font-medium' : ''}>
                          {row.description}
                        </span>
                      </div>
                      {row.notes && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">{row.notes}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {row.debit > 0 ? (
                        <span className={row.type === 'ledger_discount' ? 'text-fuchsia-400' : 'text-white'}>
                          {formatCurrency(row.debit, settings)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {row.credit > 0 ? (
                        <span className={row.type === 'ledger_discount' ? 'text-fuchsia-400 font-bold' : 'text-emerald-400'}>
                          {formatCurrency(row.credit, settings)}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      <span
                        className={
                          row.runningBalance > 0
                            ? 'text-amber-400'
                            : row.runningBalance < 0
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }
                      >
                        {formatCurrency(Math.abs(row.runningBalance), settings)}
                      </span>{' '}
                      <span className="text-[10px] text-slate-500 font-normal">
                        {row.balanceIndicator}
                      </span>
                    </td>

                    {/* ACTIONS: Edit & View Options */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Invoice Action */}
                        {row.rawTransaction && (row.type === 'sale' || row.type === 'pos_sale') && (
                          <button
                            onClick={() => openViewSalePage(row.rawTransaction!)}
                            className={`p-1.5 rounded-lg border transition ${
                              isLight
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                : 'bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white border-transparent'
                            }`}
                            title="View Invoice Details"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {row.rawTransaction && row.type === 'purchase' && (
                          <button
                            onClick={() => openViewPurchasePage(row.rawTransaction!)}
                            className={`p-1.5 rounded-lg border transition ${
                              isLight
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                : 'bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white border-transparent'
                            }`}
                            title="View Purchase Bill"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit Action for Ledger Discounts */}
                        {row.type === 'ledger_discount' && (
                          <button
                            onClick={() => handleOpenEditRowModal(row)}
                            className={`p-1.5 rounded-lg border transition ${
                              isLight
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                : 'bg-fuchsia-500/10 hover:bg-fuchsia-600 text-fuchsia-400 hover:text-white border-fuchsia-500/30'
                            }`}
                            title={isAdmin ? 'Edit Ledger Discount (Admin)' : 'Admin Only Feature'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit Action for Payments */}
                        {row.type === 'payment' && row.isEditable && (
                          <button
                            onClick={() => handleOpenEditRowModal(row)}
                            className={`p-1.5 rounded-lg border transition ${
                              isLight
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                : 'bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-500/30'
                            }`}
                            title="Edit Payment Receipt / Entry"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit Action for Invoices */}
                        {(row.type === 'sale' || row.type === 'pos_sale') && row.rawTransaction && (
                          <button
                            onClick={() => openEditSalePage(row.rawTransaction!)}
                            className={`p-1.5 rounded-lg border transition ${
                              isLight
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                : 'bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white border-transparent'
                            }`}
                            title="Edit Sale Transaction"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {row.type === 'purchase' && row.rawTransaction && (
                          <button
                            onClick={() => openEditPurchasePage(row.rawTransaction!)}
                            className={`p-1.5 rounded-lg border transition ${
                              isLight
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                : 'bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white border-transparent'
                            }`}
                            title="Edit Purchase Transaction"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* If opening balance or non-editable */}
                        {!row.isEditable && !row.rawTransaction && (
                          <span className="text-slate-600 text-[10px]">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* TABLE FOOTER SUMMARY */}
            {filteredRows.length > 0 && (
              <tfoot className="bg-slate-950/80 border-t-2 border-slate-800 font-bold text-xs text-slate-200">
                <tr>
                  <td colSpan={5} className="py-3.5 px-4 uppercase text-[11px] tracking-wider text-slate-400">
                    Totals for Filtered Period ({filteredRows.length} transactions)
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-white text-sm">
                    {currencySymbol}{summaryMetrics.totalDebit.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400 text-sm">
                    {currencySymbol}{summaryMetrics.totalCredit.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-sm">
                    <span
                      className={
                        summaryMetrics.netClosing > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }
                    >
                      {currencySymbol}{Math.abs(summaryMetrics.netClosing).toFixed(2)}
                    </span>{' '}
                    <span className="text-xs text-slate-400 font-normal">
                      {summaryMetrics.netClosing > 0.009
                        ? ledgerType === 'customer'
                          ? 'Dr'
                          : 'Cr'
                        : 'Settled'}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
        </>
      ) : (
        <div className={`flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed text-center shadow-sm ${
          isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          <div className={`p-4 rounded-full ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'} mb-4`}>
            <BookOpen className="w-10 h-10 animate-pulse" />
          </div>
          <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Please Select a {ledgerType === 'customer' ? 'Customer Profile' : 'Supplier / Vendor'}
          </h3>
          <p className="text-xs max-w-sm mt-2">
            Use the dropdown selector above to choose a registered {ledgerType === 'customer' ? 'customer' : 'supplier'} and load their real-time financial ledger, transaction history, and outstanding account statements.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP 1: ADD LEDGER DISCOUNT / DUE WAIVER (ADMIN ONLY)                    */}
      {/* ========================================================================= */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-scaleUp max-h-[92vh] sm:max-h-[90vh] flex flex-col my-auto overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 shrink-0">
                  <Percent className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-sm sm:text-base truncate">
                      {ledgerType === 'customer'
                        ? 'Add Customer Ledger Discount'
                        : 'Add Supplier Balance Discount'}
                    </h3>
                    <span className="px-2 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 text-[10px] font-bold rounded-full border border-fuchsia-500/30 shrink-0">
                      Admin Authorized
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    For:{' '}
                    <span className="text-white font-semibold">
                      {ledgerType === 'customer'
                        ? currentCustomer?.name
                        : currentSupplier?.businessName || currentSupplier?.name}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleRecordDiscountSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 scrollbar-thin">
                {/* Explanatory Notice */}
                <div className={`rounded-xl border p-3.5 text-xs flex items-start gap-2.5 ${isLight ? 'bg-fuchsia-50 border-fuchsia-200 text-slate-800' : 'bg-fuchsia-950/30 border-fuchsia-900/40 text-fuchsia-200/90'}`}>
                  <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-fuchsia-600' : 'text-fuchsia-400'}`} />
                  <div>
                    <span className={`font-bold ${isLight ? 'text-fuchsia-900' : 'text-fuchsia-300'}`}>Independent Ledger Discount:</span> This
                    discount directly reduces the account balance due in the contact ledger. It is completely
                    distinct from Sale Invoice Discounts and does <strong>NOT</strong> modify invoice items,
                    tax calculations, or POS sales reports.
                  </div>
                </div>

                {/* Current Outstanding Due Display */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-400">
                      Current Outstanding {ledgerType === 'customer' ? 'Balance Due' : 'Payable'}
                    </div>
                    <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                      {currencySymbol}{activeBalanceDue.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase font-bold text-slate-400">Authorized Admin</div>
                    <div className="text-xs font-semibold text-indigo-300 mt-0.5 flex items-center gap-1 justify-end">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {currentUser?.name || 'Administrator'}
                    </div>
                  </div>
                </div>

                {/* Discount Amount Input with Quick Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ledger Discount Amount ({currencySymbol}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-fuchsia-400 font-bold text-base">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      id="input-ledger-discount-amount"
                      className="w-full bg-slate-950 text-white font-mono text-lg font-bold pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>

                  {/* Quick Shortcut Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-500 font-medium mr-1">Quick Apply:</span>
                    {[
                      { label: '5%', val: activeBalanceDue * 0.05 },
                      { label: '10%', val: activeBalanceDue * 0.1 },
                      { label: '20%', val: activeBalanceDue * 0.2 },
                      { label: '50%', val: activeBalanceDue * 0.5 },
                      { label: 'Full Balance', val: activeBalanceDue },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDiscountAmount(Math.max(0, +preset.val.toFixed(2)).toString())}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-fuchsia-900/60 hover:text-fuchsia-200 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & Reference Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Effective Discount Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={discountDate}
                      onChange={(e) => setDiscountDate(e.target.value)}
                      id="input-ledger-discount-date"
                      className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Voucher / Reference No *
                    </label>
                    <input
                      type="text"
                      required
                      value={discountRef}
                      onChange={(e) => setDiscountRef(e.target.value)}
                      id="input-ledger-discount-ref"
                      className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-fuchsia-500 font-mono"
                    />
                  </div>
                </div>

                {/* Reason / Notes with suggestions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reason / Settlement Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Account settlement waiver approved by management"
                    value={discountNote}
                    onChange={(e) => setDiscountNote(e.target.value)}
                    id="input-ledger-discount-note"
                    className="w-full bg-slate-950 text-slate-200 text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-fuchsia-500"
                  />

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-slate-500">Suggestions:</span>
                    {[
                      'Settlement Concession',
                      'Bad Debt Waiver',
                      'Round-off Write-off',
                      'Early Clearance Discount',
                      'Loyalty Balance Waiver',
                    ].map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setDiscountNote(chip)}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] rounded border border-slate-800 cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Calculation Preview */}
                {parseFloat(discountAmount) > 0 && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Original Balance Due:</span>
                      <span>{currencySymbol}{activeBalanceDue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-fuchsia-400 font-bold">
                      <span>Ledger Discount to Deduct:</span>
                      <span>- {currencySymbol}{parseFloat(discountAmount || '0').toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-white">
                      <span>New Resulting Balance:</span>
                      <span
                        className={
                          activeBalanceDue - parseFloat(discountAmount || '0') <= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }
                      >
                        {currencySymbol}
                        {Math.max(0, activeBalanceDue - parseFloat(discountAmount || '0')).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Footer Form Actions */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-slate-950/90 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-ledger-discount"
                  className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold shadow-md shadow-fuchsia-600/30 flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Account in Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP 2: EDIT LEDGER ENTRY MODAL (DISCOUNT OR PAYMENT)                    */}
      {/* ========================================================================= */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-scaleUp max-h-[92vh] sm:max-h-[90vh] flex flex-col my-auto overflow-hidden text-slate-100">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border shrink-0 ${
                  editingRow.type === 'ledger_discount'
                    ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  <Edit className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm sm:text-base truncate">
                    {editingRow.type === 'ledger_discount' ? 'Edit Ledger Discount' : 'Edit Payment Entry'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    Ref: {editingRow.referenceNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRow} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 scrollbar-thin">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount ({currencySymbol}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500 font-bold">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={editModalAmount}
                      onChange={(e) => setEditModalAmount(e.target.value)}
                      className="w-full bg-slate-950 text-white font-mono text-base pl-8 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {editingRow.type === 'payment' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                    <select
                      value={editModalMethod}
                      onChange={(e) => setEditModalMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {paymentMethods.filter(m => m.enabled).map(m => (
                        <option key={m.id} value={m.code}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={editModalDate}
                      onChange={(e) => setEditModalDate(e.target.value)}
                      className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Reference No</label>
                    <input
                      type="text"
                      value={editModalRef}
                      onChange={(e) => setEditModalRef(e.target.value)}
                      className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Description</label>
                  <textarea
                    rows={2}
                    value={editModalNote}
                    onChange={(e) => setEditModalNote(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/90 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteRow(editingRow)}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-rose-500/20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Void / Delete</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRow(null)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP 3: RECORD PAYMENT MODAL                                             */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-scaleUp max-h-[92vh] sm:max-h-[90vh] flex flex-col my-auto overflow-hidden text-slate-100">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm sm:text-base truncate">
                    {ledgerType === 'customer' ? 'Receive Customer Payment' : 'Disburse Supplier Payment'}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    Party:{' '}
                    <span className="text-white font-semibold">
                      {ledgerType === 'customer' ? currentCustomer?.name : currentSupplier?.businessName}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 scrollbar-thin">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Amount ({currencySymbol}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500 font-bold">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      id="input-ledger-payment-amount"
                      className="w-full bg-slate-950 text-white font-mono text-base pl-8 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>Current Outstanding Due:</span>
                    <span className="font-bold text-rose-400 font-mono">
                      {currencySymbol}
                      {ledgerType === 'customer'
                        ? Number(currentCustomer?.totalDue || 0).toFixed(2)
                        : Number(currentSupplier?.totalPayable || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      id="select-ledger-payment-method"
                      className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {paymentMethods.filter(m => m.enabled).map(m => (
                        <option key={m.id} value={m.code}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      id="input-ledger-payment-date"
                      className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reference / Cheque / Txn #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ACH-99201 or CHQ-00129"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    id="input-ledger-payment-ref"
                    className="w-full bg-slate-950 text-slate-200 text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Notes / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Additional receipt remarks..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    id="input-ledger-payment-notes"
                    className="w-full bg-slate-950 text-slate-200 text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-slate-950/90 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-ledger-payment"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Post to Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP 4: UNAUTHORIZED ROLE RESTRICTION MODAL                              */}
      {/* ========================================================================= */}
      {showUnauthorizedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-scaleUp text-center space-y-4 max-h-[92vh] overflow-y-auto my-auto text-slate-100">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Administrator Access Required</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Ledger Balance Discounts can only be authorized and applied by users with the{' '}
                <strong className="text-rose-300">Admin</strong> role. Your current logged-in account (
                <span className="text-indigo-300 font-medium">{currentUser?.name}</span>, role:{' '}
                <span className="text-amber-300 uppercase font-semibold">{currentUser?.role || 'cashier'}</span>
                ) is not authorized to grant due discounts or balance waivers.
              </p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl text-[11px] text-slate-400 border border-slate-800 text-left">
              <div className="font-semibold text-slate-300 flex items-center gap-1 mb-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> Security Policy:
              </div>
              Please switch to an Administrator account from the top right profile menu to grant ledger balance concessions.
            </div>
            <button
              onClick={() => setShowUnauthorizedModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
