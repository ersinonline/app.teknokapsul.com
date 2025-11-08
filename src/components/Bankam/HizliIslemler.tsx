import React from 'react';
import { Send, Receipt, Landmark, PiggyBank } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const quickActions = [
  { label: 'Para Gönder', icon: Send, path: '/transfer' },
  { label: 'Fatura Öde', icon: Receipt, path: '/bills' },
  { label: 'Kredi Başvur', icon: Landmark, path: '/credit-application' },
  { label: 'Birikim Yap', icon: PiggyBank, path: '/savings' },
];

const HizliIslemler: React.FC = () => {
  const navigate = useNavigate();
  const handleNavigation = (path: string) => navigate(path);

  return (
    <div className="grid grid-cols-4 gap-4 text-center mb-6">
      {quickActions.map(action => (
        <div key={action.label} onClick={() => handleNavigation(action.path)} className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full mx-auto flex items-center justify-center">
            <action.icon className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-gray-700 mt-2">{action.label}</p>
        </div>
      ))}
    </div>
  );
};

export default HizliIslemler;