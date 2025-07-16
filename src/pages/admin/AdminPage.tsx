import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Eye, Calendar, User, FileText, Search, Trash2, MessageSquare, Headphones, Edit, Check, X, Package, ShoppingCart, Plus, Clock, Settings, CheckCircle } from 'lucide-react';
import { getAllSupportTickets, updateSupportTicketStatus, deleteSupportTicket, updateSupportTicket } from '../../services/support.service';
import { deleteApplication, updateApplication } from '../../services/application.service';
import { SupportTicket, SUPPORT_CATEGORIES, SUPPORT_PRIORITIES, SUPPORT_STATUSES } from '../../types/support';
import { SupportTicketReplies } from '../../components/support/SupportTicketReplies';
import { Order } from '../../services/order.service';

interface FormSubmission {
  id: string;
  formType: string;
  submittedAt: any;
  data: any;
  userEmail?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  userId?: string;
}

interface Product {
  id: string;
  urunAdi: string;
  aciklama: string;
  kategori: string;
  marka: string;
  magazaFiyati: number;
  piyasaFiyati: number;
  stokAdedi: number;
  stokKodu: string;
  barkod: string;
  resim1: string;
  agirlik: number;
  kdvOrani: number;
  magaza: string;
  paraBirimi: string;
}

// Order interface is now imported from order.service.ts

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'applications' | 'support' | 'products' | 'orders'>('applications');
  const [isEditing, setIsEditing] = useState(false);
  const [editingTicket, setEditingTicket] = useState(false);
  const [editingProduct, setEditingProduct] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editTicketData, setEditTicketData] = useState<any>({});
  const [editProductData, setEditProductData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [bulkPriceChange, setBulkPriceChange] = useState({ type: 'increase', value: 0, unit: 'percent' });


  // Filtreleme fonksiyonları
  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = product.urunAdi.toLowerCase().includes(productSearchTerm.toLowerCase());
      const matchesCategory = productCategoryFilter === 'all' || product.kategori.includes(productCategoryFilter);
      return matchesSearch && matchesCategory;
    });
  };

  // Sayfalandırma fonksiyonları
  const getCurrentPageProducts = () => {
    const filteredProducts = getFilteredProducts();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  const getCurrentPageOrders = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orders.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    if (activeTab === 'products') {
      const filteredProducts = getFilteredProducts();
      return Math.ceil(filteredProducts.length / itemsPerPage);
    } else if (activeTab === 'orders') {
      return Math.ceil(orders.length / itemsPerPage);
    }
    return 1;
  };

  const getVisiblePages = () => {
    const totalPages = getTotalPages();
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Admin kontrolü
  if (!user || user.email !== 'clk.ersinnn@gmail.com') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchSubmissions();
    fetchSupportTickets();
    fetchProducts();
    fetchOrders();

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

  // Ürün yönetimi fonksiyonları
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setEditProductData({
      urunAdi: '',
      aciklama: '',
      kategori: '',
      marka: '',
      magazaFiyati: 0,
      piyasaFiyati: 0,
      stokAdedi: 0,
      stokKodu: '',
      barkod: '',
      resim1: '',
      agirlik: 0,
      kdvOrani: 1,
      magaza: 'yap',
      paraBirimi: 'TRY'
    });
    setEditingProduct(true);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditProductData(product);
    setEditingProduct(true);
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (selectedProduct) {
        // Güncelleme
        const productRef = doc(db, 'shop', selectedProduct.id);
        await updateDoc(productRef, editProductData);
        console.log('✅ Ürün güncellendi');
      } else {
        // Yeni ekleme
        const productsRef = collection(db, 'shop');
        await addDoc(productsRef, editProductData);
        console.log('✅ Yeni ürün eklendi');
      }
      
      await fetchProducts();
      setEditingProduct(false);
      setShowProductModal(false);
    } catch (error) {
      console.error('❌ Ürün kaydedilirken hata:', error);
      alert('Ürün kaydedilirken bir hata oluştu.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'shop', productId));
      await fetchProducts();
      console.log('✅ Ürün silindi');
    } catch (error) {
      console.error('❌ Ürün silinirken hata:', error);
      alert('Ürün silinirken bir hata oluştu.');
    }
  };

  // Çoklu ürün seçimi fonksiyonları
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      const currentPageProductIds = getCurrentPageProducts().map(product => product.id);
      setSelectedProducts(currentPageProductIds);
    }
    setSelectAll(!selectAll);
  };

  // Sayfa değiştiğinde selectAll durumunu güncelle
  React.useEffect(() => {
    const currentPageProductIds = getCurrentPageProducts().map(product => product.id);
    const allCurrentPageSelected = currentPageProductIds.length > 0 && 
      currentPageProductIds.every(id => selectedProducts.includes(id));
    setSelectAll(allCurrentPageSelected);
  }, [currentPage, selectedProducts, products]);

  const handleDeleteSelectedProducts = async () => {
    if (selectedProducts.length === 0) {
      alert('Lütfen silmek istediğiniz ürünleri seçin.');
      return;
    }

    if (window.confirm(`Seçili ${selectedProducts.length} ürünü silmek istediğinizden emin misiniz?`)) {
      try {
        // Tüm seçili ürünleri sil
        const deletePromises = selectedProducts.map(productId => 
          deleteDoc(doc(db, 'shop', productId))
        );
        
        await Promise.all(deletePromises);
        await fetchProducts();
        setSelectedProducts([]);
        setSelectAll(false);
        console.log(`✅ ${selectedProducts.length} ürün silindi`);
      } catch (error) {
        console.error('❌ Ürünler silinirken hata:', error);
        alert('Ürünler silinirken bir hata oluştu.');
      }
    }
  };

  // Toplu fiyat değişikliği fonksiyonları
  const handleBulkPriceChange = async () => {
    if (bulkPriceChange.value <= 0) {
      alert('Lütfen geçerli bir değer girin.');
      return;
    }

    const confirmMessage = `Tüm ürünlere ${bulkPriceChange.type === 'increase' ? 'artış' : 'indirim'} uygulamak istediğinizden emin misiniz? (${bulkPriceChange.value}${bulkPriceChange.unit === 'percent' ? '%' : ' TL'})`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const updatePromises = products.map(async (product) => {
          let newPrice = product.magazaFiyati;
          
          if (bulkPriceChange.unit === 'percent') {
            const multiplier = bulkPriceChange.type === 'increase' 
              ? (1 + bulkPriceChange.value / 100)
              : (1 - bulkPriceChange.value / 100);
            newPrice = product.magazaFiyati * multiplier;
          } else {
            newPrice = bulkPriceChange.type === 'increase'
              ? product.magazaFiyati + bulkPriceChange.value
              : product.magazaFiyati - bulkPriceChange.value;
          }
          
          // Fiyatın negatif olmamasını sağla
          newPrice = Math.max(0, newPrice);
          
          const productRef = doc(db, 'shop', product.id);
          return updateDoc(productRef, { magazaFiyati: newPrice });
        });
        
        await Promise.all(updatePromises);
        await fetchProducts();
        setBulkPriceChange({ type: 'increase', value: 0, unit: 'percent' });
        console.log('✅ Toplu fiyat değişikliği uygulandı');
        alert('Toplu fiyat değişikliği başarıyla uygulandı!');
      } catch (error) {
        console.error('❌ Toplu fiyat değişikliği sırasında hata:', error);
        alert('Toplu fiyat değişikliği sırasında bir hata oluştu.');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Global orders koleksiyonunu güncelle
      const globalOrderRef = doc(db, 'orders', orderId);
      await updateDoc(globalOrderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Kullanıcının kendi orders koleksiyonunu da güncelle
      const orderData = orders.find(order => order.id === orderId);
      if (orderData && orderData.userId && orderData.userOrderId) {
        const userOrderRef = doc(db, 'teknokapsul', orderData.userId, 'orders', orderData.userOrderId);
        await updateDoc(userOrderRef, {
          status: newStatus,
          updatedAt: new Date()
        });
        console.log('✅ Kullanıcı siparişi güncellendi:', orderData.userOrderId);
      } else {
        console.warn('⚠️ Kullanıcı sipariş bilgisi bulunamadı:', { userId: orderData?.userId, userOrderId: orderData?.userOrderId });
      }
      
      await fetchOrders();
      console.log('✅ Sipariş durumu güncellendi');
    } catch (error) {
      console.error('❌ Sipariş durumu güncellenirken hata:', error);
      alert('Sipariş durumu güncellenirken bir hata oluştu.');
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

  const fetchProducts = async () => {
    try {
      const productsRef = collection(db, 'shop');
      const q = query(productsRef, orderBy('urunAdi', 'asc'));
      const productsSnapshot = await getDocs(q);
      
      const productsData: Product[] = [];
      productsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        productsData.push({
          id: doc.id,
          ...data
        } as Product);
      });
      
      setProducts(productsData);
      console.log('✅ Ürünler yüklendi:', productsData.length);
    } catch (error) {
      console.error('❌ Ürünler yüklenirken hata:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(q);
      
      const ordersData: Order[] = [];
      ordersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          ...data
        } as Order);
      });
      
      setOrders(ordersData);
      console.log('✅ Siparişler yüklendi:', ordersData.length);
    } catch (error) {
      console.error('❌ Siparişler yüklenirken hata:', error);
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Müşteri Hizmetleri Paneli</h1>
          <p className="text-gray-600">Müşteri başvurularını ve destek taleplerini yönetin</p>
          <div className="w-20 h-1 bg-[#ffb700] rounded-full mt-4"></div>
        </div>

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
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-[#ffb700] text-[#ffb700]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Ürün Yönetimi
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-[#ffb700] text-[#ffb700]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              Sipariş Yönetimi
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
        {activeTab === 'products' ? (
          <>
            {/* Ürün İstatistikleri */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
                    <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Stokta Var</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {products.filter(p => p.stokAdedi > 0).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Package className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Stok Tükendi</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {products.filter(p => p.stokAdedi === 0).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Package className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Düşük Stok</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {products.filter(p => p.stokAdedi > 0 && p.stokAdedi <= 5).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ürün Filtreleme ve Toplu İşlemler */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Ara</label>
                  <input
                    type="text"
                    placeholder="Ürün adı ile ara..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Kategoriler</option>
                    {Array.from(new Set(products.map(p => p.kategori.split(' > ')[0]))).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Toplu Fiyat İşlemi</label>
                  <div className="flex gap-2">
                    <select
                      value={bulkPriceChange.type}
                      onChange={(e) => setBulkPriceChange(prev => ({ ...prev, type: e.target.value as 'increase' | 'decrease' }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="increase">Artış</option>
                      <option value="decrease">İndirim</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Değer"
                      value={bulkPriceChange.value || ''}
                      onChange={(e) => setBulkPriceChange(prev => ({ ...prev, value: Number(e.target.value) }))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={bulkPriceChange.unit}
                      onChange={(e) => setBulkPriceChange(prev => ({ ...prev, unit: e.target.value as 'percent' | 'amount' }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="percent">%</option>
                      <option value="amount">TL</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleBulkPriceChange}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Fiyat Değiştir
                  </button>
                  <button 
                    onClick={handleAddProduct}
                    className="bg-[#ffb700] text-white px-4 py-2 rounded-lg hover:bg-[#e6a600] transition-colors flex items-center gap-2 justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni Ürün
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">Ürün Yönetimi ({getFilteredProducts().length} ürün)</h2>
                  {selectedProducts.length > 0 && (
                    <button 
                      onClick={handleDeleteSelectedProducts}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Seçili Ürünleri Sil ({selectedProducts.length})
                    </button>
                  )}
                </div>
              </div>
            
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz ürün bulunmuyor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ürün Adı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fiyat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getCurrentPageProducts().map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex space-x-2 mr-3">
                              <button 
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3 overflow-hidden">
                              {product.resim1 && (
                                <img 
                                  src={product.resim1} 
                                  alt={product.urunAdi}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.urunAdi}</div>
                              <div className="text-sm text-gray-500">SKU: {product.stokKodu}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {product.kategori.split(' > ').pop()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₺{product.magazaFiyati.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.stokAdedi}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
              
            {getFilteredProducts().length > itemsPerPage && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Toplam {getFilteredProducts().length} ürün, sayfa {currentPage} / {getTotalPages()}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Önceki
                      </button>
                      {getVisiblePages().map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 text-sm border rounded ${
                            currentPage === page
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getTotalPages()}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Sonraki
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'orders' ? (
          <>
            {/* Sipariş İstatistikleri */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                    <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Hazırlanıyor</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {orders.filter(o => o.status === 'processing').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tamamlandı</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {orders.filter(o => o.status === 'delivered').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {orders.reduce((sum, order) => sum + order.total, 0).toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Sipariş Yönetimi</h2>
              </div>
            
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz sipariş bulunmuyor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sipariş No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Müşteri
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Toplam
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
                    {getCurrentPageOrders().map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">#{order.orderNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.shippingAddress?.fullName || 'İsim yok'}</div>
                            <div className="text-sm text-gray-500">{order.shippingAddress?.email || 'Email yok'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₺{order.total.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'delivered' ? 'Tamamlandı' :
                             order.status === 'processing' ? 'Hazırlanıyor' :
                             order.status === 'shipped' ? 'Kargoda' :
                             order.status === 'cancelled' ? 'İptal Edildi' :
                             'Beklemede'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Tarih yok'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <select 
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id!, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Beklemede</option>
                              <option value="processing">Hazırlanıyor</option>
                              <option value="shipped">Kargoda</option>
                              <option value="delivered">Teslim Edildi</option>
                              <option value="cancelled">İptal Edildi</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Sayfalandırma Kontrolleri - Orders */}
            {orders.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Toplam {orders.length} sipariş, sayfa {currentPage} / {getTotalPages()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Önceki
                    </button>
                    {getVisiblePages().map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === page
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === getTotalPages()}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </>
        ) : activeTab === 'applications' ? (
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

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
                    </h3>
                    <div className="w-12 h-1 bg-[#ffb700] rounded-full"></div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(false);
                      setEditProductData({
                        urunAdi: '',
                        kategori: '',
                        magazaFiyati: 0,
                        piyasaFiyati: 0,
                        stokAdedi: 0,
                        stokKodu: '',
                        barkod: '',
                        marka: '',
                        paraBirimi: 'TRY',
                        magaza: 'yap',
                        kdvOrani: 1,
                        agirlik: 0,
                        aciklama: '',
                        resim1: ''
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
                      <input
                        type="text"
                        value={editProductData.urunAdi}
                        onChange={(e) => setEditProductData({...editProductData, urunAdi: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        placeholder="Ürün adını girin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                      <input
                        type="text"
                        value={editProductData.kategori}
                        onChange={(e) => setEditProductData({...editProductData, kategori: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        placeholder="Kategori girin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mağaza Fiyatı</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editProductData.magazaFiyati}
                        onChange={(e) => setEditProductData({...editProductData, magazaFiyati: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Piyasa Fiyatı</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editProductData.piyasaFiyati}
                        onChange={(e) => setEditProductData({...editProductData, piyasaFiyati: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stok Adedi</label>
                      <input
                        type="number"
                        value={editProductData.stokAdedi}
                        onChange={(e) => setEditProductData({...editProductData, stokAdedi: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stok Kodu</label>
                      <input
                        type="text"
                        value={editProductData.stokKodu}
                        onChange={(e) => setEditProductData({...editProductData, stokKodu: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        placeholder="Stok kodu girin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Barkod</label>
                      <input
                        type="text"
                        value={editProductData.barkod}
                        onChange={(e) => setEditProductData({...editProductData, barkod: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        placeholder="Barkod girin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marka</label>
                      <input
                        type="text"
                        value={editProductData.marka}
                        onChange={(e) => setEditProductData({...editProductData, marka: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        placeholder="Marka girin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                      <select
                        value={editProductData.paraBirimi}
                        onChange={(e) => setEditProductData({...editProductData, paraBirimi: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      >
                        <option value="TRY">TRY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ağırlık (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editProductData.agirlik}
                        onChange={(e) => setEditProductData({...editProductData, agirlik: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <textarea
                      value={editProductData.aciklama}
                      onChange={(e) => setEditProductData({...editProductData, aciklama: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      placeholder="Ürün açıklaması girin"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Resmi URL</label>
                    <input
                      type="url"
                      value={editProductData.resim1}
                      onChange={(e) => setEditProductData({...editProductData, resim1: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSaveProduct}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {editingProduct ? 'Güncelle' : 'Kaydet'}
                  </button>
                  <button
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(false);
                      setEditProductData({
                        urunAdi: '',
                        kategori: '',
                        magazaFiyati: 0,
                        piyasaFiyati: 0,
                        stokAdedi: 0,
                        stokKodu: '',
                        barkod: '',
                        marka: '',
                        paraBirimi: 'TRY',
                        magaza: 'yap',
                        kdvOrani: 1,
                        agirlik: 0,
                        aciklama: '',
                        resim1: ''
                      });
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Sipariş Detayları
                    </h3>
                    <div className="w-12 h-1 bg-[#ffb700] rounded-full"></div>
                  </div>
                  <button
                    onClick={() => {
                      setShowOrderModal(false);
                      setSelectedOrder(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Sipariş Numarası</label>
                      <p className="text-gray-900 font-mono">{selectedOrder.orderNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Müşteri Adı</label>
                      <p className="text-gray-900">{selectedOrder.shippingAddress?.fullName || 'İsim yok'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">E-posta</label>
                      <p className="text-gray-900">{selectedOrder.shippingAddress?.email || 'Email yok'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Toplam Tutar</label>
                      <p className="text-gray-900 font-semibold">{selectedOrder.total.toFixed(2)} ₺</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Durum</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedOrder.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        selectedOrder.status === 'shipped' ? 'bg-yellow-100 text-yellow-800' :
                        selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedOrder.status === 'pending' ? 'Beklemede' :
                         selectedOrder.status === 'processing' ? 'İşleniyor' :
                         selectedOrder.status === 'shipped' ? 'Kargoda' :
                         selectedOrder.status === 'delivered' ? 'Teslim Edildi' :
                         'İptal Edildi'}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</label>
                      <p className="text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                  </div>
                  
                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Sipariş Ürünleri</label>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {selectedOrder.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-500">Adet: {item.quantity}</p>
                            </div>
                            <p className="font-semibold text-gray-900">{(item.price * item.quantity).toFixed(2)} ₺</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedOrder.shippingAddress && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Teslimat Adresi</label>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-1">
                          <p className="text-gray-700">{selectedOrder.shippingAddress.fullName}</p>
                          <p className="text-gray-700">{selectedOrder.shippingAddress.address}</p>
                          <p className="text-gray-700">{selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.city}</p>
                          <p className="text-gray-700">{selectedOrder.shippingAddress.postalCode}</p>
                          <p className="text-gray-700">Tel: {selectedOrder.shippingAddress.phone}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex gap-3">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrder.id!, e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  >
                    <option value="pending">Beklemede</option>
                    <option value="processing">İşleniyor</option>
                    <option value="shipped">Kargoda</option>
                    <option value="delivered">Teslim Edildi</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                  <button
                    onClick={() => {
                      setShowOrderModal(false);
                      setSelectedOrder(null);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Kapat
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