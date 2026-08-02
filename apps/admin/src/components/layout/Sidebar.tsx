import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MailPlus,
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
  {
    label: 'Bookings',
    icon: CalendarDays,
    href: '/bookings',
    badge: badges?.pendingBookings || undefined,
  },
  { label: 'Customers', icon: Users, href: '/customers' },
  { label: 'Waiting List', icon: MailPlus, href: '/waiting-list' },
  {
    label: 'Messages',
    icon: MessageSquare,
    href: '/messages',
    badge: badges?.unreadMessages || undefined,
  },
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

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  badges,
}: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const mainNavItems = getMainNavItems(badges);

  const NavItem = ({ item }: { item: (typeof mainNavItems)[0] }) => {
    // Highlight the section on nested routes too (/fleet/new, /customers/:id …).
    // '/' is exact-only, otherwise it would match every route.
    const isActive =
      item.href === '/'
        ? location.pathname === '/'
        : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

    return (
      <Link
        to={item.href}
        onClick={onMobileClose}
        className={cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className="bg-primary text-primary-foreground ml-auto rounded-full px-2 py-0.5 text-xs font-medium">
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge && (
          <span className="bg-primary text-primary-foreground absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const NavSection = ({ title, items }: { title: string; items: typeof mainNavItems }) => (
    <div className="mb-6">
      {!collapsed && (
        <p className="text-sidebar-foreground/50 mb-2 px-3 text-xs font-semibold uppercase tracking-wider">
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
      <div className="border-sidebar-border flex h-16 items-center justify-between border-b px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="from-primary-light to-primary-dark flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br">
            <Car className="text-primary-foreground h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="text-sidebar-foreground text-lg font-bold">Gem Auto</span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="hover:bg-sidebar-accent hidden h-8 w-8 items-center justify-center rounded-lg transition-colors lg:flex"
        >
          <ChevronLeft
            className={cn(
              'text-sidebar-foreground/70 h-5 w-5 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </button>
        <button
          onClick={onMobileClose}
          className="hover:bg-sidebar-accent flex h-8 w-8 items-center justify-center rounded-lg transition-colors lg:hidden"
        >
          <X className="text-sidebar-foreground/70 h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-6">
        <NavSection title="General" items={mainNavItems} />
        <NavSection title="Tools" items={toolsNavItems} />
        <NavSection title="Support" items={supportNavItems} />
      </div>

      {/* User */}
      {!collapsed && (
        <div className="border-sidebar-border border-t p-4">
          <div className="flex items-center gap-3">
            <div className="from-primary-light to-primary-dark text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br font-semibold">
              {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : '??'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sidebar-foreground truncate text-sm font-medium">
                {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
              </p>
              <p className="text-sidebar-foreground/60 truncate text-xs">
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
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onMobileClose} />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'bg-sidebar fixed left-0 top-0 z-50 flex h-full w-64 transform flex-col transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'bg-sidebar fixed left-0 top-0 z-30 hidden h-full flex-col transition-all duration-300 lg:flex',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
