import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  AlertTriangle,
  Search,
  RotateCcw,
  X,
  Users,
  Car,
  Calendar,
  FileText,
  MessageSquare,
  Receipt,
  Star,
  Wrench,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatDate } from '@/lib/utils';
import { api, TrashSummary, DeletedItem, TrashEntityType } from '@/lib/api';

// Entity type configuration
const entityTypes: { key: TrashEntityType; label: string; icon: typeof Users }[] = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'vehicles', label: 'Vehicles', icon: Car },
  { key: 'bookings', label: 'Bookings', icon: Calendar },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'conversations', label: 'Messages', icon: MessageSquare },
  { key: 'invoices', label: 'Invoices', icon: Receipt },
  { key: 'reviews', label: 'Reviews', icon: Star },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench },
];

export default function TrashPage() {
  const [summary, setSummary] = useState<TrashSummary | null>(null);
  const [selectedType, setSelectedType] = useState<TrashEntityType>('users');
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<DeletedItem | null>(null);
  const [emptyingTrash, setEmptyingTrash] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load summary counts
  const loadSummary = useCallback(async () => {
    try {
      const data = await api.trash.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load trash summary:', error);
      toast.error('Failed to load trash summary');
    }
  }, []);

  // Load deleted items
  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const response = await api.trash.list(selectedType, {
        search: searchQuery || undefined,
        page,
        pageSize: 20,
      });
      setItems(response.items);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load deleted items:', error);
      toast.error('Failed to load deleted items');
    } finally {
      setLoadingItems(false);
    }
  }, [selectedType, searchQuery, page]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadSummary();
      setLoading(false);
    };
    init();
  }, [loadSummary]);

  // Load items when type/search/page changes
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Reset page when type or search changes
  useEffect(() => {
    setPage(1);
  }, [selectedType, searchQuery]);

  // Handle restore
  const handleRestore = (item: DeletedItem) => {
    setRestoreTarget(item);
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;

    setShowRestoreModal(false);
    setRestoringId(restoreTarget.id);
    try {
      await api.trash.restore(selectedType, restoreTarget.id);
      toast.success('Item restored successfully');
      loadItems();
      loadSummary();
    } catch (error) {
      console.error('Failed to restore item:', error);
      toast.error('Failed to restore item');
    } finally {
      setRestoringId(null);
      setRestoreTarget(null);
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async (id: string) => {
    if (!confirm('This action cannot be undone. Are you sure you want to permanently delete this item?')) {
      return;
    }

    setDeletingId(id);
    try {
      await api.trash.permanentDelete(selectedType, id);
      toast.success('Item permanently deleted');
      loadItems();
      loadSummary();
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle empty trash
  const handleEmptyTrash = async () => {
    if (!confirm('This will permanently delete ALL items in the trash. This action cannot be undone.')) {
      return;
    }

    setEmptyingTrash(true);
    try {
      const result = await api.trash.emptyAll();
      toast.success(`Permanently deleted ${result.total} records`);
      loadItems();
      loadSummary();
    } catch (error) {
      console.error('Failed to empty trash:', error);
      toast.error('Failed to empty trash');
    } finally {
      setEmptyingTrash(false);
    }
  };

  // Render item details based on entity type
  const renderItemDetails = (item: DeletedItem) => {
    switch (selectedType) {
      case 'users':
        return (
          <div>
            <h3 className="font-semibold text-gray-900">
              {item.firstName as string} {item.lastName as string}
            </h3>
            <p className="text-sm text-gray-600">{item.email as string}</p>
            <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 rounded mt-1">
              {item.role as string}
            </span>
          </div>
        );
      case 'vehicles':
        return (
          <div>
            <h3 className="font-semibold text-gray-900">
              {item.year as number} {item.make as string} {item.model as string}
            </h3>
            <p className="text-sm text-gray-600">Plate: {item.licensePlate as string}</p>
          </div>
        );
      case 'bookings':
        return (
          <div>
            <h3 className="font-semibold text-gray-900">
              Booking #{(item.id as string).slice(0, 8)}
            </h3>
            <p className="text-sm text-gray-600">
              {(item.user as { firstName?: string; lastName?: string })?.firstName}{' '}
              {(item.user as { firstName?: string; lastName?: string })?.lastName} -{' '}
              {(item.vehicle as { make?: string; model?: string })?.make}{' '}
              {(item.vehicle as { make?: string; model?: string })?.model}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Status: {item.status as string}
            </p>
          </div>
        );
      case 'documents':
        return (
          <div>
            <h3 className="font-semibold text-gray-900">{item.fileName as string}</h3>
            <p className="text-sm text-gray-600">Type: {item.type as string}</p>
            <p className="text-xs text-gray-500">
              User: {(item.user as { email?: string })?.email}
            </p>
          </div>
        );
      case 'conversations':
        return (
          <div>
            <h3 className="font-semibold text-gray-900">
              {(item.subject as string) || 'No subject'}
            </h3>
            <p className="text-sm text-gray-600">
              Customer: {(item.customer as { firstName?: string; lastName?: string })?.firstName}{' '}
              {(item.customer as { firstName?: string; lastName?: string })?.lastName}
            </p>
            <span className={cn(
              'inline-block px-2 py-0.5 text-xs rounded mt-1',
              item.status === 'OPEN' ? 'bg-green-100 text-green-700' :
              item.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' :
              'bg-yellow-100 text-yellow-700'
            )}>
              {item.status as string}
            </span>
          </div>
        );
      case 'invoices':
        return (
          <div>
            <h3 className="font-semibold text-gray-900">
              Invoice #{item.invoiceNumber as string}
            </h3>
            <p className="text-sm text-gray-600">
              {(item.customer as { firstName?: string; lastName?: string })?.firstName}{' '}
              {(item.customer as { firstName?: string; lastName?: string })?.lastName}
            </p>
            <p className="text-xs text-gray-500">
              Total: ${Number(item.totalAmount).toFixed(2)} - Status: {item.status as string}
            </p>
          </div>
        );
      case 'reviews':
        return (
          <div>
            <h3 className="font-semibold text-gray-900">
              {item.rating as number}/5 Stars
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {(item.comment as string) || 'No comment'}
            </p>
            <p className="text-xs text-gray-500">
              {(item.vehicle as { make?: string; model?: string })?.make}{' '}
              {(item.vehicle as { make?: string; model?: string })?.model}
            </p>
          </div>
        );
      case 'maintenance':
        return (
          <div>
            <h3 className="font-semibold text-gray-900">{item.type as string}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {(item.description as string) || 'No description'}
            </p>
            <p className="text-xs text-gray-500">
              Vehicle: {(item.vehicle as { make?: string; model?: string; year?: number })?.year}{' '}
              {(item.vehicle as { make?: string; model?: string; year?: number })?.make}{' '}
              {(item.vehicle as { make?: string; model?: string; year?: number })?.model}
            </p>
          </div>
        );
      default:
        return <h3 className="font-semibold text-gray-900">Item {(item.id as string).slice(0, 8)}</h3>;
    }
  };

  // Render item card
  const renderItemCard = (item: DeletedItem) => {
    const deletedDate = formatDate(item.deletedAt);
    const isRestoring = restoringId === item.id;
    const isDeleting = deletingId === item.id;

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {renderItemDetails(item)}
            <p className="text-xs text-gray-400 mt-2">
              Deleted on {deletedDate}
            </p>
          </div>
          <div className="flex gap-2 ml-4 flex-shrink-0">
            <button
              onClick={() => handleRestore(item)}
              disabled={isRestoring || isDeleting}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
              title="Restore"
            >
              {isRestoring ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RotateCcw className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => handlePermanentDelete(item.id)}
              disabled={isRestoring || isDeleting}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Permanently Delete"
            >
              {isDeleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="w-7 h-7 text-gray-400" />
            Recycle Bin
          </h1>
          <p className="text-gray-500">
            {summary?.total || 0} deleted items - Items are permanently deleted after 30 days
          </p>
        </div>
        <button
          onClick={handleEmptyTrash}
          disabled={emptyingTrash || (summary?.total || 0) === 0}
          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {emptyingTrash ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          Empty Trash
        </button>
      </motion.div>

      {/* Entity Type Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100"
      >
        <div className="flex flex-wrap gap-2">
          {entityTypes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2',
                selectedType === key
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {summary && summary[key] > 0 && (
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {summary[key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search deleted ${selectedType}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </motion.div>

      {/* Items Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {loadingItems ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No deleted {selectedType}
            </h3>
            <p className="text-gray-500">
              Items you delete will appear here for 30 days before being permanently removed.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map(renderItemCard)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Restore Confirmation Modal */}
      <AnimatePresence>
        {showRestoreModal && restoreTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowRestoreModal(false);
                setRestoreTarget(null);
              }}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <h2 className="text-lg font-semibold">Restore Item</h2>
                    </div>
                    <button
                      onClick={() => {
                        setShowRestoreModal(false);
                        setRestoreTarget(null);
                      }}
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    {renderItemDetails(restoreTarget)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to restore this item? It will be moved back to its original location.
                  </p>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowRestoreModal(false);
                      setRestoreTarget(null);
                    }}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRestore}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Yes, Restore
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
