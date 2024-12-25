import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getLoyaltyPoints, LoyaltyPoints } from '../services/loyalty.service';

export const useLoyalty = () => {
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState<LoyaltyPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLoyalty = async () => {
      if (!user) return;

      try {
        const points = await getLoyaltyPoints(user.uid);
        setLoyalty(points);
      } catch (err) {
        console.error('Error loading loyalty points:', err);
        setError('Puan bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadLoyalty();
  }, [user]);

  return { loyalty, loading, error };
};