import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Bot,
  Send,
  Boxes,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react';

export const AiIntelligenceView: React.FC = () => {
  const { products, transactions, financialSummary, settings, createPurchase, suppliers, locations } = useErp();

  const [activeTab, setActiveTab] = useState<'forecast' | 'cfo' | 'chat'>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname + window.location.hash).toLowerCase();
      if (p.includes('cfo')) return 'cfo';
      if (p.includes('chat')) return 'chat';
      if (p.includes('forecast')) return 'forecast';
    }
    return 'forecast';
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = activeTab === 'forecast' ? '/ai' : `/ai/${activeTab}`;
      if (window.location.pathname !== path || window.location.hash) {
        window.history.replaceState(null, '', path);
      }
    }
  }, [activeTab]);
  const [loading, setLoading] = useState(false);
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [cfoResult, setCfoResult] = useState<any>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your AI ERP Consultant powered by Gemini. Ask me about stock forecasts, profit optimizations, high-margin categories, or vendor pricing strategies.',
    },
  ]);

  // Handle inventory forecast
  const handleRunForecast = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/forecast-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products, salesHistory: transactions }),
      });
      const data = await res.json();
      setForecastResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle CFO Audit
  const handleRunCfoAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/financial-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialSummary, transactions, products }),
      });
      const data = await res.json();
      setCfoResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userText = chatInput;
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          erpContext: {
            totalProducts: products.length,
            netSales: financialSummary.netSales,
            grossProfit: financialSummary.grossProfit,
            stockValuation: financialSummary.stockValuationCost,
            lowStockCount: products.filter((p) => p.currentStock <= p.alertQuantity).length,
          },
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply || 'Analysis completed.' },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Error connecting to Gemini AI assistant. Please verify your connection.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>AI Business Intelligence & Predictive Analytics</span>
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Gemini 2.5 Pro
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine learning inventory forecasting, CFO balance sheet audits, and conversational business consulting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'forecast' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Demand Forecast
          </button>
          <button
            onClick={() => setActiveTab('cfo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'cfo' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800 text-slate-300'
            }`}
          >
            CFO Financial Audit
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'chat' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800 text-slate-300'
            }`}
          >
            ERP Chatbot
          </button>
        </div>
      </div>

      {/* TAB 1: DEMAND FORECASTING */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>AI Stock Depletion Forecasting & Purchase Order Recommendations</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates product sales velocity, lead times, safety stocks, and flags stockout risks.
              </p>
            </div>

            <button
              id="run-ai-forecast-btn"
              disabled={loading}
              onClick={handleRunForecast}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950 flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing Trends...' : 'Run Demand Forecast'}</span>
            </button>
          </div>

          {forecastResult ? (
            <div className="space-y-4">
              {/* Executive Summary */}
              <div className="bg-purple-950/30 border border-purple-800/40 p-4 rounded-2xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-300" />
                  <span>Executive AI Summary</span>
                </h4>
                <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">{forecastResult.summary}</p>
              </div>

              {/* Recommended Reorders Grid */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  Reorder Recommendations Matrix
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {forecastResult.recommendations?.map((rec: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">{rec.productName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Current Stock: {rec.currentStock} • Daily Velocity: {rec.estimatedDailySales}/day
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            rec.urgency === 'critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : rec.urgency === 'high'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          }`}
                        >
                          {rec.urgency}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 bg-slate-900 p-2 rounded-lg">
                        <span className="text-slate-400">AI Reasoning: </span>
                        {rec.reason} (Stockout in ~{rec.daysUntilStockout} days)
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">
                          Recommended Order: {rec.suggestedReorderQuantity} pcs
                        </span>
                        <button
                          onClick={() => {
                            const p = products.find((prod) => prod.id === rec.productId);
                            if (p && suppliers[0]) {
                              createPurchase({
                                supplierId: suppliers[0].id,
                                locationId: (p as any).locationId || locations[0]?.id || 'loc_main',
                                items: [
                                  {
                                    productId: p.id,
                                    productName: p.name,
                                    sku: p.sku,
                                    unit: (p as any).unit || 'pc',
                                    quantity: rec.suggestedReorderQuantity,
                                    unitPrice: p.costPrice || 0,
                                    costPrice: p.costPrice || 0,
                                    taxRate: 0,
                                    tax: 0,
                                    discount: 0,
                                    total: (p.costPrice || 0) * rec.suggestedReorderQuantity,
                                  },
                                ],
                                subtotal: p.costPrice * rec.suggestedReorderQuantity,
                                taxAmount: 0,
                                discountAmount: 0,
                                shippingCharges: 0,
                                totalAmount: p.costPrice * rec.suggestedReorderQuantity,
                                paidAmount: 0,
                                paymentMethod: 'credit',
                                notes: `AI Auto-Replenishment: ${rec.reason}`,
                                status: 'ordered',
                              });
                              alert(`Purchase Order created for ${rec.suggestedReorderQuantity} units of ${p.name}!`);
                            }
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>1-Click PO</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center text-slate-400 space-y-3">
              <Sparkles className="w-10 h-10 text-purple-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">Demand Intelligence Engine Ready</h4>
              <p className="text-xs max-w-md mx-auto text-slate-400">
                Click "Run Demand Forecast" to evaluate stockout risks, safety thresholds, and generate optimized supplier purchase orders.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CFO AUDIT */}
      {activeTab === 'cfo' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Executive CFO Audit & Financial Health Assessment</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates gross margins, working capital liquidity, overhead burn, and pricing optimization.
              </p>
            </div>

            <button
              id="run-cfo-audit-btn"
              disabled={loading}
              onClick={handleRunCfoAudit}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950 flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Auditing Ledger...' : 'Run CFO Financial Audit'}</span>
            </button>
          </div>

          {cfoResult ? (
            <div className="space-y-4">
              {/* Scorecard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold">Overall Financial Health Score</div>
                  <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
                    {cfoResult.overallScore}/100
                  </div>
                  <div className="text-xs text-slate-300 mt-1 capitalize">Status: {cfoResult.healthStatus}</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold">Executive Assessment</div>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">{cfoResult.summary}</p>
                </div>
              </div>

              {/* Strengths & Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Key Operational Strengths</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {cfoResult.strengths?.map((s: string, i: number) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-emerald-400">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Identified Margin & Cost Risks</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {cfoResult.risks?.map((r: string, i: number) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-amber-400">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-indigo-400" />
                  <span>Strategic CFO Recommendations</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {cfoResult.actionableRecommendations?.map((rec: string, i: number) => (
                    <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-200">
                      <div className="font-bold text-indigo-400 text-[10px] mb-1">STRATEGY 0{i + 1}</div>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center text-slate-400 space-y-3">
              <FileCheck className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">CFO Financial Audit Suite Ready</h4>
              <p className="text-xs max-w-md mx-auto text-slate-400">
                Click "Run CFO Financial Audit" to generate an executive health scorecard and profit margin breakdown.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONVERSATIONAL ERP ASSISTANT */}
      {activeTab === 'chat' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-[520px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              <div>
                <h4 className="font-bold text-white text-xs">Gemini ERP Executive Consultant</h4>
                <div className="text-[10px] text-emerald-400">Live Context Connected</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-lg p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-950 text-slate-400 text-xs p-3 rounded-2xl border border-slate-800">
                  Analyzing ERP databases and generating response...
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about reordering, inventory valuation, or profit margins..."
              className="flex-1 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !chatInput.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
