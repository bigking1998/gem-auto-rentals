import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Mail,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Users,
  UserPlus,
  Trash2,
  BellOff,
  BellRing,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, tokenManager } from '@/lib/api';

type Subscriber = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  interestCategory: string | null;
  timeframe: string | null;
  source: string | null;
  createdAt: string;
  lastEmailedAt: string | null;
  emailsReceived: number;
  profileCompletedAt: string | null;
};

const INTERESTS = ['ECONOMY', 'STANDARD', 'PREMIUM', 'LUXURY', 'SUV', 'VAN'];

const TIMEFRAME_LABEL: Record<string, string> = {
  THIS_WEEK: 'This week',
  THIS_MONTH: 'This month',
  NEXT_FEW_MONTHS: 'Next few months',
  JUST_BROWSING: 'Browsing',
};

const STATUS_STYLE: Record<string, string> = {
  SUBSCRIBED: 'bg-green-100 text-green-800',
  UNSUBSCRIBED: 'bg-gray-100 text-gray-700',
  SUPPRESSED: 'bg-red-100 text-red-800',
  CONVERTED: 'bg-accent text-accent-foreground',
};

export default function WaitingListPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [interest, setInterest] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    interestCategory: '',
    timeframe: '',
    adminNotes: '',
    sendWelcome: true,
  });

  const [composerOpen, setComposerOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.waitlist.list({
        search: search || undefined,
        interest: interest || undefined,
        limit: 200,
      });
      setSubscribers(data.items);
      setStats(data.stats);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the waiting list');
    } finally {
      setLoading(false);
    }
  }, [search, interest]);

  // debounce so typing in search does not fire a request per keystroke
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  // Only SUBSCRIBED people can actually be emailed; selecting an unsubscribed
  // row and seeing it silently dropped later would be worse than not offering it.
  const emailable = useMemo(
    () => subscribers.filter((s) => s.status === 'SUBSCRIBED'),
    [subscribers]
  );
  const selectedEmailable = useMemo(
    () => emailable.filter((s) => selected.has(s.id)),
    [emailable, selected]
  );
  const recipientCount = selected.size > 0 ? selectedEmailable.length : emailable.length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === emailable.length ? new Set() : new Set(emailable.map((s) => s.id))
    );

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and message are both required');
      return;
    }
    setSending(true);
    try {
      const ids = selected.size > 0 ? selectedEmailable.map((s) => s.id) : undefined;
      const res = await api.waitlist.sendCampaign(subject.trim(), body.trim(), ids);
      if (res.failed > 0) {
        toast.warning(`Sent to ${res.sent} of ${res.total}. ${res.failed} failed.`);
      } else {
        toast.success(`Sent to ${res.sent} ${res.sent === 1 ? 'person' : 'people'}`);
      }
      setComposerOpen(false);
      setSubject('');
      setBody('');
      setSelected(new Set());
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const addPerson = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are both required');
      return;
    }
    setAdding(true);
    try {
      await api.waitlist.addManual({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        interestCategory: form.interestCategory || undefined,
        timeframe: form.timeframe || undefined,
        adminNotes: form.adminNotes.trim() || undefined,
        sendWelcome: form.sendWelcome,
      });
      toast.success(`${form.name.trim()} added to the waiting list`);
      setAddOpen(false);
      setForm({
        name: '',
        email: '',
        phone: '',
        interestCategory: '',
        timeframe: '',
        adminNotes: '',
        sendWelcome: true,
      });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add that person');
    } finally {
      setAdding(false);
    }
  };

  const toggleSubscribed = async (s: Subscriber) => {
    const next = s.status === 'SUBSCRIBED' ? 'UNSUBSCRIBED' : 'SUBSCRIBED';
    try {
      await api.waitlist.setStatus(s.id, next);
      toast.success(
        next === 'UNSUBSCRIBED' ? `${s.name} will no longer be emailed` : `${s.name} re-subscribed`
      );
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update that person');
    }
  };

  const removePerson = async (s: Subscriber) => {
    // Deletion is permanent and loses the consent record, so make the softer
    // option explicit rather than letting someone reach for delete by default.
    if (
      !window.confirm(
        `Permanently delete ${s.name} (${s.email})?\n\nThis cannot be undone. If you only want to stop emailing them, use Unsubscribe instead.`
      )
    ) {
      return;
    }
    try {
      await api.waitlist.remove(s.id);
      toast.success(`${s.name} removed`);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(s.id);
        return next;
      });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete that person');
    }
  };

  const exportCsv = async () => {
    try {
      // fetch directly so the auth header is attached; a bare <a> would 401
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/api$/, '');
      const res = await fetch(`${base}/api/waitlist/export.csv`, {
        headers: { Authorization: `Bearer ${tokenManager.getToken()}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gem-waiting-list-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch {
      toast.error('Could not export the list');
    }
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waiting List</h1>
          <p className="mt-1 text-gray-500">
            {total} {total === 1 ? 'person' : 'people'} signed up
            {stats.SUBSCRIBED !== undefined && ` · ${stats.SUBSCRIBED} contactable`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <UserPlus className="h-4 w-4" />
            Add person
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => setComposerOpen(true)}
            disabled={recipientCount === 0}
            className="bg-primary text-primary-foreground hover:bg-primary-dark inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            Email {selected.size > 0 ? `${recipientCount} selected` : 'everyone'}
          </button>
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone"
            className="focus:ring-primary w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          />
        </div>
        <select
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="focus:ring-primary rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2"
        >
          <option value="">All vehicle types</option>
          {INTERESTS.map((i) => (
            <option key={i} value={i}>
              {i.charAt(0) + i.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="text-primary-ink h-7 w-7 animate-spin" />
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center">
            <AlertCircle className="mx-auto mb-3 h-9 w-9 text-red-400" />
            <p className="mb-4 font-medium text-gray-700">{error}</p>
            <button
              onClick={load}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold"
            >
              Try again
            </button>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Users className="mx-auto mb-3 h-9 w-9 text-gray-300" />
            <p className="font-medium text-gray-700">
              {search || interest ? 'No one matches those filters' : 'No signups yet'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {search || interest
                ? 'Try clearing the search or filter.'
                : 'Signups from gemrentalcars.com/waitinglist will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={emailable.length > 0 && selected.size === emailable.length}
                      onChange={toggleAll}
                      aria-label="Select all contactable subscribers"
                      className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Looking for</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Joined</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscribers.map((s) => {
                  const canEmail = s.status === 'SUBSCRIBED';
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggle(s.id)}
                          disabled={!canEmail}
                          aria-label={`Select ${s.name}`}
                          title={canEmail ? undefined : 'This person cannot be emailed'}
                          className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300 disabled:opacity-40"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{s.name}</div>
                        {s.emailsReceived > 0 && (
                          <div className="text-xs text-gray-400">
                            {s.emailsReceived} email{s.emailsReceived === 1 ? '' : 's'} sent
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{s.email}</div>
                        {s.phone && <div className="text-xs text-gray-400">{s.phone}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {s.interestCategory ? (
                          <div>
                            <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                              {s.interestCategory.charAt(0) +
                                s.interestCategory.slice(1).toLowerCase()}
                            </span>
                            {s.timeframe && (
                              <div className="mt-1 text-xs text-gray-400">
                                {TIMEFRAME_LABEL[s.timeframe] ?? s.timeframe}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {s.status !== 'SUPPRESSED' && (
                            <button
                              onClick={() => toggleSubscribed(s)}
                              title={canEmail ? 'Stop emailing this person' : 'Re-subscribe'}
                              aria-label={
                                canEmail ? `Unsubscribe ${s.name}` : `Re-subscribe ${s.name}`
                              }
                              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                            >
                              {canEmail ? (
                                <BellOff className="h-4 w-4" />
                              ) : (
                                <BellRing className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => removePerson(s)}
                            title="Delete permanently"
                            aria-label={`Delete ${s.name}`}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* add person */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add to the waiting list</h2>
                <p className="mt-1 text-sm text-gray-500">
                  For someone who signed up by phone, in person or on paper.
                </p>
              </div>
              <button
                onClick={() => setAddOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="a-name"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="a-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label
                    htmlFor="a-phone"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Phone
                  </label>
                  <input
                    id="a-phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2"
                    placeholder="813-555-0142"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="a-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="a-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2"
                  placeholder="jane@example.com"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="a-interest"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Looking for
                  </label>
                  <select
                    id="a-interest"
                    value={form.interestCategory}
                    onChange={(e) => setForm({ ...form, interestCategory: e.target.value })}
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2"
                  >
                    <option value="">Not specified</option>
                    {INTERESTS.map((i) => (
                      <option key={i} value={i}>
                        {i.charAt(0) + i.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="a-time"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Needs it
                  </label>
                  <select
                    id="a-time"
                    value={form.timeframe}
                    onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2"
                  >
                    <option value="">Not specified</option>
                    {Object.entries(TIMEFRAME_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="a-notes" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Private note{' '}
                  <span className="font-normal text-gray-400">(only you see this)</span>
                </label>
                <textarea
                  id="a-notes"
                  rows={2}
                  value={form.adminNotes}
                  onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
                  className="focus:ring-primary w-full resize-y rounded-xl border border-gray-200 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2"
                  placeholder="Called the shop on Tuesday, wants something for a work trip"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-gray-50 p-3.5">
                <input
                  type="checkbox"
                  checked={form.sendWelcome}
                  onChange={(e) => setForm({ ...form, sendWelcome: e.target.checked })}
                  className="text-primary focus:ring-primary mt-0.5 h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  Send them the welcome email
                  <span className="mt-0.5 block text-xs text-gray-500">
                    Turn this off if they would not expect an email from a phone conversation.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 p-6">
              <button
                onClick={() => setAddOpen(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={addPerson}
                disabled={adding || !form.name.trim() || !form.email.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary-dark inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Add to list
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* composer */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Email the waiting list</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Going to{' '}
                  <span className="text-primary-ink font-semibold">
                    {recipientCount} {recipientCount === 1 ? 'person' : 'people'}
                  </span>
                  {selected.size > 0 ? ' (your selection)' : ' (everyone contactable)'}
                </p>
              </div>
              <button
                onClick={() => setComposerOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label
                  htmlFor="c-subject"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Subject
                </label>
                <input
                  id="c-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Vehicles are now available"
                  className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label htmlFor="c-body" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="c-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={9}
                  placeholder={
                    'Good news — we have vehicles ready to rent.\n\nHead to the site to see the fleet and book yours.'
                  }
                  className="focus:ring-primary w-full resize-y rounded-xl border border-gray-200 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2"
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  Each person gets their own email addressed to them by first name. Your branding,
                  an unsubscribe link and the business address are added automatically.
                </p>
              </div>

              {recipientCount > 90 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <p className="text-sm text-amber-800">
                    That is {recipientCount} emails. Free Resend accounts allow roughly 100 per day
                    — sends beyond that may fail.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 p-6">
              <button
                onClick={() => setComposerOpen(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={send}
                disabled={sending || !subject.trim() || !body.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary-dark inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Send to {recipientCount}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
