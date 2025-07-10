import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVICE_CATEGORIES, Service } from '../../types/application';
import { Search, ArrowRight } from 'lucide-react';

export const ServicesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter services based on search and category
  const filteredCategories = SERVICE_CATEGORIES.map(category => ({
    ...category,
    services: category.services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || category.id === selectedCategory;
      return matchesSearch && matchesCategory;
    })
  })).filter(category => category.services.length > 0);

  const handleServiceClick = (service: Service) => {
    navigate(`/application/${service.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Hizmet Başvuruları</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            İhtiyacınız olan hizmetler için kolayca başvuru yapın. Başvurunuz değerlendirildikten sonra size geri dönüş yapılacaktır.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Hizmet ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Category Filter */}
            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Kategoriler</option>
                {SERVICE_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="space-y-8">
          {filteredCategories.map(category => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Category Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <span className="text-2xl mr-3">{category.icon}</span>
                  {category.name}
                </h2>
              </div>
              
              {/* Services Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.services.map(service => (
                    <div
                      key={service.id}
                      onClick={() => handleServiceClick(service)}
                      className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-gray-50 hover:bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sonuç Bulunamadı</h3>
            <p className="text-gray-600">
              Aradığınız kriterlere uygun hizmet bulunamadı. Lütfen farklı arama terimleri deneyin.
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Başvuru Süreci Nasıl İşliyor?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                1
              </div>
              <h4 className="font-medium text-blue-900 mb-2">Hizmet Seçin</h4>
              <p className="text-sm text-blue-800">
                İhtiyacınız olan hizmeti listeden seçin ve başvuru formunu doldurun.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                2
              </div>
              <h4 className="font-medium text-blue-900 mb-2">Değerlendirme</h4>
              <p className="text-sm text-blue-800">
                Başvurunuz 1-3 iş günü içinde değerlendirilir ve size geri dönüş yapılır.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                3
              </div>
              <h4 className="font-medium text-blue-900 mb-2">Takip</h4>
              <p className="text-sm text-blue-800">
                Başvuru durumunuzu hizmetler sayfasından takip edebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesListPage;