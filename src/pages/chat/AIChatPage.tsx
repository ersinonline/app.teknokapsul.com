import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Mic, MicOff, Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

export const AIChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      label: 'Yatırım Önerisi',
      prompt: 'Mevcut piyasa koşullarında hangi yatırım araçlarını önerirsin?',
      icon: '📈'
    },
    {
      id: '2',
      label: 'Bütçe Planı',
      prompt: 'Aylık 10.000 TL gelirle nasıl bir bütçe planı yapabilirim?',
      icon: '💰'
    },
    {
      id: '3',
      label: 'Borç Yönetimi',
      prompt: 'Kredi kartı borçlarımı nasıl daha etkili yönetebilirim?',
      icon: '💳'
    },
    {
      id: '4',
      label: 'Emeklilik Planı',
      prompt: 'Emeklilik için ne kadar para biriktirmem gerekiyor?',
      icon: '🏦'
    }
  ];

  const aiResponses = [
    "Mevcut piyasa koşullarında çeşitlendirme çok önemli. Altın, döviz ve hisse senedi karışımı önerebilirim.",
    "Bütçe planınızda %50 zorunlu giderler, %30 yaşam giderleri, %20 tasarruf kuralını uygulayabilirsiniz.",
    "Kredi kartı borçlarınız için önce en yüksek faizli karttan başlayarak ödeme yapın.",
    "Emeklilik için maaşınızın en az %15-20'sini düzenli olarak yatırım yapmanız önerilir.",
    "Finansal hedeflerinizi belirleyip, bunları küçük adımlara bölerek ilerleyebilirsiniz.",
    "Risk toleransınıza göre yatırım portföyünüzü oluşturmanız önemli.",
    "Acil durum fonu için en az 6 aylık giderinizi biriktirmeniz gerekiyor."
  ];

  useEffect(() => {
    // Welcome message
    const welcomeMessage: Message = {
      id: '1',
      type: 'ai',
      content: `Merhaba ${user?.fullName || 'Kullanıcı'}! Ben TeknoKapsül AI asistanınızım. Finansal sorularınızda size yardımcı olmak için buradayım. Size nasıl yardımcı olabilirim?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = (userMessage: string): string => {
    // Simple keyword-based responses
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('yatırım') || lowerMessage.includes('invest')) {
      return "Yatırım konusunda size şu önerileri verebilirim: Portföyünüzü çeşitlendirin, risk toleransınızı belirleyin ve uzun vadeli düşünün. Altın, döviz, hisse senedi ve tahvil karışımı dengeli bir portföy oluşturabilir.";
    }
    
    if (lowerMessage.includes('bütçe') || lowerMessage.includes('budget')) {
      return "Bütçe yönetimi için 50/30/20 kuralını öneriyorum: Gelirinizin %50'si zorunlu giderler, %30'u yaşam giderleri, %20'si tasarruf ve yatırım için ayrılmalı.";
    }
    
    if (lowerMessage.includes('borç') || lowerMessage.includes('debt')) {
      return "Borç yönetimi için öncelikle en yüksek faizli borçlarınızı ödeyin. Minimum ödeme tutarlarından fazla ödeme yapmaya çalışın ve yeni borç almaktan kaçının.";
    }
    
    if (lowerMessage.includes('emeklilik') || lowerMessage.includes('retirement')) {
      return "Emeklilik planlaması için erken başlamak çok önemli. Maaşınızın en az %15-20'sini emeklilik için ayırın ve BES gibi vergi avantajlı ürünleri değerlendirin.";
    }
    
    if (lowerMessage.includes('kredi') || lowerMessage.includes('credit')) {
      return "Kredi kullanırken faiz oranlarını karşılaştırın, geri ödeme planınızı net belirleyin ve kredi notunuzu düzenli takip edin.";
    }
    
    // Random response for other questions
    return aiResponses[Math.floor(Math.random() * aiResponses.length)];
  };

  const handleSendMessage = async (content: string = inputValue) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(content),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">AI Asistan</h1>
            <p className="text-sm text-gray-600">Finansal danışmanınız</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'ai' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div className={`max-w-[80%] ${message.type === 'user' ? 'order-1' : ''}`}>
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
              
              <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <span>{formatTime(message.timestamp)}</span>
                {message.type === 'ai' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {message.type === 'user' && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="px-4 py-2">
          <p className="text-sm text-gray-600 mb-3">Hızlı sorular:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesajınızı yazın..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={startVoiceRecognition}
              disabled={isLoading}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                isListening 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;