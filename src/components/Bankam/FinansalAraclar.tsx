import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Target, PieChart, Calculator, Database } from 'lucide-react';

const financialTools = [
  { title: 'Gelirlerim', icon: TrendingUp, route: '/income', color: 'text-green-500' },
  { title: 'Giderlerim', icon: TrendingDown, route: '/expense', color: 'text-red-500' },
  { title: 'Hedeflerim', icon: Target, route: '/goals', color: 'text-blue-500' },
  { title: 'Portföyüm', icon: PieChart, route: '/portfolio', color: 'text-purple-500' },
  { title: 'Kredi Hesapla', icon: Calculator, route: '/credit-calculator', color: 'text-teal-500' },
  { title: 'Finansal Veriler', icon: Database, route: '/financial-data', color: 'text-gray-500' },
];

const FinansalAraclar: React.FC = () => {
  const navigate = useNavigate();
  const handleNavigation = (path: string) => navigate(path);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mt-6">
       <h2 className="font-bold text-gray-800 mb-4">Finansal Araçlar</h2>
       <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {financialTools.map(tool => {
            const Icon = tool.icon;
            return (
              <div key={tool.title} onClick={() => handleNavigation(tool.route)} className="flex flex-col items-center justify-center text-center cursor-pointer group">
                 <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <Icon className={`w-7 h-7 ${tool.color}`} />
                 </div>
                 <p className="text-xs font-semibold text-gray-600 mt-2">{tool.title}</p>
              </div>
            );
          })}
       </div>
    </div>
  );
};

export default FinansalAraclar;