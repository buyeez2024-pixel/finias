import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { formatCurrency } from '../../utils/formatters';
import { ProjectedSalesChart } from './ProjectedSalesChart';
import { WeeklySalesVolumeChart } from './WeeklySalesVolumeChart';
import { DashboardFooterBar } from './DashboardFooterBar';
import {
  DollarSign,
  TrendingUp,
  Boxes,
  Truck,
  Receipt,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  CheckCircle2,
  Package,
  GripVertical,
  RotateCcw,
  Check,
  SlidersHorizontal,
  Move,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  onOpenQuickPurchase: () => void;
  onOpenQuickAdjustment: () => void;
}

const STORAGE_KEY = 'erp_dashboard_widget_order';

const DEFAULT_WIDGET_ORDER = [
  'stock_alerts',
  'kpi_cards',
  'projected_sales',
  'weekly_sales_volume',
  'revenue_velocity',
  'category_share',
  'recent_transactions',
];

interface DraggableWidgetWrapperProps {
  id: string;
  title: string;
  children: React.ReactNode;
  colSpan?: string;
  draggedWidgetId: string | null;
  dragOverWidgetId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

const DraggableWidgetWrapper: React.FC<DraggableWidgetWrapperProps> = ({
  id,
  title,
  children,
  colSpan = 'col-span-full',
  draggedWidgetId,
  dragOverWidgetId,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  const { settings = {} } = useErp() || {};
  const isDark = settings?.themeMode === 'dark';
  const isDragging = draggedWidgetId === id;
  const isDragOver = dragOverWidgetId === id && draggedWidgetId !== id;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, id)}
      onDragEnd={onDragEnd}
      className={`${colSpan} group relative rounded-2xl transition-all duration-200 ${
        isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200/80 shadow-xs'
      } overflow-hidden ${
        isDragging
          ? 'opacity-40 border-2 border-dashed border-indigo-500 scale-[0.99] bg-indigo-950/20'
          : isDragOver
          ? isDark
            ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950 bg-indigo-950/20 scale-[1.01] z-20'
            : 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white bg-indigo-50/50 scale-[1.01] z-20'
          : ''
      }`}
    >
      {/* Integrated Drag Header Bar */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b text-xs font-semibold select-none cursor-grab active:cursor-grabbing transition-colors ${
          isDark
            ? 'bg-slate-950/90 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
            : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/80'
        }`}
        title={`Click and drag to move "${title}" card`}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className={`font-bold text-xs tracking-wide ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{title}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-mono transition-colors ${
          isDark ? 'text-slate-400 group-hover:text-indigo-300' : 'text-slate-500 group-hover:text-indigo-600'
        }`}>
          <Move className="w-3 h-3 text-indigo-500" />
          <span className="uppercase tracking-wider hidden sm:inline">Drag to reorder</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div>{children}</div>

      {/* Drop Target Zone Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-indigo-950/80 border-2 border-indigo-500 rounded-2xl flex items-center justify-center z-40 backdrop-blur-xs pointer-events-none animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-indigo-500/50 px-4 py-2 rounded-xl text-indigo-300 text-xs font-bold flex items-center gap-2 shadow-2xl">
            <Move className="w-4 h-4 text-indigo-400 animate-bounce" />
            <span>Drop here to swap position with "{title}"</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenQuickPurchase,
  onOpenQuickAdjustment,
}) => {
  const {
    settings = {},
    financialSummary = { netSales: 0, grossProfit: 0, cogs: 0, grossProfitMargin: 0, stockValuationCost: 0, stockValuationRetail: 0, totalReceivables: 0, totalPayables: 0 },
    products = [],
    transactions = [],
    customers = [],
    suppliers = [],
    setActiveTab = () => {},
    currentLocation = null,
    currentUser = null,
  } = useErp() || {};

  // Resolve business name configured in Business Details (settings.name / settings.businessName)
  const configuredBusinessName =
    (typeof settings?.businessName === 'string' && settings.businessName.trim()) ||
    (typeof settings?.name === 'string' && settings.name.trim()) ||
    (typeof currentUser?.businessName === 'string' && currentUser.businessName.trim()) ||
    'Royal POSfini';

  // Professional Dashboard title formatted with the user's business name
  const dashboardTitle = configuredBusinessName.toLowerCase().endsWith('dashboard')
    ? configuredBusinessName
    : `${configuredBusinessName} Dashboard`;

  // Widget Layout Drag & Drop state initialized from localStorage
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Preserve valid keys and append any missing defaults
          const valid = parsed.filter((id) => DEFAULT_WIDGET_ORDER.includes(id));
          DEFAULT_WIDGET_ORDER.forEach((id) => {
            if (!valid.includes(id)) valid.push(id);
          });
          return valid;
        }
      }
    } catch (e) {
      console.error('Failed to load dashboard layout preference from localStorage:', e);
    }
    return DEFAULT_WIDGET_ORDER;
  });

  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const ACCENT_COLORS: Record<string, string> = {
    indigo: '#6366f1',
    emerald: '#10b981',
    violet: '#8b5cf6',
    amber: '#f59e0b',
    rose: '#f43f5e',
    cyan: '#06b6d4',
    orange: '#f97316',
    teal: '#14b8a6',
    fuchsia: '#d946ef',
    sky: '#0ea5e9',
    lime: '#84cc16',
  };

  const activeAccent = settings.themeAccent || 'indigo';
  const accentColor = ACCENT_COLORS[activeAccent] || '#6366f1';
  const isDark = settings.themeMode === 'dark';

  const isFreshInstalled = typeof window !== 'undefined' && (
    settings.isFreshInstallation === true ||
    settings.installationType === 'fresh' ||
    localStorage.getItem('app_fresh_installed') === 'true' ||
    localStorage.getItem('installation_type') === 'fresh' ||
    (localStorage.getItem('pos_installed') === 'true' && products.length === 0)
  );

  // Low stock products - only compute and show if not in fresh mode with 0 products
  const lowStockProducts = (!isFreshInstalled && products.length > 0)
    ? products.filter((p) => p.currentStock <= p.alertQuantity)
    : [];

  const hasData = !isFreshInstalled && transactions.length > 0;

  // Sales and purchases chart data
  const salesHistory = hasData ? [
    { date: 'Aug 04', sales: 2450, purchases: 1200, profit: 890 },
    { date: 'Aug 06', sales: 3100, purchases: 0, profit: 1240 },
    { date: 'Aug 08', sales: 1890, purchases: 4500, profit: 680 },
    { date: 'Aug 10', sales: 4200, purchases: 1100, profit: 1650 },
    { date: 'Aug 12', sales: 3800, purchases: 2800, profit: 1420 },
    { date: 'Aug 14', sales: 5100, purchases: 0, profit: 2100 },
    { date: 'Aug 16', sales: 4890, purchases: 15971, profit: 1980 },
    { date: 'Aug 17', sales: 3450, purchases: 2400, profit: 1390 },
  ] : [];

  // Category distribution data
  const categoryData = hasData ? [
    { name: 'Electronics', value: 48, color: accentColor },
    { name: 'Accessories', value: 24, color: '#10b981' },
    { name: 'Apparel', value: 16, color: '#f59e0b' },
    { name: 'Grocery', value: 12, color: '#ec4899' },
  ] : [];

  const isCustomLayout =
    JSON.stringify(widgetOrder) !== JSON.stringify(DEFAULT_WIDGET_ORDER);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Drag Event Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedWidgetId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedWidgetId || e.dataTransfer.getData('text/plain');

    if (sourceId && sourceId !== targetId) {
      setWidgetOrder((prev) => {
        const next = [...prev];
        const srcIdx = next.indexOf(sourceId);
        const targetIdx = next.indexOf(targetId);

        if (srcIdx !== -1 && targetIdx !== -1) {
          next.splice(srcIdx, 1);
          next.splice(targetIdx, 0, sourceId);

          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch (err) {
            console.error('Failed to save dashboard widget order:', err);
          }
        }
        return next;
      });

      showToast('Dashboard card layout updated & saved');
    }

    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleResetLayout = () => {
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to reset layout in localStorage:', err);
    }
    showToast('Dashboard layout reset to default order');
  };

  // Render individual widget blocks based on order
  const renderWidgetBlock = (widgetId: string) => {
    switch (widgetId) {
      case 'stock_alerts':
        if (lowStockProducts.length === 0) return null;
        return (
          <DraggableWidgetWrapper
            key="stock_alerts"
            id="stock_alerts"
            title="Low Stock Inventory Alerts"
            colSpan="col-span-full"
            draggedWidgetId={draggedWidgetId}
            dragOverWidgetId={dragOverWidgetId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          >
            <div className={`p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors ${
              isDark ? 'bg-amber-950/40 border border-amber-800/60' : 'bg-amber-50 border border-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
                    Low Stock Alert ({lowStockProducts.length} items below reorder threshold)
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>
                    {lowStockProducts.map((p) => `${p.name} (${p.currentStock} left)`).join(' • ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition"
                >
                  View Inventory Matrix
                </button>
                <button
                  onClick={onOpenQuickPurchase}
                  className={`px-3 py-1.5 font-bold text-xs rounded-lg transition border ${
                    isDark
                      ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-700/50'
                      : 'bg-white hover:bg-amber-100 text-amber-900 hover:text-amber-950 border-amber-300 shadow-2xs'
                  }`}
                >
                  + Create Reorder PO
                </button>
              </div>
            </div>
          </DraggableWidgetWrapper>
        );

      case 'kpi_cards':
        return (
          <DraggableWidgetWrapper
            key="kpi_cards"
            id="kpi_cards"
            title="Executive Financial KPI Cards"
            colSpan="col-span-full"
            draggedWidgetId={draggedWidgetId}
            dragOverWidgetId={dragOverWidgetId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Gross Sales */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200/80 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Net Sales</span>
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className={`text-2xl font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(financialSummary.netSales, settings)}
                  </div>
                  <div className={`flex items-center gap-1 text-[11px] mt-1 font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+18.4% vs last billing cycle</span>
                  </div>
                </div>
              </div>

              {/* Gross Profit & Margin */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200/80 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Gross Operating Profit</span>
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className={`text-2xl font-extrabold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {formatCurrency(financialSummary.grossProfit, settings)}
                  </div>
                  <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Margin: <span className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{financialSummary.grossProfitMargin.toFixed(1)}%</span> (COGS: {formatCurrency(financialSummary.cogs, settings)})
                  </div>
                </div>
              </div>

              {/* Real-Time Stock Valuation */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200/80 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Stock Inventory Value</span>
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className={`text-2xl font-extrabold font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {formatCurrency(financialSummary.stockValuationCost, settings)}
                  </div>
                  <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Retail Value: <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{formatCurrency(financialSummary.stockValuationRetail, settings)}</span>
                  </div>
                </div>
              </div>

              {/* Receivables & Payables */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200/80 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Customer Receivables</span>
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className={`text-2xl font-extrabold font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {formatCurrency(financialSummary.totalReceivables, settings)}
                  </div>
                  <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Supplier Payables: <span className={`font-bold ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>{formatCurrency(financialSummary.totalPayables, settings)}</span>
                  </div>
                </div>
              </div>
            </div>
          </DraggableWidgetWrapper>
        );

      case 'projected_sales':
        if (!hasData) return null;
        return (
          <DraggableWidgetWrapper
            key="projected_sales"
            id="projected_sales"
            title="30-Day Sales Forecast & Predictive Trend Chart"
            colSpan="col-span-full"
            draggedWidgetId={draggedWidgetId}
            dragOverWidgetId={dragOverWidgetId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          >
            <ProjectedSalesChart
              transactions={transactions}
              settings={settings}
              accentColor={accentColor}
            />
          </DraggableWidgetWrapper>
        );

      case 'weekly_sales_volume':
        if (!hasData) return null;
        return (
          <DraggableWidgetWrapper
            key="weekly_sales_volume"
            id="weekly_sales_volume"
            title="Weekly Sales Volume & Peak Trading Days"
            colSpan="col-span-full"
            draggedWidgetId={draggedWidgetId}
            dragOverWidgetId={dragOverWidgetId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          >
            <WeeklySalesVolumeChart
              transactions={transactions}
              settings={settings}
              accentColor={accentColor}
            />
          </DraggableWidgetWrapper>
        );

      case 'revenue_velocity':
        if (!hasData) return null;
        return (
          <DraggableWidgetWrapper
            key="revenue_velocity"
            id="revenue_velocity"
            title="Revenue & Profit Velocity Trend Chart"
            colSpan="col-span-full lg:col-span-2"
            draggedWidgetId={draggedWidgetId}
            dragOverWidgetId={dragOverWidgetId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          >
            <div className={`p-5 rounded-2xl border space-y-4 transition-colors h-full flex flex-col justify-between ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200/80 shadow-2xs'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <span>Revenue & Profit Velocity Trend</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real-time daily POS sales vs Gross profit realization</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`flex items-center gap-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Sales
                  </span>
                  <span className={`flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Profit
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer key={`${settings?.themeAccent}-${settings?.themeMode}`} width="100%" height="100%">
                  <AreaChart data={salesHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accentColor} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={settings?.themeMode === 'dark' ? "#1e293b" : "#f1f5f9"} />
                    <XAxis dataKey="date" stroke={settings?.themeMode === 'dark' ? "#64748b" : "#94a3b8"} fontSize={11} />
                    <YAxis stroke={settings?.themeMode === 'dark' ? "#64748b" : "#94a3b8"} fontSize={11} tickFormatter={(val) => `$${val}`} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: settings?.themeMode === 'dark' ? '#0f172a' : '#ffffff', 
                        borderColor: settings?.themeMode === 'dark' ? '#334155' : '#e2e8f0', 
                        borderRadius: '12px', 
                        fontSize: '12px',
                        color: settings?.themeMode === 'dark' ? '#f1f5f9' : '#1e293b'
                      }}
                      itemStyle={{ color: settings?.themeMode === 'dark' ? '#e2e8f0' : '#475569' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke={accentColor} strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                    <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </DraggableWidgetWrapper>
        );

      case 'category_share':
        if (!hasData) return null;
        return (
          <DraggableWidgetWrapper
            key="category_share"
            id="category_share"
            title="Sales by Category Share Distribution"
            colSpan="col-span-full lg:col-span-1"
            draggedWidgetId={draggedWidgetId}
            dragOverWidgetId={dragOverWidgetId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          >
            <div className={`p-5 rounded-2xl border space-y-4 flex flex-col justify-between transition-colors h-full ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200/80 shadow-2xs'
            }`}>
              <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>Sales by Category</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Product catalog sales contribution</p>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer key={`${settings?.themeAccent}-${settings?.themeMode}`} width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: settings?.themeMode === 'dark' ? '#0f172a' : '#ffffff', 
                        borderColor: settings?.themeMode === 'dark' ? '#334155' : '#e2e8f0', 
                        borderRadius: '12px', 
                        fontSize: '12px' 
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className={`grid grid-cols-2 gap-2 text-xs pt-2 border-t ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className={`font-medium truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{cat.name}:</span>
                    <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </DraggableWidgetWrapper>
        );

      case 'recent_transactions':
        return (
          <DraggableWidgetWrapper
            key="recent_transactions"
            id="recent_transactions"
            title="Recent ERP Transactions Ledger"
            colSpan="col-span-full"
            draggedWidgetId={draggedWidgetId}
            dragOverWidgetId={dragOverWidgetId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          >
            <div className={`rounded-2xl border p-5 space-y-4 transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200/80 shadow-2xs'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Receipt className="w-4 h-4 text-indigo-500" />
                    <span>Recent ERP Invoices & Transactions</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Audit trail of latest Point of Sale sales and purchase orders</p>
                </div>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`text-xs font-bold transition-colors ${
                    isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-slate-900'
                  }`}
                >
                  View All Sales →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`uppercase text-[10px] tracking-wider border-y font-bold ${
                    isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    <tr>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Invoice / Ref No.</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Customer / Supplier</th>
                      <th className="py-3 px-3">Items</th>
                      <th className="py-3 px-3">Total Amount</th>
                      <th className="py-3 px-3">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors ${
                    isDark ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-700'
                  }`}>
                    {transactions.slice(0, 6).map((txn) => {
                      const isSale = txn.type === 'sale';
                      const customer = customers.find((c) => c.id === txn.customerId);
                      const supplier = suppliers.find((s) => s.id === txn.supplierId);

                      return (
                        <tr key={txn.id} className={`transition-colors ${
                          isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                        }`}>
                          <td className="py-3 px-3 font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isSale
                                  ? isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {txn.type}
                            </span>
                          </td>
                          <td className={`py-3 px-3 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{txn.invoiceNo}</td>
                          <td className={`py-3 px-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{txn.date}</td>
                          <td className="py-3 px-3 font-medium">
                            {isSale ? customer?.name || 'Walk-In Customer' : supplier?.name || 'Wholesale Supplier'}
                          </td>
                          <td className={`py-3 px-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {txn.items.reduce((sum, i) => sum + i.quantity, 0)} pcs
                          </td>
                          <td className={`py-3 px-3 font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {formatCurrency(txn.totalAmount, settings)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                txn.paymentStatus === 'paid'
                                  ? isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : txn.paymentStatus === 'partial'
                                  ? isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : isDark ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {txn.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </DraggableWidgetWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-100">{toastMessage}</span>
        </div>
      )}

      {/* Dashboard Layout Control Toolbar */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs transition-colors ${
        isDark ? 'bg-slate-950/80 border-slate-800/80 text-slate-400 shadow-xs' : 'bg-slate-50 border-slate-200/80 text-slate-600 shadow-2xs'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-lg ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Customizable Dashboard Layout</span>
          <span className={`${isDark ? 'text-slate-600' : 'text-slate-300'} hidden sm:inline`}>•</span>
          <span className={`text-[11px] hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Drag any card by its top-right <strong className={`font-mono ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>Grip Handle</strong> to reorder. Preferred layout persists in <code className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>localStorage</code>.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isCustomLayout && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
              isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              <Check className="w-3 h-3 text-indigo-500" />
              Custom Layout Saved
            </span>
          )}

          <button
            onClick={handleResetLayout}
            disabled={!isCustomLayout}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              isCustomLayout
                ? isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 cursor-pointer shadow-2xs'
                : isDark
                  ? 'bg-slate-900/50 text-slate-600 border border-slate-800/40 cursor-not-allowed opacity-50'
                  : 'bg-slate-100/50 text-slate-400 border border-slate-200/40 cursor-not-allowed opacity-50'
            }`}
            title="Reset to default widget order"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Layout</span>
          </button>
        </div>
      </div>

      {/* Dynamic Grid Layout containing reorderable cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-max">
        {widgetOrder.map((widgetId) => renderWidgetBlock(widgetId))}
      </div>
    </div>
  );
};
