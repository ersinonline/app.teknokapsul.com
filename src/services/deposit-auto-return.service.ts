import { portfolioService } from './portfolio.service';
import { pushNotificationService } from './push-notification.service';
import { PortfolioItem } from '../types/portfolio';

interface DepositReturnSchedule {
  userId: string;
  portfolioItemId: string;
  lastCalculated: Date;
  isActive: boolean;
}

class DepositAutoReturnService {
  private schedules: Map<string, DepositReturnSchedule> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  // Vadeli hesap için otomatik getiri hesaplama başlatma
  async startAutoReturnCalculation(userId: string, portfolioItemId: string): Promise<void> {
    const scheduleKey = `${userId}_${portfolioItemId}`;
    
    // Vadeli hesap bilgilerini kontrol et
    const portfolioItems = await portfolioService.getPortfolioItems(userId);
    const depositItem = portfolioItems.find(item => item.id === portfolioItemId && item.type === 'deposit');
    
    if (!depositItem) {
      throw new Error('Vadeli hesap bulunamadı');
    }
    
    if (!depositItem.metadata?.annualInterestRate || !depositItem.metadata?.taxExemptPercentage) {
      throw new Error('Vadeli hesap için gerekli bilgiler eksik (yıllık faiz oranı ve faiz işlenmeyen yüzde)');
    }
    
    const schedule: DepositReturnSchedule = {
      userId,
      portfolioItemId,
      lastCalculated: new Date(),
      isActive: true
    };

    this.schedules.set(scheduleKey, schedule);
    
    // İlk hesaplamayı hemen yap
    await this.calculateDailyReturn(schedule);
    
    // Günlük hesaplama için timer başlat (eğer henüz başlatılmamışsa)
    if (!this.intervalId) {
      this.startDailyTimer();
    }

    // Kullanıcıya bildirim gönder
    await pushNotificationService.showNotification('Vadeli Hesap Otomatik Getiri', {
      body: `${depositItem.name} vadeli hesabınız için günlük getiri hesaplaması başlatıldı.`,
      tag: 'deposit-auto-return',
      data: { type: 'deposit-auto-return', portfolioItemId }
    });
  }

  // Vadeli hesap otomatik getiri hesaplama durdurma
  async stopAutoReturnCalculation(userId: string, portfolioItemId: string): Promise<void> {
    const scheduleKey = `${userId}_${portfolioItemId}`;
    const schedule = this.schedules.get(scheduleKey);
    
    if (schedule) {
      schedule.isActive = false;
      this.schedules.delete(scheduleKey);
      
      // Eğer hiç aktif schedule kalmadıysa timer'ı durdur
      if (this.schedules.size === 0 && this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }

      await pushNotificationService.showNotification('Vadeli Hesap Otomatik Getiri', {
        body: 'Vadeli hesabınız için otomatik getiri hesaplaması durduruldu.',
        tag: 'deposit-auto-return-stopped'
      });
    }
  }

  // Vadeli hesap bilgilerini güncelleme
  async updateDepositInfo(userId: string, portfolioItemId: string, metadata: any): Promise<void> {
    const scheduleKey = `${userId}_${portfolioItemId}`;
    const schedule = this.schedules.get(scheduleKey);
    
    if (schedule) {
      // Portfolio service'te güncelle
      await portfolioService.updateDepositInfo(userId, portfolioItemId, metadata);
      
      await pushNotificationService.showNotification('Vadeli Hesap Bilgileri Güncellendi', {
        body: 'Vadeli hesap bilgileriniz güncellendi.',
        tag: 'deposit-info-updated'
      });
    }
  }

  // Günlük timer başlatma
  private startDailyTimer(): void {
    // Her gün saat 09:00'da çalışacak şekilde ayarla
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const msUntilTomorrow = tomorrow.getTime() - now.getTime();
    
    // İlk çalışma zamanını ayarla
    setTimeout(() => {
      this.runDailyCalculations();
      
      // Sonrasında her 24 saatte bir çalış
      this.intervalId = setInterval(() => {
        this.runDailyCalculations();
      }, 24 * 60 * 60 * 1000); // 24 saat
    }, msUntilTomorrow);
  }

