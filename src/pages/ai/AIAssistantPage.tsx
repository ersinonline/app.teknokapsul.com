import { EnhancedAIAssistant } from '../../components/ai/EnhancedAIAssistant';

export const AIAssistantPage = () => {
  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-lg">
              🧠
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Finansal Asistan</h1>
              <p className="text-white/60 text-xs">Yapay zeka destekli danışman</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] text-white/70">Portföy Erişimi</span>
            <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] text-white/70">Kişisel Öneriler</span>
            <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] text-white/70">Akıllı Analiz</span>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 mb-6">
        <EnhancedAIAssistant />
      </div>
    </div>
  );
};