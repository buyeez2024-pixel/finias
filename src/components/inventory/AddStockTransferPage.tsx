import React from 'react';
import { useErp } from '../../context/ErpContext';
import { StockTransferModal } from './StockTransferModal';

export const AddStockTransferPage: React.FC = () => {
  const { setActiveTab } = useErp();
  return (
    <div className="p-6">
      <StockTransferModal isOpen={true} onClose={() => setActiveTab('inventory')} />
    </div>
  );
};
