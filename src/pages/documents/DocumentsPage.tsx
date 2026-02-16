import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, Eye, Search, Plus, FolderOpen, File } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { storage, db } from '../../lib/firebase';
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
      <div className="page-container bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 loading-spinner mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Belgeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Belgelerim</h1>
                <p className="text-white/60 text-xs">{documents.length} belge</p>
              </div>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5">
        {/* Categories */}
        <div className="bank-card p-3 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              Tümü ({documents.length})
            </button>
            {categories.map((category) => {
              const categoryCount = documents.filter(doc => doc.category === category.id).length;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === category.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {category.name} ({categoryCount})
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="bank-card p-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Dosya ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="bank-card p-10 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {searchTerm || selectedCategory !== 'all' ? 'Dosya bulunamadı' : 'Henüz dosya yok'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {searchTerm || selectedCategory !== 'all' ? 'Farklı filtreler deneyin.' : 'İlk dosyanızı yükleyin.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {filteredDocuments.map((document) => {
              const category = categories.find(cat => cat.id === document.category);
              return (
                <div key={document.id} className="bank-card p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl flex-shrink-0">{getFileIcon(document.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground text-sm truncate">{document.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{formatFileSize(document.size)}</span>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="text-[11px] text-muted-foreground">{document.uploadDate.toLocaleDateString('tr-TR')}</span>
                        {category && (
                          <>
                            <span className="text-muted-foreground/30">•</span>
                            <span className={`text-[11px] ${category.color}`}>{category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleDownload(document)} className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDownload(document)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteDocument(document)} className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 animate-fade-in">
            <div className="bg-card rounded-t-2xl md:rounded-2xl p-5 w-full md:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bank-gradient flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Belge Yükleme</h3>
              </div>
              
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors mb-4 ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">Sürükle-bırak veya seçin</p>
                <input type="file" multiple onChange={(e) => handleFileSelect(e.target.files)} className="hidden" id="modal-file-upload" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls" />
                <label htmlFor="modal-file-upload" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" /> Belge Seç
                </label>
                {uploading && (
                  <div className="mt-3">
                    <div className="w-6 h-6 loading-spinner mx-auto" />
                    <p className="text-xs text-muted-foreground mt-1">Yükleniyor...</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Belge Adı</label>
                  <input type="text" value={uploadFileName} onChange={(e) => setUploadFileName(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Belge adını girin" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Kategori</label>
                  <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex gap-3">
                <button onClick={() => { setShowUploadModal(false); setSelectedFiles(null); setUploadFileName(''); setUploadCategory('other'); }} className="flex-1 btn-outline text-foreground">İptal</button>
                <button onClick={handleFileUpload} disabled={!uploadFileName.trim() || uploading} className="flex-1 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">{uploading ? 'Yükleniyor...' : 'Yükle'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;