import React from 'react';
import { useErp } from '../../context/ErpContext';
import { StockAdjustmentModal } from './StockAdjustmentModal';

export const AddStockAdjustmentPage: React.FC = () => {
  const { setActiveTab } = useErp();
  return (
    <div className="p-6">
      <StockAdjustmentModal isOpen={true} onClose={() => setActiveTab('inventory')} />
    </div>
  );
};
