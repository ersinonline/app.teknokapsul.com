import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CheckCircle, XCircle, Calendar, User, FileText, Phone, Mail } from 'lucide-react';
import { Application } from '../../types/application';
import { applicationService } from '../../services/application.service';

const ApplicationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user?.id) {
        setApplications([]);
        setLoading(false);
        return;
      }

      try {
        const applicationData = await applicationService.getUserApplications(user.id);
        setApplications(applicationData);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'approved':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      case 'completed':
        return 'Tamamlandı';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffb700]"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-3">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" style={{ color: '#ffb700' }} />
            <h1 className="text-xl font-semibold text-gray-900">Başvurularım</h1>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-4">

        
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Henüz başvurunuz yok
            </h3>
            <p className="text-gray-600 mb-6">
              Tekno-hizmet sayfasından yeni bir başvuru oluşturabilirsiniz.
            </p>
            <button
              onClick={() => navigate('/tekno-hizmet')}
              className="px-6 py-3 bg-[#ffb700] text-white rounded-lg hover:bg-[#e6a600] transition-colors"
            >
              Yeni Başvuru Oluştur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {application.serviceName}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {application.serviceCategory}
                    </p>
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      #{application.applicationNumber}
                    </span>
                  </div>
                  <div className="flex items-center ml-4">
                    {getStatusIcon(application.status)}
                  </div>
                </div>

                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                  {getStatusText(application.status)}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Oluşturulma: {application.createdAt.toLocaleDateString('tr-TR')}</span>
                    </div>
                    {application.updatedAt.getTime() !== application.createdAt.getTime() && (
                      <div className="flex items-center">
                        <span>Güncelleme: {application.updatedAt.toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                  </div>
                  
                  {application.applicantInfo?.fullName && (
                    <div className="flex items-center mb-2 text-sm text-gray-500">
                      <User className="w-4 h-4 mr-1" />
                      <span>{application.applicantInfo.fullName}</span>
                    </div>
                  )}

                  {application.applicantInfo?.phone && (
                    <div className="flex items-center mb-2 text-sm text-gray-500">
                      <Phone className="w-4 h-4 mr-1" />
                      <span>{application.applicantInfo.phone}</span>
                    </div>
                  )}

                  {application.applicantInfo?.email && (
                    <div className="flex items-center mb-2 text-sm text-gray-500">
                      <Mail className="w-4 h-4 mr-1" />
                      <span>{application.applicantInfo.email}</span>
                    </div>
                  )}

                  {application.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Notlar:</strong> {application.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsListPage;