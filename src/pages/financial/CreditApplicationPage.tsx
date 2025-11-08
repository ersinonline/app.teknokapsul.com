import React from 'react';
import { ArrowLeft, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreditApplicationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <div className="flex items-center gap-2">
            <Landmark className="w-7 h-7 text-purple-500" />
            <h1 className="text-2xl font-bold text-gray-800">Kredi Başvurusu</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Çok Yakında!</h2>
          <p className="text-gray-600">
            Bu özellik şu anda geliştirme aşamasındadır. En kısa sürede hizmetinizde olacaktır.
          </p>
        </div>
      </main>
    </div>
  );
};

export default CreditApplicationPage;