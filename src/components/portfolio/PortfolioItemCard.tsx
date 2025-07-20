import React, { useState } from 'react';
import { TrendingUp, TrendingDown, MoreVertical, Edit2, Trash2, Calendar } from 'lucide-react';
import { PortfolioItem, PORTFOLIO_CATEGORIES, GOLD_TYPES } from '../../types/portfolio';
import { formatCurrency } from '../../utils/currency';
import { EditPortfolioModal } from './EditPortfolioModal';

interface PortfolioItemCardProps {
  item: PortfolioItem;
  showValues: boolean;
  onUpdate: (id: string, updates: Partial<PortfolioItem>) => Promise<void>;
  onDelete: (id: string) => void;
  isConsolidated?: boolean;
  consolidatedCount?: number;
  onShowDetails?: (symbol: string) => void;
}

export const PortfolioItemCard: React.FC<PortfolioItemCardProps> = ({
  item,
  showValues,
  onUpdate,
  onDelete,
  isConsolidated = false,
  consolidatedCount = 1,
  onShowDetails
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stock':
        return '📈';
      case 'fund':
        return '🏦';
      case 'gold':
        return '🥇';
      case 'currency':
        return '💱';
      case 'crypto':
        return '₿';
      default:
        return '💼';
    }
  };

  const getDisplayName = (item: PortfolioItem) => {
    if (item.type === 'gold' && GOLD_TYPES[item.symbol as keyof typeof GOLD_TYPES]) {
      return GOLD_TYPES[item.symbol as keyof typeof GOLD_TYPES];
    }
    if (item.type === 'currency') {
      if (item.symbol === 'USD') {
        return 'ABD Doları';
      } else if (item.symbol === 'EUR') {
        return 'Euro';
      }
    }
    return item.name;
  };

  const isPositive = item.totalReturn >= 0;
  const purchaseDate = new Date(item.purchaseDate).toLocaleDateString('tr-TR');

  return (
    <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center text-lg sm:text-xl">
            {getTypeIcon(item.type)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{getDisplayName(item)}</h3>
              {isConsolidated && consolidatedCount > 1 && item.type !== 'deposit' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  {consolidatedCount} adet
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                {PORTFOLIO_CATEGORIES[item.type as keyof typeof PORTFOLIO_CATEGORIES]}
              </span>
              <span className="hidden sm:inline">•</span>
              {(() => {
                let url = null;
                if (item.type === 'fund') {
                  url = `https://fintables.com/fonlar/${item.symbol.toUpperCase()}`;
                } else if (item.type === 'stock') {
                  url = `https://fintables.com/sirketler/${item.symbol.toUpperCase()}`;
                } else if (item.type === 'currency') {
                  if (item.symbol === 'EUR') {
                    url = 'https://bigpara.hurriyet.com.tr/doviz/euro/';
                  } else if (item.symbol === 'USD') {
                    url = 'https://bigpara.hurriyet.com.tr/doviz/dolar/';
                  }
                } else if (item.type === 'gold') {
                  url = 'https://bigpara.hurriyet.com.tr/altin/';
                }
                
                return url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    {item.symbol}
                  </a>
                ) : (
                  <span className="truncate">{item.symbol}</span>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  setShowEditModal(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="w-3 sm:w-4 h-3 sm:h-4" />
                Düzenle
              </button>
              <button
                onClick={() => {
                  onDelete(item.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                Sil
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div>
          <p className="text-xs text-gray-600 mb-1">Miktar</p>
          <p className="font-semibold text-gray-900 text-sm sm:text-base">
            {item.type === 'deposit' ? 
              formatCurrency(item.quantity) : 
              `${item.quantity.toLocaleString('tr-TR')} ${item.type === 'currency' ? item.symbol : 'adet'}`
            }
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-600 mb-1">Alış Fiyatı</p>
          <p className="font-semibold text-gray-900 text-sm sm:text-base">
            {showValues ? formatCurrency(item.purchasePrice) : '••••••'}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-600 mb-1">Güncel Fiyat</p>
          <p className="font-semibold text-gray-900 text-sm sm:text-base">
            {showValues ? formatCurrency(item.currentPrice) : '••••••'}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-600 mb-1">Toplam Değer</p>
          <p className="font-semibold text-gray-900 text-sm sm:text-base">
            {showValues ? formatCurrency(item.totalValue) : '••••••'}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-100 gap-2 sm:gap-0">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <Calendar className="w-3 sm:w-4 h-3 sm:h-4" />
          <span>Alış: {purchaseDate}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
            isPositive 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4" />
            ) : (
              <TrendingDown className="w-3 sm:w-4 h-3 sm:h-4" />
            )}
            <span>
              {showValues ? (
                <>
                  {isPositive ? '+' : ''}{formatCurrency(item.totalReturn)}
                  <span className="ml-1">(%{item.returnPercentage.toFixed(2)})</span>
                </>
              ) : (
                '••••••'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar for Return */}
      <div className="mt-2 sm:mt-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Performans</span>
          <span>{showValues ? `%${item.returnPercentage.toFixed(2)}` : '••••'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isPositive ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{
              width: `${Math.min(Math.abs(item.returnPercentage), 100)}%`
            }}
          />
        </div>
      </div>
      
      {/* Details Button for Consolidated Items */}
      {isConsolidated && consolidatedCount > 1 && onShowDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => onShowDetails(item.symbol)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <span>Detayları Göster {item.type !== 'deposit' ? `(${consolidatedCount} adet)` : ''}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
      
      <EditPortfolioModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={onUpdate}
        item={item}
      />
    </div>
  );
};