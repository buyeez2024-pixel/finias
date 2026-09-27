import React from 'react';
import { ArrowLeftRight, Settings, Plus } from 'lucide-react';

export const TransferAdjustmentDashboard: React.FC<{
  onOpenTransfer: () => void;
  onOpenAdjustment: () => void;
}> = ({ onOpenTransfer, onOpenAdjustment }) => {
  // Mock data for demonstration - in a real app, this would come from a data hook
  const adjustments = [
    { id: 1, date: '2026-08-29', ref: 'ADJ-001', location: 'Main Store', status: 'Completed' },
  ];
  const transfers = [
    { id: 1, date: '2026-08-28', ref: 'TRN-001', from: 'Main Store', to: 'Branch A', status: 'Pending' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Transfer & Adjustment</h1>
          <p className="text-slate-400 text-sm">Manage inventory movements and stock adjustments.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onOpenAdjustment}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition"
          >
            <Settings className="w-4 h-4" />
            Add Adjustment
          </button>
          <button
            onClick={onOpenTransfer}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Transfer
          </button>
        </div>
      </div>
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-center text-slate-400">
        <p>Use the navigation tabs to view and manage specific Stock Adjustments and Branch Transfers.</p>
      </div>
    </div>
  );
};
