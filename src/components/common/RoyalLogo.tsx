import React from 'react';
import { Crown } from 'lucide-react';
import { useErp } from '../../context/ErpContext';

interface RoyalLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  badge?: string;
  className?: string;
  themeMode?: 'dark' | 'light';
}

export const RoyalLogo: React.FC<RoyalLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  badge = 'v11.4 Enterprise',
  className = '',
  themeMode: propThemeMode,
}) => {
  // Safely grab settings logoUrl and darkLogoUrl from our ERP context provider
  let customLogoUrl = '';
  let activeThemeMode: 'dark' | 'light' = 'light';
  let businessTitle = 'Royal POSfini';

  try {
    const context = useErp();
    const storedPrimaryLogo =
      typeof localStorage !== 'undefined' ? localStorage.getItem('royal_pos_v1_primary_logo') || '' : '';

    if (context && (context.currentUser || context.settings)) {
      businessTitle = context.currentUser?.businessName || context.settings?.businessName || context.settings?.name || 'Royal POSfini';
      activeThemeMode =
        propThemeMode ||
        context.settings?.themeMode ||
        (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light');

      const isDark = activeThemeMode === 'dark';
      const primaryLogo = context.settings?.logoUrl || context.settings?.logo || storedPrimaryLogo || '';

      if (isDark) {
        // When dark theme is active, prefer dedicated darkLogoUrl, fallback to primary logo
        customLogoUrl = context.settings.darkLogoUrl || primaryLogo || '';
      } else {
        // When light theme is active, prefer primary logoUrl, fallback to darkLogoUrl
        customLogoUrl = primaryLogo || context.settings.darkLogoUrl || '';
      }
    } else if (storedPrimaryLogo) {
      customLogoUrl = storedPrimaryLogo;
    }
  } catch (err) {
    try {
      if (typeof localStorage !== 'undefined') {
        customLogoUrl = localStorage.getItem('royal_pos_v1_primary_logo') || '';
      }
    } catch (e) {}
  }

  // Dimensions map for default icon container
  const imageSizes = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-2xl',
  };

  // Dimensions map for custom uploaded logos
  const customLogoSizes = {
    xs: 'max-h-7 max-w-[120px]',
    sm: 'max-h-8 max-w-[170px]',
    md: 'max-h-10 max-w-[210px]',
    lg: 'max-h-12 max-w-[250px]',
    xl: 'max-h-16 max-w-[300px]',
  };

  const titleSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  // The custom uploaded logo, fallback to default AI emblem asset
  const logoSrc = customLogoUrl || '/src/assets/images/royal_pos_logo_1786972896086.jpg';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblem / Custom Logo Image */}
      <div className="relative group shrink-0">
        <div
          className={
            customLogoUrl
              ? 'flex items-center justify-center shrink-0'
              : `${imageSizes[size]} overflow-hidden relative shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40 bg-slate-900 flex items-center justify-center`
          }
        >
          <img
            key={customLogoUrl || logoSrc}
            src={logoSrc}
            alt={businessTitle || "Logo"}
            referrerPolicy="no-referrer"
            className={
              customLogoUrl
                ? `${customLogoSizes[size]} w-auto object-contain transition-all duration-200`
                : 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
            }
            onError={(e) => {
              // Fallback to high-craft SVG if image fails
              const target = e.target as HTMLElement;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.classList.add('bg-gradient-to-tr', 'from-amber-600', 'to-yellow-500');
              }
            }}
          />
          {/* Subtle Crown overlay badge for ultra crisp luxury feel on default emblem */}
          {!customLogoUrl && (
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-white/10 pointer-events-none" />
          )}
        </div>
      </div>

      {/* Brand Text Hierarchy */}
      {showText && (() => {
        const titleParts = (businessTitle || 'Finias POS').trim().split(/\s+/);
        const hasMultipleWords = titleParts.length > 1;
        const mainPart = hasMultipleWords ? titleParts.slice(0, -1).join(' ') : titleParts[0];
        const lastPart = hasMultipleWords ? titleParts[titleParts.length - 1] : '';

        return (
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`font-black tracking-tight ${
                  activeThemeMode === 'dark' ? 'text-white' : 'text-slate-900'
                } ${titleSizes[size]} flex items-center gap-1`}
              >
                <span>{mainPart}</span>
                {lastPart && (
                  <span className={activeThemeMode === 'dark' ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent' : 'text-indigo-600'}>
                    {lastPart}
                  </span>
                )}
              </span>

              {badge && (
                <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                  activeThemeMode === 'dark'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  <Crown className={`w-2.5 h-2.5 ${activeThemeMode === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
                  <span>{badge}</span>
                </span>
              )}
            </div>

            {subtitle && (
              <p
                className={`text-[11px] font-medium tracking-normal mt-0.5 ${
                  activeThemeMode === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
        );
      })()}
    </div>
  );
};
