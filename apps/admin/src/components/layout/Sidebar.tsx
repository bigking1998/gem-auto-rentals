import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  CalendarDays,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Shield,
  ChevronLeft,
  X,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

export interface BadgeCounts {
  pendingBookings?: number;
  unreadMessages?: number;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  badges?: BadgeCounts;
}

const getMainNavItems = (badges?: BadgeCounts) => [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Bookings', icon: CalendarDays, href: '/bookings', badge: badges?.pendingBookings || undefined },
  { label: 'Customers', icon: Users, href: '/customers' },
  { label: 'Messages', icon: MessageSquare, href: '/messages', badge: badges?.unreadMessages || undefined },
];

const toolsNavItems = [
  { label: 'Fleet Management', icon: Car, href: '/fleet' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

const supportNavItems = [
  { label: 'Security', icon: Shield, href: '/security' },
  { label: 'Recycle Bin', icon: Trash2, href: '/trash' },
  { label: 'Help', icon: HelpCircle, href: '/help' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, badges }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const mainNavItems = getMainNavItems(badges);

  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => {
    const isActive = location.pathname === item.href;

    return (
      <Link
        to={item.href}
        onClick={onMobileClose}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        )}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-primary text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-medium rounded-full flex items-center justify-center">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const NavSection = ({ title, items }: { title: string; items: typeof mainNavItems }) => (
    <div className="mb-6">
      {!collapsed && (
        <p className="text-sidebar-foreground/50 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
          {title}
        </p>
      )}
      <nav className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>
    </div>
  );

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sidebar-foreground font-bold text-lg">Gem Auto</span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <ChevronLeft
            className={cn(
              'w-5 h-5 text-sidebar-foreground/70 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </button>
        <button
          onClick={onMobileClose}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <X className="w-5 h-5 text-sidebar-foreground/70" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 overflow-y-auto">
        <NavSection title="General" items={mainNavItems} />
        <NavSection title="Tools" items={toolsNavItems} />
        <NavSection title="Support" items={supportNavItems} />
      </div>

      {/* User */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold">
              {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : '??'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.role || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-sidebar flex flex-col z-50 transform transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-sidebar flex-col z-30 transition-all duration-300 hidden lg:flex',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
