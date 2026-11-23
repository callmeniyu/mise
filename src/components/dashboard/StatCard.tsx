import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  accentColor?: 'terracotta' | 'sage' | 'butter' | 'charcoal' | 'warning' | 'destructive';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'charcoal',
  className,
}: StatCardProps) {
  const accentStyles = {
    charcoal: {
      iconBg: 'bg-charcoal text-white',
      borderAccent: 'hover:border-charcoal/40',
      badge: 'bg-charcoal/10 text-charcoal',
    },
    terracotta: {
      iconBg: 'bg-terracotta text-white',
      borderAccent: 'hover:border-terracotta/40',
      badge: 'bg-terracotta/10 text-terracotta',
    },
    sage: {
      iconBg: 'bg-sage text-charcoal',
      borderAccent: 'hover:border-sage/40',
      badge: 'bg-sage-light text-success',
    },
    butter: {
      iconBg: 'bg-butter text-charcoal',
      borderAccent: 'hover:border-butter/40',
      badge: 'bg-butter-light text-warning',
    },
    warning: {
      iconBg: 'bg-warning text-white',
      borderAccent: 'hover:border-warning/40',
      badge: 'bg-warning-light text-warning',
    },
    destructive: {
      iconBg: 'bg-destructive text-white',
      borderAccent: 'hover:border-destructive/40',
      badge: 'bg-destructive-light text-destructive',
    },
  };

  const currentAccent = accentStyles[accentColor] || accentStyles.charcoal;

  return (
    <div
      className={cn(
        'stat-card relative overflow-hidden group flex flex-col justify-between',
        currentAccent.borderAccent,
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
          {title}
        </span>
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-xs',
            currentAccent.iconBg
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <p className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/70 text-xs">
          {subtitle && <span className="text-muted-foreground truncate">{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                'font-semibold px-2 py-0.5 rounded-full text-[11px] ml-auto',
                trend.isPositive
                  ? 'bg-success-light text-success'
                  : 'bg-destructive-light text-destructive'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
