import React, { useMemo } from 'react';
import { Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import { Income } from '../../types/income';
import { Expense } from '../../types/expense';

interface KisisellestirilmisIpuclariProps {
  incomes: Income[];
  expenses: Expense[];
  loading: boolean;
}

const KisisellestirilmisIpuclari: React.FC<KisisellestirilmisIpuclariProps> = ({ incomes, expenses, loading }) => {
  const tip = useMemo(() => {
    if (loading || incomes.length === 0) {
      return {
        title: "Finansal Sağlığınız",
        text: "Verileriniz analiz ediliyor...",
        icon: Lightbulb,
        color: "text-gray-500",
      };
    }

    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

    // Tip 1: High spending
    if (totalExpense > totalIncome * 0.9) {
      return {
        title: "Harcamalarınızı Gözden Geçirin",
        text: "Bu ay harcamalarınız gelirinize oldukça yakın. Bütçenizi kontrol etmek iyi bir fikir olabilir.",
        icon: TrendingDown,
        color: "text-red-500",
      };
    }

    // Tip 2: Good savings
    if (totalIncome > totalExpense * 2) {
      return {
        title: "Harika Tasarruf Oranı!",
        text: "Geliriniz giderinizden önemli ölçüde fazla. Bu parayı birikim veya yatırım hedefleri için değerlendirebilirsiniz.",
        icon: TrendingUp,
        color: "text-green-500",
      };
    }

    // Tip 3: Balanced budget
    if (totalExpense > 0 && totalIncome > 0) {
        return {
            title: "Dengeli Bütçe",
            text: "Gelir ve giderleriniz dengeli görünüyor. Finansal hedeflerinize ulaşmak için bu dengeyi koruyun.",
            icon: Lightbulb,
            color: "text-blue-500",
        }
    }

    // Default Tip
    return {
      title: "Finansal İpucu",
      text: "Gelir ve giderlerinizi düzenli olarak takip ederek finansal sağlığınızı koruyabilirsiniz.",
      icon: Lightbulb,
      color: "text-yellow-500",
    };
  }, [incomes, expenses, loading]);

  const Icon = tip.icon;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-bold text-gray-800 mb-4 flex items-center">
        <Icon className={`w-5 h-5 mr-2 ${tip.color}`} />
        {tip.title}
      </h2>
      {loading ? (
        <p className="text-center text-gray-500">Yükleniyor...</p>
      ) : (
        <p className="text-sm text-gray-600">
          {tip.text}
        </p>
      )}
    </div>
  );
};

export default KisisellestirilmisIpuclari;