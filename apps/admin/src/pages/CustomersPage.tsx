import { useState } from 'react';
import { Search, MoreHorizontal, Mail, Phone, Calendar } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

// Mock data
const customers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 123-4567',
    role: 'CUSTOMER',
    verified: true,
    totalBookings: 5,
    totalSpent: 1250,
    createdAt: new Date('2025-06-15'),
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    phone: '+1 (555) 234-5678',
    role: 'CUSTOMER',
    verified: true,
    totalBookings: 3,
    totalSpent: 2100,
    createdAt: new Date('2025-08-20'),
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@example.com',
    phone: '+1 (555) 345-6789',
    role: 'CUSTOMER',
    verified: false,
    totalBookings: 1,
    totalSpent: 360,
    createdAt: new Date('2026-01-10'),
  },
  {
    id: '4',
    name: 'David Thompson',
    email: 'david.t@example.com',
    phone: '+1 (555) 456-7890',
    role: 'CUSTOMER',
    verified: true,
    totalBookings: 8,
    totalSpent: 4500,
    createdAt: new Date('2025-03-05'),
  },
  {
    id: '5',
    name: 'Lisa Wang',
    email: 'lisa.wang@example.com',
    phone: '+1 (555) 567-8901',
    role: 'CUSTOMER',
    verified: true,
    totalBookings: 2,
    totalSpent: 450,
    createdAt: new Date('2025-11-28'),
  },
];

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500">Manage your customer accounts</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {customer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <div className="flex items-center gap-1">
                    {customer.verified ? (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Joined {formatDate(customer.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{customer.totalBookings}</p>
                <p className="text-xs text-gray-500">Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">${customer.totalSpent}</p>
                <p className="text-xs text-gray-500">Total Spent</p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No customers found</h3>
          <p className="text-gray-500">Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
}
