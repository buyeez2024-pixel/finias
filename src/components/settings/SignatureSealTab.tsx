import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  PenTool,
  Stamp,
  Upload,
  Trash2,
  Building2,
  User,
  CheckCircle2,
  Image as ImageIcon,
  ShieldCheck,
  Award,
  CircleDot,
  UserCheck
} from 'lucide-react';

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

export const SignatureSealTab: React.FC = () => {
  const { settings, updateSettings, currentUser, showFlashNotification } = useErp();

  const [config, setConfig] = useState(() => ({
    adminName: settings.signatureSealConfig?.adminName || currentUser?.name || 'Admin Executive',
    signatureUrl: settings.signatureSealConfig?.signatureUrl || '',
    signatureLabel: settings.signatureSealConfig?.signatureLabel || 'Authorized Signatory',
    signatureStyle: settings.signatureSealConfig?.signatureStyle || 'style1',
    companySealUrl: settings.signatureSealConfig?.companySealUrl || '',
    sealCompanyName: settings.signatureSealConfig?.sealCompanyName || settings.businessName || settings.name || 'Royal POSfini',
    sealAddress: settings.signatureSealConfig?.sealAddress || settings.address || 'Central Headquarters, 123 Business Rd',
    sealGstin: settings.signatureSealConfig?.sealGstin || '27AABCR1234F1Z5',
    showCompanySeal: settings.signatureSealConfig?.showCompanySeal ?? true,
    showSignature: settings.signatureSealConfig?.showSignature ?? true,
    showRoundSeal: settings.signatureSealConfig?.showRoundSeal ?? true,
    roundSealText: settings.signatureSealConfig?.roundSealText || 'OFFICIAL ROUND SEAL - VERIFIED',
    roundSealUrl: settings.signatureSealConfig?.roundSealUrl || '',
    showProprietorSeal: settings.signatureSealConfig?.showProprietorSeal ?? true,
    proprietorName: settings.signatureSealConfig?.proprietorName || 'Arthur Pendelton',
    proprietorDesignation: settings.signatureSealConfig?.proprietorDesignation || 'Proprietor & Managing Director',
    proprietorSignatureUrl: settings.signatureSealConfig?.proprietorSignatureUrl || '',
    proprietorSignatureStyle: settings.signatureSealConfig?.proprietorSignatureStyle || 'style1',
  }));

  const handleSave = () => {
    updateSettings({
      signatureSealConfig: config,
    });
    showFlashNotification('Signature, Round Seal & Proprietor Seal configuration saved successfully!', 'success');
  };

  const handleFileUpload = (
    field: 'signatureUrl' | 'companySealUrl' | 'roundSealUrl' | 'proprietorSignatureUrl',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig((prev) => ({
          ...prev,
          [field]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <Stamp className="w-3.5 h-3.5" />
            Signoff, Round Seal & Proprietor Stamp Module
          </span>
          <h2 className="text-xl font-black text-white">Signature, Round Seal & Proprietor Seal Management</h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Configure authorized admin signatures, invoice round seals, company address seals, and proprietor stamps for official business invoices and quotations.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Admin Signature Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Authorized Admin Signature</h3>
                  <p className="text-xs text-slate-400">Manage administrator signatory name and signature upload</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showSignature}
                  onChange={(e) => setConfig({ ...config, showSignature: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    Admin / Signatory Name
                  </span>
                  {config.signatureUrl && <span className="text-[10px] text-amber-400 font-mono">Locked (Image Active)</span>}
                </label>
                <input
                  type="text"
                  disabled={Boolean(config.signatureUrl)}
                  value={config.adminName}
                  onChange={(e) => setConfig({ ...config, adminName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Signature Designation Label</label>
                <input
                  type="text"
                  disabled={Boolean(config.signatureUrl)}
                  value={config.signatureLabel}
                  onChange={(e) => setConfig({ ...config, signatureLabel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-900"
                />
              </div>
            </div>

            {/* Real Look Signature Styles Selector */}
            {!config.signatureUrl && (
              <div className="space-y-2 pt-3">
                <label className="block text-xs font-semibold text-slate-300">Choose Real-Look Signature Font Style ({5} options)</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: 'style1', name: 'Cursive Flow', className: 'font-signature text-xl text-indigo-200' },
                    { id: 'style2', name: 'Modern Sweep', className: 'font-[Dancing_Script] text-xl text-indigo-200 font-bold' },
                    { id: 'style3', name: 'Casual Script', className: 'font-[Caveat] text-xl text-indigo-200 font-semibold' },
                    { id: 'style4', name: 'Executive Slant', className: 'font-serif italic text-xl text-indigo-200 font-black tracking-tight transform -skew-x-6' },
                    { id: 'style5', name: 'Corporate Registrar', className: 'font-mono italic text-xs text-indigo-200 font-bold tracking-widest uppercase' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setConfig({ ...config, signatureStyle: style.id })}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        (config.signatureStyle || 'style1') === style.id
                          ? 'bg-indigo-950/80 border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`h-8 flex items-center justify-center overflow-hidden px-1 ${style.className}`}>
                        {config.adminName || 'Admin'}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Signature Upload */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-300">Upload Admin Signature Image (PNG)</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => document.getElementById('signature-file-upload')?.click()}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-700 hover:border-indigo-500 text-indigo-400 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{config.signatureUrl ? 'Change Signature' : 'Upload Signature'}</span>
                </button>

                {config.signatureUrl && (
                  <>
                    <div className="h-12 px-4 bg-white/90 rounded-xl border border-slate-700 flex items-center justify-center">
                      <img src={config.signatureUrl} alt="Signature" className="h-9 max-w-[150px] object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, signatureUrl: '' })}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}

                <input
                  id="signature-file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload('signatureUrl', e)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Proprietor Seal & Signature Feature */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Proprietor Seal & Signoff</h3>
                  <p className="text-xs text-slate-400">Manage Proprietor / Managing Director credentials and signature stamp</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showProprietorSeal}
                  onChange={(e) => setConfig({ ...config, showProprietorSeal: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Proprietor / Director Name</span>
                  {config.proprietorSignatureUrl && <span className="text-[10px] text-amber-400 font-mono">Locked (Image Active)</span>}
                </label>
                <input
                  type="text"
                  disabled={Boolean(config.proprietorSignatureUrl)}
                  value={config.proprietorName}
                  onChange={(e) => setConfig({ ...config, proprietorName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Proprietor Title / Designation</label>
                <input
                  type="text"
                  disabled={Boolean(config.proprietorSignatureUrl)}
                  value={config.proprietorDesignation}
                  onChange={(e) => setConfig({ ...config, proprietorDesignation: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-900"
                />
              </div>
            </div>

            {/* Proprietor Real Look Signature Styles Selector */}
            {!config.proprietorSignatureUrl && (
              <div className="space-y-2 pt-3">
                <label className="block text-xs font-semibold text-slate-300">Choose Real-Look Signature Font Style ({5} options)</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: 'style1', name: 'Cursive Flow', className: 'font-signature text-xl text-amber-200' },
                    { id: 'style2', name: 'Modern Sweep', className: 'font-[Dancing_Script] text-xl text-amber-200 font-bold' },
                    { id: 'style3', name: 'Casual Script', className: 'font-[Caveat] text-xl text-amber-200 font-semibold' },
                    { id: 'style4', name: 'Executive Slant', className: 'font-serif italic text-xl text-amber-200 font-black tracking-tight transform -skew-x-6' },
                    { id: 'style5', name: 'Corporate Registrar', className: 'font-mono italic text-xs text-amber-200 font-bold tracking-widest uppercase' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setConfig({ ...config, proprietorSignatureStyle: style.id })}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        (config.proprietorSignatureStyle || 'style1') === style.id
                          ? 'bg-amber-950/80 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`h-8 flex items-center justify-center overflow-hidden px-1 ${style.className}`}>
                        {config.proprietorName || 'Proprietor'}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Proprietor Signature Upload */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-300">Upload Proprietor Signature Image (PNG)</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => document.getElementById('proprietor-file-upload')?.click()}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-700 hover:border-amber-500 text-amber-400 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{config.proprietorSignatureUrl ? 'Change Signature' : 'Upload Proprietor Signature'}</span>
                </button>

                {config.proprietorSignatureUrl && (
                  <>
                    <div className="h-12 px-4 bg-white/90 rounded-xl border border-slate-700 flex items-center justify-center">
                      <img src={config.proprietorSignatureUrl} alt="Proprietor Sig" className="h-9 max-w-[150px] object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, proprietorSignatureUrl: '' })}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}

                <input
                  id="proprietor-file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload('proprietorSignatureUrl', e)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Invoice Round Seal Feature */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                  <CircleDot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Invoice Round Seal (Official Circular Stamp)</h3>
                  <p className="text-xs text-slate-400">Configure circular round seal stamp for invoice authenticity verification</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showRoundSeal}
                  onChange={(e) => setConfig({ ...config, showRoundSeal: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Round Seal Inscription / Slogan</span>
                  {config.roundSealUrl && <span className="text-[10px] text-cyan-400 font-mono">Locked (Image Active)</span>}
                </label>
                <input
                  type="text"
                  disabled={Boolean(config.roundSealUrl)}
                  value={config.roundSealText}
                  onChange={(e) => setConfig({ ...config, roundSealText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-900"
                />
              </div>

              {/* Round Seal Stamp Upload */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-300">Upload Custom Round Seal Image (PNG / Circular Badge)</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => document.getElementById('round-seal-file-upload')?.click()}
                    className="px-4 py-2.5 bg-slate-950 border border-slate-700 hover:border-cyan-500 text-cyan-400 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{config.roundSealUrl ? 'Change Round Seal Image' : 'Upload Round Seal Stamp'}</span>
                  </button>

                  {config.roundSealUrl && (
                    <>
                      <div className="h-12 w-12 rounded-full bg-white/90 border border-slate-700 flex items-center justify-center p-1 shadow">
                        <img src={config.roundSealUrl} alt="Round Seal" className="w-full h-full object-contain rounded-full" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, roundSealUrl: '' })}
                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <input
                    id="round-seal-file-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload('roundSealUrl', e)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Company Address Seal Feature */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Company Address Seal & Stamp</h3>
                  <p className="text-xs text-slate-400">Manage official company address seal stamp and branch details</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showCompanySeal}
                  onChange={(e) => setConfig({ ...config, showCompanySeal: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Company Seal / Entity Name</span>
                  {config.companySealUrl && <span className="text-[10px] text-purple-400 font-mono">Locked (Image Active)</span>}
                </label>
                <input
                  type="text"
                  disabled={Boolean(config.companySealUrl)}
                  value={config.sealCompanyName}
                  onChange={(e) => setConfig({ ...config, sealCompanyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Tax ID / GSTIN / Reg No.</label>
                <input
                  type="text"
                  disabled={Boolean(config.companySealUrl)}
                  value={config.sealGstin}
                  onChange={(e) => setConfig({ ...config, sealGstin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500 uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1.5">Seal Registered Address</label>
                <textarea
                  rows={2}
                  disabled={Boolean(config.companySealUrl)}
                  value={config.sealAddress}
                  onChange={(e) => setConfig({ ...config, sealAddress: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-900"
                />
              </div>
            </div>

            {/* Company Seal Stamp Upload */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-300">Upload Company Seal Stamp Badge (Optional)</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => document.getElementById('seal-file-upload')?.click()}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-700 hover:border-purple-500 text-purple-400 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{config.companySealUrl ? 'Change Seal Stamp' : 'Upload Seal Stamp'}</span>
                </button>

                {config.companySealUrl && (
                  <>
                    <div className="h-12 w-12 rounded-full bg-white/90 border border-slate-700 flex items-center justify-center p-1 shadow">
                      <img src={config.companySealUrl} alt="Seal" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, companySealUrl: '' })}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}

                <input
                  id="seal-file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload('companySealUrl', e)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Document Signoff Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 sticky top-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Live Document Signoff & Seals Preview</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">Seals & Stamps</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-300 text-slate-900 space-y-5 shadow-md relative overflow-hidden">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Invoice Signoff Box Sample</div>

              {/* Row 1: Address Seal & Round Seal */}
              <div className="flex items-center justify-between gap-2">
                {config.showCompanySeal && (
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-indigo-600/60 p-1 flex flex-col items-center justify-center text-center bg-indigo-50/50 rotate-[-5deg] shadow-xs">
                    {config.companySealUrl ? (
                      <img src={config.companySealUrl} alt="Seal" className="w-full h-full object-contain rounded-full" />
                    ) : (
                      <>
                        <span className="text-[7px] font-black uppercase text-indigo-800 leading-tight">{config.sealCompanyName}</span>
                        <div className="w-12 h-[1px] bg-indigo-400 my-0.5"></div>
                        <span className="text-[5px] text-slate-600 leading-none">{config.sealAddress.slice(0, 25)}...</span>
                        <span className="text-[5px] font-mono font-bold text-indigo-700 mt-0.5">GSTIN: {config.sealGstin}</span>
                      </>
                    )}
                  </div>
                )}

                {config.showRoundSeal && (
                  <div className="w-24 h-24 rounded-full border-4 border-double border-cyan-700 p-1.5 flex flex-col items-center justify-center text-center bg-cyan-50/40 rotate-[6deg] shadow-xs">
                    {config.roundSealUrl ? (
                      <img src={config.roundSealUrl} alt="Round Seal" className="w-full h-full object-contain rounded-full" />
                    ) : (
                      <>
                        <span className="text-[6px] font-black uppercase text-cyan-900 tracking-tighter leading-tight">★ {config.sealCompanyName} ★</span>
                        <span className="text-[5px] font-mono uppercase text-cyan-700 my-0.5">{config.roundSealText}</span>
                        <span className="text-[5px] text-slate-500 font-bold">2026 AUDITED</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Row 2: Proprietor Seal & Admin Signature */}
              <div className="flex items-end justify-between gap-2 pt-2 border-t border-slate-200">
                {config.showProprietorSeal && (
                  <div className="text-center w-36 space-y-0.5">
                    <div className="h-10 flex items-center justify-center">
                      {config.proprietorSignatureUrl ? (
                        <img src={config.proprietorSignatureUrl} alt="Proprietor Sig" className="max-h-8 max-w-[100px] object-contain" />
                      ) : (
                        <span className={`${getProprietorSignatureClass(config.proprietorSignatureStyle)} select-none`}>{config.proprietorName}</span>
                      )}
                    </div>
                    <div className="border-t border-slate-400 pt-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-800 block">{config.proprietorName}</span>
                      <span className="text-[8px] font-bold text-amber-700 block">{config.proprietorDesignation}</span>
                    </div>
                  </div>
                )}

                {config.showSignature && (
                  <div className="text-center w-36 space-y-0.5">
                    <div className="h-10 flex items-center justify-center">
                      {config.signatureUrl ? (
                        <img src={config.signatureUrl} alt="Signature" className="max-h-8 max-w-[100px] object-contain" />
                      ) : (
                        <span className={`${getSignatureClass(config.signatureStyle)} select-none`}>{config.adminName}</span>
                      )}
                    </div>
                    <div className="border-t border-slate-400 pt-0.5">
                      <span className="text-[9px] font-black uppercase text-slate-800 block">{config.signatureLabel}</span>
                      <span className="text-[8px] font-bold text-indigo-700 block">{config.adminName}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi-Seal & Signoff Integration</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Company Address Seal, Invoice Round Seal, Proprietor Stamp, and Admin Signature appear on printed tax invoices and bills.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
