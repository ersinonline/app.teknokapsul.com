import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebaseData } from '../../hooks/useFirebaseData';

import { Expense } from '../../types/expense';
import { Income } from '../../types/income';
import { Subscription } from '../../types/subscription';
import { CreditCard, CashAdvanceAccount, Loan } from '../../types/financial';
import { formatCurrency } from '../../utils/currency';
import { getUserExpenses } from '../../services/expense.service';
import { getUserIncomes } from '../../services/income.service';
import { getCreditCards, getCashAdvanceAccounts, getLoans } from '../../services/financial.service';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  'Finansal durumum nasıl?',
  'En yüksek giderlerim neler?',
  'Kredi kartlarım nasıl?',
  'Kredilerim',
  'Ödenmemiş giderlerim var mı?',
  'Bütçe önerisi ver'
];

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  // Kullanıcı verilerini yükle
  const { data: subscriptions = [] } = useFirebaseData<Subscription>('subscriptions');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [cashAdvanceAccounts, setCashAdvanceAccounts] = useState<CashAdvanceAccount[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Gider ve gelir verilerini yükle
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        const [userExpenses, userIncomes, userCreditCards, userCashAdvance, userLoans] = await Promise.all([
          getUserExpenses(user.uid, currentYear, currentMonth),
          getUserIncomes(user.uid, currentYear, currentMonth),
          getCreditCards(user.uid),
          getCashAdvanceAccounts(user.uid),
          getLoans(user.uid)
        ]);
        
        setExpenses(userExpenses);
        setIncomes(userIncomes);
        setCreditCards(userCreditCards);
        setCashAdvanceAccounts(userCashAdvance);
        setLoans(userLoans);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, [user, currentYear, currentMonth]);

  useEffect(() => {
    addWelcomeMessage();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: `Merhaba ${user?.displayName || 'Kullanıcı'}! 👋 Ben TeknoKapsül AI asistanınızım. Finansal yönetim konularında size yardımcı olmak için buradayım. Aşağıdaki hazır sorulardan birini seçebilir veya kendi sorunuzu yazabilirsiniz.`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = async (userMessage: string): Promise<Message> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
    
    const message = userMessage.toLowerCase();
    let response = '';
    
    // Kullanıcı verilerini analiz et
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const unpaidExpenses = expenses.filter(expense => !expense.isPaid);
    const totalUnpaid = unpaidExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    
    // Finansal veriler analizi
    const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
    const totalCreditDebt = creditCards.reduce((sum, card) => sum + card.currentDebt, 0);
    const totalAvailableCredit = totalCreditLimit - totalCreditDebt;
    const totalCashAdvanceLimit = cashAdvanceAccounts.reduce((sum, acc) => sum + acc.limit, 0);
    const totalCashAdvanceDebt = cashAdvanceAccounts.reduce((sum, acc) => sum + acc.currentDebt, 0);
    const totalLoanDebt = loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const totalDebt = totalCreditDebt + totalCashAdvanceDebt + totalLoanDebt;
    
    // Akıllı cevap sistemi - gerçek verilerle
    if (message.includes('durum') || message.includes('özet') || message.includes('analiz')) {
      response = `📊 **Finansal Durumunuz:**\n\n• Aylık Gelir: ${formatCurrency(totalIncome)}\n• Aylık Gider: ${formatCurrency(totalExpenses)}\n• Net Durum: ${formatCurrency(netBalance)} ${netBalance >= 0 ? '✅' : '⚠️'}\n• Ödenmemiş Gider: ${formatCurrency(totalUnpaid)}\n\n💳 **Borç Durumu:**\n• Toplam Borç: ${formatCurrency(totalDebt)}\n• Kredi Kartı Borcu: ${formatCurrency(totalCreditDebt)}\n• Avans Hesap Borcu: ${formatCurrency(totalCashAdvanceDebt)}\n• Kredi Borcu: ${formatCurrency(totalLoanDebt)}\n\n${netBalance >= 0 ? 'Finansal durumunuz pozitif görünüyor!' : 'Giderlerinizi gözden geçirmenizi öneririm.'}`;
    } else if (message.includes('gider') && (message.includes('en') || message.includes('yüksek') || message.includes('fazla'))) {
      const sortedExpenses = expenses.sort((a, b) => b.amount - a.amount).slice(0, 5);
      response = `💰 **En Yüksek Giderleriniz:**\n\n${sortedExpenses.map((expense, index) => `${index + 1}. ${expense.title}: ${formatCurrency(expense.amount)}`).join('\n')}\n\nBu alanlarda tasarruf fırsatları arayabilirsiniz.`;
    } else if (message.includes('ödenmemiş') || message.includes('bekleyen')) {
      if (unpaidExpenses.length > 0) {
        response = `⏰ **Ödenmemiş Giderleriniz:**\n\n${unpaidExpenses.slice(0, 5).map(expense => `• ${expense.title}: ${formatCurrency(expense.amount)} (${new Date(expense.date).toLocaleDateString('tr-TR')})`).join('\n')}\n\nToplam: ${formatCurrency(totalUnpaid)}`;
      } else {
        response = `✅ **Harika!** Şu anda ödenmemiş gideriniz bulunmuyor.`;
      }
    } else if (message.includes('kredi kart') || (message.includes('kart') && message.includes('limit'))) {
      if (creditCards.length > 0) {
        response = `💳 **Kredi Kartlarınız:**\n\n${creditCards.map(card => `• ${card.name} (${card.bank})\n  Limit: ${formatCurrency(card.limit)}\n  Borç: ${formatCurrency(card.currentDebt)}\n  Kullanılabilir: ${formatCurrency(card.limit - card.currentDebt)}`).join('\n\n')}\n\n**Toplam:**\n• Limit: ${formatCurrency(totalCreditLimit)}\n• Borç: ${formatCurrency(totalCreditDebt)}\n• Kullanılabilir: ${formatCurrency(totalAvailableCredit)}`;
      } else {
        response = `💳 Kayıtlı kredi kartınız bulunmuyor.`;
      }
    } else if (message.includes('avans') || message.includes('nakit')) {
      if (cashAdvanceAccounts.length > 0) {
        response = `💰 **Avans Hesaplarınız:**\n\n${cashAdvanceAccounts.map(acc => `• ${acc.name} (${acc.bank})\n  Limit: ${formatCurrency(acc.limit)}\n  Borç: ${formatCurrency(acc.currentDebt)}\n  Kullanılabilir: ${formatCurrency(acc.limit - acc.currentDebt)}`).join('\n\n')}\n\n**Toplam:**\n• Limit: ${formatCurrency(totalCashAdvanceLimit)}\n• Borç: ${formatCurrency(totalCashAdvanceDebt)}`;
      } else {
        response = `💰 Kayıtlı avans hesabınız bulunmuyor.`;
      }
    } else if (message.includes('kredi') && !message.includes('kart')) {
      if (loans.length > 0) {
        response = `🏦 **Kredileriniz:**\n\n${loans.map(loan => `• ${loan.name} (${loan.bank})\n  Toplam: ${formatCurrency(loan.totalAmount)}\n  Kalan: ${formatCurrency(loan.remainingAmount)}\n  Aylık: ${formatCurrency(loan.monthlyPayment)}\n  Kalan Taksit: ${loan.remainingInstallments}/${loan.totalInstallments}`).join('\n\n')}\n\n**Toplam Kalan Borç:** ${formatCurrency(totalLoanDebt)}`;
      } else {
        response = `🏦 Kayıtlı krediniz bulunmuyor.`;
      }
    } else if (message.includes('abonelik')) {
      if (subscriptions.length > 0) {
        response = `📱 **Abonelikleriniz:**\n\n${subscriptions.map(sub => `• ${sub.name} (${new Date(sub.endDate).toLocaleDateString('tr-TR')} tarihinde bitiyor)`).join('\n')}\n\nDüzenli olarak gözden geçirmeyi unutmayın!`;
      } else {
        response = `📱 Kayıtlı aboneliğiniz bulunmuyor.`;
      }
    } else if (message.includes('bütçe') || message.includes('plan')) {
      const budgetAdvice = netBalance >= 0 ? 
        'Mevcut bütçeniz dengeli görünüyor. Tasarruf hedefleri belirleyebilirsiniz.' :
        'Giderleriniz gelirinizi aşıyor. Öncelikle gider azaltma stratejileri uygulamalısınız.';
      response = `📊 **Bütçe Analizi:**\n\n• Gelir: ${formatCurrency(totalIncome)}\n• Gider: ${formatCurrency(totalExpenses)}\n• Fark: ${formatCurrency(netBalance)}\n\n${budgetAdvice}\n\n**Öneriler:**\n• %50 temel ihtiyaçlar\n• %30 kişisel harcamalar\n• %20 tasarruf ve yatırım`;
    } else if (message.includes('tasarruf')) {
      const savingPotential = Math.max(0, totalIncome * 0.2);
      response = `💰 **Tasarruf Önerileri:**\n\n• Hedef tasarruf: ${formatCurrency(savingPotential)} (gelirin %20'si)\n• Mevcut net durum: ${formatCurrency(netBalance)}\n\n**Stratejiler:**\n• Gereksiz abonelikleri iptal edin\n• Gıda harcamalarını optimize edin\n• Ulaşım maliyetlerini azaltın\n• Otomatik tasarruf planı oluşturun`;
    } else if (message.includes('merhaba') || message.includes('selam')) {
      response = `Merhaba ${user?.displayName || 'Kullanıcı'}! 👋 Finansal verilerinizi analiz edebilir, öneriler sunabilirim. Size nasıl yardımcı olabilirim?`;
    } else if (message.includes('teşekkür') || message.includes('sağol')) {
      response = `Rica ederim! 😊 Finansal hedeflerinize ulaşmanızda yardımcı olmaktan mutluluk duyarım.`;
    } else {
      response = `Bu konuda size yardımcı olmaya çalışayım. Finansal durumunuz hakkında şunları sorabilirsiniz:\n\n• "Finansal durumum nasıl?"\n• "En yüksek giderlerim neler?"\n• "Ödenmemiş giderlerim var mı?"\n• "Kredi kartlarım nasıl?"\n• "Avans hesaplarım"\n• "Kredilerim"\n• "Bütçe önerisi ver"\n• "Tasarruf nasıl yapabilirim?"`;
    }
    
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: response,
      timestamp: new Date()
    };
  };

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputValue.trim();
    if (!messageToSend || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setShowQuickQuestions(false);
    setIsLoading(true);
    
    try {
      const aiResponse = await generateAIResponse(userMessage.content);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Üzgünüm, şu anda bir teknik sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.type === 'ai' && (
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            {message.type === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {/* Hazır Sorular */}
        {showQuickQuestions && messages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-gray-600">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Hazır Sorular:</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-200 text-sm text-blue-700 hover:text-blue-800"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="border-t p-4">
        {/* Hazır Sorular - Input Üstünde */}
        {showQuickQuestions && messages.length === 0 && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center space-x-2 text-gray-600">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Hazır Sorular:</span>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {QUICK_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-left p-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-200 text-xs text-blue-700 hover:text-blue-800"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};