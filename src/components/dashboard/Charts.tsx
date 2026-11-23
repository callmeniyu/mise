import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useMonthlyTrends, useBestSellers } from '@/hooks/api';

export function RevenueChart() {
  const { data: trendData = [], isLoading } = useMonthlyTrends(6);

  if (isLoading) {
    return (
      <div className="card-premium p-6 h-80 flex items-center justify-center text-sm text-muted-foreground">
        Loading financial analytics...
      </div>
    );
  }

  return (
    <div className="card-premium p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Revenue & Cost Performance</h3>
          <p className="text-xs text-muted-foreground">Monthly revenue compared to ingredient purchases (COGS)</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-terracotta" />
            <span className="text-secondary-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-sage" />
            <span className="text-secondary-foreground">Purchases</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-charcoal" />
            <span className="text-secondary-foreground">Gross Profit</span>
          </div>
        </div>
      </div>

      <div className="h-68 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trendData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E3D9" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#7B817B', fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#7B817B', fontSize: 11 }}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFEFA',
                border: '1px solid #E7E3D9',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(32, 41, 35, 0.08)',
                fontSize: '12px',
              }}
              formatter={(value: any, name: any) => [`AED ${Number(value).toLocaleString()}`, name]}
              labelStyle={{ fontWeight: 600, color: '#202923', marginBottom: '4px' }}
            />
            <Bar dataKey="revenue" name="Revenue" fill="#E65B45" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="purchases" name="Purchases" fill="#9EAF91" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="profit" name="Gross Profit" fill="#202923" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BestSellersChart() {
  const { data: topDishes = [], isLoading } = useBestSellers();

  if (isLoading) {
    return (
      <div className="card-premium p-6 h-80 flex items-center justify-center text-sm text-muted-foreground">
        Loading top dishes...
      </div>
    );
  }

  const maxPortions = topDishes.length > 0 ? Math.max(...topDishes.map((d) => d.portionsSold)) : 1;

  return (
    <div className="card-premium min-w-0 p-5 sm:p-6 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-foreground leading-tight">Top Culinary Dishes</h3>
            <p className="text-xs text-muted-foreground">Volume and margin performance</p>
          </div>
          <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-butter-light text-warning border border-butter">
            Volume Leader
          </span>
        </div>

        <div className="space-y-4 mt-2">
          {topDishes.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No dish sales recorded yet.</p>
          ) : (
            topDishes.map((dish, index) => {
              const fillPercentage = Math.round((dish.portionsSold / maxPortions) * 100);

              return (
                <div key={dish.name} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-charcoal text-white text-[10px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-foreground truncate max-w-[130px] sm:max-w-[160px]">
                        {dish.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <span className="text-muted-foreground font-medium whitespace-nowrap">
                        {dish.portionsSold} portions
                      </span>
                      <span className="font-bold text-foreground whitespace-nowrap">
                        AED {((dish.revenue || 0) / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar with culinary terracotta gradient */}
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-terracotta rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs text-secondary-foreground">
        <span>Average Target Margin</span>
        <span className="font-bold text-success font-mono">56.4%</span>
      </div>
    </div>
  );
}
