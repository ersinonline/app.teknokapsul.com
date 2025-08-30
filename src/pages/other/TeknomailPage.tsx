import React, { useState, useEffect } from 'react';
import { Mail, Inbox, Trash2, Star, Archive, RefreshCw, Search, Eye, Paperclip, AlertCircle } from 'lucide-react';
import { GmailService, type EmailMessage } from '../../services/gmail.service';

// Email content styling
const emailContentStyles = `
  .email-content {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .email-content img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 10px 0;
  }
  .email-content a {
    color: #2563eb;
    text-decoration: underline;
  }
  .email-content a:hover {
    color: #1d4ed8;
  }
  .email-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
  }
  .email-content td, .email-content th {
    padding: 8px;
    text-align: left;
    border: 1px solid #e5e7eb;
  }
  .email-content button, .email-content input[type="button"], .email-content input[type="submit"] {
    background-color: #dc2626;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin: 5px;
  }
  .email-content button:hover {
    background-color: #b91c1c;
  }
`;

const TeknomailPage: React.FC = () => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [error, setError] = useState<string | null>(null);

  // Gmail API configuration
  const GMAIL_CONFIG = {
    email: 'ersinnn.clk@gmail.com',
    appPassword: 'ukak wtci dafh fywq'
  };

  // Gmail service instance
  const gmailService = new GmailService(GMAIL_CONFIG);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Firebase Cloud Function HTTP endpoint kullanarak gerçek IMAP bağlantısı
      // Production ve development ortamları için dinamik URL
      const baseUrl = import.meta.env.DEV 
        ? (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
           ? `http://${window.location.hostname}:5002/superapp-37db4/us-central1` 
           : 'http://127.0.0.1:5002/superapp-37db4/us-central1')
        : 'https://us-central1-superapp-37db4.cloudfunctions.net';
      
      const response = await fetch(`${baseUrl}/fetchGmailEmails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: GMAIL_CONFIG.email,
          appPassword: GMAIL_CONFIG.appPassword,
          limit: 20
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as { success: boolean; emails: EmailMessage[]; message: string };
      console.log('Firebase function response:', data);
      console.log('Emails count:', data.emails ? data.emails.length : 0);
      console.log('First few emails:', data.emails ? data.emails.slice(0, 3) : []);
      
      if (data.success) {
        console.log('Setting emails to state:', data.emails.length);
        setEmails(data.emails);
      } else {
        console.error('Firebase function error:', data.message);
        throw new Error(data.message || 'Email getirme işlemi başarısız');
      }
    } catch (error) {
      console.error('Error loading emails:', error);
      
      // Firebase function'dan gelen hata mesajını kontrol et
      let errorMessage = 'E-postalar yüklenirken bir hata oluştu';
      if (error instanceof Error) {
        if (error.message.includes('internal')) {
          errorMessage = 'Firebase bağlantı hatası. Demo veriler gösteriliyor.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      
      // Fallback olarak demo verileri göster
      try {
        const fallbackEmails = await gmailService.fetchEmails();
        setEmails(fallbackEmails);
      } catch (fallbackError) {
        console.error('Fallback emails also failed:', fallbackError);
        setEmails([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = searchTerm === '' || 
                         email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.from.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Netflix filtrelemesi - sadece Netflix ile ilgili emailler
    const isNetflixEmail = email.subject.toLowerCase().includes('netflix') || 
                          email.from.toLowerCase().includes('netflix');
    
    switch (filter) {
      case 'unread':
        return matchesSearch && !email.isRead && isNetflixEmail;
      case 'starred':
        return matchesSearch && email.isStarred && isNetflixEmail;
      default:
        return matchesSearch && isNetflixEmail;
    }
  });
  
  console.log('Total emails:', emails.length);
  console.log('Filtered emails:', filteredEmails.length);
  console.log('Search term:', searchTerm);
  console.log('Filter:', filter);
  
  // Debug için alert ekle
  if (emails.length > 0 && filteredEmails.length === 0) {
    console.warn('Emails var ama filteredEmails boş!', {
      totalEmails: emails.length,
      searchTerm,
      filter,
      firstEmail: emails[0]
    });
  }

  const formatDate = (date: Date | string) => {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      // Eğer date geçersizse, şu anki tarihi kullan
      dateObj = new Date();
    }
    
    // Geçersiz tarih kontrolü
    if (isNaN(dateObj.getTime())) {
      return 'Geçersiz tarih';
    }
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Bugün';
    } else if (diffDays === 2) {
      return 'Dün';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} gün önce`;
    } else {
      return dateObj.toLocaleDateString('tr-TR');
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      await gmailService.markAsRead(emailId);
      setEmails(emails.map(email => 
        email.id === emailId ? { ...email, isRead: true } : email
      ));
    } catch (error) {
      console.error('Email okundu işaretleme hatası:', error);
    }
  };

  const toggleStar = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;
    
    try {
      if (email.isStarred) {
        await gmailService.unstarEmail(emailId);
      } else {
        await gmailService.starEmail(emailId);
      }
      setEmails(emails.map(e => 
        e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
      ));
    } catch (error) {
      console.error('Email yıldızlama hatası:', error);
    }
  };

  const openEmail = (email: EmailMessage) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markAsRead(email.id);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: emailContentStyles }} />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">TeknoMail</h1>
                <p className="text-gray-600">{GMAIL_CONFIG.email}</p>
              </div>
            </div>
            <button
              onClick={loadEmails}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Email List */}
          <div className={`lg:col-span-1 ${selectedEmail ? 'hidden lg:block' : 'block'}`}>
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Email ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-2 sm:py-1 rounded-full text-sm font-medium ${
                    filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tümü ({emails.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-2 sm:py-1 rounded-full text-sm font-medium ${
                    filter === 'unread' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Okunmamış ({emails.filter(e => !e.isRead).length})
                </button>
                <button
                  onClick={() => setFilter('starred')}
                  className={`px-3 py-2 sm:py-1 rounded-full text-sm font-medium ${
                    filter === 'starred' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Yıldızlı ({emails.filter(e => e.isStarred).length})
                </button>
              </div>
            </div>

            {/* Email List */}
            <div className="bg-white rounded-lg shadow-sm">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-600">Emailler yükleniyor...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 font-medium mb-2">Hata Oluştu</p>
                  <p className="text-gray-600 text-sm mb-4">{error}</p>
                  <button
                    onClick={loadEmails}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Tekrar Dene
                  </button>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="p-8 text-center">
                  <Inbox className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Email bulunamadı</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => openEmail(email)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedEmail?.id === email.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      } ${!email.isRead ? 'bg-blue-25' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(email.id);
                              }}
                              className="text-gray-400 hover:text-yellow-500"
                            >
                              <Star className={`w-4 h-4 ${email.isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            </button>
                            {email.hasAttachments && (
                              <Paperclip className="w-4 h-4 text-gray-400" />
                            )}
                            {email.id.startsWith('[Gmail]/Spam') && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full font-medium">
                                SPAM
                              </span>
                            )}
                            {!email.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <h3 className={`text-sm font-medium text-gray-900 truncate ${
                            !email.isRead ? 'font-bold' : ''
                          }`}>
                            {email.subject}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">{email.from}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{(email.textBody || email.body).replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <p className="text-xs text-gray-500">{formatDate(email.date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Email Content */}
          <div className={`lg:col-span-2 ${selectedEmail ? 'block' : 'hidden lg:block'}`}>
            {selectedEmail ? (
              <div className="bg-white rounded-lg shadow-sm">
                {/* Mobile Back Button */}
                <div className="lg:hidden p-4 border-b border-gray-200">
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Geri
                  </button>
                </div>
                {/* Email Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">{selectedEmail.subject}</h2>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 min-w-[80px]">Gönderen:</span>
                          <span className="text-gray-900">{selectedEmail.from}</span>
                        </div>
                        {selectedEmail.to && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700 min-w-[80px]">Alıcı:</span>
                            <span className="text-gray-900">{selectedEmail.to}</span>
                          </div>
                        )}
                        {selectedEmail.cc && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700 min-w-[80px]">CC:</span>
                            <span className="text-gray-900">{selectedEmail.cc}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 min-w-[80px]">Tarih:</span>
                          <span className="text-gray-900">{new Date(selectedEmail.date).toLocaleString('tr-TR')}</span>
                        </div>
                        {selectedEmail.hasAttachments && (
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{selectedEmail.attachments?.length || 0} ek dosya</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStar(selectedEmail.id)}
                        className="p-2 text-gray-400 hover:text-yellow-500 rounded-lg hover:bg-gray-100"
                      >
                        <Star className={`w-5 h-5 ${selectedEmail.isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <Archive className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Attachments */}
                  {selectedEmail.hasAttachments && selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        Ek Dosyalar ({selectedEmail.attachments.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedEmail.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-white rounded border">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{attachment.filename}</div>
                              <div className="text-xs text-gray-500">
                                {attachment.contentType} • {(attachment.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Body */}
                <div className="p-6">
                  <div className="w-full">
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="utf-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1">
                          <style>
                            body {
                              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                              margin: 0;
                              padding: 20px;
                              line-height: 1.6;
                              color: #374151;
                              background: white;
                            }
                            img {
                              max-width: 100%;
                              height: auto;
                              display: block;
                            }
                            a {
                              color: #2563eb;
                              text-decoration: underline;
                            }
                            a:hover {
                              color: #1d4ed8;
                            }
                            table {
                              width: 100%;
                              border-collapse: collapse;
                              margin: 10px 0;
                            }
                            td, th {
                              padding: 8px;
                              text-align: left;
                              border: 1px solid #e5e7eb;
                            }
                            button, input[type="button"], input[type="submit"] {
                              background-color: #dc2626;
                              color: white;
                              padding: 10px 20px;
                              border: none;
                              border-radius: 4px;
                              cursor: pointer;
                              font-size: 14px;
                              margin: 5px;
                            }
                            button:hover {
                              background-color: #b91c1c;
                            }
                          </style>
                        </head>
                        <body>
                          ${selectedEmail.body}
                        </body>
                        </html>
                      `}
                      className="w-full border-0"
                      style={{
                        minHeight: window.innerWidth < 768 ? '300px' : '400px',
                        height: 'auto'
                      }}
                      onLoad={(e) => {
                        const iframe = e.target as HTMLIFrameElement;
                        if (iframe.contentDocument) {
                          const height = iframe.contentDocument.documentElement.scrollHeight;
                          const minHeight = window.innerWidth < 768 ? 300 : 400;
                          iframe.style.height = Math.max(minHeight, height + 40) + 'px';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Email Seçin</h3>
                <p className="text-gray-600">Görüntülemek için sol taraftaki listeden bir email seçin</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Gmail Entegrasyonu</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p><strong>Email Adresi:</strong> {GMAIL_CONFIG.email}</p>
              <p><strong>Durum:</strong> <span className="text-green-600">Bağlı</span></p>
            </div>
            <div>
              <p><strong>Son Güncelleme:</strong> {new Date().toLocaleString('tr-TR')}</p>
              <p><strong>Toplam Email:</strong> {emails.length}</p>
            </div>
          </div>

        </div>
      </div>
      </div>
    </>
  );
};

export default TeknomailPage;