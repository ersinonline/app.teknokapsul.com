import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, Eye, Search, Plus, FolderOpen, File } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { storage, db } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  size: number;
  uploadDate: Date;
  downloadUrl: string;
  storagePath: string;
}

interface DocumentCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('other');

  const categories: DocumentCategory[] = [
    {
      id: 'rental',
      name: 'Kira Sözleşmeleri',
      icon: <FolderOpen className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'insurance',
      name: 'Sigorta Poliçeleri',
      icon: <FileText className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'contracts',
      name: 'Sözleşmeler',
      icon: <File className="w-5 h-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'certificates',
      name: 'Sertifikalar',
      icon: <FileText className="w-5 h-5" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      id: 'other',
      name: 'Diğer',
      icon: <File className="w-5 h-5" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ];

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const documentsRef = collection(db, 'teknokapsul', user.uid, 'documents');
      const q = query(
        documentsRef,
        orderBy('uploadDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const docs: Document[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({
          id: doc.id,
          name: data.name,
          type: data.type,
          category: data.category,
          size: data.size,
          uploadDate: data.uploadDate.toDate(),
          downloadUrl: data.downloadUrl,
          storagePath: data.storagePath
        });
      });
      
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !user) return;
    
    setSelectedFiles(files);
    setUploadFileName(files[0].name);
    setShowUploadModal(true);
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || !user || !uploadFileName.trim()) return;
    
    setUploading(true);
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileName = `${Date.now()}_${uploadFileName}`;
        const storagePath = `documents/${user.uid}/${uploadCategory}/${fileName}`;
        const storageRef = ref(storage, storagePath);
        
        // Upload file to Firebase Storage
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        // Save document metadata to Firestore
        await addDoc(collection(db, 'teknokapsul', user.uid, 'documents'), {
          name: uploadFileName,
          type: file.type,
          category: uploadCategory,
          size: file.size,
          uploadDate: new Date(),
          downloadUrl: downloadUrl,
          storagePath: storagePath
        });
      }
      
      await fetchDocuments();
      setShowUploadModal(false);
      setSelectedFiles(null);
      setUploadFileName('');
      setUploadCategory('other');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Dosya yüklenirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return;
    
    try {
      // Delete from Firebase Storage
      const storageRef = ref(storage, document.storagePath);
      await deleteObject(storageRef);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'teknokapsul', user!.uid, 'documents', document.id));
      
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Dosya silinirken bir hata oluştu.');
    }
  };

  const handleDownload = (document: Document) => {
    window.open(document.downloadUrl, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    return '📁';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="w-full">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffb700]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Dosyalarım
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Kira sözleşmeleri, sigorta poliçeleri ve diğer önemli belgelerinizi güvenle saklayın
          </p>
          <div className="w-20 h-1 bg-[#ffb700] mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive ? 'border-[#ffb700] bg-[#fff7e6]' : 'border-gray-300 bg-white'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Dosya Yükle
            </h3>
            <p className="text-gray-600 mb-4">
              Dosyalarınızı buraya sürükleyip bırakın veya seçin
            </p>
            <input
              type="file"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 bg-[#ffb700] text-white px-6 py-3 rounded-lg hover:bg-[#e6a600] transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Dosya Seç
            </label>
            {uploading && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ffb700] mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Yükleniyor...</p>
              </div>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Kategoriler</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedCategory === 'all'
                  ? 'border-[#ffb700] bg-[#fff7e6] text-[#ffb700]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <FileText className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Tümü</span>
              <span className="block text-xs text-gray-500 mt-1">
                {documents.length} dosya
              </span>
            </button>
            {categories.map((category) => {
              const categoryCount = documents.filter(doc => doc.category === category.id).length;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedCategory === category.id
                      ? `${category.borderColor} ${category.bgColor} ${category.color}`
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="mx-auto mb-2">{category.icon}</div>
                  <span className="text-sm font-medium block">{category.name}</span>
                  <span className="block text-xs text-gray-500 mt-1">
                    {categoryCount} dosya
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Dosya ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedCategory !== 'all' ? 'Dosya bulunamadı' : 'Henüz dosya yok'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all'
                ? 'Arama kriterlerinize uygun dosya bulunamadı.'
                : 'İlk dosyanızı yükleyerek başlayın.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocuments.map((document) => {
              const category = categories.find(cat => cat.id === document.category);
              return (
                <div
                  key={document.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(document.type)}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                          {document.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(document.size)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {category && (
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-3 ${category.bgColor} ${category.color}`}>
                      {category.icon}
                      <span>{category.name}</span>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mb-4">
                    {document.uploadDate.toLocaleDateString('tr-TR')}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(document)}
                      className="flex-1 flex items-center justify-center gap-1 bg-[#ffb700] text-white px-3 py-2 rounded-lg hover:bg-[#e6a600] transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Görüntüle
                    </button>
                    <button
                      onClick={() => handleDownload(document)}
                      className="flex items-center justify-center gap-1 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(document)}
                      className="flex items-center justify-center gap-1 bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Dosya Yükleme
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosya Adı
                  </label>
                  <input
                    type="text"
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                    placeholder="Dosya adını girin"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffb700] focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles(null);
                    setUploadFileName('');
                    setUploadCategory('other');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={!uploadFileName.trim() || uploading}
                  className="flex-1 bg-[#ffb700] text-white px-4 py-2 rounded-lg hover:bg-[#e6a600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Yükleniyor...' : 'Yükle'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;