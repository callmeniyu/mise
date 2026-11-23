import { Order } from '@/types';
import { Calendar, Users, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface UpcomingEventsProps {
  orders: Order[];
}

export function UpcomingEvents({ orders = [] }: UpcomingEventsProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = orders
    .filter((o) => o.eventDate >= todayStr && o.status !== 'Closed')
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, 4);

  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-charcoal text-white flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">Upcoming Banquets</h3>
            <p className="text-[11px] text-muted-foreground">Kitchen event schedule</p>
          </div>
        </div>

        <Link
          to="/orders"
          className="text-xs text-terracotta hover:underline font-semibold flex items-center gap-1"
        >
          View all <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2.5 mt-2">
        {upcoming.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No upcoming events scheduled.</p>
        ) : (
          upcoming.map((event) => (
            <div
              key={event.id}
              className="p-3 rounded-lg border border-border bg-card hover:bg-secondary/40 transition-colors flex items-center justify-between text-xs"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground truncate">{event.clientName}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground">{event.eventDate}</span>
                  <span>•</span>
                  <span>{event.eventType}</span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end flex-shrink-0">
                <Badge variant="outline" className="text-[10px] py-0 px-2 border-border mb-1">
                  {event.status}
                </Badge>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{event.guestCount}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
