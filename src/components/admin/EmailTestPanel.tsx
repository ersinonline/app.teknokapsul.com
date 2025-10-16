import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { sendExpenseNotification, sendExpenseReminder, validateEmailConfiguration } from '../../services/email.service';

export const EmailTestPanel: React.FC = () => {
  const [testType, setTestType] = useState<'notification' | 'reminder' | 'manual_check'>('notification');
  const [testData, setTestData] = useState({
    to_email: '',
    to_name: 'Test Kullanıcı',
    expense_title: 'Test Gider',
    expense_amount: '1.500,00 TL',
    expense_category: 'Faturalar',
    expense_date: new Date().toLocaleDateString('tr-TR'),
    expense_due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR'),
    is_installment: false,
    installment_info: '',
    days_until_due: '2'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [configValid, setConfigValid] = useState(false);

  React.useEffect(() => {
    setConfigValid(validateEmailConfiguration());
  }, []);

  const handleManualReminderCheck = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('https://us-central1-superapp-37db4.cloudfunctions.net/checkExpenseRemindersManual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({ 
          success: true, 
          message: `Manuel kontrol tamamlandı! Toplam: ${data.totalReminders}, Başarılı: ${data.successfulReminders}, Başarısız: ${data.failedReminders}` 
        });
      } else {
        setResult({ 
          success: false, 
          message: `Manuel kontrol başarısız: ${data.message || 'Bilinmeyen hata'}` 
        });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: `Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (testType === 'manual_check') {
      await handleManualReminderCheck();
      return;
    }

    if (!testData.to_email) {
      setResult({ success: false, message: 'E-posta adresi gerekli!' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let success = false;
      
      if (testType === 'notification') {
        success = await sendExpenseNotification({
          to_email: testData.to_email,
          to_name: testData.to_name,
          expense_title: testData.expense_title,
          expense_amount: testData.expense_amount,
          expense_category: testData.expense_category,
          expense_date: testData.expense_date,
          is_installment: testData.is_installment,
          installment_info: testData.installment_info
        });
      } else {
        success = await sendExpenseReminder({
          to_email: testData.to_email,
          to_name: testData.to_name,
          expense_title: testData.expense_title,
          expense_amount: testData.expense_amount,
          expense_category: testData.expense_category,
          expense_due_date: testData.expense_due_date,
          days_until_due: testData.days_until_due
        });
      }
      
      if (success) {
        setResult({ 
          success: true, 
          message: `Test ${testType === 'notification' ? 'bildirim' : 'hatırlatma'} e-postası başarıyla gönderildi!` 
        });
      } else {
        setResult({ 
          success: false, 
          message: 'E-posta gönderilemedi. Konsol loglarını kontrol edin.' 
        });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: `Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Mail className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Gider E-posta Sistemi Test Paneli</h2>
      </div>

      {/* Configuration Status */}
      <div className={`p-4 rounded-lg mb-6 ${
        configValid 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center gap-2">
          {configValid ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={`font-medium ${
            configValid ? 'text-green-800' : 'text-red-800'
          }`}>
            EmailJS Yapılandırması: {configValid ? 'Aktif' : 'Eksik'}
          </span>
        </div>
        {!configValid && (
          <p className="text-red-700 text-sm mt-2">
            Environment variables'ları kontrol edin: VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_EXPENSE_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY
          </p>
        )}
      </div>

      {/* Test Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Türü
        </label>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center">
            <input
              type="radio"
              value="notification"
              checked={testType === 'notification'}
              onChange={(e) => setTestType(e.target.value as 'notification' | 'reminder' | 'manual_check')}
              className="mr-2"
            />
            Gider Bildirimi
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="reminder"
              checked={testType === 'reminder'}
              onChange={(e) => setTestType(e.target.value as 'notification' | 'reminder' | 'manual_check')}
              className="mr-2"
            />
            Hatırlatma E-postası
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="manual_check"
              checked={testType === 'manual_check'}
              onChange={(e) => setTestType(e.target.value as 'notification' | 'reminder' | 'manual_check')}
              className="mr-2"
            />
            Manuel Hatırlatma Kontrolü
          </label>
        </div>
      </div>

      {/* Manual Check Info */}
      {testType === 'manual_check' && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">
              Manuel Hatırlatma Kontrolü
            </span>
          </div>
          <p className="text-blue-700 text-sm mt-2">
            Bu işlem tüm kullanıcıları kontrol eder ve 2 gün sonra vadesi gelen giderler için hatırlatma e-postası gönderir.
          </p>
        </div>
      )}

      {/* Test Form - Only show for email tests */}
      {testType !== 'manual_check' && (
        <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test E-posta Adresi *
          </label>
          <input
            type="email"
            value={testData.to_email}
            onChange={(e) => setTestData({ ...testData, to_email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="test@example.com"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={testData.to_name}
              onChange={(e) => setTestData({ ...testData, to_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gider Tutarı
            </label>
            <input
              type="text"
              value={testData.expense_amount}
              onChange={(e) => setTestData({ ...testData, expense_amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gider Başlığı
            </label>
            <input
              type="text"
              value={testData.expense_title}
              onChange={(e) => setTestData({ ...testData, expense_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              value={testData.expense_category}
              onChange={(e) => setTestData({ ...testData, expense_category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Faturalar">Faturalar</option>
              <option value="Kira">Kira</option>
              <option value="Market">Market</option>
              <option value="Ulaşım">Ulaşım</option>
              <option value="Sağlık">Sağlık</option>
              <option value="Eğlence">Eğlence</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>
        </div>

        {testType === 'notification' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gider Tarihi
              </label>
              <input
                type="text"
                value={testData.expense_date}
                onChange={(e) => setTestData({ ...testData, expense_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <input
                  type="checkbox"
                  checked={testData.is_installment}
                  onChange={(e) => setTestData({ ...testData, is_installment: e.target.checked })}
                  className="mr-2"
                />
                Taksitli Ödeme
              </label>
              {testData.is_installment && (
                <input
                  type="text"
                  value={testData.installment_info}
                  onChange={(e) => setTestData({ ...testData, installment_info: e.target.value })}
                  placeholder="Taksit bilgisi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          </div>
        )}

        {testType === 'reminder' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Son Ödeme Tarihi
              </label>
              <input
                type="text"
                value={testData.expense_due_date}
                onChange={(e) => setTestData({ ...testData, expense_due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kalan Gün Sayısı
              </label>
              <input
                type="number"
                value={testData.days_until_due}
                onChange={(e) => setTestData({ ...testData, days_until_due: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        </div>
      )}

      <button
        onClick={handleTestEmail}
        disabled={loading || (testType !== 'manual_check' && (!configValid || !testData.to_email))}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            {testType === 'manual_check' ? 'Kontrol Ediliyor...' : 'Gönderiliyor...'}
          </>
        ) : (
          <>
            {testType === 'manual_check' ? (
              <>
                <Clock className="w-4 h-4" />
                Manuel Kontrol Başlat
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Test E-postası Gönder
              </>
            )}
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div className={`p-4 rounded-lg ${
          result.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.message}
            </span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Kullanım Talimatları:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. EmailJS yapılandırmasının aktif olduğundan emin olun (manuel kontrol hariç)</li>
          <li>2. Test türünü seçin (Bildirim, Hatırlatma veya Manuel Kontrol)</li>
          <li>3. E-posta testleri için test e-posta adresini ve diğer bilgileri girin</li>
          <li>4. Manuel kontrol tüm kullanıcıları kontrol eder ve gerçek hatırlatmalar gönderir</li>
          <li>5. Test butonuna tıklayın ve sonucu bekleyin</li>
          <li>6. E-posta testleri için spam klasörünü de kontrol edin</li>
          <li>7. Sorun yaşarsanız browser console'u kontrol edin</li>
        </ul>
      </div>
    </div>
  );
};