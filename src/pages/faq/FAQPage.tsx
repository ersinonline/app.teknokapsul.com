import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle, BookOpen, Filter, MessageSquare, Headphones } from 'lucide-react';
import { FAQ_DATA } from './faqData';
import { SupportTicketForm } from '../../components/support/SupportTicketForm';
import { SupportTicketList } from '../../components/support/SupportTicketList';
import { useAuth } from '../../contexts/AuthContext';

export const FAQPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>('general');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'support' | 'my-tickets'>('faq');


  const filteredFAQs = FAQ_DATA.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      [q.question, q.answer].some(text => text.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <HelpCircle className="w-8 h-8" style={{ color: '#ffb700' }} />
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Yardım Merkezi</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sık sorulan sorular ve cevapları aşağıda bulabilirsiniz. Aradığınızı bulamazsanız bizimle iletişime geçebilirsiniz.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('faq')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'faq'
                    ? 'bg-[#ffb700] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Sık Sorulan Sorular
              </button>
              
              {user && (
                <>
                  <button
                    onClick={() => setActiveTab('support')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeTab === 'support'
                        ? 'bg-[#ffb700] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Destek Talebi Oluştur
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('my-tickets')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeTab === 'my-tickets'
                        ? 'bg-[#ffb700] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Headphones className="w-4 h-4" />
                    Destek Taleplerimi
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'faq' && (
            <>
              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Filter className="w-5 h-5" style={{ color: '#ffb700' }} />
                  <h2 className="text-lg font-semibold text-gray-900">Arama</h2>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="search"
                    placeholder="Soru ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent bg-white text-gray-900"
                    style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* FAQ List */}
              <div className="space-y-4">
                {filteredFAQs.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
                    <div className="text-center">
                      <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Arama sonucu bulunamadı
                      </h3>
                      <p className="text-gray-500">
                        Farklı arama terimleri deneyebilir veya tüm kategorileri inceleyebilirsiniz.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredFAQs.map(category => (
                    <div key={category.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      {/* Category Header */}
                      <button
                        onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5" style={{ color: '#ffb700' }} />
                          <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
                          <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#ffb700', color: 'white' }}>
                            {category.questions.length} soru
                          </span>
                        </div>
                        {openCategory === category.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>

                      {/* Category Questions */}
                      {openCategory === category.id && (
                        <div className="border-t border-gray-200">
                          {category.questions.map(item => (
                            <div key={item.id} className="border-b border-gray-200 last:border-b-0">
                              <button
                                onClick={() => setOpenQuestion(openQuestion === item.id ? null : item.id)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                              >
                                <span className="font-medium text-gray-900 pr-4">{item.question}</span>
                                {openQuestion === item.id ? (
                                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                )}
                              </button>
                              {openQuestion === item.id && (
                                <div className="px-6 pb-6 bg-gray-50">
                                  <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Support Ticket Form */}
          {activeTab === 'support' && (
            <SupportTicketForm
              onSuccess={() => {
                setActiveTab('my-tickets');
              }}
            />
          )}

          {/* My Support Tickets */}
          {activeTab === 'my-tickets' && (
            <SupportTicketList />
          )}
        </div>
      </div>
    </div>
  );
};