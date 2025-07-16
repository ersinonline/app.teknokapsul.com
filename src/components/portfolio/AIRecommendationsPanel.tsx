import React from 'react';
import { Brain, TrendingUp, AlertTriangle, Target, CheckCircle } from 'lucide-react';
import { AIRecommendation } from '../../types/portfolio';

interface AIRecommendationsPanelProps {
  recommendations: AIRecommendation[];
  loading?: boolean;
}

export const AIRecommendationsPanel: React.FC<AIRecommendationsPanelProps> = ({
  recommendations,
  loading = false
}) => {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Target className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Brain className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'sell':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      case 'hold':
        return <Target className="w-4 h-4 text-blue-600" />;
      case 'diversify':
        return <Brain className="w-4 h-4 text-yellow-600" />;
      default:
        return <Brain className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Önerileri</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Önerileri</h3>
        </div>
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Henüz AI önerisi bulunmuyor</p>
          <p className="text-sm text-gray-400 mt-1">
            Portföyünüze yatırım ekleyerek AI önerilerini görüntüleyebilirsiniz
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Önerileri</h3>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          {recommendations.length} öneri
        </span>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <div
            key={index}
            className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(recommendation.priority)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getTypeIcon(recommendation.type)}
                <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
              </div>
              <div className="flex items-center gap-1">
                {getPriorityIcon(recommendation.priority)}
                <span className="text-xs font-medium text-gray-600 capitalize">
                  {recommendation.priority === 'high' ? 'Yüksek' :
                   recommendation.priority === 'medium' ? 'Orta' : 'Düşük'}
                </span>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-3">{recommendation.description}</p>

            {recommendation.reasoning && (
              <div className="bg-white bg-opacity-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-600 font-medium mb-1">Gerekçe:</p>
                <p className="text-xs text-gray-700">{recommendation.reasoning}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                {recommendation.risk && (
                  <span className="text-gray-600">
                    Risk: <span className="font-medium">{recommendation.risk}</span>
                  </span>
                )}
                {recommendation.expectedReturn && (
                  <span className="text-gray-600">
                    Beklenen Getiri: <span className="font-medium">{recommendation.expectedReturn}</span>
                  </span>
                )}
              </div>
              {recommendation.confidence && (
                <span className="text-gray-500">
                  Güven: %{(recommendation.confidence * 100).toFixed(0)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};