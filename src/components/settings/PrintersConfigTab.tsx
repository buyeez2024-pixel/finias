import React, { useState } from 'react';
import { Plus, Printer, Edit2, Trash2, ShieldCheck, Tag, Info, Network, Monitor, Smartphone, Settings } from 'lucide-react';
import { useErp } from '../../context/ErpContext';

interface ReceiptPrinter {
  id: string;
  name: string;
  connectionType: 'network' | 'windows' | 'linux' | 'browser';
  capabilityProfile: 'default' | 'simple' | 'star';
  charPerLine: number;
  ipAddress?: string;
  port?: string;
  path?: string;
}

export const PrintersConfigTab: React.FC = () => {
  const { settings, showFlashNotification } = useErp();
  const isLight = settings?.themeMode === 'light';
  const [printers, setPrinters] = useState<ReceiptPrinter[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<ReceiptPrinter | null>(null);

  const [formData, setFormData] = useState<Partial<ReceiptPrinter>>({
    name: '',
    connectionType: 'network',
    capabilityProfile: 'default',
    charPerLine: 42,
    ipAddress: '',
    port: '9100',
    path: '',
  });

  const handleOpenCreate = () => {
    setEditingPrinter(null);
    setFormData({
      name: '',
      connectionType: 'network',
      capabilityProfile: 'default',
      charPerLine: 42,
      ipAddress: '',
      port: '9100',
      path: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (printer: ReceiptPrinter) => {
    setEditingPrinter(printer);
    setFormData({ ...printer });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this printer?')) {
      setPrinters((prev) => prev.filter((p) => p.id !== id));
      showFlashNotification('Printer deleted successfully');
    }
  };

  const handleSave = () => {
    if (!formData.name) {
      alert('Printer name is required.');
      return;
    }

    if (editingPrinter) {
      setPrinters((prev) =>
        prev.map((p) => (p.id === editingPrinter.id ? { ...p, ...formData } as ReceiptPrinter : p))
      );
      showFlashNotification('Printer updated successfully');
    } else {
      const newPrinter: ReceiptPrinter = {
        ...(formData as ReceiptPrinter),
        id: `printer_${Date.now()}`,
      };
      setPrinters([...printers, newPrinter]);
      showFlashNotification('Printer added successfully');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <Printer className="w-5 h-5" />
            <span>Receipt Printers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure thermal receipt printers (Network, Windows, Linux, or Browser-based) for POS terminals.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Printer</span>
        </button>
      </div>

      {printers.length === 0 ? (
        <div className={`border-2 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center ${isLight ? 'border-slate-300 bg-slate-50' : 'border-slate-800 bg-slate-900/50'}`}>
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
            <Printer className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>No Printers Configured</h3>
          <p className={`text-sm mb-6 max-w-md ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            You haven't added any receipt printers yet. Add your thermal printers to use them in POS locations.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Printer</span>
          </button>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${isLight ? 'border-slate-300 bg-white' : 'border-slate-800 bg-slate-900/50'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`text-xs uppercase font-bold ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800/80 text-slate-400'}`}>
                <tr>
                  <th className="px-4 py-3">Printer Name</th>
                  <th className="px-4 py-3">Connection Type</th>
                  <th className="px-4 py-3">Capability Profile</th>
                  <th className="px-4 py-3">Character Per Line</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {printers.map((printer) => (
                  <tr key={printer.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}`}>
                    <td className={`px-4 py-3 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{printer.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 w-max ${
                        printer.connectionType === 'network' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        printer.connectionType === 'windows' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                        printer.connectionType === 'linux' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {printer.connectionType === 'network' && <Network className="w-3 h-3" />}
                        {printer.connectionType === 'windows' && <Monitor className="w-3 h-3" />}
                        {printer.connectionType === 'linux' && <Settings className="w-3 h-3" />}
                        {printer.connectionType === 'browser' && <Smartphone className="w-3 h-3" />}
                        {printer.connectionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-400 capitalize">{printer.capabilityProfile}</td>
                    <td className="px-4 py-3 font-medium text-slate-400">{printer.charPerLine}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(printer)}
                          className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-indigo-600 hover:bg-indigo-50' : 'text-indigo-400 hover:bg-indigo-500/20'}`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(printer.id)}
                          className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-rose-600 hover:bg-rose-50' : 'text-rose-400 hover:bg-rose-500/20'}`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE/EDIT PRINTER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full ${isLight ? 'bg-white' : 'bg-slate-900 border border-slate-700'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h2 className={`text-lg font-black flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Printer className="w-5 h-5 text-indigo-500" />
                <span>{editingPrinter ? 'Edit Printer' : 'Add Printer'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-2 rounded-xl transition ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <Trash2 className="w-4 h-4 opacity-0" /> {/* Spacer or close icon */}
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Printer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'}`}
                    placeholder="e.g. Front Desk Receipt Printer"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Connection Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.connectionType}
                    onChange={(e) => setFormData({ ...formData, connectionType: e.target.value as any })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'}`}
                  >
                    <option value="network">Network</option>
                    <option value="windows">Windows</option>
                    <option value="linux">Linux</option>
                    <option value="browser">Browser Based</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Capability Profile <span className="text-rose-500">*</span>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-indigo-400 cursor-help" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                        Select the correct capability profile based on your printer model to avoid printing errors.
                      </div>
                    </div>
                  </label>
                  <select
                    value={formData.capabilityProfile}
                    onChange={(e) => setFormData({ ...formData, capabilityProfile: e.target.value as any })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'}`}
                  >
                    <option value="default">Default</option>
                    <option value="simple">Simple</option>
                    <option value="star">Star</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Characters Per Line <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.charPerLine}
                    onChange={(e) => setFormData({ ...formData, charPerLine: parseInt(e.target.value) || 42 })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'}`}
                  />
                </div>

                {formData.connectionType === 'network' && (
                  <>
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        IP Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.ipAddress || ''}
                        onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'}`}
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Port <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.port || ''}
                        onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'}`}
                        placeholder="9100"
                      />
                    </div>
                  </>
                )}

                {(formData.connectionType === 'windows' || formData.connectionType === 'linux') && (
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-bold mb-1.5 flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Path <span className="text-rose-500">*</span>
                      <div className="group relative">
                        <Info className="w-3.5 h-3.5 text-indigo-400 cursor-help" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                          Connection path to printer. Windows: smb://computer/printer, Linux: /dev/usb/lp0
                        </div>
                      </div>
                    </label>
                    <input
                      type="text"
                      value={formData.path || ''}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'}`}
                      placeholder={formData.connectionType === 'windows' ? 'smb://computer-name/Receipt Printer' : '/dev/usb/lp0'}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={`p-5 border-t flex items-center justify-end gap-3 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/80'}`}>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  isLight 
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all"
              >
                Save Printer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
