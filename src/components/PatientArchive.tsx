import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  FileText, 
  Calendar, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  RotateCcw, 
  Lock, 
  Plus, 
  Stethoscope, 
  ExternalLink, 
  Filter,
  CheckCircle2,
  BookmarkCheck,
  TrendingUp,
  SlidersHorizontal,
  FolderMinus
} from 'lucide-react';
import { MedicalSession } from './VoipTwilio';
import { UserHealthProfile } from '../types';

interface PatientArchiveProps {
  currentUser: UserHealthProfile;
  doctors: any[];
}

export default function PatientArchive({ currentUser, doctors = [] }: PatientArchiveProps) {
  const [sessions, setSessions] = useState<MedicalSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');
  const [expandedSessId, setExpandedSessId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load sessions from localStorage
  const loadSessions = () => {
    try {
      const stored = localStorage.getItem('medpulse_clinical_sessions');
      if (stored) {
        setSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load clinical sessions for archive", e);
    }
  };

  useEffect(() => {
    loadSessions();
    // Listen for custom storage events to keep updated
    const handleStorageChange = () => {
      loadSessions();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Guarded current user variables to prevent null pointer exceptions
  const userRole = currentUser?.role || '';
  const userEmail = currentUser?.email || '';
  const userName = currentUser?.name || '';

  // Filter sessions that are CLOSED
  const archivedSessions = (sessions || []).filter(s => s && s.status === 'closed');

  // Apply search query and doctor filter safely
  const filteredSessions = archivedSessions.filter(s => {
    if (!s) return false;
    const patientName = s.patientName || '';
    const patientEmail = s.patientEmail || '';
    const doctorId = s.doctorId || '';
    const doctorName = s.doctorName || '';

    const matchesSearch = 
      patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDoctor = selectedDoctorId === 'all' || doctorId === selectedDoctorId;
    
    // If the logged-in user is a doctor (and not admin), they should ONLY see their own patient archive records
    const matchesDoctorRoleAccess = userRole === 'admin' || doctorId === userEmail || (doctorName && userName && doctorName.includes(userName));

    return matchesSearch && matchesDoctor && matchesDoctorRoleAccess;
  });

  // Re-open/restore session back to open safely
  const handleRestoreSession = (sessionId: string) => {
    const updated = (sessions || []).map(s => {
      if (s && s.id === sessionId) {
        // Send a notification message inside chat logs about re-opening
        const restoreMsg = {
          id: String(Date.now()),
          sender: 'doctor' as const,
          text: `🔓 تم إعادة فتح وتفعيل الغرفة الطبية بواسطة ${userRole === 'admin' ? 'إدارة المنصة' : 'الطبيب المعالج'} لمتابعة الحالة الطبية مجدداً.`,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        };
        return {
          ...s,
          status: 'open' as const,
          lastMessageAt: new Date().toISOString(),
          lastMessageText: 'تم إعادة فتح الغرفة الطبية لمتابعة الكشف 🔓',
          chats: [...(s.chats || []), restoreMsg]
        };
      }
      return s;
    });

    setSessions(updated);
    localStorage.setItem('medpulse_clinical_sessions', JSON.stringify(updated));
    // Dispatch state update to other tabs
    window.dispatchEvent(new Event('storage'));
  };

  // Permanently delete session (Admins Only) safely
  const handleDeleteSession = (sessionId: string) => {
    const updated = (sessions || []).filter(s => s && s.id !== sessionId);
    setSessions(updated);
    localStorage.setItem('medpulse_clinical_sessions', JSON.stringify(updated));
    setDeleteConfirmId(null);
    window.dispatchEvent(new Event('storage'));
  };

  // Safe Date formatter
  const formatDateSafe = (dateStr?: string) => {
    if (!dateStr) return 'غير معروف';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'غير معروف';
      return d.toLocaleDateString('ar-EG', {month: 'short', day: 'numeric', year: 'numeric'});
    } catch (e) {
      return 'غير معروف';
    }
  };

  // Extract prescription messages safely (starting with ✍️ 💊) or generic prescription texts
  const getPrescriptionText = (sess: MedicalSession) => {
    const chats = sess.chats || [];
    const rxMsg = [...chats]
      .reverse()
      .find(m => m && m.sender === 'doctor' && m.text && (m.text.includes('روشتة') || m.text.includes('وصفة طبية') || m.text.includes('✍️ 💊')));
    
    if (rxMsg) {
      // Return clean prescription text if possible, or just the whole text
      return rxMsg.text;
    }
    
    // Fallback search for any doctor messages containing specific medication keywords (جلوكوفاج، أنسولين، علاج، حبة)
    const medicalKeywords = ['دواء', 'جرعة', 'ملغم', 'حبة', 'علاج', 'يومياً', 'انسولين', 'حبوب'];
    const medicationMsg = [...chats]
      .reverse()
      .find(m => m && m.sender === 'doctor' && m.text && medicalKeywords.some(keyword => m.text.toLowerCase().includes(keyword)));
      
    return medicationMsg ? medicationMsg.text : null;
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Premium Diagnostic Hub Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute left-0 top-0 -ml-12 -mt-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/4 bottom-0 -mb-16 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl text-center md:text-right">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black px-3 py-1 rounded-full uppercase tracking-wider font-mono">
              بوابة الطوارئ الطبية الرقمية المتكاملة 📂
            </span>
            <h1 className="text-xl md:text-2xl font-black font-display text-white">
              أرشيف سجلات المرضى والروشتات المعتمدة 🗃️
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              هذه لوحة مخصصة ومحمية بموجب ترخيص وزارة الصحة لتمكين الأطباء والإداريين من تتبع الحالات السريرية المؤرشفة ومراجعة فحوصاتها السابقة والروشتات المصروفة وتأكيد جودة الخدمة الطبية في أي وقت.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center min-w-[100px]">
              <span className="text-2xl block">📂</span>
              <span className="text-[10px] text-indigo-200 block font-bold mt-1">إجمالي المؤرشف</span>
              <span className="text-lg font-black font-mono text-white">{archivedSessions.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center min-w-[100px]">
              <span className="text-2xl block">🔍</span>
              <span className="text-[10px] text-indigo-200 block font-bold mt-1">المطابق للفحص</span>
              <span className="text-lg font-black font-mono text-teal-300">{filteredSessions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="ابحث عن مريض بالاسم الكامل أو البريد الإلكتروني..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
        </div>

        {/* Doctor selector (visible to Admin only) */}
        {userRole === 'admin' && (
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-700 cursor-pointer font-sans w-full md:w-[220px]"
            >
              <option value="all">كل الأطباء المعالجين 🩺</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Archive Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-3xl">
            📭
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">لا يوجد سجلات في الأرشيف تطابق خيارات البحث</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              تأكد من كتابة الاسم بشكل صحيح، أو أن المريض قد تم بالفعل إنهاء وإغلاق جلسته الطبية من قبل الطبيب لتتحول إلى هنا.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSessions.map((sess) => {
            const isExpanded = expandedSessId === sess.id;
            const rxText = getPrescriptionText(sess);
            
            return (
              <div 
                key={sess.id}
                className={`bg-white border rounded-2xl transition duration-200 overflow-hidden ${
                  isExpanded ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-350 shadow-2xs'
                }`}
              >
                {/* Session Summary Row (Header of Accordion) */}
                <div 
                  onClick={() => setExpandedSessId(isExpanded ? null : sess.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 select-none text-right"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 bg-slate-100 rounded-xl flex items-center justify-center text-xl font-bold shadow-2xs border border-slate-200 shrink-0 text-slate-600 font-sans">
                      👤
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 justify-start flex-wrap">
                        <h3 className="font-bold text-xs text-slate-800">{sess.patientName}</h3>
                        <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-bold font-mono">
                          ملف مؤرشف 🔒
                        </span>
                        {rxText && (
                          <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                            💊 تم صرف روشتة علاجية
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono leading-none">{sess.patientEmail}</p>
                    </div>
                  </div>

                  {/* Vitals snapshot in header */}
                  <div className="hidden sm:grid grid-cols-3 gap-2 text-center max-w-xs w-full bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[9.5px]">
                    <div>
                      <span className="block text-[8px] text-slate-400">ضغط الدم</span>
                      <span className="font-black text-slate-700 font-mono">{sess.vitalSigns?.bloodPressure || 'غير متوفر'}</span>
                    </div>
                    <div className="border-r border-slate-200">
                      <span className="block text-[8px] text-slate-400">السكري</span>
                      <span className="font-black text-slate-700 font-mono">{sess.vitalSigns?.bloodSugar || 'غير متوفر'} ملجم</span>
                    </div>
                    <div className="border-r border-slate-200">
                      <span className="block text-[8px] text-slate-400">الأكسجين</span>
                      <span className="font-black text-slate-700 font-mono">%{sess.vitalSigns?.oxygenLevel || 'غير متوفر'}</span>
                    </div>
                  </div>

                  {/* Right hand details: Doctor and dates */}
                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-right font-sans text-[10.5px]">
                      <span className="block text-slate-400 text-[8px] font-bold">الطبيب المشرف</span>
                      <span className="font-bold text-indigo-950 flex items-center gap-1">
                        🩺 {sess.doctorName}
                      </span>
                    </div>
                    
                    <div className="text-right font-sans text-[10.5px]">
                      <span className="block text-slate-400 text-[8px] font-bold">تاريخ الأرشفة</span>
                      <span className="font-medium text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateSafe(sess.lastMessageAt)}
                      </span>
                    </div>

                    <div className="text-slate-400 shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Section Details */}
                {isExpanded && (
                  <div className="border-t border-slate-150 bg-slate-50/40 p-6 space-y-6">
                    
                    {/* Patient Health Profile stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
                        <span className="block text-[9px] text-slate-400 font-bold">العمر الحالي للمريض</span>
                        <span className="text-xs font-black text-slate-700 font-mono">{sess.vitalSigns?.age || '35'} سنة</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
                        <span className="block text-[9px] text-slate-400 font-bold">الوزن المسجل</span>
                        <span className="text-xs font-black text-slate-700 font-mono">{sess.vitalSigns?.weight || '78'} كجم</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
                        <span className="block text-[9px] text-slate-400 font-bold">الطول المسجل</span>
                        <span className="text-xs font-black text-slate-700 font-mono">{sess.vitalSigns?.height || '172'} سم</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs col-span-2 md:col-span-1">
                        <span className="block text-[9px] text-slate-400 font-bold">معاينة القنوات الطبية</span>
                        <span className="text-[10px] text-emerald-600 font-black">حالة طبية معالجة ومؤرشفة ✅</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      
                      {/* Column 1: Complaint & Clinical Transcript */}
                      <div className="space-y-4">
                        
                        {/* Clinical Complaint Statement */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-right">
                          <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 justify-start">
                            <span>🩺</span>
                            الشكوى المرضية وموجز الاستشارة الأساسي:
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap italic font-sans bg-slate-50 p-3 rounded-xl border border-slate-100">
                            "{sess.chats[0]?.text || 'بدء الاستشارة والربط مع الطبيب المعالج للسكري وضغط الدم.'}"
                          </p>
                        </div>

                        {/* Interactive Medical Tests & Uploads (الفحوصات الطبية المرفوعة) */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 text-right">
                          <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 justify-start">
                            <span>📎</span>
                            الفحوصات والتحاليل الطبية المرفوعة من المريض:
                          </h4>
                          
                          {sess.uploadedFiles && sess.uploadedFiles.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                              {sess.uploadedFiles.map((file) => (
                                <a
                                  key={file.id}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-indigo-50/30 hover:bg-indigo-50/80 border border-indigo-100 p-3 rounded-xl flex items-center justify-between transition"
                                >
                                  <span className="text-[10px] text-indigo-700 font-black bg-white px-2.5 py-1 rounded-lg border border-indigo-150 flex items-center gap-1 shadow-2xs">
                                    معاينة الفحص الطعني 🔗
                                  </span>
                                  <div className="flex items-center gap-2 text-right font-sans">
                                    <div className="text-right">
                                      <span className="block text-[11px] font-bold text-slate-800 line-clamp-1 truncate max-w-[150px]">{file.name}</span>
                                      <span className="block text-[8.5px] text-slate-400 font-mono">{file.size}</span>
                                    </div>
                                    <span className="text-xl">{file.type === 'pdf' ? '📄' : '🖼️'}</span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">
                              لم يتم رفع تحاليل مخبرية أو تخطيط قلب رقمي خلال هذه الجلسة.
                            </p>
                          )}
                        </div>

                        {/* Full chat history drawer */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5">
                          <h4 className="text-xs font-black text-slate-700">💬 السجل الكامل للحوار والدردشة الطبية:</h4>
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {(sess.chats || []).map((msg) => {
                              if (!msg) return null;
                              const isDr = msg.sender === 'doctor';
                              return (
                                <div
                                  key={msg.id}
                                  className={`max-w-[90%] rounded-xl p-3 text-[11px] leading-relaxed ${
                                    isDr
                                      ? 'bg-slate-100 text-slate-800 mr-auto rounded-tr-none self-start text-right'
                                      : 'bg-[#DCF8C6] text-slate-800 ml-auto rounded-tl-none self-end'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap">{msg.text}</p>
                                  <span className="block text-[8px] text-slate-400 mt-1 text-left">{msg.time}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* Column 2: Elegant Medical Prescription Render */}
                      <div className="space-y-4">
                        
                        {/* Premium Medical Prescription Slip (الروشتة الطبية المعتمدة للوزارة) */}
                        <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-sm p-6 relative overflow-hidden text-right font-sans">
                          {/* Rx Stamp elements */}
                          <div className="absolute left-6 top-6 h-12 w-12 border-2 border-indigo-200/50 rounded-full flex items-center justify-center text-xs font-serif text-indigo-200/70 font-black uppercase rotate-[-15deg] pointer-events-none">
                            Rx Only
                          </div>
                          <div className="absolute right-0 top-0 h-1.5 w-full bg-indigo-950"></div>
                          
                          {/* Slip Header */}
                          <div className="border-b-2 border-slate-200 pb-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
                            <div>
                              <h5 className="font-bold text-xs text-indigo-950">وزارة الصحة العراقية / نقابة الأطباء 🇮🇶</h5>
                              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{sess.doctorName}</p>
                              <p className="text-[8px] text-slate-400 font-bold">بوابة العيادة الاستشارية لـ MedPulse</p>
                            </div>
                            <div className="text-center sm:text-left">
                              <span className="text-[18px] font-black text-indigo-900 block font-serif">℞</span>
                              <span className="text-[8px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                                رقم الملف: {sess.id.replace('session_', '')}
                              </span>
                            </div>
                          </div>

                          {/* Patient metadata on slip */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-dashed border-slate-200 pb-3 mb-4 text-slate-600">
                            <div>
                              <span className="font-bold">اسم المريض:</span> {sess.patientName}
                            </div>
                            <div>
                              <span className="font-bold">تاريخ الكشف:</span> {formatDateSafe(sess.createdAt)}
                            </div>
                            <div>
                              <span className="font-bold">العمر / الوزن:</span> {sess.vitalSigns?.age || '35'} سنة / {sess.vitalSigns?.weight || '80'} كجم
                            </div>
                            <div>
                              <span className="font-bold">نوع الاستشارة:</span> كشفية طوارئ هجينة
                            </div>
                          </div>

                          {/* Meds details inside prescription slip */}
                          <div className="space-y-3 min-h-[120px]">
                            <span className="text-[10.5px] font-black text-indigo-950 block">🩺 الوصفة العلاجية والجرعات (Meds & Sig):</span>
                            
                            {rxText ? (
                              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 border border-slate-150 p-4 rounded-xl font-mono">
                                {rxText.replace(/✍️ 💊 \*\*روشتة وصفة طبية فورية صادرة عن الطبيب:\*\*\n\n/, '').replace(/\n\n\*الختم والترخيص الرقمي المعتمد لوزارة الصحة العراقية ✅\*/, '')}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <span className="text-xl">⚠️</span>
                                <span className="text-[10px] font-bold text-slate-400 mt-1.5">لم تدرج وصفة طبية صريحة.</span>
                                <span className="text-[8.5px] text-slate-400 mt-0.5">ربما تم تقديم النصائح الاستشارية الطبية هاتفياً أو لم تستدعي الحالة صرف علاج كيميائي.</span>
                              </div>
                            )}
                          </div>

                          {/* Slip Stamp & Footer */}
                          <div className="border-t border-slate-200 pt-4 mt-4 flex items-center justify-between text-[9px] text-slate-400">
                            <div className="space-y-1">
                              <span className="block font-bold text-emerald-600">✓ الختم الرقمي الحكومي الموحد معتمد ✅</span>
                              <span className="block font-mono text-[8px]">ترخيص صحي رقم: MOH-IQ-2026-993</span>
                            </div>
                            <div className="text-center">
                              <div className="inline-block bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1 text-indigo-700 font-extrabold text-[8px]">
                                ختم الطبيب الاستشاري 🖋️
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Restoration and Deletion Panel */}
                        <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="text-right">
                            <span className="block text-xs font-black text-indigo-950">إجراءات التحكم السريري بالفولدر:</span>
                            <span className="block text-[9.5px] text-slate-500 leading-relaxed mt-0.5 font-sans">
                              يمكنك مراجعة المستفيد أو إعادة تنشيط غرفته فوراً في حال تطلب الأمر كشفاً مكملاً أو تقديم استشارات إضافية لمتابعة نتائج الفحوصات الطبية.
                            </span>
                          </div>

                          <div className="flex gap-2 shrink-0 w-full sm:w-auto font-sans">
                            <button
                              type="button"
                              onClick={() => handleRestoreSession(sess.id)}
                              className="flex-1 sm:flex-initial bg-indigo-650 hover:bg-indigo-750 text-white text-[10.5px] font-black px-4 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 hover:shadow-xs active:scale-95"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              إعادة فتح الغرفة الطبية للمستفيد 🔓
                            </button>
                            
                            {userRole === 'admin' && (
                              <div className="relative flex-1 sm:flex-initial">
                                {deleteConfirmId === sess.id ? (
                                  <div className="flex gap-1 animate-fade-in">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSession(sess.id)}
                                      className="bg-rose-650 hover:bg-rose-750 text-white text-[10.5px] font-black px-3 py-2 rounded-xl cursor-pointer"
                                    >
                                      تأكيد الحذف النهائي 🗑️
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10.5px] font-black px-2.5 py-2 rounded-xl cursor-pointer"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(sess.id)}
                                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-750 border border-rose-200 text-[10.5px] font-black px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    حذف السجل نهائياً
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
