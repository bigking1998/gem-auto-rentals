import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { BadgeCounts } from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [badges, setBadges] = useState<BadgeCounts>({});

  const fetchBadgeCounts = useCallback(async () => {
    try {
      // Fetch total bookings count
      const bookingsResponse = await api.bookings.list({ limit: 1 });
      const totalBookings = (bookingsResponse.data as { total?: number })?.total || 0;

      // Fetch open conversations count
      const conversationsResponse = await api.conversations.list({ status: 'OPEN', limit: 1 });
      const openConversations = (conversationsResponse.data as { total?: number })?.total || 0;

      setBadges({
        pendingBookings: totalBookings > 0 ? totalBookings : undefined,
        unreadMessages: openConversations > 0 ? openConversations : undefined,
      });
    } catch (error) {
      console.error('Failed to fetch badge counts:', error);
    }
  }, []);

  useEffect(() => {
    fetchBadgeCounts();
    // Refresh badge counts every 30 seconds
    const interval = setInterval(fetchBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchBadgeCounts]);

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        badges={badges}
      />

      {/* Main Content */}
      <div
        className={cn(
          'fixed inset-0 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'
        )}
      >
        <Header
          onMenuClick={() => setMobileSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
