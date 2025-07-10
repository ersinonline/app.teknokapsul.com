import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Eye, Calendar, User, FileText, Search, Trash2 } from 'lucide-react';

interface FormSubmission {
  id: string;
  formType: string;
  submittedAt: any;
  data: any;
  userEmail?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
}

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Admin kontrolü
  if (!user || user.email !== 'clk.ersinnn@gmail.com') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const submissionsData: FormSubmission[] = [];
      
      console.log('🔍 Admin sayfası: Başvuru verilerini çekmeye başlıyor...');
      
      // Tüm kullanıcıların başvurularını topla
      const teknokapsulRef = collection(db, 'teknokapsul');
      const usersSnapshot = await getDocs(teknokapsulRef);
      
      console.log('👥 Toplam kullanıcı sayısı:', usersSnapshot.docs.length);
      console.log('👥 Kullanıcı ID\'leri:', usersSnapshot.docs.map(doc => doc.id));
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          console.log(`🔍 Kullanıcı ${userDoc.id} için başvurular kontrol ediliyor...`);
          const applicationsRef = collection(db, 'teknokapsul', userDoc.id, 'applications');
          const q = query(applicationsRef, orderBy('createdAt', 'desc'));
          const applicationsSnapshot = await getDocs(q);
          
          console.log(`📋 Kullanıcı ${userDoc.id} için ${applicationsSnapshot.docs.length} başvuru bulundu`);
          
          applicationsSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('📄 Başvuru verisi:', {
              id: doc.id,
              serviceName: data.serviceName,
              applicantEmail: data.applicantInfo?.email,
              createdAt: data.createdAt,
              status: data.status
            });
            submissionsData.push({
              id: doc.id,
              formType: data.serviceName || 'Bilinmeyen Hizmet',
              submittedAt: data.createdAt,
              data: data,
              userEmail: data.applicantInfo?.email || 'Bilinmeyen',
              status: data.status || 'pending'
            } as FormSubmission);
          });
        } catch (userError) {
          console.error(`❌ Kullanıcı ${userDoc.id} için başvuru çekilemedi:`, userError);
        }
      }
      
      console.log('✅ Toplam başvuru sayısı:', submissionsData.length);
      console.log('📊 Başvuru listesi:', submissionsData.map(s => ({ id: s.id, type: s.formType, email: s.userEmail })));
      
      // Tarihe göre sırala
      submissionsData.sort((a, b) => {
        const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt);
        const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setSubmissions(submissionsData);
      console.log('🎯 State güncellendi, başvuru sayısı:', submissionsData.length);
    } catch (error) {
      console.error('❌ Form başvuruları yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormTypeText = (type: string) => {
    const types: { [key: string]: string } = {
      'application': 'Başvuru Formu',
      'contact': 'İletişim Formu',
      'support': 'Destek Talebi',
      'complaint': 'Şikayet Formu',
      'suggestion': 'Öneri Formu'
    };
    return types[type] || type;
  };

  const getStatusText = (status: string) => {
    const statuses: { [key: string]: string } = {
      'pending': 'Beklemede',
      'reviewed': 'İncelendi',
      'approved': 'Onaylandı',
      'rejected': 'Reddedildi'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'reviewed': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = searchTerm === '' || 
      submission.data?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.data?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || submission.formType === filterType;
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Bilinmiyor';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffb700] mx-auto mb-4"></div>
          <p className="text-gray-600">Form başvuruları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Paneli</h1>
          <p className="text-gray-600">Form başvurularını yönetin ve inceleyin</p>
          <div className="w-20 h-1 bg-[#ffb700] rounded-full mt-4"></div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Ad, email ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
            >
              <option value="all">Tüm Form Türleri</option>
              <option value="application">Başvuru Formu</option>
              <option value="contact">İletişim Formu</option>
              <option value="support">Destek Talebi</option>
              <option value="complaint">Şikayet Formu</option>
              <option value="suggestion">Öneri Formu</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Beklemede</option>
              <option value="reviewed">İncelendi</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Başvuru</p>
                <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Beklemede</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Onaylanan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reddedilen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Form Başvuruları</h2>
          </div>
          
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Henüz form başvurusu bulunmuyor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form Türü
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gönderen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getFormTypeText(submission.formType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {submission.data?.name || 'Bilinmiyor'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.data?.email || submission.userEmail || 'Email yok'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(submission.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                          {getStatusText(submission.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowModal(true);
                          }}
                          className="text-[#ffb700] hover:text-[#e6a600] mr-3"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Submission Details Modal */}
        {showModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {getFormTypeText(selectedSubmission.formType)} Detayları
                    </h3>
                    <div className="w-12 h-1 bg-[#ffb700] rounded-full"></div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gönderim Tarihi</label>
                      <p className="text-gray-900">{formatDate(selectedSubmission.submittedAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Durum</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                        {getStatusText(selectedSubmission.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Form Verileri</label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedSubmission.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Kapat
                  </button>
                  <button
                    onClick={() => {
                      // Durum güncelleme işlemi yapılabilir
                      setShowModal(false);
                    }}
                    className="flex-1 bg-[#ffb700] text-white px-4 py-2 rounded-lg hover:bg-[#e6a600] transition-colors"
                  >
                    Durumu Güncelle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;