export const contractStatusLabel = (status?: string) => {
  switch (status) {
    case 'DRAFT_READY': return 'Taslak Hazır';
    case 'EDEVLET_TRANSFERRED': return 'e-Devlet Aktarıldı';
    case 'EDEVLET_PENDING': return 'Onay Bekliyor';
    case 'EDEVLET_APPROVED': return 'Onaylandı';
    case 'ACTIVE': return 'Aktif';
    case 'CANCELLED': return 'İptal';
    default: return status || '—';
  }
};

export const invoiceStatusLabel = (status?: string) => {
  switch (status) {
    case 'DUE': return 'Ödeme Bekliyor';
    case 'OVERDUE': return 'Gecikmiş';
    case 'PAID': return 'Ödendi';
    case 'PAYMENT_PENDING': return 'Ödeme Bekliyor';
    case 'FAILED': return 'Başarısız';
    case 'REFUNDED': return 'İade Edildi';
    case 'CLOSED_UPFRONT': return 'Peşin Ödendi';
    case 'TRANSFERRED': return 'Yeni Sözleşmeden Devam';
    default: return status || '—';
  }
};

export const payoutStatusLabel = (status?: string) => {
  switch (status) {
    case 'PLANNED': return 'Planlandı';
    case 'TRANSFERRED': return 'Aktarıldı';
    default: return status || '—';
  }
};
