'use client';

import { useEffect } from 'react';

/**
 * Prevents scroll wheel from changing values on focused number inputs.
 * This is a global fix applied once at the root level.
 */
export function NumberInputScrollPrevention() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement &&
        target.type === 'number' &&
        document.activeElement === target
      ) {
        target.blur();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: true });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  return null;
}
