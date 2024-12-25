import React from 'react';
import { Edit2, X } from 'lucide-react';

interface BudgetHeaderProps {
  isEditing: boolean;
  onEditToggle: () => void;
}

export const BudgetHeader: React.FC<BudgetHeaderProps> = ({ isEditing, onEditToggle }) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-gray-900">Bütçe Planlama</h1>
      <button
        onClick={onEditToggle}
        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        aria-label={isEditing ? 'Düzenlemeyi İptal Et' : 'Düzenle'}
      >
        {isEditing ? (
          <X className="w-5 h-5 text-gray-600" />
        ) : (
          <Edit2 className="w-5 h-5 text-yellow-600" />
        )}
      </button>
    </div>
  );
};