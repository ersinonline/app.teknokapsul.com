import React, { useState } from 'react';
import { Send, User, Shield } from 'lucide-react';
import { SupportTicket } from '../../types/support';
import { addReplyToSupportTicket } from '../../services/support.service';
import { useAuth } from '../../contexts/AuthContext';

interface SupportTicketRepliesProps {
  ticket: SupportTicket;
  onReplyAdded: () => void;
  isAdmin?: boolean;
}

export const SupportTicketReplies: React.FC<SupportTicketRepliesProps> = ({ 
  ticket, 
  onReplyAdded, 
  isAdmin = false 
}) => {
  const { user } = useAuth();
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !user) return;

    try {
      setIsSubmitting(true);
      await addReplyToSupportTicket(
        ticket.id,
        replyMessage.trim(),
        isAdmin,
        user.displayName || user.email || 'Kullanıcı',
        user.email || ''
      );
      setReplyMessage('');
      onReplyAdded();
    } catch (error) {
      console.error('Cevap gönderilirken hata:', error);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="space-y-6">
      {/* Existing Replies */}
      {ticket.replies && ticket.replies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Konuşma Geçmişi</h4>
            <span className="text-sm text-gray-500">({ticket.replies.length} mesaj)</span>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-4">
            {ticket.replies.map((reply) => (
              <div
                key={reply.id}
                className={`p-4 rounded-xl shadow-sm ${
                  reply.isAdmin
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 ml-4'
                    : 'bg-white border border-gray-200 mr-4'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      reply.isAdmin ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                      {reply.isAdmin ? (
                        <Shield className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        {reply.isAdmin ? 'Müşteri Hizmetleri' : reply.authorName}
                      </span>
                      {reply.isAdmin && (
                        <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                          Destek Ekibi
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {formatDate(reply.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply Form */}
      <div className="bg-gray-50 rounded-xl p-6">
        <form onSubmit={handleSubmitReply} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              {isAdmin ? '🛠️ Müşteri Hizmetleri Cevabı' : '💬 Mesajınız'}
            </label>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder={isAdmin ? 'Müşteriye cevabınızı yazın...' : 'Mesajınızı buraya yazın...'}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffb700] focus:border-transparent resize-none text-gray-900 placeholder-gray-500 shadow-sm"
              disabled={isSubmitting}
            />
            <div className="mt-2 text-xs text-gray-500">
              💡 İpucu: Detaylı açıklama yaparak daha hızlı çözüm alabilirsiniz.
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {replyMessage.length}/1000 karakter
            </div>
            <button
              type="submit"
              disabled={!replyMessage.trim() || isSubmitting || replyMessage.length > 1000}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffb700] text-white rounded-xl hover:bg-[#e6a600] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? '📤 Gönderiliyor...' : '🚀 Mesaj Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};