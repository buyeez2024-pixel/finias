import React, { useState, useEffect } from 'react';
import { useErp } from '../../context/ErpContext';
import { Transaction, InvoiceLayoutType } from '../../types/erp';
import { InvoiceRenderer } from '../invoice/InvoiceRenderer';
import { printElement } from '../../utils/printHelper';
import {
  Printer,
  CheckCircle,
  X,
  Gift,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Receipt,
  FileText,
  Sliders,
  Settings,
  Eye,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Compass,
  Mail,
  MessageCircle,
} from 'lucide-react';

interface ReceiptModalProps {
  sale: Transaction | null;
  onClose: () => void;
}

const LAYOUT_OPTIONS: {
  id: InvoiceLayoutType;
  label: string;
  paperType: string;
  icon: any;
  isThermal?: boolean;
}[] = [
  { id: 'classic', label: 'Classic A4', paperType: 'A4 Page (210 × 297 mm)', icon: FileText },
  { id: 'elegant', label: 'Elegant Branded', paperType: 'A4 Page (210 × 297 mm)', icon: Sparkles },
  { id: 'detailed', label: 'Detailed B2B', paperType: 'A4 Page (210 × 297 mm)', icon: FileSpreadsheet },
  { id: 'columnized_tax', label: 'Columnized Tax', paperType: 'A4 Page (210 × 297 mm)', icon: Layers },
  { id: 'slim', label: 'Slim Thermal', paperType: '80mm POS Roll Continuous', icon: Receipt, isThermal: true },
  { id: 'slim2', label: 'Slim 2 Mini', paperType: '80mm POS Roll Minimalist', icon: Gift, isThermal: true },
];

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const {
    settings = {},
    customers = [],
    locations = [],
    navigateToSettings = () => {},
    sendOneClickNotifications,
    formatMoney,
  } = useErp() || {};

  const [activeLayout, setActiveLayout] = useState<InvoiceLayoutType>(
    settings?.defaultInvoiceLayout || 'classic'
  );
  const [isGiftMode, setIsGiftMode] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Print Preview Overlay States
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showMarginGuides, setShowMarginGuides] = useState(false);
  const [backdropTheme, setBackdropTheme] = useState<'dark' | 'neutral'>('dark');

  const isDarkMode = settings?.themeMode === 'dark';

  const handlePrint = () => {
    if (sale) {
      printElement('printable-invoice-surface', `Invoice-${sale.invoiceNo}`);
    }
  };

  const handleOneClickSend = async () => {
    if (!sale || !sendOneClickNotifications) return;
    setIsSending(true);
    try {
      await sendOneClickNotifications({
        templateType: 'new_sale',
        recipientContactId: sale.customerId,
        variables: {
          '{invoice_number}': sale.invoiceNo,
          '{total_amount}': formatMoney(sale.totalAmount),
          '{paid_amount}': formatMoney(sale.paidAmount),
          '{due_amount}': formatMoney(sale.totalAmount - sale.paidAmount),
        }
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!sale) return null;

  const customer = (customers || []).find((c) => c.id === sale.customerId);
  const location = (locations || []).find((l) => l.id === sale.locationId);

  const selectedLayoutMeta =
    LAYOUT_OPTIONS.find((l) => l.id === activeLayout) || LAYOUT_OPTIONS[0];

  return (
    <>
      {/* 1. Main POS Receipt Modal */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-3 sm:p-5 shadow-2xl space-y-3 max-h-[96vh] flex flex-col">
          {/* Modal Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 shrink-0">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <div>
                <span className="font-bold text-xs text-white block leading-tight">
                  Sale Completed
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Invoice #{sale.invoiceNo}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Full Print Preview Overlay Launcher */}
              <button
                type="button"
                id="open-print-preview-overlay-btn"
                onClick={() => setShowPreviewOverlay(true)}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              {/* Gift Receipt Toggle */}
              <button
                type="button"
                onClick={() => setIsGiftMode(!isGiftMode)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 ${
                  isGiftMode
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : isDarkMode
                      ? 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      : 'bg-slate-50 text-slate-500 hover:bg-indigo-600 hover:text-white border border-slate-200'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Gift</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition ${
                  isDarkMode
                    ? 'text-slate-500 hover:text-white hover:bg-slate-800'
                    : 'text-slate-400 hover:text-white hover:bg-indigo-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Invoice Layout Selector Pills */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-hide">
            <div className="flex items-center gap-1">
              {LAYOUT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = activeLayout === opt.id;
                const isDefault = settings?.defaultInvoiceLayout === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => setActiveLayout(opt.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isDarkMode
                          ? 'bg-slate-950 text-slate-500 hover:text-white border border-slate-800'
                          : 'bg-slate-50 text-slate-500 hover:bg-indigo-600 hover:text-white border border-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{opt.label}</span>
                    {isDefault && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Receipt Surface Paper Container */}
          <div className="overflow-y-auto overflow-x-hidden p-1 sm:p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex-1 min-h-0 custom-scrollbar w-full max-w-full min-w-0">
            <InvoiceRenderer
              transaction={sale}
              settings={settings || {}}
              location={location}
              customer={customer}
              activeLayoutOverride={activeLayout}
              isGiftReceiptOverride={isGiftMode}
            />
          </div>

          {/* Action Buttons Bottom Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 shrink-0">
            <button
              id="one-click-notification-btn"
              onClick={handleOneClickSend}
              disabled={isSending}
              className={`py-2.5 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition border ${
                isSending 
                  ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {isSending ? (
                <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <MessageCircle className="w-3.5 h-3.5" />
              )}
              <span>Notify</span>
            </button>

            <button
              id="preview-overlay-trigger-bottom-btn"
              onClick={() => setShowPreviewOverlay(true)}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1.5 border border-slate-700 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              id="print-receipt-action-btn"
              onClick={handlePrint}
              className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              id="close-receipt-modal-btn"
              onClick={onClose}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] rounded-lg transition border border-slate-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Print Preview Overlay (Realistic Paper Simulation) */}
      {showPreviewOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-fadeIn">
          {/* Top Control Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">Print Preview & Paper Inspector</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    {selectedLayoutMeta.paperType}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Invoice #{sale.invoiceNo} • Customer: {customer?.name || 'Walk-In'} • Total:{' '}
                  {settings?.currencySymbol || '$'}
                  {sale.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Layout Quick Selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {LAYOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setActiveLayout(opt.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeLayout === opt.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isDarkMode
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-500 hover:bg-indigo-600 hover:text-white hover:px-2 hover:rounded-md'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Scale, Margin & Theme Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 20))}
                  className={`p-1 transition rounded-md ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:bg-indigo-600 hover:text-white'}`}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-slate-300 w-10 text-center text-[11px]">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(Math.min(160, zoomLevel + 20))}
                  className={`p-1 transition rounded-md ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:bg-indigo-600 hover:text-white'}`}
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="ml-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                  title="Reset to 100% actual size"
                >
                  100%
                </button>
              </div>

              {/* Margins guide toggle */}
              <button
                type="button"
                onClick={() => setShowMarginGuides(!showMarginGuides)}
                className={`p-2 rounded-xl text-xs font-bold transition border ${
                  showMarginGuides
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                    : isDarkMode
                      ? 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                      : 'bg-slate-50 text-slate-500 hover:text-slate-900 border-slate-200'
                }`}
                title="Toggle Printable Margin Boundaries"
              >
                <Compass className="w-4 h-4" />
              </button>

              {/* Desk Backdrop Toggle */}
              <button
                type="button"
                onClick={() => setBackdropTheme(backdropTheme === 'dark' ? 'neutral' : 'dark')}
                className={`p-2 rounded-xl border transition ${
                  isDarkMode
                    ? 'bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border-slate-800'
                    : 'bg-slate-50 hover:bg-indigo-600 text-slate-500 hover:text-white border-slate-200'
                }`}
                title="Toggle Studio Backdrop Theme"
              >
                {backdropTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Print Confirmation Action */}
              <button
                type="button"
                id="print-preview-trigger-browser-btn"
                onClick={handlePrint}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Trigger Browser Print</span>
              </button>

              {/* Close Overlay */}
              <button
                type="button"
                onClick={() => setShowPreviewOverlay(false)}
                className={`p-2 rounded-xl transition ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    : 'bg-slate-100 hover:bg-indigo-600 text-slate-500 hover:text-white'
                }`}
                title="Exit Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Paper Viewport Desk Canvas */}
          <div
            className={`flex-1 overflow-auto p-6 flex items-start justify-center transition-colors duration-200 ${
              backdropTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-300'
            }`}
          >
            {/* Paper Sheet Simulator */}
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease',
              }}
              className="relative my-4"
            >
              {/* Paper Sheet Container with Physical Shadows */}
              <div
                className={`bg-white text-black shadow-2xl transition-all select-text relative ${
                  selectedLayoutMeta.isThermal
                    ? 'w-[360px] rounded-sm py-4 px-3 border-y-4 border-dashed border-gray-400'
                    : 'w-[794px] min-h-[1123px] rounded-md p-6 border border-slate-300'
                } ${showMarginGuides ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-slate-900' : ''}`}
              >
                {/* Margin Safety Lines Guide Overlay */}
                {showMarginGuides && (
                  <div className="absolute inset-4 border border-dashed border-rose-400 pointer-events-none z-10 flex items-start justify-between p-1">
                    <span className="text-[8px] font-mono text-rose-500 bg-white/80 px-1 rounded">
                      Top Margin: 12mm
                    </span>
                    <span className="text-[8px] font-mono text-rose-500 bg-white/80 px-1 rounded">
                      Printable Safety Area
                    </span>
                  </div>
                )}

                {/* The Rendered Invoice */}
                <InvoiceRenderer
                  transaction={sale}
                  settings={settings || {}}
                  location={location}
                  customer={customer}
                  activeLayoutOverride={activeLayout}
                  isGiftReceiptOverride={isGiftMode}
                />
              </div>
            </div>
          </div>

          {/* Bottom Information Ribbon */}
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-4">
              <span>
                Simulated Format: <strong className="text-white">{selectedLayoutMeta.paperType}</strong>
              </span>
              <span>
                Orientation: <strong className="text-white">Portrait</strong>
              </span>
              {isGiftMode && (
                <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  Gift Receipt Mode Active (Prices Hidden)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-[11px]">
                Tip: Press Ctrl+P (or ⌘+P) or click Trigger Browser Print to print directly.
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewOverlay(false)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
              >
                Back to POS Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
