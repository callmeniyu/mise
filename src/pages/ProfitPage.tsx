import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useOrders, usePurchases, useMenuItems, useDashboardStats } from '@/hooks/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Percent,
  Calculator,
  PieChart as PieIcon,
  Banknote,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ProfitPage() {
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: purchases = [], isLoading: purchasesLoading } = usePurchases();
  const { data: menuItems = [] } = useMenuItems();
  const { data: stats } = useDashboardStats();

  const isLoading = ordersLoading || purchasesLoading;

  // Financial Ledger Breakdown
  const totalContractValue = orders.reduce((sum, o) => sum + o.totalValue, 0);
  const totalAdvancesCollected = orders.reduce((sum, o) => sum + (o.advanceReceived || 0), 0);
  const totalOutstandingBalances = orders.reduce((sum, o) => sum + (o.remainingBalance || 0), 0);

  // Recognized Revenue: Delivered or Closed orders
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered' || o.status === 'Closed');
  const recognizedRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalValue, 0);

  // Cost of Goods Sold (Total Purchases)
  const totalCOGS = purchases.reduce((sum, p) => sum + p.cost, 0);

  // Gross Profit based on recognized revenue
  const grossProfitRecognized = recognizedRevenue - totalCOGS;
  const recognizedMarginPercent =
    recognizedRevenue > 0
      ? Math.round(((grossProfitRecognized / recognizedRevenue) * 100) * 10) / 10
      : 0;

  // Cash basis profit (Advances collected - COGS)
  const cashGrossProfit = totalAdvancesCollected - totalCOGS;

  // Revenue By Client Segment
  const clientTypeDataMap: Record<string, number> = {};
  orders.forEach((o) => {
    clientTypeDataMap[o.clientType] = (clientTypeDataMap[o.clientType] || 0) + o.totalValue;
  });

  const CLIENT_SEGMENT_COLORS: Record<string, string> = {
    Wedding: '#E65B45', // Terracotta
    Corporate: '#202923', // Charcoal
    Family: '#9EAF91', // Sage
    Individual: '#E9C978', // Butter
  };

  const clientSegmentChartData = Object.entries(clientTypeDataMap).map(([name, value]) => ({
    name,
    value,
    color: CLIENT_SEGMENT_COLORS[name] || '#7B817B',
  }));

  // Monthly Financial Trend Data (Last 6 months)
  const monthlyDataMap: Record<string, { revenue: number; cogs: number }> = {};
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    monthlyDataMap[key] = { revenue: 0, cogs: 0 };
  }

  orders.forEach((o) => {
    const key = o.eventDate.substring(0, 7);
    if (monthlyDataMap[key]) {
      monthlyDataMap[key].revenue += o.totalValue;
    }
  });

  purchases.forEach((p) => {
    const key = p.purchaseDate.substring(0, 7);
    if (monthlyDataMap[key]) {
      monthlyDataMap[key].cogs += p.cost;
    }
  });

  const monthlyChartData = Object.entries(monthlyDataMap).map(([key, data]) => {
    const d = new Date(key + '-01');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const profit = Math.max(0, data.revenue - data.cogs);
    return {
      month,
      revenue: data.revenue,
      cogs: data.cogs,
      profit,
    };
  });

  return (
    <DashboardLayout
      title="Financial Intelligence & Profit"
      subtitle="Accrual & cash revenue breakdown, cost of goods (COGS), gross margins, and profitability"
    >
      <div className="space-y-6">
        {/* Executive Profit Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-premium p-5 border-l-4 border-l-terracotta flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="font-semibold uppercase tracking-wider">Total Contract Value</span>
                <Receipt className="w-4 h-4 text-terracotta" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
                AED {totalContractValue.toLocaleString()}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border">
              Across all {orders.length} active and confirmed contracts
            </p>
          </div>

          <div className="card-premium p-5 border-l-4 border-l-sage flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="font-semibold uppercase tracking-wider">Total COGS (Procurement)</span>
                <TrendingDown className="w-4 h-4 text-sage" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
                AED {totalCOGS.toLocaleString()}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border">
              Cumulative ingredient & grocery purchase ledger
            </p>
          </div>

          <div className="card-premium p-5 border-l-4 border-l-charcoal flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="font-semibold uppercase tracking-wider">Recognized Gross Profit</span>
                <TrendingUp className="w-4 h-4 text-charcoal" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
                AED {grossProfitRecognized.toLocaleString()}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border">
              From completed & delivered event contracts
            </p>
          </div>

          <div className="card-premium p-5 border-l-4 border-l-butter flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="font-semibold uppercase tracking-wider">Outstanding Receivables</span>
                <AlertCircle className="w-4 h-4 text-warning" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-warning mt-1">
                AED {totalOutstandingBalances.toLocaleString()}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border">
              Pending event balances due upon delivery
            </p>
          </div>
        </div>

        {/* Charts: Monthly Revenue vs COGS and Revenue by Segment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trajectory Bar Chart */}
          <div className="card-premium p-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Financial Trajectory (6 Months)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Contract revenue vs ingredient expenses vs resulting gross profit
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-terracotta" />
                  <span className="text-muted-foreground">Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-sage" />
                  <span className="text-muted-foreground">COGS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-charcoal" />
                  <span className="text-muted-foreground">Gross Profit</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E3D9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#7B817B', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#7B817B', fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFEFA',
                      border: '1px solid #E7E3D9',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(32, 41, 35, 0.08)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => [`AED ${Number(val).toLocaleString()}`, name]}
                  />
                  <Bar dataKey="revenue" name="Contract Revenue" fill="#E65B45" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="cogs" name="Procurement COGS" fill="#9EAF91" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="profit" name="Gross Profit" fill="#202923" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue By Client Segment Donut Chart */}
          <div className="card-premium p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Revenue by Segment</h3>
              <p className="text-xs text-muted-foreground mb-4">Volume distribution by client type</p>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientSegmentChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {clientSegmentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFEFA',
                        border: '1px solid #E7E3D9',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`AED ${Number(val).toLocaleString()}`, 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Segment Legend */}
              <div className="space-y-2 mt-2">
                {clientSegmentChartData.map((seg) => (
                  <div key={seg.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className="font-medium text-foreground">{seg.name}</span>
                    </div>
                    <span className="font-semibold text-foreground font-mono">
                      AED {((seg.value || 0) / 1000).toFixed(0)}k
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border mt-4 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Primary Driver:</span>
              <span className="font-bold text-foreground">Weddings & Galas</span>
            </div>
          </div>
        </div>

        {/* Detailed Financial Cash Flow & Accrual Matrix */}
        <div className="card-premium p-6">
          <h3 className="font-display text-lg font-bold text-foreground mb-1">
            Cash Flow & Accounting Audit Matrix
          </h3>
          <p className="text-xs text-muted-foreground mb-5">
            Transparent comparison between signed contract revenue, collected deposits, outstanding receivables, and direct procurement costs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-secondary/40 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                1. Total Invoiced Value
              </span>
              <p className="font-display text-xl font-bold text-foreground mt-1">
                AED {totalContractValue.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">100% of event bookings</p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                2. Cash Advances Collected
              </span>
              <p className="font-display text-xl font-bold text-success mt-1">
                AED {totalAdvancesCollected.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {totalContractValue > 0
                  ? `${Math.round((totalAdvancesCollected / totalContractValue) * 100)}% of total value realized`
                  : '0%'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                3. Total Procurement (COGS)
              </span>
              <p className="font-display text-xl font-bold text-foreground mt-1">
                AED {totalCOGS.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Ingredient expenses to date
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                4. Cash-Basis Net Realized
              </span>
              <p
                className={cn(
                  'font-display text-xl font-bold mt-1',
                  cashGrossProfit >= 0 ? 'text-foreground' : 'text-destructive'
                )}
              >
                AED {cashGrossProfit.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Advances minus procurement</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
