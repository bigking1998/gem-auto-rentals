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
    if (
      !confirm(
        'This action cannot be undone. Are you sure you want to permanently delete this item?'
      )
    ) {
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
    if (
      !confirm('This will permanently delete ALL items in the trash. This action cannot be undone.')
    ) {
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
            <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs">
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
            <p className="mt-1 text-xs text-gray-500">Status: {item.status as string}</p>
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
            <span
              className={cn(
                'mt-1 inline-block rounded px-2 py-0.5 text-xs',
                item.status === 'OPEN'
                  ? 'bg-green-100 text-green-700'
                  : item.status === 'CLOSED'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-yellow-100 text-yellow-700'
              )}
            >
              {item.status as string}
            </span>
          </div>
        );
      case 'invoices':
        return (
          <div>
            <h3 className="font-semibold text-gray-900">Invoice #{item.invoiceNumber as string}</h3>
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
            <h3 className="font-semibold text-gray-900">{item.rating as number}/5 Stars</h3>
            <p className="line-clamp-2 text-sm text-gray-600">
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
            <p className="line-clamp-2 text-sm text-gray-600">
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
        return (
          <h3 className="font-semibold text-gray-900">Item {(item.id as string).slice(0, 8)}</h3>
        );
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
        className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            {renderItemDetails(item)}
            <p className="mt-2 text-xs text-gray-400">Deleted on {deletedDate}</p>
          </div>
          <div className="ml-4 flex flex-shrink-0 gap-2">
            <button
              onClick={() => handleRestore(item)}
              disabled={isRestoring || isDeleting}
              className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50"
              title="Restore"
            >
              {isRestoring ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RotateCcw className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => handlePermanentDelete(item.id)}
              disabled={isRestoring || isDeleting}
              className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              title="Permanently Delete"
            >
              {isDeleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-primary-ink h-8 w-8 animate-spin" />
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
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Trash2 className="h-7 w-7 text-gray-400" />
            Recycle Bin
          </h1>
          <p className="text-gray-500">
            {summary?.total || 0} deleted items - Items are permanently deleted after 30 days
          </p>
        </div>
        <button
          onClick={handleEmptyTrash}
          disabled={emptyingTrash || (summary?.total || 0) === 0}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {emptyingTrash ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          Empty Trash
        </button>
      </motion.div>

      {/* Entity Type Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm"
      >
        <div className="flex flex-wrap gap-2">
          {entityTypes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                selectedType === key
                  ? 'bg-accent text-primary-ink'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {summary && summary[key] > 0 && (
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
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
        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search deleted ${selectedType}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:ring-primary w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2"
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
          <div className="rounded-2xl bg-white p-12 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-gray-400" />
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center">
            <Trash2 className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No deleted {selectedType}</h3>
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
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="fixed inset-0 z-50 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                        <RotateCcw className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-semibold">Restore Item</h2>
                    </div>
                    <button
                      onClick={() => {
                        setShowRestoreModal(false);
                        setRestoreTarget(null);
                      }}
                      className="rounded-lg p-2 transition-colors hover:bg-white/20"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4 p-6">
                  <div className="rounded-xl bg-gray-50 p-3">
                    {renderItemDetails(restoreTarget)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to restore this item? It will be moved back to its
                    original location.
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                  <button
                    onClick={() => {
                      setShowRestoreModal(false);
                      setRestoreTarget(null);
                    }}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRestore}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                  >
                    <RotateCcw className="h-4 w-4" />
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
