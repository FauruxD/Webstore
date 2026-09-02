import { useEffect, useLayoutEffect } from 'react';

/**
 * useLayoutEffect on the client, useEffect during SSR. Keeps the pre-paint
 * timing the intro needs without the server-render warning.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
