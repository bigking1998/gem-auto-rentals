import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mail,
  Inbox,
  Send,
  Archive,
  Trash2,
  MoreHorizontal,
  Clock,
  ArrowLeft,
  Paperclip,
  Reply,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Circle,
  Plus,
  X,
  User,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { api, Conversation, ConversationStatus, ApiError, Customer, Priority } from '@/lib/api';

const statusColors: Record<ConversationStatus, string> = {
  OPEN: 'bg-purple-100 text-purple-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const priorityColors: Record<string, string> = {
  LOW: 'text-gray-500',
  NORMAL: 'text-blue-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-500',
};

type TabFilter = 'all' | 'open' | 'resolved';

const tabs: { id: TabFilter; label: string; icon: typeof Inbox }[] = [
  { id: 'all', label: 'All', icon: Inbox },
  { id: 'open', label: 'Open', icon: Mail },
  { id: 'resolved', label: 'Resolved', icon: CheckCircle2 },
];

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New conversation modal state
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('NORMAL');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusFilter: ConversationStatus | undefined =
        activeTab === 'open' ? 'OPEN' :
        activeTab === 'resolved' ? 'RESOLVED' :
        undefined;

      const { items } = await api.conversations.list({
        status: statusFilter,
        search: searchQuery || undefined,
        limit: 50,
      });
      setConversations(items);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  // Fetch conversation detail with messages
  const fetchConversationDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const conversation = await api.conversations.get(id);
      setSelectedConversation(conversation);
      // Mark all messages as read
      await api.conversations.markAllRead(id);
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  // Fetch customers for new conversation modal
  const fetchCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const { items } = await api.customers.list({ search: customerSearch || undefined, limit: 20 });
      setCustomers(items);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [customerSearch]);

  // Create new conversation
  const handleCreateConversation = async () => {
    if (!selectedCustomer || !newMessage.trim()) return;

    setIsCreating(true);
    try {
      const conversation = await api.conversations.create({
        customerId: selectedCustomer.id,
        subject: newSubject || undefined,
        priority: newPriority,
        initialMessage: newMessage,
      });

      // Close modal and reset form
      setShowNewConversation(false);
      setSelectedCustomer(null);
      setNewSubject('');
      setNewMessage('');
      setNewPriority('NORMAL');
      setCustomerSearch('');

      // Refresh conversations and select the new one
      await fetchConversations();
      await fetchConversationDetail(conversation.id);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  // Load conversations on mount and when filters change
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch customers when modal opens or search changes
  useEffect(() => {
    if (showNewConversation) {
      const timer = setTimeout(() => {
        fetchCustomers();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showNewConversation, customerSearch, fetchCustomers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openCount = conversations.filter((c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length;

  const handleSelectConversation = async (conversation: Conversation) => {
    await fetchConversationDetail(conversation.id);
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      await api.conversations.sendMessage(selectedConversation.id, replyContent);
      setReplyContent('');
      // Refresh the conversation to show new message
      await fetchConversationDetail(selectedConversation.id);
      // Also refresh the list to update lastMessageAt
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await api.conversations.delete(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleUpdateStatus = async (conversationId: string, status: ConversationStatus) => {
    try {
      await api.conversations.update(conversationId, { status });
      // Refresh conversation if it's selected
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation((prev) => prev ? { ...prev, status } : null);
      }
      fetchConversations();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getCustomerName = (conversation: Conversation): string => {
    if (conversation.customer) {
      return `${conversation.customer.firstName} ${conversation.customer.lastName}`;
    }
    return 'Unknown Customer';
  };

  const getCustomerEmail = (conversation: Conversation): string => {
    return conversation.customer?.email || 'No email';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500">Manage customer communications</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewConversation(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Conversation</span>
          </button>
          <button
            onClick={() => fetchConversations()}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-5 h-5 text-gray-600', isLoading && 'animate-spin')} />
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)]">
        {/* Conversation List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden',
            selectedConversation ? 'hidden lg:flex lg:w-96' : 'flex-1'
          )}
        >
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-orange-100 text-primary'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'open' && openCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">
                      {openCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Mail className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium">No conversations found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((conversation, index) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelectConversation(conversation)}
                    className={cn(
                      'p-4 cursor-pointer transition-colors hover:bg-gray-50',
                      conversation.status === 'OPEN' && 'bg-orange-50/50',
                      selectedConversation?.id === conversation.id && 'bg-orange-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {getCustomerName(conversation).split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn(
                            'text-sm truncate',
                            conversation.status === 'OPEN' ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                          )}>
                            {getCustomerName(conversation)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {formatDate(new Date(conversation.lastMessageAt))}
                            </span>
                            <Circle className={cn('w-2 h-2', priorityColors[conversation.priority], 'fill-current')} />
                          </div>
                        </div>
                        <p className={cn(
                          'text-sm truncate mb-1',
                          conversation.status === 'OPEN' ? 'font-medium text-gray-900' : 'text-gray-700'
                        )}>
                          {conversation.subject || 'No subject'}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500 truncate flex-1">
                            {conversation._count?.messages || 0} messages
                          </p>
                        </div>
                        <div className="mt-2">
                          <span className={cn(
                            'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                            statusColors[conversation.status]
                          )}>
                            {conversation.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Conversation Detail */}
        {selectedConversation && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Detail Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <button
                onClick={() => setSelectedConversation(null)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                {selectedConversation.status === 'OPEN' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedConversation.id, 'RESOLVED')}
                    className="px-3 py-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Resolved
                  </button>
                )}
                {selectedConversation.status === 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedConversation.id, 'OPEN')}
                    className="px-3 py-1.5 text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    Reopen
                  </button>
                )}
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Archive className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteConversation(selectedConversation.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Conversation Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingDetail ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <>
                  {/* Customer Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium">
                      {getCustomerName(selectedConversation).split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{getCustomerName(selectedConversation)}</h3>
                          <p className="text-sm text-gray-500">{getCustomerEmail(selectedConversation)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                            statusColors[selectedConversation.status]
                          )}>
                            {selectedConversation.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedConversation.subject || 'No subject'}
                    </h2>
                    {selectedConversation.booking && (
                      <p className="text-sm text-gray-500">
                        Related to booking #{selectedConversation.booking.id.slice(0, 8)}
                      </p>
                    )}
                  </div>

                  {/* Messages Thread */}
                  <div className="space-y-4">
                    {selectedConversation.messages?.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'p-4 rounded-xl',
                          message.senderType === 'ADMIN' ? 'bg-orange-50 ml-8' : 'bg-gray-50 mr-8'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {message.senderType === 'ADMIN'
                              ? message.sender
                                ? `${message.sender.firstName} ${message.sender.lastName}`
                                : 'Admin'
                              : message.senderType === 'SYSTEM'
                                ? 'System'
                                : getCustomerName(selectedConversation)}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(new Date(message.createdAt))}
                          </span>
                        </div>
                        <div className="prose prose-sm prose-gray max-w-none">
                          {message.content.split('\n').map((paragraph, i) => (
                            <p key={i} className="text-gray-700 mb-2 last:mb-0">{paragraph}</p>
                          ))}
                        </div>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-2 text-sm">
                                <Paperclip className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{attachment.fileName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Reply Section */}
            {selectedConversation.status !== 'CLOSED' && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Reply className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Reply to {getCustomerName(selectedConversation)}</span>
                </div>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <div className="flex items-center justify-end mt-3">
                  <button
                    onClick={handleSendReply}
                    disabled={!replyContent.trim() || isSending}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Reply
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State when no conversation selected */}
        {!selectedConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hidden lg:flex flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 items-center justify-center"
          >
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the list to view messages</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* New Conversation Modal */}
      <AnimatePresence>
        {showNewConversation && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewConversation(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">New Conversation</h2>
                  <button
                    onClick={() => setShowNewConversation(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 space-y-4 max-h-[calc(90vh-140px)] overflow-y-auto">
                  {/* Customer Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Customer *
                    </label>
                    {selectedCustomer ? (
                      <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-medium">
                            {selectedCustomer.firstName?.[0]}{selectedCustomer.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {selectedCustomer.firstName} {selectedCustomer.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedCustomer(null)}
                          className="p-1 rounded-lg hover:bg-orange-100"
                        >
                          <X className="w-4 h-4 text-orange-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search customers by name or email..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                          {isLoadingCustomers ? (
                            <div className="p-4 text-center">
                              <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
                            </div>
                          ) : customers.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              No customers found
                            </div>
                          ) : (
                            customers.filter(c => c.role === 'CUSTOMER').map((customer) => (
                              <button
                                key={customer.id}
                                onClick={() => setSelectedCustomer(customer)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-medium">
                                  {customer.firstName?.[0]}{customer.lastName?.[0]}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {customer.firstName} {customer.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">{customer.email}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Booking inquiry, Support request..."
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <div className="flex gap-2">
                      {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as Priority[]).map((priority) => (
                        <button
                          key={priority}
                          onClick={() => setNewPriority(priority)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                            newPriority === priority
                              ? priority === 'LOW' ? 'bg-gray-200 text-gray-800'
                                : priority === 'NORMAL' ? 'bg-blue-100 text-blue-800'
                                : priority === 'HIGH' ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Initial Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      placeholder="Type your message to the customer..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => setShowNewConversation(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateConversation}
                    disabled={!selectedCustomer || !newMessage.trim() || isCreating}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Start Conversation
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
