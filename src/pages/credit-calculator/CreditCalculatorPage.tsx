import { useState } from 'react';
import { Calculator, DollarSign, Percent, Calendar } from 'lucide-react';

interface PaymentSchedule {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface LoanCalculation {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  paymentSchedule: PaymentSchedule[];
}

export const CreditCalculatorPage = () => {
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [loanTerm, setLoanTerm] = useState<string>('');
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);

  const calculateLoan = () => {
    const principal = parseFloat(loanAmount);
    const monthlyRate = parseFloat(interestRate) / 100 / 12;
    const numberOfPayments = parseInt(loanTerm) * 12;

    if (principal <= 0 || monthlyRate <= 0 || numberOfPayments <= 0) {
      alert('Lütfen geçerli değerler girin');
      return;
    }

    // Aylık ödeme hesaplama
    const monthlyPayment = 
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - principal;

    // Ödeme planı oluşturma
    const payments: PaymentSchedule[] = [];
    let remainingBalance = principal;

    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      payments.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, remainingBalance),
      });
    }

    setCalculation({
      monthlyPayment,
      totalPayment,
      totalInterest,
      paymentSchedule: payments,
    });
  };

  const resetCalculation = () => {
    setLoanAmount('');
    setInterestRate('');
    setLoanTerm('');
    setCalculation(null);
  };

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient-blue px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Kredi Hesaplama</h1>
              <p className="text-white/60 text-xs">Aylık ödeme tutarınızı hesaplayın</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hesaplama Formu */}
        <div className="bank-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Kredi Bilgileri</h2>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Kredi Tutarı (₺)
              </label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Örn: 100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="w-4 h-4 inline mr-1" />
                Yıllık Faiz Oranı (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Örn: 15.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Vade (Yıl)
              </label>
              <input
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Örn: 5"
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={calculateLoan}
                className="flex-1 bg-blue-600 text-white py-2 px-4 sm:py-3 sm:px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                Hesapla
              </button>
              <button
                onClick={resetCalculation}
                className="flex-1 bg-gray-500 text-white py-2 px-4 sm:py-3 sm:px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
              >
                Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Sonuçlar */}
        {calculation && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Hesaplama Sonuçları</h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <div className="text-xs sm:text-sm text-blue-600 font-medium">Aylık Ödeme</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-900">
                  ₺{calculation.monthlyPayment.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <div className="text-xs sm:text-sm text-green-600 font-medium">Toplam Ödeme</div>
                <div className="text-base sm:text-xl font-bold text-green-900">
                  ₺{calculation.totalPayment.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-red-50 p-3 sm:p-4 rounded-lg">
                <div className="text-xs sm:text-sm text-red-600 font-medium">Toplam Faiz</div>
                <div className="text-base sm:text-xl font-bold text-red-900">
                  ₺{calculation.totalInterest.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

      {/* Ödeme Planı */}
      {calculation && (
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Ödeme Planı</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left font-medium text-gray-900">Ay</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-right font-medium text-gray-900">Ödeme</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-right font-medium text-gray-900">Ana Para</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-right font-medium text-gray-900">Faiz</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-right font-medium text-gray-900">Kalan Bakiye</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {calculation.paymentSchedule.slice(0, 12).map((payment) => (
                  <tr key={payment.month} className="hover:bg-gray-50">
                    <td className="px-2 py-2 sm:px-4 sm:py-3 font-medium">{payment.month}</td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-right">
                      ₺{payment.payment.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-right">
                      ₺{payment.principal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-right">
                      ₺{payment.interest.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3 text-right">
                      ₺{payment.balance.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {calculation.paymentSchedule.length > 12 && (
              <div className="mt-3 sm:mt-4 text-center text-gray-500 text-xs sm:text-sm">
                İlk 12 ay gösteriliyor. Toplam {calculation.paymentSchedule.length} aylık ödeme planı.
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};