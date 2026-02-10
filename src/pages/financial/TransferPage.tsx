import React, { useState } from 'react';
import { ArrowLeft, Send, User, Hash, DollarSign, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

const TransferPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation, 3: Success
  const [formData, setFormData] = useState({
    recipientName: '',
    iban: '',
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState({
    recipientName: '',
    iban: '',
    amount: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors = { recipientName: '', iban: '', amount: '' };
    let isValid = true;

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Alıcı adı zorunludur.';
      isValid = false;
    }

    const ibanRegex = /^TR[0-9]{22}$/; // Corrected for 24 digits after TR
    if (!formData.iban.trim() || !ibanRegex.test(formData.iban.replace(/\s/g, ''))) {
      newErrors.iban = 'Geçerli bir TR IBAN girin (24 rakam).';
      isValid = false;
    }

    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Geçerli bir tutar girin.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setStep(2);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!user) {
      alert("Bu işlemi yapmak için giriş yapmalısınız.");
      return;
    }

    setIsProcessing(true);
    try {
      const transactionsCol = collection(db, 'users', user.id, 'transactions');
      await addDoc(transactionsCol, {
        type: 'transfer',
        recipientName: formData.recipientName,
        iban: formData.iban,
        amount: parseFloat(formData.amount),
        description: formData.description,
        createdAt: serverTimestamp(),
        status: 'completed'
      });
      setStep(3);
    } catch (error) {
      console.error("Transfer error: ", error);
      alert("Transfer sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      setStep(1); // Go back to form on error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewTransfer = () => {
    setFormData({ recipientName: '', iban: '', amount: '', description: '' });
    setErrors({ recipientName: '', iban: '', amount: '' });
    setStep(1);
  };

  const renderForm = () => (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div>
        <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alıcı Adı Soyadı</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" id="recipientName" name="recipientName" value={formData.recipientName} onChange={handleInputChange} className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.recipientName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-yellow-500 bg-gray-50 dark:bg-gray-700`} />
        </div>
        {errors.recipientName && <p className="text-red-500 text-xs mt-1">{errors.recipientName}</p>}
      </div>
      <div>
        <label htmlFor="iban" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IBAN</label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" id="iban" name="iban" value={formData.iban} onChange={handleInputChange} placeholder="TR" className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.iban ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-yellow-500 bg-gray-50 dark:bg-gray-700`} />
        </div>
        {errors.iban && <p className="text-red-500 text-xs mt-1">{errors.iban}</p>}
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tutar</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleInputChange} placeholder="0.00" className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-yellow-500 bg-gray-50 dark:bg-gray-700`} />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>
        <div className="mt-7">
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors">
                <Send size={18} /> Gönder
            </button>
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama (İsteğe Bağlı)</label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-4 text-gray-400" size={20} />
          <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-yellow-500 bg-gray-50 dark:bg-gray-700"></textarea>
        </div>
      </div>
    </form>
  );

  const renderConfirmation = () => (
    <div className="text-center">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Transferi Onayla</h3>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3 text-left">
        <div className="flex justify-between"><span className="font-semibold text-gray-600 dark:text-gray-300">Alıcı:</span> <span className="text-gray-800 dark:text-gray-100">{formData.recipientName}</span></div>
        <div className="flex justify-between"><span className="font-semibold text-gray-600 dark:text-gray-300">IBAN:</span> <span className="text-gray-800 dark:text-gray-100">{formData.iban}</span></div>
        <div className="flex justify-between"><span className="font-semibold text-gray-600 dark:text-gray-300">Tutar:</span> <span className="font-bold text-lg text-green-600">{parseFloat(formData.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></div>
        {formData.description && <div className="flex justify-between"><span className="font-semibold text-gray-600 dark:text-gray-300">Açıklama:</span> <span className="text-gray-800 dark:text-gray-100">{formData.description}</span></div>}
      </div>
      <div className="mt-6 flex gap-4">
        <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Geri</button>
        <button onClick={handleConfirmTransfer} disabled={isProcessing} className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-green-400 flex items-center justify-center gap-2">
          {isProcessing ? <><Loader2 className="animate-spin" size={20} /> İşleniyor...</> : 'Onayla'}
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-8">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">İşlem Başarılı!</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">Para transferiniz başarıyla gerçekleştirildi.</p>
      <p className="text-gray-800 dark:text-gray-100 font-bold mt-4 text-3xl">{parseFloat(formData.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
      <div className="mt-8">
        <button onClick={handleNewTransfer} className="w-full py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold">Yeni Transfer Yap</button>
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
            <Send className="w-7 h-7 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Para Gönder</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm">
          {step === 1 && renderForm()}
          {step === 2 && renderConfirmation()}
          {step === 3 && renderSuccess()}
        </div>
      </main>
    </div>
  );
};

export default TransferPage;