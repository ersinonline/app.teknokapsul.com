import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { portfolioService } from '../../services/portfolio.service';
import { PortfolioItem } from '../../types/portfolio';
import { formatCurrency } from '../../utils/currency';
import { queryUserStatus } from '../../services/ai.service';
import { applicationService } from '../../services/application.service';
import { createSupportTicket } from '../../services/support.service';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'voice';
}

export const EnhancedAIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hazır sorular listesi
  const quickQuestions = [
    "Portföy durumum?",
    "En iyi yatırımım?",
    "Portföy dağılımım?",
    "Bütçe önerileri",
    "Tasarruf ipuçları",
    "Başvuru durumu?",
    "Yatırım tavsiyeleri",
    "Risk analizi",
    "Kargo durumu?",
    "Garanti takibi?",
    "Gelir/gider analizi",
    "Sipariş durumu?"
  ];

  // Hızlı işlemler
  const quickActions = [
    { text: "📝 Başvuru Yap", action: () => handleShowApplicationForm() },
    { text: "🎫 Destek Talebi", action: () => handleShowSupportForm() },
    { text: "📊 Portföy Analizi", action: () => handlePortfolioAnalysis() },
    { text: "💡 Yatırım Önerileri", action: () => handleInvestmentSuggestions() },
    { text: "📦 Kargo Takibi", action: () => handleSendMessage('Kargo durumum nedir?') },
    { text: "🛡️ Garanti Takibi", action: () => handleSendMessage('Garanti durumum nedir?') },
    { text: "💰 Finansal Analiz", action: () => handleSendMessage('Gelir gider analizimi yap') }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadPortfolioData();
    }
    // Hoş geldin mesajı göster
    setMessages([{
      id: 'welcome',
      text: `Merhaba ${user?.firstName || 'Kullanıcı'}! Ben TeknoBOT, size finansal konularda yardımcı olacağım. Portföy analizi, başvuru işlemleri, destek talepleri ve daha fazlası için buradayım!`,
      sender: 'ai',
      timestamp: new Date()
    }]);
    setShowQuickQuestions(true);
  }, [user]);

  // Chat geçmişini temizle
  const clearChatHistory = () => {
    setMessages([{
      id: 'welcome',
      text: `Merhaba ${user?.firstName || 'Kullanıcı'}! Ben TeknoBOT, size finansal konularda yardımcı olacağım. Portföy analizi, başvuru işlemleri, destek talepleri ve daha fazlası için buradayım!`,
      sender: 'ai',
      timestamp: new Date()
    }]);
    setShowQuickQuestions(true);
  };

  const loadPortfolioData = async () => {
    if (!user) return;
    try {
      const items = await portfolioService.getPortfolioItems(user.id);
      setPortfolioItems(items);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    }
  };



  // Metin okuma özelliği
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Kapsamlı durum sorgulama - başvuru, destek, sipariş, kargo, garanti, portföy
    const statusKeywords = ['başvuru', 'durum', 'destek', 'talep', 'başvurum', 'durumu', 'nerede', 'ne zaman', 'onaylandı', 'reddedildi', 'beklemede', 'sipariş', 'kargo', 'garanti', 'portföy', 'gelir', 'gider', 'bütçe'];
    const isStatusQuery = statusKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (user && isStatusQuery) {
      try {
        return await queryUserStatus(user.id, userMessage);
      } catch (error) {
        console.error('Durum sorgulama hatası:', error);
        return 'Üzgünüm, şu anda verilerinizi sorgulayamıyorum. Lütfen daha sonra tekrar deneyin.';
      }
    }
    
    // Portföy analizi
    if (lowerMessage.includes('portföy') || lowerMessage.includes('portfolio') || lowerMessage.includes('yatırım') || lowerMessage.includes('invest')) {
      if (portfolioItems.length === 0) {
        return "Henüz portföyünüzde yatırım bulunmuyor. Portföy oluşturmak için yatırım ekleme sayfasını kullanabilirsiniz. Çeşitlendirilmiş bir portföy oluşturmanızı öneririm.";
      }
      
      const summary = portfolioService.calculatePortfolioSummary(portfolioItems);
      const totalValue = formatCurrency(summary.totalValue);
      const totalReturn = formatCurrency(summary.totalReturn);
      const returnPercentage = summary.returnPercentage.toFixed(2);
      
      return `Portföy analiziniz:\n\n📊 Toplam Değer: ${totalValue}\n💰 Toplam Getiri: ${totalReturn}\n📈 Getiri Oranı: %${returnPercentage}\n🏦 Yatırım Sayısı: ${portfolioItems.length}\n\n${summary.returnPercentage >= 0 ? '✅ Portföyünüz pozitif getiri sağlıyor!' : '⚠️ Portföyünüz negatif getiri gösteriyor, çeşitlendirme düşünebilirsiniz.'}`;
    }
    
    // En iyi performans gösteren yatırım
    if (lowerMessage.includes('en iyi') || lowerMessage.includes('performans') || lowerMessage.includes('kazanç')) {
      if (portfolioItems.length === 0) {
        return "Henüz portföyünüzde yatırım bulunmuyor.";
      }
      
      const bestPerformer = portfolioItems.reduce((best, item) => 
        !best || item.returnPercentage > best.returnPercentage ? item : best
      );
      
      return `🏆 En iyi performans gösteren yatırımınız:\n\n📈 ${bestPerformer.name}\n💰 Getiri: ${formatCurrency(bestPerformer.totalReturn)}\n📊 Getiri Oranı: %${bestPerformer.returnPercentage.toFixed(2)}`;
    }
    
    // Portföy dağılımı
    if (lowerMessage.includes('dağılım') || lowerMessage.includes('kategori') || lowerMessage.includes('çeşitlendirme')) {
      if (portfolioItems.length === 0) {
        return "Henüz portföyünüzde yatırım bulunmuyor.";
      }
      
      const summary = portfolioService.calculatePortfolioSummary(portfolioItems);
      let response = "📊 Portföy dağılımınız:\n\n";
      
      summary.categoryBreakdown.forEach(category => {
        const percentage = ((category.value / summary.totalValue) * 100).toFixed(1);
        response += `• ${category.category}: ${formatCurrency(category.value)} (%${percentage})\n`;
      });
      
      return response;
    }
    
    // Genel finansal tavsiyeler
    const responses = {
      bütçe: "Bütçenizi optimize etmek için öncelikle sabit giderlerinizi listeleyin. Aylık gelirinizin %50'sini zorunlu harcamalar, %30'unu isteğe bağlı harcamalar ve %20'sini tasarruf için ayırmanızı öneririm.",
      tasarruf: "Tasarruf için 50/30/20 kuralını uygulayabilirsiniz. Ayrıca otomatik tasarruf planları oluşturarak her ay belirli bir miktarı kenara koyabilirsiniz.",
      borç: "Borçlarınızı öncelik sırasına göre listeleyin. En yüksek faizli borçları önce ödemeye odaklanın. Borç konsolidasyonu da bir seçenek olabilir.",
      default: "Bu konuda size yardımcı olmak için daha fazla bilgiye ihtiyacım var. Portföy analizi, yatırım tavsiyeleri, bütçe planlaması gibi konularda sorular sorabilirsiniz."
    };
    
    if (lowerMessage.includes('bütçe') || lowerMessage.includes('budget')) {
      return responses.bütçe;
    } else if (lowerMessage.includes('tasarruf') || lowerMessage.includes('para biriktir')) {
      return responses.tasarruf;
    } else if (lowerMessage.includes('borç') || lowerMessage.includes('kredi')) {
      return responses.borç;
    } else {
      return responses.default;
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    // Kullanıcı mesajını state'e ekle
    setMessages(prev => [...prev, userMessage]);
    
    setInputText('');
    setIsLoading(true);
    setShowQuickQuestions(false);

    try {
      // Simüle edilmiş gecikme
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = await generateAIResponse(textToSend);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      // AI mesajını state'e ekle
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI response error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
    setShowQuickQuestions(false);
  };

  const handleShowApplicationForm = () => {
    setShowApplicationForm(true);
    setShowQuickQuestions(false);
  };

  const handleShowSupportForm = () => {
    setShowSupportForm(true);
    setShowQuickQuestions(false);
  };

  const handlePortfolioAnalysis = () => {
    handleSendMessage('Portföy analizi yap');
  };

  const handleInvestmentSuggestions = () => {
    handleSendMessage('Yatırım önerileri ver');
  };

  const submitApplication = async (formData: any) => {
    setShowApplicationForm(false);
    
    try {
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      await applicationService.createApplication(user.id, {
        serviceType: formData.applicationType,
        serviceName: formData.applicationType,
        serviceCategory: formData.applicationType,
        applicantInfo: {
          fullName: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          email: formData.email,
          address: '',
          identityNumber: ''
        },
        status: 'pending',
        notes: formData.message
      });

      const successMessage: Message = {
        id: Date.now().toString(),
        text: '✅ Başvurunuz başarıyla gönderildi! Başvuru numaranız ile durumunu takip edebilirsiniz.',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Başvuru gönderilirken hata:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: '❌ Başvurunuz gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const submitSupportRequest = async (formData: any) => {
    setShowSupportForm(false);
    
    try {
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      await createSupportTicket({
        title: formData.subject,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || 'Kullanıcı'
      });

      const successMessage: Message = {
        id: Date.now().toString(),
        text: '🎫 Destek talebiniz başarıyla oluşturuldu! En kısa sürede size dönüş yapacağız.',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Destek talebi gönderilirken hata:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: '❌ Destek talebiniz gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Başvuru Formu Bileşeni
  const ApplicationForm = () => {
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: user?.primaryEmailAddress?.emailAddress || '',
      phone: '',
      applicationType: '',
      message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      submitApplication(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">📝 Başvuru Formu</h3>
            <button
              onClick={() => setShowApplicationForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Ad"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="p-2 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Soyad"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="p-2 border rounded-lg"
                required
              />
            </div>
            <input
              type="email"
              placeholder="E-posta"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-2 border rounded-lg"
              required
            />
            <input
              type="tel"
              placeholder="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full p-2 border rounded-lg"
              required
            />
            <select
              value={formData.applicationType}
              onChange={(e) => setFormData({...formData, applicationType: e.target.value})}
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="">Başvuru Türü Seçin</option>
              <option value="investment">İnternet Aboneliği</option>
              <option value="portfolio">TV Aboneliği</option>
              <option value="consultation">Tarife Değişikliği</option>
              <option value="other">Diğer</option>
            </select>
            <textarea
              placeholder="Mesajınız"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full p-2 border rounded-lg h-24 resize-none"
              required
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowApplicationForm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Gönder
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Destek Formu Bileşeni
  const SupportForm = () => {
    const [formData, setFormData] = useState({
      subject: '',
      category: '',
      priority: 'medium',
      description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      submitSupportRequest(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">🎫 Destek Talebi</h3>
            <button
              onClick={() => setShowSupportForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Konu"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full p-2 border rounded-lg"
              required
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="">Kategori Seçin</option>
              <option value="technical">Teknik Sorun</option>
              <option value="account">Hesap Sorunu</option>
              <option value="portfolio">Portföy Sorunu</option>
              <option value="general">Genel Soru</option>
              <option value="other">Diğer</option>
            </select>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className="w-full p-2 border rounded-lg"
            >
              <option value="low">Düşük Öncelik</option>
              <option value="medium">Orta Öncelik</option>
              <option value="high">Yüksek Öncelik</option>
              <option value="urgent">Acil</option>
            </select>
            <textarea
              placeholder="Açıklama"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border rounded-lg h-24 resize-none"
              required
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSupportForm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Gönder
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 text-white rounded-t-lg" style={{ background: 'linear-gradient(to right, #ffb700, #ff8c00)' }}>
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-white" />
          <h3 className="font-semibold text-white">🤖 TeknoBOT</h3>
        </div>
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="p-2 text-red-300 hover:bg-white/10 rounded-lg transition-colors"
              title="Konuşmayı durdur"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={clearChatHistory}
            className="p-2 text-white/80 hover:bg-white/10 rounded-lg transition-colors"
            title="Chat geçmişini temizle"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.sender === 'user' 
                ? 'text-white' 
                : 'bg-gray-200 text-gray-600'
            }`} style={message.sender === 'user' ? { backgroundColor: '#ffb700' } : {}}>
              {message.sender === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div className={`flex-1 max-w-[80%] ${
              message.sender === 'user' ? 'text-right' : 'text-left'
            }`}>
              <div className={`inline-block p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-900'
              }`} style={message.sender === 'user' ? { backgroundColor: '#ffb700' } : {}}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                {message.sender === 'ai' && (
                  <button
                    onClick={() => speakText(message.text)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Sesli oku"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Hazır Sorular ve Hızlı İşlemler */}
        {showQuickQuestions && messages.length <= 1 && (
          <div className="space-y-4">
            {/* Hızlı İşlemler */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">🚀 Hızlı İşlemler</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="p-4 text-left text-sm rounded-lg transition-all border hover:shadow-md min-h-[60px] flex items-center" style={{ background: 'linear-gradient(to right, #fff8e1, #ffecb3)', color: '#e65100', borderColor: '#ffcc02' }}
                  >
                    {action.text}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Hazır Sorular */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">💬 Hazır Sorular</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="p-3 text-left text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="inline-block p-3 bg-gray-100 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">

          
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesajını yaz"
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="p-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: '#ffb700' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#e6a500')}
            onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#ffb700')}
            title="Gönder"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
      </div>
      
      {/* Form Modalleri */}
      {showApplicationForm && <ApplicationForm />}
      {showSupportForm && <SupportForm />}
    </>
  );
};

export default EnhancedAIAssistant;