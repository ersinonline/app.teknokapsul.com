import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  Shield,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Eye,
  EyeOff,
  Edit,
  Plus
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import {
  updateEmail,
  updatePhoneNumber,
  PhoneAuthProvider,
  RecaptchaVerifier,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, collection, query, where, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';

interface LoginRecord {
  id: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
  device: string;
}

interface ProfileManagementProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const ProfileManagement: React.FC<ProfileManagementProps> = ({ onSuccess, onError }) => {
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    loadLoginRecords();
    loadUserProfile();
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Firebase Auth'dan telefon numarasını al
      const firebasePhoneNumber = user.phoneNumber;
      
      const profileSnap = await getDocs(query(collection(db, 'teknokapsul', user.id, 'userProfiles')));
      
      if (!profileSnap.empty) {
        const profileData = profileSnap.docs[0].data();
        // Firebase Auth'dan gelen telefon numarasını kullan
        setUserProfile({
          ...profileData,
          phoneNumber: firebasePhoneNumber || profileData.phoneNumber
        });
      } else if (firebasePhoneNumber) {
        // Profil yoksa ama Firebase'de telefon varsa, profil oluştur
        setUserProfile({ phoneNumber: firebasePhoneNumber, phoneVerified: true });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadLoginRecords = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'loginRecords'),
        where('userId', '==', user.id),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as LoginRecord[];

      setLoginRecords(records);
    } catch (error) {
      console.error('Error loading login records:', error);
    }
  };

  const setupRecaptcha = () => {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });
      setRecaptchaVerifier(verifier);
      return verifier;
    }
    return recaptchaVerifier;
  };

  const sendPhoneVerification = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

      const verifier = setupRecaptcha();
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(phoneNumber, verifier);
      setVerificationId(verificationId);
      onSuccess?.('SMS doğrulama kodu gönderildi');
    } catch (error: any) {
      onError?.('SMS gönderilirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneNumber = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user || !verificationId) throw new Error('Doğrulama bilgileri eksik');

      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      await updatePhoneNumber(user, credential);
      
      // Save phone number to user profile
      await setDoc(doc(db, 'teknokapsul', user.id, 'userProfiles', 'profile'), {
        phoneNumber: phoneNumber,
        phoneVerified: true,
        updatedAt: new Date()
      }, { merge: true });

      onSuccess?.('Telefon numarası başarıyla eklendi');
      setPhoneNumber('');
      setVerificationCode('');
      setVerificationId('');
      setShowPhoneForm(false);
      loadUserProfile();
    } catch (error: any) {
      onError?.('Telefon doğrulaması başarısız: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendEmailVerificationCode = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

      // Update email first
      await updateEmail(user, emailAddress);
      
      // Send verification email
      await sendEmailVerification(user);
      
      onSuccess?.('E-posta doğrulama kodu gönderildi');
      setShowEmailForm(false);
      setEmailAddress('');
    } catch (error: any) {
      onError?.('E-posta güncellenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('Kullanıcı bilgileri bulunamadı');

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);

      // Delete user data from Firestore
      const collections = ['loginRecords'];
      for (const collectionName of collections) {
        const q = query(collection(db, collectionName), where('userId', '==', user.id));
        const querySnapshot = await getDocs(q);
        for (const docSnapshot of querySnapshot.docs) {
          await deleteDoc(docSnapshot.ref);
        }
      }

      // Delete user account
      await deleteUser(user);
      
      onSuccess?.('Hesabınız başarıyla silindi');
    } catch (error: any) {
      onError?.('Hesap silinirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeletePassword('');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return '📱';
    if (userAgent.includes('Tablet')) return '📱';
    return '💻';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-5 h-5" style={{ color: '#ffb700' }} />
        <h2 className="text-lg font-semibold text-gray-900">Hesap Yönetimi</h2>
      </div>

      {/* Profil Bilgileri - Sabit Bölüm */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">İletişim Bilgileri</h3>
        
        {/* Email Section */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">E-posta Adresi</span>
            </div>
            {!auth.currentUser?.email && (
              <button
                onClick={() => setShowEmailForm(true)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-3 h-3" />
                Ekle
              </button>
            )}
          </div>
          {auth.currentUser?.email ? (
            <div className="flex items-center justify-between">
              <span className="text-gray-700">{auth.currentUser.email}</span>
              <div className="flex items-center gap-2">
                {auth.currentUser.emailVerified ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-3 h-3" />
                    Doğrulandı
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-orange-600 text-sm">
                    <AlertTriangle className="w-3 h-3" />
                    Doğrulanmadı
                  </span>
                )}
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">E-posta adresi eklenmemiş</p>
          )}
          
          {showEmailForm && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="yeni@email.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={sendEmailVerificationCode}
                  disabled={loading || !emailAddress}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  <Send className="w-3 h-3" />
                  {loading ? 'Gönderiliyor...' : 'Doğrula'}
                </button>
                <button
                  onClick={() => {
                    setShowEmailForm(false);
                    setEmailAddress('');
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Phone Section */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Telefon Numarası</span>
            </div>
            {!userProfile?.phoneNumber && !auth.currentUser?.phoneNumber && (
              <button
                onClick={() => setShowPhoneForm(true)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-3 h-3" />
                Ekle
              </button>
            )}
          </div>
          {userProfile?.phoneNumber || auth.currentUser?.phoneNumber ? (
            <div className="flex items-center justify-between">
              <span className="text-gray-700">{userProfile?.phoneNumber || auth.currentUser?.phoneNumber}</span>
              <div className="flex items-center gap-2">
                {userProfile?.phoneVerified || auth.currentUser?.phoneNumber ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-3 h-3" />
                    Doğrulandı
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-orange-600 text-sm">
                    <AlertTriangle className="w-3 h-3" />
                    Doğrulanmadı
                  </span>
                )}
                <button
                  onClick={() => setShowPhoneForm(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Telefon numarası eklenmemiş</p>
          )}
          
          {showPhoneForm && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+90 5XX XXX XX XX"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <div id="recaptcha-container"></div>
              
              {!verificationId ? (
                <div className="flex gap-2">
                  <button
                    onClick={sendPhoneVerification}
                    disabled={loading || !phoneNumber}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    <Send className="w-3 h-3" />
                    {loading ? 'Gönderiliyor...' : 'SMS Kodu Gönder'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPhoneForm(false);
                      setPhoneNumber('');
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6 haneli kod"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={verifyPhoneNumber}
                      disabled={loading || !verificationCode}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      <CheckCircle className="w-3 h-3" />
                      {loading ? 'Doğrulanıyor...' : 'Doğrula'}
                    </button>
                    <button
                      onClick={() => {
                        setShowPhoneForm(false);
                        setPhoneNumber('');
                        setVerificationCode('');
                        setVerificationId('');
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Login Records - Ayrı Kutu */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5" style={{ color: '#ffb700' }} />
          <h3 className="text-lg font-medium text-gray-900">Son Giriş Kayıtları</h3>
        </div>
        {loginRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Henüz giriş kaydı bulunmuyor.</p>
        ) : (
          <div className="space-y-3">
            {loginRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getDeviceIcon(record.userAgent)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{record.device}</p>
                    <p className="text-sm text-gray-500">{record.ipAddress}</p>
                    {record.location && (
                      <p className="text-sm text-gray-500">{record.location}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(record.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Account - Ayrı Kutu */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-5 h-5" style={{ color: '#ffb700' }} />
          <h3 className="text-lg font-medium text-gray-900">Hesap Silme</h3>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Dikkat!</p>
              <p>Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.</p>
            </div>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Hesabımı Sil
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifrenizi girin (onay için)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Mevcut şifreniz"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={deleteAccount}
                disabled={loading || !deletePassword}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {loading ? 'Siliniyor...' : 'Hesabı Kalıcı Olarak Sil'}
              </button>
              
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};