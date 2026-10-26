import { useState, useEffect, useCallback } from 'react';
import { Mail, Loader2, AlertCircle, Check, RefreshCw, Inbox } from 'lucide-react';
import { api, ApiError, type ContactMessage } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

type Filter = 'unhandled' | 'handled' | 'all';

/**
 * Messages sent from the website's "Contact us" form.
 *
 * This exists because the question "where do I see it when somebody sends us a
 * message?" had no good answer. The contact form used to open the visitor's own
 * mail client, so nothing was ever stored. It now posts to the API, and this is
 * where those messages land.
 *
 * Note the deliberate split, which is worth knowing when looking for a message:
 *   - Website contact form  -> here
 *   - Live chat and texts   -> GoHighLevel Conversations, not this dashboard
 * The "Messages" page in this sidebar reads a different table again and is not
 * connected to either.
 */
export default function EnquiriesPage() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<Filter>('unhandled');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.contact.list(filter === 'all' ? undefined : filter === 'handled');
      setItems(res.items);
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : 'Could not load enquiries. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const markHandled = async (id: string, handled: boolean) => {
    try {
      setUpdating(id);
      await api.contact.update(id, { handled });
      setItems((prev) =>
        filter === 'all'
          ? prev.map((m) => (m.id === id ? { ...m, handled } : m))
          : prev.filter((m) => m.id !== id)
      );
    } catch {
      setError('Could not update that enquiry.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Enquiries</h1>
          <p className="text-gray-500">Messages sent from the contact form on the website</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>Live chat and text messages are not here.</strong> Those go to GoHighLevel &rarr;
        Conversations. This page is only the website contact form.
      </div>

      <div className="flex gap-2">
        {(['unhandled', 'handled', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {f === 'unhandled' ? 'Needs a reply' : f}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-8 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading enquiries…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-900">
            {filter === 'unhandled' ? 'Nothing waiting for a reply' : 'No enquiries yet'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Messages from the website contact form will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div
              key={m.id}
              className={cn(
                'rounded-xl border bg-white p-5 transition-colors',
                m.handled ? 'border-gray-100' : 'border-primary/30 bg-accent/30'
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(
                      'Re: ' + (m.subject || 'your enquiry')
                    )}`}
                    className="text-primary-ink break-all text-sm hover:underline"
                  >
                    {m.email}
                  </a>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{formatDate(m.createdAt)}</p>
                  {m.subject && (
                    <p className="mt-0.5 text-sm font-medium text-gray-700">{m.subject}</p>
                  )}
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap border-l-2 border-gray-200 pl-3 text-sm text-gray-700">
                {m.message}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => markHandled(m.id, !m.handled)}
                  disabled={updating === m.id}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
                    m.handled
                      ? 'text-gray-600 hover:bg-gray-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  )}
                >
                  {updating === m.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {m.handled ? 'Mark as needing a reply' : 'Mark as handled'}
                </button>
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(
                    'Re: ' + (m.subject || 'your enquiry')
                  )}`}
                  className="text-primary-ink inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100"
                >
                  <Mail className="h-4 w-4" />
                  Reply by email
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
