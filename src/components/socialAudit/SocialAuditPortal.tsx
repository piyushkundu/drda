'use client';

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface SocialAuditPortalProps {
  children: ReactNode;
}

/**
 * SocialAuditPortal
 * Renders modal dialogs, overlays, and drawer panels directly into document.body.
 * This guarantees the modal is outside of any ancestor stacking contexts, overflow-hidden
 * containers, or fixed navigation bars, so it is never clipped or hidden beneath the header.
 */
export default function SocialAuditPortal({ children }: SocialAuditPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}

