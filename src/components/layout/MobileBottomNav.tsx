import React from 'react';
import { useErp } from '../../context/ErpContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  Receipt,
  Menu,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab = () => {},
    cart = [],
    settings = {},
    toggleMobileSidebar = () => {},
    navigateToInventory = () => {},
  } = useErp() || {};

  const isLight = settings?.themeMode === 'light';
  const totalCartItems = (cart || []).reduce((a: number, b: any) => a + (Number(b?.quantity) || 0), 0);

  const isPos = activeTab === 'pos';

  // If in active fullscreen POS checkout or dialogs, hide MobileBottomNav so it never underlaps POS buttons and Exit button
  if (isPos) {
    return null;
  }

  return (
    <nav
      id="mobile-bottom-navigation-bar"
      aria-label="Mobile Navigation"
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 ${
        isLight
          ? 'bg-white/95 border-t border-slate-200 text-slate-700 shadow-lg backdrop-blur-md'
          : 'bg-slate-950/95 border-t border-slate-800 text-slate-300 shadow-2xl backdrop-blur-md'
      } transition-colors duration-200 safe-bottom`}
    >
      <div className="grid grid-cols-6 items-center justify-around h-14 max-w-lg mx-auto px-1">
        {/* 1. Dashboard */}
        <button
          type="button"
          id="mobile-bottom-nav-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-95 active:opacity-80 ${
            activeTab === 'dashboard'
              ? isLight
                ? 'text-indigo-600 font-bold'
                : 'text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg transition-transform ${activeTab === 'dashboard' ? 'scale-110 bg-indigo-500/10' : ''}`}>
            <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium leading-tight mt-0.5 truncate max-w-full">Home</span>
        </button>

        {/* 2. POS Terminal */}
        <button
          type="button"
          id="mobile-bottom-nav-pos"
          onClick={() => setActiveTab('pos')}
          className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-95 active:opacity-80 ${
            isPos
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg relative transition-transform ${isPos ? 'scale-110 bg-indigo-500/10' : ''}`}>
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1.5 h-4 min-w-[16px] px-1 bg-rose-600 text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
                {totalCartItems}
              </span>
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium leading-tight mt-0.5 truncate max-w-full">POS</span>
        </button>

        {/* 3. Products / Inventory */}
        <button
          type="button"
          id="mobile-bottom-nav-inventory"
          onClick={() => {
            if (navigateToInventory) {
              navigateToInventory('matrix');
            } else {
              setActiveTab('inventory');
            }
          }}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-95 active:opacity-80 ${
            activeTab === 'inventory' || activeTab === 'products'
              ? isLight
                ? 'text-indigo-600 font-bold'
                : 'text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg transition-transform ${activeTab === 'inventory' || activeTab === 'products' ? 'scale-110 bg-indigo-500/10' : ''}`}>
            <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium leading-tight mt-0.5 truncate max-w-full">Stock</span>
        </button>

        {/* 4. Purchases */}
        <button
          type="button"
          id="mobile-bottom-nav-purchases"
          onClick={() => setActiveTab('purchases')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-95 active:opacity-80 ${
            activeTab === 'purchases'
              ? isLight
                ? 'text-indigo-600 font-bold'
                : 'text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg transition-transform ${activeTab === 'purchases' ? 'scale-110 bg-indigo-500/10' : ''}`}>
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium leading-tight mt-0.5 truncate max-w-full">Purchases</span>
        </button>

        {/* 5. Sales Reports */}
        <button
          type="button"
          id="mobile-bottom-nav-sales"
          onClick={() => setActiveTab('sales')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-95 active:opacity-80 ${
            activeTab === 'sales'
              ? isLight
                ? 'text-indigo-600 font-bold'
                : 'text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg transition-transform ${activeTab === 'sales' ? 'scale-110 bg-indigo-500/10' : ''}`}>
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium leading-tight mt-0.5 truncate max-w-full">Sales</span>
        </button>

        {/* 6. All Menus Drawer */}
        <button
          type="button"
          id="mobile-bottom-nav-menu"
          onClick={toggleMobileSidebar}
          className="flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-95 active:opacity-80"
        >
          <div className="p-1 rounded-lg bg-indigo-600/10 text-indigo-500 dark:text-indigo-400">
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium leading-tight mt-0.5 truncate max-w-full">Menu</span>
        </button>
      </div>
    </nav>
  );
};
