/**
 * Shared page-scroll lock registry.
 *
 * Dialogs and drawers set `body { overflow: hidden }` to freeze the page, but
 * smooth scrolling listens for `wheel` and `touch` on the window and would keep
 * driving the page underneath an open modal. This registry is the handshake
 * between the two: overlays report that the page is locked, and the smooth
 * scroll provider subscribes so it can stop and start in step.
 *
 * Deliberately framework-free and dependency-free so the dialog primitive stays
 * usable on the admin side, where smooth scrolling is never mounted.
 */

type LockListener = (locked: boolean) => void;

/** Stacked overlays must not release the lock until the last one closes. */
let lockCount = 0;
const listeners = new Set<LockListener>();

function emit() {
  const locked = lockCount > 0;
  for (const listener of listeners) listener(locked);
}

/** Registers one overlay as holding the page scroll. */
export function acquireScrollLock(): void {
  lockCount += 1;
  if (lockCount === 1) emit();
}

/** Releases one overlay's hold. Safe to call more times than acquired. */
export function releaseScrollLock(): void {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) emit();
}

export function isScrollLocked(): boolean {
  return lockCount > 0;
}

/**
 * Subscribes to lock changes and immediately reports the current state, so a
 * provider mounting behind an already-open dialog starts out stopped.
 */
export function onScrollLockChange(listener: LockListener): () => void {
  listeners.add(listener);
  listener(lockCount > 0);
  return () => {
    listeners.delete(listener);
  };
}
