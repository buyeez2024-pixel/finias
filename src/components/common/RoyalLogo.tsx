import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import defaultLogoAsset from '../../assets/images/royal_pos_logo_1786972896086.jpg';

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
  const [imgFailed, setImgFailed] = useState(false);

  // Safely grab settings logoUrl and darkLogoUrl from our ERP context provider
  let customLogoUrl = '';
  let activeThemeMode: 'dark' | 'light' = 'light';
  let businessTitle = 'Royal POS';

  try {
    const context = useErp();
    const storedPrimaryLogo =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('royal_pos_v1_primary_logo') ||
          localStorage.getItem('pos_custom_logo') ||
          ''
        : '';

    if (context && (context.currentUser || context.settings)) {
      businessTitle = context.currentUser?.businessName || context.settings?.businessName || context.settings?.name || 'Royal POS';
      activeThemeMode =
        propThemeMode ||
        context.settings?.themeMode ||
        (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light');

      const isDark = activeThemeMode === 'dark';
      const primaryLogo = context.settings?.logoUrl || context.settings?.logo || storedPrimaryLogo || '';

      if (isDark) {
        customLogoUrl = context.settings?.darkLogoUrl || primaryLogo || '';
      } else {
        customLogoUrl = primaryLogo || context.settings?.darkLogoUrl || '';
      }
    } else if (storedPrimaryLogo) {
      customLogoUrl = storedPrimaryLogo;
    }
  } catch (err) {
    try {
      if (typeof localStorage !== 'undefined') {
        customLogoUrl =
          localStorage.getItem('royal_pos_v1_primary_logo') ||
          localStorage.getItem('pos_custom_logo') ||
          '';
      }
    } catch (e) {}
  }

  // Dimensions map for default icon container
  const imageSizes = {
    xs: 'w-7 h-7 min-w-[28px] rounded-lg',
    sm: 'w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] sm:min-w-[36px] rounded-xl',
    md: 'w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] sm:min-w-[40px] rounded-xl',
    lg: 'w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] sm:min-w-[48px] rounded-2xl',
    xl: 'w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] sm:min-w-[64px] rounded-2xl',
  };

  // Dimensions map for custom uploaded logos (mobile & tablet optimized)
  const customLogoSizes = {
    xs: 'h-6 sm:h-7 max-w-[110px] object-contain shrink-0',
    sm: 'h-7 sm:h-8 max-w-[140px] object-contain shrink-0',
    md: 'h-8 sm:h-9 md:h-10 max-w-[170px] sm:max-w-[210px] object-contain shrink-0',
    lg: 'h-10 sm:h-12 max-w-[210px] sm:max-w-[250px] object-contain shrink-0',
    xl: 'h-12 sm:h-16 max-w-[240px] sm:max-w-[300px] object-contain shrink-0',
  };

  const titleSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  // The custom uploaded logo, fallback to default bundled AI emblem asset
  const logoSrc = customLogoUrl || defaultLogoAsset;

  return (
    <div className={`flex items-center gap-2 sm:gap-3 select-none shrink-0 ${className}`}>
      {/* Emblem / Custom Logo Image */}
      <div className="relative group shrink-0 flex items-center">
        {imgFailed ? (
          <div
            className={`${imageSizes[size]} bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40 text-slate-950 shrink-0`}
            title={businessTitle}
          >
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 drop-shadow-xs" />
          </div>
        ) : customLogoUrl ? (
          <div className="flex items-center justify-center shrink-0 min-h-[30px] min-w-[30px]">
            <img
              key={customLogoUrl}
              src={customLogoUrl}
              alt={businessTitle || 'Logo'}
              referrerPolicy="no-referrer"
              className={`${customLogoSizes[size]} transition-all duration-200`}
              onError={() => setImgFailed(true)}
            />
          </div>
        ) : (
          <div
            className={`${imageSizes[size]} overflow-hidden relative shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40 bg-slate-900 flex items-center justify-center shrink-0`}
          >
            <img
              src={defaultLogoAsset}
              alt={businessTitle || 'Logo'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgFailed(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-white/10 pointer-events-none" />
          </div>
        )}
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
                  <span
                    className={
                      activeThemeMode === 'dark'
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent'
                        : 'text-indigo-600'
                    }
                  >
                    {lastPart}
                  </span>
                )}
              </span>

              {badge && (
                <span
                  className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                    activeThemeMode === 'dark'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  <Crown
                    className={`w-2.5 h-2.5 ${
                      activeThemeMode === 'dark' ? 'text-amber-400' : 'text-amber-600'
                    }`}
                  />
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
