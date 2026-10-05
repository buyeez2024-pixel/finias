import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  SYSTEM_DOCUMENTATION_DATA,
  DocModule,
  DocField,
} from '../../data/systemDocumentationData';
import {
  MANUAL_TESTING_DATA,
  TestingModule,
  TestCaseItem,
} from '../../data/manualTestingData';
import {
  exportDocumentationAsPdf,
  exportDocumentationAsWord,
} from '../../utils/documentationExporter';
import {
  exportTestingSuiteAsPdf,
  exportTestingSuiteAsWord,
} from '../../utils/testingExporter';
import {
  BookOpen,
  Download,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Layers,
  Sparkles,
  ArrowRight,
  Check,
  ShieldAlert,
  Sliders,
  Printer,
  Copy,
  TestTube,
  CheckSquare,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';

// =========================================================================
// HIGH-FIDELITY SCREENSHOT MOCKUP PREVIEW COMPONENT
// =========================================================================
const DocScreenMockupPreview: React.FC<{ sub: any; isLight: boolean }> = ({ sub, isLight }) => {
  const mockup = sub.mockup;
  const urlPath = mockup?.urlPath || `https://pos.royal-erp.internal/#/${sub.id}`;
  const dateBadge = mockup?.dateBadgeText || (sub.whereToEnterDate ? `📅 Date: Fiscal Calendar Filter Active` : `📅 Date: FY 2026-27`);
  const actionText = mockup?.primaryActionText || `+ Add ${sub.title.split(' ')[0]}`;

  return (
    <div className="space-y-4">
      {/* Live Screen UI Frame */}
      <div className={`rounded-2xl border overflow-hidden shadow-xl transition-all ${
        isLight ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-slate-950 text-slate-100 border-slate-800'
      }`}>
        {/* Browser Top Bar & Traffic Lights */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            </div>
            <div className="ml-3 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1.5 select-all">
              <span className="text-slate-500">https://</span>
              <span className="text-sky-400 font-semibold">{urlPath.replace('https://', '')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {mockup?.viewType ? `${mockup.viewType.toUpperCase()} VIEW` : 'SCREEN INTERFACE'}
            </span>
            <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">
              Royal ERP Live UI
            </span>
          </div>
        </div>

        {/* Application Header Toolbar within Screen */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            {/* Simulated Search */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-[11px] flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search records, SKU, customer or invoice...</span>
            </div>

            {/* Simulated Date Picker Badge (Pin #2) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[11px] font-bold shadow-xs">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{dateBadge}</span>
            </div>
          </div>

          {/* Primary Action Button (Pin #1) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
              <span>{actionText}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px] hidden md:flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Filter</span>
            </div>
          </div>
        </div>

        {/* Screen Content Body */}
        <div className="p-4 bg-slate-900/60 min-h-[160px]">
          {/* DASHBOARD VIEW */}
          {mockup?.viewType === 'dashboard' && mockup.statCards && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {mockup.statCards.map((card: any, cIdx: number) => (
                  <div key={cIdx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">{card.title}</div>
                    <div className="text-base font-extrabold text-white">{card.value}</div>
                    <div className={`text-[10px] font-medium ${card.isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {card.change}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="font-semibold text-slate-300">Monthly Sales Revenue vs Inward Inventory Purchases</span>
                </div>
                <span className="text-[10px] text-sky-400 font-mono">Real-Time Telemetry Feed</span>
              </div>
            </div>
          )}

          {/* TABLE VIEW */}
          {mockup?.viewType === 'table' && mockup.mockColumns && (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700/70">
                    {mockup.mockColumns.map((col: string, cIdx: number) => (
                      <th key={cIdx} className="py-2 px-3 font-semibold text-[10px] uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {mockup.mockRows?.map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition">
                      {mockup.mockColumns?.map((col: string, cIdx: number) => {
                        const val = row[col] || '-';
                        const isStatus = col.toLowerCase().includes('status');
                        const isAction = col.toLowerCase().includes('action');
                        const isDate = col.toLowerCase().includes('date') || col.toLowerCase().includes('time');

                        return (
                          <td key={cIdx} className="py-2.5 px-3">
                            {isStatus ? (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                String(val).toLowerCase().includes('active') || String(val).toLowerCase().includes('paid') || String(val).toLowerCase().includes('received') || String(val).toLowerCase().includes('completed')
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : String(val).toLowerCase().includes('due') || String(val).toLowerCase().includes('low') || String(val).toLowerCase().includes('alert')
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-700/40 text-slate-300'
                              }`}>
                                {val}
                              </span>
                            ) : isAction ? (
                              <span className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer">
                                {val}
                              </span>
                            ) : isDate ? (
                              <span className="font-mono text-slate-400 text-[10px] flex items-center gap-1">
                                <span>📅</span> {val}
                              </span>
                            ) : (
                              <span>{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* FORM VIEW */}
          {mockup?.viewType === 'form' && mockup.formSections && (
            <div className="space-y-3">
              {mockup.formSections.map((sec: any, sIdx: number) => (
                <div key={sIdx} className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-2">
                    <span>{sec.title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {sec.fields.map((fld: any, fIdx: number) => (
                      <div
                        key={fIdx}
                        className={`p-2 rounded-lg border transition ${
                          fld.isDate
                            ? 'bg-sky-950/40 border-sky-500/60 ring-1 ring-sky-500/30'
                            : 'bg-slate-900/80 border-slate-700/70'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300 mb-1">
                          <span className={fld.isDate ? 'text-sky-300 font-bold' : ''}>
                            {fld.label}
                          </span>
                          {fld.isDate && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500 text-slate-950 font-black">
                              DATE INPUT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          {fld.placeholder}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-end gap-2 pt-1">
                <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold">Cancel</span>
                <span className="px-4 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold shadow-md">
                  {mockup.primaryActionText || 'Save Record'}
                </span>
              </div>
            </div>
          )}

          {/* SETTINGS / POS / TREE VIEW */}
          {(mockup?.viewType === 'settings' || mockup?.viewType === 'pos' || mockup?.viewType === 'tree' || !mockup) && (
            <div className="space-y-3">
              {mockup?.formSections ? (
                <div className="space-y-3">
                  {mockup.formSections.map((sec: any, sIdx: number) => (
                    <div key={sIdx} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                      <div className="text-xs font-bold text-sky-400">{sec.title}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sec.fields.map((fld: any, fIdx: number) => (
                          <div key={fIdx} className="p-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs">
                            <div className="text-[10px] text-slate-400 font-semibold">{fld.label}</div>
                            <div className="text-[11px] text-slate-200 mt-0.5">{fld.placeholder}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : mockup?.mockColumns ? (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                        {mockup.mockColumns.map((col: string, cIdx: number) => (
                          <th key={cIdx} className="py-2 px-3 font-semibold text-[10px] uppercase">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {mockup.mockRows?.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-800/40">
                          {mockup.mockColumns?.map((col: string, cIdx: number) => (
                            <td key={cIdx} className="py-2 px-3">{row[col] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Visual Hotspot Indicator Bar */}
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Simulated Screen Wireframe • {sub.screenshotPins?.length || 4} Interface Pins Annotated</span>
          </div>
          <span className="text-sky-400 font-semibold">Inspect Pin Guide Below ↓</span>
        </div>
      </div>

      {/* Numbered Screenshot Pin Callout Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {sub.screenshotPins?.map((pin: any) => (
          <div
            key={pin.pinNumber}
            className={`p-3 rounded-xl border relative transition-all hover:scale-[1.01] ${
              isLight
                ? 'bg-white border-slate-200 shadow-xs'
                : 'bg-slate-900 border-slate-800 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-sky-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/50">
                {pin.pinNumber}
              </div>
              <div className="font-bold text-xs text-sky-400 truncate">
                {pin.label}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Location: {pin.fieldOrSection}
            </div>
            <p className={`text-[11px] mt-1.5 leading-snug ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {pin.instruction}
            </p>
            {pin.whereToEnterDate && (
              <div className="text-[10px] text-sky-500 mt-1.5 font-semibold bg-sky-500/10 p-1.5 rounded-lg border border-sky-500/20">
                📅 {pin.whereToEnterDate}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SystemDocumentationView: React.FC = () => {
  const { settings = {} } = useErp() || {};
  const isLight = settings?.themeMode === 'light';

  // Mode Switch: 'manual' (Reference Documentation) vs 'testing' (QA Manual Testing Suite)
  const [viewMode, setViewMode] = useState<'manual' | 'testing'>('manual');

  // Manual State
  const [activeModuleId, setActiveModuleId] = useState<string>(
    SYSTEM_DOCUMENTATION_DATA[0].id
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Testing State
  const [activeTestingModuleId, setActiveTestingModuleId] = useState<string>(
    MANUAL_TESTING_DATA[0].id
  );
  const [testResults, setTestResults] = useState<Record<string, 'pass' | 'fail' | 'pending'>>({});
  const [testFilter, setTestFilter] = useState<'all' | 'pass' | 'fail' | 'pending'>('all');

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Active documentation module
  const currentDocModule = useMemo(() => {
    return (
      SYSTEM_DOCUMENTATION_DATA.find((m) => m.id === activeModuleId) ||
      SYSTEM_DOCUMENTATION_DATA[0]
    );
  }, [activeModuleId]);

  // Active testing module
  const currentTestingModule = useMemo(() => {
    return (
      MANUAL_TESTING_DATA.find((m) => m.id === activeTestingModuleId) ||
      MANUAL_TESTING_DATA[0]
    );
  }, [activeTestingModuleId]);

  // Search filtering for Manual
  const docSearchResults = useMemo(() => {
    if (!searchQuery.trim() || viewMode !== 'manual') return null;
    const q = searchQuery.toLowerCase();

    const matches: {
      moduleId: string;
      moduleTitle: string;
      submenuTitle: string;
      field: DocField;
    }[] = [];

    SYSTEM_DOCUMENTATION_DATA.forEach((mod) => {
      mod.submenus.forEach((sub) => {
        sub.fields.forEach((field) => {
          if (
            field.name.toLowerCase().includes(q) ||
            field.purpose.toLowerCase().includes(q) ||
            field.functionality.toLowerCase().includes(q) ||
            field.validationRules.toLowerCase().includes(q) ||
            sub.title.toLowerCase().includes(q) ||
            mod.title.toLowerCase().includes(q)
          ) {
            matches.push({
              moduleId: mod.id,
              moduleTitle: mod.title,
              submenuTitle: sub.title,
              field,
            });
          }
        });
      });
    });

    return matches;
  }, [searchQuery, viewMode]);

  // Search filtering for Testing
  const testingSearchResults = useMemo(() => {
    if (!searchQuery.trim() || viewMode !== 'testing') return null;
    const q = searchQuery.toLowerCase();

    const matches: {
      moduleTitle: string;
      testCase: TestCaseItem;
    }[] = [];

    MANUAL_TESTING_DATA.forEach((mod) => {
      mod.testCases.forEach((tc) => {
        if (
          tc.id.toLowerCase().includes(q) ||
          tc.title.toLowerCase().includes(q) ||
          tc.feature.toLowerCase().includes(q) ||
          tc.whatToCheck.toLowerCase().includes(q) ||
          tc.targetMenu.toLowerCase().includes(q) ||
          tc.positiveTesting.expectedResult.toLowerCase().includes(q) ||
          tc.negativeTesting.some((n) =>
            n.scenario.toLowerCase().includes(q) ||
            n.expectedErrorOrBehavior.toLowerCase().includes(q)
          )
        ) {
          matches.push({
            moduleTitle: mod.title,
            testCase: tc,
          });
        }
      });
    });

    return matches;
  }, [searchQuery, viewMode]);

  const handleCopyField = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(text);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleTestResult = (tcId: string, status: 'pass' | 'fail' | 'pending') => {
    setTestResults((prev) => ({
      ...prev,
      [tcId]: prev[tcId] === status ? 'pending' : status,
    }));
  };

  const handleDownloadPdf = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      try {
        if (viewMode === 'manual') {
          exportDocumentationAsPdf();
        } else {
          exportTestingSuiteAsPdf();
        }
      } catch (err) {
        console.error('Failed to export PDF', err);
      } finally {
        setIsExportingPdf(false);
      }
    }, 150);
  };

  const handleDownloadWord = () => {
    setIsExportingWord(true);
    setTimeout(() => {
      try {
        if (viewMode === 'manual') {
          exportDocumentationAsWord();
        } else {
          exportTestingSuiteAsWord();
        }
      } catch (err) {
        console.error('Failed to export Word doc', err);
      } finally {
        setIsExportingWord(false);
      }
    }, 100);
  };

  // Test Case summary stats
  const totalTestCases = useMemo(() => {
    return MANUAL_TESTING_DATA.reduce((acc, m) => acc + m.testCases.length, 0);
  }, []);

  const passedCount = useMemo(() => {
    return Object.values(testResults).filter((v) => v === 'pass').length;
  }, [testResults]);

  const failedCount = useMemo(() => {
    return Object.values(testResults).filter((v) => v === 'fail').length;
  }, [testResults]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn">
      {/* Top Banner & Header */}
      <div
        className={`p-6 rounded-3xl border shadow-lg backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
            : 'bg-slate-900/90 border-slate-800 text-white shadow-black/40'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3.5 rounded-2xl border shrink-0 ${
              viewMode === 'manual'
                ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {viewMode === 'manual' ? (
              <BookOpen className="w-7 h-7" />
            ) : (
              <TestTube className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  viewMode === 'manual'
                    ? 'bg-sky-500/15 text-sky-500 border-sky-500/30'
                    : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                }`}
              >
                {viewMode === 'manual' ? 'Official User Manual' : 'QA Manual Testing Suite'}
              </span>
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                v2026.4 Complete Enterprise Verification
              </span>
            </div>
            <h1 className="text-2xl font-black mt-1 tracking-tight flex items-center gap-2">
              <span>
                {viewMode === 'manual'
                  ? 'System Documentation & Workflow Manual'
                  : 'Manual Testing Master Guide (Positive & Negative Cases)'}
              </span>
            </h1>
            <p className={`text-xs mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {viewMode === 'manual'
                ? 'Detailed pin-to-pin specifications of every screen, menu, field purpose, functionality, and operational workflow.'
                : 'Step-by-step test execution guide covering valid positive paths, boundary conditions, edge cases, error alerts, and pass/fail criteria.'}
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer ${
              isLight
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? 'Generating PDF...' : `Download ${viewMode === 'manual' ? 'Manual' : 'Testing'} PDF`}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadWord}
            disabled={isExportingWord}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer ${
              isLight
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isExportingWord ? 'Exporting...' : `Download ${viewMode === 'manual' ? 'Manual' : 'Testing'} Word (.doc)`}</span>
          </button>
        </div>
      </div>

      {/* Dual Mode Switcher Bar */}
      <div
        className={`p-2 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setViewMode('manual');
              setSearchQuery('');
            }}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'manual'
                ? isLight
                  ? 'bg-white text-sky-900 shadow-sm border border-slate-200'
                  : 'bg-sky-600 text-white shadow-md'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>System Reference Manual</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('testing');
              setSearchQuery('');
            }}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'testing'
                ? isLight
                  ? 'bg-white text-emerald-900 shadow-sm border border-slate-200'
                  : 'bg-emerald-600 text-white shadow-md'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TestTube className="w-4 h-4" />
            <span>QA Manual Testing Suite (Positive & Negative)</span>
          </button>
        </div>

        {/* Testing Progress Bar (if in testing mode) */}
        {viewMode === 'testing' && (
          <div className="flex items-center gap-4 text-xs font-semibold px-3">
            <span className="text-slate-400">
              Total Cases: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{totalTestCases}</strong>
            </span>
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {passedCount} Passed
            </span>
            <span className="text-rose-500 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {failedCount} Failed
            </span>
          </div>
        )}
      </div>

      {/* Global Search Bar */}
      <div
        className={`p-4 rounded-2xl border flex items-center gap-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder={
            viewMode === 'manual'
              ? 'Search by field name, workflow keyword, menu title, validation rule...'
              : 'Search test case ID (e.g. TC-PRD-001), feature, negative scenario, expected error...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full text-xs font-medium bg-transparent focus:outline-none ${
            isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
          }`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: SYSTEM REFERENCE MANUAL VIEW                                      */}
      {/* ========================================================================= */}
      {viewMode === 'manual' && (
        <>
          {docSearchResults ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Search Matches ({docSearchResults.length} fields found)
                </h3>
                <span className="text-xs text-slate-400">Showing matches across all modules</span>
              </div>

              {docSearchResults.length === 0 ? (
                <div
                  className={`p-12 text-center rounded-2xl border ${
                    isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-400 opacity-60" />
                  <p className="text-sm font-semibold">No fields matched your query "{searchQuery}"</p>
                  <p className="text-xs mt-1">Try searching for broader terms like "Price", "GST", "Phone", or "Barcode".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docSearchResults.map((res, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border space-y-2.5 transition hover:shadow-md ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-sky-500">{res.field.name}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              res.field.required
                                ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                                : 'bg-slate-500/15 text-slate-400'
                            }`}
                          >
                            {res.field.required ? 'Mandatory' : 'Optional'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{res.field.type}</span>
                      </div>

                      <p className={`text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        <strong>Purpose:</strong> {res.field.purpose}
                      </p>

                      <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        <strong>Functionality:</strong> {res.field.functionality}
                      </p>

                      <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {res.moduleTitle} &gt; {res.submenuTitle}
                        </span>
                        <span className="font-mono text-amber-400/90 text-[10px]">
                          Rule: {res.field.validationRules}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Module Selector Sidebar */}
              <div className="lg:col-span-4 space-y-2">
                <h3 className={`text-xs font-bold uppercase tracking-wider px-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  System Navigation Modules
                </h3>
                <div className="space-y-1.5">
                  {SYSTEM_DOCUMENTATION_DATA.map((mod, idx) => {
                    const isSelected = mod.id === activeModuleId;
                    const totalFields = mod.submenus.reduce(
                      (acc, s) => acc + (s.fields?.length || 0),
                      0
                    );

                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => setActiveModuleId(mod.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'bg-sky-50 border-sky-300 text-sky-950 shadow-sm'
                              : 'bg-sky-950/40 border-sky-600 text-white shadow-md'
                            : isLight
                            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                            : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-sky-500">
                            {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold leading-tight">{mod.title}</div>
                            <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {mod.category}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isSelected
                                ? 'bg-sky-500 text-white'
                                : isLight
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {totalFields} Fields
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Module Deep-Dive Content */}
              <div className="lg:col-span-8 space-y-6">
                <div
                  className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="border-b pb-3 flex items-center justify-between border-slate-800/40">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-500">
                        {currentDocModule.category}
                      </span>
                      <h2 className={`text-xl font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {currentDocModule.title}
                      </h2>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {currentDocModule.overview}
                  </p>

                  {/* Operational Workflow Steps */}
                  {currentDocModule.workflowSteps && currentDocModule.workflowSteps.length > 0 && (
                    <div className="pt-2 space-y-3">
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        Operational Workflow Diagram & Steps
                      </h4>
                      <div className="space-y-2">
                        {currentDocModule.workflowSteps.map((ws) => (
                          <div
                            key={ws.step}
                            className={`p-3 rounded-xl border flex items-start gap-3 ${
                              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                            }`}
                          >
                            <div className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {ws.step}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {ws.title}
                              </h5>
                              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                {ws.description}
                              </p>
                              {ws.tips && (
                                <p className="text-[10px] text-sky-400 mt-1 italic">
                                  💡 Pro Tip: {ws.tips}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submenus & Field Tables */}
                <div className="space-y-8">
                  {currentDocModule.submenus.map((sub) => (
                    <div
                      key={sub.id}
                      className={`p-6 rounded-3xl border shadow-sm space-y-5 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      {/* Submenu Header */}
                      <div className="border-b pb-3 border-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {sub.title}
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20">
                              {sub.menuPath}
                            </span>
                          </div>
                          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {sub.description}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-sky-500 shrink-0">
                          {sub.fields.length} Fields Defined
                        </span>
                      </div>

                      {/* Why It Is Used */}
                      <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                      }`}>
                        <strong className="text-sky-500 uppercase tracking-wider text-[10px]">Why It Is Used:</strong>
                        <p className={`leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          {sub.whyItIsUsed}
                        </p>
                      </div>

                      {/* How to Use (Step-by-Step) */}
                      {sub.howToUse && sub.howToUse.length > 0 && (
                        <div className="space-y-1.5 text-xs">
                          <strong className="text-sky-500 uppercase tracking-wider text-[10px]">How to Use (Step-by-Step Operating Guide):</strong>
                          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-slate-400">
                            {sub.howToUse.map((step, sIdx) => (
                              <li key={sIdx} className="leading-relaxed">
                                <span className={isLight ? 'text-slate-800 font-medium' : 'text-slate-200 font-medium'}>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Where to Enter the Date (Highlight Card) */}
                      {sub.whereToEnterDate && (
                        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                          isLight
                            ? 'bg-sky-50/70 border-sky-200 text-sky-950'
                            : 'bg-sky-950/20 border-sky-800/40 text-sky-200'
                        }`}>
                          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 shrink-0 mt-0.5">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <strong className="text-sky-500 uppercase tracking-wider text-[10px] block">
                              📅 Where to Enter the Date & Calendar Rules:
                            </strong>
                            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-sky-900 font-medium' : 'text-sky-200 font-medium'}`}>
                              {sub.whereToEnterDate}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Interactive Visual Screenshot Mockup with Numbered Pins */}
                      {sub.screenshotPins && sub.screenshotPins.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <strong className="text-sky-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Screen Interface Visual Screenshot & Callout Pins:</span>
                            </strong>
                            <span className="text-[10px] text-slate-400">Interactive UI Preview</span>
                          </div>

                          {/* High-Fidelity UI Screenshot & Numbered Pin Grid */}
                          <DocScreenMockupPreview sub={sub} isLight={isLight} />
                        </div>
                      )}

                      {/* Field Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr
                              className={`border-b ${
                                isLight
                                  ? 'bg-slate-50 text-slate-700 border-slate-200'
                                  : 'bg-slate-950 text-slate-300 border-slate-800'
                              }`}
                            >
                              <th className="py-2.5 px-3 font-bold">Field Name</th>
                              <th className="py-2.5 px-3 font-bold">Type</th>
                              <th className="py-2.5 px-3 font-bold">Status</th>
                              <th className="py-2.5 px-3 font-bold">Purpose & Functionality</th>
                              <th className="py-2.5 px-3 font-bold">Validation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/30">
                            {sub.fields.map((f, fIdx) => (
                              <tr
                                key={fIdx}
                                className={`hover:bg-sky-500/5 transition ${
                                  isLight ? 'text-slate-800' : 'text-slate-200'
                                }`}
                              >
                                <td className="py-3 px-3 align-top font-bold text-sky-500 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span>{f.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyField(f.name)}
                                      title="Copy Field Name"
                                      className="text-slate-400 hover:text-slate-200"
                                    >
                                      {copiedField === f.name ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3 h-3 opacity-60" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-3 align-top font-mono text-[10px] text-slate-400 whitespace-nowrap">
                                  {f.type}
                                </td>
                                <td className="py-3 px-3 align-top whitespace-nowrap">
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                      f.required
                                        ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                                        : 'bg-slate-500/15 text-slate-400'
                                    }`}
                                  >
                                    {f.required ? 'Mandatory' : 'Optional'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 align-top">
                                  <p className="text-[11px] leading-relaxed">
                                    <strong className="text-slate-400">Purpose:</strong> {f.purpose}
                                  </p>
                                  <p className={`text-[11px] mt-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                    <strong className="text-slate-400">Functionality:</strong> {f.functionality}
                                  </p>
                                </td>
                                <td className="py-3 px-3 align-top font-mono text-[10px] text-amber-500/90">
                                  {f.validationRules}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: QA MANUAL TESTING SUITE VIEW                                      */}
      {/* ========================================================================= */}
      {viewMode === 'testing' && (
        <>
          {testingSearchResults ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Test Scenario Matches ({testingSearchResults.length} found)
                </h3>
              </div>

              {testingSearchResults.length === 0 ? (
                <div
                  className={`p-12 text-center rounded-2xl border ${
                    isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-400 opacity-60" />
                  <p className="text-sm font-semibold">No test scenarios matched "{searchQuery}"</p>
                  <p className="text-xs mt-1">Search by Test ID (e.g. TC-PRD-001) or feature keyword (e.g. HSN, Float, Brute-Force).</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {testingSearchResults.map((res, idx) => (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border space-y-3 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {res.testCase.id}
                          </span>
                          <span className="text-xs font-bold">{res.testCase.title}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {res.moduleTitle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        <strong>What to Check:</strong> {res.testCase.whatToCheck}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Testing Module Selector Sidebar */}
              <div className="lg:col-span-4 space-y-2">
                <h3 className={`text-xs font-bold uppercase tracking-wider px-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  QA Testing Suites
                </h3>
                <div className="space-y-1.5">
                  {MANUAL_TESTING_DATA.map((mod, idx) => {
                    const isSelected = mod.id === activeTestingModuleId;

                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => setActiveTestingModuleId(mod.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? isLight
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm'
                              : 'bg-emerald-950/40 border-emerald-600 text-white shadow-md'
                            : isLight
                            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                            : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold leading-tight">{mod.title}</div>
                          <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {mod.testCases.length} Test Scenarios
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Test Case Execution Details */}
              <div className="lg:col-span-8 space-y-6">
                <div
                  className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">
                      QA Test Plan Scope
                    </span>
                    <h2 className={`text-xl font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {currentTestingModule.title}
                    </h2>
                  </div>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {currentTestingModule.overview}
                  </p>
                </div>

                {/* Individual Test Cases */}
                <div className="space-y-6">
                  {currentTestingModule.testCases.map((tc) => {
                    const testStatus = testResults[tc.id] || 'pending';

                    return (
                      <div
                        key={tc.id}
                        className={`p-6 rounded-3xl border shadow-sm space-y-4 transition ${
                          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        {/* Header Box */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-800/40">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {tc.id}
                              </span>
                              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {tc.title}
                              </h3>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              <strong>Target Menu:</strong> {tc.targetMenu} | <strong>Feature:</strong> {tc.feature}
                            </p>
                          </div>

                          {/* Interactive Pass/Fail Toggle Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleTestResult(tc.id, 'pass')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                testStatus === 'pass'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : isLight
                                  ? 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                  : 'bg-slate-800 text-slate-400 hover:bg-emerald-950/40 hover:text-emerald-400'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Pass</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleTestResult(tc.id, 'fail')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                testStatus === 'fail'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : isLight
                                  ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                                  : 'bg-slate-800 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Fail</span>
                            </button>
                          </div>
                        </div>

                        {/* What to check & How to check */}
                        <div className="space-y-2">
                          <div className="text-xs">
                            <strong className="text-sky-500 uppercase tracking-wide text-[10px]">What to Check:</strong>
                            <p className={`mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                              {tc.whatToCheck}
                            </p>
                          </div>

                          <div className="text-xs">
                            <strong className="text-sky-500 uppercase tracking-wide text-[10px]">How to Perform Verification:</strong>
                            <ol className="list-decimal list-inside space-y-1 mt-1 text-[11px] text-slate-400">
                              {tc.howToCheck.map((step, sIdx) => (
                                <li key={sIdx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        </div>

                        {/* Positive Testing Section */}
                        <div
                          className={`p-4 rounded-2xl border space-y-2 ${
                            isLight
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-500">
                              Positive Testing (Valid Path)
                            </span>
                          </div>

                          <div className="text-xs space-y-1">
                            <p>
                              <strong>Input Data:</strong> <code>{tc.positiveTesting.inputData}</code>
                            </p>
                            <p>
                              <strong>Steps:</strong> {tc.positiveTesting.steps.join(' → ')}
                            </p>
                            <p className="font-semibold text-emerald-400">
                              <strong>Expected Result:</strong> {tc.positiveTesting.expectedResult}
                            </p>
                          </div>
                        </div>

                        {/* Negative Testing Section */}
                        {tc.negativeTesting && tc.negativeTesting.length > 0 && (
                          <div
                            className={`p-4 rounded-2xl border space-y-3 ${
                              isLight
                                ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                                : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                              <span className="text-xs font-black uppercase tracking-wider text-rose-500">
                                Negative Testing (Edge Cases & Fault Injections)
                              </span>
                            </div>

                            <div className="space-y-3">
                              {tc.negativeTesting.map((neg, nIdx) => (
                                <div
                                  key={nIdx}
                                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                                    isLight
                                      ? 'bg-white border-rose-200 text-slate-800'
                                      : 'bg-slate-950 border-rose-900/60 text-slate-300'
                                  }`}
                                >
                                  <div className="font-bold text-rose-500 flex items-center gap-1.5">
                                    <span>Scenario {nIdx + 1}: {neg.scenario}</span>
                                  </div>
                                  <p className="text-[11px]">
                                    <strong>Fault Input:</strong> <code>{neg.inputData}</code>
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    <strong>Steps:</strong> {neg.steps.join(' → ')}
                                  </p>
                                  <p className="text-[11px] font-semibold text-rose-400">
                                    <strong>Expected Error Handling / Rejection:</strong> {neg.expectedErrorOrBehavior}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pass Criteria Note */}
                        <div className="text-[11px] font-semibold text-slate-400 border-t pt-2 border-slate-800/30 flex items-center justify-between">
                          <span>
                            <strong>Final Pass/Fail Criteria:</strong> {tc.passCriteria}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
