import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Eye, Calendar, User, FileText, Search, Trash2, MessageSquare, Headphones, Edit, Check, X, Plus, Settings, CheckCircle, Mail, Package, ShoppingCart, Clock } from 'lucide-react';
import { getAllSupportTickets, updateSupportTicketStatus, deleteSupportTicket, updateSupportTicket } from '../../services/support.service';
import { deleteApplication, updateApplication } from '../../services/application.service';
import { SupportTicket, SUPPORT_CATEGORIES, SUPPORT_PRIORITIES, SUPPORT_STATUSES } from '../../types/support';
import { SupportTicketReplies } from '../../components/support/SupportTicketReplies';
import { EmailTestPanel } from '../../components/admin/EmailTestPanel';
import { getDigitalCodes, addDigitalCode, updateDigitalCode, deleteDigitalCode, getAllDigitalOrders, DigitalCode, DigitalOrder } from '../../services/digitalCode.service';

interface FormSubmission {
  id: string;
  formType: string;
  submittedAt: any;
  data: any;
  userEmail?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  userId?: string;
}


const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'applications' | 'support' | 'email' | 'digitalCodes'>('applications');
  const [isEditing, setIsEditing] = useState(false);
  const [editingTicket, setEditingTicket] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editTicketData, setEditTicketData] = useState<any>({});

  // Digital Codes state
  const [digitalCodes, setDigitalCodes] = useState<DigitalCode[]>([]);
  const [digitalOrders, setDigitalOrders] = useState<DigitalOrder[]>([]);
  const [showAddDigitalCode, setShowAddDigitalCode] = useState(false);
  const [newDigitalCode, setNewDigitalCode] = useState({ name: '', category: '', price: 0, description: '', stock: 10, active: true });
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [selectedDigitalCodes, setSelectedDigitalCodes] = useState<string[]>([]);
  const [digitalCodesSortOrder, setDigitalCodesSortOrder] = useState<'asc' | 'desc'>('asc');


  // Admin kontrolü
  if (!user || user.email !== 'clk.ersinnn@gmail.com') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchSubmissions();
    fetchSupportTickets();
    fetchDigitalCodes();
    fetchDigitalOrders();
  }, []);



  const fetchSubmissions = async () => {
    try {
      const submissionsData: FormSubmission[] = [];
      
      console.log('🔍 Admin sayfası: Başvuru verilerini çekmeye başlıyor...');
      
      // Doğrudan teknokapsul-application koleksiyonundan tüm başvuruları çek
      const applicationsRef = collection(db, 'teknokapsul-application');
      const q = query(applicationsRef, orderBy('createdAt', 'desc'));
      const applicationsSnapshot = await getDocs(q);
      
      console.log(`📋 Toplam ${applicationsSnapshot.docs.length} başvuru bulundu`);
      
      applicationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`📄 Başvuru verisi:`, data);
        submissionsData.push({
          id: doc.id,
          formType: data.serviceType || data.serviceName || 'unknown',
          submittedAt: data.createdAt,
          data: data,
          userEmail: data.applicantInfo?.email || 'Bilinmiyor',
          status: data.status || 'pending',
          userId: data.userId
        });
      });
      
      console.log('✅ Toplam başvuru sayısı:', submissionsData.length);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('❌ Başvurular yüklenirken hata:', error);
    }
  };

  // Başvuru bilgilerini kaydet
  const handleSaveSubmission = async () => {
    if (!selectedSubmission) return;
    
    try {
      const updatedData = {
        applicantInfo: {
          ...selectedSubmission.data.applicantInfo,
          fullName: editFormData.fullName,
          email: editFormData.email,
          phone: editFormData.phone,
          identityNumber: editFormData.identityNumber,
          address: editFormData.address
        },
        notes: editFormData.notes
      };
      
      await updateApplication(selectedSubmission.id, updatedData);
      await fetchSubmissions();
      setIsEditing(false);
      setShowModal(false);
      console.log('✅ Başvuru güncellendi');
    } catch (error) {
      console.error('❌ Başvuru güncellenirken hata:', error);
      alert('Başvuru güncellenirken bir hata oluştu.');
    }
  };

  // Destek talebi bilgilerini kaydet
  const handleSaveTicket = async () => {
    if (!selectedTicket) return;
    
    try {
      await updateSupportTicket(selectedTicket.id, editTicketData);
      await fetchSupportTickets();
      setEditingTicket(false);
      setShowTicketModal(false);
      console.log('✅ Destek talebi güncellendi');
    } catch (error) {
      console.error('❌ Destek talebi güncellenirken hata:', error);
      alert('Destek talebi güncellenirken bir hata oluştu.');
    }
  };

  // Edit ve Delete fonksiyonları
  const handleEditSubmission = (submission: FormSubmission) => {
    // Düzenleme modalını aç
    setSelectedSubmission(submission);
    setEditFormData({
      fullName: submission.data.applicantInfo?.fullName || '',
      email: submission.data.applicantInfo?.email || '',
      phone: submission.data.applicantInfo?.phone || '',
      identityNumber: submission.data.applicantInfo?.identityNumber || '',
      address: submission.data.applicantInfo?.address || '',
      notes: submission.data.notes || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (window.confirm('Bu başvuruyu silmek istediğinizden emin misiniz?')) {
      try {
        await deleteApplication(submissionId);
        await fetchSubmissions(); // Listeyi yenile
        console.log('✅ Başvuru silindi');
      } catch (error) {
        console.error('❌ Başvuru silinirken hata:', error);
        alert('Başvuru silinirken bir hata oluştu.');
      }
    }
  };

  const handleEditTicket = (ticket: SupportTicket) => {
    // Düzenleme modalını aç
    setSelectedTicket(ticket);
    setEditTicketData({
      title: ticket.title || '',
      name: ticket.name || '',
      email: ticket.email || '',
      category: ticket.category || '',
      priority: ticket.priority || '',
      description: ticket.description || ''
    });
    setEditingTicket(true);
    setShowTicketModal(true);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (window.confirm('Bu destek talebini silmek istediğinizden emin misiniz?')) {
      try {
        await deleteSupportTicket(ticketId);
        await fetchSupportTickets(); // Listeyi yenile
        console.log('✅ Destek talebi silindi');
      } catch (error) {
        console.error('❌ Destek talebi silinirken hata:', error);
        alert('Destek talebi silinirken bir hata oluştu.');
      }
    }
  };


  const fetchSupportTickets = async () => {
    try {
      const tickets = await getAllSupportTickets();
      setSupportTickets(tickets);
      console.log('✅ Destek talepleri yüklendi:', tickets.length);
    } catch (error) {
      console.error('❌ Destek talepleri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchDigitalCodes = async () => {
    try {
      const data = await getDigitalCodes();
      setDigitalCodes(data);
    } catch (error) {
      console.error('Dijital kodlar yüklenirken hata:', error);
    }
  };

  const fetchDigitalOrders = async () => {
    try {
      const data = await getAllDigitalOrders();
      setDigitalOrders(data);
    } catch (error) {
      console.error('Dijital siparişler yüklenirken hata:', error);
    }
  };

  const handleAddDigitalCodeSubmit = async () => {
    if (!newDigitalCode.name || !newDigitalCode.category || !newDigitalCode.price) {
      alert('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    try {
      await addDigitalCode(newDigitalCode);
      setNewDigitalCode({ name: '', category: '', price: 0, description: '', stock: 10, active: true });
      setShowAddDigitalCode(false);
      await fetchDigitalCodes();
    } catch (error) {
      console.error('Dijital kod eklenirken hata:', error);
    }
  };

  const handleDeleteDigitalCode = async (id: string) => {
    if (!confirm('Bu dijital ürünü silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteDigitalCode(id);
      await fetchDigitalCodes();
    } catch (error) {
      console.error('Dijital kod silinirken hata:', error);
    }
  };

  const handleToggleDigitalCodeActive = async (id: string, active: boolean) => {
    try {
      await updateDigitalCode(id, { active: !active });
      await fetchDigitalCodes();
    } catch (error) {
      console.error('Dijital kod güncellenirken hata:', error);
    }
  };

  const handleToggleDigitalCodeSelection = (id: string) => {
    setSelectedDigitalCodes(prev => 
      prev.includes(id) ? prev.filter(codeId => codeId !== id) : [...prev, id]
    );
  };

  const handleSelectAllDigitalCodes = () => {
    if (selectedDigitalCodes.length === digitalCodes.length) {
      setSelectedDigitalCodes([]);
    } else {
      setSelectedDigitalCodes(digitalCodes.map(code => code.id!));
    }
  };

  const handleBulkDeleteDigitalCodes = async () => {
    if (selectedDigitalCodes.length === 0) {
      alert('Lütfen silmek istediğiniz ürünleri seçin.');
      return;
    }

    if (!confirm(`Seçili ${selectedDigitalCodes.length} ürünü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      for (const id of selectedDigitalCodes) {
        await deleteDigitalCode(id);
      }
      await fetchDigitalCodes();
      setSelectedDigitalCodes([]);
      alert(`${selectedDigitalCodes.length} ürün başarıyla silindi.`);
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      alert('Ürünler silinirken bir hata oluştu.');
    }
  };

  const toggleDigitalCodesSortOrder = () => {
    setDigitalCodesSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getSortedDigitalCodes = () => {
    return [...digitalCodes].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (digitalCodesSortOrder === 'asc') {
        return nameA.localeCompare(nameB, 'tr');
      } else {
        return nameB.localeCompare(nameA, 'tr');
      }
    });
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Excel dosyası için SheetJS kullan
        const XLSX = await import('xlsx');
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
            
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (row && row.length >= 3) {
                const name = String(row[0] || '').trim();
                const category = String(row[1] || '').trim();
                const priceStr = String(row[2] || '').trim();
                const price = parseFloat(priceStr);

                if (name && category && !isNaN(price)) {
                  try {
                    // Aynı isimli ürün var mı kontrol et
                    const existingCode = digitalCodes.find(code => code.name.toLowerCase() === name.toLowerCase());
                    
                    if (existingCode) {
                      // Mevcut ürünü güncelle (stok ekle)
                      await updateDigitalCode(existingCode.id!, {
                        stock: (existingCode.stock || 0) + 10,
                        price: price // Fiyatı güncelle
                      });
                      successCount++;
                    } else {
                      // Yeni ürün ekle
                      await addDigitalCode({
                        name,
                        category,
                        price,
                        description: '',
                        stock: 10,
                        active: true
                      });
                      successCount++;
                    }
                  } catch (error) {
                    console.error(`Satır ${i + 1} eklenirken hata:`, error);
                    errorCount++;
                  }
                } else {
                  errorCount++;
                }
              }
            }

            await fetchDigitalCodes();
            alert(`Excel yükleme tamamlandı!\n✅ Başarılı: ${successCount}\n❌ Hatalı: ${errorCount}`);
            setShowExcelUpload(false);
          } catch (error) {
            console.error('Excel dosyası işlenirken hata:', error);
            alert('Excel dosyası işlenirken bir hata oluştu.');
          }
        };
        reader.readAsBinaryString(file);
      } else {
        // CSV/TXT dosyası için mevcut yöntem
        const reader = new FileReader();
        reader.onload = async (event) => {
          const text = event.target?.result as string;
          const rows = text.split('\n').filter(row => row.trim());
          
          let successCount = 0;
          let errorCount = 0;

          for (let i = 0; i < rows.length; i++) {
            const columns = rows[i].split(',').map(col => col.trim());
            
            if (columns.length >= 3) {
              const [name, category, priceStr] = columns;
              const price = parseFloat(priceStr);

              if (name && category && !isNaN(price)) {
                try {
                  // Aynı isimli ürün var mı kontrol et
                  const existingCode = digitalCodes.find(code => code.name.toLowerCase() === name.toLowerCase());
                  
                  if (existingCode) {
                    // Mevcut ürünü güncelle (stok ekle)
                    await updateDigitalCode(existingCode.id!, {
                      stock: (existingCode.stock || 0) + 10,
                      price: price // Fiyatı güncelle
                    });
                    successCount++;
                  } else {
                    // Yeni ürün ekle
                    await addDigitalCode({
                      name,
                      category,
                      price,
                      description: '',
                      stock: 10,
                      active: true
                    });
                    successCount++;
                  }
                } catch (error) {
                  console.error(`Satır ${i + 1} eklenirken hata:`, error);
                  errorCount++;
                }
              } else {
                errorCount++;
              }
            } else {
              errorCount++;
            }
          }

          await fetchDigitalCodes();
          alert(`Dosya yükleme tamamlandı!\n✅ Başarılı: ${successCount}\n❌ Hatalı: ${errorCount}`);
          setShowExcelUpload(false);
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      alert('Dosya yüklenirken bir hata oluştu.');
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
      (submission.data?.name && submission.data.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (submission.data?.email && submission.data.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (submission.userEmail && submission.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || submission.formType === filterType;
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Destek talepleri filtreleme
  const filteredSupportTickets = supportTickets.filter(ticket => {
    const matchesSearch = searchTerm === '' ||
                         (ticket.title && ticket.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (ticket.email && ticket.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (ticket.name && ticket.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (ticket.category && ticket.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || ticket.category === filterType;
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Destek talebi durumu güncelleme
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      await updateSupportTicketStatus(ticketId, newStatus);
      await fetchSupportTickets(); // Listeyi yenile
      // Modal'ı kapatmıyoruz, sadece listeyi yeniliyoruz
    } catch (error) {
      console.error('Destek talebi güncellenirken hata:', error);
    }
  };

  // Başvuru durumu güncelleme
  const handleUpdateApplicationStatus = async (submissionId: string, newStatus: 'pending' | 'reviewed' | 'approved' | 'rejected') => {
    try {
      // Firebase'de başvuru durumunu güncelle
      const submissionRef = doc(db, 'teknokapsul-application', submissionId);
      await updateDoc(submissionRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Listeyi yenile
      await fetchSubmissions();
      
      // Seçili başvurunun durumunu güncelle
      if (selectedSubmission) {
        setSelectedSubmission({
          ...selectedSubmission,
          status: newStatus
        });
      }
    } catch (error) {
      console.error('Başvuru durumu güncellenirken hata:', error);
    }
  };

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
      <div className="page-container bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 loading-spinner mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Yönetim Paneli</h1>
              <p className="text-white/60 text-xs">Başvuru ve destek yönetimi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5 space-y-4 mb-6">

        {/* Filters - Sadece başvurular ve destek talepleri için */}
        {(activeTab === 'applications' || activeTab === 'support') && (
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
                <option value="all">Tüm Türler</option>
                {activeTab === 'applications' ? (
                  <>
                    <option value="application">Başvuru Formu</option>
                    <option value="contact">İletişim Formu</option>
                    <option value="support">Destek Talebi</option>
                    <option value="complaint">Şikayet Formu</option>
                    <option value="suggestion">Öneri Formu</option>
                  </>
                ) : (
                  <>
                    <option value="technical">Teknik Destek</option>
                    <option value="billing">Faturalama</option>
                    <option value="general">Genel Sorular</option>
                    <option value="feature_request">Özellik Talebi</option>
                    <option value="bug_report">Hata Bildirimi</option>
                  </>
                )}
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
              >
                <option value="all">Tüm Durumlar</option>
                {activeTab === 'applications' ? (
                  <>
                    <option value="pending">Beklemede</option>
                    <option value="reviewed">İncelendi</option>
                    <option value="approved">Onaylandı</option>
                    <option value="rejected">Reddedildi</option>
                  </>
                ) : activeTab === 'support' ? (
                  <>
                    <option value="open">Açık</option>
                    <option value="in_progress">İşlemde</option>
                    <option value="resolved">Çözüldü</option>
                    <option value="closed">Kapatıldı</option>
                  </>
                ) : null}
              </select>
            </div>
          </div>
        )}



        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'applications'
                  ? 'border-[#ffb700] text-[#ffb700]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Form Başvuruları
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'support'
                  ? 'border-[#ffb700] text-[#ffb700]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Headphones className="w-4 h-4 inline mr-2" />
              Destek Talepleri
            </button>
            <button
              onClick={() => setActiveTab('digitalCodes')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'digitalCodes'
                  ? 'border-[#ffb700] text-[#ffb700]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              Dijital Kodlar
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'email'
                  ? 'border-[#ffb700] text-[#ffb700]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              E-posta Test
            </button>

          </div>
        </div>

        {/* Stats */}
        {activeTab === 'applications' ? (
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
        ) : null}

        {/* Content Tables */}
        {activeTab === 'applications' ? (
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
                            title="Görüntüle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditSubmission(submission)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubmission(submission.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Destek Talepleri İstatistikleri */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Talep</p>
                    <p className="text-2xl font-bold text-gray-900">{supportTickets.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Açık Talepler</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {supportTickets.filter(ticket => ticket.status === 'open').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">İşlemde</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {supportTickets.filter(ticket => ticket.status === 'in_progress').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Çözüldü</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {supportTickets.filter(ticket => ticket.status === 'resolved').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Destek Talepleri</h2>
              </div>
            
            {filteredSupportTickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz destek talebi bulunmuyor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Başlık
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gönderen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Öncelik
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSupportTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {ticket.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {SUPPORT_CATEGORIES[ticket.category as keyof typeof SUPPORT_CATEGORIES] || ticket.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {SUPPORT_PRIORITIES[ticket.priority as keyof typeof SUPPORT_PRIORITIES] || ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {SUPPORT_STATUSES[ticket.status as keyof typeof SUPPORT_STATUSES] || ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(ticket.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowTicketModal(true);
                            }}
                            className="text-[#ffb700] hover:text-[#e6a600] mr-3"
                            title="Görüntüle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditTicket(ticket)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
        )}

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
                
                <div className="space-y-6">
                  {/* Başvuru Özeti */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-500 rounded-full">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{selectedSubmission.data.serviceName || selectedSubmission.formType}</h4>
                        <p className="text-sm text-gray-600">{selectedSubmission.data.serviceCategory}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Başvuru No</label>
                        <p className="text-sm font-mono font-semibold text-orange-600">{selectedSubmission.data.applicationNumber}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gönderim Tarihi</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedSubmission.submittedAt)}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Durum</label>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                          {getStatusText(selectedSubmission.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Başvuran Bilgileri */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      Başvuran Bilgileri
                      {isEditing && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Düzenleme Modu</span>
                      )}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ad Soyad</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.fullName}
                            onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 font-medium">{selectedSubmission.data.applicantInfo?.fullName}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">E-posta</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{selectedSubmission.data.applicantInfo?.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefon</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editFormData.phone}
                            onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{selectedSubmission.data.applicantInfo?.phone}</p>
                        )}
                      </div>
                      {(selectedSubmission.data.applicantInfo?.identityNumber || isEditing) && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">TC Kimlik No</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.identityNumber}
                              onChange={(e) => setEditFormData({...editFormData, identityNumber: e.target.value})}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                            />
                          ) : (
                            <p className="text-sm text-gray-900 font-mono">{selectedSubmission.data.applicantInfo.identityNumber}</p>
                          )}
                        </div>
                      )}
                    </div>
                    {(selectedSubmission.data.applicantInfo?.address || isEditing) && (
                      <div className="mt-4">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Adres</label>
                        {isEditing ? (
                          <textarea
                            value={editFormData.address}
                            onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                            rows={3}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 mt-1">{selectedSubmission.data.applicantInfo.address}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ek Notlar */}
                  {(selectedSubmission.data.notes || isEditing) && (
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                      <h5 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-600" />
                        Ek Notlar
                      </h5>
                      {isEditing ? (
                        <textarea
                          value={editFormData.notes}
                          onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                          rows={4}
                          placeholder="Başvuru ile ilgili notlar..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        />
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedSubmission.data.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Teknik Detaylar */}
                  <details className="bg-gray-50 rounded-xl border border-gray-200">
                    <summary className="p-4 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      🔧 Teknik Detaylar (Geliştiriciler için)
                    </summary>
                    <div className="px-4 pb-4">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-white rounded-lg p-3 border overflow-x-auto">
                        {JSON.stringify(selectedSubmission.data, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
                
                <div className="mt-6 flex gap-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveSubmission}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Kaydet
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        İptal
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditSubmission(selectedSubmission)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteSubmission(selectedSubmission.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Sil
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setIsEditing(false);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Kapat
                  </button>
                  {!isEditing && (
                    <select
                      value={selectedSubmission.status}
                      onChange={(e) => handleUpdateApplicationStatus(selectedSubmission.id, e.target.value as 'pending' | 'reviewed' | 'approved' | 'rejected')}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent bg-[#ffb700] text-white"
                    >
                      <option value="pending">Beklemede</option>
                      <option value="reviewed">İncelendi</option>
                      <option value="approved">Onaylandı</option>
                      <option value="rejected">Reddedildi</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Ticket Details Modal */}
        {showTicketModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Destek Talebi Detayları
                    </h3>
                    <div className="w-12 h-1 bg-[#ffb700] rounded-full"></div>
                  </div>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {editingTicket && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Edit className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Düzenleme Modu</span>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Başlık</label>
                      {editingTicket ? (
                        <input
                          type="text"
                          value={editTicketData.title}
                          onChange={(e) => setEditTicketData({...editTicketData, title: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{selectedTicket.title}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Kategori</label>
                      {editingTicket ? (
                        <select
                          value={editTicketData.category}
                          onChange={(e) => setEditTicketData({...editTicketData, category: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        >
                          <option value="technical">Teknik Destek</option>
                          <option value="billing">Faturalama</option>
                          <option value="general">Genel</option>
                          <option value="feature_request">Özellik Talebi</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{SUPPORT_CATEGORIES[selectedTicket.category as keyof typeof SUPPORT_CATEGORIES] || selectedTicket.category}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Öncelik</label>
                      {editingTicket ? (
                        <select
                          value={editTicketData.priority}
                          onChange={(e) => setEditTicketData({...editTicketData, priority: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        >
                          <option value="low">Düşük</option>
                          <option value="medium">Orta</option>
                          <option value="high">Yüksek</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedTicket.priority === 'high' ? 'bg-red-100 text-red-800' :
                          selectedTicket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {SUPPORT_PRIORITIES[selectedTicket.priority as keyof typeof SUPPORT_PRIORITIES] || selectedTicket.priority}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Durum</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedTicket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                        selectedTicket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {SUPPORT_STATUSES[selectedTicket.status as keyof typeof SUPPORT_STATUSES] || selectedTicket.status}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gönderen</label>
                      {editingTicket ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editTicketData.name}
                            onChange={(e) => setEditTicketData({...editTicketData, name: e.target.value})}
                            placeholder="Ad Soyad"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                          />
                          <input
                            type="email"
                            value={editTicketData.email}
                            onChange={(e) => setEditTicketData({...editTicketData, email: e.target.value})}
                            placeholder="E-posta"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-900">{selectedTicket.name}</p>
                          <p className="text-gray-500 text-sm">{selectedTicket.email}</p>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</label>
                      <p className="text-gray-900">{formatDate(selectedTicket.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Açıklama</label>
                    {editingTicket ? (
                      <textarea
                        value={editTicketData.description}
                        onChange={(e) => setEditTicketData({...editTicketData, description: e.target.value})}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      />
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                      </div>
                    )}
                  </div>

                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Ekler</label>
                      <div className="space-y-2">
                        {selectedTicket.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={typeof attachment === 'string' ? attachment : (attachment as any).url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {typeof attachment === 'string' ? attachment : (attachment as any).name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Replies Section */}
                  <div>
                    <SupportTicketReplies
                      ticket={selectedTicket}
                      onReplyAdded={fetchSupportTickets}
                      isAdmin={true}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  {editingTicket ? (
                    <>
                      <button
                        onClick={handleSaveTicket}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Kaydet
                      </button>
                      <button
                        onClick={() => setEditingTicket(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        İptal
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditTicket(selectedTicket)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteTicket(selectedTicket.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Sil
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowTicketModal(false);
                      setEditingTicket(false);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Kapat
                  </button>
                  {!editingTicket && (
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value as 'open' | 'in_progress' | 'resolved' | 'closed')}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                    >
                      <option value="open">Açık</option>
                      <option value="in_progress">İşlemde</option>
                      <option value="resolved">Çözüldü</option>
                      <option value="closed">Kapatıldı</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'digitalCodes' && (
          <>
            {/* Dijital Kodlar İstatistikleri */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
                    <p className="text-2xl font-bold text-gray-900">{digitalCodes.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Aktif Ürün</p>
                    <p className="text-2xl font-bold text-gray-900">{digitalCodes.filter(d => d.active).length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Dijital Sipariş</p>
                    <p className="text-2xl font-bold text-gray-900">{digitalOrders.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Dijital Gelir</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {digitalOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.price || 0), 0).toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Yeni Dijital Ürün Ekle */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">Dijital Ürün Yönetimi</h2>
                  <button
                    onClick={toggleDigitalCodesSortOrder}
                    className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                    title={`Sıralama: ${digitalCodesSortOrder === 'asc' ? 'A-Z' : 'Z-A'}`}
                  >
                    {digitalCodesSortOrder === 'asc' ? '↓ A-Z' : '↑ Z-A'}
                  </button>
                </div>
                <div className="flex gap-2">
                  {selectedDigitalCodes.length > 0 && (
                    <button
                      onClick={handleBulkDeleteDigitalCodes}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Seçilenleri Sil ({selectedDigitalCodes.length})
                    </button>
                  )}
                  <button
                    onClick={() => setShowExcelUpload(!showExcelUpload)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Excel ile Yükle
                  </button>
                  <button
                    onClick={() => setShowAddDigitalCode(!showAddDigitalCode)}
                    className="bg-[#ffb700] text-white px-4 py-2 rounded-lg hover:bg-[#e6a600] transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni Ürün Ekle
                  </button>
                </div>
              </div>

              {showExcelUpload && (
                <div className="border border-green-200 rounded-xl p-4 mb-4 bg-green-50">
                  <h3 className="font-medium text-gray-900 mb-3">Excel ile Toplu Ürün Yükleme</h3>
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Excel/CSV dosyanızda şu sütunlar olmalı:</p>
                    <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                      <li><strong>1. Sütun:</strong> Ürün Adı</li>
                      <li><strong>2. Sütun:</strong> Kategori</li>
                      <li><strong>3. Sütun:</strong> Fiyat (sadece sayı)</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">Desteklenen formatlar: .xlsx, .xls, .csv, .txt</p>
                    <p className="text-xs text-gray-500">CSV örneği: Netflix 1 Aylık,Streaming,99.90</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.txt"
                      onChange={handleExcelUpload}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setShowExcelUpload(false)}
                      className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}

              {showAddDigitalCode && (
                <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50">
                  <h3 className="font-medium text-gray-900 mb-3">Yeni Dijital Ürün</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label>
                      <input
                        type="text"
                        value={newDigitalCode.name}
                        onChange={(e) => setNewDigitalCode(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ör: Netflix 1 Aylık"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                      <input
                        type="text"
                        value={newDigitalCode.category}
                        onChange={(e) => setNewDigitalCode(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="Ör: Streaming, Oyun, Yazılım"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺) *</label>
                      <input
                        type="number"
                        value={newDigitalCode.price || ''}
                        onChange={(e) => setNewDigitalCode(prev => ({ ...prev, price: Number(e.target.value) }))}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                      <input
                        type="text"
                        value={newDigitalCode.description}
                        onChange={(e) => setNewDigitalCode(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Ürün açıklaması..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stok Adedi</label>
                      <input
                        type="number"
                        value={newDigitalCode.stock}
                        onChange={(e) => setNewDigitalCode(prev => ({ ...prev, stock: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddDigitalCodeSubmit}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Ürün Ekle
                    </button>
                    <button
                      onClick={() => setShowAddDigitalCode(false)}
                      className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}

              {/* Dijital Ürün Listesi */}
              {digitalCodes.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz dijital ürün eklenmemiş.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedDigitalCodes.length === digitalCodes.length && digitalCodes.length > 0}
                            onChange={handleSelectAllDigitalCodes}
                            className="w-4 h-4 text-[#ffb700] border-gray-300 rounded focus:ring-[#ffb700]"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ürün Adı</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getSortedDigitalCodes().map(code => (
                        <tr key={code.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedDigitalCodes.includes(code.id!)}
                              onChange={() => handleToggleDigitalCodeSelection(code.id!)}
                              className="w-4 h-4 text-[#ffb700] border-gray-300 rounded focus:ring-[#ffb700]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{code.name}</div>
                            {code.description && <div className="text-xs text-gray-500">{code.description}</div>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{code.category}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{code.price.toLocaleString('tr-TR')} ₺</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{code.stock}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${code.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {code.active ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleDigitalCodeActive(code.id!, code.active)}
                                className={`text-xs px-2 py-1 rounded ${code.active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                              >
                                {code.active ? 'Pasifleştir' : 'Aktifleştir'}
                              </button>
                              <button
                                onClick={() => handleDeleteDigitalCode(code.id!)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Dijital Siparişler */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dijital Siparişler ({digitalOrders.length})</h2>
              {digitalOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz dijital sipariş yok.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ürün</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ödeme ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {digitalOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{order.productName}</div>
                            <div className="text-xs text-gray-500">{order.productCategory}</div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{(order.price || 0).toLocaleString('tr-TR')} ₺</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status === 'completed' ? 'Tamamlandı' :
                               order.status === 'pending' ? 'Beklemede' :
                               order.status === 'failed' ? 'Başarısız' : order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-mono">{order.paymentId || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'email' && (
          <EmailTestPanel />
        )}
      </div>
    </div>
  );
};

export default AdminPage;