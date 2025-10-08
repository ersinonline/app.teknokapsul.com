import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Calendar, Clock, Users, TrendingUp, AlertTriangle, Plus, Check } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface Course {
  id: string;
  name: string;
  day: string;
  time: string;
  semester: string;
  attendanceLimit: number; // percentage
  weeks: number;
}

interface AttendanceRecord {
  courseId: string;
  week: number;
  attended: boolean;
}

const AttendancePage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [semesterWeeks, setSemesterWeeks] = useState(14);

  // Form states
  const [courseName, setCourseName] = useState('');
  const [courseDay, setCourseDay] = useState('');
  const [courseTime, setCourseTime] = useState('');
  const [courseSemester, setCourseSemester] = useState('');
  const [attendanceLimit, setAttendanceLimit] = useState(50);

  const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const semesters = ['1. Dönem', '2. Dönem', 'Yaz Dönemi'];

  // Firebase helper functions
  const saveToFirebase = async (data: any, docPath: string) => {
    if (!user?.id) return;
    
    try {
      const userDocRef = doc(db, 'users', user.id, 'attendance', docPath);
      await setDoc(userDocRef, data, { merge: true });
    } catch (error) {
      console.error('Firebase kaydetme hatası:', error);
    }
  };

  const loadFromFirebase = async (docPath: string) => {
    if (!user?.id) return null;
    
    try {
      const userDocRef = doc(db, 'users', user.id, 'attendance', docPath);
      const docSnap = await getDoc(userDocRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Firebase okuma hatası:', error);
      return null;
    }
  };

  // Load data from localStorage and Firebase
  useEffect(() => {
    const loadData = async () => {
      // First load from localStorage for immediate display
      const savedCourses = localStorage.getItem('attendance_courses');
      const savedRecords = localStorage.getItem('attendance_records');
      const savedWeeks = localStorage.getItem('semester_weeks');

      if (savedCourses) setCourses(JSON.parse(savedCourses));
      if (savedRecords) setAttendanceRecords(JSON.parse(savedRecords));
      if (savedWeeks) setSemesterWeeks(parseInt(savedWeeks));

      // Then load from Firebase if user is authenticated
      if (user?.id) {
        const firebaseCourses = await loadFromFirebase('courses');
        const firebaseRecords = await loadFromFirebase('records');
        const firebaseWeeks = await loadFromFirebase('settings');

        if (firebaseCourses?.courses) setCourses(firebaseCourses.courses);
        if (firebaseRecords?.records) setAttendanceRecords(firebaseRecords.records);
        if (firebaseWeeks?.semesterWeeks) setSemesterWeeks(firebaseWeeks.semesterWeeks);
      }
    };

    loadData();
  }, [user?.id]);

  // Save data to localStorage and Firebase
  useEffect(() => {
    localStorage.setItem('attendance_courses', JSON.stringify(courses));
    if (user?.id && courses.length > 0) {
      saveToFirebase({ courses }, 'courses');
    }
  }, [courses, user?.id]);

  useEffect(() => {
    localStorage.setItem('attendance_records', JSON.stringify(attendanceRecords));
    if (user?.id && attendanceRecords.length > 0) {
      saveToFirebase({ records: attendanceRecords }, 'records');
    }
  }, [attendanceRecords, user?.id]);

  useEffect(() => {
    localStorage.setItem('semester_weeks', semesterWeeks.toString());
    if (user?.id) {
      saveToFirebase({ semesterWeeks }, 'settings');
    }
  }, [semesterWeeks, user?.id]);

  const addCourse = () => {
    if (!courseName || !courseDay || !courseTime || !courseSemester) return;

    const newCourse: Course = {
      id: Date.now().toString(),
      name: courseName,
      day: courseDay,
      time: courseTime,
      semester: courseSemester,
      attendanceLimit,
      weeks: semesterWeeks
    };

    setCourses([...courses, newCourse]);
    
    // Reset form
    setCourseName('');
    setCourseDay('');
    setCourseTime('');
    setCourseSemester('');
    setAttendanceLimit(50);
    setShowAddCourse(false);
  };

  const toggleAttendance = (courseId: string, week: number) => {
    const existingRecord = attendanceRecords.find(
      r => r.courseId === courseId && r.week === week
    );

    if (existingRecord) {
      setAttendanceRecords(
        attendanceRecords.map(r =>
          r.courseId === courseId && r.week === week
            ? { ...r, attended: !r.attended }
            : r
        )
      );
    } else {
      setAttendanceRecords([
        ...attendanceRecords,
        { courseId, week, attended: true }
      ]);
    }
  };

  const getAttendanceStats = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return { attended: 0, total: 0, percentage: 0 };

    const courseRecords = attendanceRecords.filter(r => r.courseId === courseId);
    const attended = courseRecords.filter(r => r.attended).length;
    const total = course.weeks;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

    return { attended, total, percentage };
  };

  const isAttendanceWarning = (courseId: string) => {
    const stats = getAttendanceStats(courseId);
    const course = courses.find(c => c.id === courseId);
    return course && stats.percentage < course.attendanceLimit;
  };

  const getWeekAttendance = (courseId: string, week: number) => {
    const record = attendanceRecords.find(
      r => r.courseId === courseId && r.week === week
    );
    return record?.attended || false;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Yoklama Takip Sistemi</h1>
          <p className="text-gray-600">Ders programlarınızı yönetin ve devamsızlık durumunuzu takip edin</p>
        </div>

        {/* Semester Configuration */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dönem Ayarları
          </h2>
          <div className="flex items-center gap-4">
            <label htmlFor="weeks" className="text-sm font-medium">Dönem Hafta Sayısı:</label>
            <input
              id="weeks"
              type="number"
              value={semesterWeeks}
              onChange={(e) => setSemesterWeeks(parseInt(e.target.value) || 14)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="20"
            />
            <span className="text-sm text-gray-500">hafta</span>
          </div>
        </div>

        {/* Add Course Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Ders Yönetimi
              </h2>
              <Button onClick={() => setShowAddCourse(!showAddCourse)}>
                {showAddCourse ? 'İptal' : 'Yeni Ders Ekle'}
              </Button>
            </div>
          </div>
          {showAddCourse && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="courseName" className="block text-sm font-medium mb-2">Ders Adı</label>
                  <input
                    id="courseName"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Örn: İngilizce"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="courseDay" className="block text-sm font-medium mb-2">Gün</label>
                  <select
                    id="courseDay"
                    value={courseDay}
                    onChange={(e) => setCourseDay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Gün seçin</option>
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="courseTime" className="block text-sm font-medium mb-2">Saat</label>
                  <input
                    id="courseTime"
                    type="time"
                    value={courseTime}
                    onChange={(e) => setCourseTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="courseSemester" className="block text-sm font-medium mb-2">Dönem</label>
                  <select
                    id="courseSemester"
                    value={courseSemester}
                    onChange={(e) => setCourseSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Dönem seçin</option>
                    {semesters.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="attendanceLimit" className="block text-sm font-medium mb-2">Devamsızlık Sınırı (%)</label>
                  <input
                    id="attendanceLimit"
                    type="number"
                    value={attendanceLimit}
                    onChange={(e) => setAttendanceLimit(parseInt(e.target.value) || 50)}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addCourse} className="w-full">
                    Ders Ekle
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Courses List */}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {courses.map(course => {
              const stats = getAttendanceStats(course.id);
              const isWarning = isAttendanceWarning(course.id);
              
              return (
                <div key={course.id} className={`bg-white rounded-lg shadow-sm border ${isWarning ? 'border-red-200 bg-red-50' : ''}`}>
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold">{course.name}</h3>
                      {isWarning && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3" />
                          Sınırda
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {course.day}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.time}
                      </span>
                      <span>{course.semester}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    {/* Statistics */}
                    <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Devam Durumu</span>
                        <span className={`text-lg font-bold ${isWarning ? 'text-red-600' : 'text-green-600'}`}>
                          %{stats.percentage}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {stats.attended} / {stats.total} ders ({stats.total - stats.attended} devamsızlık)
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Sınır: %{course.attendanceLimit}
                      </div>
                    </div>

                    {/* Warning Alert */}
                    {isWarning && (
                      <div className="mb-4 p-3 border border-red-200 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">Devamsızlık sınırına yaklaştınız! Dikkatli olun.</span>
                        </div>
                      </div>
                    )}

                    {/* Weekly Attendance */}
                    <div>
                      <h4 className="font-medium mb-3">Haftalık Yoklama</h4>
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: course.weeks }, (_, i) => i + 1).map(week => {
                          const attended = getWeekAttendance(course.id, week);
                          return (
                            <button
                              key={week}
                              onClick={() => toggleAttendance(course.id, week)}
                              className={`h-10 rounded-md text-sm font-medium transition-colors ${
                                attended 
                                  ? 'bg-green-600 text-white hover:bg-green-700' 
                                  : 'border border-gray-300 bg-white hover:bg-red-100'
                              }`}
                            >
                              {week}
                              {attended && <Check className="h-3 w-3 ml-1 inline" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Overall Statistics */}
        {courses.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Genel İstatistikler
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
                  <div className="text-sm text-blue-700">Toplam Ders</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(courses.reduce((acc, course) => acc + getAttendanceStats(course.id).percentage, 0) / courses.length) || 0}%
                  </div>
                  <div className="text-sm text-green-700">Ortalama Devam</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {courses.filter(course => isAttendanceWarning(course.id)).length}
                  </div>
                  <div className="text-sm text-red-700">Riskli Ders</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz ders eklenmemiş</h3>
            <p className="text-gray-600 mb-4">Yoklama takibine başlamak için ilk dersinizi ekleyin</p>
            <Button onClick={() => setShowAddCourse(true)}>
              İlk Dersi Ekle
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;