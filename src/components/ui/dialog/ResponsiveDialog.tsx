'use client';

import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useDialogBehavior } from './useDialogBehavior';

type DialogSurface = 'store' | 'admin';

export interface ResponsiveDialogProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name. Rendered visually unless `hideTitle` is set. */
  title: string;
  description?: string;
  /** Sticky footer content. Stays reachable while the body scrolls. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Desktop max width. Mobile is always a full-height sheet. */
  size?: 'md' | 'lg' | 'xl';
  surface?: DialogSurface;
  hideTitle?: boolean;
  /** Set false during an in-flight submit so work cannot be lost. */
  dismissible?: boolean;
  headerAside?: React.ReactNode;
}

const SIZE_CLASS: Record<NonNullable<ResponsiveDialogProps['size']>, string> = {
  md: 'sm:max-w-[560px]',
  lg: 'sm:max-w-[820px]',
  xl: 'sm:max-w-[1080px]',
};

const SURFACE = {
  store: {
    panel: 'bg-[#F8F6F0] text-[#111111]',
    bar: 'bg-white border-[#DAD6CD]',
    title: 'font-display text-[#111111]',
    muted: 'text-[#686660]',
    close: 'hover:bg-[#F4F1EA] text-[#686660] focus-visible:outline-[#6657E8]',
  },
  admin: {
    panel: 'bg-[#F8F6F0] text-[#111111]',
    bar: 'bg-white border-[#DAD6CD]',
    title: 'font-display text-[#111111]',
    muted: 'text-[#686660]',
    close: 'hover:bg-[#F4F1EA] text-[#686660] focus-visible:outline-[#6657E8]',
  },
} satisfies Record<DialogSurface, Record<string, string>>;

/**
 * One dialog primitive for the whole app. Portals to `document.body`, traps
 * focus, locks page scroll, and keeps a sticky header and footer while only the
 * body scrolls. Mobile renders a full-height sheet; desktop a centered panel.
 */
export function ResponsiveDialog({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  size = 'lg',
  surface = 'store',
  hideTitle = false,
  dismissible = true,
  headerAside,
}: ResponsiveDialogProps) {
  const [mounted, setMounted] = useState(false);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const tokens = SURFACE[surface];

  // Portals need a DOM target, so render nothing until after hydration.
  useEffect(() => setMounted(true), []);

  const requestClose = () => {
    if (dismissible) onClose();
  };

  const panelRef = useDialogBehavior({
    open,
    onClose: requestClose,
    closeOnEscape: dismissible,
  });

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        onClick={requestClose}
        className="motion-dialog-backdrop absolute inset-0 bg-[#111111]/45 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex w-full flex-col overflow-hidden shadow-2xl outline-none',
          'h-[100dvh] rounded-none sm:h-auto sm:max-h-[min(88dvh,900px)] sm:rounded-3xl',
          // Mobile rises as a sheet, desktop settles as a panel. Both are
          // transform and opacity only, so neither can shift the page.
          'motion-dialog-surface',
          tokens.panel,
          SIZE_CLASS[size],
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-start justify-between gap-4 border-b px-5 py-4 sm:px-7 sm:py-5',
            tokens.bar,
          )}
        >
          <div className={cn('min-w-0', hideTitle && 'sr-only')}>
            <h2
              id={titleId}
              className={cn('truncate text-lg font-semibold sm:text-xl', tokens.title)}
            >
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className={cn('mt-1 text-xs leading-relaxed', tokens.muted)}>
                {description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {headerAside}
            <button
              type="button"
              onClick={requestClose}
              disabled={!dismissible}
              aria-label="Tutup dialog"
              className={cn(
                'rounded-xl p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-40',
                tokens.close,
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          // Keeps the wheel inside the dialog body: smooth scrolling leaves this
          // subtree alone, and reaching the end does not scroll the page.
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6"
        >
          {children}
        </div>

        {footer && (
          <div
            className={cn(
              'shrink-0 border-t px-5 py-4 sm:px-7 sm:py-4',
              'pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4',
              tokens.bar,
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
