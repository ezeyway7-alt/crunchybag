import { useEffect } from 'react';

let lockCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';

/**
 * Locks document body and html scrolling in a reference-counted manner.
 * Multiple modals can call lockScroll; scroll is only unlocked when all modals close.
 */
export function lockScroll(): void {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    // Only capture original styles if not already hidden by an earlier bug
    const curBody = document.body.style.overflow;
    const curHtml = document.documentElement.style.overflow;
    originalBodyOverflow = curBody === 'hidden' ? '' : curBody;
    originalHtmlOverflow = curHtml === 'hidden' ? '' : curHtml;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
  lockCount++;
}

/**
 * Decrements the lock count and restores scrolling when all locks are released.
 */
export function unlockScroll(): void {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.overflow = originalHtmlOverflow;
  }
}

/**
 * Force resets any leftover scroll locks and unfreezes the page.
 */
export function forceUnlockScroll(): void {
  if (typeof document === 'undefined') return;

  lockCount = 0;
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
}

/**
 * React hook to lock scroll while `locked` is true and automatically release on unmount/false.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [locked]);
}
