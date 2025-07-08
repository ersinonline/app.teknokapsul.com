import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle, BookOpen, Filter } from 'lucide-react';
import { FAQ_DATA } from './faqData';

export const FAQPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>('general');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filteredFAQs = FAQ_DATA.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      [q.question, q.answer].some(text => text.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <HelpCircle className="w-8 h-8" style={{ color: '#ffb700' }} />
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">Yardım Merkezi</h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Sık sorulan sorular ve cevapları aşağıda bulabilirsiniz. Aradığınızı bulamazsanız bizimle iletişime geçebilirsiniz.
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-5 h-5" style={{ color: '#ffb700' }} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Arama</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="search"
                placeholder="Soru ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Arama sonucu bulunamadı
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Farklı arama terimleri deneyebilir veya tüm kategorileri inceleyebilirsiniz.
                  </p>
                </div>
              </div>
            ) : (
              filteredFAQs.map(category => (
                <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5" style={{ color: '#ffb700' }} />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{category.title}</h2>
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#ffb700', color: 'white' }}>
                        {category.questions.length} soru
                      </span>
                    </div>
                    {openCategory === category.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>

                  {/* Category Questions */}
                  {openCategory === category.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {category.questions.map(item => (
                        <div key={item.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                          <button
                            onClick={() => setOpenQuestion(openQuestion === item.id ? null : item.id)}
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <span className="font-medium text-gray-900 dark:text-white pr-4">{item.question}</span>
                            {openQuestion === item.id ? (
                              <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            )}
                          </button>
                          {openQuestion === item.id && (
                            <div className="px-6 pb-6 bg-gray-50 dark:bg-gray-700/50">
                              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{item.answer}</p>
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
        </div>
      </div>
    </div>
  );
};