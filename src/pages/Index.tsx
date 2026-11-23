import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { OrderCard } from '@/components/dashboard/OrderCard';
import { RevenueChart, BestSellersChart } from '@/components/dashboard/Charts';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { QuickActions } from '@/components/dashboard/QuickActions';
import {
  ClipboardList,
  Calendar,
  Package,
  TrendingUp,
  Banknote,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStats, useOrders, useLowStockItems, useProfile } from '@/hooks/api';
import { Link } from 'react-router-dom';

export default function Index() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: lowStock = [], isLoading: lowStockLoading } = useLowStockItems();
  const { data: profile } = useProfile();

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const recentOrders = orders.slice(0, 4);

  return (
    <DashboardLayout
      title="Operations Command"
      subtitle="Real-time kitchen oversight, catering logs, and financial metrics"
    >
      <div className="space-y-6">
        {/* Editorial Welcome Header */}
        <div className="p-6 rounded-2xl bg-charcoal text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-butter bg-butter/10 px-2 py-0.5 rounded-full border border-butter/20">
                Hospitality Atelier
              </span>
              <span className="text-xs text-sidebar-muted">•</span>
              <span className="text-xs text-sidebar-muted">{todayFormatted}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back to {profile?.name || 'Mise Atelier'}
            </h2>
            <p className="text-xs sm:text-sm text-sidebar-muted mt-1 max-w-xl">
              Kitchen prep and event lines are operational. All state and transaction records are live and persisted locally in your browser.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 flex-shrink-0">
            <Link to="/orders">
              <Button className="bg-terracotta hover:bg-terracotta/90 text-white font-medium text-xs px-4 h-9 shadow-sm">
                Create Order
              </Button>
            </Link>
            <Link to="/payments">
              <Button
                variant="outline"
                className="border-sidebar-border bg-sidebar-accent/50 text-white hover:bg-sidebar-accent text-xs h-9"
              >
                Simulate Payment
              </Button>
            </Link>
          </div>

          {/* Decorative culinary background watermark */}
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-5 pointer-events-none select-none">
            <span className="font-display text-9xl font-bold">MISE</span>
          </div>
        </div>

        {/* Quick Operational Dispatch Bar */}
        <QuickActions />

        {/* Business KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          <StatCard
            title="Today's Orders"
            value={stats?.todaysOrders ?? 0}
            subtitle="Scheduled for today"
            icon={ClipboardList}
            accentColor="terracotta"
          />
          <StatCard
            title="Upcoming Events"
            value={stats?.upcomingEvents ?? 0}
            subtitle="Next 30 days"
            icon={Calendar}
            accentColor="charcoal"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Low Stock Items"
            value={stats?.lowStockCount ?? 0}
            subtitle={stats?.lowStockCount ? 'Need restocking' : 'Healthy inventory'}
            icon={Package}
            accentColor={stats?.lowStockCount ? 'warning' : 'sage'}
          />
          <StatCard
            title="Inventory Value"
            value={`AED ${(((stats?.stockValue ?? 0) / 1000).toFixed(0))}k`}
            subtitle="At current cost"
            icon={Banknote}
            accentColor="sage"
          />
          <StatCard
            title="Monthly Revenue"
            value={`AED ${(((stats?.monthlyRevenue ?? 0) / 1000).toFixed(0))}k`}
            subtitle="Current month"
            icon={TrendingUp}
            accentColor="terracotta"
            trend={{ value: 18, isPositive: true }}
          />
          <StatCard
            title="Pending Balances"
            value={`AED ${(((stats?.pendingPayments ?? 0) / 1000).toFixed(0))}k`}
            subtitle="Awaiting clearance"
            icon={AlertCircle}
            accentColor="butter"
          />
        </div>

        {/* Charts Section: Revenue Breakdown & Top Dishes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <div>
            <BestSellersChart />
          </div>
        </div>

        {/* Bottom Grid: Recent Orders & Operational Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Recent Orders</h3>
                <p className="text-xs text-muted-foreground">Active event contracts & catering inquiries</p>
              </div>
              <Link
                to="/orders"
                className="text-xs font-semibold text-terracotta hover:underline inline-flex items-center gap-1"
              >
                View all orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentOrders.length === 0 ? (
                <div className="col-span-2 card-premium p-8 text-center text-sm text-muted-foreground">
                  No orders found.
                </div>
              ) : (
                recentOrders.map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </div>
          </div>

          {/* Operational Alerts & Upcoming Banquets Column */}
          <div className="space-y-6">
            <UpcomingEvents orders={orders} />
            <LowStockAlert items={lowStock} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
