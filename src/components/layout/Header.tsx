import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  Settings,
  Menu as MenuIcon,
  Database,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProfile, useSearch } from '@/hooks/api';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { setMobileMenuOpen } = useLayout();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useProfile();
  const { data: searchResults } = useSearch(searchQuery);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Close search popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out from demo session');
    navigate('/login');
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.referenceType === 'Order') {
      navigate('/orders');
    } else if (notification.referenceType === 'Inventory') {
      navigate('/inventory');
    } else if (notification.referenceType === 'Payment') {
      navigate('/payments');
    } else if (notification.referenceType === 'Purchase') {
      navigate('/purchases');
    }
  };

  const totalResultsCount =
    (searchResults?.orders.length || 0) +
    (searchResults?.menuItems.length || 0) +
    (searchResults?.inventory.length || 0) +
    (searchResults?.suppliers.length || 0);

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 sm:px-8 py-3.5">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden text-foreground hover:bg-secondary"
            aria-label="Open mobile menu"
          >
            <MenuIcon className="w-5 h-5" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-foreground leading-tight">{title}</h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-secondary-foreground bg-secondary px-2 py-0.5 rounded-full">
                <Database className="w-3 h-3 text-sage" />
                Local Demo
              </span>
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{subtitle}</p>}
          </div>
        </div>

        {/* Right: Search, Notifications & User */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Global Search */}
          <div ref={searchContainerRef} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, dishes, stock..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.length >= 2);
              }}
              onFocus={() => {
                if (searchQuery.length >= 2) setShowSearchResults(true);
              }}
              className="w-60 lg:w-72 pl-9 bg-card border-border hover:border-muted-foreground/30 focus:border-terracotta focus:ring-0 text-sm h-9 rounded-lg transition-all"
            />

            {/* Live Search Autocomplete Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full right-0 mt-2 w-96 bg-card border border-border rounded-xl shadow-elevated max-h-96 overflow-y-auto p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {totalResultsCount === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No matching records found for "{searchQuery}".
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Orders */}
                    {searchResults && searchResults.orders.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Orders
                        </p>
                        {searchResults.orders.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              navigate(item.link);
                              setShowSearchResults(false);
                            }}
                            className="px-3 py-1.5 rounded-md hover:bg-secondary cursor-pointer text-xs flex justify-between items-center"
                          >
                            <div>
                              <p className="font-semibold text-foreground">{item.title}</p>
                              <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Menu */}
                    {searchResults && searchResults.menuItems.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Menu & Costing
                        </p>
                        {searchResults.menuItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              navigate(item.link);
                              setShowSearchResults(false);
                            }}
                            className="px-3 py-1.5 rounded-md hover:bg-secondary cursor-pointer text-xs flex justify-between items-center"
                          >
                            <div>
                              <p className="font-semibold text-foreground">{item.title}</p>
                              <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inventory */}
                    {searchResults && searchResults.inventory.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Inventory Stock
                        </p>
                        {searchResults.inventory.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              navigate(item.link);
                              setShowSearchResults(false);
                            }}
                            className="px-3 py-1.5 rounded-md hover:bg-secondary cursor-pointer text-xs flex justify-between items-center"
                          >
                            <div>
                              <p className="font-semibold text-foreground">{item.title}</p>
                              <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suppliers */}
                    {searchResults && searchResults.suppliers.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Suppliers
                        </p>
                        {searchResults.suppliers.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              navigate(item.link);
                              setShowSearchResults(false);
                            }}
                            className="px-3 py-1.5 rounded-md hover:bg-secondary cursor-pointer text-xs flex justify-between items-center"
                          >
                            <div>
                              <p className="font-semibold text-foreground">{item.title}</p>
                              <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative h-9 w-9 border-border bg-card hover:bg-secondary rounded-lg"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-terracotta text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 border border-border shadow-elevated rounded-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                <div>
                  <h4 className="font-display font-semibold text-sm text-foreground">Operational Alerts</h4>
                  <p className="text-[11px] text-muted-foreground">{unreadCount} unread local events</p>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-terracotta h-auto p-1 hover:bg-terracotta-light"
                    onClick={() => markAllAsRead()}
                  >
                    Mark all read
                  </Button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto divide-y divide-border/60">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-sage" />
                    No operational alerts
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3.5 cursor-pointer hover:bg-secondary/60 transition-colors flex flex-col gap-1 ${
                        !notification.isRead ? 'bg-terracotta-light/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`font-semibold text-xs ${
                            !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {notification.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-secondary-foreground leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Pill Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 pl-2 pr-3 h-9 bg-card border-border hover:bg-secondary rounded-lg"
              >
                <div className="w-6 h-6 rounded-md bg-charcoal text-white flex items-center justify-center text-xs font-semibold">
                  {user?.firstName?.charAt(0) || 'J'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-foreground leading-tight">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium capitalize">
                    {user?.role || 'Admin'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1 border-border shadow-elevated rounded-xl">
              <div className="px-3 py-2 border-b border-border">
                <p className="font-semibold text-xs text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-sage/20 text-success uppercase">
                  {user?.role}
                </span>
              </div>

              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="cursor-pointer text-xs py-2 focus:bg-secondary"
              >
                <Settings className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <span>Business Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-xs py-2 text-destructive focus:bg-destructive-light focus:text-destructive"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                <span>Sign Out Demo</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
