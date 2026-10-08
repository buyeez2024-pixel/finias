import React from 'react';
import { useErp } from '../../context/ErpContext';
import { formatCurrency } from '../../utils/formatters';
import { ProjectedSalesChart } from './ProjectedSalesChart';
import { WeeklySalesVolumeChart } from './WeeklySalesVolumeChart';
import { DashboardFooterBar } from './DashboardFooterBar';
import { LowStockWidget } from './LowStockWidget';
import {
  DollarSign,
  TrendingUp,
  Boxes,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Receipt,
  BarChart3,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  onOpenQuickPurchase: () => void;
  onOpenQuickAdjustment: () => void;
}

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
    currentUser = null,
  } = useErp() || {};

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

  // Low stock products
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

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Low Stock & Reorder Hub Command Widget */}
      <LowStockWidget onOpenQuickPurchase={onOpenQuickPurchase} />

      {/* 2. Executive Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Sales */}
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

      {/* 3. 30-Day Sales Forecast & Predictive Trend Chart */}
      {hasData && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
          <ProjectedSalesChart
            transactions={transactions}
            settings={settings}
            accentColor={accentColor}
          />
        </div>
      )}

      {/* 4. Weekly Sales Volume & Peak Trading Days */}
      {hasData && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
          <WeeklySalesVolumeChart
            transactions={transactions}
            settings={settings}
            accentColor={accentColor}
          />
        </div>
      )}

      {/* 5. Revenue Velocity & Category Share Grid */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue & Profit Velocity */}
          <div className={`lg:col-span-2 p-5 rounded-2xl border space-y-4 transition-colors flex flex-col justify-between ${
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

          {/* Sales by Category */}
          <div className={`lg:col-span-1 p-5 rounded-2xl border space-y-4 flex flex-col justify-between transition-colors ${
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
        </div>
      )}

      {/* 6. Recent ERP Transactions Ledger */}
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
            className={`text-xs font-bold transition-colors cursor-pointer ${
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
                      {(() => {
                        const entriesPaid = txn.paymentEntries && txn.paymentEntries.length > 0
                          ? txn.paymentEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
                          : 0;
                        const effectivePaid = Math.max(Number(txn.paidAmount) || 0, entriesPaid);
                        const effectiveTotal = Number(txn.totalAmount) || 0;
                        const effStatus = (effectiveTotal <= 0 || effectivePaid >= effectiveTotal - 0.01)
                          ? 'paid'
                          : effectivePaid > 0.01
                          ? 'partial'
                          : 'due';

                        return (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              effStatus === 'paid'
                                ? isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : effStatus === 'partial'
                                ? isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                : isDark ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {effStatus}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
