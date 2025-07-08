import { AIAssistant } from '../../components/ai/AIAssistant';

export const AIAssistantPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Finansal Asistan
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Akıllı finansal analiz ve kişiselleştirilmiş öneriler için AI asistanınızla sohbet edin
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <AIAssistant />
        </div>
      </div>
    </div>
  );
};