import { InventoryItem } from '@/types';
import { AlertTriangle, ArrowRight, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LowStockAlertProps {
  items: InventoryItem[];
}

export function LowStockAlert({ items = [] }: LowStockAlertProps) {
  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-warning-light text-warning flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">Stock Alerts</h3>
            <p className="text-[11px] text-muted-foreground">Items requiring replenishment</p>
          </div>
        </div>

        <Link
          to="/inventory"
          className="text-xs text-terracotta hover:underline font-semibold flex items-center gap-1"
        >
          Manage <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2.5 mt-2">
        {items.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            <PackageOpen className="w-8 h-8 mx-auto mb-1 text-sage opacity-70" />
            All inventory levels are currently healthy.
          </div>
        ) : (
          items.map((item) => {
            const isCritical = item.currentStock === 0;

            return (
              <div
                key={item.id}
                className="p-2.5 rounded-lg border border-border bg-card hover:bg-secondary/40 transition-colors flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground truncate">{item.name}</span>
                    {isCritical && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-destructive text-white uppercase">
                        Out
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Supplier: {item.supplierName}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`font-mono font-bold ${
                      isCritical ? 'text-destructive' : 'text-warning'
                    }`}
                  >
                    {item.currentStock} {item.unit}
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    Min: {item.minimumStock} {item.unit}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
