import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { portfolioService } from '../../services/portfolio.service';
import { PortfolioItem } from '../../types/portfolio';
import { formatCurrency } from '../../utils/currency';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'voice';
}

export const EnhancedAIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Merhaba ${user?.displayName?.split(' ')[0] || 'Ersin'}! Size nasıl yardımcı olabilirim? Portföy durumunuz, finansal analiz, bütçe önerileri veya yatırım tavsiyeleri hakkında sorular sorabilirsiniz.`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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
  }, [user]);

  const loadPortfolioData = async () => {
    if (!user) return;
    try {
      const items = await portfolioService.getPortfolioItems(user.uid);
      setPortfolioItems(items);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    }
  };

  // Ses tanıma özelliği
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'tr-TR';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
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

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Simüle edilmiş gecikme
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = await generateAIResponse(inputText);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI response error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <h3 className="font-semibold text-gray-900">AI Finansal Asistan</h3>
        </div>
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Konuşmayı durdur"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}
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
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
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
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
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
              placeholder="Finansal sorularınızı sorun..."
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-3 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title={isListening ? 'Dinlemeyi durdur' : 'Sesli mesaj'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Gönder"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIAssistant;