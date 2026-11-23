import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShoppingBag, PackagePlus, CreditCard, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="card-premium p-4 flex flex-wrap items-center justify-between gap-3 bg-card border-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-butter-light text-warning flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Quick Operational Dispatch
          </h4>
          <p className="text-[11px] text-muted-foreground">Direct access to frequent workflows</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => navigate('/orders')}
          className="bg-terracotta hover:bg-terracotta/90 text-white text-xs h-8 shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
          New Order
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/purchases')}
          className="border-border hover:bg-secondary text-xs h-8"
        >
          <ShoppingBag className="w-3.5 h-3.5 mr-1.5 text-sage" />
          Log Purchase
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/inventory')}
          className="border-border hover:bg-secondary text-xs h-8"
        >
          <PackagePlus className="w-3.5 h-3.5 mr-1.5 text-warning" />
          Check Stock
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/payments')}
          className="border-border hover:bg-secondary text-xs h-8"
        >
          <CreditCard className="w-3.5 h-3.5 mr-1.5 text-charcoal" />
          Simulate Payment
        </Button>
      </div>
    </div>
  );
}
