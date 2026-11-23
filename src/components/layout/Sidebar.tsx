import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Package,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/api';
import { MiseLogo } from '@/components/brand/MiseLogo';
import { useLayout } from '@/contexts/LayoutContext';

interface NavGroup {
  label: string;
  items: {
    name: string;
    href: string;
    icon: any;
    badge?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Orders', href: '/orders', icon: ClipboardList },
    ],
  },
  {
    label: 'Kitchen & Stock',
    items: [
      { name: 'Menu & Costing', href: '/menu', icon: UtensilsCrossed },
      { name: 'Inventory', href: '/inventory', icon: Package },
      { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
    ],
  },
  {
    label: 'Financials',
    items: [
      { name: 'Profit Calculator', href: '/profit', icon: TrendingUp },
      { name: 'Payments', href: '/payments', icon: CreditCard },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useLayout();
  const { data: profile } = useProfile();

  const businessName = profile?.name || 'Mise Culinary Atelier';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50 flex flex-col transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-20' : 'w-68',
          // Mobile responsive placement
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <MiseLogo collapsed={sidebarCollapsed} light={true} />
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-sidebar-muted hover:text-white hover:bg-sidebar-accent"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business Workspace Identity */}
        {!sidebarCollapsed && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-sidebar-accent/70 border border-sidebar-border/60 flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="block font-medium text-white truncate">{businessName}</span>
              <span className="text-[10px] text-sidebar-muted uppercase tracking-wider">Live Workspace</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-sage flex-shrink-0 animate-pulse" />
          </div>
        )}

        {/* Grouped Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-5 mt-2">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!sidebarCollapsed && (
                <p className="px-3 text-[11px] font-semibold text-sidebar-muted uppercase tracking-wider mb-1.5">
                  {group.label}
                </p>
              )}

              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                      isActive
                        ? 'bg-terracotta text-white shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'
                    )}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 flex-shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-sidebar-muted group-hover:text-white'
                      )}
                    />
                    {!sidebarCollapsed && <span className="truncate">{item.name}</span>}

                    {/* Active Route Pip Indicator */}
                    {isActive && (
                      <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-butter" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Settings & Collapse Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              location.pathname === '/settings'
                ? 'bg-terracotta text-white'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white'
            )}
            title={sidebarCollapsed ? 'Settings' : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0 text-sidebar-muted" />
            {!sidebarCollapsed && <span>Settings</span>}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="hidden lg:flex w-full items-center justify-between px-3 py-2 rounded-lg text-xs text-sidebar-muted hover:bg-sidebar-accent hover:text-white transition-colors"
          >
            {!sidebarCollapsed && <span>Collapse Sidebar</span>}
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 mx-auto" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
