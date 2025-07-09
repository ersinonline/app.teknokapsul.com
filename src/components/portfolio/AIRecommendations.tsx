import React, { useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, Target, Lightbulb, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { AIRecommendation, PortfolioAnalysis } from '../../types/portfolio';

interface AIRecommendationsProps {
  recommendations: AIRecommendation[];
  analysis: PortfolioAnalysis;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  recommendations,
  analysis
}) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'analysis'>('recommendations');

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'sell':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'hold':
        return <Target className="w-5 h-5 text-blue-600" />;
      case 'diversify':
        return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      default:
        return <Brain className="w-5 h-5 text-purple-600" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'border-green-200 bg-green-50';
      case 'sell':
        return 'border-red-200 bg-red-50';
      case 'hold':
        return 'border-blue-200 bg-blue-50';
      case 'diversify':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-purple-200 bg-purple-50';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'düşük':
        return 'text-green-600 bg-green-100';
      case 'orta':
        return 'text-yellow-600 bg-yellow-100';
      case 'yüksek':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Finansal Danışman</h2>
            <p className="text-purple-100">Kişiselleştirilmiş yatırım önerileri</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'recommendations'
                ? 'bg-white text-purple-600'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            Öneriler ({recommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'bg-white text-purple-600'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            Portföy Analizi
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'recommendations' ? (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Henüz AI önerisi bulunmuyor</p>
                <p className="text-sm text-gray-500 mt-1">
                  Portföyünüze yatırım ekledikçe AI önerileri oluşturulacak
                </p>
              </div>
            ) : (
              recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
                    getRecommendationColor(recommendation.type)
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getRecommendationIcon(recommendation.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {recommendation.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getRiskColor(recommendation.risk)
                          }`}>
                            {recommendation.risk} Risk
                          </span>
                        </div>
                        
                        <p className="text-gray-700 text-sm mb-3">
                          {recommendation.description}
                        </p>

                        {expandedCard === recommendation.id && (
                          <div className="space-y-3">
                            <div className="bg-white bg-opacity-50 rounded-lg p-3">
                              <h4 className="font-medium text-gray-900 mb-2">Detaylı Açıklama:</h4>
                              <p className="text-sm text-gray-700">
                                {recommendation.reasoning}
                              </p>
                            </div>
                            
                            {recommendation.expectedReturn && (
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                  <span className="text-gray-600">Beklenen Getiri:</span>
                                  <span className="font-medium text-green-600">
                                    %{recommendation.expectedReturn}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Target className="w-4 h-4 text-blue-600" />
                                  <span className="text-gray-600">Güven:</span>
                                  <span className="font-medium text-blue-600">
                                    %{recommendation.confidence}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setExpandedCard(
                        expandedCard === recommendation.id ? null : recommendation.id
                      )}
                      className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                    >
                      {expandedCard === recommendation.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Risk Analizi */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Risk Analizi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    getRiskColor(analysis.riskLevel)
                  }`}>
                    <span className="text-lg font-bold">
                      {analysis.riskLevel.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Risk Seviyesi</p>
                  <p className="text-xs text-gray-600">{analysis.riskLevel}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg font-bold">
                      {analysis.diversificationScore}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Çeşitlendirme</p>
                  <p className="text-xs text-gray-600">100 üzerinden</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg font-bold">
                      {analysis.stabilityScore}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Stabilite</p>
                  <p className="text-xs text-gray-600">100 üzerinden</p>
                </div>
              </div>
            </div>

            {/* Öneriler Özeti */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Genel Öneriler
              </h3>
              <div className="space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Performans Metrikleri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-medium text-gray-900 mb-2">Güçlü Yönler</h4>
                <ul className="space-y-1">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <h4 className="font-medium text-gray-900 mb-2">Gelişim Alanları</h4>
                <ul className="space-y-1">
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};