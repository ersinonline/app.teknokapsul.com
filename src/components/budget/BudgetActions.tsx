import React from 'react';
import { Budget } from '../../types/budget';
import { updateTotalBudget, updateCategoryLimit } from '../../services/budget.service';

interface BudgetActionsProps {
  editedBudget: Budget;
  onCancel: () => void;
  onSave: () => void;
  userId: string;
}

export const BudgetActions: React.FC<BudgetActionsProps> = ({
  editedBudget,
  onCancel,
  onSave,
  userId,
}) => {
  const handleSave = async () => {
    try {
      await updateTotalBudget(userId, editedBudget.totalBudget);
      
      for (const [category, data] of Object.entries(editedBudget.categories)) {
        await updateCategoryLimit(userId, category, data.limit);
      }
      
      onSave();
    } catch (err) {
      console.error('Error updating budget:', err);
    }
  };

  return (
    <div className="flex justify-end gap-4">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
      >
        İptal
      </button>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
      >
        Kaydet
      </button>
    </div>
  );
};