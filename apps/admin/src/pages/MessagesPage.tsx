import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Mail,
  Star,
  StarOff,
  Inbox,
  Send,
  Archive,
  Trash2,
  MoreHorizontal,
  Clock,
  ArrowLeft,
  Paperclip,
  Reply,
  Forward,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface Message {
  id: string;
  from: {
    name: string;
    email: string;
    avatar?: string;
  };
  subject: string;
  preview: string;
  content: string;
  type: 'inquiry' | 'support' | 'booking' | 'system';
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  receivedAt: Date;
}

// Mock messages data
const mockMessages: Message[] = [
  {
    id: '1',
    from: { name: 'Sarah Johnson', email: 'sarah.johnson@example.com' },
    subject: 'Question about my upcoming reservation',
    preview: "Hi, I wanted to ask about the pickup location for my reservation next week...",
    content: "Hi,\n\nI wanted to ask about the pickup location for my reservation next week. Is it possible to arrange an airport pickup instead of the downtown location?\n\nAlso, I noticed that the vehicle I booked (Toyota Camry) might not have a GPS navigation system. Could you confirm if this feature is included or if I need to add it separately?\n\nThank you for your help!\n\nBest regards,\nSarah Johnson",
    type: 'inquiry',
    isRead: false,
    isStarred: true,
    hasAttachment: false,
    receivedAt: new Date('2026-01-18T10:30:00'),
  },
  {
    id: '2',
    from: { name: 'Michael Chen', email: 'michael.chen@example.com' },
    subject: 'Booking Confirmation Request',
    preview: "Could you please send me a confirmation email for booking #BK002?",
    content: "Hello,\n\nCould you please send me a confirmation email for booking #BK002? I need it for my expense report at work.\n\nThe booking is for the BMW 5 Series from January 19-25.\n\nThank you,\nMichael Chen",
    type: 'booking',
    isRead: false,
    isStarred: false,
    hasAttachment: false,
    receivedAt: new Date('2026-01-18T09:15:00'),
  },
  {
    id: '3',
    from: { name: 'System', email: 'noreply@gemauto.com' },
    subject: 'New booking received - #BK009',
    preview: "A new booking has been received and is pending confirmation...",
    content: "A new booking has been received and is pending confirmation.\n\nBooking Details:\n- Customer: Emily Rodriguez\n- Vehicle: 2024 Tesla Model 3\n- Dates: January 17-20, 2026\n- Total: $360.00\n\nPlease review and confirm the booking in your dashboard.",
    type: 'system',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    receivedAt: new Date('2026-01-17T14:00:00'),
  },
  {
    id: '4',
    from: { name: 'Emily Rodriguez', email: 'emily.r@example.com' },
    subject: 'Issue with vehicle return',
    preview: "I need help with returning the vehicle at a different location than originally planned...",
    content: "Hi Support Team,\n\nI need help with returning the vehicle at a different location than originally planned. Due to a change in my travel plans, I will be in Coral Gables instead of downtown Miami.\n\nIs it possible to return the Tesla Model 3 at your Coral Gables location? If there's an additional fee, please let me know.\n\nThanks,\nEmily",
    type: 'support',
    isRead: true,
    isStarred: true,
    hasAttachment: false,
    receivedAt: new Date('2026-01-17T11:30:00'),
  },
  {
    id: '5',
    from: { name: 'David Kim', email: 'david.kim@example.com' },
    subject: 'RE: Insurance documentation',
    preview: "Attached is the insurance documentation you requested for my rental...",
    content: "Hi,\n\nAttached is the insurance documentation you requested for my rental next month. Please let me know if you need any additional information.\n\nBest,\nDavid Kim",
    type: 'inquiry',
    isRead: true,
    isStarred: false,
    hasAttachment: true,
    receivedAt: new Date('2026-01-16T16:45:00'),
  },
  {
    id: '6',
    from: { name: 'System', email: 'noreply@gemauto.com' },
    subject: 'Payment received - Booking #BK007',
    preview: "Payment of $225.00 has been successfully processed...",
    content: "Payment of $225.00 has been successfully processed for booking #BK007.\n\nPayment Details:\n- Amount: $225.00\n- Method: Credit Card (****4242)\n- Transaction ID: TXN-789456\n- Date: January 16, 2026\n\nThank you for choosing Gem Auto Rentals!",
    type: 'system',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    receivedAt: new Date('2026-01-16T10:00:00'),
  },
];

