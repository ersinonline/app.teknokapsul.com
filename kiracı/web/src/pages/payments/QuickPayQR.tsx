import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '../../components/Toast';
import * as QRCode from 'qrcode';

const QuickPayQR: React.FC = () => {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const generateQR = async () => {
        if (!user || !amount || Number(amount) <= 0) {
            toast.error('Lütfen geçerli bir tutar girin');
            return;
        }

        setLoading(true);
        try {
            // Create a payment link document
            const paymentLinkRef = await addDoc(collection(db, 'accounts', user.uid, 'payment_links'), {
                amount: Number(amount),
                description: description || 'Hızlı Ödeme',
                createdAt: serverTimestamp(),
                status: 'active',
                createdBy: user.uid,
            });

            // Generate payment URL
            const paymentUrl = `${window.location.origin}/quick-pay/${paymentLinkRef.id}`;

            // Generate QR code
            const qrUrl = await QRCode.toDataURL(paymentUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#0F172A',
                    light: '#FFFFFF',
                },
            });

            setQrCodeUrl(qrUrl);
            toast.success('QR kod oluşturuldu!');
        } catch (error) {
            console.error('QR generation error:', error);
            toast.error('QR kod oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    const downloadQR = () => {
        if (!qrCodeUrl) return;
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = `odeme-qr-${Date.now()}.png`;
        link.click();
    };

    const resetForm = () => {
        setAmount('');
        setDescription('');
        setQrCodeUrl('');
    };

    return (
        <div className="space-y-6">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📱 QR Kod ile Hızlı Ödeme</h1>
                    <p className="page-subtitle">Kiracılarınızın kolayca ödeme yapması için QR kod oluşturun</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">QR Kod Oluştur</h3>

                    <div className="space-y-5">
                        <div className="form-group">
                            <label className="form-label">Tutar (₺)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="form-input pr-12"
                                    placeholder="0"
                                    min="1"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">
                                    TL
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Açıklama (Opsiyonel)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="form-input"
                                placeholder="Örn: Ocak 2026 Kirası"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={generateQR}
                                disabled={loading || !amount}
                                className="btn btn-primary flex-1"
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner h-4 w-4" />
                                        Oluşturuluyor...
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                        QR Kod Oluştur
                                    </>
                                )}
                            </button>

                            {qrCodeUrl && (
                                <button onClick={resetForm} className="btn btn-ghost">
                                    Sıfırla
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex gap-3">
                            <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-900">
                                <p className="font-semibold mb-1">Nasıl Çalışır?</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-800">
                                    <li>QR kodu oluşturun ve kiracınızla paylaşın</li>
                                    <li>Kiracı QR kodu okutarak ödeme sayfasına erişir</li>
                                    <li>Kredi kartı ile güvenli ödeme yapar</li>
                                    <li>Ödeme otomatik olarak hesabınıza aktarılır</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Code Display */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">QR Kod Önizleme</h3>

                    {qrCodeUrl ? (
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <div className="p-6 bg-white border-4 border-slate-200 rounded-2xl shadow-lg">
                                    <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                                </div>
                            </div>

                            <div className="text-center space-y-3">
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-sm text-slate-600 mb-1">Ödeme Tutarı</p>
                                    <p className="text-3xl font-bold text-teal-600">
                                        {Number(amount).toLocaleString('tr-TR')} ₺
                                    </p>
                                    {description && (
                                        <p className="text-sm text-slate-500 mt-2">{description}</p>
                                    )}
                                </div>

                                <button onClick={downloadQR} className="btn btn-primary w-full">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    QR Kodu İndir
                                </button>

                                <p className="text-xs text-slate-500">
                                    QR kodu yazdırabilir veya dijital olarak paylaşabilirsiniz
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-32 w-32 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                <svg className="h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <p className="text-slate-600 font-semibold">QR kod henüz oluşturulmadı</p>
                            <p className="text-sm text-slate-500 mt-1">Tutar girin ve "QR Kod Oluştur" butonuna tıklayın</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuickPayQR;
