import React from 'react';
import { useErp } from '../../context/ErpContext';
import { getDynamicInvoiceTitle } from '../../utils/invoiceHeadingHelper';
import { applyAmountRounding } from '../../utils/formatters';
import {
  Transaction,
  InvoiceLayoutType,
  InvoiceLayoutConfig,
  BusinessSettings,
  Location,
  Customer,
} from '../../types/erp';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  Calendar,
  CreditCard,
  QrCode,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Printer,
  Gift,
  HelpCircle,
  Tag,
  Hash,
  Landmark,
} from 'lucide-react';

interface InvoiceRendererProps {
  transaction: Transaction;
  settings: BusinessSettings;
  location?: Location;
  customer?: Customer;
  customConfig?: Partial<InvoiceLayoutConfig>;
  activeLayoutOverride?: InvoiceLayoutType;
  isGiftReceiptOverride?: boolean;
  onLayoutChange?: (layout: InvoiceLayoutType) => void;
  showToolbar?: boolean;
  printId?: string;
  className?: string;
  hideActionButtons?: boolean;
}

function getSignatureClass(style?: string): string {
  switch (style) {
    case 'style2': return 'font-[Dancing_Script] text-xl text-indigo-950 font-bold';
    case 'style3': return 'font-[Caveat] text-xl text-indigo-950 font-semibold';
    case 'style4': return 'font-serif italic text-xl text-indigo-950 font-black tracking-tight transform -skew-x-6';
    case 'style5': return 'font-mono italic text-sm text-indigo-950 font-bold tracking-widest uppercase';
    case 'style1':
    default:
      return 'font-signature text-2xl text-indigo-950';
  }
}

function getProprietorSignatureClass(style?: string): string {
  switch (style) {
    case 'style2': return 'font-[Dancing_Script] text-xl text-amber-950 font-bold';
    case 'style3': return 'font-[Caveat] text-xl text-amber-950 font-semibold';
    case 'style4': return 'font-serif italic text-xl text-amber-950 font-black tracking-tight transform -skew-x-6';
    case 'style5': return 'font-mono italic text-sm text-amber-950 font-bold tracking-widest uppercase';
    case 'style1':
    default:
      return 'font-signature text-2xl text-amber-950';
  }
}

// Convert numbers into words for formal tax invoices
export function convertNumberToWords(amount: number, currencyName: string = 'Dollars'): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const num = Math.floor(Math.abs(amount));
  const cents = Math.round((Math.abs(amount) - num) * 100);

  if (num === 0 && cents === 0) return `Zero ${currencyName} Only`;

  function helper(n: number): string {
    if (n === 0) return '';
    if (n < 20) return units[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + helper(n % 10);
    if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred ' + helper(n % 100);
    if (n < 1000000) return helper(Math.floor(n / 1000)) + ' Thousand ' + helper(n % 1000);
    if (n < 1000000000) return helper(Math.floor(n / 1000000)) + ' Million ' + helper(n % 1000000);
    return helper(Math.floor(n / 1000000000)) + ' Billion ' + helper(n % 1000000000);
  }

  let words = helper(num).trim();
  if (!words) words = 'Zero';
  let result = `${words} ${currencyName}`;
  if (cents > 0) {
    result += ` and ${helper(cents).trim()} Cents`;
  }
  return result + ' Only';
}

