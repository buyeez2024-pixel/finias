import React, { useState } from 'react';
import { printElement } from "../../utils/printHelper";
import { useErp } from '../../context/ErpContext';
import {
  InvoiceLayoutType,
  InvoiceLayoutConfig,
  InvoiceScheme,
  Transaction,
} from '../../types/erp';
import { InvoiceRenderer } from '../invoice/InvoiceRenderer';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Printer,
  Sliders,
  Eye,
  Save,
  Plus,
  Trash2,
  Pencil,
  Check,
  Building,
  Percent,
  Receipt,
  Gift,
  Coins,
  ShieldCheck,
  Layers,
  FileSpreadsheet,
  Settings2,
  HelpCircle,
  Image,
  Quote,
  MapPin,
  Phone,
  Mail,
  Hash,
  UserCheck,
  FileCode2,
  Barcode,
  Tag,
  Box,
  Type,
  QrCode,
  Landmark,
  PenTool,
  Stamp,
  Building2,
  CircleDot,
} from 'lucide-react';

interface AdvanceToggleCardProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  badge?: string;
  badgeColor?: string;
}

const AdvanceToggleCard: React.FC<AdvanceToggleCardProps> = ({
  id,
  icon,
  label,
  description,
  checked,
  onChange,
  badge,
  badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
}) => {
  return (
    <div
      id={id}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between gap-3 min-w-0 overflow-hidden ${
        checked
          ? 'bg-slate-950/90 border-indigo-500/60 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/20'
          : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/90 hover:bg-slate-900/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              checked
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-xs'
                : 'bg-slate-800/70 text-slate-500 border border-slate-700/50 group-hover:text-slate-400'
            }`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-xs font-bold leading-tight transition-colors ${
                  checked ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                {label}
              </span>
              {badge && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border ${badgeColor}`}>
                  {badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight mt-1 line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <span
          className={`text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-md transition-colors ${
            checked
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800/80 text-slate-500 border border-slate-700/50'
          }`}
        >
          {checked ? 'ENABLED' : 'DISABLED'}
        </span>

        {/* Advance Pill Toggle Switch */}
        <div
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
            checked ? 'bg-indigo-600 shadow-sm shadow-indigo-600/50' : 'bg-slate-800 border border-slate-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

interface LayoutCardMeta {
  id: InvoiceLayoutType;
  title: string;
  category: string;
  badge: string;
  badgeColor: string;
  description: string;
  bestFor: string;
  paperSizes: string[];
}

const INVOICE_LAYOUTS_METADATA: LayoutCardMeta[] = [
  {
    id: 'classic',
    title: 'Classic Invoice',
    category: 'Corporate & Standard',
    badge: 'Popular',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    description: 'Clean, traditional A4/A5 business layout with tabular items, tax breakdown, and bank remittance details.',
    bestFor: 'General Retail, Corporate Billing, Wholesale',
    paperSizes: ['A4', 'A5', 'Letter'],
  },
  {
    id: 'elegant',
    title: 'Elegant Invoice',
    category: 'Modern Branded',
    badge: 'Modern UI',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    description: 'Modern branded design featuring a gradient header banner, split customer cards, and highlighted grand totals.',
    bestFor: 'Luxury Boutiques, Tech Stores, Modern Brands',
    paperSizes: ['A4', 'A5'],
  },
  {
    id: 'detailed',
    title: 'Detailed B2B Invoice',
    category: 'Enterprise & Supply Chain',
    badge: 'Statutory GST',
    badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    description: 'Exhaustive enterprise invoice with HSN/SAC codes, dispatch logistics, and statutory GST reconciliation table.',
    bestFor: 'B2B Wholesale, Manufacturing, Inter-state Logistics',
    paperSizes: ['A4', 'Letter'],
  },
  {
    id: 'columnized_tax',
    title: 'Columnized Taxes Invoice',
    category: 'Multi-Tier Taxation',
    badge: 'Tax Itemized',
    badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    description: 'Dedicated individual columns for CGST, SGST, and IGST components on every single line item.',
    bestFor: 'Tax Audit Strictness, GST Multi-Rate Invoicing',
    paperSizes: ['A4', 'A5'],
  },
  {
    id: 'slim',
    title: 'Slim Thermal Receipt',
    category: 'POS Roll Printer',
    badge: '80mm / 58mm',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    description: 'Ultra-compact roll receipt formatted for 80mm & 58mm thermal printers with clean dashed separators and barcode.',
    bestFor: 'Supermarkets, Quick Service Counters, Cafes',
    paperSizes: ['80mm Roll', '58mm Roll'],
  },
  {
    id: 'slim2',
    title: 'Slim 2 & Gift Receipt',
    category: 'Minimalist & Gift',
    badge: 'Gift Mode',
    badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    description: 'Minimalist thermal layout with one-click Gift Receipt mode (automatically hides item prices for gift recipients).',
    bestFor: 'Gift Stores, Fashion Boutiques, Electronic Warranties',
    paperSizes: ['80mm Roll', '58mm Roll'],
  },
];

// Realistic sample transaction for live layout testing
const SAMPLE_TRANSACTION: Transaction = {
  id: 'txn_sample_001',
  invoiceNo: 'INV-2026-1042',
  type: 'sale',
  date: '2026-08-19 14:30',
  locationId: 'loc_main',
  customerId: 'cust_01',
  items: [
    {
      productId: 'prod_1',
      productName: 'Apple MacBook Pro 16" M3 Max',
      sku: 'APX-98231',
      hsnCode: '84713010',
      unit: 'pcs',
      quantity: 1,
      unitPrice: 2499.0,
      costPrice: 2100.0,
      taxRate: 18.0,
      taxAmount: 431.82,
      cgstRate: 9.0,
      cgstAmount: 215.91,
      sgstRate: 9.0,
      sgstAmount: 215.91,
      igstRate: 0,
      igstAmount: 0,
      discount: 100.0,
      total: 2830.82,
      warrantyId: 'war_applecare',
      warrantyName: 'AppleCare+ 3-Year Protection',
      warrantyDuration: 3,
      warrantyDurationType: 'years',
      warrantyDescription: 'Complete hardware warranty with priority support.',
      warrantyStartDate: '2026-08-19',
      warrantyEndDate: '2029-08-19',
    },
    {
      productId: 'prod_2',
      productName: 'Sony WH-1000XM5 Wireless Headphones',
      sku: 'SNY-44120',
      hsnCode: '85183000',
      unit: 'pcs',
      quantity: 2,
      unitPrice: 349.0,
      costPrice: 260.0,
      taxRate: 18.0,
      taxAmount: 125.64,
      cgstRate: 9.0,
      cgstAmount: 62.82,
      sgstRate: 9.0,
      sgstAmount: 62.82,
      igstRate: 0,
      igstAmount: 0,
      discount: 0,
      total: 823.64,
      warrantyId: 'war_sony_1yr',
      warrantyName: 'Sony 1-Year Manufacturer Warranty',
      warrantyDuration: 1,
      warrantyDurationType: 'years',
      warrantyDescription: '12 Months comprehensive manufacturer hardware warranty.',
      warrantyStartDate: '2026-08-19',
      warrantyEndDate: '2027-08-19',
    },
    {
      productId: 'prod_3',
      productName: 'Logitech MX Master 3S Wireless Mouse',
      sku: 'LOG-77219',
      hsnCode: '84716060',
      unit: 'pcs',
      quantity: 1,
      unitPrice: 99.0,
      costPrice: 70.0,
      taxRate: 12.0,
      taxAmount: 11.88,
      cgstRate: 6.0,
      cgstAmount: 5.94,
      sgstRate: 6.0,
      sgstAmount: 5.94,
      igstRate: 0,
      igstAmount: 0,
      discount: 0,
      total: 110.88,
    },
  ],
  subtotal: 3197.0,
  taxAmount: 569.34,
  discountAmount: 100.0,
  shippingCharges: 0,
  totalAmount: 3765.34,
  paidAmount: 3765.34,
  paymentStatus: 'paid',
  paymentEntries: [
    {
      id: 'pay_1',
      method: 'card',
      amount: 3765.34,
      date: '2026-08-19 14:30',
      referenceNo: 'VISA-9941',
    },
  ],
  status: 'final',
  cashierName: 'Sarah Jenkins (POS-01)',
};

export const InvoiceLayoutsTab: React.FC = () => {
  const { settings, updateSettings, currentLocation, customers } = useErp();

  // Sync local config with settings
  React.useEffect(() => {
    setConfig({
        layoutType: settings.defaultInvoiceLayout || 'classic',
        invoiceTitle: settings.invoiceLayoutConfig?.invoiceTitle || 'TAX INVOICE',
        invoiceSubHeading: settings.invoiceLayoutConfig?.invoiceSubHeading || 'Original for Recipient',
        showLogo: settings.invoiceLayoutConfig?.showLogo ?? true,
        logoUrl: settings.invoiceLayoutConfig?.logoUrl || '',
        showBusinessName: settings.invoiceLayoutConfig?.showBusinessName ?? true,
        showTagline: settings.invoiceLayoutConfig?.showTagline ?? true,
        showAddress: settings.invoiceLayoutConfig?.showAddress ?? true,
        showPhone: settings.invoiceLayoutConfig?.showPhone ?? true,
        showEmail: settings.invoiceLayoutConfig?.showEmail ?? true,
        showTaxNumber: settings.invoiceLayoutConfig?.showTaxNumber ?? true,
        showGstin: settings.invoiceLayoutConfig?.showGstin ?? true,
        showCustomerInfo: settings.invoiceLayoutConfig?.showCustomerInfo ?? true,
        showCustomerTaxId: settings.invoiceLayoutConfig?.showCustomerTaxId ?? true,
        showCustomerAddress: settings.invoiceLayoutConfig?.showCustomerAddress ?? true,
        showCashierName: settings.invoiceLayoutConfig?.showCashierName ?? true,
        showLocationName: settings.invoiceLayoutConfig?.showLocationName ?? true,
        showInvoiceBarcode: settings.invoiceLayoutConfig?.showInvoiceBarcode ?? true,
        showQrCode: settings.invoiceLayoutConfig?.showQrCode ?? true,
        showHsnCode: settings.invoiceLayoutConfig?.showHsnCode ?? true,
        showSku: settings.invoiceLayoutConfig?.showSku ?? true,
        showBrand: settings.invoiceLayoutConfig?.showBrand ?? true,
        showCategory: settings.invoiceLayoutConfig?.showCategory ?? false,
        showUnit: settings.invoiceLayoutConfig?.showUnit ?? true,
        showUnitPriceExTax: settings.invoiceLayoutConfig?.showUnitPriceExTax ?? true,
        showDiscount: settings.invoiceLayoutConfig?.showDiscount ?? true,
        showTaxPerLine: settings.invoiceLayoutConfig?.showTaxPerLine ?? true,
        showTaxSummaryTable: settings.invoiceLayoutConfig?.showTaxSummaryTable ?? true,
        showTotalInWords: settings.invoiceLayoutConfig?.showTotalInWords ?? true,
        showPaymentMethods: settings.invoiceLayoutConfig?.showPaymentMethods ?? true,
        showBalanceDue: settings.invoiceLayoutConfig?.showBalanceDue ?? true,
        showWarranty: settings.invoiceLayoutConfig?.showWarranty ?? true,
        showWarrantyTerms: settings.invoiceLayoutConfig?.showWarrantyTerms ?? false,
        showTerms: settings.invoiceLayoutConfig?.showTerms ?? true,
        termsAndConditions:
          settings.invoiceLayoutConfig?.termsAndConditions ||
          '1. Goods once sold cannot be returned without original cash memo.\n2. Warranty is as per manufacturer terms.\n3. Interest @ 18% p.a. will be charged if payment is not made within due date.',
        showFooterNote: settings.invoiceLayoutConfig?.showFooterNote ?? true,
        footerNote:
          settings.invoiceLayoutConfig?.footerNote ||
          settings.receiptFooter ||
          'Thank you for your business! For queries contact support@royalpos.com',
        showBankDetails: settings.invoiceLayoutConfig?.showBankDetails ?? true,
        bankName: settings.invoiceLayoutConfig?.bankName || 'JPMorgan Chase Bank',
        accountNumber: settings.invoiceLayoutConfig?.accountNumber || '987654321098',
        accountHolder: settings.invoiceLayoutConfig?.accountHolder || settings.businessName || settings.name || 'Royal POSfini',
        ifscOrIban: settings.invoiceLayoutConfig?.ifscOrIban || 'CHASUS33XXX',
        branchName: settings.invoiceLayoutConfig?.branchName || 'Austin Financial District',
        showSignatureLine: settings.invoiceLayoutConfig?.showSignatureLine ?? true,
        signatureLabel: settings.invoiceLayoutConfig?.signatureLabel || 'Authorized Signatory',
        isGiftReceipt: settings.invoiceLayoutConfig?.isGiftReceipt ?? false,
        paperSize: settings.invoiceLayoutConfig?.paperSize || 'A4',
        primaryColor: settings.invoiceLayoutConfig?.primaryColor || '#4f46e5',
    });
  }, [settings]);

  // Active layout for preview
  const [selectedLayout, setSelectedLayout] = useState<InvoiceLayoutType>(
    settings.defaultInvoiceLayout || 'classic'
  );

  // Configuration state
  const [config, setConfig] = useState<InvoiceLayoutConfig>({
    layoutType: settings.defaultInvoiceLayout || 'classic',
    invoiceTitle: settings.invoiceLayoutConfig?.invoiceTitle || 'TAX INVOICE',
    invoiceSubHeading: settings.invoiceLayoutConfig?.invoiceSubHeading || 'Original for Recipient',
    showLogo: settings.invoiceLayoutConfig?.showLogo ?? true,
    logoUrl:
      settings.invoiceLayoutConfig?.logoUrl ||
      settings.logoUrl ||
      settings.logo ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('royal_pos_v1_primary_logo') || '' : ''),
    showBusinessName: settings.invoiceLayoutConfig?.showBusinessName ?? true,
    showTagline: settings.invoiceLayoutConfig?.showTagline ?? true,
    showAddress: settings.invoiceLayoutConfig?.showAddress ?? true,
    showPhone: settings.invoiceLayoutConfig?.showPhone ?? true,
    showEmail: settings.invoiceLayoutConfig?.showEmail ?? true,
    showTaxNumber: settings.invoiceLayoutConfig?.showTaxNumber ?? true,
    showGstin: settings.invoiceLayoutConfig?.showGstin ?? true,
    showCustomerInfo: settings.invoiceLayoutConfig?.showCustomerInfo ?? true,
    showCustomerTaxId: settings.invoiceLayoutConfig?.showCustomerTaxId ?? true,
    showCustomerAddress: settings.invoiceLayoutConfig?.showCustomerAddress ?? true,
    showCashierName: settings.invoiceLayoutConfig?.showCashierName ?? true,
    showLocationName: settings.invoiceLayoutConfig?.showLocationName ?? true,
    showInvoiceBarcode: settings.invoiceLayoutConfig?.showInvoiceBarcode ?? true,
    showQrCode: settings.invoiceLayoutConfig?.showQrCode ?? true,
    showHsnCode: settings.invoiceLayoutConfig?.showHsnCode ?? true,
    showSku: settings.invoiceLayoutConfig?.showSku ?? true,
    showBrand: settings.invoiceLayoutConfig?.showBrand ?? true,
    showCategory: settings.invoiceLayoutConfig?.showCategory ?? false,
    showUnit: settings.invoiceLayoutConfig?.showUnit ?? true,
    showUnitPriceExTax: settings.invoiceLayoutConfig?.showUnitPriceExTax ?? true,
    showDiscount: settings.invoiceLayoutConfig?.showDiscount ?? true,
    showTaxPerLine: settings.invoiceLayoutConfig?.showTaxPerLine ?? true,
    showTaxSummaryTable: settings.invoiceLayoutConfig?.showTaxSummaryTable ?? true,
    showTotalInWords: settings.invoiceLayoutConfig?.showTotalInWords ?? true,
    showPaymentMethods: settings.invoiceLayoutConfig?.showPaymentMethods ?? true,
    showBalanceDue: settings.invoiceLayoutConfig?.showBalanceDue ?? true,
    showWarranty: settings.invoiceLayoutConfig?.showWarranty ?? true,
    showWarrantyTerms: settings.invoiceLayoutConfig?.showWarrantyTerms ?? false,
    showTerms: settings.invoiceLayoutConfig?.showTerms ?? true,
    termsAndConditions:
      settings.invoiceLayoutConfig?.termsAndConditions ||
      '1. Goods once sold cannot be returned without original cash memo.\n2. Warranty is as per manufacturer terms.\n3. Interest @ 18% p.a. will be charged if payment is not made within due date.',
    showFooterNote: settings.invoiceLayoutConfig?.showFooterNote ?? true,
    footerNote:
      settings.invoiceLayoutConfig?.footerNote ||
      settings.receiptFooter ||
      'Thank you for your business! For queries contact support@royalpos.com',
    showBankDetails: settings.invoiceLayoutConfig?.showBankDetails ?? true,
    bankName: settings.invoiceLayoutConfig?.bankName || 'JPMorgan Chase Bank',
    accountNumber: settings.invoiceLayoutConfig?.accountNumber || '987654321098',
    accountHolder: settings.invoiceLayoutConfig?.accountHolder || settings.businessName || settings.name || 'Royal POSfini',
    ifscOrIban: settings.invoiceLayoutConfig?.ifscOrIban || 'CHASUS33XXX',
    branchName: settings.invoiceLayoutConfig?.branchName || 'Austin Financial District',
    showSignatureLine: settings.invoiceLayoutConfig?.showSignatureLine ?? true,
    signatureLabel: settings.invoiceLayoutConfig?.signatureLabel || 'Authorized Signatory',
    isGiftReceipt: settings.invoiceLayoutConfig?.isGiftReceipt ?? false,
    paperSize: settings.invoiceLayoutConfig?.paperSize || 'A4',
    primaryColor: settings.invoiceLayoutConfig?.primaryColor || '#4f46e5',
  });

  // Invoice Schemes State
  const [schemes, setSchemes] = useState<InvoiceScheme[]>(() => {
    return (
      settings.invoiceSchemes || [
        {
          id: 'sch_default',
          name: 'Standard POS Invoice Scheme',
          prefix: 'INV-2026-',
          startNumber: 1001,
          numberOfDigits: 4,
          format: 'prefix_number',
          isDefault: true,
        },
        {
          id: 'sch_tax_inv',
          name: 'B2B Tax Invoice Scheme',
          prefix: 'TAX-INV/',
          startNumber: 1,
          numberOfDigits: 5,
          format: 'prefix_year_number',
          isDefault: false,
        },
        {
          id: 'sch_thermal',
          name: 'Thermal POS Slip Scheme',
          prefix: 'POS#',
          startNumber: 501,
          numberOfDigits: 4,
          format: 'prefix_number',
          isDefault: false,
        },
      ]
    );
  });

  const [activeTabSubSection, setActiveTabSubSection] = useState<'layouts' | 'fields' | 'schemes'>('layouts');
  const [isGiftPreview, setIsGiftPreview] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);

  const [sigSealToggles, setSigSealToggles] = useState({
    showCompanySeal: settings.signatureSealConfig?.showCompanySeal ?? true,
    showRoundSeal: settings.signatureSealConfig?.showRoundSeal ?? true,
    showProprietorSeal: settings.signatureSealConfig?.showProprietorSeal ?? true,
    showSignature: settings.signatureSealConfig?.showSignature ?? true,
  });

  const handleSaveAll = () => {
    updateSettings({
      defaultInvoiceLayout: selectedLayout,
      invoiceLayoutConfig: {
        ...config,
        layoutType: selectedLayout,
      },
      invoiceSchemes: schemes,
      signatureSealConfig: {
        ...(settings.signatureSealConfig || {}),
        ...sigSealToggles,
      },
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleSetDefaultLayout = (layoutId: InvoiceLayoutType) => {
    setSelectedLayout(layoutId);
    setConfig((prev) => ({ ...prev, layoutType: layoutId }));
    updateSettings({
      defaultInvoiceLayout: layoutId,
      invoiceLayoutConfig: {
        ...config,
        layoutType: layoutId,
      },
      signatureSealConfig: {
        ...(settings.signatureSealConfig || {}),
        ...sigSealToggles,
      },
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  // New scheme modal & states
  const [showAddSchemeModal, setShowAddSchemeModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      if (p.includes('invoice_layouts/add_scheme')) {
        return true;
      }
    }
    return false;
  });

  React.useEffect(() => {
    if (showAddSchemeModal) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('invoice_layouts/add_scheme')) {
        window.history.replaceState(null, '', '/settings/invoice_layouts/add_scheme');
      }
    } else {
      if (typeof window !== 'undefined' && (window.location.pathname.includes('invoice_layouts/add_scheme') || window.location.hash.includes('invoice_layouts/add_scheme'))) {
        window.history.replaceState(null, '', '/settings/invoice_layouts');
      }
    }
  }, [showAddSchemeModal]);

  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemePrefix, setNewSchemePrefix] = useState('INV-');
  const [newSchemeStartNo, setNewSchemeStartNo] = useState(1);
  const [newSchemeDigits, setNewSchemeDigits] = useState(4);
  const [newSchemeFormat, setNewSchemeFormat] = useState<'prefix_number' | 'prefix_year_number' | 'number_only'>('prefix_number');

  const handleAddScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchemeName.trim()) return;

    const newScheme: InvoiceScheme = {
      id: `sch_${Date.now()}`,
      name: newSchemeName.trim(),
      prefix: newSchemePrefix.trim(),
      startNumber: Number(newSchemeStartNo) || 1,
      numberOfDigits: Number(newSchemeDigits) || 4,
      format: newSchemeFormat,
      isDefault: schemes.length === 0,
    };

    const updated = [...schemes, newScheme];
    setSchemes(updated);
    updateSettings({ invoiceSchemes: updated });

    setNewSchemeName('');
    setNewSchemePrefix('INV-');
    setShowAddSchemeModal(false);
  };

  const handleDeleteScheme = (id: string) => {
    if (schemes.length <= 1) return;
    const remaining = schemes.filter((s) => s.id !== id);
    if (!remaining.some((s) => s.isDefault)) {
      remaining[0].isDefault = true;
    }
    setSchemes(remaining);
    updateSettings({ invoiceSchemes: remaining });
  };

  const [editingScheme, setEditingScheme] = useState<InvoiceScheme | null>(null);
  const [editSchemeName, setEditSchemeName] = useState('');
  const [editSchemePrefix, setEditSchemePrefix] = useState('');
  const [editSchemeStartNo, setEditSchemeStartNo] = useState(1);
  const [editSchemeDigits, setEditSchemeDigits] = useState(4);
  const [editSchemeFormat, setEditSchemeFormat] = useState<'prefix_number' | 'prefix_year_number' | 'number_only'>('prefix_number');

  const handleStartEdit = (sch: InvoiceScheme) => {
    setEditingScheme(sch);
    setEditSchemeName(sch.name);
    setEditSchemePrefix(sch.prefix);
    setEditSchemeStartNo(sch.startNumber);
    setEditSchemeDigits(sch.numberOfDigits);
    setEditSchemeFormat(sch.format || 'prefix_number');
  };

  const handleUpdateScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheme || !editSchemeName.trim()) return;

    const updated = schemes.map((s) => {
      if (s.id === editingScheme.id) {
        return {
          ...s,
          name: editSchemeName.trim(),
          prefix: editSchemePrefix.trim(),
          startNumber: Number(editSchemeStartNo) || 1,
          numberOfDigits: Number(editSchemeDigits) || 4,
          format: editSchemeFormat,
        };
      }
      return s;
    });

    setSchemes(updated);
    updateSettings({ invoiceSchemes: updated });
    setEditingScheme(null);
  };

  const handleSetDefaultScheme = (id: string) => {
    const updated = schemes.map((s) => ({
      ...s,
      isDefault: s.id === id,
    }));
    setSchemes(updated);
    updateSettings({ invoiceSchemes: updated });
  };

  const sampleCustomer = customers[0] || {
    id: 'cust_01',
    name: 'Apex Global Enterprises LLC',
    businessName: 'Apex Technology Group',
    email: 'accounts@apexglobal.com',
    phone: '+1 (512) 555-0188',
    address: '400 Congress Ave, Suite 2100, Austin, TX 78701',
    taxNumber: '27AAACA1234F1Z8',
    creditLimit: 50000,
    totalDue: 0,
    totalSales: 45000,
    loyaltyPoints: 1200,
    createdDate: '2026-01-10',
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0 flex-shrink-0">
      {/* Top Action & Sub-Navigation Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full max-w-full min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              6 Built-In finias POS Layouts
            </span>
            <span className="text-[11px] font-bold text-slate-400 shrink-0">
              Active: <strong className="text-white uppercase font-mono">{settings.defaultInvoiceLayout}</strong>
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 break-words min-w-0">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>Invoice Layouts & Receipt Schemes</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl break-words">
            Configure full A4, A5, and 80mm POS thermal roll receipt layouts. Customize product columns, statutory GST summaries, bank remittance details, and numbering prefixes.
          </p>
        </div>

        {/* Global Save Button */}
        <button
          onClick={handleSaveAll}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 shrink-0 self-stretch sm:self-auto text-center"
        >
          {savedAlert ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{savedAlert ? 'Settings Saved!' : 'Save Invoice Configuration'}</span>
        </button>
      </div>

      {/* Sub-Tabs: Layouts Gallery vs Field Customizer vs Numbering Schemes */}
      <div
        className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-thin w-full max-w-full min-w-0 -mx-0.5 px-0.5"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          overscrollBehaviorX: 'contain'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTabSubSection('layouts')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
            activeTabSubSection === 'layouts'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>1. Layout Templates & Live Preview</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTabSubSection('fields')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
            activeTabSubSection === 'fields'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5 shrink-0" />
          <span>2. Columns & Data Customizer</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTabSubSection('schemes')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
            activeTabSubSection === 'schemes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span>3. Numbering Schemes & Prefixes</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-SECTION 1: LAYOUT TEMPLATES GALLERY & LIVE STUDIO                     */}
      {/* ========================================================================= */}
      {activeTabSubSection === 'layouts' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 w-full max-w-full min-w-0">
          {/* Left Column: 6 Layout Cards Selection */}
          <div className="xl:col-span-6 space-y-4 w-full min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">
                Choose Invoice Template
              </h3>
              <span className="text-xs text-slate-400">Click any card to preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {INVOICE_LAYOUTS_METADATA.map((layout) => {
                const isSelected = selectedLayout === layout.id;
                const isDefault = settings.defaultInvoiceLayout === layout.id;

                return (
                  <div
                    key={layout.id}
                    onClick={() => setSelectedLayout(layout.id)}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 min-w-0 overflow-hidden ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${layout.badgeColor}`}>
                          {layout.badge}
                        </span>
                        {isDefault && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Default</span>
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{layout.title}</h4>
                        <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider block">
                          {layout.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {layout.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Paper:</span>
                        <span className="font-mono text-slate-300">{layout.paperSizes.join(', ')}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefaultLayout(layout.id);
                          }}
                          className={`w-full py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            isDefault
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300'
                          }`}
                        >
                          {isDefault ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                          <span>{isDefault ? 'Active Default' : 'Set as Default'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Helper Banner */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-900 block">Cashier Layout Switching:</strong>
                Cashiers can also toggle between all 6 invoice formats on the fly directly inside the POS checkout and receipt modal!
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Preview Studio */}
          <div className="xl:col-span-6 space-y-4 w-full min-w-0">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-4 w-full max-w-full min-w-0 overflow-hidden">
              {/* Preview Studio Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                    Live Rendering Studio
                  </span>
                  <span className="text-[10px] font-mono bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700 uppercase">
                    {selectedLayout}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Gift Receipt Toggle */}
                  {(selectedLayout === 'slim2' || selectedLayout === 'slim') && (
                    <button
                      type="button"
                      onClick={() => setIsGiftPreview(!isGiftPreview)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isGiftPreview
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>{isGiftPreview ? 'Gift Mode: ON' : 'Gift Mode: OFF'}</span>
                    </button>
                  )}

                  {/* Test Print */}
                  <button
                    type="button"
                    onClick={() => printElement('printable-invoice-surface', `Test-Invoice-${selectedLayout}`)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                    title="Print Live Invoice"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Print Test</span>
                  </button>
                </div>
              </div>

              {/* Mobile swipe hint */}
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 sm:hidden">
                <span>⇄ Swipe invoice horizontally to view full paper layout</span>
              </div>

              {/* Surface Container with Smooth Touch-Swipe Scrolling for mobile */}
              <div
                className="max-h-[620px] overflow-y-auto overflow-x-auto scrollbar-thin p-2 sm:p-3 bg-slate-950/60 rounded-2xl border border-slate-800 w-full max-w-full min-w-0"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-x pan-y',
                  overscrollBehaviorX: 'contain'
                }}
              >
                <InvoiceRenderer
                  transaction={SAMPLE_TRANSACTION}
                  settings={settings}
                  location={currentLocation}
                  customer={sampleCustomer}
                  customConfig={config}
                  activeLayoutOverride={selectedLayout}
                  isGiftReceiptOverride={isGiftPreview}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECTION 2: PRODUCT TABLE COLUMNS & DATA CUSTOMIZER                    */}
      {/* ========================================================================= */}
      {activeTabSubSection === 'fields' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 w-full max-w-full min-w-0">
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 w-full min-w-0">
            {/* Header & Titles */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm dark:shadow-xl w-full max-w-full min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                      Header & Document Titles
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {[
                        config.showLogo,
                        config.showBusinessName,
                        config.showTagline,
                        config.showAddress,
                        config.showPhone,
                        config.showEmail,
                        config.showTaxNumber,
                        config.showCashierName,
                      ].filter(Boolean).length} of 8 Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toggle header identity elements, store branding, and document titles on receipts and invoices.
                  </p>
                </div>

                {/* Batch Action Buttons */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        showLogo: true,
                        showBusinessName: true,
                        showTagline: true,
                        showAddress: true,
                        showPhone: true,
                        showEmail: true,
                        showTaxNumber: true,
                        showCashierName: true,
                      }));
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700"
                  >
                    Enable All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        showLogo: false,
                        showBusinessName: false,
                        showTagline: false,
                        showAddress: false,
                        showPhone: false,
                        showEmail: false,
                        showTaxNumber: false,
                        showCashierName: false,
                      }));
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 rounded-lg transition border border-slate-700"
                  >
                    Disable All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Primary Invoice Title</label>
                  <input
                    type="text"
                    value={config.invoiceTitle}
                    onChange={(e) => setConfig({ ...config, invoiceTitle: e.target.value })}
                    placeholder="e.g. TAX INVOICE, SALES INVOICE"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Invoice Sub-Heading</label>
                  <input
                    type="text"
                    value={config.invoiceSubHeading || ''}
                    onChange={(e) => setConfig({ ...config, invoiceSubHeading: e.target.value })}
                    placeholder="e.g. Original for Recipient"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Header Advance Toggles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <AdvanceToggleCard
                  id="header-toggle-showLogo"
                  icon={<Image className="w-4 h-4" />}
                  label="Company Brand Logo"
                  description="Header emblem or uploaded business logo graphic"
                  badge="Branding"
                  checked={Boolean(config.showLogo)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showLogo: checked }))}
                />
                <AdvanceToggleCard
                  id="header-toggle-showBusinessName"
                  icon={<Building className="w-4 h-4" />}
                  label="Store & Business Name"
                  description="Display company trade name in bold header typography"
                  checked={Boolean(config.showBusinessName)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showBusinessName: checked }))}
                />
                <AdvanceToggleCard
                  id="header-toggle-showTagline"
                  icon={<Quote className="w-4 h-4" />}
                  label="Company Slogan / Tagline"
                  description="Corporate motto or sub-title tagline beneath company name"
                  checked={Boolean(config.showTagline)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showTagline: checked }))}
                />
                <AdvanceToggleCard
                  id="header-toggle-showAddress"
                  icon={<MapPin className="w-4 h-4" />}
                  label="Physical Store Address"
                  description="Branch street address, city, state, and pincode/zip"
                  checked={Boolean(config.showAddress)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showAddress: checked }))}
                />
                <AdvanceToggleCard
                  id="header-toggle-showPhone"
                  icon={<Phone className="w-4 h-4" />}
                  label="Telephone & Mobile"
                  description="Store phone numbers and customer helpline contacts"
                  checked={Boolean(config.showPhone)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showPhone: checked }))}
                />
                <AdvanceToggleCard
                  id="header-toggle-showEmail"
                  icon={<Mail className="w-4 h-4" />}
                  label="Official Email Address"
                  description="Support and billing inquiry electronic mail"
                  checked={Boolean(config.showEmail)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showEmail: checked }))}
                />
                <AdvanceToggleCard
                  id="header-toggle-showTaxNumber"
                  icon={<Hash className="w-4 h-4" />}
                  label="GSTIN / Statutory Tax ID"
                  description="Business Tax Identification Number / GST registration"
                  badge="Tax Audit"
                  badgeColor="bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                  checked={Boolean(config.showTaxNumber)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showTaxNumber: checked }))}
                />
                <AdvanceToggleCard
                  id="header-toggle-showCashierName"
                  icon={<UserCheck className="w-4 h-4" />}
                  label="Cashier & Staff Name"
                  description="Display active cashier / billed-by attendant on invoice"
                  checked={Boolean(config.showCashierName)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showCashierName: checked }))}
                />
              </div>
            </div>

            {/* Product Table Column Toggles */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm dark:shadow-xl w-full max-w-full min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                      Product Line Item Columns
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {[
                        config.showHsnCode,
                        config.showSku,
                        config.showBrand,
                        config.showUnit,
                        config.showWarranty,
                        config.showDiscount,
                        config.showTaxPerLine,
                        config.showTaxSummaryTable,
                        config.showTotalInWords,
                        config.showInvoiceBarcode,
                      ].filter(Boolean).length} of 10 Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure item details, HSN tax columns, warranty tags, and statutory summary tables.
                  </p>
                </div>

                {/* Batch Action Buttons */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        showHsnCode: true,
                        showSku: true,
                        showBrand: true,
                        showUnit: true,
                        showWarranty: true,
                        showDiscount: true,
                        showTaxPerLine: true,
                        showTaxSummaryTable: true,
                        showTotalInWords: true,
                        showInvoiceBarcode: true,
                      }));
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700"
                  >
                    Enable All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        showHsnCode: false,
                        showSku: false,
                        showBrand: false,
                        showUnit: false,
                        showWarranty: false,
                        showDiscount: false,
                        showTaxPerLine: false,
                        showTaxSummaryTable: false,
                        showTotalInWords: false,
                        showInvoiceBarcode: false,
                      }));
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 rounded-lg transition border border-slate-700"
                  >
                    Disable All
                  </button>
                </div>
              </div>

              {/* Product Column Advance Toggles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <AdvanceToggleCard
                  id="product-toggle-showHsnCode"
                  icon={<FileCode2 className="w-4 h-4" />}
                  label="HSN / SAC Code Column"
                  description="Harmonized System of Nomenclature code column"
                  badge="Tax Audit"
                  badgeColor="bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                  checked={Boolean(config.showHsnCode)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showHsnCode: checked }))}
                />
                <AdvanceToggleCard
                  id="product-toggle-showSku"
                  icon={<Barcode className="w-4 h-4" />}
                  label="Product SKU Code"
                  description="Inventory Stock Keeping Unit barcode code below name"
                  checked={Boolean(config.showSku)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showSku: checked }))}
                />
                <AdvanceToggleCard
                  id="product-toggle-showBrand"
                  icon={<Tag className="w-4 h-4" />}
                  label="Brand / Manufacturer"
                  description="Manufacturer brand label pill alongside item name"
                  checked={Boolean(config.showBrand)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showBrand: checked }))}
                />
                <AdvanceToggleCard
                  id="product-toggle-showUnit"
                  icon={<Box className="w-4 h-4" />}
                  label="Unit of Measure (UOM)"
                  description="Display quantity units (e.g., pcs, kgs, pkts, boxes)"
                  checked={Boolean(config.showUnit)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showUnit: checked }))}
                />
                <AdvanceToggleCard
                  id="product-toggle-showWarranty"
                  icon={<ShieldCheck className="w-4 h-4" />}
                  label="Product Warranty Period"
                  description="Item warranty validity duration badge and policy terms"
                  badge="Warranty"
                  badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  checked={Boolean(config.showWarranty)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showWarranty: checked }))}
                />
                <AdvanceToggleCard
                  id="product-toggle-showDiscount"
                  icon={<Percent className="w-4 h-4" />}
                  label="Line Item Discount"
                  description="Itemized deduction amount and instant savings row"
                  checked={Boolean(config.showDiscount)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showDiscount: checked }))}
                />
                <AdvanceToggleCard
                  id="product-toggle-showTaxPerLine"
                  icon={<Receipt className="w-4 h-4" />}
                  label="Tax % per Item Row"
                  description="Explicit GST/VAT tax percentage rate column per product"
                  checked={Boolean(config.showTaxPerLine)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showTaxPerLine: checked }))}
                />
                <AdvanceToggleCard
                  id="product-toggle-showTaxSummaryTable"
                  icon={<FileSpreadsheet className="w-4 h-4" />}
                  label="Statutory GST Breakdown Grid"
                  description="HSN/SAC summary table (CGST, SGST, IGST calculations)"
                  badge="B2B Mandatory"
                  badgeColor="bg-amber-500/20 text-amber-300 border-amber-500/30"
                  checked={Boolean(config.showTaxSummaryTable)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showTaxSummaryTable: checked }))}
                />
                <AdvanceToggleCard
                  id="product-toggle-showTotalInWords"
                  icon={<Type className="w-4 h-4" />}
                  label="Grand Total in Words"
                  description="Spelled out currency amount string on bottom invoice footer"
                  checked={Boolean(config.showTotalInWords)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showTotalInWords: checked }))}
                />
                <AdvanceToggleCard
                  id="product-toggle-showInvoiceBarcode"
                  icon={<QrCode className="w-4 h-4" />}
                  label="Scannable Invoice Barcode"
                  description="Printable barcode for instant POS lookup, audit & returns"
                  checked={Boolean(config.showInvoiceBarcode)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showInvoiceBarcode: checked }))}
                />
              </div>
            </div>

            {/* Bank Details & Terms */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm dark:shadow-xl w-full max-w-full min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                    Bank Remittance & Footer Terms
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure bank wire transfer credentials, terms and conditions, and signature signoff boxes.
                  </p>
                </div>
              </div>

              {/* Bank & Signature & Seal Advance Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AdvanceToggleCard
                  id="footer-toggle-showBankDetails"
                  icon={<Landmark className="w-4 h-4" />}
                  label="Display Bank Remittance Box"
                  description="Render bank wire transfer details and account info on invoice"
                  badge="Remittance"
                  checked={Boolean(config.showBankDetails)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showBankDetails: checked }))}
                />
                <AdvanceToggleCard
                  id="footer-toggle-showSignatureLine"
                  icon={<PenTool className="w-4 h-4" />}
                  label="Authorized Signature Line"
                  description="Include signature acknowledgement box for store manager"
                  badge="Signoff"
                  checked={Boolean(config.showSignatureLine)}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, showSignatureLine: checked }))}
                />
                <AdvanceToggleCard
                  id="footer-toggle-showCompanySeal"
                  icon={<Building2 className="w-4 h-4" />}
                  label="Company Address Seal Stamp"
                  description="Enable or disable official company address seal on invoice"
                  badge="Seal"
                  checked={Boolean(sigSealToggles.showCompanySeal)}
                  onChange={(checked) => setSigSealToggles((prev) => ({ ...prev, showCompanySeal: checked }))}
                />
                <AdvanceToggleCard
                  id="footer-toggle-showRoundSeal"
                  icon={<CircleDot className="w-4 h-4" />}
                  label="Invoice Round Seal"
                  description="Enable or disable circular round seal stamp for verification"
                  badge="Round Seal"
                  checked={Boolean(sigSealToggles.showRoundSeal)}
                  onChange={(checked) => setSigSealToggles((prev) => ({ ...prev, showRoundSeal: checked }))}
                />
                <AdvanceToggleCard
                  id="footer-toggle-showProprietorSeal"
                  icon={<Stamp className="w-4 h-4" />}
                  label="Proprietor Seal & Stamp"
                  description="Enable or disable Proprietor/MD signoff stamp on documents"
                  badge="Proprietor"
                  checked={Boolean(sigSealToggles.showProprietorSeal)}
                  onChange={(checked) => setSigSealToggles((prev) => ({ ...prev, showProprietorSeal: checked }))}
                />
                <AdvanceToggleCard
                  id="footer-toggle-showAdminSig"
                  icon={<PenTool className="w-4 h-4" />}
                  label="Admin Signature Stamp"
                  description="Enable or disable admin signature upload image display"
                  badge="Signature"
                  checked={Boolean(sigSealToggles.showSignature)}
                  onChange={(checked) => setSigSealToggles((prev) => ({ ...prev, showSignature: checked }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={config.bankName || ''}
                    onChange={(e) => setConfig({ ...config, bankName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Account Number</label>
                  <input
                    type="text"
                    value={config.accountNumber || ''}
                    onChange={(e) => setConfig({ ...config, accountNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">IFSC / IBAN / SWIFT Code</label>
                  <input
                    type="text"
                    value={config.ifscOrIban || ''}
                    onChange={(e) => setConfig({ ...config, ifscOrIban: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Branch Location</label>
                  <input
                    type="text"
                    value={config.branchName || ''}
                    onChange={(e) => setConfig({ ...config, branchName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Terms & Conditions</label>
                  <textarea
                    rows={3}
                    value={config.termsAndConditions}
                    onChange={(e) => setConfig({ ...config, termsAndConditions: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Footer Note / Greeting</label>
                  <input
                    type="text"
                    value={config.footerNote}
                    onChange={(e) => setConfig({ ...config, footerNote: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Preview Column */}
          <div className="lg:col-span-5 space-y-4 w-full min-w-0">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3 sticky top-4 w-full max-w-full min-w-0 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white">Live Config Preview</span>
                <span className="text-[10px] font-mono text-indigo-400 uppercase">{selectedLayout}</span>
              </div>
              {/* Mobile swipe hint */}
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 sm:hidden">
                <span>⇄ Swipe preview horizontally to view full invoice</span>
              </div>
              <div
                className="max-h-[580px] overflow-y-auto overflow-x-auto scrollbar-thin p-1 bg-slate-950/60 rounded-2xl border border-slate-800 w-full max-w-full min-w-0"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-x pan-y',
                  overscrollBehaviorX: 'contain'
                }}
              >
                <InvoiceRenderer
                  transaction={SAMPLE_TRANSACTION}
                  settings={settings}
                  location={currentLocation}
                  customer={sampleCustomer}
                  customConfig={config}
                  activeLayoutOverride={selectedLayout}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECTION 3: INVOICE SCHEMES & NUMBERING PREFIXES                       */}
      {/* ========================================================================= */}
      {activeTabSubSection === 'schemes' && (
        <div className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm dark:shadow-xl w-full max-w-full min-w-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800 w-full min-w-0">
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                  Invoice Numbering Schemes
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 break-words">
                  Define numbering formats, prefixes, and digit padding for retail receipts, B2B invoices, and thermal slips.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddSchemeModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition self-start sm:self-auto shrink-0 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Scheme</span>
              </button>
            </div>

            {/* Mobile swipe indicator */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 sm:hidden">
              <span>⇄ Swipe table horizontally to view all scheme parameters & actions</span>
            </div>

            {/* Schemes List Table with Smooth Touch-Swipe Scrolling */}
            <div
              className="overflow-x-auto scrollbar-thin rounded-xl border border-slate-800 w-full max-w-full min-w-0"
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x pan-y',
                overscrollBehaviorX: 'contain'
              }}
            >
              <table className="w-full text-left text-xs min-w-[650px] sm:min-w-[700px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-extrabold uppercase text-[10px]">
                    <th className="py-3 px-3">Scheme Name</th>
                    <th className="py-3 px-3">Prefix</th>
                    <th className="py-3 px-3 text-center">Start #</th>
                    <th className="py-3 px-3 text-center">Total Digits</th>
                    <th className="py-3 px-3">Sample Preview</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {schemes.map((sch) => {
                    const padded = String(sch.startNumber).padStart(sch.numberOfDigits, '0');
                    const sample =
                      sch.format === 'prefix_year_number'
                        ? `${sch.prefix}2026/${padded}`
                        : `${sch.prefix}${padded}`;

                    return (
                      <tr key={sch.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-bold text-white whitespace-nowrap">{sch.name}</td>
                        <td className="py-3 px-3 font-mono text-indigo-300 font-bold whitespace-nowrap">{sch.prefix}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300 whitespace-nowrap">{sch.startNumber}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300 whitespace-nowrap">{sch.numberOfDigits}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">{sample}</td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {sch.isDefault ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Default
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultScheme(sch.id)}
                              className="text-[10px] text-slate-400 hover:text-indigo-300 underline cursor-pointer"
                            >
                              Set Default
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(sch)}
                              className="text-indigo-300 hover:text-indigo-200 p-1 rounded hover:bg-indigo-500/10 cursor-pointer"
                              title="Edit Scheme"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {!sch.isDefault && schemes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteScheme(sch.id)}
                                className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 cursor-pointer"
                                title="Delete Scheme"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Scheme Modal */}
          {showAddSchemeModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-black text-white text-base">Add Invoice Numbering Scheme</h3>
                  <button
                    onClick={() => setShowAddSchemeModal(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleAddScheme} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Scheme Name *</label>
                    <input
                      required
                      type="text"
                      value={newSchemeName}
                      onChange={(e) => setNewSchemeName(e.target.value)}
                      placeholder="e.g. B2B Corporate Scheme"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Prefix</label>
                      <input
                        type="text"
                        value={newSchemePrefix}
                        onChange={(e) => setNewSchemePrefix(e.target.value)}
                        placeholder="e.g. INV-, TAX/"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Starting Number</label>
                      <input
                        type="number"
                        min="1"
                        value={newSchemeStartNo}
                        onChange={(e) => setNewSchemeStartNo(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Number of Digits</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newSchemeDigits}
                        onChange={(e) => setNewSchemeDigits(parseInt(e.target.value) || 4)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Format</label>
                      <select
                        value={newSchemeFormat}
                        onChange={(e) => setNewSchemeFormat(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="prefix_number">PREFIX-0001</option>
                        <option value="prefix_year_number">PREFIX-YEAR-0001</option>
                        <option value="number_only">0001 (Number only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Format Preview:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {newSchemeFormat === 'prefix_year_number'
                        ? `${newSchemePrefix}2026/${String(newSchemeStartNo).padStart(newSchemeDigits, '0')}`
                        : `${newSchemePrefix}${String(newSchemeStartNo).padStart(newSchemeDigits, '0')}`}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition"
                  >
                    Save Scheme
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Edit Scheme Modal */}
          {editingScheme && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-black text-white text-base">Edit Invoice Numbering Scheme</h3>
                  <button
                    onClick={() => setEditingScheme(null)}
                    className="text-slate-400 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleUpdateScheme} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Scheme Name *</label>
                    <input
                      required
                      type="text"
                      value={editSchemeName}
                      onChange={(e) => setEditSchemeName(e.target.value)}
                      placeholder="e.g. B2B Corporate Scheme"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Prefix</label>
                      <input
                        type="text"
                        value={editSchemePrefix}
                        onChange={(e) => setEditSchemePrefix(e.target.value)}
                        placeholder="e.g. INV-, TAX/"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Starting Number</label>
                      <input
                        type="number"
                        min="1"
                        value={editSchemeStartNo}
                        onChange={(e) => setEditSchemeStartNo(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Number of Digits</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editSchemeDigits}
                        onChange={(e) => setEditSchemeDigits(parseInt(e.target.value) || 4)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Format</label>
                      <select
                        value={editSchemeFormat}
                        onChange={(e) => setEditSchemeFormat(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="prefix_number">PREFIX-0001</option>
                        <option value="prefix_year_number">PREFIX-YEAR-0001</option>
                        <option value="number_only">0001 (Number only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Format Preview:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {editSchemeFormat === 'prefix_year_number'
                        ? `${editSchemePrefix}2026/${String(editSchemeStartNo).padStart(editSchemeDigits, '0')}`
                        : `${editSchemePrefix}${String(editSchemeStartNo).padStart(editSchemeDigits, '0')}`}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition"
                  >
                    Update Scheme
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
