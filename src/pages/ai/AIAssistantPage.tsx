import { EnhancedAIAssistant } from '../../components/ai/EnhancedAIAssistant';

export const AIAssistantPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(to right, #ffb700, #ff8c00)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            🧠
          </div>
          <h1 className="text-2xl font-bold">AI Finansal Asistan</h1>
        </div>
        <p className="text-orange-100 mb-4">
          Yapay zeka destekli finansal danışmanınız. Portföy verilerinize erişebilir, sorularınızı yanıtlar ve öneriler sunar.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Portföy Erişimi</span>
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Kişisel Öneriler</span>
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Akıllı Analiz</span>
        </div>
      </div>

      {/* Enhanced AI Assistant */}
      <EnhancedAIAssistant />
    </div>
  );
};