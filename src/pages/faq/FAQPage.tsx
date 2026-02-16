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
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-purple px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Yardım Merkezi</h1>
                <p className="text-white/60 text-xs">SSS ve destek</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5">
        {/* Tabs */}
        <div className="bank-card p-1.5 mb-4">
          <div className="flex gap-1">
            <button onClick={() => setActiveTab('faq')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'faq' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}>
              <BookOpen className="w-3.5 h-3.5" /> Sorular
            </button>
            {user && (
              <>
                <button onClick={() => setActiveTab('support')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'support' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                  <MessageSquare className="w-3.5 h-3.5" /> Talep
                </button>
                <button onClick={() => setActiveTab('my-tickets')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'my-tickets' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                  <Headphones className="w-3.5 h-3.5" /> Taleplerim
                </button>
              </>
            )}
          </div>
        </div>

        {activeTab === 'faq' && (
          <>
            {/* Search */}
            <div className="bank-card p-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="search"
                  placeholder="Soru ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* FAQ List */}
            <div className="space-y-3 mb-6">
              {filteredFAQs.length === 0 ? (
                <div className="bank-card p-10 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">Sonuç bulunamadı</h3>
                  <p className="text-xs text-muted-foreground">Farklı arama terimleri deneyin.</p>
                </div>
              ) : (
                filteredFAQs.map(category => (
                  <div key={category.id} className="bank-card overflow-hidden">
                    <button
                      onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-semibold text-foreground">{category.title}</h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                          {category.questions.length}
                        </span>
                      </div>
                      {openCategory === category.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    {openCategory === category.id && (
                      <div className="border-t border-border/50">
                        {category.questions.map(item => (
                          <div key={item.id} className="border-b border-border/30 last:border-b-0">
                            <button
                              onClick={() => setOpenQuestion(openQuestion === item.id ? null : item.id)}
                              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition-colors"
                            >
                              <span className="text-sm text-foreground pr-3">{item.question}</span>
                              {openQuestion === item.id ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </button>
                            {openQuestion === item.id && (
                              <div className="px-4 pb-4 bg-muted/20">
                                <p className="text-xs text-muted-foreground leading-relaxed">{item.answer}</p>
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

        {activeTab === 'support' && (
          <SupportTicketForm onSuccess={() => setActiveTab('my-tickets')} />
        )}

        {activeTab === 'my-tickets' && (
          <SupportTicketList />
        )}
      </div>
    </div>
  );
};