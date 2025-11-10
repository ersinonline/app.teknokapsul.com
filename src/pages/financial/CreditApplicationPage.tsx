import React, { useState } from 'react';
import { ArrowLeft, Landmark, ChevronsRight, Loader2, CheckCircle, TrendingUp, Calendar, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';


const CreditApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Form, 2: Success
  const [isProcessing, setIsProcessing] = useState(false);

  const [creditAmount, setCreditAmount] = useState(10000);
  const [term, setTerm] = useState(12); // in months
  const interestRate = 0.015; // Monthly interest rate (1.5%)

  const monthlyPayment = (creditAmount * interestRate * Math.pow(1 + interestRate, term)) / (Math.pow(1 + interestRate, term) - 1);
  const totalRepayment = monthlyPayment * term;

  const handleApply = async () => {
    if (!user) {
      alert("Başvuru yapmak için giriş yapmalısınız.");
      return;
    }
    setIsProcessing(true);
    try {
      const applicationsCol = collection(db, 'users', user.id, 'creditApplications');
      await addDoc(applicationsCol, {
        amount: creditAmount,
        term: term,
        interestRate: interestRate,
        monthlyPayment: monthlyPayment,
        totalRepayment: totalRepayment,
        status: 'pending', // pending, approved, rejected
        appliedAt: serverTimestamp()
      });
      setStep(2);
    } catch (error) {
      console.error("Credit application error: ", error);
      alert("Kredi başvurusu sırasında bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewApplication = () => {
    setCreditAmount(10000);
    setTerm(12);
    setStep(1);
  };

  const renderForm = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Kredi Miktarı</h2>
        <p className="text-3xl font-bold text-yellow-600">{formatCurrency(creditAmount)}</p>
        <input
          type="range"
          min="1000"
          max="100000"
          step="500"
          value={creditAmount}
          onChange={(e) => setCreditAmount(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer mt-4"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>1.000 TL</span>
          <span>100.000 TL</span>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Vade Süresi</h2>
        <p className="text-3xl font-bold text-yellow-600">{term} Ay</p>
        <input
          type="range"
          min="3"
          max="36"
          step="1"
          value={term}
          onChange={(e) => setTerm(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer mt-4"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>3 Ay</span>
          <span>36 Ay</span>
        </div>
      </div>

      <div className="border-t dark:border-gray-700 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Ödeme Detayları</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1"><Percent size={14} /> Faiz Oranı</p>
            <p className="font-bold text-lg text-gray-800 dark:text-gray-100">%{ (interestRate * 12 * 100).toFixed(2) } (Yıllık)</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1"><Calendar size={14} /> Aylık Taksit</p>
            <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{formatCurrency(monthlyPayment)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1"><TrendingUp size={14} /> Toplam Geri Ödeme</p>
            <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{formatCurrency(totalRepayment)}</p>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <button
          onClick={handleApply}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-60"
        >
          {isProcessing ? <><Loader2 className="animate-spin" size={24} /> Başvuruluyor...</> : <>Hemen Başvur <ChevronsRight size={20} /></>}
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-8">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">Başvurunuz Alındı!</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Kredi başvurunuz başarıyla alınmıştır. Değerlendirme sonucunda size bilgi verilecektir.
      </p>
      <div className="mt-8">
        <button onClick={handleNewApplication} className="w-full py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold">
          Yeni Başvuru Yap
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          </button>
          <div className="flex items-center gap-2">
            <Landmark className="w-7 h-7 text-purple-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Kredi Başvurusu</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm">
          {step === 1 ? renderForm() : renderSuccess()}
        </div>
      </main>
    </div>
  );
};

export default CreditApplicationPage;