const typeColors: Record<string, string> = {
  inquiry: 'bg-purple-100 text-purple-800',
  support: 'bg-orange-100 text-orange-800',
  booking: 'bg-green-100 text-green-800',
  system: 'bg-gray-100 text-gray-800',
};

const tabs = [
  { id: 'all', label: 'All', icon: Inbox },
  { id: 'unread', label: 'Unread', icon: Mail },
  { id: 'starred', label: 'Starred', icon: Star },
];

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.preview.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'unread' && !message.isRead) ||
      (activeTab === 'starred' && message.isStarred);

    return matchesSearch && matchesTab;
  });

  const unreadCount = messages.filter((m) => !m.isRead).length;

  const handleToggleStar = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, isStarred: !m.isStarred } : m
      )
    );
  };

  const handleMarkAsRead = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, isRead: true } : m
      )
    );
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    handleMarkAsRead(message.id);
  };

  const handleSendReply = () => {
    if (replyContent.trim()) {
      console.log('Sending reply:', replyContent);
      setReplyContent('');
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500">Manage customer communications</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)]">
        {/* Message List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden',
            selectedMessage ? 'hidden lg:flex lg:w-96' : 'flex-1'
          )}
        >
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
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
                  {tab.id === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Mail className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium">No messages found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelectMessage(message)}
                    className={cn(
                      'p-4 cursor-pointer transition-colors hover:bg-gray-50',
                      !message.isRead && 'bg-orange-50/50',
                      selectedMessage?.id === message.id && 'bg-orange-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {message.from.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn(
                            'text-sm truncate',
                            !message.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                          )}>
                            {message.from.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {formatDate(message.receivedAt)}
                            </span>
                            <button
                              onClick={(e) => handleToggleStar(message.id, e)}
                              className="p-1 rounded hover:bg-gray-200"
                            >
                              {message.isStarred ? (
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              ) : (
                                <StarOff className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className={cn(
                          'text-sm truncate mb-1',
                          !message.isRead ? 'font-medium text-gray-900' : 'text-gray-700'
                        )}>
                          {message.subject}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500 truncate flex-1">
                            {message.preview}
                          </p>
                          {message.hasAttachment && (
                            <Paperclip className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="mt-2">
                          <span className={cn(
                            'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                            typeColors[message.type]
                          )}>
                            {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
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

        {/* Message Detail */}
        {selectedMessage && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Detail Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <button
                onClick={() => setSelectedMessage(null)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Archive className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Message Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium">
                  {selectedMessage.from.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedMessage.from.name}</h3>
                      <p className="text-sm text-gray-500">{selectedMessage.from.email}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatDate(selectedMessage.receivedAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedMessage.subject}</h2>
                <span className={cn(
                  'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                  typeColors[selectedMessage.type]
                )}>
                  {selectedMessage.type.charAt(0).toUpperCase() + selectedMessage.type.slice(1)}
                </span>
              </div>

              <div className="prose prose-gray max-w-none">
                {selectedMessage.content.split('\n').map((paragraph, i) => (
                  <p key={i} className="text-gray-700 mb-3">{paragraph}</p>
                ))}
              </div>

              {selectedMessage.hasAttachment && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Paperclip className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Attachment</p>
                      <p className="text-xs text-gray-500">insurance_doc.pdf (245 KB)</p>
                    </div>
                    <button className="px-3 py-1.5 text-sm text-primary hover:bg-orange-50 rounded-lg transition-colors">
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reply Section */}
            {selectedMessage.type !== 'system' && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Reply className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Reply to {selectedMessage.from.name}</span>
                </div>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Paperclip className="w-4 h-4" />
                    Attach
                  </button>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                      <Forward className="w-4 h-4" />
                      Forward
                    </button>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyContent.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      <Send className="w-4 h-4" />
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State when no message selected */}
        {!selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hidden lg:flex flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 items-center justify-center"
          >
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Select a message</h3>
              <p className="text-gray-500">Choose a message from the list to read it</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