export const InvoiceRenderer: React.FC<InvoiceRendererProps> = ({
  transaction,
  settings,
  location,
  customer,
  customConfig,
  activeLayoutOverride,
  isGiftReceiptOverride,
  onLayoutChange,
  showToolbar = false,
  printId = "printable-invoice-surface",
  className = '',
  hideActionButtons = false,
}) => {
  const { customerGroups = [] } = useErp() || {};

  const matchedGroup = React.useMemo(() => {
    if (!customer || !customerGroups) return null;
    return customerGroups.find(
      (g) =>
        (customer.customerGroupId && g.id === customer.customerGroupId) ||
        (customer.customerGroup && g.name.toLowerCase() === customer.customerGroup.toLowerCase())
    );
  }, [customer, customerGroups]);

  const groupDiscountText = React.useMemo(() => {
    if (!matchedGroup) return '';
    const pct = Number(matchedGroup.calculationPercentage || matchedGroup.percentage || 0);
    if (pct === 0) return '';
    if (pct < 0) {
      return `${matchedGroup.name} (${Math.abs(pct)}% Group Discount Applied to base prices)`;
    }
    return `${matchedGroup.name} (${pct}% Group Markup Applied to base prices)`;
  }, [matchedGroup]);

  const defaultTitle = settings?.invoiceLayoutConfig?.invoiceTitle || 'TAX INVOICE';
  const autoTitle = getDynamicInvoiceTitle(transaction, defaultTitle);
  const resolvedInvoiceTitle = customConfig?.invoiceTitle !== undefined ? customConfig.invoiceTitle : autoTitle;

  const mergedConfig: InvoiceLayoutConfig = {
    layoutType: activeLayoutOverride || customConfig?.layoutType || settings?.defaultInvoiceLayout || 'classic',
    invoiceTitle: resolvedInvoiceTitle,
    invoiceSubHeading: customConfig?.invoiceSubHeading !== undefined ? customConfig.invoiceSubHeading : (settings?.invoiceLayoutConfig?.invoiceSubHeading || 'Original for Recipient'),
    showLogo: customConfig?.showLogo ?? settings?.invoiceLayoutConfig?.showLogo ?? true,
    logoUrl:
      customConfig?.logoUrl ||
      settings?.invoiceLayoutConfig?.logoUrl ||
      settings?.logoUrl ||
      settings?.logo ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('royal_pos_v1_primary_logo') || '' : ''),
    showBusinessName: customConfig?.showBusinessName ?? settings?.invoiceLayoutConfig?.showBusinessName ?? true,
    showTagline: customConfig?.showTagline ?? settings?.invoiceLayoutConfig?.showTagline ?? true,
    showAddress: customConfig?.showAddress ?? settings?.invoiceLayoutConfig?.showAddress ?? true,
    showPhone: customConfig?.showPhone ?? settings?.invoiceLayoutConfig?.showPhone ?? true,
    showEmail: customConfig?.showEmail ?? settings?.invoiceLayoutConfig?.showEmail ?? true,
    showTaxNumber: customConfig?.showTaxNumber ?? settings?.invoiceLayoutConfig?.showTaxNumber ?? true,
    showGstin: customConfig?.showGstin ?? settings?.invoiceLayoutConfig?.showGstin ?? true,
    showCustomerInfo: customConfig?.showCustomerInfo ?? settings?.invoiceLayoutConfig?.showCustomerInfo ?? true,
    showCustomerTaxId: customConfig?.showCustomerTaxId ?? settings?.invoiceLayoutConfig?.showCustomerTaxId ?? true,
    showCustomerAddress: customConfig?.showCustomerAddress ?? settings?.invoiceLayoutConfig?.showCustomerAddress ?? true,
    showCashierName: customConfig?.showCashierName ?? settings?.invoiceLayoutConfig?.showCashierName ?? true,
    showLocationName: customConfig?.showLocationName ?? settings?.invoiceLayoutConfig?.showLocationName ?? true,
    showInvoiceBarcode: customConfig?.showInvoiceBarcode ?? settings?.invoiceLayoutConfig?.showInvoiceBarcode ?? true,
    showQrCode: customConfig?.showQrCode ?? settings?.invoiceLayoutConfig?.showQrCode ?? true,
    showHsnCode: customConfig?.showHsnCode ?? settings?.invoiceLayoutConfig?.showHsnCode ?? true,
    showSku: customConfig?.showSku ?? settings?.invoiceLayoutConfig?.showSku ?? true,
    showBrand: customConfig?.showBrand ?? settings?.invoiceLayoutConfig?.showBrand ?? true,
    showCategory: customConfig?.showCategory ?? settings?.invoiceLayoutConfig?.showCategory ?? false,
    showUnit: customConfig?.showUnit ?? settings?.invoiceLayoutConfig?.showUnit ?? true,
    showUnitPriceExTax: customConfig?.showUnitPriceExTax ?? settings?.invoiceLayoutConfig?.showUnitPriceExTax ?? true,
    showDiscount: customConfig?.showDiscount ?? settings?.invoiceLayoutConfig?.showDiscount ?? true,
    showTaxPerLine: customConfig?.showTaxPerLine ?? settings?.invoiceLayoutConfig?.showTaxPerLine ?? true,
    showTaxSummaryTable: customConfig?.showTaxSummaryTable ?? settings?.invoiceLayoutConfig?.showTaxSummaryTable ?? true,
    showTotalInWords: customConfig?.showTotalInWords ?? settings?.invoiceLayoutConfig?.showTotalInWords ?? true,
    showPaymentMethods: customConfig?.showPaymentMethods ?? settings?.invoiceLayoutConfig?.showPaymentMethods ?? true,
    showBalanceDue: customConfig?.showBalanceDue ?? settings?.invoiceLayoutConfig?.showBalanceDue ?? true,
    showWarranty: customConfig?.showWarranty ?? settings?.invoiceLayoutConfig?.showWarranty ?? true,
    showWarrantyTerms: customConfig?.showWarrantyTerms ?? settings?.invoiceLayoutConfig?.showWarrantyTerms ?? false,
    showTerms: customConfig?.showTerms ?? settings?.invoiceLayoutConfig?.showTerms ?? true,
    termsAndConditions:
      customConfig?.termsAndConditions ||
      settings?.invoiceLayoutConfig?.termsAndConditions ||
      '1. Goods once sold cannot be returned without original cash memo.\n2. Warranty is as per manufacturer terms.\n3. Interest @ 18% p.a. will be charged if payment is not made within due date.',
    showFooterNote: customConfig?.showFooterNote ?? settings?.invoiceLayoutConfig?.showFooterNote ?? true,
    footerNote:
      customConfig?.footerNote ||
      settings?.invoiceLayoutConfig?.footerNote ||
      settings?.receiptFooter ||
      'Thank you for your business! For queries contact support@royalpos.com',
    showBankDetails: customConfig?.showBankDetails ?? settings?.invoiceLayoutConfig?.showBankDetails ?? true,
    bankName: customConfig?.bankName || settings?.invoiceLayoutConfig?.bankName || 'JPMorgan Chase Bank',
    accountNumber: customConfig?.accountNumber || settings?.invoiceLayoutConfig?.accountNumber || '987654321098',
    accountHolder: customConfig?.accountHolder || settings?.invoiceLayoutConfig?.accountHolder || settings?.businessName || settings?.name || 'Royal POSfini',
    ifscOrIban: customConfig?.ifscOrIban || settings?.invoiceLayoutConfig?.ifscOrIban || 'CHASUS33XXX',
    branchName: customConfig?.branchName || settings?.invoiceLayoutConfig?.branchName || 'Austin Financial District',
    showSignatureLine: customConfig?.showSignatureLine ?? settings?.invoiceLayoutConfig?.showSignatureLine ?? true,
    signatureLabel: customConfig?.signatureLabel || settings?.invoiceLayoutConfig?.signatureLabel || 'Authorized Signatory',
    isGiftReceipt: isGiftReceiptOverride ?? customConfig?.isGiftReceipt ?? settings?.invoiceLayoutConfig?.isGiftReceipt ?? false,
    paperSize: customConfig?.paperSize || settings?.invoiceLayoutConfig?.paperSize || 'A4',
    primaryColor: customConfig?.primaryColor || settings?.invoiceLayoutConfig?.primaryColor || '#4f46e5',
    ...customConfig,
  };
  
  console.log("MergedConfig in InvoiceRenderer:", mergedConfig);

  const layoutType = activeLayoutOverride || mergedConfig.layoutType || 'classic';

  const isGift = isGiftReceiptOverride ?? mergedConfig.isGiftReceipt;

  const activeLogoUrl =
    mergedConfig.logoUrl ||
    settings?.logoUrl ||
    settings?.logo ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('royal_pos_v1_primary_logo') || '' : '');

  const curSymbol = settings.currencySymbol || '$';
  const curPlacement = settings.currencyPlacement || 'prefix';
  const formatCur = (val: number) => {
    const formatted = val.toFixed(settings.currencyDecimalPlaces ?? 2);
    return curPlacement === 'suffix' ? `${formatted} ${curSymbol}` : `${curSymbol}${formatted}`;
  };

  const renderSealsAndSignaturesContent = () => {
    const sigConfig = settings?.signatureSealConfig || {};
    const showCompanySeal = sigConfig.showCompanySeal ?? true;
    const showRoundSeal = sigConfig.showRoundSeal ?? true;
    const showProprietorSeal = sigConfig.showProprietorSeal ?? true;
    const showSignature = mergedConfig.showSignatureLine && sigConfig.showSignature !== false;

    const hasSealsOrSigs = showCompanySeal || showRoundSeal || showProprietorSeal || showSignature;

    if (!hasSealsOrSigs) return null;

    return (
      <div className="w-full max-w-full min-w-0 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 sm:gap-4 print:break-inside-avoid">
        {/* Seals Row */}
        {(showCompanySeal || showRoundSeal) && (
          <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap shrink-0">
            {showCompanySeal && (
              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full border-2 border-dashed border-indigo-600/50 p-1 flex flex-col items-center justify-center text-center bg-indigo-50/40 rotate-[-4deg] shrink-0">
                {sigConfig.companySealUrl ? (
                  <img src={sigConfig.companySealUrl} alt="Seal" className="w-full h-full object-contain rounded-full" />
                ) : (
                  <>
                    <span className="text-[6px] font-black uppercase text-indigo-800 leading-none truncate max-w-full">
                      {sigConfig.sealCompanyName || settings.name}
                    </span>
                    <div className="w-8 h-[1px] bg-indigo-400 my-0.5"></div>
                    <span className="text-[4px] text-slate-500 leading-none truncate max-w-full">
                      {sigConfig.sealAddress || settings.address || ''}
                    </span>
                  </>
                )}
              </div>
            )}

            {showRoundSeal && (
              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full border-4 border-double border-cyan-700 p-1 flex flex-col items-center justify-center text-center bg-cyan-50/40 rotate-[5deg] shrink-0">
                {sigConfig.roundSealUrl ? (
                  <img src={sigConfig.roundSealUrl} alt="Round Seal" className="w-full h-full object-contain rounded-full" />
                ) : (
                  <>
                    <span className="text-[5px] font-black uppercase text-cyan-900 leading-tight truncate max-w-full">★ {settings?.name} ★</span>
                    <span className="text-[4px] font-mono text-cyan-700 uppercase">
                      {sigConfig.roundSealText || 'VERIFIED'}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Signatures Row */}
        {(showProprietorSeal || showSignature) && (
          <div className="w-full sm:w-auto flex items-end justify-center sm:justify-end gap-3 sm:gap-6 flex-wrap sm:flex-nowrap">
            {showProprietorSeal && (
              <div className="flex-1 sm:flex-none min-w-[100px] max-w-[135px] sm:w-36 text-center flex flex-col items-center space-y-1">
                <div className="h-9 sm:h-10 flex items-center justify-center max-w-full overflow-hidden">
                  {sigConfig.proprietorSignatureUrl ? (
                    <img src={sigConfig.proprietorSignatureUrl} alt="Proprietor Sig" className="h-8 sm:h-10 max-w-[85px] object-contain" />
                  ) : (
                    <span className={`${getProprietorSignatureClass(sigConfig.proprietorSignatureStyle)} text-sm sm:text-base leading-none select-none truncate block max-w-full`}>
                      {sigConfig.proprietorName || 'Arthur'}
                    </span>
                  )}
                </div>
                <div className="w-full pt-1 border-t border-slate-300">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-800 block truncate">
                    {sigConfig.proprietorName || 'Proprietor'}
                  </span>
                  <span className="text-[7px] font-bold text-amber-700 block truncate">
                    {sigConfig.proprietorDesignation || 'Managing Director'}
                  </span>
                </div>
              </div>
            )}

            {showSignature && (
              <div className="flex-1 sm:flex-none min-w-[100px] max-w-[135px] sm:w-36 text-center flex flex-col items-center space-y-1">
                <div className="h-9 sm:h-10 flex items-center justify-center max-w-full overflow-hidden">
                  {sigConfig.signatureUrl ? (
                    <img src={sigConfig.signatureUrl} alt="Signature" className="h-8 sm:h-10 max-w-[85px] object-contain" />
                  ) : (
                    <span className={`${getSignatureClass(sigConfig.signatureStyle)} text-sm sm:text-base leading-none select-none truncate block max-w-full`}>
                      {sigConfig.adminName || 'Admin'}
                    </span>
                  )}
                </div>
                <div className="w-full pt-1 border-t border-slate-300">
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-700 block truncate">
                    {mergedConfig.signatureLabel}
                  </span>
                  <span className="text-[7px] font-bold text-indigo-700 block truncate">
                    {sigConfig.adminName || 'Admin Executive'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSealsAndSignatures = () => {
    const content = renderSealsAndSignaturesContent();
    if (!content) return null;
    return (
      <div className="w-full max-w-full min-w-0 pt-3 sm:pt-4 border-t border-slate-200 mt-3 sm:mt-4 print:break-inside-avoid">
        {content}
      </div>
    );
  };

  const effectiveRoundOff = React.useMemo(() => {
    const rawTot = (transaction.subtotal || 0) - (transaction.discountAmount || 0) + (transaction.taxAmount || 0) + (transaction.shippingCharges || 0) + (transaction.additionalExpenses?.reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0) || 0);
    if (transaction.roundOff !== undefined && transaction.roundOff !== null && Number(transaction.roundOff) !== 0) {
      return Number(transaction.roundOff);
    }
    const roundedTot = applyAmountRounding(rawTot > 0 ? rawTot : transaction.totalAmount, settings?.amountRoundingMethod);
    const calculated = Math.round((roundedTot - rawTot) * 100) / 100;
    if (calculated !== 0) {
      return calculated;
    }
    if (transaction.roundOff !== undefined && transaction.roundOff !== null) {
      return Number(transaction.roundOff);
    }
    return Math.round(((transaction.totalAmount || 0) - rawTot) * 100) / 100;
  }, [transaction, settings?.amountRoundingMethod]);

  const displayTotalAmount = React.useMemo(() => {
    const rawTot = (transaction.subtotal || 0) - (transaction.discountAmount || 0) + (transaction.taxAmount || 0) + (transaction.shippingCharges || 0) + (transaction.additionalExpenses?.reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0) || 0);
    if (effectiveRoundOff !== 0 && rawTot > 0) {
      return Math.round((rawTot + effectiveRoundOff) * 100) / 100;
    }
    return transaction.totalAmount ?? 0;
  }, [transaction, effectiveRoundOff]);

  const totalInWords = convertNumberToWords(
    displayTotalAmount,
    settings.currencyCode || settings.currency || 'USD'
  );

  // Group items by tax rate / HSN for statutory tax breakdown
  const taxSummary = React.useMemo(() => {
    const map: Record<
      string,
      {
        hsn: string;
        taxRate: number;
        taxableValue: number;
        cgstAmount: number;
        sgstAmount: number;
        igstAmount: number;
        totalTax: number;
      }
    > = {};

    transaction.items.forEach((item) => {
      const key = `${item.hsnCode || 'N/A'}_${item.taxRate || 0}`;
      const lineTaxable = (item.unitPrice * item.quantity) - (item.discount || 0);
      const lineTax = item.taxAmount || ((lineTaxable * (item.taxRate || 0)) / 100);
      const cgst = item.cgstAmount || (lineTax / 2);
      const sgst = item.sgstAmount || (lineTax / 2);
      const igst = item.igstAmount || 0;

      if (!map[key]) {
        map[key] = {
          hsn: item.hsnCode || 'N/A',
          taxRate: item.taxRate || 0,
          taxableValue: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalTax: 0,
        };
      }
      map[key].taxableValue += lineTaxable;
      map[key].cgstAmount += cgst;
      map[key].sgstAmount += sgst;
      map[key].igstAmount += igst;
      map[key].totalTax += lineTax;
    });

    return Object.values(map);
  }, [transaction.items]);

  // Barcode visualization pattern
  const renderBarcode = (code: string) => (
    <div className="flex flex-col items-center gap-1">
      <div className="flex justify-center items-center gap-[2px] h-8 max-w-[200px] overflow-hidden">
        {[3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 2, 4, 1, 3, 2, 4, 2].map((w, i) => (
          <div key={i} className="bg-black h-full" style={{ width: `${w}px` }} />
        ))}
      </div>
      <span className="font-mono text-[9px] text-gray-700 tracking-widest">{code}</span>
    </div>
  );

  return (
    <div className={`invoice-print-wrapper ${className}`}>
      {/* Dynamic print media styles */}

      {/* Surface Paper Container */}
      <div
        id={printId}
        className={`bg-white text-slate-900 mx-auto select-text shadow-xl transition-all duration-200 w-full max-w-full min-w-0 box-border overflow-hidden ${
          settings.fontPreset === 'serif' ? 'font-serif' : settings.fontPreset === 'mono' ? 'font-mono' : 'font-sans'
        } ${
          layoutType === 'slim' || layoutType === 'slim2'
            ? 'max-w-[340px] p-3 sm:p-4 text-[11px] font-mono border-t-8 border-indigo-600 rounded-2xl'
            : 'max-w-[850px] p-3.5 sm:p-8 text-xs font-sans rounded-2xl border border-slate-200'
        }`}
      >
        {/* ========================================================================= */}
        {/* LAYOUT 1: CLASSIC INVOICE (Standard Crisp Corporate)                      */}
        {/* ========================================================================= */}
        {layoutType === 'classic' && (
          <div className="space-y-6">
            {/* Header: Company Info (Left) + Invoice Meta (Right) */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b-2 border-slate-900">
              <div className="space-y-1 max-w-md">
                {mergedConfig.showLogo && activeLogoUrl && (
                  <img src={activeLogoUrl} alt="Company Logo" className="h-16 w-auto mb-2 object-contain" />
                )}
                {mergedConfig.showBusinessName && (
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
                    {settings.name}
                  </h1>
                )}
                {mergedConfig.showTagline && (
                  <p className="text-xs text-slate-600 font-medium">{settings.tagline}</p>
                )}
                {mergedConfig.showAddress && (
                  <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{location?.address || settings.address}</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                  {mergedConfig.showPhone && <span>Tel: {settings.phone}</span>}
                  {mergedConfig.showEmail && <span>Email: {settings.email}</span>}
                </div>
                {mergedConfig.showTaxNumber && (
                  <div className="text-xs font-bold text-slate-800 pt-1">
                    <span>Tax ID / Reg No: {settings.taxNumber}</span>
                    {settings.gstin && <span className="ml-3 font-mono">GSTIN: {settings.gstin}</span>}
                  </div>
                )}
              </div>

              {/* Invoice Meta Box */}
              <div className="text-right space-y-1 shrink-0 bg-white p-3.5 rounded-xl border border-slate-200 w-full sm:w-auto">
                <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs uppercase tracking-widest rounded-md mb-1 border border-indigo-100">
                  {mergedConfig.invoiceTitle}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">{mergedConfig.invoiceSubHeading}</div>
                <div className="text-xs font-bold text-slate-900 flex justify-between sm:justify-end gap-3 pt-1">
                  <span className="text-slate-500 font-normal">Invoice No:</span>
                  <span className="font-mono">{transaction.invoiceNo}</span>
                </div>
                <div className="text-xs text-slate-700 flex justify-between sm:justify-end gap-3">
                  <span className="text-slate-500">Date:</span>
                  <span>{transaction.date}</span>
                </div>
                {mergedConfig.showCashierName && (
                  <div className="text-xs text-slate-700 flex justify-between sm:justify-end gap-3">
                    <span className="text-slate-500">Cashier:</span>
                    <span>{transaction.cashierName || 'Cashier Desk'}</span>
                  </div>
                )}
                {transaction.commissionAgentName && (
                  <div className="text-xs text-slate-700 flex justify-between sm:justify-end gap-3">
                    <span className="text-slate-500">Sales Rep:</span>
                    <span className="font-semibold text-indigo-700">{transaction.commissionAgentName}</span>
                  </div>
                )}
                <div className="text-xs font-bold flex justify-between sm:justify-end gap-3 pt-1">
                  <span className="text-slate-500">Payment:</span>
                  <span className="text-emerald-700 uppercase font-bold">{transaction.paymentStatus}</span>
                </div>
              </div>
            </div>

            {/* Bill To & Location Details */}
            {mergedConfig.showCustomerInfo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Billed To:
                  </span>
                  <p className="font-bold text-sm text-slate-900">{customer?.name || 'Walk-In Customer'}</p>
                  {groupDiscountText && (
                    <div className="mt-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded w-fit">
                      ✓ {groupDiscountText}
                    </div>
                  )}
                  {customer?.businessName && (
                    <p className="text-xs font-semibold text-slate-700">{customer.businessName}</p>
                  )}
                  {mergedConfig.showCustomerAddress && customer?.address && (
                    <p className="text-xs text-slate-600">{customer.address}</p>
                  )}
                  <p className="text-xs text-slate-600">
                    {customer?.phone && <span>Tel: {customer.phone}</span>}
                    {customer?.email && <span className="ml-2">| {customer.email}</span>}
                  </p>
                  {mergedConfig.showCustomerTaxId && customer?.taxNumber && (
                    <p className="text-xs font-mono font-bold text-slate-700">Tax ID / GSTIN: {customer.taxNumber}</p>
                  )}
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Point of Sale Outlet:
                  </span>
                  <p className="font-bold text-xs text-slate-900">{location?.name || settings.name}</p>
                  <p className="text-xs text-slate-600">{location?.city ? `${location.city}, ${location.state || ''}` : settings.address}</p>
                  {transaction.isOfflineCreated && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      ⚡ Synced Local Storage Queue
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Main Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-2.5 border border-slate-700 text-center w-10">#</th>
                    <th className="p-2.5 border border-slate-700">Item Description</th>
                    {mergedConfig.showHsnCode && <th className="p-2.5 border border-slate-700 text-center w-20">HSN/SAC</th>}
                    <th className="p-2.5 border border-slate-700 text-center w-14">Qty</th>
                    {!isGift && <th className="p-2.5 border border-slate-700 text-right w-24">Unit Price</th>}
                    {!isGift && mergedConfig.showDiscount && <th className="p-2.5 border border-slate-700 text-right w-20">Disc</th>}
                    {!isGift && mergedConfig.showTaxPerLine && <th className="p-2.5 border border-slate-700 text-right w-20">Tax</th>}
                    {!isGift && <th className="p-2.5 border border-slate-700 text-right w-24">Total</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {transaction.items.map((item, idx) => (
                    <tr key={idx} className={settings.themeMode === 'light' ? 'bg-white' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50')}>
                      <td className="p-2.5 border border-slate-200 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 border border-slate-200">
                        <div className="font-bold text-slate-950">{item.productName}</div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {mergedConfig.showSku && item.sku && (
                            <span className="text-[10px] font-mono text-slate-500 mr-2">SKU: {item.sku}</span>
                          )}
                          {mergedConfig.showBrand && item.brand && (
                            <span className="inline-block text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                              Brand: {item.brand}
                            </span>
                          )}
                          {mergedConfig.showCategory && item.category && (
                            <span className="inline-block text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              Cat: {item.category}
                            </span>
                          )}
                        </div>
                        {mergedConfig.showWarranty && item.warrantyName && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>
                              Warranty: {item.warrantyName} ({item.warrantyDuration} {item.warrantyDurationType})
                              {item.warrantyStartDate && item.warrantyEndDate && (
                                <span className="font-normal text-slate-600"> • Period: {item.warrantyStartDate} to {item.warrantyEndDate}</span>
                              )}
                            </span>
                          </div>
                        )}
                      </td>
                      {mergedConfig.showHsnCode && (
                        <td className="p-2.5 border border-slate-200 text-center font-mono text-slate-600">
                          {item.hsnCode || '-'}
                        </td>
                      )}
                      <td className="p-2.5 border border-slate-200 text-center font-bold">
                        {item.quantity} {mergedConfig.showUnit && item.unit ? item.unit : ''}
                      </td>
                      {!isGift && (
                        <td className="p-2.5 border border-slate-200 text-right font-mono">
                          {formatCur(item.unitPrice)}
                        </td>
                      )}
                      {!isGift && mergedConfig.showDiscount && (
                        <td className="p-2.5 border border-slate-200 text-right font-mono text-slate-600">
                          {item.discount > 0 ? `-${formatCur(item.discount)}` : '-'}
                        </td>
                      )}
                      {!isGift && mergedConfig.showTaxPerLine && (
                        <td className="p-2.5 border border-slate-200 text-right font-mono text-slate-600">
                          {item.taxRate}%
                        </td>
                      )}
                      {!isGift && (
                        <td className="p-2.5 border border-slate-200 text-right font-mono font-bold text-slate-950">
                          {formatCur(item.total)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation + Total in Words */}
            {!isGift && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
                <div className="sm:col-span-7 space-y-3">
                  {mergedConfig.showTotalInWords && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Amount in Words:
                      </span>
                      <p className="font-semibold text-xs text-slate-800 capitalize italic">
                        {totalInWords}
                      </p>
                    </div>
                  )}

                  {/* Payment Details */}
                  {mergedConfig.showPaymentMethods && transaction.paymentEntries?.length > 0 && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Payment Mode Breakdown:
                      </span>
                      {transaction.paymentEntries.map((p, pIdx) => (
                        <div key={pIdx} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-700">
                            <span className="font-medium uppercase">{p.method} Payment:</span>
                            <span className="font-mono font-bold">{formatCur(p.amount)}</span>
                          </div>
                          {(p.method === 'card' || p.method.toString().toLowerCase().includes('terminal') || p.method.toString().toLowerCase().includes('pos')) && transaction.cardDetails && (
                            <div className="pl-4 text-[9px] text-slate-500 grid grid-cols-2 gap-x-2 border-l border-slate-200 ml-1">
                              <span>Card: {transaction.cardDetails.cardNumber}</span>
                              <span>Trans: {transaction.cardDetails.cardTransactionNo}</span>
                              <span>Type: {transaction.cardDetails.cardType}</span>
                              <span>Exp: {transaction.cardDetails.month}/{transaction.cardDetails.year}</span>
                            </div>
                          )}
                          {transaction.extraPaymentDetails && (
                            <div className="pl-4 text-[9px] text-slate-500 space-y-0.5 border-l border-slate-200 ml-1 italic">
                              {transaction.extraPaymentDetails.bankAccountNo && <div>Bank A/C: {transaction.extraPaymentDetails.bankAccountNo}</div>}
                              {transaction.extraPaymentDetails.chequeNo && <div>Cheque No: {transaction.extraPaymentDetails.chequeNo}</div>}
                              {transaction.extraPaymentDetails.transactionNo && <div>Trans No: {transaction.extraPaymentDetails.transactionNo}</div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bank Details */}
                  {mergedConfig.showBankDetails && (
                    <div className="text-[11px] text-slate-600 space-y-0.5 p-3 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block text-xs">Bank Wire Transfer Details:</span>
                      <div>Bank: <strong className="text-slate-800">{mergedConfig.bankName}</strong></div>
                      <div>A/C Holder: <strong className="text-slate-800">{mergedConfig.accountHolder}</strong></div>
                      <div>Account No: <strong className="font-mono text-slate-800">{mergedConfig.accountNumber}</strong> | IFSC/IBAN: <strong className="font-mono text-slate-800">{mergedConfig.ifscOrIban}</strong></div>
                    </div>
                  )}
                </div>

                {/* Right Totals Box */}
                <div className="sm:col-span-5 space-y-1.5 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">{formatCur(transaction.subtotal)}</span>
                  </div>
                  {transaction.discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-rose-600">
                      <span>Order Discount:</span>
                      <span className="font-mono font-semibold">-{formatCur(transaction.discountAmount)}</span>
                    </div>
                  )}
                  {transaction.taxAmount > 0 && (
                    <div className="flex justify-between text-xs text-slate-700">
                      <span>Tax / GST:</span>
                      <span className="font-mono font-semibold">{formatCur(transaction.taxAmount)}</span>
                    </div>
                  )}
                  {transaction.shippingCharges > 0 && (
                    <div className="flex justify-between text-xs text-slate-700">
                      <span>Shipping / Freight:</span>
                      <span className="font-mono font-semibold">{formatCur(transaction.shippingCharges)}</span>
                    </div>
                  )}
                  {transaction.additionalExpenses && transaction.additionalExpenses.length > 0 && transaction.additionalExpenses.map((exp: any, eIdx: number) => (
                    <div key={eIdx} className="flex justify-between text-xs text-slate-700">
                      <span>{exp.name}:</span>
                      <span className="font-mono font-semibold">{formatCur(exp.amount)}</span>
                    </div>
                  ))}
                  {effectiveRoundOff !== 0 && (
                    <div className="flex justify-between text-xs text-slate-700">
                      <span>Round Off:</span>
                      <span className="font-mono font-semibold">
                        {effectiveRoundOff > 0 ? `(+) ${formatCur(effectiveRoundOff)}` : `(-) ${formatCur(Math.abs(effectiveRoundOff))}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-200">
                    <span>GRAND TOTAL:</span>
                    <span className="font-mono text-base">{formatCur(displayTotalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-700 font-bold pt-1">
                    <span>Amount Paid:</span>
                    <span className="font-mono">{formatCur(transaction.paidAmount)}</span>
                  </div>
                  {mergedConfig.showBalanceDue && (
                    <div className="flex justify-between text-xs text-slate-600 pt-0.5">
                      <span>Change / Balance:</span>
                      <span className="font-mono">
                        {formatCur(Math.max(0, transaction.paidAmount - transaction.totalAmount))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms, Barcode & Signature */}
            <div className="pt-4 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-8 space-y-2">
                {mergedConfig.showTerms && (
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Terms & Conditions:
                    </span>
                    <p className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">
                      {mergedConfig.termsAndConditions}
                    </p>
                  </div>
                )}
                {mergedConfig.showFooterNote && (
                  <p className="text-[11px] text-slate-700 font-medium italic pt-1">
                    {mergedConfig.footerNote}
                  </p>
                )}
              </div>

              <div className="sm:col-span-4 flex flex-col items-center sm:items-end gap-3 text-center sm:text-right">
                {mergedConfig.showInvoiceBarcode && renderBarcode(transaction.invoiceNo)}
              </div>
            </div>
            {renderSealsAndSignatures()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LAYOUT 2: ELEGANT INVOICE (Modern Branded Theme with Color Accents)        */}
        {/* ========================================================================= */}
        {layoutType === 'elegant' && (
          <div className="space-y-6">
            {/* Elegant Header Banner */}
            <div className={settings.themeMode === 'light' ? 'bg-white border border-slate-200 text-slate-900 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4' : 'bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'}>
              <div className="space-y-1">
                {mergedConfig.showLogo && activeLogoUrl && (
                  <img src={activeLogoUrl} alt="Company Logo" className="h-16 w-auto mb-2 object-contain" />
                )}
                <div className={settings.themeMode === 'light' ? 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider' : 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-indigo-100 text-[10px] font-bold uppercase tracking-wider'}>
                  <Sparkles className={settings.themeMode === 'light' ? 'w-3 h-3 text-indigo-600' : 'w-3 h-3 text-amber-300'} />
                  <span>{mergedConfig.invoiceTitle}</span>
                </div>
                {mergedConfig.showBusinessName && (
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{settings.name}</h1>
                )}
                {mergedConfig.showTagline && settings.tagline && (
                  <p className={settings.themeMode === 'light' ? 'text-xs text-slate-600' : 'text-xs text-indigo-200'}>{settings.tagline}</p>
                )}
              </div>

              <div className={settings.themeMode === 'light' ? 'bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-right sm:self-auto self-stretch' : 'bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-right sm:self-auto self-stretch'}>
                <div className={settings.themeMode === 'light' ? 'text-[10px] uppercase tracking-widest text-indigo-700 font-bold' : 'text-[10px] uppercase tracking-widest text-indigo-200'}>{mergedConfig.invoiceSubHeading || 'Invoice Number'}</div>
                <div className="text-base font-black font-mono tracking-wider">{transaction.invoiceNo}</div>
                <div className={settings.themeMode === 'light' ? 'text-[11px] text-slate-600 mt-0.5 font-medium' : 'text-[11px] text-indigo-200 mt-0.5'}>{transaction.date}</div>
              </div>
            </div>

            {/* Split Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sender Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">
                  From / Store:
                </span>
                {mergedConfig.showBusinessName && (
                  <p className="font-bold text-xs text-slate-900">{location?.name || settings.name}</p>
                )}
                {mergedConfig.showAddress && (
                  <p className="text-xs text-slate-600">{location?.address || settings.address}</p>
                )}
                <p className="text-xs text-slate-600">
                  {mergedConfig.showPhone && settings.phone ? `Tel: ${settings.phone}` : ''}
                  {mergedConfig.showPhone && settings.phone && mergedConfig.showEmail && settings.email ? ' | ' : ''}
                  {mergedConfig.showEmail && settings.email ? settings.email : ''}
                </p>
                {mergedConfig.showTaxNumber && settings.taxNumber && (
                  <p className="text-[11px] font-mono text-slate-700 font-semibold">Tax ID: {settings.taxNumber}</p>
                )}
              </div>

              {/* Recipient Card */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">
                  Billed To / Recipient:
                </span>
                <p className="font-bold text-xs text-slate-900">{customer?.name || 'Valued Walk-In Customer'}</p>
                {groupDiscountText && (
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded w-fit">
                    ✓ {groupDiscountText}
                  </div>
                )}
                {customer?.businessName && <p className="text-xs font-semibold text-slate-700">{customer.businessName}</p>}
                {customer?.address && <p className="text-xs text-slate-600">{customer.address}</p>}
                <p className="text-xs text-slate-600">{customer?.phone ? `Tel: ${customer.phone}` : 'Retail Counter Sale'}</p>
                {customer?.taxNumber && <p className="text-[11px] font-mono font-bold text-slate-700">Tax ID: {customer.taxNumber}</p>}
              </div>
            </div>

            {/* Elegant Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-indigo-50/80 text-indigo-950 font-bold text-[11px] uppercase tracking-wider border-b border-indigo-100">
                    <th className="p-3">Description</th>
                    {mergedConfig.showHsnCode && <th className="p-3 text-center">HSN</th>}
                    <th className="p-3 text-center">Qty</th>
                    {!isGift && <th className="p-3 text-right">Price</th>}
                    {!isGift && <th className="p-3 text-right">Total</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {transaction.items.map((item, idx) => (
                    <tr key={idx} className={settings.themeMode === 'light' ? 'bg-white hover:bg-slate-50' : 'hover:bg-slate-50/60 transition-colors'}>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {mergedConfig.showSku && item.sku && <span className="text-[10px] text-slate-400 font-mono mr-2">SKU: {item.sku}</span>}
                          {mergedConfig.showBrand && item.brand && (
                            <span className="inline-block text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                              Brand: {item.brand}
                            </span>
                          )}
                          {mergedConfig.showCategory && item.category && (
                            <span className="inline-block text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              Cat: {item.category}
                            </span>
                          )}
                        </div>
                        {mergedConfig.showWarranty && item.warrantyName && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-medium">
                            <ShieldCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>
                              Warranty: {item.warrantyName} ({item.warrantyDuration} {item.warrantyDurationType})
                              {item.warrantyStartDate && item.warrantyEndDate && (
                                <span className="font-normal text-slate-500"> • {item.warrantyStartDate} to {item.warrantyEndDate}</span>
                              )}
                            </span>
                          </div>
                        )}
                      </td>
                      {mergedConfig.showHsnCode && (
                        <td className="p-3 text-center font-mono text-slate-500">{item.hsnCode || '-'}</td>
                      )}
                      <td className="p-3 text-center font-bold">
                        {item.quantity} {mergedConfig.showUnit && item.unit ? item.unit : ''}
                      </td>
                      {!isGift && <td className="p-3 text-right font-mono">{formatCur(item.unitPrice)}</td>}
                      {!isGift && <td className="p-3 text-right font-mono font-bold text-slate-950">{formatCur(item.total)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Highlights */}
            {!isGift && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-7 space-y-3">
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">
                      Total in Words:
                    </span>
                    <p className="font-bold text-xs text-slate-800 capitalize italic">{totalInWords}</p>
                    {mergedConfig.showBankDetails && (
                      <div className="text-[10px] text-slate-600 pt-2 border-t border-slate-200">
                        <span>Wire Transfer: </span>
                        <strong>{mergedConfig.bankName}</strong> | A/C: <strong className="font-mono">{mergedConfig.accountNumber}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className={settings.themeMode === 'light' ? 'sm:col-span-5 bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-2 text-slate-900' : 'sm:col-span-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-2'}>
                  <div className={settings.themeMode === 'light' ? 'flex justify-between text-xs text-slate-600 font-medium' : 'flex justify-between text-xs text-indigo-200'}>
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCur(transaction.subtotal)}</span>
                  </div>
                  {transaction.discountAmount > 0 && (
                    <div className={settings.themeMode === 'light' ? 'flex justify-between text-xs text-rose-600 font-medium' : 'flex justify-between text-xs text-amber-300'}>
                      <span>Discount:</span>
                      <span className="font-mono">-{formatCur(transaction.discountAmount)}</span>
                    </div>
                  )}
                  {transaction.taxAmount > 0 && (
                    <div className={settings.themeMode === 'light' ? 'flex justify-between text-xs text-slate-600 font-medium' : 'flex justify-between text-xs text-indigo-200'}>
                      <span>Tax / GST:</span>
                      <span className="font-mono">{formatCur(transaction.taxAmount)}</span>
                    </div>
                  )}
                  {transaction.shippingCharges > 0 && (
                    <div className={settings.themeMode === 'light' ? 'flex justify-between text-xs text-slate-600 font-medium' : 'flex justify-between text-xs text-indigo-200'}>
                      <span>Shipping:</span>
                      <span className="font-mono">{formatCur(transaction.shippingCharges)}</span>
                    </div>
                  )}
                  {transaction.additionalExpenses && transaction.additionalExpenses.length > 0 && transaction.additionalExpenses.map((exp: any, eIdx: number) => (
                    <div key={eIdx} className={settings.themeMode === 'light' ? 'flex justify-between text-xs text-slate-600 font-medium' : 'flex justify-between text-xs text-indigo-200'}>
                      <span>{exp.name}:</span>
                      <span className="font-mono">{formatCur(exp.amount)}</span>
                    </div>
                  ))}
                  {effectiveRoundOff !== 0 && (
                    <div className={settings.themeMode === 'light' ? 'flex justify-between text-xs text-slate-600 font-medium' : 'flex justify-between text-xs text-indigo-200'}>
                      <span>Round Off:</span>
                      <span className="font-mono">
                        {effectiveRoundOff > 0 ? `(+) ${formatCur(effectiveRoundOff)}` : `(-) ${formatCur(Math.abs(effectiveRoundOff))}`}
                      </span>
                    </div>
                  )}
                  <div className={settings.themeMode === 'light' ? 'flex justify-between text-sm font-black pt-2 border-t border-slate-200 text-slate-950' : 'flex justify-between text-sm font-black pt-2 border-t border-indigo-700/60'}>
                    <span>AMOUNT DUE:</span>
                    <span className={settings.themeMode === 'light' ? 'font-mono text-lg text-indigo-700' : 'font-mono text-lg text-emerald-400'}>{formatCur(displayTotalAmount)}</span>
                  </div>
                  <div className={settings.themeMode === 'light' ? 'flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-100 font-medium' : 'flex justify-between text-xs text-indigo-200 pt-1'}>
                    <span>Paid via {transaction.paymentEntries[0]?.method?.toUpperCase() || 'CASH'}:</span>
                    <span className="font-mono">{formatCur(transaction.paidAmount)}</span>
                  </div>
                  {transaction.cardDetails && (transaction.paymentEntries[0]?.method === 'card' || transaction.paymentEntries[0]?.method.toString().toLowerCase().includes('terminal')) && (
                    <div className="text-[9px] text-slate-400 font-mono text-right pt-1 opacity-80">
                      Card: {transaction.cardDetails.cardNumber} | TXN: {transaction.cardDetails.cardTransactionNo}
                    </div>
                  )}
                  {transaction.extraPaymentDetails && (
                    <div className="text-[9px] text-slate-400 font-mono text-right pt-1 opacity-80 italic">
                      {transaction.extraPaymentDetails.bankAccountNo && <span>Bank A/C: {transaction.extraPaymentDetails.bankAccountNo}</span>}
                      {transaction.extraPaymentDetails.chequeNo && <span>Cheque No: {transaction.extraPaymentDetails.chequeNo}</span>}
                      {transaction.extraPaymentDetails.transactionNo && <span>TXN: {transaction.extraPaymentDetails.transactionNo}</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left text-xs text-slate-500">
              <p className="italic">{mergedConfig.footerNote}</p>
              {mergedConfig.showInvoiceBarcode && renderBarcode(transaction.invoiceNo)}
            </div>
            {renderSealsAndSignatures()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LAYOUT 3: DETAILED INVOICE (Comprehensive B2B & Supply Chain)             */}
        {/* ========================================================================= */}
        {layoutType === 'detailed' && (
          <div className="space-y-4">
            {/* Enterprise Header */}
            <div className="border-b border-slate-200 pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div>
                  {mergedConfig.showLogo && activeLogoUrl && (
                    <img src={activeLogoUrl} alt="Company Logo" className="h-16 w-auto mb-2 object-contain" />
                  )}
                  {mergedConfig.showBusinessName && (
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">{settings.name}</h1>
                  )}
                  {mergedConfig.showTagline && settings.tagline && (
                    <p className="text-[11px] text-slate-600 font-medium mb-2">{settings.tagline}</p>
                  )}
                  {mergedConfig.showAddress && (
                    <p className="text-xs text-slate-600">{location?.address || settings.address}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-0.5">
                    {mergedConfig.showPhone && settings.phone ? `Tel: ${settings.phone}` : ''}
                    {mergedConfig.showPhone && settings.phone && mergedConfig.showEmail && settings.email ? ' | ' : ''}
                    {mergedConfig.showEmail && settings.email ? `Email: ${settings.email}` : ''}
                  </p>
                </div>
                <div className="text-center bg-white text-indigo-900 p-4 rounded-2xl min-w-[240px] border border-sky-200 shadow-sm">
                  <div className="text-sm font-black uppercase tracking-widest text-indigo-700">{mergedConfig.invoiceTitle}</div>
                  {mergedConfig.invoiceSubHeading && (
                    <div className="text-[11px] text-slate-500 mb-1">{mergedConfig.invoiceSubHeading}</div>
                  )}
                  <div className="text-sm font-mono font-bold mt-1">{transaction.invoiceNo}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Dated: {transaction.date}</div>
                </div>
              </div>

              {/* Tax Identifiers Grid */}
              {mergedConfig.showTaxNumber && (settings.gstin || settings.taxNumber) && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs pt-4 mt-2 font-mono text-slate-800">
                  <div>Company GSTIN: <strong className="text-slate-950">{settings.gstin || settings.taxNumber}</strong></div>
                  <div>Place of Supply: <strong className="text-slate-950">{customer?.address ? 'Inter-State' : 'Intra-State'}</strong></div>
                  <div>Reverse Charge: <strong className="text-slate-950">NO</strong></div>
                </div>
              )}
            </div>
            <div className="h-[2px] bg-slate-900 w-full mb-1"></div>

            {/* Detailed Customer & Dispatch Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border border-sky-200 rounded-xl bg-white text-xs overflow-hidden shadow-sm">
              <div className="p-4 space-y-1">
                <span className="font-extrabold uppercase text-[10px] tracking-wider text-indigo-800 block mb-1">Details of Receiver (Billed To):</span>
                <p className="font-bold text-slate-950 text-sm">{customer?.name || 'Walk-In Customer (Default)'}</p>
                {groupDiscountText && (
                  <div className="mt-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded w-fit">
                    ✓ {groupDiscountText}
                  </div>
                )}
                {customer?.businessName && <p className="font-medium text-slate-700">{customer.businessName}</p>}
                {customer?.address ? <p className="text-slate-600 mt-1">{customer.address}</p> : <p className="text-slate-600 mt-1">Retail Walk-in<br/>Counter Direct Sale</p>}
                <p className="text-slate-600 mt-1.5">Contact: {customer?.phone || '+1 (555) 000-0000'}</p>
                <p className="font-bold text-slate-800 mt-0.5">GSTIN / Tax ID: <span className="font-mono font-semibold">{customer?.taxNumber || 'Unregistered'}</span></p>
              </div>

              <div className="p-4 space-y-1.5 border-t sm:border-t-0 sm:border-l border-sky-200 bg-sky-50/40">
                <span className="font-extrabold uppercase text-[10px] tracking-wider text-indigo-800 block mb-1">Dispatch & Transport Details:</span>
                <div className="text-slate-700">Dispatch Location: <strong className="text-slate-900">{location?.name || 'Main Flagship Store'}</strong></div>
                <div className="text-slate-700">Transporter Name: <strong className="text-slate-900">Standard Express Logistics</strong></div>
                <div className="text-slate-700">Vehicle / LR No: <strong className="font-mono text-slate-900">TX-2026-TR889</strong></div>
                <div className="text-slate-700">Date of Supply: <strong className="text-slate-900">{transaction.date}</strong></div>
              </div>
            </div>

            {/* Exhaustive Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-sky-50/60 text-indigo-900 font-extrabold uppercase text-[9px] tracking-widest border-b border-slate-300">
                    <th className="p-2 border border-slate-300 text-center w-8">#</th>
                    <th className="p-2 border border-slate-300">Product & Description</th>
                    <th className="p-2 border border-slate-300 text-center">HSN/SAC</th>
                    <th className="p-2 border border-slate-300 text-center">Qty</th>
                    {!isGift && <th className="p-2 border border-slate-300 text-right">Unit Rate</th>}
                    {!isGift && <th className="p-2 border border-slate-300 text-right">Disc</th>}
                    {!isGift && <th className="p-2 border border-slate-300 text-right">Taxable Val</th>}
                    {!isGift && <th className="p-2 border border-slate-300 text-center">Tax %</th>}
                    {!isGift && <th className="p-2 border border-slate-300 text-right">Tax Amt</th>}
                    {!isGift && <th className="p-2 border border-slate-300 text-right">Total</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transaction.items.map((item, idx) => {
                    const taxable = (item.unitPrice * item.quantity) - (item.discount || 0);
                    const taxVal = item.taxAmount || ((taxable * (item.taxRate || 0)) / 100);
                    const isLight = settings.themeMode === 'light';
                    return (
                      <tr key={idx} className={isLight ? 'bg-white' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50')}>
                        <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-700">{idx + 1}</td>
                        <td className="p-2 border border-slate-300">
                          <span className="font-bold text-slate-900">{item.productName}</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {mergedConfig.showSku && item.sku && <span className="text-[10px] text-slate-500 font-mono mr-2">SKU: {item.sku}</span>}
                            {mergedConfig.showBrand && item.brand && (
                              <span className="inline-block text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                                Brand: {item.brand}
                              </span>
                            )}
                            {mergedConfig.showCategory && item.category && (
                              <span className="inline-block text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                Cat: {item.category}
                              </span>
                            )}
                          </div>
                          {mergedConfig.showWarranty && item.warrantyName && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium w-fit">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span>Warranty: {item.warrantyName} ({item.warrantyDuration} {item.warrantyDurationType}) [{item.warrantyStartDate || transaction.date} → {item.warrantyEndDate || 'N/A'}]</span>
                            </div>
                          )}
                        </td>
                        {mergedConfig.showHsnCode && (
                          <td className="p-2 border border-slate-300 text-center font-mono">{item.hsnCode || '-'}</td>
                        )}
                        <td className="p-2 border border-slate-300 text-center font-bold text-slate-900">
                          {item.quantity} {mergedConfig.showUnit && item.unit ? item.unit : ''}
                        </td>
                        {!isGift && <td className="p-2 border border-slate-300 text-right font-mono">{formatCur(item.unitPrice)}</td>}
                        {!isGift && <td className="p-2 border border-slate-300 text-right font-mono text-slate-600">{item.discount > 0 ? formatCur(item.discount) : '-'}</td>}
                        {!isGift && <td className="p-2 border border-slate-300 text-right font-mono">{formatCur(taxable)}</td>}
                        {!isGift && <td className="p-2 border border-slate-300 text-center font-mono">{item.taxRate}%</td>}
                        {!isGift && <td className="p-2 border border-slate-300 text-right font-mono">{formatCur(taxVal)}</td>}
                        {!isGift && <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">{formatCur(item.total)}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Statutory HSN / Tax Summary Breakdown Table */}
            {!isGift && mergedConfig.showTaxSummaryTable && taxSummary.length > 0 && (
              <div className="space-y-1 mt-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-800 mb-1 block">
                  Statutory Tax Summary & GST Reconciliation:
                </span>
                <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-sky-50/60 font-extrabold uppercase text-[9px] tracking-widest text-indigo-900">
                      <th className="p-2 border border-slate-300">HSN/SAC</th>
                      <th className="p-2 border border-slate-300 text-right">Taxable Value</th>
                      <th className="p-2 border border-slate-300 text-right">CGST (Rate/Amt)</th>
                      <th className="p-2 border border-slate-300 text-right">SGST (Rate/Amt)</th>
                      <th className="p-2 border border-slate-300 text-right">IGST Amt</th>
                      <th className="p-2 border border-slate-300 text-right">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxSummary.map((t, tIdx) => (
                      <tr key={tIdx} className="font-mono bg-white">
                        <td className="p-2 border border-slate-300 text-slate-800">{t.hsn}</td>
                        <td className="p-2 border border-slate-300 text-right text-slate-800">{formatCur(t.taxableValue)}</td>
                        <td className="p-2 border border-slate-300 text-right text-slate-800">{(t.taxRate / 2)}% ({formatCur(t.cgstAmount)})</td>
                        <td className="p-2 border border-slate-300 text-right text-slate-800">{(t.taxRate / 2)}% ({formatCur(t.sgstAmount)})</td>
                        <td className="p-2 border border-slate-300 text-right text-slate-800">{formatCur(t.igstAmount)}</td>
                        <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">{formatCur(t.totalTax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Calculations & Bank Wire */}
            {!isGift && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-3">
                <div className="sm:col-span-7 space-y-3">
                  <div className="p-3 bg-white rounded-xl border border-sky-200 shadow-sm text-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Amount in Words:</span>
                    <p className="font-bold text-indigo-900 italic">{totalInWords}</p>
                  </div>
                  
                  {mergedConfig.showBankDetails && (
                    <div className="p-3 bg-white rounded-xl border border-dashed border-sky-300 text-[11px] space-y-1">
                      <span className="font-bold text-slate-900 block mb-1">Bank Wire Details for Remittance:</span>
                      <div className="text-slate-700">Bank: <strong className="text-slate-900">{mergedConfig.bankName}</strong> | Branch: <strong className="text-slate-900">{mergedConfig.branchName}</strong></div>
                      <div className="text-slate-700">Account: <strong className="font-mono text-slate-900">{mergedConfig.accountNumber}</strong> | IFSC/IBAN: <strong className="font-mono text-slate-900">{mergedConfig.ifscOrIban}</strong></div>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-5 bg-white p-4 rounded-xl border border-sky-200 shadow-sm text-xs space-y-2">
                  <div className="flex justify-between text-slate-800">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-bold text-slate-950">{formatCur(transaction.subtotal)}</span>
                  </div>
                  {transaction.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Total Discount:</span>
                      <span className="font-mono font-bold">-{formatCur(transaction.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-800">
                    <span>Total Statutory Tax:</span>
                    <span className="font-mono font-bold text-slate-950">{formatCur(transaction.taxAmount)}</span>
                  </div>
                  {transaction.shippingCharges > 0 && (
                    <div className="flex justify-between text-slate-800">
                      <span>Shipping & Handling:</span>
                      <span className="font-mono font-bold text-slate-950">{formatCur(transaction.shippingCharges)}</span>
                    </div>
                  )}
                  {transaction.additionalExpenses && transaction.additionalExpenses.length > 0 && transaction.additionalExpenses.map((exp: any, eIdx: number) => (
                    <div key={eIdx} className="flex justify-between text-slate-800">
                      <span>{exp.name}:</span>
                      <span className="font-mono font-bold text-slate-950">{formatCur(exp.amount)}</span>
                    </div>
                  ))}
                  {effectiveRoundOff !== 0 && (
                    <div className="flex justify-between text-slate-800">
                      <span>Round Off:</span>
                      <span className="font-mono font-bold text-slate-950">
                        {effectiveRoundOff > 0 ? `(+) ${formatCur(effectiveRoundOff)}` : `(-) ${formatCur(Math.abs(effectiveRoundOff))}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t border-dashed border-slate-300">
                    <span>NET INVOICE TOTAL:</span>
                    <span className="font-mono">{formatCur(displayTotalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700 pt-1">
                    <span>Paid:</span>
                    <span className="font-mono">{formatCur(transaction.paidAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer with Signatures */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-2">
              <div className="space-y-1">
                <span className="font-bold text-[10px] uppercase text-slate-500 tracking-wider block mb-1">Declaration & Terms:</span>
                <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-line">
                  {mergedConfig.termsAndConditions}
                </p>
              </div>
              <div className="flex flex-col items-center sm:items-end justify-end">
                {renderSealsAndSignaturesContent()}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LAYOUT 4: COLUMNIZE TAXES INVOICE (Dedicated Tax Columns)                 */}
        {/* ========================================================================= */}
        {layoutType === 'columnized_tax' && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
              <div>
                {mergedConfig.showLogo && activeLogoUrl && (
                  <img src={activeLogoUrl} alt="Company Logo" className="h-16 w-auto mb-2 object-contain" />
                )}
                {mergedConfig.showBusinessName && (
                  <h1 className="text-2xl font-black text-slate-950 uppercase">{settings.name}</h1>
                )}
                {mergedConfig.showTagline && settings.tagline && (
                  <p className="text-xs text-slate-600 font-medium">{settings.tagline}</p>
                )}
                {mergedConfig.showAddress && (
                  <p className="text-xs text-slate-600">{location?.address || settings.address}</p>
                )}
                <p className="text-xs text-slate-600 mt-0.5">
                  {mergedConfig.showPhone && settings.phone ? `Tel: ${settings.phone}` : ''}
                  {mergedConfig.showPhone && settings.phone && mergedConfig.showEmail && settings.email ? ' | ' : ''}
                  {mergedConfig.showEmail && settings.email ? `Email: ${settings.email}` : ''}
                </p>
                {mergedConfig.showTaxNumber && (settings.gstin || settings.taxNumber) && (
                  <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                    GSTIN / TAX ID: {settings.gstin || settings.taxNumber}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="px-3 py-1 bg-indigo-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-md inline-block">
                  {mergedConfig.invoiceTitle}
                </div>
                {mergedConfig.invoiceSubHeading && (
                  <div className="text-[11px] text-slate-500 mt-0.5">{mergedConfig.invoiceSubHeading}</div>
                )}
                <div className="text-xs font-mono font-bold text-slate-950 mt-2">
                  Invoice #: {transaction.invoiceNo}
                </div>
                <div className="text-xs text-slate-600">Date: {transaction.date}</div>
              </div>
            </div>

            {/* Billed To */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Details of Receiver (Billed To):</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{customer?.name || 'Walk-In Customer'}</div>
                {groupDiscountText && (
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded w-fit">
                    ✓ {groupDiscountText}
                  </div>
                )}
                {customer?.address && <div className="text-slate-600 mt-0.5">{customer.address}</div>}
                {customer?.phone && customer.phone !== 'N/A' && <div className="text-slate-600">Phone: {customer.phone}</div>}
                {customer?.email && <div className="text-slate-600">Email: {customer.email}</div>}
                {customer?.taxNumber && <div className="font-mono text-slate-600 mt-0.5 font-semibold">Tax ID / GSTIN: {customer.taxNumber}</div>}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Place of Supply:</span>
                <span className="font-semibold text-slate-800">{settings.stateCode || 'Standard'}</span>
              </div>
            </div>

            {/* Columnized Multi-Tax Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-400 text-[11px]">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[9px] tracking-wider">
                    <th className="p-2 border border-slate-700 text-center w-6">#</th>
                    <th className="p-2 border border-slate-700">Description</th>
                    <th className="p-2 border border-slate-700 text-center">HSN</th>
                    <th className="p-2 border border-slate-700 text-center">Qty</th>
                    {!isGift && <th className="p-2 border border-slate-700 text-right">Rate</th>}
                    {!isGift && <th className="p-2 border border-slate-700 text-right">Taxable</th>}
                    {!isGift && <th className="p-2 border border-slate-700 text-right">CGST</th>}
                    {!isGift && <th className="p-2 border border-slate-700 text-right">SGST</th>}
                    {!isGift && <th className="p-2 border border-slate-700 text-right">IGST</th>}
                    {!isGift && <th className="p-2 border border-slate-700 text-right">Total</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transaction.items.map((item, idx) => {
                    const taxable = (item.unitPrice * item.quantity) - (item.discount || 0);
                    const lineTax = item.taxAmount || ((taxable * (item.taxRate || 0)) / 100);
                    const cgst = item.cgstAmount || (lineTax / 2);
                    const sgst = item.sgstAmount || (lineTax / 2);
                    const igst = item.igstAmount || 0;

                    return (
                      <tr key={idx} className={settings.themeMode === 'light' ? 'bg-white' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50')}>
                        <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-bold text-slate-900">
                          <div>{item.productName}</div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {mergedConfig.showSku && item.sku && <span className="text-[9px] text-slate-500 font-mono mr-2">SKU: {item.sku}</span>}
                            {mergedConfig.showBrand && item.brand && <span className="inline-block text-[9px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">Brand: {item.brand}</span>}
                            {mergedConfig.showCategory && item.category && <span className="inline-block text-[9px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">Cat: {item.category}</span>}
                          </div>
                          {mergedConfig.showWarranty && item.warrantyName && (
                            <div className="mt-0.5 flex items-center gap-1 text-[9px] text-emerald-700 font-semibold">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span>Warranty: {item.warrantyName} ({item.warrantyDuration} {item.warrantyDurationType}) [{item.warrantyStartDate} to {item.warrantyEndDate}]</span>
                            </div>
                          )}
                        </td>
                        {mergedConfig.showHsnCode && (
                          <td className="p-2 border border-slate-300 text-center font-mono">{item.hsnCode || '-'}</td>
                        )}
                        <td className="p-2 border border-slate-300 text-center font-bold">
                          {item.quantity} {mergedConfig.showUnit && item.unit ? item.unit : ''}
                        </td>
                        {!isGift && <td className="p-2 border border-slate-300 text-right font-mono">{formatCur(item.unitPrice)}</td>}
                        {!isGift && <td className="p-2 border border-slate-300 text-right font-mono">{formatCur(taxable)}</td>}
                        {!isGift && <td className="p-2 border border-slate-300 text-right font-mono text-indigo-700">{formatCur(cgst)}</td>}
                        {!isGift && <td className="p-2 border border-slate-300 text-right font-mono text-indigo-700">{formatCur(sgst)}</td>}
                        {!isGift && <td className="p-2 border border-slate-300 text-right font-mono text-indigo-700">{formatCur(igst)}</td>}
                        {!isGift && <td className="p-2 border border-slate-300 text-right font-mono font-bold">{formatCur(item.total)}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Calculations */}
            {!isGift && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-7 space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">Amount in Words:</span>
                    <p className="font-semibold text-slate-800 italic">{totalInWords}</p>
                  </div>
                  {mergedConfig.showBankDetails && (
                    <div className="text-[10px] text-slate-600 p-2.5 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
                      Bank: <strong>{mergedConfig.bankName}</strong> | A/C: <strong className="font-mono">{mergedConfig.accountNumber}</strong> | IFSC: <strong className="font-mono">{mergedConfig.ifscOrIban}</strong>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span>Taxable Base:</span>
                    <span className="font-mono font-bold">{formatCur(transaction.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-indigo-800">
                    <span>Total GST Taxes:</span>
                    <span className="font-mono font-bold">{formatCur(transaction.taxAmount)}</span>
                  </div>
                  {transaction.shippingCharges > 0 && (
                    <div className="flex justify-between text-slate-800">
                      <span>Shipping/Courier:</span>
                      <span className="font-mono font-bold">{formatCur(transaction.shippingCharges)}</span>
                    </div>
                  )}
                  {transaction.additionalExpenses && transaction.additionalExpenses.length > 0 && transaction.additionalExpenses.map((exp: any, eIdx: number) => (
                    <div key={eIdx} className="flex justify-between text-slate-800">
                      <span>{exp.name}:</span>
                      <span className="font-mono font-bold">{formatCur(exp.amount)}</span>
                    </div>
                  ))}
                  {effectiveRoundOff !== 0 && (
                    <div className="flex justify-between text-slate-800">
                      <span>Round Off:</span>
                      <span className="font-mono font-bold">
                        {effectiveRoundOff > 0 ? `(+) ${formatCur(effectiveRoundOff)}` : `(-) ${formatCur(Math.abs(effectiveRoundOff))}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t-2 border-slate-900">
                    <span>GRAND TOTAL:</span>
                    <span className="font-mono">{formatCur(displayTotalAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Barcode & Sign */}
            <div className="pt-3 border-t border-slate-300 flex justify-between items-center text-xs">
              <span className="italic text-slate-500 text-[10px]">{mergedConfig.footerNote}</span>
              {mergedConfig.showInvoiceBarcode && renderBarcode(transaction.invoiceNo)}
            </div>
            {renderSealsAndSignatures()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LAYOUT 5: SLIM INVOICE (80mm Thermal Receipt POS Printer)                 */}
        {/* ========================================================================= */}
        {layoutType === 'slim' && (
          <div className="space-y-3 select-text">
            {/* Centered Store Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
              {mergedConfig.showLogo && activeLogoUrl && (
                <img src={activeLogoUrl} alt="Company Logo" className="h-12 w-auto mx-auto mb-1 object-contain" />
              )}
              {mergedConfig.showBusinessName && (
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-950">{settings.name}</h2>
              )}
              {mergedConfig.showTagline && settings.tagline && (
                <p className="text-[10px] text-slate-600 font-medium">{settings.tagline}</p>
              )}
              {mergedConfig.showAddress && (
                <p className="text-[10px] text-slate-600">{location?.name || settings.address}</p>
              )}
              {mergedConfig.showPhone && settings.phone && (
                <p className="text-[10px] text-slate-600">Tel: {settings.phone}</p>
              )}
              {mergedConfig.showTaxNumber && settings.taxNumber && (
                <p className="text-[10px] font-bold text-slate-800">Tax ID: {settings.taxNumber}</p>
              )}
              <div className="text-[10px] font-extrabold uppercase tracking-wide text-indigo-800 pt-1">
                *** {mergedConfig.invoiceTitle} ***
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-slate-400 text-slate-700">
              <div className="flex justify-between">
                <span>Receipt No:</span>
                <span className="font-bold font-mono text-slate-950">{transaction.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Date/Time:</span>
                <span>{transaction.date}</span>
              </div>
              {mergedConfig.showCashierName && (
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{transaction.cashierName || 'Cashier 01'}</span>
                </div>
              )}
              {transaction.commissionAgentName && (
                <div className="flex justify-between font-semibold text-indigo-900">
                  <span>Sales Rep:</span>
                  <span>{transaction.commissionAgentName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{customer?.name || 'Walk-In'}</span>
              </div>
              {groupDiscountText && (
                <div className="text-[9px] font-bold text-emerald-800 bg-emerald-50 p-1 rounded text-center my-0.5 border border-emerald-200">
                  ✓ {groupDiscountText}
                </div>
              )}
              {transaction.isOfflineCreated && (
                <div className="text-[9px] font-bold text-amber-800 bg-amber-100 p-0.5 rounded text-center my-0.5 border border-amber-300">
                  ⚡ OFFLINE LOCAL STORAGE QUEUE
                </div>
              )}
            </div>

            {/* Line Items List */}
            <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-400">
              <div className="flex justify-between font-extrabold text-[10px] uppercase text-slate-500 pb-0.5 border-b border-slate-200">
                <span>Item [Qty x Price]</span>
                <span>Amount</span>
              </div>

              {transaction.items.map((item, idx) => (
                <div key={idx} className="text-[11px] leading-tight">
                  <div className="font-bold text-slate-950 flex justify-between">
                    <span>{item.productName}</span>
                    {!isGift && <span className="font-mono">{formatCur(item.total)}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {mergedConfig.showSku && item.sku && <span className="text-[9px] text-slate-400 font-mono mr-2">SKU: {item.sku}</span>}
                    {mergedConfig.showBrand && item.brand && <span className="text-[9px] text-indigo-700 font-semibold mr-2">Brand: {item.brand}</span>}
                    {mergedConfig.showCategory && item.category && <span className="text-[9px] text-slate-700 font-semibold mr-2">Cat: {item.category}</span>}
                  </div>
                  {mergedConfig.showWarranty && item.warrantyName && (
                    <div className="text-[9px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                      <span>Warranty: {item.warrantyDuration} {item.warrantyDurationType} ({item.warrantyStartDate || transaction.date} - {item.warrantyEndDate})</span>
                    </div>
                  )}
                  <div className="text-[9px] text-slate-500 flex justify-between">
                    <span>
                      {item.quantity} {mergedConfig.showUnit ? (item.unit || 'pcs') : ''} {!isGift && `@ ${formatCur(item.unitPrice)}`}
                      {mergedConfig.showHsnCode && item.hsnCode && ` (HSN: ${item.hsnCode})`}
                    </span>
                    {!isGift && mergedConfig.showDiscount && item.discount > 0 && (
                      <span className="text-rose-600 font-mono">Disc: -{formatCur(item.discount)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            {!isGift && (
              <div className="space-y-1 text-[11px] pt-0.5 text-slate-800">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCur(transaction.subtotal)}</span>
                </div>
                {transaction.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatCur(transaction.discountAmount)}</span>
                  </div>
                )}
                {transaction.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax / GST:</span>
                    <span className="font-mono">{formatCur(transaction.taxAmount)}</span>
                  </div>
                )}
                {transaction.shippingCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span className="font-mono">{formatCur(transaction.shippingCharges)}</span>
                  </div>
                )}
                {transaction.additionalExpenses && transaction.additionalExpenses.length > 0 && transaction.additionalExpenses.map((exp: any, eIdx: number) => (
                  <div key={eIdx} className="flex justify-between">
                    <span>{exp.name}:</span>
                    <span className="font-mono">{formatCur(exp.amount)}</span>
                  </div>
                ))}
                {effectiveRoundOff !== 0 && (
                  <div className="flex justify-between">
                    <span>Round Off:</span>
                    <span className="font-mono">
                      {effectiveRoundOff > 0 ? `(+) ${formatCur(effectiveRoundOff)}` : `(-) ${formatCur(Math.abs(effectiveRoundOff))}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black text-slate-950 pt-1 border-t border-slate-400">
                  <span>TOTAL:</span>
                  <span className="font-mono text-sm">{formatCur(displayTotalAmount)}</span>
                </div>
                <div className="flex justify-between font-bold pt-0.5">
                  <span>Paid ({transaction.paymentEntries[0]?.method?.toUpperCase() || 'CASH'}):</span>
                  <span className="font-mono">{formatCur(transaction.paidAmount)}</span>
                </div>
                {transaction.cardDetails && (transaction.paymentEntries[0]?.method === 'card' || transaction.paymentEntries[0]?.method.toString().toLowerCase().includes('terminal')) && (
                  <div className="text-[10px] text-slate-600 pl-2 border-l border-slate-300">
                    <span>Card: {transaction.cardDetails.cardNumber} | TXN: {transaction.cardDetails.cardTransactionNo}</span>
                  </div>
                )}
                {transaction.extraPaymentDetails && (
                  <div className="text-[10px] text-slate-600 pl-2 border-l border-slate-300 italic">
                    {transaction.extraPaymentDetails.bankAccountNo && <span>Bank A/C: {transaction.extraPaymentDetails.bankAccountNo}</span>}
                    {transaction.extraPaymentDetails.chequeNo && <span>Cheque No: {transaction.extraPaymentDetails.chequeNo}</span>}
                    {transaction.extraPaymentDetails.transactionNo && <span>TXN: {transaction.extraPaymentDetails.transactionNo}</span>}
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Change:</span>
                  <span className="font-mono">
                    {formatCur(Math.max(0, transaction.paidAmount - transaction.totalAmount))}
                  </span>
                </div>
              </div>
            )}

            {/* Barcode & Footer */}
            <div className="text-center pt-2 border-t border-dashed border-slate-400 space-y-1.5">
              {mergedConfig.showInvoiceBarcode && renderBarcode(transaction.invoiceNo)}
              <p className="text-[9px] text-slate-600 italic leading-snug">
                {mergedConfig.footerNote || settings.receiptFooter}
              </p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                *** THANK YOU FOR VISITING ***
              </p>
            </div>
            {renderSealsAndSignatures()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LAYOUT 6: SLIM 2 / GIFT RECEIPT (Minimalist Receipt Format)               */}
        {/* ========================================================================= */}
        {layoutType === 'slim2' && (
          <div className="space-y-3 select-text">
            {/* Top Minimal Header */}
            <div className="text-center pb-2 border-b-2 border-slate-900 space-y-0.5">
              {mergedConfig.showLogo && activeLogoUrl && (
                <img src={activeLogoUrl} alt="Company Logo" className="h-12 w-auto mx-auto mb-1 object-contain" />
              )}
              {isGift && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider mb-1 border border-amber-300">
                  <Gift className="w-3 h-3 text-amber-700" />
                  <span>GIFT RECEIPT / NO PRICES</span>
                </div>
              )}
              {mergedConfig.showBusinessName && (
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-950">{settings.name}</h2>
              )}
              {mergedConfig.showTagline && settings.tagline && (
                <p className="text-[9px] text-slate-500 font-medium">{settings.tagline}</p>
              )}
              {mergedConfig.showAddress && (
                <p className="text-[9px] text-slate-500 tracking-wider font-sans">{settings.address}</p>
              )}
              {mergedConfig.showPhone && settings.phone && (
                <p className="text-[9px] text-slate-500">Tel: {settings.phone}</p>
              )}
              {mergedConfig.showTaxNumber && settings.taxNumber && (
                <p className="text-[9px] font-bold text-slate-800">Tax ID: {settings.taxNumber}</p>
              )}
              <div className="text-[9px] font-extrabold uppercase tracking-wide text-indigo-800 pt-1">
                {mergedConfig.invoiceTitle}
              </div>
              <div className="text-[9px] text-slate-600 font-mono pt-1">
                Ref: {transaction.invoiceNo} | {transaction.date}
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 pb-2 border-b border-dotted border-slate-400">
              <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                <span>Item</span>
                <span>Qty</span>
              </div>

              {transaction.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div>
                    <div className="font-bold text-slate-950">{item.productName}</div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {mergedConfig.showSku && item.sku && <span className="text-[9px] text-slate-400 font-mono mr-2">SKU: {item.sku}</span>}
                      {mergedConfig.showBrand && item.brand && <span className="text-[9px] text-indigo-700 font-semibold mr-2">Brand: {item.brand}</span>}
                      {mergedConfig.showCategory && item.category && <span className="text-[9px] text-slate-700 font-semibold mr-2">Cat: {item.category}</span>}
                    </div>
                    {mergedConfig.showWarranty && item.warrantyName && (
                      <div className="text-[9px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <span>Warranty: {item.warrantyName} ({item.warrantyDuration} {item.warrantyDurationType})</span>
                      </div>
                    )}
                  </div>
                  <div className="font-mono font-bold text-slate-800">
                    {item.quantity}{mergedConfig.showUnit && item.unit ? ` ${item.unit}` : ''}x
                  </div>
                </div>
              ))}
            </div>

            {/* Gift Return Terms or Total */}
            {isGift ? (
              <div className="bg-slate-50 p-2 rounded border border-dashed border-slate-300 text-[10px] text-center space-y-1">
                <span className="font-bold text-slate-800 block uppercase tracking-wide">Gift Exchange Policy</span>
                <p className="text-[9px] text-slate-600 leading-tight">
                  This receipt entitles bearer to merchandise exchange or store credit within 30 days of purchase when accompanied by this slip.
                </p>
              </div>
            ) : (
              <div className="space-y-1 text-[11px] pt-1">
                {effectiveRoundOff !== 0 && (
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Round Off:</span>
                    <span className="font-mono">
                      {effectiveRoundOff > 0 ? `(+) ${formatCur(effectiveRoundOff)}` : `(-) ${formatCur(Math.abs(effectiveRoundOff))}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300">
                  <span>TOTAL AMOUNT:</span>
                  <span className="font-mono">{formatCur(displayTotalAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Method: {transaction.paymentEntries[0]?.method?.toUpperCase() || 'CASH'}</span>
                  <span>Paid: {formatCur(transaction.paidAmount)}</span>
                </div>
                {transaction.cardDetails && (transaction.paymentEntries[0]?.method === 'card' || transaction.paymentEntries[0]?.method.toString().toLowerCase().includes('terminal')) && (
                  <div className="text-[9px] text-slate-500 text-right italic">
                    Card: {transaction.cardDetails.cardNumber} | TXN: {transaction.cardDetails.cardTransactionNo}
                  </div>
                )}
                {transaction.extraPaymentDetails && (
                  <div className="text-[9px] text-slate-500 text-right italic">
                    {transaction.extraPaymentDetails.bankAccountNo && <span>Bank A/C: {transaction.extraPaymentDetails.bankAccountNo}</span>}
                    {transaction.extraPaymentDetails.chequeNo && <span>Cheque No: {transaction.extraPaymentDetails.chequeNo}</span>}
                    {transaction.extraPaymentDetails.transactionNo && <span>TXN: {transaction.extraPaymentDetails.transactionNo}</span>}
                  </div>
                )}
              </div>
            )}

            {/* Barcode / QR validation */}
            <div className="pt-2 border-t border-dotted border-slate-400 text-center space-y-1">
              {renderBarcode(transaction.invoiceNo)}
              <p className="text-[8px] text-slate-500 font-mono">Keep this receipt for warranty and support.</p>
            </div>
            {renderSealsAndSignatures()}
          </div>
        )}
      </div>
    </div>
  );
};
