import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Download, Link as LinkIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { db } from '../lib/firebase';
import type { PaymentPlan } from '../types';
import { formatCurrency, formatDate } from '../utils';

const PaymentPlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PaymentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      const planId = id.toUpperCase();
      setLoading(true);
      setError(null);
      try {
        const snap = await getDoc(doc(db, 'sharedPaymentPlans', planId));
        if (!snap.exists()) {
          setError('Plan bulunamadı');
          setPlan(null);
          return;
        }
        setPlan({ id: snap.id, ...(snap.data() as any) } as PaymentPlan);
      } catch (e) {
        setError('Plan yüklenirken hata oluştu');
        setPlan(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const periodicPayments = useMemo(() => {
    if (!plan) return [];
    const credits = [plan.housingCredit, ...(plan.personalCredits || [])].filter(Boolean) as any[];
    const valid = credits.filter((c) => (c?.monthlyPayment || 0) > 0 && (c?.term || 0) > 0);
    if (valid.length === 0) return [];

    const endMonths = Array.from(new Set(valid.map((c) => c.term))).sort((a, b) => a - b);
    const periods: Array<{ startMonth: number; endMonth: number; monthlyPayment: number; description: string; activeCredits: string[] }> = [];

    for (let i = 0; i < endMonths.length; i++) {
      const startMonth = i === 0 ? 1 : endMonths[i - 1] + 1;
      const endMonth = endMonths[i];
      const active = valid.filter((c) => c.term >= startMonth);
      if (active.length === 0) continue;
      const monthlyPayment = active.reduce((sum, c) => sum + (c.monthlyPayment || 0), 0);
      const activeCredits = active.map((c) => `${c.bankName} (${c.term} ay)`);
      periods.push({
        startMonth,
        endMonth,
        monthlyPayment,
        activeCredits,
        description: i === 0 ? `İlk ${endMonth} ay` : `${startMonth}. aydan ${endMonth}. aya kadar`
      });
    }
    return periods;
  }, [plan]);

  const maxCreditTerm = useMemo(() => {
    if (!plan) return 0;
    return Math.max(plan.housingCredit?.term || 0, ...(plan.personalCredits || []).map(c => c.term));
  }, [plan]);

  const firstYearEndMonth = Math.min(12, maxCreditTerm || 12);
  const isFixedPaymentFullTerm = periodicPayments.length > 0
    ? periodicPayments[0].startMonth === 1 &&
      periodicPayments[periodicPayments.length - 1].endMonth === maxCreditTerm &&
      periodicPayments.every(p => p.monthlyPayment === periodicPayments[0].monthlyPayment)
    : false;
  const isFixedPaymentFirstYear = !isFixedPaymentFullTerm && periodicPayments.length > 0
    ? periodicPayments[0].startMonth === 1 &&
      periodicPayments[0].endMonth >= firstYearEndMonth &&
      (periodicPayments.length === 1 || periodicPayments[1].startMonth > firstYearEndMonth)
    : false;
  const fixedPaymentLabel = isFixedPaymentFullTerm
    ? `Sabit Ödemeli (${maxCreditTerm} Ay)`
    : isFixedPaymentFirstYear
    ? `Sabit Ödemeli (İlk ${firstYearEndMonth} Ay)`
    : null;

  const totalDownPayment = useMemo(() => (plan?.downPayments || []).reduce((sum, dp) => sum + dp.amount, 0), [plan]);
  const totalPersonalCreditAmount = useMemo(() => (plan?.personalCredits || []).reduce((sum, c) => sum + c.amount, 0), [plan]);
  const totalPersonalCreditMonthly = useMemo(() => (plan?.personalCredits || []).reduce((sum, c) => sum + c.monthlyPayment, 0), [plan]);
  const housingCreditAmount = plan?.housingCredit?.amount || 0;
  const totalMonthlyIncome = useMemo(() => (plan?.monthlyIncomes || []).reduce((sum, i) => sum + i.amount, 0), [plan]);
  const additionalExpenses = plan?.type === 'housing' ? plan.additionalExpenses : undefined;
  const additionalExpensesTotal = plan?.type === 'housing' ? (additionalExpenses?.total || 0) : 0;
  const targetTotal = (plan?.price || 0) + additionalExpensesTotal;
  const remainingAmount = targetTotal - totalDownPayment - housingCreditAmount - totalPersonalCreditAmount;
  const maxPeriodicMonthlyPayment = periodicPayments.reduce((m, p) => Math.max(m, p.monthlyPayment), 0);

  const copyLink = async () => {
    if (!id) return;
    const shareUrl = `${window.location.origin}/plan/${id}`;
    await navigator.clipboard.writeText(shareUrl);
    alert('Link panoya kopyalandı.');
  };

  const copyPlanId = async () => {
    const planId = String((plan as any)?.planId || id || '').toUpperCase();
    if (!planId) return;
    await navigator.clipboard.writeText(planId);
    alert('Plan ID panoya kopyalandı.');
  };

  const downloadPdf = async () => {
    if (!plan) return;
    const pageWidthPx = 794;
    const pageHeightPx = Math.floor((pageWidthPx * 297) / 210);
    const pagePaddingPx = 32;

    const source = document.createElement('div');
    source.style.position = 'absolute';
    source.style.left = '-9999px';
    source.style.top = '0';
    source.style.width = `${pageWidthPx}px`;
    source.style.backgroundColor = 'white';
    source.style.fontFamily = 'Arial, sans-serif';
    source.style.color = '#111827';

    const incomes = plan.monthlyIncomes || [];
    const additional = plan.additionalExpenses;

    source.innerHTML = `
      <div class="pdf-section" style="margin-bottom: 18px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 14px;">
          <div style="display:flex; align-items:center; gap: 10px;">
            <div style="width:12px; height:12px; background:#ffb700; border-radius:999px;"></div>
            <div style="font-weight:700; font-size:16px; color:#111827;">TeknoTech</div>
          </div>
          <div style="font-size:11px; color:#6b7280;">${formatDate(plan.createdAt)}</div>
        </div>
        <div style="text-align:left;">
          <div style="font-size:22px; font-weight:800; color:#111827; line-height: 1.15;">Ödeme Planı</div>
          <div style="font-size:14px; color:#374151; margin-top: 4px;">${plan.name}</div>
          <div style="font-size:12px; color:#6b7280; margin-top: 6px;">Plan ID: ${String((plan as any).planId || id || '').toUpperCase()}</div>
        </div>
      </div>

      <div class="pdf-section" style="margin-bottom: 18px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div style="background:#f8f9fa; padding: 14px; border-radius: 10px;">
            <div style="font-size: 11px; color:#6b7280; margin-bottom: 6px;">${plan.type === 'vehicle' ? 'Araç Ücreti' : 'Ev Ücreti'}</div>
            <div style="font-size: 18px; font-weight: 800; color:#111827;">${formatCurrency(plan.price)}</div>
          </div>
          <div style="background:#f8f9fa; padding: 14px; border-radius: 10px;">
            <div style="font-size: 11px; color:#6b7280; margin-bottom: 6px;">Toplam Peşinat</div>
            <div style="font-size: 18px; font-weight: 800; color:#16a34a;">${formatCurrency(totalDownPayment)}</div>
          </div>
          <div style="background:#f8f9fa; padding: 14px; border-radius: 10px;">
            <div style="font-size: 11px; color:#6b7280; margin-bottom: 6px;">Aylık Ödeme</div>
            <div style="font-size: 18px; font-weight: 800; color:#dc2626;">${formatCurrency(plan.totalMonthlyPayment)}</div>
          </div>
        </div>
      </div>

      ${(plan.downPayments || []).length > 0 ? `
        <div class="pdf-section" style="margin-bottom: 18px;">
          <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">Peşinat Detayları</div>
          <div style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
            ${(plan.downPayments || []).map(dp => `
              <div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">
                <div style="font-size: 12px; color:#111827;">${dp.description}</div>
                <div style="font-size: 12px; font-weight: 700; color:#111827; white-space: nowrap;">${formatCurrency(dp.amount)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${plan.housingCredit ? `
        <div class="pdf-section" style="margin-bottom: 18px;">
          <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">${plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</div>
          <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; color:#111827;">
              <div><strong>Banka:</strong> ${plan.housingCredit.bankName}</div>
              <div><strong>Kredi Tutarı:</strong> ${formatCurrency(plan.housingCredit.amount)}</div>
              <div><strong>Vade:</strong> ${plan.housingCredit.term} Ay</div>
              <div><strong>Aylık Taksit:</strong> ${formatCurrency(plan.housingCredit.monthlyPayment)}</div>
            </div>
          </div>
        </div>
      ` : ''}

      ${(plan.personalCredits || []).length > 0 ? `
        <div class="pdf-section" style="margin-bottom: 18px;">
          <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">İhtiyaç Kredileri</div>
          ${(plan.personalCredits || []).map(credit => `
            <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-bottom: 10px;">
              <div style="display:flex; align-items:center; justify-content:space-between; gap: 10px; margin-bottom: 8px;">
                <div style="font-weight: 800; font-size: 12px; color:#111827;">${credit.bankName}</div>
                <div style="font-weight: 800; font-size: 12px; color:#ea580c; white-space: nowrap;">${formatCurrency(credit.amount)}</div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color:#111827;">
                <div><strong>Vade:</strong> ${credit.term} Ay</div>
                <div><strong>Aylık Taksit:</strong> ${formatCurrency(credit.monthlyPayment)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${incomes.length > 0 ? `
        <div class="pdf-section" style="margin-bottom: 18px;">
          <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">Aylık Gelirler</div>
          <div style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
            ${incomes.map(income => `
              <div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">
                <div style="font-size: 12px; color:#111827;">${income.description}</div>
                <div style="font-size: 12px; font-weight: 800; color:#111827; white-space: nowrap;">${formatCurrency(income.amount)}</div>
              </div>
            `).join('')}
            <div style="display: flex; justify-content: space-between; gap: 12px; padding: 12px; background: #ecfdf5;">
              <div style="font-size: 12px; font-weight: 900; color:#111827;">Toplam Aylık Gelir</div>
              <div style="font-size: 12px; font-weight: 900; color:#111827; white-space: nowrap;">${formatCurrency(totalMonthlyIncome)}</div>
            </div>
          </div>
        </div>
      ` : ''}

      ${periodicPayments.length > 0 ? `
        <div class="pdf-section" style="margin-bottom: 18px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap: 12px; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">
            <div style="font-size: 14px; font-weight: 800; color:#111827;">Dönemsel Ödeme Planı</div>
            ${fixedPaymentLabel ? `<div style="font-size: 11px; font-weight: 800; color:#047857; background:#ecfdf5; border:1px solid #a7f3d0; padding: 4px 10px; border-radius: 999px;">${fixedPaymentLabel}</div>` : ''}
          </div>
          <div style="background: #f8f9fa; padding: 14px; border-radius: 10px;">
            ${periodicPayments.map((p) => `
              <div style="background: white; padding: 12px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #ffb700;">
                <div style="display:flex; align-items:flex-start; justify-content:space-between; gap: 12px;">
                  <div>
                    <div style="font-weight: 800; font-size: 12px; color:#111827;">${p.description}</div>
                    <div style="font-size: 11px; color:#6b7280; margin-top: 2px;">${p.startMonth}. ay - ${p.endMonth}. ay</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size: 11px; color:#6b7280;">Aylık Taksit</div>
                    <div style="font-size: 14px; font-weight: 900; color:#111827;">${formatCurrency(p.monthlyPayment)}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${plan.type === 'housing' && additional ? `
        <div class="pdf-section" style="margin-bottom: 0;">
          <div style="font-size: 14px; font-weight: 800; color:#111827; border-bottom: 2px solid #ffb700; padding-bottom: 6px; margin-bottom: 10px;">Ek Masraflar</div>
          <div style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
            ${[
              { label: 'Tapu Masrafı', value: additional.titleDeedFee },
              { label: 'Kredi Tahsis Ücreti', value: additional.loanAllocationFee },
              { label: 'Ekspertiz Ücreti', value: additional.appraisalFee },
              { label: 'İpotek Tesis Ücreti', value: additional.mortgageEstablishmentFee },
              { label: 'DASK Sigorta Primi', value: additional.daskInsurancePremium },
              { label: 'Döner Sermaye Bedeli', value: additional.revolvingFundFee },
              ...(additional.customExpenses || []).map(item => ({ label: item.description, value: item.amount }))
            ].map(row => `
              <div style="display:flex; justify-content:space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">
                <div style="font-size: 12px; color:#111827;">${row.label}</div>
                <div style="font-size: 12px; font-weight: 800; color:#111827; white-space: nowrap;">${formatCurrency(row.value)}</div>
              </div>
            `).join('')}
            <div style="display:flex; justify-content:space-between; gap: 12px; padding: 12px; background: #fffbeb;">
              <div style="font-size: 12px; font-weight: 900; color:#111827;">Toplam Ek Masraf</div>
              <div style="font-size: 12px; font-weight: 900; color:#111827; white-space: nowrap;">${formatCurrency(additional.total)}</div>
            </div>
          </div>
        </div>
      ` : ''}
    `;

    document.body.appendChild(source);

    const sourceSections = Array.from(source.querySelectorAll('.pdf-section')) as HTMLElement[];
    const pageEls: HTMLDivElement[] = [];
    let currentPage = document.createElement('div');
    currentPage.style.position = 'absolute';
    currentPage.style.left = '-9999px';
    currentPage.style.top = '0';
    currentPage.style.width = `${pageWidthPx}px`;
    currentPage.style.minHeight = `${pageHeightPx}px`;
    currentPage.style.backgroundColor = 'white';
    currentPage.style.padding = `${pagePaddingPx}px`;
    currentPage.style.boxSizing = 'border-box';
    currentPage.style.fontFamily = 'Arial, sans-serif';
    currentPage.style.color = '#111827';
    document.body.appendChild(currentPage);

    for (const section of sourceSections) {
      const clone = section.cloneNode(true) as HTMLElement;
      currentPage.appendChild(clone);
      if (currentPage.scrollHeight > pageHeightPx) {
        currentPage.removeChild(clone);
        if (currentPage.childElementCount > 0) {
          pageEls.push(currentPage);
          currentPage = document.createElement('div');
          currentPage.style.position = 'absolute';
          currentPage.style.left = '-9999px';
          currentPage.style.top = '0';
          currentPage.style.width = `${pageWidthPx}px`;
          currentPage.style.minHeight = `${pageHeightPx}px`;
          currentPage.style.backgroundColor = 'white';
          currentPage.style.padding = `${pagePaddingPx}px`;
          currentPage.style.boxSizing = 'border-box';
          currentPage.style.fontFamily = 'Arial, sans-serif';
          currentPage.style.color = '#111827';
          document.body.appendChild(currentPage);
          currentPage.appendChild(clone);
        } else {
          currentPage.appendChild(clone);
        }
      }
    }

    if (currentPage.childElementCount > 0) pageEls.push(currentPage);
    document.body.removeChild(source);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const marginMm = 10;
    const contentWidthMm = 210 - marginMm * 2;
    const contentHeightMm = 297 - marginMm * 2;

    for (let i = 0; i < pageEls.length; i++) {
      const pageEl = pageEls[i];
      const canvas = await html2canvas(pageEl, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
      const mmPerPx = contentWidthMm / canvas.width;
      const sliceHeightPx = Math.floor(contentHeightMm / mmPerPx);

      let offsetPx = 0;
      while (offsetPx < canvas.height) {
        const remainingPx = canvas.height - offsetPx;
        const currentSliceHeightPx = Math.min(sliceHeightPx, remainingPx);

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = currentSliceHeightPx;
        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) break;
        ctx.drawImage(canvas, 0, offsetPx, canvas.width, currentSliceHeightPx, 0, 0, canvas.width, currentSliceHeightPx);

        const imgData = sliceCanvas.toDataURL('image/png');
        const imgHeightMm = (currentSliceHeightPx * contentWidthMm) / canvas.width;

        if (i > 0 || offsetPx > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', marginMm, marginMm, contentWidthMm, imgHeightMm);
        offsetPx += currentSliceHeightPx;
      }

      document.body.removeChild(pageEl);
    }

    const safeFilename = `TeknoKapsul_${plan.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50)}_Odeme_Plani_${new Date().getTime()}.pdf`;
    pdf.save(safeFilename);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!plan || error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6 mt-6">
            <div className="text-lg font-semibold text-gray-900 mb-2">Plan Bulunamadı</div>
            <div className="text-sm text-gray-600 mb-6">{error || 'Plan bulunamadı'}</div>
            <button onClick={() => navigate('/')} className="w-full bg-[#ffb700] text-white px-4 py-3 rounded-xl hover:bg-[#e6a500]">
              Ana Sayfa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={copyLink} className="bg-white border px-3 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Link
            </button>
            <button onClick={downloadPdf} className="bg-[#ffb700] text-white px-3 py-2 rounded-xl hover:bg-[#e6a500] flex items-center gap-2">
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-6">
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{plan.name}</h1>
            <div className="text-sm text-gray-600 mt-1">{formatDate(plan.createdAt)}</div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-xs sm:text-sm font-semibold bg-gray-50 text-gray-900 px-3 py-1 rounded-full border">
                Plan ID: {String((plan as any).planId || id || '').toUpperCase()}
              </span>
              <button onClick={copyPlanId} className="text-xs sm:text-sm bg-white border px-3 py-1 rounded-full hover:bg-gray-50">
                Kopyala
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-600">{plan.type === 'vehicle' ? 'Araç Ücreti' : 'Ev Ücreti'}</div>
              <div className="text-lg font-semibold text-gray-900">{formatCurrency(plan.price)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-600">Toplam Peşinat</div>
              <div className="text-lg font-semibold text-emerald-700">{formatCurrency(totalDownPayment)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-600">Aylık Ödeme</div>
              <div className="text-lg font-semibold text-red-600">{formatCurrency(plan.totalMonthlyPayment)}</div>
            </div>
          </div>

          {periodicPayments.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold text-gray-900">Dönemsel Ödeme Planı</div>
                {fixedPaymentLabel && (
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                    {fixedPaymentLabel}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {periodicPayments.map((p, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">{p.description}</div>
                      <div className="text-sm text-gray-600">{p.startMonth}. ay - {p.endMonth}. ay</div>
                      {(p as any).activeCredits?.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                          {(p as any).activeCredits.map((c: string, i: number) => (
                            <div key={i} className="truncate">• {c}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-gray-600">Aylık</div>
                      <div className="text-lg font-semibold text-gray-900">{formatCurrency(p.monthlyPayment)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalMonthlyIncome > 0 && (
            <div className="mt-6 bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Toplam Aylık Gelir</div>
                <div className="text-lg font-semibold text-emerald-700">{formatCurrency(totalMonthlyIncome)}</div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Gelir - Taksit (En Yüksek)</div>
                <div className={`text-lg font-semibold ${(totalMonthlyIncome - periodicPayments.reduce((m, p) => Math.max(m, p.monthlyPayment), 0)) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatCurrency(totalMonthlyIncome - periodicPayments.reduce((m, p) => Math.max(m, p.monthlyPayment), 0))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">Hedef Toplam</div>
              <div className="text-lg font-semibold text-gray-900">{formatCurrency(targetTotal)}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">Kalan Tutar</div>
              <div className={`text-lg font-semibold ${remainingAmount > 0 ? 'text-red-700' : remainingAmount < 0 ? 'text-emerald-700' : 'text-gray-900'}`}>
                {formatCurrency(Math.abs(remainingAmount))}{remainingAmount < 0 ? ' (Fazla)' : ''}
              </div>
            </div>
          </div>
        </div>

        {(plan.downPayments || []).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-6 mt-4 sm:mt-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Peşinat Detayları</h2>
            <div className="space-y-3">
              {(plan.downPayments || []).map((dp) => (
                <div key={dp.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{dp.description}</div>
                  </div>
                  <div className="font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(dp.amount)}</div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="font-semibold text-emerald-900">Toplam Peşinat</div>
                <div className="font-bold text-emerald-900">{formatCurrency(totalDownPayment)}</div>
              </div>
            </div>
          </div>
        )}

        {plan.housingCredit && (
          <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-6 mt-4 sm:mt-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'} Detayı</h2>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="font-semibold text-gray-900">{plan.housingCredit.bankName}</div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                <div>Kredi Tutarı: <span className="font-semibold text-gray-900">{formatCurrency(plan.housingCredit.amount)}</span></div>
                <div>Vade: <span className="font-semibold text-gray-900">{plan.housingCredit.term} ay</span></div>
                <div>Aylık Taksit: <span className="font-semibold text-gray-900">{formatCurrency(plan.housingCredit.monthlyPayment)}</span></div>
                <div>Toplam Ödeme: <span className="font-semibold text-gray-900">{formatCurrency(plan.housingCredit.totalPayment)}</span></div>
              </div>
            </div>
          </div>
        )}

        {(plan.personalCredits || []).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-6 mt-4 sm:mt-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">İhtiyaç Kredileri</h2>
            <div className="space-y-3">
              {(plan.personalCredits || []).map((credit) => (
                <div key={credit.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{credit.bankName}</div>
                      <div className="text-sm text-gray-700 mt-1">
                        {formatCurrency(credit.amount)} • {credit.term} ay
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-gray-600">Aylık</div>
                      <div className="text-lg font-semibold text-gray-900">{formatCurrency(credit.monthlyPayment)}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">Toplam Ödeme: <span className="font-semibold text-gray-900">{formatCurrency(credit.totalPayment)}</span></div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="font-semibold text-orange-900">Toplam İhtiyaç Kredisi</div>
                <div className="font-bold text-orange-900">{formatCurrency(totalPersonalCreditAmount)}</div>
              </div>
            </div>
          </div>
        )}

        {(plan.monthlyIncomes || []).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-6 mt-4 sm:mt-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Aylık Gelirler</h2>
            <div className="space-y-3">
              {(plan.monthlyIncomes || []).map((income) => (
                <div key={income.id} className="flex items-center justify-between p-3 sm:p-4 bg-emerald-50 rounded-xl">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{income.description}</div>
                  </div>
                  <div className="font-semibold text-emerald-800 whitespace-nowrap">{formatCurrency(income.amount)}</div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="font-semibold text-emerald-900">Toplam Aylık Gelir</div>
                <div className="font-bold text-emerald-900">{formatCurrency(totalMonthlyIncome)}</div>
              </div>
            </div>
          </div>
        )}

        {(plan.monthlyIncomes || []).length > 0 && periodicPayments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-6 mt-4 sm:mt-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Gelir / Taksit Uygunluğu</h2>
            <div className="space-y-3">
              {periodicPayments.map((p, idx) => {
                const diff = totalMonthlyIncome - p.monthlyPayment;
                const ok = diff >= 0;
                return (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-900">{p.description}</div>
                        <div className="text-sm text-gray-600">{p.startMonth}. ay - {p.endMonth}. ay</div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-xs text-gray-600">Aylık Taksit</div>
                        <div className="text-lg font-semibold text-gray-900">{formatCurrency(p.monthlyPayment)}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm text-gray-600">Gelir - Taksit</div>
                      <div className={`text-sm font-semibold ${ok ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatCurrency(diff)} {ok ? '(Yeterli)' : '(Yetersiz)'}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border">
                <div className="font-semibold text-gray-900">Gelir - Taksit (En Yüksek)</div>
                <div className={`font-bold ${totalMonthlyIncome - maxPeriodicMonthlyPayment >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatCurrency(totalMonthlyIncome - maxPeriodicMonthlyPayment)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-6 mt-4 sm:mt-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Finansal Özet</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="text-gray-600">{plan.type === 'vehicle' ? 'Araç Fiyatı' : 'Ev Fiyatı'}</div>
              <div className="font-semibold text-gray-900">{formatCurrency(plan.price)}</div>
            </div>
            {additionalExpenses && (
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-gray-600">Ek Masraflar</div>
                <div className="font-semibold text-gray-900">{formatCurrency(additionalExpenses.total)}</div>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b">
              <div className="text-gray-600">Toplam Peşinat</div>
              <div className="font-semibold text-emerald-700">-{formatCurrency(totalDownPayment)}</div>
            </div>
            {plan.housingCredit && (
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-gray-600">{plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</div>
                <div className="font-semibold text-blue-700">-{formatCurrency(plan.housingCredit.amount)}</div>
              </div>
            )}
            {(plan.personalCredits || []).length > 0 && (
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-gray-600">İhtiyaç Kredileri</div>
                <div className="font-semibold text-orange-700">-{formatCurrency(totalPersonalCreditAmount)}</div>
              </div>
            )}
            <div className="flex items-center justify-between py-3 bg-gray-50 rounded-xl px-4">
              <div className="font-semibold text-gray-900">Kalan Tutar</div>
              <div className={`font-bold text-lg ${remainingAmount > 0 ? 'text-red-700' : remainingAmount < 0 ? 'text-emerald-700' : 'text-gray-900'}`}>
                {formatCurrency(Math.abs(remainingAmount))}{remainingAmount < 0 ? ' (Fazla)' : ''}
              </div>
            </div>
          </div>
        </div>

        {additionalExpenses && (
          <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-6 mt-4 sm:mt-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Ek Masraflar</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-gray-600">Tapu Masrafı</div>
                <div className="font-semibold text-gray-900">{formatCurrency(additionalExpenses.titleDeedFee)}</div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-gray-600">Kredi Tahsis Ücreti</div>
                <div className="font-semibold text-gray-900">{formatCurrency(additionalExpenses.loanAllocationFee)}</div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-gray-600">Ekspertiz Ücreti</div>
                <div className="font-semibold text-gray-900">{formatCurrency(additionalExpenses.appraisalFee)}</div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-gray-600">İpotek Tesis Ücreti</div>
                <div className="font-semibold text-gray-900">{formatCurrency(additionalExpenses.mortgageEstablishmentFee)}</div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-gray-600">DASK Sigorta Primi</div>
                <div className="font-semibold text-gray-900">{formatCurrency(additionalExpenses.daskInsurancePremium)}</div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-gray-600">Döner Sermaye Bedeli</div>
                <div className="font-semibold text-gray-900">{formatCurrency(additionalExpenses.revolvingFundFee)}</div>
              </div>
              {(additionalExpenses.customExpenses || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b">
                  <div className="text-gray-600">{item.description}</div>
                  <div className="font-semibold text-gray-900">{formatCurrency(item.amount)}</div>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 bg-[#ffb700]/10 rounded-xl px-4">
                <div className="font-semibold text-gray-900">Toplam Ek Masraf</div>
                <div className="font-bold text-lg text-[#ffb700]">{formatCurrency(additionalExpenses.total)}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border p-5 sm:p-6 mt-4 sm:mt-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Aylık Ödeme Özeti</h2>
          <div className="bg-[#ffb700]/10 p-4 rounded-xl text-center">
            <div className="text-sm text-gray-700">Toplam Aylık Ödeme</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#ffb700] mt-1">{formatCurrency(plan.totalMonthlyPayment)}</div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {plan.housingCredit && (
                <div className="bg-white p-3 rounded-xl border">
                  <div className="text-gray-600">{plan.type === 'vehicle' ? 'Taşıt Kredisi' : 'Konut Kredisi'}</div>
                  <div className="font-semibold text-blue-700">{formatCurrency(plan.housingCredit.monthlyPayment)}</div>
                </div>
              )}
              {(plan.personalCredits || []).length > 0 && (
                <div className="bg-white p-3 rounded-xl border">
                  <div className="text-gray-600">İhtiyaç Kredileri</div>
                  <div className="font-semibold text-orange-700">{formatCurrency(totalPersonalCreditMonthly)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPlanDetailPage;
