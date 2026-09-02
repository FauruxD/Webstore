'use client';

import { useEffect, useRef } from 'react';
import { acquireScrollLock, releaseScrollLock } from '@/lib/scroll/scroll-lock';

/**
 * Counts how many dialogs are currently locking the page. Nested or stacked
 * dialogs must not restore scroll until the last one closes.
 */
let lockCount = 0;
let restoreStyles: { overflow: string; paddingRight: string } | null = null;

function lockBodyScroll() {
  if (lockCount === 0) {
    const { body } = document;
    restoreStyles = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };

    // Compensate for the vanishing scrollbar so the layout does not jump.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    if (gap > 0) {
      const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${current + gap}px`;
    }
    body.style.overflow = 'hidden';
  }
  lockCount += 1;

  // Smooth scrolling reads wheel and touch events off the window, so hiding
  // body overflow alone would not stop the page moving behind the dialog.
  acquireScrollLock();
}

function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0 && restoreStyles) {
    document.body.style.overflow = restoreStyles.overflow;
    document.body.style.paddingRight = restoreStyles.paddingRight;
    restoreStyles = null;
  }
  releaseScrollLock();
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

interface DialogBehaviorOptions {
  open: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
}

/**
 * Scroll lock, focus trap, initial focus, focus restore, and Escape handling.
 * Returns the ref to attach to the dialog panel.
 */
export function useDialogBehavior({
  open,
  onClose,
  closeOnEscape = true,
}: DialogBehaviorOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Keep the latest onClose without re-running the whole effect on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    lockBodyScroll();

    // Move focus inside so screen readers and keyboards enter the dialog.
    if (panel) {
      const first = focusableWithin(panel)[0];
      (first ?? panel).focus({ preventScroll: true });
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panel) return;

      const targets = focusableWithin(panel);
      if (targets.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const first = targets[0];
      const last = targets[targets.length - 1];
      const active = document.activeElement;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      unlockBodyScroll();
      previousFocusRef.current?.focus({ preventScroll: true });
    };
  }, [open, closeOnEscape]);

  return panelRef;
}
