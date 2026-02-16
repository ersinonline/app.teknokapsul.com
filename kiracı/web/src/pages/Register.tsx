import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '../components/Toast';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLandlord, setIsLandlord] = useState(true);
  const [isTenant, setIsTenant] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      // Create Account and Member documents
      const accountId = user.uid;
      
      // 1. Create Account
      await setDoc(doc(db, 'accounts', accountId), {
        type: 'individual',
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });

      // 2. Create Member
      const agentId = isAgent ? `AG-${user.uid.slice(0, 8).toUpperCase()}` : null;

      await setDoc(doc(db, 'accounts', accountId, 'members', user.uid), {
        uid: user.uid,
        displayName: name,
        email: email,
        agentId: agentId,
        roles: {
          landlord: isLandlord,
          tenant: isTenant,
          agent: isAgent,
        },
        createdAt: serverTimestamp(),
      });

      toast.success('Hesabınız oluşturuldu!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') setError('Bu e-posta adresi zaten kullanımda.');
      else if (code === 'auth/weak-password') setError('Şifre en az 6 karakter olmalıdır.');
      else if (code === 'auth/invalid-email') setError('Geçersiz e-posta adresi.');
      else setError('Kayıt başarısız: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap flex flex-col items-center justify-center">
      <div className="w-full max-w-md text-center">
        <h2 className="text-3xl font-semibold text-slate-900">Yeni hesap oluşturun</h2>
        <p className="mt-2 text-sm text-slate-500">Rollerinizi seçin, sözleşme yönetimine başlayın.</p>
      </div>

      <div className="mt-8 w-full max-w-md">
        <div className="card p-8">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="name" className="form-label">Ad Soyad</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Adınız Soyadınız"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="form-label">E-posta adresi</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="ornek@email.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="form-label">Şifre</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="En az 8 karakter"
              />
            </div>

            <div className="space-y-3">
              <span className="form-label">Rolleriniz</span>
              <div className="grid gap-3 sm:grid-cols-3 text-sm text-slate-700">
                {[
                  { id: 'landlord', label: 'Ev Sahibi', checked: isLandlord, onChange: setIsLandlord },
                  { id: 'tenant', label: 'Kiracı', checked: isTenant, onChange: setIsTenant },
                  { id: 'agent', label: 'Emlakçı', checked: isAgent, onChange: setIsAgent },
                ].map((role) => (
                  <label key={role.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${role.checked ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 bg-slate-50'}`}>
                    <input
                      id={role.id}
                      name={role.id}
                      type="checkbox"
                      checked={role.checked}
                      onChange={(e) => role.onChange(e.target.checked)}
                      className="h-4 w-4 text-emerald-600"
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
              {loading ? <><span className="spinner h-4 w-4" /> Kaydediliyor...</> : 'Kayıt Ol'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Zaten hesabınız var mı?
          </div>
          <Link to="/login" className="btn btn-secondary w-full mt-3">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
