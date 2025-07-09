import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PortfolioItem, PortfolioSummary } from '../types/portfolio';

export const portfolioService = {
  async getPortfolioItems(userId: string): Promise<PortfolioItem[]> {
    try {
      const q = query(
        collection(db, 'portfolioItems'),
        where('userId', '==', userId),
        orderBy('purchaseDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PortfolioItem[];
    } catch (error) {
      console.error('Portföy öğeleri alınırken hata:', error);
      return [];
    }
  },

  calculatePortfolioSummary(items: PortfolioItem[]): PortfolioSummary {
    try {
      const totalCost = items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
      const totalValue = items.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
      
      return {
        totalValue,
        totalCost,
        totalInvestment: totalCost,
        totalReturn: totalGainLoss,
        totalGainLoss,
        totalGainLossPercentage,
        returnPercentage: totalGainLossPercentage,
        dayChange: 0,
        dayChangePercent: 0,
        bestPerformer: null,
        worstPerformer: null,
        lastUpdated: new Date(),
        totalItems: items.length,
        itemCount: items.length,
        categoryBreakdown: []
      };
    } catch (error) {
      console.error('Portföy özeti hesaplanırken hata:', error);
      return {
        totalValue: 0,
        totalCost: 0,
        totalInvestment: 0,
        totalReturn: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        returnPercentage: 0,
        dayChange: 0,
        dayChangePercent: 0,
        bestPerformer: null,
        worstPerformer: null,
        lastUpdated: new Date(),
        totalItems: 0,
        itemCount: 0,
        categoryBreakdown: []
      };
    }
  },

  async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    try {
      const items = await this.getPortfolioItems(userId);
      return this.calculatePortfolioSummary(items);
    } catch (error) {
      console.error('Portföy özeti alınırken hata:', error);
      return this.calculatePortfolioSummary([]);
    }
  },

  async addPortfolioItem(userId: string, item: Omit<PortfolioItem, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'portfolioItems'), {
        ...item,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Portföy öğesi eklenirken hata:', error);
      throw error;
    }
  },

  async updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<void> {
    try {
      const docRef = doc(db, 'portfolioItems', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Portföy öğesi güncellenirken hata:', error);
      throw error;
    }
  },

  async deletePortfolioItem(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'portfolioItems', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Portföy öğesi silinirken hata:', error);
      throw error;
    }
  }
};