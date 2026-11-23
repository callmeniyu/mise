import { Order, OrderStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar, Users, DollarSign, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrderCardProps {
  order: Order;
}

const statusBadgeStyles: Record<OrderStatus, string> = {
  Inquiry: 'bg-info-light text-info border-info/30',
  Confirmed: 'bg-butter-light text-warning border-butter',
  'In Progress': 'bg-sage-light text-success border-sage/40',
  Delivered: 'bg-success-light text-success border-success/40',
  Closed: 'bg-muted text-muted-foreground border-border',
};

const clientTypeStyles: Record<string, string> = {
  Wedding: 'bg-terracotta-light text-terracotta border-terracotta/20',
  Corporate: 'bg-charcoal text-white',
  Family: 'bg-sage-light text-success border-sage/30',
  Individual: 'bg-secondary text-secondary-foreground border-border',
};

export function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="card-premium p-5 flex flex-col justify-between hover:border-charcoal/30 group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                {order.id}
              </span>
              <span
                className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                  clientTypeStyles[order.clientType] || clientTypeStyles.Individual
                )}
              >
                {order.clientType}
              </span>
            </div>
            <h3 className="font-display text-base font-bold text-foreground mt-1 line-clamp-1 group-hover:text-terracotta transition-colors">
              {order.clientName}
            </h3>
          </div>

          <Badge className={cn('text-[11px] font-medium shadow-none', statusBadgeStyles[order.status])}>
            {order.status}
          </Badge>
        </div>

        <p className="text-xs text-secondary-foreground line-clamp-1 mb-4">
          {order.eventType} • {order.menuItems?.join(', ') || 'Custom culinary menu'}
        </p>

        <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-secondary/40 rounded-lg text-xs text-secondary-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{order.eventDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span>{order.guestCount} guests</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-foreground">
            <span>AED</span>
            <span>{((order.totalValue || 0) / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
        {order.remainingBalance > 0 ? (
          <span className="text-destructive font-medium">
            Balance Due: AED {order.remainingBalance.toLocaleString()}
          </span>
        ) : (
          <span className="text-success font-medium flex items-center gap-1">
            ✓ Fully Settled
          </span>
        )}

        <Link
          to="/orders"
          className="text-terracotta hover:underline font-medium inline-flex items-center gap-0.5"
        >
          Details <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
