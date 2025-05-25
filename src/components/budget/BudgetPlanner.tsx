import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBudget } from '../../hooks/useBudget';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { Budget } from '../../types/budget';
import { BudgetHeader } from './BudgetHeader';
import { BudgetSummary } from './BudgetSummary';
import { CategoryList } from './CategoryList';
import { BudgetActions } from './BudgetActions';
import { SpendingPieChart } from './SpendingPieChart';
import { IncomeTracker } from './IncomeTracker';
import { BudgetAnalytics } from './BudgetAnalytics';

export const BudgetPlanner = () => {
  const { user } = useAuth();
  const { budget, loading: budgetLoading } = useBudget();
  const [isEditing, setIsEditing] = useState(false);
  const [editedBudget, setEditedBudget] = useState<Budget | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  useEffect(() => {
    if (budget) {
      setEditedBudget(budget);
    }
  }, [budget]);

  if (budgetLoading) return <LoadingSpinner />;
  if (!budget || !editedBudget) return null;

  return (
    <div className="space-y-6">
      <BudgetHeader
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BudgetSummary
            budget={isEditing ? editedBudget : budget}
            isEditing={isEditing}
            onTotalBudgetChange={(value) => {
              setEditedBudget({
                ...editedBudget,
                totalBudget: parseFloat(value) || 0,
              });
            }}
            monthlyIncome={monthlyIncome}
          />
        </div>
        <div>
          <IncomeTracker
            monthlyIncome={monthlyIncome}
            onIncomeChange={setMonthlyIncome}
            isEditing={isEditing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <SpendingPieChart categories={editedBudget.categories} />
        </div>

        <CategoryList
          budget={isEditing ? editedBudget : budget}
          isEditing={isEditing}
          onCategoryChange={(category, value) => {
            setEditedBudget({
              ...editedBudget,
              categories: {
                ...editedBudget.categories,
                [category]: {
                  ...editedBudget.categories[category],
                  limit: parseFloat(value) || 0,
                },
              },
            });
          }}
        />
      </div>

      <BudgetAnalytics budget={budget} monthlyIncome={monthlyIncome} />

      {isEditing && (
        <BudgetActions
          editedBudget={editedBudget}
          onCancel={() => {
            setIsEditing(false);
            setEditedBudget(budget);
          }}
          onSave={() => setIsEditing(false)}
          userId={user.uid}
        />
      )}
    </div>
  );
};