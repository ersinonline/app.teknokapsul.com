import React from 'react';
import { Bot } from 'lucide-react';
import AIChat from '../../components/ai/AIChat';

const AIPage: React.FC = () => {
  return (
    <div className="page-container bg-background">
      <div className="bank-gradient-blue px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Asistan</h1>
              <p className="text-white/60 text-xs">Sorularınızı yanıtlayalım</p>
            </div>
          </div>
        </div>
      </div>
      <div className="page-content -mt-5 mb-6">
        <AIChat />
      </div>
    </div>
  );
};

export default AIPage;