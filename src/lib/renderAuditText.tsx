import React from 'react';
import { unicodeToKrutiDev } from '@/lib/fontConversion/unicodeToKrutiDev';
import { krutiDevToUnicode } from '@/lib/fontConversion/krutiDevToUnicode';

export interface RenderAuditTextOptions {
  krutiSizeClass?: string;
  unicodeClass?: string;
  dualContainerClass?: string;
  krutiClass?: string;
}

/**
 * Universal, bulletproof renderer for Hindi text across Social Audit modules.
 * Respects 'unicode' | 'krutidev' | 'dual' modes with automatic bidirectional conversion fallback.
 */
export function renderAuditText(
  fontViewMode: 'unicode' | 'krutidev' | 'dual',
  unicodeText?: string,
  krutiText?: string,
  options?: RenderAuditTextOptions
): React.ReactNode {
  const uText = unicodeText?.trim() || '';
  const kText = krutiText?.trim() || '';

  // Bidirectional fallback resolution
  const effectiveUnicode = uText || (kText ? krutiDevToUnicode(kText) : '');
  const effectiveKruti = kText || (uText ? unicodeToKrutiDev(uText) : '');

  if (fontViewMode === 'krutidev') {
    return (
      <span 
        className={`font-kruti tracking-wide inline-block ${options?.krutiSizeClass || 'text-[15px]'} ${options?.krutiClass || 'font-normal'}`}
        style={{ fontFamily: "'Kruti Dev 010', 'KrutiDev010', 'Kruti Dev', sans-serif" }}
      >
        {effectiveKruti || effectiveUnicode}
      </span>
    );
  }

  if (fontViewMode === 'dual') {
    return (
      <span className={options?.dualContainerClass || "flex flex-col"}>
        <span className={options?.unicodeClass || "text-slate-900 font-semibold leading-tight"}>
          {effectiveUnicode}
        </span>
        <span 
          className={`font-kruti tracking-wide text-amber-800 dark:text-amber-400 mt-0.5 inline-block ${options?.krutiSizeClass || 'text-[13px]'} ${options?.krutiClass || 'font-normal'}`}
          style={{ fontFamily: "'Kruti Dev 010', 'KrutiDev010', 'Kruti Dev', sans-serif" }}
        >
          {effectiveKruti}
        </span>
      </span>
    );
  }

  // Unicode default
  return <span className={options?.unicodeClass}>{effectiveUnicode}</span>;
}

