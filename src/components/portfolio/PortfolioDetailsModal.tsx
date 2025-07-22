import React from 'react';
import { X } from 'lucide-react';
import { PortfolioItem, GOLD_TYPES } from '../../types/portfolio';
import { PortfolioItemCard } from './PortfolioItemCard';

interface PortfolioDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PortfolioItem[];
  symbol: string;
  showValues: boolean;
  onUpdate: (id: string, updates: Partial<PortfolioItem>) => Promise<void>;
  onDelete: (id: string) => void;
  onRefreshPrice?: (symbol: string, type: string) => Promise<void>;
}

export const PortfolioDetailsModal: React.FC<PortfolioDetailsModalProps> = ({
  isOpen,
  onClose,
  items,
  symbol,
  showValues,
  onUpdate,
  onDelete,
  onRefreshPrice
}) => {
  if (!isOpen) return null;

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

  const firstItem = items[0];
  const displayName = firstItem ? getDisplayName(firstItem) : symbol;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{displayName} Detayları</h2>
            <p className="text-sm text-gray-600 mt-1">{symbol} • {items.length} adet yatırım</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            {items
              .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
              .map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg">
                  <PortfolioItemCard
                    item={item}
                    showValues={showValues}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    isConsolidated={false}
                    consolidatedCount={1}
                    onRefreshPrice={onRefreshPrice}
                  />
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};