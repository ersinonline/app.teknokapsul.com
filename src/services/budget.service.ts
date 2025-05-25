import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Budget, CategoryType } from '../types/budget';

export const initializeBudget = async (userId: string, totalBudget: number) => {
  const budgetRef = doc(db, 'budgets', userId);
  const defaultBudget: Budget = {
    id: userId,
    userId,
    totalBudget,
    categories: {
      ev: { limit: 0, spent: 0 },
      araba: { limit: 0, spent: 0 },
      sigorta: { limit: 0, spent: 0 },
      kredi: { limit: 0, spent: 0 },
      giyim: { limit: 0, spent: 0 },
      market: { limit: 0, spent: 0 }
    }
  };

  await setDoc(budgetRef, defaultBudget);
  return defaultBudget;
};

export const getBudget = async (userId: string): Promise<Budget | null> => {
  const budgetRef = doc(db, 'budgets', userId);
  const budgetDoc = await getDoc(budgetRef);
  return budgetDoc.exists() ? budgetDoc.data() as Budget : null;
};

export const updateCategoryLimit = async (
  userId: string,
  category: CategoryType,
  limit: number
) => {
  const budgetRef = doc(db, 'budgets', userId);
  await updateDoc(budgetRef, {
    [`categories.${category}.limit`]: limit
  });
};

export const updateTotalBudget = async (userId: string, totalBudget: number) => {
  const budgetRef = doc(db, 'budgets', userId);
  await updateDoc(budgetRef, { totalBudget });
};