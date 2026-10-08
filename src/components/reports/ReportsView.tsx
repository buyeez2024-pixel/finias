import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { formatCurrency, formatDate, normalizeDateToYMD } from '../../utils/formatters';
import { ExportButtons } from '../common/ExportButtons';
import { CustomerSupplierReportView } from './CustomerSupplierReportView';
import { StockReportView } from './StockReportView';
import { StockAdjustmentReportView } from './StockAdjustmentReportView';
import { ProductPurchaseReportView } from './ProductPurchaseReportView';
import { PurchasePaymentReportView } from './PurchasePaymentReportView';
import { SellPaymentReportView } from './SellPaymentReportView';
import { ProductSellReportView } from './ProductSellReportView';
import { PurchaseSaleProductReportView } from './PurchaseSaleProductReportView';
import { SalesRepresentativeReportView } from './SalesRepresentativeReportView';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  DollarSign,
  TrendingUp,
  Boxes,
  Percent,
  Download,
  CheckCircle2,
  Calendar,
  Building,
  Truck,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  Info,
  X,
  FileText,
  SlidersHorizontal,
  ShieldCheck,
  Lock,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronUp,
  Columns,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { financialSummary, products, settings, currentLocation, transactions, suppliers, customers, expenses, taxRates, stockAdjustments } = useErp();
  const isLight = settings?.themeMode === 'light';

  // Active view determined by sidebar activeTab
  const { activeTab } = useErp();
  const isProductPurchaseReport = activeTab === 'product_purchase_report';
  const isPurchasePaymentReport = activeTab === 'purchase_payment_report';
  const isSellPaymentReport = activeTab === 'sell_payment_report';
  const isProductSellReport = activeTab === 'product_sell_report';
  const isPurchaseReport = activeTab === 'purchase_report';
  const isSaleReport = activeTab === 'sale_report';
  const isTaxReport = activeTab === 'tax_report';
  const isCustomerSupplierReport = activeTab === 'customer_supplier_report';
  const isStockReport = activeTab === 'stock_report';
  const isStockAdjustmentReport = activeTab === 'stock_adjustment_report';
  const isSalesRepresentativeReport = activeTab === 'sales_representative_report';

  // State for Profit & Loss Report detail tabs
  const [plTab, setPlTab] = useState<'category' | 'brand' | 'date' | 'invoice' | 'day' | 'product' | 'customer'>('category');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Date Filters
  const [startDate, setStartDate] = useState(() => {
    // Default to start of current month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  
  const [endDate, setEndDate] = useState(() => {
    // Default to today
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [datePreset, setDatePreset] = useState('This Month');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [searchInvoice, setSearchInvoice] = useState('');
  const [taxTab, setTaxTab] = useState<'output' | 'input' | 'expense'>('output');
  const [taxSearch, setTaxSearch] = useState('');
  const [showColumnVisibility, setShowColumnVisibility] = useState(false);
  const [taxVisibleColumns, setTaxVisibleColumns] = useState({
    date: true,
    invoiceNo: true,
    entity: true,
    taxNumber: true,
    totalAmount: true,
    paymentMethod: true,
    discount: true,
    sgst: true,
    cgst: true,
    gst: true,
  });

  const TAX_COLUMN_DEFINITIONS = [
    { key: 'date', label: 'Date', description: 'Transaction record timestamp', locked: true },
    { key: 'invoiceNo', label: 'Invoice No.', description: 'Voucher or reference serial', locked: false },
    { key: 'entity', label: 'Customer / Supplier / Entity', description: 'Counterparty party name', locked: false },
    { key: 'taxNumber', label: 'Tax Number', description: 'GSTIN / VAT registration ID', locked: false },
    { key: 'totalAmount', label: 'Total Amount', description: 'Gross transaction value', locked: false },
    { key: 'paymentMethod', label: 'Payment Method', description: 'Cash, Bank, UPI mode', locked: false },
    { key: 'discount', label: 'Discount', description: 'Discount applied on order', locked: false },
    { key: 'sgst', label: 'SGST', description: 'State Goods & Services Tax', locked: false },
    { key: 'cgst', label: 'CGST', description: 'Central Goods & Services Tax', locked: false },
    { key: 'gst', label: 'GST (Total Tax)', description: 'Combined tax amount', locked: false },
  ];

  const handleTaxPreset = (type: 'all' | 'standard' | 'compact' | 'reset') => {
    if (type === 'all') {
      setTaxVisibleColumns({ date: true, invoiceNo: true, entity: true, taxNumber: true, totalAmount: true, paymentMethod: true, discount: true, sgst: true, cgst: true, gst: true });
    } else if (type === 'standard') {
      setTaxVisibleColumns({ date: true, invoiceNo: true, entity: true, taxNumber: false, totalAmount: true, paymentMethod: true, discount: false, sgst: true, cgst: true, gst: true });
    } else if (type === 'compact') {
      setTaxVisibleColumns({ date: true, invoiceNo: true, entity: true, taxNumber: false, totalAmount: true, paymentMethod: false, discount: false, sgst: false, cgst: false, gst: true });
    } else if (type === 'reset') {
      setTaxVisibleColumns({ date: true, invoiceNo: true, entity: true, taxNumber: true, totalAmount: true, paymentMethod: true, discount: true, sgst: true, cgst: true, gst: true });
    }
  };

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
    } else if (preset === 'Current Financial Year') {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-indexed
      let fyStartYear = currentYear;
      if (currentMonth < 3) { // Jan, Feb, Mar belong to previous calendar year's FY
        fyStartYear = currentYear - 1;
      }
      const start = new Date(fyStartYear, 3, 1); // April 1st
      const end = new Date(fyStartYear + 1, 2, 31); // March 31st
      setStartDate(format(start));
      setEndDate(format(end));
    } else if (preset === 'Last Financial Year') {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-indexed
      let fyStartYear = currentYear;
      if (currentMonth < 3) {
        fyStartYear = currentYear - 1;
      }
      const start = new Date(fyStartYear - 1, 3, 1); // April 1st of previous year
      const end = new Date(fyStartYear, 2, 31); // March 31st of current year
      setStartDate(format(start));
      setEndDate(format(end));
    } else if (preset === 'All Time') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper classifiers for transaction types ensuring POS, standard sales, and purchases are reliably captured
  const isSaleTransaction = (t: any): boolean => {
    if (!t) return false;
    if (t.type === 'sell_return' || t.type === 'sale_return' || t.status === 'cancelled') return false;
    return t.type === 'sale' || t.type === 'pos' || t.type === 'pos_sale' || t.isPos === true || t.saleChannel === 'pos' || (!t.type && (t.customerId !== undefined || (t.items && t.items.length > 0)));
  };

  const isPurchaseTransaction = (t: any): boolean => {
    if (!t) return false;
    if (t.type === 'purchase_return' || t.status === 'cancelled') return false;
    return t.type === 'purchase' || t.type === 'purchase_order' || (!t.type && t.supplierId !== undefined);
  };

  const isDateWithinRange = (dateValue: any, start: string, end: string): boolean => {
    if (!start && !end) return true;
    const d = normalizeDateToYMD(dateValue);
    if (!d) return true;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  };

  // Dynamic Financial Summary for P&L based on Selected Date Range
  const dynamicFinancialSummary = useMemo(() => {
    const salesTxns = transactions.filter((t) => {
      if (!isSaleTransaction(t) || t.status === 'draft' || t.status === 'quotation') return false;
      return isDateWithinRange(t.date, startDate, endDate);
    });

    const purchaseTxns = transactions.filter((t) => {
      if (!isPurchaseTransaction(t)) return false;
      return isDateWithinRange(t.date, startDate, endDate);
    });

    const filteredExpenses = expenses.filter((e) => {
      return isDateWithinRange(e.date, startDate, endDate);
    });

    const grossSales = salesTxns.reduce((sum, t) => sum + t.subtotal, 0);
    const totalTaxCollected = salesTxns.reduce((sum, t) => sum + t.taxAmount, 0);
    const totalDiscounts = salesTxns.reduce((sum, t) => sum + t.discountAmount, 0);
    const netSales = grossSales - totalDiscounts;

    // Cost of Goods Sold (COGS)
    let cogs = 0;
    salesTxns.forEach((t) => {
      t.items.forEach((item) => {
        cogs += (item.costPrice || 0) * item.quantity;
      });
    });

    const grossProfit = netSales - cogs;
    const grossProfitMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    const totalExpensesAmount = filteredExpenses.reduce((sum, e) => {
      const refundAmt = e.isRefund ? (e.refundAmount || 0) : 0;
      return sum + (e.amount - refundAmt);
    }, 0);
    
    const netProfit = grossProfit - totalExpensesAmount;
    const netProfitMargin = netSales > 0 ? (netProfit / netSales) * 100 : 0;

    const totalPurchases = purchaseTxns.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalTaxPaid = purchaseTxns.reduce((sum, t) => sum + t.taxAmount, 0);

    // Return Transactions
    const sellReturnTxns = transactions.filter((t) => {
      if (t.type !== 'sell_return' && t.type !== 'sale_return') return false;
      const transDateStr = normalizeDateToYMD(t.date);
      return (!startDate || transDateStr >= startDate) && (!endDate || transDateStr <= endDate);
    });

    const purchaseReturnTxns = transactions.filter((t) => {
      if (t.type !== 'purchase_return') return false;
      const transDateStr = normalizeDateToYMD(t.date);
      return (!startDate || transDateStr >= startDate) && (!endDate || transDateStr <= endDate);
    });

    const totalSellReturnExcTax = sellReturnTxns.reduce((sum, t) => sum + (t.totalAmount - (t.taxAmount || 0)), 0);
    const totalPurchaseReturnExcTax = purchaseReturnTxns.reduce((sum, t) => sum + (t.totalAmount - (t.taxAmount || 0)), 0);

    // Shipping charges
    const totalPurchaseShippingCharges = purchaseTxns.reduce((sum, t) => sum + (t.shippingCharges || 0), 0);
    const totalSalesShippingCharges = salesTxns.reduce((sum, t) => sum + (t.shippingCharges || 0), 0);

    // Stock Adjustments
    const filteredAdjustments = stockAdjustments.filter((adj) => {
      const adjDateStr = normalizeDateToYMD(adj.date);
      return adjDateStr >= startDate && adjDateStr <= endDate;
    });

    let totalStockAdjustmentAmt = 0;
    filteredAdjustments.forEach((adj) => {
      adj.items.forEach((item) => {
        const val = item.quantity * item.unitCost;
        if (item.type === 'found') {
          totalStockAdjustmentAmt -= val;
        } else {
          totalStockAdjustmentAmt += val;
        }
      });
    });

    const totalStockRecovery = filteredAdjustments.reduce((sum, adj) => sum + (adj.totalAmountRecovered || 0), 0);

    // Purchases & Sales Excluding Tax
    const totalPurchaseExcTax = purchaseTxns.reduce((sum, t) => sum + (t.subtotal || t.totalAmount - (t.taxAmount || 0)), 0);
    const totalSalesExcTax = salesTxns.reduce((sum, t) => sum + (t.subtotal || t.totalAmount - (t.taxAmount || 0)), 0);

    // Real-Time Inventory Valuation (Stock level is independent of date range, but we can display current snapshot)
    let stockValuationCost = 0;
    let stockValuationRetail = 0;
    products.forEach((p) => {
      stockValuationCost += p.currentStock * p.costPrice;
      stockValuationRetail += p.currentStock * p.sellingPrice;
    });

    // Opening Stock (dynamic formula)
    let totalPurchasedCostAllTime = 0;
    let totalSoldCostAllTime = 0;
    transactions.forEach((t) => {
      if (t.type === 'purchase') {
        t.items.forEach((item) => {
          totalPurchasedCostAllTime += (item.costPrice || 0) * item.quantity;
        });
      } else if (t.type === 'sale' && t.status === 'final') {
        t.items.forEach((item) => {
          totalSoldCostAllTime += (item.costPrice || 0) * item.quantity;
        });
      }
    });

    const openingStockCost = Math.max(0, stockValuationCost + totalSoldCostAllTime - totalPurchasedCostAllTime);
    const openingStockRetail = Math.max(0, stockValuationRetail + (totalSoldCostAllTime * 1.3) - (totalPurchasedCostAllTime * 1.3));

    return {
      totalSales: grossSales,
      totalDiscounts,
      netSales,
      cogs,
      grossProfit,
      grossProfitMargin,
      totalExpenses: totalExpensesAmount,
      netProfit,
      netProfitMargin,
      totalPurchases,
      totalTax: totalTaxCollected,
      stockValuationCost,
      stockValuationRetail,
      totalSellReturnExcTax,
      totalPurchaseReturnExcTax,
      totalPurchaseShippingCharges,
      totalSalesShippingCharges,
      totalStockAdjustmentAmt,
      totalStockRecovery,
      totalPurchaseExcTax,
      totalSalesExcTax,
      openingStockCost,
      openingStockRetail,
    };
  }, [transactions, expenses, products, stockAdjustments, startDate, endDate]);

  // Sales transactions within range for sub-tab profit breakdowns
  const salesTxnsForProfit = useMemo(() => {
    return transactions.filter((t) => {
      if (!isSaleTransaction(t) || t.status === 'draft' || t.status === 'quotation') return false;
      return isDateWithinRange(t.date, startDate, endDate);
    });
  }, [transactions, startDate, endDate]);

  // Profit by Category calculation
  const categoryProfits = useMemo(() => {
    const map: Record<string, { name: string; sales: number; cogs: number }> = {};
    salesTxnsForProfit.forEach((t) => {
      t.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'Uncategorized';
        if (!map[cat]) {
          map[cat] = { name: cat, sales: 0, cogs: 0 };
        }
        map[cat].sales += item.sellingPrice * item.quantity;
        map[cat].cogs += (item.costPrice || 0) * item.quantity;
      });
    });
    return Object.values(map).map((c) => ({
      ...c,
      profit: c.sales - c.cogs,
    }));
  }, [salesTxnsForProfit, products]);

  // Profit by Brand calculation
  const brandProfits = useMemo(() => {
    const map: Record<string, { name: string; sales: number; cogs: number }> = {};
    salesTxnsForProfit.forEach((t) => {
      t.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const brand = prod?.brand || 'No Brand';
        if (!map[brand]) {
          map[brand] = { name: brand, sales: 0, cogs: 0 };
        }
        map[brand].sales += item.sellingPrice * item.quantity;
        map[brand].cogs += (item.costPrice || 0) * item.quantity;
      });
    });
    return Object.values(map).map((b) => ({
      ...b,
      profit: b.sales - b.cogs,
    }));
  }, [salesTxnsForProfit, products]);

  // Profit by Date calculation
  const dateProfits = useMemo(() => {
    const map: Record<string, { date: string; sales: number; cogs: number }> = {};
    salesTxnsForProfit.forEach((t) => {
      const dateStr = t.date.substring(0, 10);
      if (!map[dateStr]) {
        map[dateStr] = { date: dateStr, sales: 0, cogs: 0 };
      }
      map[dateStr].sales += t.subtotal;
      t.items.forEach((item) => {
        map[dateStr].cogs += (item.costPrice || 0) * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date)).map((d) => ({
      ...d,
      profit: d.sales - d.cogs,
    }));
  }, [salesTxnsForProfit]);

  // Profit by Invoice calculation
  const invoiceProfits = useMemo(() => {
    return salesTxnsForProfit.map((t) => {
      let invCogs = 0;
      t.items.forEach((item) => {
        invCogs += (item.costPrice || 0) * item.quantity;
      });
      return {
        invoiceNo: t.invoiceNo,
        date: t.date,
        customerName: customers.find((c) => c.id === t.customerId)?.name || 'Walk-In Customer',
        sales: t.subtotal,
        cogs: invCogs,
        profit: t.subtotal - invCogs,
        transaction: t,
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [salesTxnsForProfit, customers]);

  // Profit by Day calculation
  const dayProfits = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const map: Record<string, { day: string; sales: number; cogs: number }> = {};
    days.forEach((d) => {
      map[d] = { day: d, sales: 0, cogs: 0 };
    });
    salesTxnsForProfit.forEach((t) => {
      const d = new Date(t.date);
      const dayName = days[d.getDay()];
      map[dayName].sales += t.subtotal;
      t.items.forEach((item) => {
        map[dayName].cogs += (item.costPrice || 0) * item.quantity;
      });
    });
    return days.map((d) => ({
      ...map[d],
      profit: map[d].sales - map[d].cogs,
    }));
  }, [salesTxnsForProfit]);

  // Profit by Product calculation
  const productProfits = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; sales: number; cogs: number }> = {};
    salesTxnsForProfit.forEach((t) => {
      t.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const prodName = prod?.name || item.name || 'Unknown Product';
        if (!map[prodName]) {
          map[prodName] = { name: prodName, quantity: 0, sales: 0, cogs: 0 };
        }
        map[prodName].quantity += item.quantity;
        map[prodName].sales += item.sellingPrice * item.quantity;
        map[prodName].cogs += (item.costPrice || 0) * item.quantity;
      });
    });
    return Object.values(map).map((p) => ({
      ...p,
      profit: p.sales - p.cogs,
      marginStr: p.sales > 0 ? ((p.sales - p.cogs) / p.sales * 100).toFixed(1) + '%' : '0.0%',
    })).sort((a, b) => b.profit - a.profit);
  }, [salesTxnsForProfit, products]);

  // Profit by Customer calculation
  const customerProfits = useMemo(() => {
    const map: Record<string, { name: string; sales: number; cogs: number; invoiceCount: number }> = {};
    salesTxnsForProfit.forEach((t) => {
      const cust = customers.find((c) => c.id === t.customerId);
      const custName = cust?.name || t.customerName || 'Walk-In Customer';
      if (!map[custName]) {
        map[custName] = { name: custName, sales: 0, cogs: 0, invoiceCount: 0 };
      }
      map[custName].sales += t.subtotal;
      map[custName].invoiceCount += 1;
      t.items.forEach((item) => {
        map[custName].cogs += (item.costPrice || 0) * item.quantity;
      });
    });
    return Object.values(map).map((c) => ({
      ...c,
      profit: c.sales - c.cogs,
      marginStr: c.sales > 0 ? ((c.sales - c.cogs) / c.sales * 100).toFixed(1) + '%' : '0.0%',
    })).sort((a, b) => b.profit - a.profit);
  }, [salesTxnsForProfit, customers]);

  const categoryProfitsWithMargin = useMemo(() => {
    return categoryProfits.map(c => ({
      ...c,
      marginStr: c.sales > 0 ? ((c.profit / c.sales) * 100).toFixed(1) + '%' : '0.0%',
    }));
  }, [categoryProfits]);

  const brandProfitsWithMargin = useMemo(() => {
    return brandProfits.map(b => ({
      ...b,
      marginStr: b.sales > 0 ? ((b.profit / b.sales) * 100).toFixed(1) + '%' : '0.0%',
    }));
  }, [brandProfits]);

  const dateProfitsWithMargin = useMemo(() => {
    return dateProfits.map(d => ({
      ...d,
      marginStr: d.sales > 0 ? ((d.profit / d.sales) * 100).toFixed(1) + '%' : '0.0%',
    }));
  }, [dateProfits]);

  const invoiceProfitsWithMargin = useMemo(() => {
    return invoiceProfits.map(inv => ({
      ...inv,
      marginStr: inv.sales > 0 ? ((inv.profit / inv.sales) * 100).toFixed(1) + '%' : '0.0%',
    }));
  }, [invoiceProfits]);

  const dayProfitsWithMargin = useMemo(() => {
    return dayProfits.map(d => ({
      ...d,
      marginStr: d.sales > 0 ? ((d.profit / d.sales) * 100).toFixed(1) + '%' : '0.0%',
    }));
  }, [dayProfits]);

  const exportDataConfig = useMemo(() => {
    switch (plTab) {
      case 'category':
        return {
          headers: ['Category Name', 'Gross Sales Revenue', 'Cost of Goods Sold (COGS)', 'Gross Profit', 'Net Margin %'],
          keys: ['name', 'sales', 'cogs', 'profit', 'marginStr'],
          data: categoryProfitsWithMargin,
          filename: 'profit_by_category',
          title: 'Profit & Loss by Category',
        };
      case 'brand':
        return {
          headers: ['Brand Name', 'Gross Sales Revenue', 'Cost of Goods Sold (COGS)', 'Gross Profit', 'Net Margin %'],
          keys: ['name', 'sales', 'cogs', 'profit', 'marginStr'],
          data: brandProfitsWithMargin,
          filename: 'profit_by_brand',
          title: 'Profit & Loss by Brand',
        };
      case 'product':
        return {
          headers: ['Product Name', 'Quantity Sold', 'Gross Sales Revenue', 'Cost of Goods Sold (COGS)', 'Gross Profit', 'Net Margin %'],
          keys: ['name', 'quantity', 'sales', 'cogs', 'profit', 'marginStr'],
          data: productProfits,
          filename: 'profit_by_product',
          title: 'Profit & Loss by Product',
        };
      case 'customer':
        return {
          headers: ['Customer Name', 'Total Sales Revenue', 'Cost of Goods Sold (COGS)', 'Gross Profit', 'Net Margin %'],
          keys: ['name', 'sales', 'cogs', 'profit', 'marginStr'],
          data: customerProfits,
          filename: 'profit_by_customer',
          title: 'Profit & Loss by Customer',
        };
      case 'date':
        return {
          headers: ['Transaction Date', 'Gross Sales Revenue', 'Cost of Goods Sold (COGS)', 'Gross Profit', 'Net Margin %'],
          keys: ['date', 'sales', 'cogs', 'profit', 'marginStr'],
          data: dateProfitsWithMargin,
          filename: 'profit_by_date',
          title: 'Profit & Loss by Date',
        };
      case 'invoice':
        return {
          headers: ['Invoice No', 'Date', 'Customer', 'Gross Sales', 'COGS Cost', 'Profit Earned', 'Net Margin %'],
          keys: ['invoiceNo', 'date', 'customerName', 'sales', 'cogs', 'profit', 'marginStr'],
          data: invoiceProfitsWithMargin,
          filename: 'profit_by_invoice',
          title: 'Profit & Loss by Invoice',
        };
      case 'day':
        return {
          headers: ['Day of the Week', 'Gross Sales Revenue', 'Cost of Goods Sold (COGS)', 'Gross Profit', 'Net Margin %'],
          keys: ['day', 'sales', 'cogs', 'profit', 'marginStr'],
          data: dayProfitsWithMargin,
          filename: 'profit_by_day',
          title: 'Profit & Loss by Day',
        };
      default:
        return {
          headers: ['Category Name', 'Gross Sales Revenue', 'Cost of Goods Sold (COGS)', 'Gross Profit', 'Net Margin %'],
          keys: ['name', 'sales', 'cogs', 'profit', 'marginStr'],
          data: categoryProfitsWithMargin,
          filename: 'profit_loss_report',
          title: 'Profit & Loss Statement',
        };
    }
  }, [plTab, categoryProfitsWithMargin, brandProfitsWithMargin, productProfits, customerProfits, dateProfitsWithMargin, invoiceProfitsWithMargin, dayProfitsWithMargin]);

  // Filter Purchase Transactions within Range
  const filteredPurchases = useMemo(() => {
    return transactions.filter((t) => {
      if (!isPurchaseTransaction(t)) return false;

      const isWithinDate = isDateWithinRange(t.date, startDate, endDate);
      const isSupplierMatch = supplierFilter === 'all' || t.supplierId === supplierFilter;
      const isSearchMatch = searchInvoice.trim() === '' || (t.invoiceNo && t.invoiceNo.toLowerCase().includes(searchInvoice.toLowerCase()));

      return isWithinDate && isSupplierMatch && isSearchMatch;
    });
  }, [transactions, startDate, endDate, supplierFilter, searchInvoice]);

  // Aggregate metrics for Purchase Report
  const purchaseMetrics = useMemo(() => {
    let totalExcludingTax = 0;
    let totalIncludingTax = 0;
    let totalDues = 0;
    let totalTaxAmount = 0;
    let totalPaid = 0;

    filteredPurchases.forEach((p) => {
      totalIncludingTax += p.totalAmount;
      totalTaxAmount += p.taxAmount || 0;
      totalExcludingTax += (p.totalAmount - (p.taxAmount || 0));
      totalPaid += p.paidAmount || 0;
      
      const outstanding = Math.max(0, p.totalAmount - p.paidAmount);
      totalDues += outstanding;
    });

    return {
      totalExcludingTax,
      totalIncludingTax,
      totalDues,
      totalTaxAmount,
      totalPaid,
    };
  }, [filteredPurchases]);

  // Filter Sale Transactions within Range
  const filteredSales = useMemo(() => {
    return transactions.filter((t) => {
      if (!isSaleTransaction(t)) return false;

      const isWithinDate = isDateWithinRange(t.date, startDate, endDate);
      const isCustomerMatch = customerFilter === 'all' || t.customerId === customerFilter;
      const isSearchMatch = searchInvoice.trim() === '' || (t.invoiceNo && t.invoiceNo.toLowerCase().includes(searchInvoice.toLowerCase()));

      return isWithinDate && isCustomerMatch && isSearchMatch;
    });
  }, [transactions, startDate, endDate, customerFilter, searchInvoice]);

  // Aggregate metrics for Sale Report
  const saleMetrics = useMemo(() => {
    let totalExcludingTax = 0;
    let totalIncludingTax = 0;
    let totalDues = 0;
    let totalTaxAmount = 0;
    let totalPaid = 0;

    filteredSales.forEach((s) => {
      totalIncludingTax += s.totalAmount;
      totalTaxAmount += s.taxAmount || 0;
      totalExcludingTax += (s.totalAmount - (s.taxAmount || 0));
      totalPaid += s.paidAmount || 0;
      
      const outstanding = Math.max(0, s.totalAmount - s.paidAmount);
      totalDues += outstanding;
    });

    return {
      totalExcludingTax,
      totalIncludingTax,
      totalDues,
      totalTaxAmount,
      totalPaid,
    };
  }, [filteredSales]);

  // Aggregate metrics and data for Tax Report
  const taxReportData = useMemo(() => {
    // 1. Output Tax (Sales)
    const salesTxns = transactions.filter((t) => {
      if (!isSaleTransaction(t)) return false;
      return isDateWithinRange(t.date, startDate, endDate);
    });

    let totalOutputTax = 0;
    let totalTaxableSales = 0;
    const saleTaxEntries: any[] = [];

    salesTxns.forEach((t) => {
      const itemsTax = (t.items || []).reduce((sum, item) => {
        const lineTax = Number(item.taxAmount) || 0;
        if (lineTax > 0) return sum + lineTax;
        const rate = Number(item.taxRate) || 0;
        if (rate > 0) {
          const base = Number(item.unitPrice || item.costPrice || 0);
          const qty = Number(item.quantity) || 1;
          return sum + ((base * rate) / 100) * qty;
        }
        return sum;
      }, 0);
      const directTax = Number(t.taxAmount) || 0;
      const taxAmt = Math.max(directTax, itemsTax);
      const taxable = Math.max(0, Number(t.totalAmount || 0) - taxAmt);

      totalOutputTax += taxAmt;
      totalTaxableSales += taxable;

      if (taxAmt > 0 || taxable > 0) {
        const primaryRate = (t as any).orderTaxRate || (t.items?.find((it: any) => (Number(it.taxRate) || 0) > 0)?.taxRate) || (taxable > 0 ? Math.round((taxAmt / taxable) * 100) : 0);
        saleTaxEntries.push({
          id: t.id,
          date: normalizeDateToYMD(t.date) || (t.date ? t.date.substring(0, 10) : ''),
          type: 'Sale (Output)',
          refNo: t.invoiceNo,
          entity: customers.find(c => c.id === t.customerId)?.name || (t as any).customerName || 'Walk-In Customer',
          taxableAmount: taxable,
          taxAmount: taxAmt,
          taxRate: primaryRate,
          taxNumber: customers.find(c => c.id === t.customerId)?.taxNumber || 'N/A',
          status: t.paymentStatus || 'Collected',
          totalAmount: Number(t.totalAmount || 0),
          discountAmount: Number(t.discountAmount || 0),
          discountType: t.discountType || 'fixed',
          paymentMethod: t.paymentMethod || (t.paymentEntries?.[0]?.method) || 'Cash',
        });
      }
    });

    // 2. Input Tax (Purchases)
    const purchaseTxns = transactions.filter((t) => {
      if (!isPurchaseTransaction(t)) return false;
      return isDateWithinRange(t.date, startDate, endDate);
    });

    let totalInputTax = 0;
    let totalTaxablePurchases = 0;
    const purchaseTaxEntries: any[] = [];

    purchaseTxns.forEach((t) => {
      const itemsTax = (t.items || []).reduce((sum, item) => {
        const lineTax = Number(item.taxAmount) || 0;
        if (lineTax > 0) return sum + lineTax;
        const rate = Number(item.taxRate) || 0;
        if (rate > 0) {
          const base = Number(item.costPrice || item.unitPrice || 0);
          const qty = Number(item.quantity) || 1;
          return sum + ((base * rate) / 100) * qty;
        }
        return sum;
      }, 0);
      const directTax = Number(t.taxAmount) || 0;
      const taxAmt = Math.max(directTax, itemsTax);
      const taxable = Math.max(0, Number(t.totalAmount || 0) - taxAmt);

      totalInputTax += taxAmt;
      totalTaxablePurchases += taxable;

      if (taxAmt > 0 || taxable > 0) {
        const primaryRate = (t as any).orderTaxRate || (t.items?.find((it: any) => (Number(it.taxRate) || 0) > 0)?.taxRate) || (taxable > 0 ? Math.round((taxAmt / taxable) * 100) : 0);
        purchaseTaxEntries.push({
          id: t.id,
          date: normalizeDateToYMD(t.date) || (t.date ? t.date.substring(0, 10) : ''),
          type: 'Purchase (Input)',
          refNo: t.invoiceNo,
          entity: suppliers.find(s => s.id === t.supplierId)?.name || (t as any).supplierName || 'Generic Supplier',
          taxableAmount: taxable,
          taxAmount: taxAmt,
          taxRate: primaryRate,
          taxNumber: suppliers.find(s => s.id === t.supplierId)?.taxNumber || 'N/A',
          status: t.paymentStatus || 'Paid',
          totalAmount: Number(t.totalAmount || 0),
          discountAmount: Number(t.discountAmount || 0),
          discountType: t.discountType || 'fixed',
          paymentMethod: t.paymentMethod || (t.paymentEntries?.[0]?.method) || 'Cash',
        });
      }
    });

    // 3. Expense Taxes
    const inRangeExpenses = expenses.filter((e) => {
      return isDateWithinRange(e.date, startDate, endDate);
    });

    let totalExpenseTax = 0;
    let totalTaxableExpenses = 0;
    const expenseTaxEntries: any[] = [];

    inRangeExpenses.forEach((e) => {
      const taxAmt = (e as any).taxAmount || 0;
      totalExpenseTax += taxAmt;
      totalTaxableExpenses += (e.amount - taxAmt);
      if (taxAmt > 0) {
        const rateObj = taxRates.find(tr => tr.id === (e as any).taxRateId);
        const rate = rateObj ? rateObj.rate : Math.round((taxAmt / (e.amount - taxAmt)) * 100) || 0;
        expenseTaxEntries.push({
          id: e.id,
          date: normalizeDateToYMD(e.date) || (e.date ? e.date.substring(0, 10) : ''),
          type: 'Expense Tax',
          refNo: e.referenceNo,
          entity: e.paidTo || e.category,
          taxableAmount: e.amount - taxAmt,
          taxAmount: taxAmt,
          taxRate: rate,
          taxNumber: 'N/A',
          status: 'Paid',
          totalAmount: Number(e.amount || 0),
          discountAmount: 0,
          discountType: 'fixed',
          paymentMethod: e.paymentMethod || 'Cash',
        });
      }
    });

    const netTaxPayable = totalOutputTax - totalInputTax - totalExpenseTax;
    const allEntries = [...saleTaxEntries, ...purchaseTaxEntries, ...expenseTaxEntries].sort((a, b) => b.date.localeCompare(a.date));

    // Aggregate by Tax Rate percentage
    const taxRateSummaryMap: { [key: number]: { taxable: number; tax: number; count: number } } = {};
    
    // Aggregate sales item taxes
    salesTxns.forEach((t) => {
      (t.items || []).forEach((item) => {
        const rate = Number(item.taxRate) || 0;
        const tax = Number(item.taxAmount) || (rate > 0 ? ((Number(item.unitPrice || item.costPrice || 0) * rate) / 100) * (Number(item.quantity) || 1) : 0);
        const taxable = Math.max(0, (Number(item.total) || 0) - tax);
        if (rate > 0 || tax > 0) {
          if (!taxRateSummaryMap[rate]) {
            taxRateSummaryMap[rate] = { taxable: 0, tax: 0, count: 0 };
          }
          taxRateSummaryMap[rate].taxable += taxable;
          taxRateSummaryMap[rate].tax += tax;
          taxRateSummaryMap[rate].count += 1;
        }
      });
      // Also account for transaction orderTax if not already on items
      const orderRate = Number((t as any).orderTaxRate) || 0;
      const orderTax = Number(t.taxAmount) || 0;
      if (orderRate > 0 && orderTax > 0 && !(t.items || []).some((it: any) => (Number(it.taxRate) || 0) > 0)) {
        if (!taxRateSummaryMap[orderRate]) {
          taxRateSummaryMap[orderRate] = { taxable: 0, tax: 0, count: 0 };
        }
        taxRateSummaryMap[orderRate].taxable += Math.max(0, Number(t.totalAmount || 0) - orderTax);
        taxRateSummaryMap[orderRate].tax += orderTax;
        taxRateSummaryMap[orderRate].count += 1;
      }
    });

    // Aggregate purchase item taxes
    purchaseTxns.forEach((t) => {
      (t.items || []).forEach((item) => {
        const rate = Number(item.taxRate) || 0;
        const tax = Number(item.taxAmount) || (rate > 0 ? ((Number(item.costPrice || item.unitPrice || 0) * rate) / 100) * (Number(item.quantity) || 1) : 0);
        const taxable = Math.max(0, (Number(item.total) || 0) - tax);
        if (rate > 0 || tax > 0) {
          if (!taxRateSummaryMap[rate]) {
            taxRateSummaryMap[rate] = { taxable: 0, tax: 0, count: 0 };
          }
          taxRateSummaryMap[rate].taxable += taxable;
          taxRateSummaryMap[rate].tax += tax;
          taxRateSummaryMap[rate].count += 1;
        }
      });
      // Also account for purchase orderTax if not already on items
      const orderRate = Number((t as any).orderTaxRate) || 0;
      const orderTax = Number(t.taxAmount) || 0;
      if (orderRate > 0 && orderTax > 0 && !(t.items || []).some((it: any) => (Number(it.taxRate) || 0) > 0)) {
        if (!taxRateSummaryMap[orderRate]) {
          taxRateSummaryMap[orderRate] = { taxable: 0, tax: 0, count: 0 };
        }
        taxRateSummaryMap[orderRate].taxable += Math.max(0, Number(t.totalAmount || 0) - orderTax);
        taxRateSummaryMap[orderRate].tax += orderTax;
        taxRateSummaryMap[orderRate].count += 1;
      }
    });

    const taxRateSummary = Object.keys(taxRateSummaryMap).map((key) => {
      const rate = parseFloat(key);
      return {
        rate,
        ...taxRateSummaryMap[rate],
      };
    }).sort((a, b) => b.rate - a.rate);

    return {
      totalOutputTax,
      totalTaxableSales,
      totalInputTax,
      totalTaxablePurchases,
      totalExpenseTax,
      totalTaxableExpenses,
      netTaxPayable,
      allEntries,
      saleTaxEntries,
      purchaseTaxEntries,
      expenseTaxEntries,
      taxRateSummary,
    };
  }, [transactions, expenses, customers, suppliers, startDate, endDate]);

  if (isProductPurchaseReport) {
    return <ProductPurchaseReportView />;
  }

  if (isPurchasePaymentReport) {
    return <PurchasePaymentReportView />;
  }

  if (isSellPaymentReport) {
    return <SellPaymentReportView />;
  }

  if (isProductSellReport) {
    return <ProductSellReportView />;
  }

  if (activeTab === 'purchase_sale_product_report') {
    return <PurchaseSaleProductReportView />;
  }

  if (isStockReport) {
    return <StockReportView />;
  }

  if (isStockAdjustmentReport) {
    return <StockAdjustmentReportView />;
  }

  if (isSalesRepresentativeReport) {
    return <SalesRepresentativeReportView />;
  }

  if (isCustomerSupplierReport) {
    return <CustomerSupplierReportView />;
  }

  if (isTaxReport) {
    // Determine active list based on selected tax tab
    const activeEntries = (() => {
      if (taxTab === 'output') return taxReportData.saleTaxEntries;
      if (taxTab === 'input') return taxReportData.purchaseTaxEntries;
      return taxReportData.expenseTaxEntries;
    })();

    // Apply active list search filter
    const filteredEntries = activeEntries.filter(entry => {
      if (!taxSearch) return true;
      const searchLower = taxSearch.toLowerCase();
      return (
        entry.refNo?.toLowerCase().includes(searchLower) ||
        entry.entity?.toLowerCase().includes(searchLower) ||
        entry.taxNumber?.toLowerCase().includes(searchLower)
      );
    });

    const taxExportConfig = (() => {
      if (taxTab === 'output') {
        return {
          headers: ['Date', 'Reference No', 'Customer Name', 'Tax Number', 'Tax Rate (%)', 'Taxable Amount', 'Tax Amount', 'Status'],
          keys: ['date', 'refNo', 'entity', 'taxNumber', 'taxRate', 'taxableAmount', 'taxAmount', 'status'],
          data: taxReportData.saleTaxEntries,
          filename: 'sales_output_tax_report',
          title: 'Sales Output Tax Report',
        };
      } else if (taxTab === 'input') {
        return {
          headers: ['Date', 'Reference No', 'Supplier Name', 'Tax Number', 'Tax Rate (%)', 'Taxable Amount', 'Tax Amount', 'Status'],
          keys: ['date', 'refNo', 'entity', 'taxNumber', 'taxRate', 'taxableAmount', 'taxAmount', 'status'],
          data: taxReportData.purchaseTaxEntries,
          filename: 'purchase_input_tax_report',
          title: 'Purchase Input Tax Report',
        };
      } else {
        return {
          headers: ['Date', 'Reference No', 'Expense Entity', 'Tax Number', 'Tax Rate (%)', 'Taxable Amount', 'Tax Amount', 'Status'],
          keys: ['date', 'refNo', 'entity', 'taxNumber', 'taxRate', 'taxableAmount', 'taxAmount', 'status'],
          data: taxReportData.expenseTaxEntries,
          filename: 'expense_tax_report',
          title: 'Expense Tax Report',
        };
      }
    })();

    return (
      <div className="p-4 sm:p-6 space-y-6 w-full max-w-7xl mx-auto">
        {/* Top Header & Export Ribbon */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Percent className="w-5 h-5 text-indigo-500" />
              <span>Tax Report</span>
            </h1>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Tax details for the selected period. Reconcile sales output taxes, input purchase taxes, and expense tax components.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Tax Record</span>
            </button>
            <ExportButtons
              headers={taxExportConfig.headers}
              keys={taxExportConfig.keys}
              data={taxExportConfig.data}
              filename={taxExportConfig.filename}
              title={taxExportConfig.title}
              isLight={isLight}
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className={`rounded-2xl border p-6 space-y-4 transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <div className={`flex items-center gap-2 font-semibold text-xs ${
              isLight ? 'text-slate-800' : 'text-white'
            }`}>
              <Filter className="w-4 h-4 text-indigo-500" />
              <span>Filters & Parameters</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['This Month', 'Last Month', 'Current Financial Year', 'Last Financial Year', 'Last 30 Days', 'All Time'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition ${
                    datePreset === preset
                      ? isLight
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                      : isLight
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Business Location Selector */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Business Location
              </label>
              <select
                disabled
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition cursor-not-allowed ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <option>{currentLocation?.name || 'All Locations'}</option>
              </select>
              <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Preset based on active session terminal</p>
            </div>

            {/* Start Date */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('Custom');
                }}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            {/* End Date */}
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('Custom');
                }}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Summary Metric Blocks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Output Tax */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Output Tax</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Sales Collected</p>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-white font-mono">
                {formatCurrency(taxReportData.totalOutputTax, settings)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">
                Taxable Sales: {formatCurrency(taxReportData.totalTaxableSales, settings)}
              </div>
            </div>
            <div className="absolute right-4 top-4 p-2.5 bg-slate-950 text-indigo-400 rounded-xl border border-slate-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          {/* Input Tax */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Input Tax</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Purchase Paid</p>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-white font-mono">
                {formatCurrency(taxReportData.totalInputTax, settings)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">
                Taxable Purchases: {formatCurrency(taxReportData.totalTaxablePurchases, settings)}
              </div>
            </div>
            <div className="absolute right-4 top-4 p-2.5 bg-slate-950 text-blue-400 rounded-xl border border-slate-800">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          {/* Expense Tax */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Expense Tax</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Expense Tax Paid</p>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-white font-mono">
                {formatCurrency(taxReportData.totalExpenseTax, settings)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">
                Taxable Expenses: {formatCurrency(taxReportData.totalTaxableExpenses, settings)}
              </div>
            </div>
            <div className="absolute right-4 top-4 p-2.5 bg-slate-950 text-amber-400 rounded-xl border border-slate-800">
              <Boxes className="w-4 h-4" />
            </div>
          </div>

          {/* Net Tax Liability / Refund */}
          <div className={`bg-slate-900 p-6 rounded-2xl border ${
            taxReportData.netTaxPayable >= 0 ? 'border-rose-900/40 ring-1 ring-rose-500/10' : 'border-emerald-900/40 ring-1 ring-emerald-500/10'
          } hover:border-slate-700 transition relative overflow-hidden flex flex-col justify-between min-h-[140px]`}>
            <div>
              <div className={`text-[11px] font-bold uppercase tracking-wider ${
                taxReportData.netTaxPayable >= 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {taxReportData.netTaxPayable >= 0 ? 'Net Tax Payable' : 'Net Tax Refund'}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Output - Input - Expense</p>
            </div>
            <div className="mt-4">
              <div className={`text-2xl font-extrabold font-mono ${
                taxReportData.netTaxPayable >= 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {formatCurrency(Math.abs(taxReportData.netTaxPayable), settings)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">
                {taxReportData.netTaxPayable >= 0 ? 'Estimated liability due' : 'Estimated carry forward credit'}
              </div>
            </div>
            <div className={`absolute right-4 top-4 p-2.5 rounded-xl ${
              taxReportData.netTaxPayable >= 0 ? 'bg-rose-950/40 text-rose-400' : 'bg-emerald-950/40 text-emerald-400'
            }`}>
              <Percent className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Column Visibility Section (Reference Screenshot Style) */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm transition-colors duration-300 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 bg-slate-950/80 ${showColumnVisibility ? 'border-b border-slate-800' : ''}`}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
                <Columns className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Column Visibility</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {Object.values(taxVisibleColumns).filter(Boolean).length} of {TAX_COLUMN_DEFINITIONS.length} Visible
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 hidden sm:inline-flex">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Admin Privileges</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                  Select which columns to display in the Tax Report table.
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
              {showColumnVisibility && (
                <div className="flex items-center gap-1.5 mr-2">
                  <button
                    type="button"
                    onClick={() => handleTaxPreset('all')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTaxPreset('standard')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTaxPreset('compact')}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer hidden sm:inline-block"
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTaxPreset('reset')}
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
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
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
            <div className="border-t border-slate-800/50 animate-in slide-in-from-top-2 duration-200 bg-slate-900/50 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {TAX_COLUMN_DEFINITIONS.map((col) => {
                  const isVisible = taxVisibleColumns[col.key as keyof typeof taxVisibleColumns];
                  const isLocked = col.locked;

                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => {
                        if (!isLocked) {
                          setTaxVisibleColumns(prev => ({ ...prev, [col.key]: !isVisible }));
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
                            <Lock className="w-2.5 h-2.5" /> FIXED
                          </span>
                        ) : (
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isVisible
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}>
                            {isVisible ? 'SHOWN' : 'HIDDEN'}
                          </span>
                        )}
                      </div>
                      <div className="w-full">
                        <div className={`text-xs font-bold ${isVisible ? 'text-white' : 'text-slate-400'}`}>
                          {col.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5 hidden sm:block">
                          {col.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* finias POS Styled Tab-based Ledger Details Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          {/* Inner Header with Section description */}
          <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm">Tax details for the selected period</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Browse detailed line-item level transaction entries mapped dynamically to Output, Input, or Expense Tax.
              </p>
            </div>

            {/* Live Search inside the tab ledger */}
            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="Search by reference, entity, or tax ID..."
                value={taxSearch}
                onChange={(e) => setTaxSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Tab Selection Buttons */}
          <div className="bg-slate-950/40 border-b border-slate-850 px-6 py-3 flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => { setTaxTab('output'); setTaxSearch(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 whitespace-nowrap ${
                taxTab === 'output'
                  ? 'bg-indigo-600/10 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-900/10'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span>Output Tax (Sales)</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                taxTab === 'output' ? 'bg-indigo-600/30 text-indigo-300' : 'bg-slate-900 text-slate-500'
              }`}>
                {taxReportData.saleTaxEntries.length}
              </span>
            </button>

            <button
              onClick={() => { setTaxTab('input'); setTaxSearch(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 whitespace-nowrap ${
                taxTab === 'input'
                  ? 'bg-blue-600/10 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-900/10'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span>Input Tax (Purchases)</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                taxTab === 'input' ? 'bg-blue-600/30 text-blue-300' : 'bg-slate-900 text-slate-500'
              }`}>
                {taxReportData.purchaseTaxEntries.length}
              </span>
            </button>

            <button
              onClick={() => { setTaxTab('expense'); setTaxSearch(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 whitespace-nowrap ${
                taxTab === 'expense'
                  ? 'bg-amber-600/10 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-900/10'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <span>Expense Tax</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                taxTab === 'expense' ? 'bg-amber-600/30 text-amber-300' : 'bg-slate-900 text-slate-500'
              }`}>
                {taxReportData.expenseTaxEntries.length}
              </span>
            </button>
          </div>

          {/* Table Ledger View with Horizontal Scroll & Column Visibility */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  {taxVisibleColumns.date && <th className="py-4.5 px-6">Date</th>}
                  {taxVisibleColumns.invoiceNo && <th className="py-4.5 px-4">Invoice No.</th>}
                  {taxVisibleColumns.entity && (
                    <th className="py-4.5 px-4">
                      {taxTab === 'output' ? 'Customer' : taxTab === 'input' ? 'Supplier' : 'Expense Category / Entity'}
                    </th>
                  )}
                  {taxVisibleColumns.taxNumber && <th className="py-4.5 px-4">Tax number</th>}
                  {taxVisibleColumns.totalAmount && <th className="py-4.5 px-4 text-right">Total amount</th>}
                  {taxVisibleColumns.paymentMethod && <th className="py-4.5 px-4">Payment Method</th>}
                  {taxVisibleColumns.discount && <th className="py-4.5 px-4">Discount</th>}
                  {taxVisibleColumns.sgst && <th className="py-4.5 px-4 text-right">SGST</th>}
                  {taxVisibleColumns.cgst && <th className="py-4.5 px-4 text-right">CGST</th>}
                  {taxVisibleColumns.gst && <th className="py-4.5 px-6 text-right">GST</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(taxVisibleColumns).filter(Boolean).length || 1} className="py-12 text-center text-slate-500 font-semibold">
                      {taxSearch ? 'No matching tax records found.' : 'No tax records registered under this category for the selected dates.'}
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredEntries.map((entry, idx) => (
                      <tr key={entry.id || idx} className="hover:bg-slate-850/50 transition">
                        {taxVisibleColumns.date && <td className="py-4 px-6 font-mono text-slate-300 whitespace-nowrap">{entry.date}</td>}
                        {taxVisibleColumns.invoiceNo && <td className="py-4 px-4 font-mono font-bold text-slate-200">{entry.refNo}</td>}
                        {taxVisibleColumns.entity && <td className="py-4 px-4 font-semibold text-white">{entry.entity}</td>}
                        {taxVisibleColumns.taxNumber && <td className="py-4 px-4 font-mono text-slate-400">{entry.taxNumber || 'N/A'}</td>}
                        {taxVisibleColumns.totalAmount && (
                          <td className="py-4 px-4 text-right font-mono font-bold text-slate-200">
                            {formatCurrency(entry.totalAmount, settings)}
                          </td>
                        )}
                        {taxVisibleColumns.paymentMethod && (
                          <td className="py-4 px-4 font-semibold text-slate-300 capitalize">
                            {entry.paymentMethod || 'Cash'}
                          </td>
                        )}
                        {taxVisibleColumns.discount && (
                          <td className="py-4 px-4 font-mono text-slate-400">
                            {entry.discountAmount > 0 ? formatCurrency(entry.discountAmount, settings) : '0.00%'}
                          </td>
                        )}
                        {taxVisibleColumns.sgst && (
                          <td className="py-4 px-4 text-right font-mono">
                            <div className="font-semibold text-slate-300">
                              {formatCurrency(entry.taxAmount / 2, settings)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold">SGST ({(entry.taxRate / 2)}%)</div>
                          </td>
                        )}
                        {taxVisibleColumns.cgst && (
                          <td className="py-4 px-4 text-right font-mono">
                            <div className="font-semibold text-slate-300">
                              {formatCurrency(entry.taxAmount / 2, settings)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold">CGST ({(entry.taxRate / 2)}%)</div>
                          </td>
                        )}
                        {taxVisibleColumns.gst && (
                          <td className={`py-4 px-6 text-right font-mono font-bold ${
                            taxTab === 'output' ? 'text-indigo-400' : taxTab === 'input' ? 'text-blue-400' : 'text-amber-400'
                          }`}>
                            {formatCurrency(entry.taxAmount, settings)}
                          </td>
                        )}
                      </tr>
                    ))}
                    {/* Total Footer Row */}
                    <tr className="bg-slate-950 font-bold text-white border-t-2 border-slate-700">
                      {(() => {
                        const visCols = taxVisibleColumns;
                        const cells = [];
                        let leadSpan = 0;
                        if (visCols.date) leadSpan++;
                        if (visCols.invoiceNo) leadSpan++;
                        if (visCols.entity) leadSpan++;
                        if (visCols.taxNumber) leadSpan++;

                        if (leadSpan > 0) {
                          cells.push(
                            <td key="total-label" colSpan={leadSpan} className="py-4.5 px-6 text-right uppercase tracking-wider text-xs">
                              Total:
                            </td>
                          );
                        }
                        if (visCols.totalAmount) {
                          cells.push(
                            <td key="total-amount" className="py-4.5 px-4 text-right font-mono text-xs text-indigo-400">
                              {formatCurrency(filteredEntries.reduce((sum, e) => sum + (e.totalAmount || 0), 0), settings)}
                            </td>
                          );
                        }
                        if (visCols.paymentMethod) {
                          cells.push(
                            <td key="total-pm" className="py-4.5 px-4 text-xs text-slate-300">
                              {(() => {
                                const counts: Record<string, number> = {};
                                filteredEntries.forEach(e => {
                                  const method = e.paymentMethod || 'Cash';
                                  counts[method] = (counts[method] || 0) + 1;
                                });
                                return Object.entries(counts).map(([m, count]) => `${m} - ${count}`).join(', ');
                              })() || 'Cash'}
                            </td>
                          );
                        }
                        if (visCols.discount) {
                          cells.push(
                            <td key="total-disc" className="py-4.5 px-4 font-mono text-xs text-slate-400">-</td>
                          );
                        }
                        if (visCols.sgst) {
                          cells.push(
                            <td key="total-sgst" className="py-4.5 px-4 text-right font-mono text-xs text-slate-300">
                              {formatCurrency(filteredEntries.reduce((sum, e) => sum + ((e.taxAmount || 0) / 2), 0), settings)}
                            </td>
                          );
                        }
                        if (visCols.cgst) {
                          cells.push(
                            <td key="total-cgst" className="py-4.5 px-4 text-right font-mono text-xs text-slate-300">
                              {formatCurrency(filteredEntries.reduce((sum, e) => sum + ((e.taxAmount || 0) / 2), 0), settings)}
                            </td>
                          );
                        }
                        if (visCols.gst) {
                          cells.push(
                            <td key="total-gst" className="py-4.5 px-6 text-right font-mono text-xs text-indigo-400">
                              {formatCurrency(filteredEntries.reduce((sum, e) => sum + (e.taxAmount || 0), 0), settings)}
                            </td>
                          );
                        }
                        return cells;
                      })()}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Rate Slab Categories Breakdown */}
        {taxReportData.taxRateSummary.length > 0 && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-white text-sm">Tax Collected/Claimed by Rate Category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {taxReportData.taxRateSummary.map((rateObj) => (
                <div key={rateObj.rate} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{rateObj.rate}% Slab Category</span>
                    <span className="text-[10px] font-semibold text-slate-500">{rateObj.count} items recorded</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[10px] text-slate-500">Taxable Turn-over</div>
                      <div className="text-xs font-bold text-white font-mono">
                        {formatCurrency(rateObj.taxable, settings)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-indigo-400 font-bold">Tax Amount</div>
                      <div className="text-sm font-extrabold text-indigo-400 font-mono">
                        {formatCurrency(rateObj.tax, settings)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isSaleReport) {
    return (
      <div className="p-4 sm:p-6 space-y-6 w-full max-w-7xl mx-auto">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <span>Client Sales Report & Analytics</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Analyze client invoice revenues, sales tax collections, payments collected, and outstanding receivables.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Report Filters & Parameters</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['This Month', 'Last Month', 'Current Financial Year', 'Last Financial Year', 'Last 30 Days', 'All Time'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                    datePreset === preset
                      ? isLight
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                      : isLight
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Retail Customer
              </label>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="all">All Customers</option>
                {customers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Search Invoice No
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. INV-2026-00088"
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Primary KPI Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400">Total Sales (Excl. Tax)</div>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {formatCurrency(saleMetrics.totalExcludingTax, settings)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-500" />
              <span>Net product revenue before tax</span>
            </div>
            <div className="absolute right-4 bottom-4 p-2.5 bg-slate-950 text-slate-500 rounded-xl border border-slate-800/50">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden ring-1 ring-indigo-500/20">
            <div className="text-xs font-semibold text-indigo-300">Sales Including Tax (Gross Sales)</div>
            <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">
              {formatCurrency(saleMetrics.totalIncludingTax, settings)}
            </div>
            <div className="text-[11px] text-indigo-200 mt-1">
              Tax component portion: {formatCurrency(saleMetrics.totalTaxAmount, settings)}
            </div>
            <div className="absolute right-4 bottom-4 p-2.5 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-800/40">
              <Percent className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="text-xs font-semibold text-rose-300">Sales with Dues Amount (Outstanding)</div>
            <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
              {formatCurrency(saleMetrics.totalDues, settings)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Total Collected: {formatCurrency(saleMetrics.totalPaid, settings)}
            </div>
            <div className="absolute right-4 bottom-4 p-2.5 bg-rose-950/20 text-rose-400 rounded-xl border border-rose-900/40">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Detailed Invoice Ledger Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Detailed Sales Invoice Ledger</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Listing {filteredSales.length} matching sales records between {startDate} and {endDate}
              </p>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold bg-slate-950 border border-slate-800 px-3 py-1 rounded-full">
              Live Audited
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Invoice No</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3 text-right">Subtotal (Ex. Tax)</th>
                  <th className="py-3 px-3 text-right">Tax Collected</th>
                  <th className="py-3 px-3 text-right">Total (Inc. Tax)</th>
                  <th className="py-3 px-3 text-right">Paid Amount</th>
                  <th className="py-3 px-3 text-right">Receivable Dues</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No sales records found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s) => {
                    const customer = customers.find((c) => c.id === s.customerId);
                    const outstanding = Math.max(0, s.totalAmount - s.paidAmount);
                    const subVal = s.totalAmount - (s.taxAmount || 0);

                    return (
                      <tr key={s.id} className="hover:bg-slate-850/50 transition">
                        <td className="py-3 px-3 font-mono text-slate-300">{s.date.substring(0, 10)}</td>
                        <td className="py-3 px-3 font-mono font-bold text-indigo-400">{s.invoiceNo}</td>
                        <td className="py-3 px-3 font-semibold text-white">{customer?.name || 'Walk-In Customer'}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {formatCurrency(subVal, settings)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {formatCurrency(s.taxAmount || 0, settings)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {formatCurrency(s.totalAmount, settings)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                          {formatCurrency(s.paidAmount, settings)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${outstanding > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {formatCurrency(outstanding, settings)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {outstanding === 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                              Paid
                            </span>
                          ) : s.paidAmount > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                              Partial
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
                              Unpaid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (isPurchaseReport) {
    return (
      <div className="p-4 sm:p-6 space-y-6 w-full max-w-7xl mx-auto">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              <span>Wholesale Purchase Report & Analytics</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Analyze vendor invoice subtotals, tax structures, payment status, and outstanding liabilities.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Report Filters & Parameters</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['This Month', 'Last Month', 'Current Financial Year', 'Last Financial Year', 'Last 30 Days', 'All Time'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                    datePreset === preset
                      ? isLight
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                      : isLight
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Wholesale Supplier
              </label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="all">All Suppliers</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Search Invoice No
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. PO-2026-00088"
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Primary KPI Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400">Total Purchase (Excl. Tax)</div>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {formatCurrency(purchaseMetrics.totalExcludingTax, settings)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-500" />
              <span>Base cost before taxes are applied</span>
            </div>
            <div className="absolute right-4 bottom-4 p-2.5 bg-slate-950 text-slate-500 rounded-xl border border-slate-800/50">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden ring-1 ring-indigo-500/20">
            <div className="text-xs font-semibold text-indigo-300">Purchase Including Tax</div>
            <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">
              {formatCurrency(purchaseMetrics.totalIncludingTax, settings)}
            </div>
            <div className="text-[11px] text-indigo-200 mt-1">
              Tax component portion: {formatCurrency(purchaseMetrics.totalTaxAmount, settings)}
            </div>
            <div className="absolute right-4 bottom-4 p-2.5 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-800/40">
              <Percent className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="text-xs font-semibold text-rose-300">Purchases with Dues Amount</div>
            <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
              {formatCurrency(purchaseMetrics.totalDues, settings)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Total Paid Amount: {formatCurrency(purchaseMetrics.totalPaid, settings)}
            </div>
            <div className="absolute right-4 bottom-4 p-2.5 bg-rose-950/20 text-rose-400 rounded-xl border border-rose-900/40">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Detailed Invoice Ledger Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Detailed Purchases Invoice Ledger</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Listing {filteredPurchases.length} matching purchase orders between {startDate} and {endDate}
              </p>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold bg-slate-950 border border-slate-800 px-3 py-1 rounded-full">
              Live Audited
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Invoice No</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3 text-right">Subtotal (Ex. Tax)</th>
                  <th className="py-3 px-3 text-right">Tax Paid</th>
                  <th className="py-3 px-3 text-right">Total (Inc. Tax)</th>
                  <th className="py-3 px-3 text-right">Paid Amount</th>
                  <th className="py-3 px-3 text-right">Liability Dues</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No purchase orders found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => {
                    const supplier = suppliers.find((s) => s.id === p.supplierId);
                    const outstanding = Math.max(0, p.totalAmount - p.paidAmount);
                    const subVal = p.totalAmount - (p.taxAmount || 0);

                    return (
                      <tr key={p.id} className="hover:bg-slate-850/50 transition">
                        <td className="py-3 px-3 font-mono text-slate-300">{p.date.substring(0, 10)}</td>
                        <td className="py-3 px-3 font-mono font-bold text-indigo-400">{p.invoiceNo}</td>
                        <td className="py-3 px-3 font-semibold text-white">{supplier?.name || 'N/A'}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {formatCurrency(subVal, settings)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {formatCurrency(p.taxAmount || 0, settings)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {formatCurrency(p.totalAmount, settings)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                          {formatCurrency(p.paidAmount, settings)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${outstanding > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {formatCurrency(outstanding, settings)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {outstanding === 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                              Paid
                            </span>
                          ) : p.paidAmount > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                              Partial
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
                              Unpaid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT P&L REPORT VIEW
  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-colors ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
        <div>
          <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span>Profit & Loss</span>
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Real-time accounting breakdown: Gross Sales, COGS, Net Operating Profit, and Stock Valuation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Financial Report</span>
          </button>
          <ExportButtons
            headers={exportDataConfig.headers}
            keys={exportDataConfig.keys}
            data={exportDataConfig.data}
            filename={exportDataConfig.filename}
            title={exportDataConfig.title}
            isLight={isLight}
          />
        </div>
      </div>

      {/* Date Filters Panel */}
      <div className={`rounded-2xl border p-5 space-y-4 transition-colors ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2.5 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
          <div className={`flex items-center gap-2 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-white'}`}>
            <Filter className="w-4 h-4 text-indigo-500" />
            <span>Select Statement Date Range & Financial Period</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {['This Month', 'Last Month', 'Current Financial Year', 'Last Financial Year', 'Last 30 Days', 'All Time'].map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                  datePreset === preset
                    ? isLight
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                    : isLight
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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
                className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Profit & Loss Statement (finias POS Columnar Format) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Expenditures / Debits */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between h-full">
          <div className="flex-1 flex flex-col">
            <div className="bg-rose-500/10 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-rose-400 text-sm tracking-wide uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                1. Expenditures & Debits
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded border border-rose-500/20">
                Cash Outflow
              </span>
            </div>
            
            <div className="divide-y divide-slate-800/60 font-mono text-xs text-slate-200 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Opening Stock (By purchase price):</span>
                <span className="font-bold text-slate-300">{formatCurrency(dynamicFinancialSummary.openingStockCost, settings)}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Opening Stock (By sale price):</span>
                <span className="font-semibold text-slate-500">{formatCurrency(dynamicFinancialSummary.openingStockRetail, settings)}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Total Purchase (Exc. Tax):</span>
                <span className="font-bold text-slate-300">{formatCurrency(dynamicFinancialSummary.totalPurchaseExcTax, settings)}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Total Stock Adjustment (Losses):</span>
                <span className="font-bold text-rose-400/90">+{formatCurrency(dynamicFinancialSummary.totalStockAdjustmentAmt, settings)}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Total Operating Expenses:</span>
                <span className="font-bold text-rose-400">+{formatCurrency(dynamicFinancialSummary.totalExpenses, settings)}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Total Purchase Shipping Charges:</span>
                <span className="font-bold text-slate-400">{formatCurrency(dynamicFinancialSummary.totalPurchaseShippingCharges, settings)}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Total Sell Return (Exc. Tax):</span>
                <span className="font-bold text-rose-400">+{formatCurrency(dynamicFinancialSummary.totalSellReturnExcTax, settings)}</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-950/60 flex justify-between items-center px-5 py-4 font-bold text-white border-t border-slate-850">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-400">Total Debit Expenditures:</span>
            <span className="text-sm font-extrabold text-rose-400">
              {formatCurrency(
                dynamicFinancialSummary.openingStockCost +
                dynamicFinancialSummary.totalPurchaseExcTax +
                dynamicFinancialSummary.totalStockAdjustmentAmt +
                dynamicFinancialSummary.totalExpenses +
                dynamicFinancialSummary.totalPurchaseShippingCharges +
                dynamicFinancialSummary.totalSellReturnExcTax,
                settings
              )}
            </span>
          </div>
        </div>

        {/* Right Column: Revenues / Credits */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between h-full">
          <div className="flex-1 flex flex-col">
            <div className="bg-emerald-500/10 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-emerald-400 text-sm tracking-wide uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                2. Revenues & Credits
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                Cash Inflow
              </span>
            </div>

            <div className="divide-y divide-slate-800/60 font-mono text-xs text-slate-200 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Closing Stock (By purchase price):</span>
                <span className="font-bold text-slate-300">{formatCurrency(dynamicFinancialSummary.stockValuationCost, settings)}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Closing Stock (By sale price):</span>
                <span className="font-semibold text-slate-500">{formatCurrency(dynamicFinancialSummary.stockValuationRetail, settings)}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Total Sales (Exc. Tax):</span>
                <span className="font-bold text-emerald-400">+{formatCurrency(dynamicFinancialSummary.totalSalesExcTax, settings)}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Total Purchase Return (Exc. Tax):</span>
                <span className="font-bold text-emerald-400/90">+{formatCurrency(dynamicFinancialSummary.totalPurchaseReturnExcTax, settings)}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Total Sales Shipping Charges:</span>
                <span className="font-bold text-slate-400">+{formatCurrency(dynamicFinancialSummary.totalSalesShippingCharges, settings)}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-850 transition">
                <span className="text-slate-400 font-sans font-semibold">Total Stock Recovery Amount:</span>
                <span className="font-bold text-emerald-400">+{formatCurrency(dynamicFinancialSummary.totalStockRecovery, settings)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 flex justify-between items-center px-5 py-4 font-bold text-white border-t border-slate-850 mt-auto">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-400">Total Credit Revenues:</span>
            <span className="text-sm font-extrabold text-emerald-400">
              {formatCurrency(
                dynamicFinancialSummary.stockValuationCost +
                dynamicFinancialSummary.totalSalesExcTax +
                dynamicFinancialSummary.totalPurchaseReturnExcTax +
                dynamicFinancialSummary.totalSalesShippingCharges +
                dynamicFinancialSummary.totalStockRecovery,
                settings
              )}
            </span>
          </div>
        </div>
      </div>

      {/* finias POS Bottom-line Gross & Net Profit Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gross Profit Box */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Profit (GAAP standard)</span>
            <span className="block text-2xl font-extrabold text-emerald-400 font-mono">
              {formatCurrency(dynamicFinancialSummary.grossProfit, settings)}
            </span>
            <span className="block text-[11px] text-emerald-300">
              Gross Margin Ratio: <span className="font-bold">{dynamicFinancialSummary.grossProfitMargin.toFixed(2)}%</span>
            </span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Net Profit Box */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Clean Profit (After Overheads)</span>
            <span className="block text-2xl font-extrabold text-indigo-400 font-mono">
              {formatCurrency(dynamicFinancialSummary.netProfit, settings)}
            </span>
            <span className="block text-[11px] text-indigo-300">
              Net Profit Margin: <span className="font-bold">{dynamicFinancialSummary.netProfitMargin.toFixed(2)}%</span>
            </span>
          </div>
          <div className="p-3.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* finias POS Detail Tabbed Breakdowns */}
      <div className={`rounded-2xl border p-5 space-y-4 transition-colors ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
          <div>
            <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Detailed Profit / Loss Analysis Breakdowns</h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Instant ledger filtering by various business attributes</p>
          </div>

          {/* Tab Selection buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: 'category', label: 'By Category' },
              { key: 'brand', label: 'By Brand' },
              { key: 'product', label: 'By Products' },
              { key: 'customer', label: 'By Customer' },
              { key: 'date', label: 'By Date' },
              { key: 'invoice', label: 'By Invoice' },
              { key: 'day', label: 'By Day' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPlTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  plTab === tab.key
                    ? isLight
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : isLight
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content rendering */}
        <div className="overflow-x-auto">
          {plTab === 'product' && (
            <table className="w-full text-left text-xs">
              <thead className={`uppercase text-[10px] tracking-wider border-b font-bold ${isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                <tr>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4 text-center">Quantity Sold</th>
                  <th className="py-3.5 px-4 text-right">Gross Sales Revenue</th>
                  <th className="py-3.5 px-4 text-right">Cost of Goods Sold (COGS)</th>
                  <th className="py-3.5 px-4 text-right">Gross Profit</th>
                  <th className="py-3.5 px-4 text-center">Net Margin %</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-700' : 'divide-slate-800/60 text-slate-200'}`}>
                {productProfits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-semibold">
                      No product transactions registered in this period.
                    </td>
                  </tr>
                ) : (
                  productProfits.map((p) => {
                    const margin = p.sales > 0 ? ((p.profit / p.sales) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={p.name} className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850'} transition`}>
                        <td className={`py-3 px-4 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.name}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-400">{p.quantity}</td>
                        <td className={`py-3 px-4 text-right font-mono ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                          {formatCurrency(p.sales, settings)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {formatCurrency(p.cogs, settings)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${p.profit >= 0 ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : 'text-rose-500'}`}>
                          {formatCurrency(p.profit, settings)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            p.profit >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {plTab === 'customer' && (
            <table className="w-full text-left text-xs">
              <thead className={`uppercase text-[10px] tracking-wider border-b font-bold ${isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4 text-center">Invoices</th>
                  <th className="py-3.5 px-4 text-right">Total Sales Revenue</th>
                  <th className="py-3.5 px-4 text-right">Cost of Goods Sold (COGS)</th>
                  <th className="py-3.5 px-4 text-right">Gross Profit</th>
                  <th className="py-3.5 px-4 text-center">Net Margin %</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-700' : 'divide-slate-800/60 text-slate-200'}`}>
                {customerProfits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-semibold">
                      No customer transactions registered in this period.
                    </td>
                  </tr>
                ) : (
                  customerProfits.map((c) => {
                    const margin = c.sales > 0 ? ((c.profit / c.sales) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={c.name} className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850'} transition`}>
                        <td className={`py-3 px-4 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.name}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{c.invoiceCount}</td>
                        <td className={`py-3 px-4 text-right font-mono ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                          {formatCurrency(c.sales, settings)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {formatCurrency(c.cogs, settings)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${c.profit >= 0 ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : 'text-rose-500'}`}>
                          {formatCurrency(c.profit, settings)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            c.profit >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
          {plTab === 'category' && (
            <table className="w-full text-left text-xs">
              <thead className={`uppercase text-[10px] tracking-wider border-b font-bold ${isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                <tr>
                  <th className="py-3.5 px-4">Category Name</th>
                  <th className="py-3.5 px-4 text-right">Gross Sales Revenue</th>
                  <th className="py-3.5 px-4 text-right">Cost of Goods Sold (COGS)</th>
                  <th className="py-3.5 px-4 text-right">Gross Profit</th>
                  <th className="py-3.5 px-4 text-center">Net Margin %</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-700' : 'divide-slate-800/60 text-slate-200'}`}>
                {categoryProfits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold">
                      No category transactions registered in this period.
                    </td>
                  </tr>
                ) : (
                  categoryProfits.map((c) => {
                    const margin = c.sales > 0 ? ((c.profit / c.sales) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={c.name} className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850'} transition`}>
                        <td className={`py-3 px-4 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.name}</td>
                        <td className={`py-3 px-4 text-right font-mono ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                          {formatCurrency(c.sales, settings)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {formatCurrency(c.cogs, settings)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${c.profit >= 0 ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : 'text-rose-500'}`}>
                          {formatCurrency(c.profit, settings)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            c.profit >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {plTab === 'brand' && (
            <table className="w-full text-left text-xs">
              <thead className={`uppercase text-[10px] tracking-wider border-b font-bold ${isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                <tr>
                  <th className="py-3.5 px-4">Brand Name</th>
                  <th className="py-3.5 px-4 text-right">Gross Sales Revenue</th>
                  <th className="py-3.5 px-4 text-right">Cost of Goods Sold (COGS)</th>
                  <th className="py-3.5 px-4 text-right">Gross Profit</th>
                  <th className="py-3.5 px-4 text-center">Net Margin %</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-700' : 'divide-slate-800/60 text-slate-200'}`}>
                {brandProfits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold">
                      No brand transactions registered in this period.
                    </td>
                  </tr>
                ) : (
                  brandProfits.map((b) => {
                    const margin = b.sales > 0 ? ((b.profit / b.sales) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={b.name} className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850'} transition`}>
                        <td className={`py-3 px-4 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{b.name}</td>
                        <td className={`py-3 px-4 text-right font-mono ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                          {formatCurrency(b.sales, settings)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {formatCurrency(b.cogs, settings)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${b.profit >= 0 ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : 'text-rose-500'}`}>
                          {formatCurrency(b.profit, settings)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            b.profit >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {plTab === 'date' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Transaction Date</th>
                  <th className="py-3.5 px-4 text-right">Gross Sales Revenue</th>
                  <th className="py-3.5 px-4 text-right">Cost of Goods Sold (COGS)</th>
                  <th className="py-3.5 px-4 text-right">Gross Profit</th>
                  <th className="py-3.5 px-4 text-center">Net Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {dateProfits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold">
                      No records found for this period.
                    </td>
                  </tr>
                ) : (
                  dateProfits.map((d) => {
                    const margin = d.sales > 0 ? ((d.profit / d.sales) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={d.date} className="hover:bg-slate-850 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-300">{d.date}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {formatCurrency(d.sales, settings)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {formatCurrency(d.cogs, settings)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${d.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(d.profit, settings)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            d.profit >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {plTab === 'invoice' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-right">Gross Sales</th>
                  <th className="py-3.5 px-4 text-right">COGS Cost</th>
                  <th className="py-3.5 px-4 text-right">Profit Earned</th>
                  <th className="py-3.5 px-4 text-center">Net Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {invoiceProfits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-semibold">
                      No matching sales invoices registered.
                    </td>
                  </tr>
                ) : (
                  invoiceProfits.map((inv) => {
                    const margin = inv.sales > 0 ? ((inv.profit / inv.sales) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={inv.invoiceNo} className="hover:bg-slate-850 transition">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedInvoice(inv.transaction)}
                            className="font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-2 py-1 bg-slate-950/40 hover:bg-slate-950/80 transition-all text-xs"
                            title="Click to view purchased products"
                          >
                            {inv.invoiceNo}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{inv.date.substring(0, 16)}</td>
                        <td className="py-3 px-4 font-semibold text-white">{inv.customerName}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {formatCurrency(inv.sales, settings)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {formatCurrency(inv.cogs, settings)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${inv.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(inv.profit, settings)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            inv.profit >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {plTab === 'day' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Day of the Week</th>
                  <th className="py-3.5 px-4 text-right">Gross Sales Revenue</th>
                  <th className="py-3.5 px-4 text-right">Cost of Goods Sold (COGS)</th>
                  <th className="py-3.5 px-4 text-right">Gross Profit</th>
                  <th className="py-3.5 px-4 text-center">Net Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {dayProfits.map((d) => {
                  const margin = d.sales > 0 ? ((d.profit / d.sales) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={d.day} className="hover:bg-slate-850 transition">
                      <td className="py-3 px-4 font-bold text-slate-300">{d.day}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(d.sales, settings)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {formatCurrency(d.cogs, settings)}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${d.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(d.profit, settings)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          d.profit >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Clickable Invoice Items Popup Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" id="invoice-details-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base tracking-wide flex items-center gap-2">
                    Invoice Details: <span className="text-indigo-400 font-mono font-bold">{selectedInvoice.invoiceNo}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Dated: <span className="font-mono text-slate-300">{selectedInvoice.date.replace('T', ' ').substring(0, 16)}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white bg-slate-800/40 hover:bg-rose-500/10 hover:text-rose-400 p-2 rounded-xl transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Quick Summary Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Info</span>
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {customers.find((c) => c.id === selectedInvoice.customerId)?.name || 'Walk-In Customer'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {selectedInvoice.customerId || 'N/A'}</span>
                </div>
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Status</span>
                  <span className={`inline-flex text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                    selectedInvoice.paymentStatus === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : selectedInvoice.paymentStatus === 'partial'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {selectedInvoice.paymentStatus || 'Unpaid'}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Status: <span className="font-semibold text-slate-400">{selectedInvoice.status}</span></span>
                </div>
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Total</span>
                  <span className="text-xs font-mono font-black text-indigo-400 block">
                    {formatCurrency(selectedInvoice.totalAmount, settings)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Paid: {formatCurrency(selectedInvoice.paidAmount, settings)}</span>
                </div>
              </div>

              {/* Purchased Products Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wide flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-slate-400" />
                    Purchased Products & Profitability
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {selectedInvoice.items.length} items purchased
                  </span>
                </div>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-850 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Product Name / SKU</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Unit Cost</th>
                        <th className="py-2.5 px-3 text-right">Total Sale</th>
                        <th className="py-2.5 px-3 text-right">Est. COGS</th>
                        <th className="py-2.5 px-3 text-right text-emerald-400">Profit</th>
                        <th className="py-2.5 px-3 text-center">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 font-mono text-slate-300">
                      {selectedInvoice.items.map((item: any, idx: number) => {
                        const itemSale = item.unitPrice * item.quantity;
                        const itemCost = (item.costPrice || 0) * item.quantity;
                        const itemProfit = itemSale - itemCost;
                        const itemMargin = itemSale > 0 ? ((itemProfit / itemSale) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={idx} className="hover:bg-slate-900/40 transition">
                            <td className="py-2.5 px-3 font-sans">
                              <span className="font-bold text-slate-200 block text-xs">{item.productName || 'Unknown Product'}</span>
                              <span className="text-[10px] text-slate-500 font-mono">SKU: {item.sku || 'N/A'}</span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-white">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-right text-slate-400">
                              {formatCurrency(item.unitPrice, settings)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-500">
                              {formatCurrency(item.costPrice || 0, settings)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-200">
                              {formatCurrency(itemSale, settings)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-400">
                              {formatCurrency(itemCost, settings)}
                            </td>
                            <td className={`py-2.5 px-3 text-right font-bold ${itemProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatCurrency(itemProfit, settings)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                                itemProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {itemMargin}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdowns */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Gross Item Subtotal:</span>
                  <span className="font-mono text-slate-300">
                    {formatCurrency(selectedInvoice.subtotal, settings)}
                  </span>
                </div>
                {selectedInvoice.taxAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Tax Charges:</span>
                    <span className="font-mono text-rose-400/80">
                      +{formatCurrency(selectedInvoice.taxAmount, settings)}
                    </span>
                  </div>
                )}
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Discount Allowed:</span>
                    <span className="font-mono text-emerald-400/80">
                      -{formatCurrency(selectedInvoice.discountAmount, settings)}
                    </span>
                  </div>
                )}
                {selectedInvoice.shippingCharges > 0 && (
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Shipping/Logistics Charges:</span>
                    <span className="font-mono text-slate-300">
                      +{formatCurrency(selectedInvoice.shippingCharges, settings)}
                    </span>
                  </div>
                )}
                
                {/* Visual Separator */}
                <div className="h-px bg-slate-850 my-1" />
                
                {/* Total Profits Section */}
                {(() => {
                  let totalInvCogs = 0;
                  selectedInvoice.items.forEach((item: any) => {
                    totalInvCogs += (item.costPrice || 0) * item.quantity;
                  });
                  const invoiceProfit = selectedInvoice.subtotal - totalInvCogs;
                  const invoiceMargin = selectedInvoice.subtotal > 0 ? ((invoiceProfit / selectedInvoice.subtotal) * 100).toFixed(1) : '0.0';
                  
                  return (
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Estimated COGS</span>
                        <span className="text-sm font-black font-mono text-slate-300">
                          {formatCurrency(totalInvCogs, settings)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Estimated Invoice Profit ({invoiceMargin}%)</span>
                        <span className={`text-sm font-black font-mono ${invoiceProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(invoiceProfit, settings)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-850 flex justify-end gap-3">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all focus:outline-none"
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
