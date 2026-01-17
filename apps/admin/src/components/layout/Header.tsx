import { useState } from 'react';
import { Menu, Search, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search */}
          <div
            className={cn(
              'hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg transition-all',
              searchFocused && 'ring-2 ring-indigo-500 bg-white'
            )}
          >
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm w-48 lg:w-64"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 bg-white rounded border border-gray-200">
              <span>⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Settings */}
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {/* User Avatar */}
          <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
              JD
            </div>
            <span className="hidden lg:block text-sm font-medium text-gray-700">John Doe</span>
          </button>
        </div>
      </div>
    </header>
  );
}
