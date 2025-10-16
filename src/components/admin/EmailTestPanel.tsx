import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { sendDebtNotification, validateEmailConfiguration } from '../../services/email.service';

export const EmailTestPanel: React.FC = () => {
  const [testData, setTestData] = useState({
    to_email: '',
    to_name: 'Test Kullanıcı',
    debt_description: 'Test Borç Açıklaması',
    debt_amount: '1.500,00 TL',
    debt_creditor: 'Test Alacaklı',
    debt_due_date: new Date().toLocaleDateString('tr-TR'),
    debt_notes: 'Bu bir test e-postasıdır.'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [configValid, setConfigValid] = useState(false);

  React.useEffect(() => {
    setConfigValid(validateEmailConfiguration());
  }, []);

  const handleTestEmail = async () => {
    if (!testData.to_email) {
      setResult({ success: false, message: 'E-posta adresi gerekli!' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const success = await sendDebtNotification(testData);
      
      if (success) {
        setResult({ 
          success: true, 
          message: 'Test e-postası başarıyla gönderildi!' 
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
        <h2 className="text-xl font-semibold">E-posta Sistemi Test Paneli</h2>
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
            Environment variables'ları kontrol edin: VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY
          </p>
        )}
      </div>

      {/* Test Form */}
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
              Borç Tutarı
            </label>
            <input
              type="text"
              value={testData.debt_amount}
              onChange={(e) => setTestData({ ...testData, debt_amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Borç Açıklaması
          </label>
          <input
            type="text"
            value={testData.debt_description}
            onChange={(e) => setTestData({ ...testData, debt_description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alacaklı
          </label>
          <input
            type="text"
            value={testData.debt_creditor}
            onChange={(e) => setTestData({ ...testData, debt_creditor: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notlar
          </label>
          <textarea
            value={testData.debt_notes}
            onChange={(e) => setTestData({ ...testData, debt_notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleTestEmail}
          disabled={loading || !configValid || !testData.to_email}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Test E-postası Gönder
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
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Kullanım Talimatları:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. EmailJS yapılandırmasının aktif olduğundan emin olun</li>
          <li>2. Test e-posta adresini girin</li>
          <li>3. "Test E-postası Gönder" butonuna tıklayın</li>
          <li>4. E-posta kutunuzu kontrol edin (spam klasörü dahil)</li>
          <li>5. Sorun yaşarsanız browser console'u kontrol edin</li>
        </ul>
      </div>
    </div>
  );
};