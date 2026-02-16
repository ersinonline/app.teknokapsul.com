import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
    type: 'contract' | 'property' | 'invoice' | 'request';
    id: string;
    title: string;
    subtitle: string;
    url: string;
    icon: string;
}

const SearchBar: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (term: string) => {
        setSearchTerm(term);

        if (!user || term.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        setIsOpen(true);
        const searchResults: SearchResult[] = [];

        try {
            const lowerTerm = term.toLowerCase();

            // Search contracts
            const contractsSnap = await getDocs(collection(db, 'accounts', user.uid, 'contracts'));
            contractsSnap.docs.forEach(doc => {
                const data = doc.data();
                const tenantName = data.tenant?.name?.toLowerCase() || '';
                const tenantEmail = data.tenant?.email?.toLowerCase() || '';

                if (tenantName.includes(lowerTerm) || tenantEmail.includes(lowerTerm)) {
                    searchResults.push({
                        type: 'contract',
                        id: doc.id,
                        title: data.tenant?.name || 'İsimsiz',
                        subtitle: `Sözleşme • ${data.rentAmount || 0} ₺/ay`,
                        url: `/contracts/${doc.id}`,
                        icon: '📄',
                    });
                }
            });

            // Search properties
            const propertiesSnap = await getDocs(collection(db, 'accounts', user.uid, 'properties'));
            propertiesSnap.docs.forEach(doc => {
                const data = doc.data();
                const address = data.address?.toLowerCase() || '';
                const title = data.title?.toLowerCase() || '';

                if (address.includes(lowerTerm) || title.includes(lowerTerm)) {
                    searchResults.push({
                        type: 'property',
                        id: doc.id,
                        title: data.title || 'İsimsiz Mülk',
                        subtitle: `Mülk • ${data.address || ''}`,
                        url: `/properties/${doc.id}/edit`,
                        icon: '🏠',
                    });
                }
            });

            // Search invoices (last 50)
            for (const contractDoc of contractsSnap.docs.slice(0, 10)) {
                const invoicesSnap = await getDocs(
                    collection(db, 'accounts', user.uid, 'contracts', contractDoc.id, 'invoices')
                );

                invoicesSnap.docs.forEach(invDoc => {
                    const data = invDoc.data();
                    const period = data.period || '';

                    if (period.includes(term)) {
                        searchResults.push({
                            type: 'invoice',
                            id: invDoc.id,
                            title: `${period} Faturası`,
                            subtitle: `${data.tenantTotal || 0} ₺ • ${data.status || ''}`,
                            url: `/contracts/${contractDoc.id}`,
                            icon: '💳',
                        });
                    }
                });
            }

            setResults(searchResults.slice(0, 8)); // Limit to 8 results
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (url: string) => {
        navigate(url);
        setSearchTerm('');
        setResults([]);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full max-w-md">
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
                    placeholder="Sözleşme, mülk veya fatura ara..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="spinner h-4 w-4" />
                    </div>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                        {results.map((result, index) => (
                            <button
                                key={`${result.type}-${result.id}-${index}`}
                                onClick={() => handleResultClick(result.url)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{result.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate">
                                            {result.title}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {result.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isOpen && searchTerm.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-8 text-center">
                    <p className="text-sm text-slate-500">Sonuç bulunamadı</p>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
