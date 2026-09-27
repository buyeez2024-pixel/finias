import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useErp } from '../../context/ErpContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const FlashNotification: React.FC = () => {
  const { activeNotification } = useErp();

  if (!activeNotification) return null;

  const { message, type } = activeNotification;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] min-w-[320px] max-w-md"
      >
        <div 
          className={`flex items-center gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md ${
            type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
          }`}
        >
          {type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
          {type === 'info' && <Info className="w-5 h-5 shrink-0" />}
          
          <p className="text-sm font-bold flex-1 leading-tight">{message}</p>
          
          <button className="p-1 hover:bg-white/10 rounded-lg transition">
            <X className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
