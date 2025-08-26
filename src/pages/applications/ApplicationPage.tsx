import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService } from '../../services/application.service';
import { SERVICE_CATEGORIES, Service } from '../../types/application';
import { ArrowLeft, FileText, Phone, Mail, MapPin, User, CreditCard, Send } from 'lucide-react';

interface ApplicationFormData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  identityNumber: string;
  notes: string;
}

export const ApplicationPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ApplicationFormData>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    identityNumber: '',
    notes: ''
  });

  // Find the service based on serviceId
  const findService = (serviceId: string): Service | null => {
    for (const category of SERVICE_CATEGORIES) {
      const service = category.services.find(s => s.id === serviceId);
      if (service) {
        return {
          ...service,
          category: category.name
        };
      }
    }
    return null;
  };

  useEffect(() => {
    if (serviceId) {
      const foundService = findService(serviceId);
      if (foundService) {
        setService(foundService);
      }
    }
  }, [serviceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Check if service requires address
  const requiresAddress = service?.category === 'İnternet & TV';
  const requiresIdentityNumber = service?.category === 'İnternet & TV';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !service) return;

    setLoading(true);
    try {
      const applicantInfo: any = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email
      };
      
      if (formData.address) {
        applicantInfo.address = formData.address;
      }
      
      if (formData.identityNumber) {
        applicantInfo.identityNumber = formData.identityNumber;
      }
      
      const applicationData = {
        serviceType: service.id,
        serviceName: service.name,
        serviceCategory: service.category,
        applicantInfo,
        status: 'pending' as const,
        notes: formData.notes || ''
      };

      const applicationId = await applicationService.createApplication(user.id, applicationData);
      
      // Get the created application to show the application number
      const applications = await applicationService.getUserApplications(user.id);
      const createdApplication = applications.find(app => app.id === applicationId);
      
      // Navigate to services page with application number and success message
      navigate('/services', {
        state: {
          applicationNumber: createdApplication?.applicationNumber,
          successMessage: 'Başvurunuz başarıyla alındı!'
        }
      });
    } catch (error) {
      console.error('Error creating application:', error);
      alert('Başvuru oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hizmet Bulunamadı</h2>
          <button
            onClick={() => navigate('/services')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Hizmetler Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/services')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Geri Dön
          </button>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
                <p className="text-gray-600">{service.category}</p>
              </div>
            </div>
            <p className="text-gray-700">
              {service.name} hizmeti için başvuru formunu doldurun. Başvurunuz değerlendirildikten sonra size geri dönüş yapılacaktır.
            </p>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Başvuru Formu</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Adınız ve soyadınız"
                />
              </div>
              
              {requiresIdentityNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CreditCard className="h-4 w-4 inline mr-2" />
                    TC Kimlik No *
                  </label>
                  <input
                    type="text"
                    name="identityNumber"
                    value={formData.identityNumber}
                    onChange={handleInputChange}
                    required={requiresIdentityNumber}
                    maxLength={11}
                    pattern="[0-9]{11}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="12345678901"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Telefon *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0555 123 45 67"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-2" />
                  E-posta *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            {requiresAddress && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Adres *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required={requiresAddress}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tam adresinizi yazın"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ek Notlar
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Başvurunuzla ilgili ek bilgiler (isteğe bağlı)"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-3 bg-[#ffb700] text-white rounded-lg hover:bg-[#e6a600] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                ) : (
                  <Send className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Bilgilendirme</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Başvurunuz 1-3 iş günü içinde değerlendirilecektir.</li>
            <li>• Başvuru durumunuzu hizmetler sayfasından takip edebilirsiniz.</li>
            <li>• Size özel bir başvuru numarası verilecektir.</li>
            <li>• Gerekli durumlarda sizinle iletişime geçilecektir.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApplicationPage;