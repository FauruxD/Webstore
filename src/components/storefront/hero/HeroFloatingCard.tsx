import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface HeroFloatingCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind classes for the icon chip: background plus text colour. */
  iconClassName: string;
  /** Absolute placement of the settled position. Owned by the caller. */
  positionClassName: string;
  /** Set by the orbit animator so it can target the cards without ref arrays. */
  orbitIndex: number;
}

/**
 * One floating stat card in the hero composition. Kept presentational: the
 * settled position comes in as a class and the entrance is driven from the
 * parent, so this stays reusable outside the orbit.
 */
export function HeroFloatingCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  positionClassName,
  orbitIndex,
}: HeroFloatingCardProps) {
  return (
    <div
      data-hero-orbit-card={orbitIndex}
      className={cn(
        'absolute flex items-center gap-3 rounded-2xl border border-[#E5E2D9] bg-white/95 p-3.5 shadow-lg backdrop-blur-md',
        positionClassName,
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
          iconClassName,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <span className="block text-[10px] font-bold uppercase text-[#686660]">{label}</span>
        <span className="text-xs font-bold text-[#111111]">{value}</span>
      </div>
    </div>
  );
}
