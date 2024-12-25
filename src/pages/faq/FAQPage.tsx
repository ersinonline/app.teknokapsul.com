import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Nasıl Yardımcı Olabiliriz?</h1>
        <p className="text-gray-600">Sık sorulan sorular ve cevapları aşağıda bulabilirsiniz.</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="search"
          placeholder="Soru ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFAQs.map(category => (
          <div key={category.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50"
            >
              <h2 className="text-lg font-medium text-gray-900">{category.title}</h2>
              {openCategory === category.id ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {/* Category Questions */}
            {openCategory === category.id && (
              <div className="border-t">
                {category.questions.map(item => (
                  <div key={item.id} className="border-b last:border-b-0">
                    <button
                      onClick={() => setOpenQuestion(openQuestion === item.id ? null : item.id)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50"
                    >
                      <span className="font-medium text-gray-900">{item.question}</span>
                      {openQuestion === item.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {openQuestion === item.id && (
                      <div className="px-6 pb-6">
                        <p className="text-gray-600">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};