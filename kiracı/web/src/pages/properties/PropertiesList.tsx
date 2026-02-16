import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, collectionGroup, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';

interface Property {
  id: string;
  type: 'residential' | 'commercial';
  address: {
    city: string;
    district: string;
    fullText: string;
  };
  meta: {
    roomCount?: string;
    floor?: string;
  };
  ownerUid?: string;
}

const PropertiesList: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!user) return;
      try {
        const memberRef = doc(db, 'accounts', user.uid, 'members', user.uid);
        const memberSnap = await getDoc(memberRef);

        const props: Property[] = [];
        const q = query(collection(db, 'accounts', user.uid, 'properties'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          props.push({ id: doc.id, ...doc.data(), ownerUid: user.uid } as any);
        });

        if (memberSnap.exists() && memberSnap.data()?.roles?.agent) {
          const permQ = query(collectionGroup(db, 'agent_permissions'), where('agentUid', '==', user.uid));
          const permSnap = await getDocs(permQ);
          for (const perm of permSnap.docs) {
            const parts = perm.ref.path.split('/');
            const ownerUid = parts[1];
            const propertyId = parts[3];
            const propRef = doc(db, 'accounts', ownerUid, 'properties', propertyId);
            const propSnap = await getDoc(propRef);
            if (propSnap.exists()) {
              if (!props.find((p) => p.id === propSnap.id)) {
                props.push({ id: propSnap.id, ...(propSnap.data() as any), ownerUid } as any);
              }
            }
          }
        }

        setProperties(props);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center py-20"><span className="spinner h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Taşınmazlar</h1>
          <p className="page-subtitle">Sisteme kayıtlı tüm konut ve işyerleriniz.</p>
        </div>
        <Link to="/properties/new" className="btn btn-primary">
          Yeni Taşınmaz Ekle
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />
            </svg>
            <p className="empty-state-title">Henüz taşınmaz eklemediniz</p>
            <p className="empty-state-text">Sözleşme oluşturmak için önce bir taşınmaz ekleyin.</p>
            <Link to="/properties/new" className="btn btn-primary mt-4">Yeni Taşınmaz Ekle</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-wrap hidden sm:block">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Tip</th>
                  <th className="table-cell">Şehir/İlçe</th>
                  <th className="table-cell">Adres</th>
                  <th className="table-cell text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-50/60">
                    <td className="table-cell">
                      <span className={`badge ${property.type === 'residential' ? 'badge-success' : 'badge-info'}`}>
                        {property.type === 'residential' ? 'Konut' : 'İşyeri'}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-slate-900">
                      {property.address.city} / {property.address.district}
                    </td>
                    <td className="table-cell">{property.address.fullText}</td>
                    <td className="table-cell text-right">
                      {property.ownerUid === user?.uid ? (
                        <Link to={`/properties/${property.id}/edit`} className="btn btn-ghost text-teal-700 text-xs px-3 py-1">
                          Düzenle →
                        </Link>
                      ) : (
                        <span className="badge badge-muted">Yetkili</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 sm:hidden">
            {properties.map((property) => (
              <div key={property.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge text-[10px] ${property.type === 'residential' ? 'badge-success' : 'badge-info'}`}>
                        {property.type === 'residential' ? 'Konut' : 'İşyeri'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">{property.address.city} / {property.address.district}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{property.address.fullText}</p>
                  </div>
                  {property.ownerUid === user?.uid ? (
                    <Link to={`/properties/${property.id}/edit`} className="btn btn-secondary text-xs px-3 py-1.5 shrink-0">
                      Düzenle
                    </Link>
                  ) : (
                    <span className="badge badge-muted shrink-0">Yetkili</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PropertiesList;
