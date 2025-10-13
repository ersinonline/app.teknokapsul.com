import React, { useState, useEffect } from 'react';
import { Clock, Calendar, DollarSign, Settings, Plus, Edit2, Trash2, AlertTriangle, Grid, List, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { workTrackingService } from '../services/work-tracking.service';
import { WorkEntry, WorkSettings } from '../types/work-tracking';
import { formatCurrency } from '../utils/currency';

const WorkTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [workSettings, setWorkSettings] = useState<WorkSettings | null>(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Form states
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakMinutes, setBreakMinutes] = useState(0);

  // Bayram tarihleri states
  const [showBayramModal, setShowBayramModal] = useState(false);
  const [ramadanDates, setRamadanDates] = useState('2025-03-30,2025-03-31,2025-04-01');
  const [curbanDates, setCurbanDates] = useState('2025-06-06,2025-06-07,2025-06-08,2025-06-09');

  // Maaş geçmişi states
  const [showSalaryHistoryModal, setShowSalaryHistoryModal] = useState(false);
  const [paidSalary, setPaidSalary] = useState('');
  const [mealAllowancePaid, setMealAllowancePaid] = useState('');
  const [transportAllowancePaid, setTransportAllowancePaid] = useState('');
  const [calculatedSalary, setCalculatedSalary] = useState(0);
  
  // Düzenleme states
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Toast bildirimi states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Toast bildirimi gösterme fonksiyonu
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedMonth, selectedYear]);

  useEffect(() => {
    const summary = calculateMonthlySummary();
    if (summary) {
      setCalculatedSalary(summary.totalSalary);
    }
  }, [workEntries, workSettings, selectedMonth, selectedYear]);

  // Maaş geçmişi verilerini localStorage'dan yükle
  useEffect(() => {
    if (user) {
      const savedPaidSalary = localStorage.getItem(`paidSalary_${user.id}_${selectedYear}_${selectedMonth}`);
      const savedMealAllowance = localStorage.getItem(`mealAllowancePaid_${user.id}_${selectedYear}_${selectedMonth}`);
      const savedTransportAllowance = localStorage.getItem(`transportAllowancePaid_${user.id}_${selectedYear}_${selectedMonth}`);
      
      if (savedPaidSalary) setPaidSalary(savedPaidSalary);
      if (savedMealAllowance) setMealAllowancePaid(savedMealAllowance);
      if (savedTransportAllowance) setTransportAllowancePaid(savedTransportAllowance);
    }
  }, [user, selectedYear, selectedMonth]);

  // Maaş geçmişi verilerini localStorage'a kaydet
  useEffect(() => {
    if (user && paidSalary) {
      localStorage.setItem(`paidSalary_${user.id}_${selectedYear}_${selectedMonth}`, paidSalary);
    }
  }, [user, paidSalary, selectedYear, selectedMonth]);

  useEffect(() => {
    if (user && mealAllowancePaid) {
      localStorage.setItem(`mealAllowancePaid_${user.id}_${selectedYear}_${selectedMonth}`, mealAllowancePaid);
    }
  }, [user, mealAllowancePaid, selectedYear, selectedMonth]);

  useEffect(() => {
    if (user && transportAllowancePaid) {
      localStorage.setItem(`transportAllowancePaid_${user.id}_${selectedYear}_${selectedMonth}`, transportAllowancePaid);
    }
  }, [user, transportAllowancePaid, selectedYear, selectedMonth]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [entries, settings] = await Promise.all([
        workTrackingService.getWorkEntries(user.id, selectedMonth, selectedYear),
        workTrackingService.getWorkSettings(user.id)
      ]);
      
      setWorkEntries(entries);
      setWorkSettings(settings);
      
      // İlk kez giriş yapıyorsa ayarları sor
      if (!settings) {
        setShowSettingsModal(true);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (settings: Omit<WorkSettings, 'id' | 'userId'>) => {
    if (!user) {
      console.error('Kullanıcı bulunamadı');
      alert('Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    try {
      console.log('Ayarlar kaydediliyor:', settings);
      console.log('Kullanıcı ID:', user.id);
      
      const result = await workTrackingService.saveWorkSettings(user.id, settings);
      console.log('Ayarlar başarıyla kaydedildi, ID:', result);
      
      await loadData();
      setShowSettingsModal(false);
      showToast('Ayarlar başarıyla kaydedildi!');
    } catch (error) {
      console.error('Ayarları kaydetme hatası:', error);
      showToast(`Ayarlar kaydedilirken bir hata oluştu: ${error}`, 'error');
    }
  };

  const handleAddWorkEntry = async () => {
    if (!user) {
      console.error('Kullanıcı bulunamadı');
      showToast('Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.', 'error');
      return;
    }
    
    if (!workSettings) {
      console.error('İş ayarları bulunamadı');
      showToast('Önce iş ayarlarınızı yapılandırın.', 'error');
      return;
    }
    
    if (!startTime || !endTime) {
      showToast('Başlangıç ve bitiş saatlerini giriniz.', 'error');
      return;
    }

    // Aynı tarihte kayıt var mı kontrol et
    const existingEntry = workEntries.find(entry => entry.date === workDate);
    if (existingEntry) {
      showToast('Bu tarihte zaten bir çalışma kaydı bulunmaktadır. Düzenlemek için kayıt üzerine tıklayın.', 'error');
      return;
    }

    try {
      const entry: Omit<WorkEntry, 'id'> = {
        userId: user.id,
        date: workDate,
        startTime,
        endTime,
        breakMinutes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('İş girişi ekleniyor:', entry);
      const result = await workTrackingService.addWorkEntry(entry);
      console.log('İş girişi başarıyla eklendi, ID:', result);
      
      await loadData();
      setShowAddModal(false);
      
      // Form'u temizle
      setStartTime('');
      setEndTime('');
      setBreakMinutes(0);
      
      showToast('İş girişi başarıyla eklendi!');
    } catch (error) {
      console.error('İş girişi ekleme hatası:', error);
      showToast(`İş girişi eklenirken bir hata oluştu: ${error}`, 'error');
    }
  };

  const handleEditWorkEntry = async () => {
    if (!user || !editingEntry) return;
    
    if (!startTime || !endTime) {
      showToast('Başlangıç ve bitiş saatlerini giriniz.', 'error');
      return;
    }

    try {
      const updates = {
        startTime,
        endTime,
        breakMinutes,
        updatedAt: new Date()
      };

      await workTrackingService.updateWorkEntry(editingEntry.id, updates);
      await loadData();
      setShowEditModal(false);
      setEditingEntry(null);
      
      // Form'u temizle
      setStartTime('');
      setEndTime('');
      setBreakMinutes(0);
      
      showToast('İş girişi başarıyla güncellendi!');
    } catch (error) {
      console.error('İş girişi güncelleme hatası:', error);
      showToast(`İş girişi güncellenirken bir hata oluştu: ${error}`, 'error');
    }
  };

  const handleDeleteWorkEntry = async (entryId: string) => {
    if (!confirm('Bu çalışma kaydını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await workTrackingService.deleteWorkEntry(entryId);
      await loadData();
      showToast('İş girişi başarıyla silindi!');
    } catch (error) {
      console.error('İş girişi silme hatası:', error);
      showToast(`İş girişi silinirken bir hata oluştu: ${error}`, 'error');
    }
  };

  const openEditModal = (entry: WorkEntry) => {
    setEditingEntry(entry);
    setWorkDate(entry.date);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setBreakMinutes(entry.breakMinutes);
    setShowEditModal(true);
  };

  const calculateWorkHours = (startTime: string, endTime: string, breakMinutes: number): number => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours - (breakMinutes / 60));
  };

  const calculateMonthlySummary = () => {
    if (!workSettings) return null;

    const monthlyEntries = workEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;
    });

    const totalHours = monthlyEntries.reduce((sum, entry) => {
      return sum + calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes);
    }, 0);

    const totalDays = monthlyEntries.length;
    const holidayDays = getHolidayDaysInMonth(selectedMonth, selectedYear);
    
    const mealAllowance = totalDays * (workSettings.dailyMealAllowance || 0);
    const transportAllowance = totalDays * (workSettings.dailyTransportAllowance || 0);
    // Çift mesai hesaplaması: tatil günlerinde çalışılan saatler çift ücret alır
    let regularSalary = 0;
    let overtimeSalary = 0;
    
    monthlyEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const workHours = calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes);
      const isHoliday = isHolidayDate(entryDate);
      
      if (isHoliday) {
        overtimeSalary += workHours * workSettings.hourlyRate; // Tatil günü çift maaş
      }
      regularSalary += workHours * workSettings.hourlyRate;
    });
    
    const totalSalary = regularSalary + overtimeSalary + mealAllowance + transportAllowance;

    const isOverMonthlyLimit = workSettings.monthlyHourLimit && totalHours > workSettings.monthlyHourLimit;
    const isOverWeeklyLimit = workSettings.weeklyHourLimit && checkWeeklyLimit();
    const isOverDailyLimit = workSettings.dailyHourLimit && checkDailyLimit();

    return {
      totalHours,
      totalDays,
      overtimeHours: 0,
      baseSalary: regularSalary,
      mealAllowance,
      transportAllowance,
      totalSalary,
      holidayDays,
      holidaySalary: overtimeSalary,
      isOverMonthlyLimit,
      isOverWeeklyLimit,
      isOverDailyLimit,
      monthlyHourLimit: workSettings.monthlyHourLimit
    };
  };

  const getHolidayDaysInMonth = (month: number, year: number): number => {
    const holidays = getHolidays(year);
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday);
      return holidayDate.getMonth() === month && holidayDate.getFullYear() === year;
    }).length;
  };

  const getHolidays = (year: number): Date[] => {
    const holidays: Date[] = [];
    
    // Resmi tatiller
    holidays.push(new Date(year, 0, 1)); // Yılbaşı
    holidays.push(new Date(year, 3, 23)); // Ulusal Egemenlik ve Çocuk Bayramı
    holidays.push(new Date(year, 4, 1)); // İşçi Bayramı
    holidays.push(new Date(year, 4, 19)); // Atatürk'ü Anma, Gençlik ve Spor Bayramı
    holidays.push(new Date(year, 6, 15)); // Demokrasi ve Milli Birlik Günü
    holidays.push(new Date(year, 7, 30)); // Zafer Bayramı
    holidays.push(new Date(year, 9, 29)); // Cumhuriyet Bayramı
    
    // Ramazan ve Kurban Bayramı (her zaman dahil)
    const ramadanDatesForYear = getRamadanBayramDates(year);
    holidays.push(...ramadanDatesForYear);
    
    const curbanDatesForYear = getCurbanBayramDates(year);
    holidays.push(...curbanDatesForYear);
    
    return holidays;
  };

  const getRamadanBayramDates = (year: number): Date[] => {
    if (!ramadanDates) return [];
    
    const dates: Date[] = [];
    const dateStrings = ramadanDates.split(',').map(d => d.trim());
    
    dateStrings.forEach(dateStr => {
      if (dateStr) {
        const date = new Date(dateStr);
        if (date.getFullYear() === year) {
          dates.push(date);
        }
      }
    });
    
    return dates;
  };

  const getCurbanBayramDates = (year: number): Date[] => {
    if (!curbanDates) return [];
    
    const dates: Date[] = [];
    const dateStrings = curbanDates.split(',').map(d => d.trim());
    
    dateStrings.forEach(dateStr => {
      if (dateStr) {
        const date = new Date(dateStr);
        if (date.getFullYear() === year) {
          dates.push(date);
        }
      }
    });
    
    return dates;
  };

  const handleBayramDatesSubmit = (newRamadanDates: string, newCurbanDates: string) => {
    setRamadanDates(newRamadanDates);
    setCurbanDates(newCurbanDates);
    setShowBayramModal(false);
    loadData(); // Verileri yeniden yükle
  };

  const isHolidayDate = (date: Date): boolean => {
    const holidays = getHolidays(date.getFullYear());
    return holidays.some(holiday => 
      holiday.getDate() === date.getDate() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getFullYear() === date.getFullYear()
    );
  };

  const checkWeeklyLimit = (): boolean => {
    if (!workSettings?.weeklyHourLimit) return false;
    
    // Haftalık kontrol mantığı
    const weeklyHours = new Map<string, number>();
    
    workEntries.forEach(entry => {
      const date = new Date(entry.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      const hours = calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes);
      weeklyHours.set(weekKey, (weeklyHours.get(weekKey) || 0) + hours);
    });
    
    return Array.from(weeklyHours.values()).some(hours => hours > workSettings.weeklyHourLimit!);
  };

  const checkDailyLimit = (): boolean => {
    if (!workSettings?.dailyHourLimit) return false;
    
    return workEntries.some(entry => {
      const hours = calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes);
      // Tolerans kaldırıldı
      return hours > workSettings.dailyHourLimit!;
    });
  };

  const summary = calculateMonthlySummary();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                İş Takibi
              </h1>
              <p className="text-gray-600 mt-1">Çalışma saatlerinizi takip edin ve maaşınızı hesaplayın</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Ayarlar
              </button>
              

              
              <button
                onClick={() => setShowSalaryHistoryModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                Maaş Geçmişi
              </button>
              
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${
                    viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Takvim
                </button>
              </div>
              
              <button
                onClick={() => {
                  // Bugünün tarihini ayarla
                  const today = new Date();
                  const formattedDate = today.toISOString().split('T')[0];
                  setWorkDate(formattedDate);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Çalışma Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Month/Year Selector */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2000, i, 1).toLocaleDateString('tr-TR', { month: 'long' })}
                </option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Toplam Saat</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{summary.totalHours.toFixed(1)}</p>
                  {summary.monthlyHourLimit && (
                    <p className={`text-xs ${
                      summary.isOverMonthlyLimit ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      Limit: {summary.monthlyHourLimit} saat
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Çalışılan Gün</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{summary.totalDays}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Çalışma Ücreti</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{formatCurrency((summary.totalHours * (workSettings?.hourlyRate || 0)))}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Yemek Ücreti</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{formatCurrency(summary.mealAllowance)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Yol Ücreti</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{formatCurrency(summary.transportAllowance)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Toplam Maaş</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{formatCurrency(summary.totalSalary)}</p>
                  {summary.holidayDays > 0 && (
                    <p className="text-xs text-green-600">
                      +{summary.holidayDays} tatil günü
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Holiday Summary */}
        {summary && summary.holidayDays > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800 mb-2">Tatil Günü Bonusu</h3>
                <p className="text-sm text-green-700">
                  Bu ay {summary.holidayDays} tatil günü için çift maaş bonusu: {formatCurrency(summary.holidaySalary)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {summary && (summary.isOverMonthlyLimit || summary.isOverWeeklyLimit || summary.isOverDailyLimit) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800 mb-2">Uyarılar</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {summary.isOverMonthlyLimit && (
                    <li>• Aylık çalışma saati limitini {(summary.totalHours - summary.monthlyHourLimit!).toFixed(1)} saat aştınız</li>
                  )}
                  {summary.isOverWeeklyLimit && (
                    <li>• Haftalık çalışma saati limitini aştığınız haftalar var</li>
                  )}
                  {summary.isOverDailyLimit && (
                    <li>• Günlük çalışma saati limitini aştığınız günler var</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Work Entries */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Çalışma Kayıtları</h2>
          </div>
          
          <div className="p-3 sm:p-6">
            {workEntries.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Henüz çalışma kaydınız bulunmuyor.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  İlk Kaydınızı Ekleyin
                </button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-3 sm:space-y-4">
                {workEntries
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((entry) => {
                  const workHours = calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes);
                  const isOverDailyLimit = workSettings?.dailyHourLimit && workHours > workSettings.dailyHourLimit;
                  const isHoliday = isHolidayDate(new Date(entry.date));
                  
                  return (
                    <div 
                      key={entry.id} 
                      className={`border-2 rounded-xl p-4 sm:p-6 cursor-pointer hover:shadow-lg transition-all duration-200 ${
                        isHoliday ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-emerald-200/50' :
                        isOverDailyLimit ? 'border-red-200 bg-gradient-to-br from-red-50 to-pink-50 hover:shadow-red-200/50' : 
                        'border-gray-200 bg-white hover:border-blue-200 hover:shadow-blue-100/50'
                      }`}
                      onClick={() => openEditModal(entry)}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <span className="text-base sm:text-lg font-bold text-gray-900">
                                {new Date(entry.date).toLocaleDateString('tr-TR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                              {isHoliday && (
                                <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 px-3 py-1 rounded-full font-semibold border border-emerald-200">
                                  🎉 Tatil Günü
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">
                                🕐 {entry.startTime} - {entry.endTime}
                              </span>
                              {entry.breakMinutes > 0 && (
                                <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-md font-medium">
                                  ☕ {entry.breakMinutes} dk mola
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="hidden sm:flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(entry);
                              }}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWorkEntry(entry.id!);
                              }}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-500 mb-1">Çalışma Saati</p>
                            <p className={`font-bold text-lg ${
                              isOverDailyLimit ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              {workHours.toFixed(1)} saat
                            </p>
                          </div>
                          {workSettings && (
                            <>
                              <div className="bg-green-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500 mb-1">Maaş</p>
                                <p className="font-bold text-lg text-green-600">
                                  {formatCurrency(workHours * workSettings.hourlyRate * (isHoliday ? 2 : 1))}
                                </p>
                              </div>
                              <div className="bg-orange-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500 mb-1">Yemek</p>
                                <p className="font-bold text-lg text-orange-600">
                                  {formatCurrency(workSettings.dailyMealAllowance)}
                                </p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500 mb-1">Yol</p>
                                <p className="font-bold text-lg text-purple-600">
                                  {formatCurrency(workSettings.dailyTransportAllowance)}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex sm:hidden items-center justify-center gap-3 pt-2 border-t border-gray-100">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(entry);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                          >
                            <Edit2 className="w-4 h-4" />
                            Düzenle
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkEntry(entry.id!);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                            Sil
                          </button>
                        </div>
                      </div>
                      
                      {isOverDailyLimit && (
                        <div className="mt-2 text-sm text-red-600">
                          ⚠️ Günlük limit ({workSettings?.dailyHourLimit} saat) aşıldı
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Takvim Görünümü
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Gün başlıkları */}
                <div className="grid grid-cols-7 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                  {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, index) => (
                    <div key={day} className={`p-3 text-center text-xs sm:text-sm font-semibold ${
                      index >= 5 ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7">
                {(() => {
                  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
                  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Pazartesi = 0
                  
                  const days = [];
                  
                  // Önceki ayın boş günleri
                   for (let i = 0; i < startDay; i++) {
                     days.push(
                       <div key={`empty-${i}`} className="h-20 sm:h-24 md:h-28 border-r border-b border-gray-100 bg-gray-25"></div>
                     );
                   }
                  
                  // Bu ayın günleri
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const entry = workEntries.find(e => e.date === dateStr);
                    const isToday = new Date().toDateString() === new Date(selectedYear, selectedMonth, day).toDateString();
                    const isHoliday = isHolidayDate(new Date(selectedYear, selectedMonth, day));
                    
                    days.push(
                       <div
                         key={day}
                         className={`relative h-20 sm:h-24 md:h-28 border-r border-b border-gray-100 cursor-pointer transition-all duration-200 group ${
                           isToday ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' :
                           entry ? (isHoliday ? 'bg-gradient-to-br from-emerald-50 to-green-100' : 'bg-gradient-to-br from-white to-gray-50 hover:from-blue-25 hover:to-blue-50') :
                           'bg-white hover:bg-gradient-to-br hover:from-gray-25 hover:to-gray-50'
                         } ${
                           entry ? 'shadow-sm' : ''
                         }`}
                         onClick={() => {
                           const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                           if (entry) {
                             openEditModal(entry);
                           } else {
                             setWorkDate(formattedDate);
                             setShowAddModal(true);
                           }
                         }}
                       >
                        {/* Gün numarası */}
                         <div className={`absolute top-1 left-1 sm:top-2 sm:left-2 text-xs sm:text-sm font-semibold ${
                           isToday ? 'text-blue-700 bg-blue-200 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center' :
                           entry ? 'text-gray-800' : 'text-gray-400'
                         }`}>
                           {day}
                         </div>
                         
                         {/* Çalışma bilgileri */}
                         {entry && (
                           <div className="absolute inset-x-1 bottom-1 sm:inset-x-2 sm:bottom-2">
                             <div className="bg-white/90 backdrop-blur-sm rounded-md p-1.5 sm:p-1 shadow-sm border border-gray-200">
                               <div className="text-xs sm:text-xs text-gray-700 font-medium truncate">
                                 {entry.startTime}-{entry.endTime}
                               </div>
                               <div className="text-xs sm:text-xs text-blue-600 font-semibold">
                                 {calculateWorkHours(entry.startTime, entry.endTime, entry.breakMinutes).toFixed(1)}h
                               </div>
                               {isHoliday && (
                                 <div className="text-xs sm:text-xs text-emerald-600 font-medium">🎉 Tatil</div>
                               )}
                             </div>
                           </div>
                         )}
                         
                         {/* Boş gün için + işareti */}
                         {!entry && (
                           <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                               <span className="text-gray-400 group-hover:text-blue-500 text-xl sm:text-lg font-light">+</span>
                             </div>
                           </div>
                         )}
                      </div>
                    );
                  }
                  
                  return days;
                 })()}
                </div>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
          currentSettings={workSettings}
        />
      )}

      {showAddModal && (
        <AddWorkEntryModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddWorkEntry}
          workDate={workDate}
          setWorkDate={setWorkDate}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          breakMinutes={breakMinutes}
          setBreakMinutes={setBreakMinutes}
          isEditing={false}
        />
      )}

      {showEditModal && (
        <AddWorkEntryModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingEntry(null);
            setStartTime('');
            setEndTime('');
            setBreakMinutes(0);
          }}
          onSave={handleEditWorkEntry}
          workDate={workDate}
          setWorkDate={setWorkDate}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          breakMinutes={breakMinutes}
          setBreakMinutes={setBreakMinutes}
          isEditing={true}
        />
      )}

      {showBayramModal && (
        <BayramDatesModal
          isOpen={showBayramModal}
          onClose={() => setShowBayramModal(false)}
          onSave={handleBayramDatesSubmit}
          ramadanDates={ramadanDates}
          curbanDates={curbanDates}
        />
      )}

      {showSalaryHistoryModal && (
        <SalaryHistoryModal
          isOpen={showSalaryHistoryModal}
          onClose={() => setShowSalaryHistoryModal(false)}
          paidSalary={paidSalary}
          setPaidSalary={setPaidSalary}
          mealAllowancePaid={mealAllowancePaid}
          setMealAllowancePaid={setMealAllowancePaid}
          transportAllowancePaid={transportAllowancePaid}
          setTransportAllowancePaid={setTransportAllowancePaid}
          calculatedSalary={calculatedSalary}
        />
      )}
      
      {/* Toast Bildirimi */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 p-4 rounded-xl shadow-lg border transition-all duration-300 ${
          toast?.type === 'success' 
            ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-800' 
            : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-1 rounded-full ${
              toast?.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              {toast?.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <span className="font-medium flex-1">{toast?.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Bayram Tarihleri Modal Component
interface BayramDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ramadanDates: string, curbanDates: string) => void;
  ramadanDates: string;
  curbanDates: string;
}

const BayramDatesModal: React.FC<BayramDatesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  ramadanDates,
  curbanDates
}) => {
  const [localRamadanDates, setLocalRamadanDates] = useState(ramadanDates);
  const [localCurbanDates, setLocalCurbanDates] = useState(curbanDates);

  const handleSave = () => {
    onSave(localRamadanDates, localCurbanDates);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Bayram Tarihleri</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ramazan Bayramı Tarihleri
            </label>
            <textarea
              value={localRamadanDates}
              onChange={(e) => setLocalRamadanDates(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: 2024-04-10,2024-04-11,2024-04-12"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Tarihleri virgülle ayırarak girin (YYYY-MM-DD formatında)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kurban Bayramı Tarihleri
            </label>
            <textarea
              value={localCurbanDates}
              onChange={(e) => setLocalCurbanDates(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: 2024-06-16,2024-06-17,2024-06-18,2024-06-19"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Tarihleri virgülle ayırarak girin (YYYY-MM-DD formatında)
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

// Maaş Geçmişi Modal Component
interface SalaryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  paidSalary: string;
  setPaidSalary: (salary: string) => void;
  mealAllowancePaid: string;
  setMealAllowancePaid: (allowance: string) => void;
  transportAllowancePaid: string;
  setTransportAllowancePaid: (allowance: string) => void;
  calculatedSalary: number;
}

const SalaryHistoryModal: React.FC<SalaryHistoryModalProps> = ({
  isOpen,
  onClose,
  paidSalary,
  setPaidSalary,
  mealAllowancePaid,
  setMealAllowancePaid,
  transportAllowancePaid,
  setTransportAllowancePaid,
  calculatedSalary
}) => {
  if (!isOpen) return null;

  const difference = calculatedSalary - (parseFloat(paidSalary || '0') + parseFloat(mealAllowancePaid || '0') + parseFloat(transportAllowancePaid || '0'));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Maaş Geçmişi</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yatan Maaş (₺)
            </label>
            <input
              type="text"
              value={paidSalary}
              onChange={(e) => {
                const value = e.target.value;
                // Sadece sayı ve nokta karakterlerine izin ver
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setPaidSalary(value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: 15000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yatan Yemek Ücreti (₺)
            </label>
            <input
              type="text"
              value={mealAllowancePaid}
              onChange={(e) => {
                const value = e.target.value;
                // Sadece sayı ve nokta karakterlerine izin ver
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setMealAllowancePaid(value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: 500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yatan Yol Ücreti (₺)
            </label>
            <input
              type="text"
              value={transportAllowancePaid}
              onChange={(e) => {
                const value = e.target.value;
                // Sadece sayı ve nokta karakterlerine izin ver
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setTransportAllowancePaid(value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: 300"
            />
          </div>
          
          <div className="border-t pt-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hesaplanan Toplam:</span>
                <span className="font-medium">{calculatedSalary.toFixed(2)} ₺</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Yatan Toplam:</span>
                <span className="font-medium">{(parseFloat(paidSalary || '0') + parseFloat(mealAllowancePaid || '0') + parseFloat(transportAllowancePaid || '0')).toFixed(2)} ₺</span>
              </div>
              <div className={`flex justify-between text-sm font-bold ${
                difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : 'text-gray-600'
              }`}>
                <span>Fark:</span>
                <span>
                  {difference > 0 ? '+' : ''}{difference.toFixed(2)} ₺
                  {difference > 0 && ' (Eksik)'}
                  {difference < 0 && ' (Fazla)'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Kapat
          </button>
          <button
            onClick={() => {
              // Burada maaş geçmişi kaydetme işlemi yapılabilir
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

// Settings Modal Component
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Omit<WorkSettings, 'id' | 'userId'>) => void;
  currentSettings: WorkSettings | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
  const [hourlyRate, setHourlyRate] = useState(currentSettings?.hourlyRate || 0);
  const [dailyMealAllowance, setDailyMealAllowance] = useState(currentSettings?.dailyMealAllowance || 0);
  const [dailyTransportAllowance, setDailyTransportAllowance] = useState(currentSettings?.dailyTransportAllowance || 0);
  const [dailyHourLimit, setDailyHourLimit] = useState(currentSettings?.dailyHourLimit || 8);
  const [weeklyHourLimit, setWeeklyHourLimit] = useState(currentSettings?.weeklyHourLimit || 45);
  const [monthlyHourLimit, setMonthlyHourLimit] = useState(currentSettings?.monthlyHourLimit || 180);

  const handleSave = () => {
    onSave({
      hourlyRate,
      dailyMealAllowance,
      dailyTransportAllowance,
      dailyHourLimit,
      weeklyHourLimit,
      monthlyHourLimit,
      includeRamadanBayram: true, // Her zaman true
      includeCurbanBayram: true, // Her zaman true
      createdAt: currentSettings?.createdAt || new Date(),
      updatedAt: new Date()
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">İş Takibi Ayarları</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saatlik Ücret (₺)
            </label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: 45"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Günlük Yemek Ücreti (₺)
            </label>
            <input
              type="number"
              value={dailyMealAllowance}
              onChange={(e) => setDailyMealAllowance(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: 25"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Günlük Yol Ücreti (₺)
            </label>
            <input
              type="number"
              value={dailyTransportAllowance}
              onChange={(e) => setDailyTransportAllowance(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: 15"
            />
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Çalışma Saati Limitleri</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Günlük Maksimum Saat
                </label>
                <input
                  type="number"
                  value={dailyHourLimit}
                  onChange={(e) => setDailyHourLimit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: 8"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Haftalık Maksimum Saat
                </label>
                <input
                  type="number"
                  value={weeklyHourLimit}
                  onChange={(e) => setWeeklyHourLimit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: 45"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Aylık Maksimum Saat
                </label>
                <input
                  type="number"
                  value={monthlyHourLimit}
                  onChange={(e) => setMonthlyHourLimit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: 180"
                />
              </div>
            </div>
          </div>
          

        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Work Entry Modal Component
interface AddWorkEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  workDate: string;
  setWorkDate: (date: string) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  breakMinutes: number;
  setBreakMinutes: (minutes: number) => void;
  isEditing?: boolean;
}

const AddWorkEntryModal: React.FC<AddWorkEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  workDate,
  setWorkDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  breakMinutes,
  setBreakMinutes,
  isEditing = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{isEditing ? 'Çalışma Kaydı Düzenle' : 'Çalışma Kaydı Ekle'}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih
            </label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              disabled={isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Saati
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitiş Saati
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mola Süresi (dakika)
            </label>
            <input
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: 60"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onSave}
           disabled={!startTime || !endTime}
           className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
         >
           {isEditing ? 'Güncelle' : 'Kaydet'}
         </button>
       </div>
     </div>
   </div>
 );
};

export default WorkTrackingPage;