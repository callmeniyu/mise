import React from 'react';
import { cn } from '@/lib/utils';

interface MiseLogoProps {
  collapsed?: boolean;
  className?: string;
  light?: boolean;
}

export const MiseLogo: React.FC<MiseLogoProps> = ({ collapsed = false, className, light = false }) => {
  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      {/* Mise Geometric Emblem: Kitchen Prep / Layered Geometry */}
      <div className="relative w-9 h-9 rounded-lg bg-terracotta flex items-center justify-center shadow-sm flex-shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Geometric M with balanced culinary prep knife/grid aesthetic */}
          <path d="M4 19V5l8 9 8-9v14" />
          <circle cx="20" cy="5" r="1.5" fill="#E9C978" stroke="none" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'font-display text-xl font-bold tracking-tight',
                light ? 'text-white' : 'text-foreground'
              )}
            >
              Mise
            </span>
            <span className="text-[10px] font-sans font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded bg-terracotta/15 text-terracotta">
              Ops
            </span>
          </div>
          <span className={cn('text-[11px] font-medium tracking-wide -mt-0.5', light ? 'text-sidebar-muted' : 'text-muted-foreground')}>
            Culinary Atelier
          </span>
        </div>
      )}
    </div>
  );
};
