import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, Tag, AlertTriangle, CheckCircle, XCircle, Eye, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserSupportTickets } from '../../services/support.service';
import { SupportTicket, SUPPORT_CATEGORIES, SUPPORT_PRIORITIES, SUPPORT_STATUSES } from '../../types/support';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { SupportTicketReplies } from './SupportTicketReplies';

interface SupportTicketListProps {
  onTicketSelect?: (ticket: SupportTicket) => void;
}

export const SupportTicketList: React.FC<SupportTicketListProps> = ({ onTicketSelect }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userTickets = await getUserSupportTickets(user.email || '');
      setTickets(userTickets);
    } catch (err) {
      console.error('Destek talepleri yüklenirken hata:', err);
      setError('Destek talepleri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <MessageSquare className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'closed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Bilinmiyor';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600">Destek talepleri yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center text-red-600">
          <XCircle className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
          <button
            onClick={fetchTickets}
            className="mt-4 bg-[#ffb700] text-white px-4 py-2 rounded-lg hover:bg-[#e6a600] transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <div className="bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setSelectedTicket(null)}
              className="p-2 text-gray-400 hover:text-[#ffb700] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedTicket.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                {getStatusIcon(selectedTicket.status)}
                {SUPPORT_STATUSES[selectedTicket.status]}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                <AlertTriangle className="w-3 h-3" />
                {SUPPORT_PRIORITIES[selectedTicket.priority]}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {SUPPORT_CATEGORIES[selectedTicket.category]}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(selectedTicket.createdAt)}
            </div>
          </div>
        </div>

        {/* Ticket Content */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Açıklama</h4>
          <p className="text-gray-600 whitespace-pre-wrap">{selectedTicket.description}</p>
        </div>

        {/* Replies */}
        <SupportTicketReplies
          ticket={selectedTicket}
          onReplyAdded={fetchTickets}
          isAdmin={false}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Destek Taleplerimi
          </h3>
          <span className="text-sm text-gray-500">
            {tickets.length} talep
          </span>
        </div>
        
        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'open', label: 'Açık' },
            { key: 'in_progress', label: 'İşlemde' },
            { key: 'resolved', label: 'Çözüldü' },
            { key: 'closed', label: 'Kapatıldı' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-[#ffb700] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
              {key !== 'all' && (
                <span className="ml-1">
                  ({tickets.filter(t => t.status === key).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="divide-y divide-gray-200">
        {filteredTickets.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={MessageSquare}
              title="Henüz destek talebi yok"
              description={filter === 'all' 
                ? "Henüz hiç destek talebi oluşturmamışsınız."
                : `${SUPPORT_STATUSES[filter as keyof typeof SUPPORT_STATUSES]} durumunda talep bulunmuyor.`
              }
            />
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedTicket(ticket);
                onTicketSelect?.(ticket);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900 line-clamp-1">
                      {ticket.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {SUPPORT_STATUSES[ticket.status]}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {SUPPORT_PRIORITIES[ticket.priority]}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {ticket.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {SUPPORT_CATEGORIES[ticket.category]}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(ticket.createdAt)}
                    </div>
                    {ticket.replies && ticket.replies.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {ticket.replies.length} cevap
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="ml-4">
                  <button className="p-2 text-gray-400 hover:text-[#ffb700] transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};