  // Günlük hesaplamaları çalıştırma
  private async runDailyCalculations(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const [, schedule] of this.schedules.entries()) {
      if (!schedule.isActive) continue;
      
      const lastCalculated = new Date(schedule.lastCalculated);
      lastCalculated.setHours(0, 0, 0, 0);
      
      // Eğer bugün henüz hesaplanmadıysa hesapla
      if (lastCalculated.getTime() < today.getTime()) {
        await this.calculateDailyReturn(schedule);
        schedule.lastCalculated = new Date();
        
        // Vade kontrolü - 7 gün kaldıysa uyarı gönder
        try {
          const portfolioItems = await portfolioService.getPortfolioItems(schedule.userId);
          const deposit = portfolioItems.find(item => item.id === schedule.portfolioItemId);
          
          if (deposit && deposit.metadata?.maturityDate) {
            const maturityDate = new Date(deposit.metadata.maturityDate);
            const daysLeft = Math.ceil((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysLeft <= 7 && daysLeft > 0) {
              await pushNotificationService.showNotification('Vadeli Hesap Vade Uyarısı', {
                body: `${deposit.name} vadeli hesabınızın vadesine ${daysLeft} gün kaldı.`,
                tag: 'maturity-warning',
                requireInteraction: true
              });
            }
          }
        } catch (error) {
          console.error('Vade kontrolü hatası:', error);
        }
      }
    }
  }

  // Tek bir vadeli hesap için günlük getiri hesaplama
  private async calculateDailyReturn(schedule: DepositReturnSchedule): Promise<void> {
    try {
      await portfolioService.addDailyReturnToDeposit(
        schedule.userId,
        schedule.portfolioItemId
      );
      
      // Vadeli hesap bilgilerini al
      const portfolioItems = await portfolioService.getPortfolioItems(schedule.userId);
      const depositItem = portfolioItems.find(item => item.id === schedule.portfolioItemId);
      
      if (depositItem) {
        // Başarılı hesaplama bildirimi
        await pushNotificationService.showNotification('Vadeli Hesap Günlük Getiri', {
          body: `${depositItem.name} vadeli hesabınıza günlük getiri eklendi.`,
          tag: 'daily-return-added',
          data: { 
            type: 'daily-return-added', 
            portfolioItemId: schedule.portfolioItemId
          }
        });
      }
    } catch (error) {
      console.error('Günlük getiri hesaplama hatası:', error);
      
      // Hata bildirimi
      await pushNotificationService.showNotification('Vadeli Hesap Getiri Hatası', {
        body: 'Vadeli hesap günlük getiri hesaplanırken bir hata oluştu.',
        tag: 'daily-return-error',
        requireInteraction: true
      });
    }
  }

  // Aktif schedule'ları listeleme
  getActiveSchedules(userId: string): DepositReturnSchedule[] {
    const userSchedules: DepositReturnSchedule[] = [];
    
    for (const [, schedule] of this.schedules.entries()) {
      if (schedule.userId === userId && schedule.isActive) {
        userSchedules.push(schedule);
      }
    }
    
    return userSchedules;
  }

  // Kullanıcının tüm vadeli hesapları için otomatik getiri başlatma
  async startAutoReturnForAllDeposits(userId: string, depositItems?: PortfolioItem[]): Promise<void> {
    try {
      let deposits = depositItems;
      
      if (!deposits) {
        const portfolioItems = await portfolioService.getPortfolioItems(userId);
        deposits = portfolioItems.filter(item => item.type === 'deposit');
      }
      
      let startedCount = 0;
      
      for (const depositItem of deposits) {
        // Gerekli bilgilerin varlığını kontrol et
        if (depositItem.metadata?.annualInterestRate && depositItem.metadata?.taxExemptPercentage) {
          try {
            await this.startAutoReturnCalculation(userId, depositItem.id);
            startedCount++;
          } catch (error) {
            console.error(`Vadeli hesap ${depositItem.name} için otomatik getiri başlatılamadı:`, error);
          }
        } else {
          console.log(`Vadeli hesap ${depositItem.name} için gerekli bilgiler eksik, otomatik getiri başlatılmadı.`);
        }
      }
      
      if (startedCount > 0) {
        await pushNotificationService.showNotification('Vadeli Hesap Otomatik Getiri', {
          body: `${startedCount} vadeli hesap için otomatik getiri hesaplaması başlatıldı.`,
          tag: 'all-deposits-auto-return'
        });
      }
    } catch (error) {
      console.error('Tüm vadeli hesaplar için otomatik getiri başlatma hatası:', error);
      throw error;
    }
  }

  // Servis durumunu kontrol etme
  isServiceActive(): boolean {
    return this.intervalId !== null;
  }

  // Servis durdurma
  stopService(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.schedules.clear();
  }
}

export const depositAutoReturnService = new DepositAutoReturnService();
export default depositAutoReturnService;