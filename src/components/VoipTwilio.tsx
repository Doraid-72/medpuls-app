import React, { useState, useEffect } from 'react';
import { TwilioConfig, UserHealthProfile, DoctorInfo } from '../types';
import { Phone, Settings, Activity, ShieldCheck, Mail, Volume2, ToggleLeft, ToggleRight, Mic, Play, Square, Loader2, MessageSquare, Clock, Plus, ExternalLink, BookmarkCheck, PhoneCall, Video, Wifi, X, UploadCloud, FileText, Paperclip, Trash2 } from 'lucide-react';
import DoctorClinicalWorkspace from './DoctorClinicalWorkspace';

export const MEDIATOR_WHATSAPP_PHONE = "+9647754321000"; // رقم وساطة المنصة الموحد لفلترة الاستشارات وحماية غطاء خصوصية الأطباء

export function getDoctorDutyStatus(doc: DoctorInfo) {
  if (!doc.availabilityType || doc.availabilityType === '24/7') {
    return { isOnDuty: true, text: 'متاح الآن 24/7 ✅', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  }
  const daysInArabic = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const now = new Date();
  const currentDayName = daysInArabic[now.getDay()];
  const workingDays = doc.workingDays || [];
  
  const isWorkingDay = workingDays.includes(currentDayName);
  if (!isWorkingDay) {
    const daysStr = workingDays.join('، ');
    return { 
      isOnDuty: false, 
      text: `خارج أوقات العمل (أيام الدوام: ${daysStr || 'لا يوجد'}) 🕒`, 
      badgeColor: 'bg-slate-100 text-slate-500 border-slate-200' 
    };
  }

  const startTime = doc.startTime || '16:00';
  const endTime = doc.endTime || '21:00';
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  const currentH = now.getHours();
  const currentM = now.getMinutes();
  const currentTotal = currentH * 60 + currentM;
  const startTotal = startH * 60 + (startM || 0);
  const endTotal = endH * 60 + (endM || 0);

  let onDuty = false;
  if (startTotal <= endTotal) {
    onDuty = currentTotal >= startTotal && currentTotal <= endTotal;
  } else {
    onDuty = currentTotal >= startTotal || currentTotal <= endTotal;
  }

  if (onDuty) {
    return { 
      isOnDuty: true, 
      text: `متاح الآن (مناوبة: ${startTime} - ${endTime}) ✅`, 
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-250' 
    };
  } else {
    return { 
      isOnDuty: false, 
      text: `خارج ساعات الدوام (الدوام اليوم: ${startTime} - ${endTime}) 🕒`, 
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-250' 
    };
  }
}

export interface BookingSlot {
  dateKey: string;       // YYYY-MM-DD
  dayName: string;       // Arabic Day Name (e.g., "الخميس")
  formattedDate: string; // Beautiful Arabic date
  queueNumber: number;   // 1 to doc.maxPatientsPerDay
  isPostponed?: boolean;
  postponeReason?: string;
  postponedUntil?: string;
  newAppointmentDate?: string;
}

export function formatTimeArabic(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const [hStr, mStr] = timeStr.split(':');
    const h = Number(hStr);
    const m = Number(mStr) || 0;
    const period = h >= 12 ? 'مساءً' : 'صباحاً';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    const mFormatted = m > 0 ? `:${m < 10 ? '0' + m : m}` : '';
    return `${h12}${mFormatted} ${period}`;
  } catch (e) {
    return timeStr;
  }
}

export function getNextAvailableBookingSlot(
  doc: DoctorInfo, 
  allSessions: MedicalSession[]
): BookingSlot {
  let workingDays = doc.workingDays || [];
  if (workingDays.length === 0) {
    workingDays = ["الخميس", "الجمعة"];
  }

  const maxPatients = doc.maxPatientsPerDay || 4;

  const numToArabicDay = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  let bookingsRegistry: Array<{ patientEmail: string, dateKey: string, queueNumber: number }> = [];
  try {
    const raw = localStorage.getItem(`medpulse_bookings_registry_${doc.id}`);
    if (raw) {
      bookingsRegistry = JSON.parse(raw);
    }
  } catch (e) {}

  // Check if doctor has active postponements
  let postponedUntil: string | null = null;
  let postponeReason: string | null = null;
  let newAppointmentDate: string | null = null;
  try {
    const stored = localStorage.getItem('medpulse_doctor_postponements');
    if (stored) {
      const postponements = JSON.parse(stored);
      if (postponements[doc.id]) {
        postponedUntil = postponements[doc.id].postponedUntil;
        postponeReason = postponements[doc.id].reason;
        newAppointmentDate = postponements[doc.id].newAppointmentDate;
      }
    }
  } catch (e) {}

  const today = new Date();
  
  for (let i = 0; i < 90; i++) {
    const candidateDate = new Date(today);
    candidateDate.setDate(today.getDate() + i);

    const dayNum = candidateDate.getDay();
    const dayName = numToArabicDay[dayNum];

    if (workingDays.includes(dayName)) {
      const dateKey = candidateDate.toISOString().split('T')[0];
      
      // Skip date if it is within postponed period
      if (postponedUntil && dateKey <= postponedUntil) {
        continue;
      }

      const dayBookings = bookingsRegistry.filter(b => b.dateKey === dateKey);
      if (dayBookings.length < maxPatients) {
        const queueNumber = dayBookings.length + 1;
        const formattedDate = candidateDate.toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        return {
          dateKey,
          dayName,
          formattedDate,
          queueNumber,
          isPostponed: postponedUntil ? true : false,
          postponeReason: postponeReason || undefined,
          postponedUntil: postponedUntil || undefined,
          newAppointmentDate: newAppointmentDate || undefined
        };
      }
    }
  }

  return {
    dateKey: today.toISOString().split('T')[0],
    dayName: workingDays[0] || 'الخميس',
    formattedDate: today.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
    queueNumber: 1,
    isPostponed: postponedUntil ? true : false,
    postponeReason: postponeReason || undefined,
    postponedUntil: postponedUntil || undefined,
    newAppointmentDate: newAppointmentDate || undefined
  };
}

export function getAvailableAlternativeDoctors(
  currentDocId: string,
  allDoctors: DoctorInfo[],
  allSessions: MedicalSession[]
): Array<{ doctor: DoctorInfo; nextSlot: BookingSlot }> {
  let postponements: Record<string, any> = {};
  try {
    const stored = localStorage.getItem('medpulse_doctor_postponements');
    if (stored) postponements = JSON.parse(stored);
  } catch (e) {}

  return allDoctors
    .filter(doc => doc.id !== currentDocId)
    .map(doc => {
      const nextSlot = getNextAvailableBookingSlot(doc, allSessions);
      return { doctor: doc, nextSlot };
    })
    .filter(item => {
      // Prioritize doctors that are NOT postponed or if postponed, they have upcoming slots
      const post = postponements[item.doctor.id];
      // Filter out if they don't have working days or their slot queue numbers exceeded
      if (!item.doctor.workingDays || item.doctor.workingDays.length === 0) return false;
      return true;
    });
}

interface VoipTwilioProps {
  profile: UserHealthProfile;
  doctors?: DoctorInfo[];
  onWriteRxForPatient?: (email: string) => void;
  sessions?: MedicalSession[];
  onUpdateSession?: (session: MedicalSession) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf';
  size: string;
  uploadedAt: string;
}

export interface MedicalSession {
  id: string;
  patientEmail: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  status: 'new' | 'open' | 'closed'; // 'new' (amber pulsating border), 'open' (green border), 'closed' (locked for patient)
  createdAt: string;
  lastMessageAt: string;
  lastMessageText: string;
  vitalSigns: {
    age: string;
    weight: string;
    height: string;
    bloodPressure: string;
    bloodSugar: string;
    oxygenLevel: string;
  };
  hasFreeReviewActive: boolean;
  uploadedFiles: UploadedFile[];
  chats: { id: string; sender: 'patient' | 'doctor'; text: string; time: string }[];
}

export default function VoipTwilio({ profile, doctors = [], onWriteRxForPatient, sessions: propsSessions, onUpdateSession }: VoipTwilioProps) {
  // Load current booking for this doctor if any
  const getActiveBooking = (): { dateKey: string; dayName: string; formattedDate: string; queueNumber: number; isPostponed?: boolean; postponeReason?: string } | null => {
    if (!selectedWhatsAppDoc) return null;
    try {
      const raw = localStorage.getItem(`medpulse_bookings_registry_${selectedWhatsAppDoc.id}`);
      if (raw) {
        const registry = JSON.parse(raw);
        const booking = registry.find((b: any) => b.patientEmail === profile.email);
        if (booking) {
          const numToArabicDay = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

          // Check if there is an active postponement for this doctor
          const docPostponement = postponements[selectedWhatsAppDoc.id];
          if (docPostponement) {
            return {
              dateKey: booking.dateKey,
              dayName: "مؤجل",
              formattedDate: docPostponement.newAppointmentDate,
              queueNumber: booking.queueNumber,
              isPostponed: true,
              postponeReason: docPostponement.reason
            };
          }

          const dateObj = new Date(booking.dateKey);
          const dayName = numToArabicDay[dateObj.getDay()];
          const formattedDate = dateObj.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          return {
            dateKey: booking.dateKey,
            dayName,
            formattedDate,
            queueNumber: booking.queueNumber
          };
        }
      }
    } catch (e) {}
    return null;
  };

  // Cloud file upload simulator states
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // User simulation role for demonstration and prototyping in sandbox
  const [simulationRole, setSimulationRole] = useState<'patient' | 'doctor'>(() => {
    return (profile.role === 'doctor' || profile.role === 'admin') ? 'doctor' : 'patient';
  });

  // Track simulated doctor and selected session for doctor's perspective
  const [simulatedDocId, setSimulatedDocId] = useState<string>(() => {
    return doctors.length > 0 ? doctors[0].id : 'dr_1';
  });

  // Persistent Clinical Medical Sessions State
  const [sessions, setSessions] = useState<MedicalSession[]>(() => {
    try {
      const stored = localStorage.getItem('medpulse_clinical_sessions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    // Highly realistic high-fidelity default sessions for demonstration
    return [
      {
        id: "session_jaber_dr_1",
        patientEmail: "jaber@gmail.com",
        patientName: "جابر الموسوي",
        doctorId: "dr_1", // د. أحمد الخفاجي
        doctorName: "د. أحمد الخفاجي",
        status: 'new',
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        lastMessageAt: new Date(Date.now() - 600000).toISOString(),
        lastMessageText: "السلام عليكم يا دكتور، قست السكر الصباحي اليوم وكان ٢٤٠ صائم وأشعر بجفاف حاد في الفم وعطش مستمر. هل أرفع جرعة الجلوكوفاج أو الأنسولين؟",
        vitalSigns: {
          age: "48",
          weight: "92",
          height: "172",
          bloodPressure: "135/85",
          bloodSugar: "240",
          oxygenLevel: "96"
        },
        hasFreeReviewActive: false,
        uploadedFiles: [],
        chats: [
          { id: '1', sender: 'patient', text: 'السلام عليكم يا دكتور، قست السكر الصباحي اليوم وكان ٢٤٠ صائم وأشعر بجفاف حاد في الفم وعطش مستمر. هل أرفع جرعة الجلوكوفاج أو الأنسولين؟', time: 'منذ ١٠ دقائق' }
        ]
      },
      {
        id: "session_rania_dr_1",
        patientEmail: "rania@outlook.com",
        patientName: "أ.د. رانيا سلام",
        doctorId: "dr_1", // د. أحمد الخفاجي
        doctorName: "د. أحمد الخفاجي",
        status: 'open',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
        lastMessageText: "دكتور، أرفقت لك ملف نتائج تحليل وظائف الغدة الدرقية وهرمون الـ TSH كما طلبت مني في المراجعة السابقة لمراجعتها.",
        vitalSigns: {
          age: "36",
          weight: "68",
          height: "165",
          bloodPressure: "122/78",
          bloodSugar: "105",
          oxygenLevel: "99"
        },
        hasFreeReviewActive: true,
        uploadedFiles: [
          {
            id: "rec_9182",
            name: "تحليل وظائف الغدة الدرقية TSH.pdf",
            url: "https://cdn.medpulse.health/secure-records/rania_tsh_report.pdf",
            type: "pdf",
            size: "1.2 MB",
            uploadedAt: "منذ ساعتين"
          }
        ],
        chats: [
          { id: '1', sender: 'doctor', text: 'أهلاً بكِ دكتورة رانيا، يرجى تزويدي بنتائج تحليل هرمون الغدة الدرقية ومستويات الـ TSH لنحدد الجرعة الجديدة من التيروكسين.', time: 'أمس ٠٩:٠٠ ص' },
          { id: '2', sender: 'patient', text: 'دكتور، أرفقت لك ملف نتائج تحليل وظائف الغدة الدرقية وهرمون الـ TSH كما طلبت مني في المراجعة السابقة لمراجعتها.', time: 'منذ ساعتين' }
        ]
      },
      {
        id: "session_wadah_dr_1",
        patientEmail: "wadah@yahoo.com",
        patientName: "وضاح كريم المياحي",
        doctorId: "dr_1", // د. أحمد الخفاجي
        doctorName: "د. أحمد الخفاجي",
        status: 'new',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        lastMessageAt: new Date(Date.now() - 1500000).toISOString(),
        lastMessageText: "مساء الخير دكتور. أشعر بثقل مفاجئ في مؤخرة الرأس مع ضبابية في الرؤية وصداع نابض. قست الضغط قبل قليل ووجدته ١٦٨ على ١٠٢. هل هذه حالة طارئة؟",
        vitalSigns: {
          age: "55",
          weight: "85",
          height: "178",
          bloodPressure: "168/102",
          bloodSugar: "135",
          oxygenLevel: "97"
        },
        hasFreeReviewActive: false,
        uploadedFiles: [],
        chats: [
          { id: '1', sender: 'patient', text: 'مساء الخير دكتور. أشعر بثقل مفاجئ في مؤخرة الرأس مع ضبابية في الرؤية وصداع نابض. قست الضغط قبل قليل ووجدته ١٦٨ على ١٠٢. هل هذه حالة طارئة؟', time: 'منذ ٢٥ دقيقة' }
        ]
      },
      {
        id: "session_zainab_dr_2",
        patientEmail: "zainab@gmail.com",
        patientName: "زينب الكعبي",
        doctorId: "dr_2", // د. سارة التميمي
        doctorName: "د. سارة التميمي",
        status: 'open',
        createdAt: new Date(Date.now() - 432000000).toISOString(),
        lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
        lastMessageText: "شكراً لكِ يا دكتورة، سألتزم بنصائح تقليل ملح الطعام ومراقبة الوزن يومياً ونلتقي في المراجعة القادمة.",
        vitalSigns: {
          age: "29",
          weight: "74",
          height: "160",
          bloodPressure: "130/82",
          bloodSugar: "150",
          oxygenLevel: "98"
        },
        hasFreeReviewActive: false,
        uploadedFiles: [],
        chats: [
          { id: '1', sender: 'doctor', text: 'وعليكم السلام يا زينب، قياسات ضغط الدم لديكِ اليوم مستقرة نسبياً، يرجى تخفيف كميات ملح الطعام لضمان ثبات القراءات.', time: 'أمس ٠١:٢٠ م' },
          { id: '2', sender: 'patient', text: 'شكراً لكِ يا دكتورة، سألتزم بنصائح تقليل ملح الطعام ومراقبة الوزن يومياً ونلتقي في المراجعة القادمة.', time: 'أمس ٠٥:٤٠ م' }
        ]
      }
    ];
  });

  const saveSessions = (updatedSessions: MedicalSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem('medpulse_clinical_sessions', JSON.stringify(updatedSessions));
    } catch (e) {}

    if (onUpdateSession) {
      // Find the modified or newly added session
      const changed = updatedSessions.find(s => {
        const prev = sessions.find(p => p.id === s.id);
        return !prev || JSON.stringify(prev) !== JSON.stringify(s);
      });
      if (changed) {
        onUpdateSession(changed);
      }
    }
  };

  useEffect(() => {
    if (propsSessions && propsSessions.length > 0) {
      setSessions(propsSessions);
    }
  }, [propsSessions]);

  // Selected session ID in doctor simulation mode
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(() => {
    const docSess = (sessions || []).filter(s => s && s.doctorId === simulatedDocId);
    return docSess.length > 0 ? docSess[0].id : null;
  });

  // Track paid doctors individually
  const [paidDocIds, setPaidDocIds] = useState<string[]>(() => {
    try {
      const email = profile?.email;
      if (!email) return [];
      const stored = localStorage.getItem(`medpulse_paid_doc_ids_${email}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Track doctors who requested lab reviews and enabled free review bypass
  const [freeReviewDocIds, setFreeReviewDocIds] = useState<string[]>(() => {
    try {
      const email = profile?.email;
      if (!email) return [];
      const doctorsList = doctors || [];
      return doctorsList
        .filter(doc => doc && localStorage.getItem(`medpulse_free_review_${email}_${doc.id}`) === 'true')
        .map(doc => doc.id);
    } catch (e) {}
    return [];
  });

  const checkIsDocUnlocked = (doc: DoctorInfo | null): boolean => {
    if (!doc) return false;
    if (profile.role !== 'patient') return true; // bypass for admins/doctors
    if (simulationRole === 'doctor') return true; // allow doctor perspective to see active chat
    if (doc.isPaid === false) return true; // voluntary doctor is always free!

    // Find if patient has an active (non-closed) session with this doctor
    const sess = sessions.find(s => s.patientEmail === profile.email && s.doctorId === doc.id);
    if (sess && sess.status !== 'closed') return true;
    
    // Check if free review period is active for this doctor
    const isFreeReview = localStorage.getItem(`medpulse_free_review_${profile.email}_${doc.id}`) === 'true' || freeReviewDocIds.includes(doc.id);
    if (isFreeReview) return true;

    return paidDocIds.includes(doc.id) || 
           localStorage.getItem(`medpulse_consult_paid_${profile.email}_${doc.id}`) === 'true' ||
           localStorage.getItem(`medpulse_consult_paid_${profile.email}`) === 'true';
  };

  const [isConsultationActive, setIsConsultationActive] = useState<boolean>(false);
  const [zainWalletPhone, setZainWalletPhone] = useState('');
  const [isZainPaying, setIsZainPaying] = useState(false);

  const [config, setConfig] = useState<TwilioConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callTranscript, setCallTranscript] = useState<string[]>([]);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [speechInstance, setSpeechInstance] = useState<any>(null);

  // WhatsApp Clinical Consultation simulation states
  const [selectedWhatsAppDoc, setSelectedWhatsAppDoc] = useState<DoctorInfo | null>(null);
  const [bookingStep, setBookingStep] = useState<'review' | 'payment'>('review');

  const [postponements, setPostponements] = useState<Record<string, { postponedUntil: string; reason: string; lastAppliedAt: string; newAppointmentDate: string }>>(() => {
    try {
      const stored = localStorage.getItem('medpulse_doctor_postponements');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  const savePostponements = (updated: Record<string, { postponedUntil: string; reason: string; lastAppliedAt: string; newAppointmentDate: string }>) => {
    setPostponements(updated);
    try {
      localStorage.setItem('medpulse_doctor_postponements', JSON.stringify(updated));
    } catch (e) {}
  };

  // Postponement Form inputs for simulated doctor
  const [postponeUntilDate, setPostponeUntilDate] = useState<string>('');
  const [postponeReason, setPostponeReason] = useState<string>('ظروف خاصة طارئة');
  const [postponeReturnDateText, setPostponeReturnDateText] = useState<string>('');

  useEffect(() => {
    setBookingStep('review');
  }, [selectedWhatsAppDoc?.id]);

  const [waText, setWaText] = useState('');
  const [waChats, setWaChats] = useState<Record<string, { id: string; sender: 'patient' | 'doctor'; text: string; time: string }[]>>({});
  const [isWaTyping, setIsWaTyping] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [doctorPrescriptionText, setDoctorPrescriptionText] = useState<string>('');

  // Biometric Measurement States as requested by user
  const [patientAgeStr, setPatientAgeStr] = useState<string>(String(profile?.age || 35));
  const [patientWeightStr, setPatientWeightStr] = useState<string>(String(profile?.weight || 81));
  const [patientHeightStr, setPatientHeightStr] = useState<string>(String(profile?.height || 175));
  const [bloodPressure, setBloodPressure] = useState<string>('120/80');
  const [bloodSugar, setBloodSugar] = useState<string>('125');
  const [oxygenLevel, setOxygenLevel] = useState<string>('98');

  // Synchronize biometric states with changing patient profile
  useEffect(() => {
    if (profile) {
      if (profile.age) setPatientAgeStr(String(profile.age));
      if (profile.weight) setPatientWeightStr(String(profile.weight));
      if (profile.height) setPatientHeightStr(String(profile.height));
    }
  }, [profile]);

  // Generate unified and standardized clinical message containing both textual query and biometric measurements
  const generateWhatsAppMessage = (userMsgText: string) => {
    const patientName = profile.name || "مستفيد منصة مدبلس";
    const patientEmail = profile.email || "patient@medpuls.com";
    const docName = selectedWhatsAppDoc ? selectedWhatsAppDoc.name : "الطبيب المناوب";
    const docSpecialty = selectedWhatsAppDoc ? selectedWhatsAppDoc.specialty : "التخصص";
    const isPaid = selectedWhatsAppDoc ? selectedWhatsAppDoc.isPaid !== false : false;

    let filesSection = "";
    if (uploadedFiles && uploadedFiles.length > 0) {
      filesSection = `\n\n📎 وثائق ومخططات طبية مرفقة سحابياً (آمنة وبدون حمل على الخادم):\n` +
        uploadedFiles.map(f => `- [${f.type === 'pdf' ? 'ملف PDF' : 'صورة فحص'}] ${f.name} (${f.size}):\n  معاينة سحابية 🔗: ${f.url}`).join('\n');
    }

    return `مرحباً دكتور ${docName}، أنا مستفيد من تطبيق MedPulse للرعاية الصحية الذكية. أود مشاركتكم استشارتي الطبية المسجلة بالمنصة للسكري/الضغط والوزن للتنسيق والمتابعة.
185: 
186: -----------------------------------------
187: 👤 البيانات الشخصية للمريض:
188: - الاسم: ${patientName}
189: - البريد الإلكتروني: ${patientEmail}
190: - كود الرسوم: ${isPaid ? `مدفوعة بالكامل وموثقة عبر زين كاش (${(selectedWhatsAppDoc?.consultationFee || 20000).toLocaleString()} د.ع) ✅` : "استشارة طبية تطوعية مجانية بالكامل 💚"}
191: 
192: 📊 المؤشرات الطبية المقاسة والقياسات الحيوية الحالية:
193: - العمر: ${patientAgeStr} سنة
194: - الوزن الحالي: ${patientWeightStr} كجم
195: - الطول: ${patientHeightStr} سم
196: - قياس ضغط الدم: ${bloodPressure} ملم زئبقي
197: - مستوى السكر بالدم: ${bloodSugar} ملجم/ديسيلتر
198: - نسبة الأكسجين (O2): %${oxygenLevel}${filesSection}
199: 
200: -----------------------------------------
201: 📝 نص رسالة الاستفسار المكتوب:
202: "${userMsgText}"
203: 
204: -----------------------------------------
205: 🔗 لكتابة الروشتة/الوصفة الطبية الإلكترونية الموقعة رقمياً فوراً بالمنصة:
206: ${window.location.origin}/?rxEmail=${encodeURIComponent(patientEmail)}`;
  };

  // Auto-sync consultation activation state when doctor selection or payment list changes
  useEffect(() => {
    if (selectedWhatsAppDoc) {
      setIsConsultationActive(checkIsDocUnlocked(selectedWhatsAppDoc));
      
      // Auto-populate waChats for the selected doctor from their medical session chats
      const sessId = `session_${profile.email.replace(/[@.]/g, '_')}_${selectedWhatsAppDoc.id}`;
      const sess = sessions.find(s => s.id === sessId);
      if (sess) {
        setWaChats(prev => ({
          ...prev,
          [selectedWhatsAppDoc.id]: sess.chats
        }));
      }
    } else {
      setIsConsultationActive(false);
    }
  }, [selectedWhatsAppDoc, paidDocIds, freeReviewDocIds, sessions, profile.email]);

  // Virtual WhatsApp Voice/Video Call simulator states
  const [waCallState, setWaCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [waCallType, setWaCallType] = useState<'voice' | 'video'>('voice');
  const [waCallSeconds, setWaCallSeconds] = useState(0);
  const [waCallAudioLevel, setWaCallAudioLevel] = useState(0);
  const [waCallStatusMsg, setWaCallStatusMsg] = useState('');
  const [waCallTranscripts, setWaCallTranscripts] = useState<string[]>([]);
  const [waBotSpeechInstance, setWaBotSpeechInstance] = useState<any>(null);

  // Timer & Audio simulator for WhatsApp Call
  useEffect(() => {
    let timer: any;
    if (waCallState === 'connected') {
      timer = setInterval(() => {
        setWaCallSeconds(prev => prev + 1);
        setWaCallAudioLevel(Math.floor(Math.random() * 80) + 20);
      }, 1000);
    } else {
      setWaCallSeconds(0);
      setWaCallAudioLevel(0);
    }
    return () => clearInterval(timer);
  }, [waCallState]);

  // Handle Starting Virtual WhatsApp Call
  const startVirtualWhatsAppCall = (type: 'voice' | 'video') => {
    if (!selectedWhatsAppDoc) return;
    setWaCallType(type);
    setWaCallState('calling');
    setWaCallStatusMsg(`جاري حظر الاتفاق السريري وتشفير شبكة الاتصال وتمرير الصوت لـ ${selectedWhatsAppDoc.name}...`);
    setWaCallTranscripts([]);

    // Step 1: Connecting (2 seconds)
    setTimeout(() => {
      setWaCallState('connected');
      setWaCallStatusMsg('متصل الآن (اتصال واتساب مشفر من طرف إلى طرف)');
      
      const clinicalScripts = [
        `مرحباً بك يا صديقي المستفيد، أنا الدكتور ${selectedWhatsAppDoc.name}. كيف تشعر اليوم بخصوص مستويات الضغط والسكري؟`,
        "ممتاز جداً، قمت بمراجعة القياسات الحيوية الأخيرة بملفك الطبي وبدت مستقرة نسبياً.",
        "أنصحك بالاستمرار بنظام الحمية الذكي وتحميل النتائج أولاً بأول لتجنب أي طارئ. أنا هنا لمتابعتك دائماً."
      ];

      // Simulate doctor speech transcript arriving over voice
      clinicalScripts.forEach((line, idx) => {
        setTimeout(() => {
          if (waCallState !== 'ended') {
            setWaCallTranscripts(prev => [...prev, `🩺 ${selectedWhatsAppDoc.name}: ${line}`]);
            // Optional local text to speech
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(line);
              utterance.lang = 'ar-SA';
              window.speechSynthesis.speak(utterance);
            }
          }
        }, (idx + 1) * 4000);
      });

    }, 2500);
  };

  // Handle Ending Virtual WhatsApp Call
  const endVirtualWhatsAppCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setWaCallState('ended');
    setWaCallStatusMsg('تم إنهاء المكالمة الطبية بنجاح');
    setTimeout(() => {
      setWaCallState('idle');
    }, 2000);
  };

  // Zain Cash Payment Simulator to unlock paid consultation rooms
  const handlePayWithZainCash = (docId: string) => {
    if (!zainWalletPhone.trim()) return;
    setIsZainPaying(true);
    setTimeout(() => {
      setIsZainPaying(false);
      const targetDoc = doctors.find(d => d.id === docId) || selectedWhatsAppDoc;
      if (targetDoc) {
        handleStartNewSession(targetDoc);
      }
    }, 1200);
  };

  // Handle Doctor Postponement of Sessions
  const handlePostponeDoctorSessions = () => {
    if (!postponeUntilDate || !postponeReturnDateText.trim()) {
      alert("الرجاء تحديد تاريخ نهاية التأجيل وكتابة موعد العودة الجديد بدقة (مثال: الأحد القادم 5 يوليو).");
      return;
    }

    const doc = doctors.find(d => d.id === simulatedDocId);
    if (!doc) return;

    const updatedPostponements = {
      ...postponements,
      [simulatedDocId]: {
        postponedUntil: postponeUntilDate,
        reason: postponeReason,
        lastAppliedAt: new Date().toISOString(),
        newAppointmentDate: postponeReturnDateText
      }
    };
    savePostponements(updatedPostponements);

    // Now look for any active sessions with this doctor to send the Secretary Notification
    const updatedSessions = sessions.map(sess => {
      if (sess.doctorId === simulatedDocId && sess.status !== 'closed') {
        // Prepare the Automated Secretary postponement notification message
        const secMsgText = `🤖 **تنبيه تأجيل الحجز من السكرتارية الرقمية للعيادة:**

عزيزي المستفيد الكريم، نود إعلامكم بأنه قد تم **تأجيل موعد جلستكم مع الدكتور ${doc.name}** لأسباب طارئة خاصة بالطبيب (${postponeReason}).

📅 **تحديث الموعد الجديد المعتمد لك:**
* ${postponeReturnDateText}

يرجى الاستعداد والتواجد بالمنصة في هذا التوقيت. نشكر تفهمكم البالغ ونتمنى لكم موفور الصحة! 👍`;

        const newMsg = {
          id: String(Date.now() + Math.random()),
          sender: 'doctor' as const,
          text: secMsgText,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        };

        return {
          ...sess,
          lastMessageAt: new Date().toISOString(),
          lastMessageText: `تم تأجيل الجلسة من قبل العيادة إلى: ${postponeReturnDateText} 🔄`,
          chats: [...sess.chats, newMsg]
        };
      }
      return sess;
    });

    saveSessions(updatedSessions);
    alert(`تم تأجيل كافة جلسات الدكتور ${doc.name} بنجاح، وقام السكرتير الرقمي بإرسال إشعارات التعديل والمواعيد الجديدة إلى حسابات كافة المرضى المحجوزين حالياً! 📬`);
    
    // Clear inputs
    setPostponeUntilDate('');
    setPostponeReturnDateText('');
  };

  // Handle Cancelling Doctor Postponement
  const handleCancelDoctorPostponement = (docId: string) => {
    const updatedPostponements = { ...postponements };
    delete updatedPostponements[docId];
    savePostponements(updatedPostponements);
    
    const doc = doctors.find(d => d.id === docId);
    alert(`تم إلغاء تأجيل عيادة الدكتور ${doc ? doc.name : ''} وإعادة فتح باب المواعيد والحجوزات الفورية بنجاح! 🔓`);
  };

  // Start New Consultation / Session
  const handleStartNewSession = (doc: DoctorInfo) => {
    const isPaid = doc.isPaid !== false;
    const sessionId = `session_${profile.email.replace(/[@.]/g, '_')}_${doc.id}`;
    
    // Secretary Booking Logic
    const slot = getNextAvailableBookingSlot(doc, sessions);
    try {
      const raw = localStorage.getItem(`medpulse_bookings_registry_${doc.id}`);
      const registry = raw ? JSON.parse(raw) : [];
      // Remove any existing booking for this user on this doctor to prevent duplicate rows
      const filteredRegistry = registry.filter((b: any) => b.patientEmail !== profile.email);
      filteredRegistry.push({
        patientEmail: profile.email,
        dateKey: slot.dateKey,
        queueNumber: slot.queueNumber
      });
      localStorage.setItem(`medpulse_bookings_registry_${doc.id}`, JSON.stringify(filteredRegistry));
    } catch (e) {}

    const formattedStart = formatTimeArabic(doc.startTime || '16:00');
    const formattedEnd = formatTimeArabic(doc.endTime || '21:00');
    const docDaysStr = (doc.workingDays && doc.workingDays.length > 0) ? doc.workingDays.join(' و ') : "الخميس والجمعة";

    const secretaryReplyText = `🤖 **تأكيد الحجز الفوري من السكرتير الرقمي للعيادة:**

مرحباً بك يا ${profile.name || "المستفيد"}! لقد تم سداد وتأكيد رسم استشارة الدكتور **${doc.name}** بنجاح. 💳

يرجى العلم بأن أوقات دوام الطبيب المعتمدة بالمنصة هي: **(${docDaysStr})** من كل أسبوع.

وقد قام نظام السكرتارية الآلي بتأمين وحجز موعدك المؤكد كالتالي:
📅 **اليوم والتاريخ:** ${slot.dayName}، ${slot.formattedDate}
🕒 **توقيت عيادة الطبيب:** يرجى التواجد بالمنصة والجاهزية من الساعة **${formattedStart}** وحتى الساعة **${formattedEnd}** لهذا اليوم.
🎟 *رقم حجزك المعتمد:* رقم **(${slot.queueNumber})** في قائمة مراجعي اليوم (الحد الأقصى اليومي: ${doc.maxPatientsPerDay || 4} مراجعين).

💡 *توجيهات:* نرجو البقاء متصلاً لإجراء الكشف التشخيصي مع الطبيب مباشرة، وسنقوم بإشعارك فور دخول الطبيب للمناوبة. دمتم بعافية!`;

    const secMessage = {
      id: String(Date.now() + 1),
      sender: 'doctor' as const,
      text: secretaryReplyText,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    const newSess: MedicalSession = {
      id: sessionId,
      patientEmail: profile.email,
      patientName: profile.name || "مستفيد منصة مدبلس",
      doctorId: doc.id,
      doctorName: doc.name,
      status: 'new', // starts as new, which gives amber border on doctor's dashboard!
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      lastMessageText: "تم فتح الجلسة وسداد الكشفية الطبية بنجاح وبدء المتابعة السريرية 💳",
      vitalSigns: {
        age: patientAgeStr,
        weight: patientWeightStr,
        height: patientHeightStr,
        bloodPressure: bloodPressure,
        bloodSugar: bloodSugar,
        oxygenLevel: oxygenLevel
      },
      hasFreeReviewActive: false,
      uploadedFiles: [...uploadedFiles],
      chats: [
        {
          id: String(Date.now()),
          sender: 'patient',
          text: `تم حجز جلسة استشارة جديدة وتأمين الكشفية السريرية بنجاح عبر بوابة سداد واتساب / زين كاش الرقمية 💳\n\nالعمر: ${patientAgeStr} سنة | الوزن: ${patientWeightStr} كجم | الطول: ${patientHeightStr} سم\nضغط الدم: ${bloodPressure} ملم زئبقي | السكري: ${bloodSugar} ملجم | الأكسجين: %${oxygenLevel}`,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        },
        secMessage
      ]
    };

    const updated = sessions.filter(s => s.id !== sessionId);
    saveSessions([newSess, ...updated]);
    
    // Also unlock in paid doc ids
    if (isPaid) {
      const updatedPaid = [...paidDocIds, doc.id];
      setPaidDocIds(updatedPaid);
      try {
        localStorage.setItem(`medpulse_paid_doc_ids_${profile.email}`, JSON.stringify(updatedPaid));
        localStorage.setItem(`medpulse_consult_paid_${profile.email}_${doc.id}`, 'true');
      } catch (e) {}
    }
  };

  // Select first doctor as default if loaded
  useEffect(() => {
    if (!selectedWhatsAppDoc && doctors && doctors.length > 0) {
      setSelectedWhatsAppDoc(doctors[0]);
    }
  }, [doctors, selectedWhatsAppDoc]);

  // Load config from backend on mount
  useEffect(() => {
    fetch('/api/twilio-config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error("Error loading Twilio config:", err));
  }, []);

  // Save config
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setLoading(true);
    try {
      const res = await fetch('/api/twilio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Speaks using Web Speech API as Callbot Voice Output
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA'; // Saudi Arabic locale
      utterance.rate = 0.95; // Slightly slower for clinical clarity
      utterance.onstart = () => setIsBotSpeaking(true);
      utterance.onend = () => setIsBotSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech Synthesis not supported in this browser.");
    }
  };

  // Simulates an Automated Doctor VoIP Call right inside the App
  const startSimulatedCall = () => {
    setTestStatus('calling');
    setCallTranscript(['[جاري الاتصال بـ MedPulse Callbot...]']);
    
    setTimeout(() => {
      setTestStatus('connected');
      const welcome = `مرحباً بك يا ${profile.name} في منصة مد بلس الرعاية الذكية. طبيبك الرقمي يتحدث إليك الآن. تم ربط ملفك الطبي بنجاح. سنناقش حالتك مع السكري والضغط اليوم. هل تشعر بأي أعراض جديدة اليوم؟`;
      setCallTranscript(prev => [...prev, `[البوت الطبي]: ${welcome}`]);
      speakText(welcome);
    }, 2000);
  };

  // User input simulation in voice menu
  const respondSimulatedVoice = (text: string) => {
    setCallTranscript(prev => [...prev, `[أخي المستفيد]: ${text}`]);
    const botReplies: Record<string, string> = {
      'سليم': "الحمد لله، استمر على دواء جلوكوفاج بانتظام وننصح بالالتزام برياضة المشي لمدة ثلاثين دقيقة.",
      'تعب': "سلامتك يا صديقي، سنشير للطبيب فوراً وسنرسل إشعاراً عاجلاً إلى صيدلية النهدي لإعداد وتجهيز دواءك البديل.",
      'سعرات': `وفقاً لحساباتنا الحالية، هدفك السعري اليومي يبلغ حوالي ${profile.dailyCalorieBudget} سعرة للحفاظ على وزن صحي وخفض الكوليسترول.`
    };

    const trimmed = text.trim();
    const replyText = botReplies[trimmed] || "فهمت عليك بالكامل. لقد تم تسجيل ملاحظاتك بدقة فائقة في ملفك الطبي المحمي وسنقوم بإرسالها إلى الطبيب المشرف الكترونياً فوراً.";
    
    setTimeout(() => {
      setCallTranscript(prev => [...prev, `[البوت الطبي]: ${replyText}`]);
      speakText(replyText);
    }, 1000);
  };

  // Unified WhatsApp Send handler which delegates to local session state
  const handleSendWhatsAppMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waText.trim()) return;

    const userMsgText = waText.trim();
    const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    if (simulationRole === 'patient') {
      if (!selectedWhatsAppDoc) return;
      const currentDocId = selectedWhatsAppDoc.id;
      const patientName = profile.name || "مستفيد منصة مدبلس";
      const patientEmail = profile.email || "patient@medpuls.com";

      // Securely masked proxy message payload
      const externalWhatsAppFormatted = generateWhatsAppMessage(userMsgText);

      // Create new message
      const newMsg = {
        id: String(Date.now()),
        sender: 'patient' as const,
        text: userMsgText,
        time: timeStr
      };

      // Retrieve or create current session
      const sessId = `session_${patientEmail.replace(/[@.]/g, '_')}_${currentDocId}`;
      let activeSess = sessions.find(s => s.id === sessId);

      if (!activeSess) {
        // Create auto-session if voluntary doctor
        activeSess = {
          id: sessId,
          patientEmail: patientEmail,
          patientName: patientName,
          doctorId: currentDocId,
          doctorName: selectedWhatsAppDoc.name,
          status: 'new',
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          lastMessageText: userMsgText,
          vitalSigns: {
            age: patientAgeStr,
            weight: patientWeightStr,
            height: patientHeightStr,
            bloodPressure: bloodPressure,
            bloodSugar: bloodSugar,
            oxygenLevel: oxygenLevel
          },
          hasFreeReviewActive: false,
          uploadedFiles: [...uploadedFiles],
          chats: [newMsg]
        };
      } else {
        // Update existing session
        activeSess = {
          ...activeSess,
          status: 'new', // Patient sent a new query -> Sets to "new" with Amber border on doctor side!
          lastMessageAt: new Date().toISOString(),
          lastMessageText: userMsgText,
          uploadedFiles: [...uploadedFiles, ...activeSess.uploadedFiles].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
          chats: [...activeSess.chats, newMsg],
          vitalSigns: {
            age: patientAgeStr,
            weight: patientWeightStr,
            height: patientHeightStr,
            bloodPressure: bloodPressure,
            bloodSugar: bloodSugar,
            oxygenLevel: oxygenLevel
          }
        };
      }

      const updatedSessions = [activeSess, ...sessions.filter(s => s.id !== sessId)];
      saveSessions(updatedSessions);
      setWaText('');
      setUploadedFiles([]);
      setIsWaTyping(true);

      // Automatically launch external WhatsApp link in a new tab if allowed
      try {
        const targetPhone = profile.role === 'doctor' ? (selectedWhatsAppDoc.whatsappPhone || "+966500000000") : MEDIATOR_WHATSAPP_PHONE;
        const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(externalWhatsAppFormatted)}`;
        window.open(waUrl, '_blank');
      } catch (err) {}

      // Formulate chatbot feedback
      let responseText = `أهلاً بك يا ${patientName}. لقد استلمت رسالتك بخصوص "${userMsgText}" وسوف أقوم بمراجعة القياسات الحيوية المحدثة فوراً لمتابعة المؤشرات الحيوية بشكل دقيق وصرف اللازم لك.`;
      const textLower = userMsgText.toLowerCase();
      
      if (textLower.includes('سكر') || textLower.includes('تراكمي') || textLower.includes('أنسولين')) {
        responseText = `وعليكم السلام ورحمة الله وبركاته. بخصوص مستويات السكر الصيامية الحالية (${bloodSugar} ملجم)، نوصي بالالتزام التام بجدول السعرات السحابي ومراقبة نشاطك البدني. سأناقش تعديل حصة العلاج فوراً.`;
      } else if (textLower.includes('ضغط') || textLower.includes('صداع') || textLower.includes('نبض')) {
        responseText = `سلامتكم الكريمة. قراءة ضغط الدم الحالية (${bloodPressure}) تتطلب تجنب الأغذية عالية الصوديوم والامتناع عن السهر الحاد. يرجى الاستراحة التامة وسأتابع قراءتك القادمة حياً.`;
      } else if (textLower.includes('وزن') || textLower.includes('حمية') || textLower.includes('سمنة')) {
        responseText = `أهلاً بك. قمنا بدمج مؤشر وزنك الحالي (${patientWeightStr} كجم) بالمنظومة السحابية لموازنة الأيض وحرق السمنة بكفاءة. استمر بخطة الرعاية وسندعمك بانتظام!`;
      }

      setTimeout(() => {
        // Retrieve newest session state to prevent race condition
        const currentSessionsLatest = JSON.parse(localStorage.getItem('medpulse_clinical_sessions') || '[]');
        let newestSess = currentSessionsLatest.find((s: any) => s.id === sessId) || activeSess;
        
        const replyMsg = {
          id: String(Date.now() + 1),
          sender: 'doctor' as const,
          text: responseText,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        };

        newestSess = {
          ...newestSess,
          lastMessageAt: new Date().toISOString(),
          lastMessageText: responseText,
          chats: [...newestSess.chats, replyMsg]
        };

        const finalSessList = [newestSess, ...currentSessionsLatest.filter((s: any) => s.id !== sessId)];
        saveSessions(finalSessList);
        setIsWaTyping(false);
      }, 1800);

    } else {
      // Doctor simulation perspective
      if (!selectedSessionId) return;
      const currentSess = sessions.find(s => s.id === selectedSessionId);
      if (!currentSess) return;

      const newMsg = {
        id: String(Date.now()),
        sender: 'doctor' as const,
        text: userMsgText,
        time: timeStr
      };

      const updatedSess: MedicalSession = {
        ...currentSess,
        status: 'open', // Doctor replied -> Session moves to "open" with Green border!
        lastMessageAt: new Date().toISOString(),
        lastMessageText: userMsgText,
        chats: [...currentSess.chats, newMsg]
      };

      const finalSessions = [updatedSess, ...sessions.filter(s => s.id !== selectedSessionId)];
      saveSessions(finalSessions);
      setWaText('');
    }
  };

  // Doctor writes prescription
  const handleSendPrescription = (sessionId: string, prescriptionText: string) => {
    if (!prescriptionText.trim()) return;
    const currentSess = sessions.find(s => s.id === sessionId);
    if (!currentSess) return;

    const rxMsgText = `✍️ 💊 **روشتة وصفة طبية فورية صادرة عن الطبيب:**\n\n${prescriptionText.trim()}\n\n*الختم والترخيص الرقمي المعتمد لوزارة الصحة العراقية ✅*`;
    
    const rxMsg = {
      id: String(Date.now()),
      sender: 'doctor' as const,
      text: rxMsgText,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedSess: MedicalSession = {
      ...currentSess,
      status: 'open',
      lastMessageAt: new Date().toISOString(),
      lastMessageText: `صرف روشتة علاجية: ${prescriptionText.trim().substring(0, 30)}...`,
      chats: [...currentSess.chats, rxMsg]
    };

    const finalSessions = [updatedSess, ...sessions.filter(s => s.id !== sessionId)];
    saveSessions(finalSessions);
  };

  // Doctor ends and closes session
  const handleEndSession = (sessionId: string) => {
    const currentSess = sessions.find(s => s.id === sessionId);
    if (!currentSess) return;

    const endMsg = {
      id: String(Date.now()),
      sender: 'doctor' as const,
      text: `🔒 لقد قام الطبيب بإنهاء وإغلاق هذه الجلسة الاستشارية بشكل نهائي.\n\nنتمنى لكم الشفاء العاجل. للعودة وطرح أسئلة جديدة، يرجى حجز استشارة جديدة وخصم الكشفية لتفعيل الغرفة الطبية مرة أخرى. 👍`,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedSess: MedicalSession = {
      ...currentSess,
      status: 'closed',
      lastMessageAt: new Date().toISOString(),
      lastMessageText: `تم إنهاء وإغلاق الجلسة السريرية 🔒.`,
      chats: [...currentSess.chats, endMsg]
    };

    const finalSessions = [updatedSess, ...sessions.filter(s => s.id !== sessionId)];
    saveSessions(finalSessions);

    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
    }
  };

  // Doctor toggles free review for session
  const handleToggleFreeReviewForSession = (sessionId: string) => {
    const currentSess = sessions.find(s => s.id === sessionId);
    if (!currentSess) return;

    const isCurrentlyActive = currentSess.hasFreeReviewActive;
    const newStatus = !isCurrentlyActive;

    if (newStatus) {
      localStorage.setItem(`medpulse_free_review_${currentSess.patientEmail}_${currentSess.doctorId}`, 'true');
    } else {
      localStorage.removeItem(`medpulse_free_review_${currentSess.patientEmail}_${currentSess.doctorId}`);
    }

    const notificationText = newStatus 
      ? `🔬 أهلاً بك. لقد قمت الآن كطبيبك المعالج بتفعيل "خيار المراجعة المجانية المعفاة من الكشفية" لمتابعة نتائج فحوصاتك المختبرية أو تخطيط القلب مجاناً بدون كشفية جديدة مجدداً. يرجى تزويدي بالنتائج فوراً!`
      : `🔒 تم إنهاء وإغلاق فترة المراجعة المجانية لنتائج الفحوصات الطبية.`;

    const noticeMsg = {
      id: String(Date.now()),
      sender: 'doctor' as const,
      text: notificationText,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedSess: MedicalSession = {
      ...currentSess,
      hasFreeReviewActive: newStatus,
      chats: [...currentSess.chats, noticeMsg]
    };

    const finalSessions = [updatedSess, ...sessions.filter(s => s.id !== sessionId)];
    saveSessions(finalSessions);
  };

  const endCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsBotSpeaking(false);
    setTestStatus('ended');
    setCallTranscript(prev => [...prev, '[تم إنهاء المكالمة الطبية وحفظ السجلات بنجاح]']);
    setTimeout(() => setTestStatus('idle'), 2500);
  };

  if (!config) return null;

  return (
    <div id="voip-twilio-container" className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 font-mono">
            نظام الاتصالات السحابي ومكاملة Twilio Callbot
          </span>
          <h2 className="text-2xl font-bold font-display text-slate-800 mt-2 flex items-center gap-2">
            <Phone className="text-indigo-500 w-6 h-6 animate-pulse" />
            تكامل المكالمات الصوتية والرد التفاعلي (VoIP)
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            ربط المنصة مع مزودي الاتصالات Twilio لاستقبال مكالمات الطوارئ والاستفسارات الطبية ومزامنتها مباشرة.
          </p>
        </div>

        {profile.role === 'admin' && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            id="btn-toggle-voip-settings"
            className="flex items-center justify-center gap-2 text-sm bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 font-bold px-4 py-2.5 rounded-xl transition duration-150 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            {isEditing ? 'العودة لجهاز الاختبار السريري' : 'إعدادات السحابة وتكامل Twilio ⚙️'}
          </button>
        )}
      </div>

      {isEditing && profile.role === 'admin' ? (
        /* Settings Form Grid */
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">رقم هاتف المكالمات الافتراضي (Twilio Number)</label>
            <input 
              type="text" 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 focus:outline-teal-500" 
              value={config.phoneNumber}
              onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">معرّف الحساب (Account SID)</label>
            <input 
              type="text" 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 focus:outline-teal-500" 
              value={config.accountSid}
              onChange={(e) => setConfig({ ...config, accountSid: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">رمز المصادقة (Auth Token)</label>
            <input 
              type="password" 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-indigo-700 focus:outline-teal-500" 
              value={config.authToken}
              onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">رابط خطاف الويب للتحكم (Webhook URL)</label>
            <input 
              type="text" 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 focus:outline-teal-500" 
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
            />
          </div>

          {/* Status activation */}
          <div className="md:col-span-2 flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              تفعيل البوت التفاعلي لتلقي النداءات
            </span>
            <button
              type="button"
              onClick={() => setConfig({ ...config, isCallbotActive: !config.isCallbotActive })}
              className="focus:outline-none"
            >
              {config.isCallbotActive ? (
                <ToggleRight className="w-12 h-12 text-teal-600" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-slate-400" />
              )}
            </button>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition duration-150"
            >
              حفظ وتطبيق إعدادات الاتصال
            </button>
          </div>
        </form>
      ) : (
        /* Real Interactive Browser VoIP Call Simulator */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Simulation controller */}
          <div className="lg:col-span-5 bg-gradient-to-b from-indigo-50/50 to-indigo-100/20 border border-indigo-100/50 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-indigo-600/10 text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-lg w-max flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                محاكاة بروتوكول الصوت عبر الإنترنت
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 font-display">
                جهاز محاكاة الطبيب الذكي والاتصالات
              </h3>
              
              <p className="text-slate-600 text-xs leading-relaxed">
                اضغط على زر الاتصال بالأسفل لبدء اتصال صوتي افتراضي في لقطة حية. سيقوم البوت بمخاطبتك صوتياً (بالصوت العربي) وقراءة ملفك، كما يمكنك الرد عليه بالخيارات المقترحة.
              </p>
            </div>

            {/* Simulated telephone status display */}
            <div className="bg-white border border-indigo-100 rounded-xl p-4 my-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">رقم الاتصال الافتراضي</span>
                <span className="text-sm font-mono font-bold text-slate-700">{config.phoneNumber}</span>
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${config.isCallbotActive ? 'bg-emerald-500 animate-ping' : 'bg-red-400'}`}></span>
            </div>

            {/* Trigger buttons */}
            <div className="space-y-3">
              {testStatus === 'idle' && (
                <button
                  onClick={startSimulatedCall}
                  className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition duration-150 shadow-sm hover:shadow-md"
                >
                  <Play className="w-4 h-4 fill-white" />
                  بدء مكالمة سريرية تجريبية
                </button>
              )}

              {testStatus === 'calling' && (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-200 text-indigo-700 font-medium py-3 rounded-xl"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري رنين الهاتف الافتراضي...
                </button>
              )}

              {(testStatus === 'connected' || testStatus === 'calling') && (
                <button
                  onClick={endCall}
                  className="w-full flex items-center justify-center gap-2 text-sm bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-xl transition duration-150"
                >
                  <Square className="w-4 h-4 fill-white" />
                  إنهاء المكالمة وإلغاء الربط
                </button>
              )}
            </div>
          </div>

          {/* Call Session Output Container */}
          <div className="lg:col-span-7 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between space-y-4 min-h-[300px] bg-slate-900 text-slate-100 font-mono">
            {/* Console Screen header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                <Volume2 className={`w-3.5 h-3.5 ${isBotSpeaking ? 'animate-bounce text-emerald-300' : ''}`} />
                {testStatus === 'connected' ? '● الخط متصل وآمن' : '○ خط الانتظار خامل'}
              </span>
              <span className="text-[9px] text-slate-500">مقسم النداء: MedPulse IP-PBX</span>
            </div>

            {/* Console output message log */}
            <div className="flex-1 overflow-y-auto space-y-3.5 text-xs max-h-[220px] pr-2">
              {callTranscript.length === 0 ? (
                <p className="text-slate-500 italic text-center py-12">
                  بمجرد تشغيل خط الاتصال، ستظهر الإرساليات الصوتية للذكاء الاصطناعي وترجمة الصوت هنا في الزمن الحقيقي.
                </p>
              ) : (
                callTranscript.map((log, idx) => (
                  <div key={idx} className={`leading-relaxed ${log.includes('[البوت') ? 'text-teal-300' : log.includes('[أخي') ? 'text-indigo-300' : 'text-slate-400 italic'}`}>
                    {log}
                  </div>
                ))
              )}
            </div>

            {/* Dialpad Speech shortcuts for patient interaction during active demo call */}
            {testStatus === 'connected' && (
              <div className="pt-3 border-t border-slate-800 space-y-2 text-right">
                <span className="text-[10px] text-slate-400 block mb-1">تكلم أو اختر ردك الهاتفي الآن:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => respondSimulatedVoice('سليم')}
                    className="bg-slate-800 hover:bg-slate-700 text-[11px] font-sans font-medium text-slate-200 py-1.5 px-2.5 rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    🎤 سليم وبصحة ممتازة
                  </button>
                  <button
                    type="button"
                    onClick={() => respondSimulatedVoice('تعب')}
                    className="bg-slate-800 hover:bg-slate-700 text-[11px] font-sans font-medium text-slate-200 py-1.5 px-2.5 rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    🎤 أشعر بخمول وتعب
                  </button>
                  <button
                    type="button"
                    onClick={() => respondSimulatedVoice('سعرات')}
                    className="bg-slate-800 hover:bg-slate-700 text-[11px] font-sans font-medium text-slate-200 py-1.5 px-2.5 rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    🎤 كم سعراتي المقترحة؟
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Divider */}
      <div className="border-t border-slate-100 my-8"></div>

      {/* WhatsApp Clinical Consultation Hub */}
      <div className="space-y-6 text-right">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-mono">
            آلية التنسيق الهجين المتقدمة
          </span>
          <h2 className="text-xl font-bold font-display text-slate-800 mt-2 flex items-center gap-2 justify-start">
            <span className="text-2xl animate-bounce">💬</span>
            قنوات ومحادثات الواتساب الطبية العاجلة (WhatsApp Clinical Hub)
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            بالإضافة إلى بوت الرد الصوتي، تتيح المنصة للمستفيدين إرسال تفاصيل الحالة الصحية للسكري والضغط حياً إلى الطبيب المشرف عبر تطبيق واتساب ومتابعته فوراً.
          </p>
        </div>

        {/* Dynamic Simulation Role Selector for Prototyping */}
        <div className="bg-gradient-to-r from-teal-50 to-indigo-50/50 p-4 rounded-3xl border border-teal-100/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
          <div className="flex items-start gap-2.5">
            <span className="text-xl">🛠️</span>
            <div className="text-right">
              <span className="text-xs font-black text-slate-800 block">منظار معاينة وتفعيل البوابات الذكية (خاص بالتجربة والتحقق)</span>
              <span className="text-[10.5px] text-slate-600 block leading-relaxed mt-0.5 font-sans">
                في بيئة الإنتاج الفعلية، يتم إخفاء أزرار التحكم تماماً عن المستفيد لضمان عدم تخطي الكشفية من تلقاء نفسه، حيث يمتلك الطبيب حصراً زر طلب الفحوصات من ملفه السريري. للتحقق الآن، يمكنك التبديل أدناه لتجربة كلا الدورين!
              </span>
            </div>
          </div>
          <div className="flex bg-white border border-slate-205 p-1 rounded-xl shadow-2xs gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setSimulationRole('patient')}
              className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition duration-150 cursor-pointer ${
                simulationRole === 'patient'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'text-slate-650 hover:bg-slate-50'
              }`}
            >
              👤 منظور المستفيد (المريض)
            </button>
            <button
              type="button"
              onClick={() => setSimulationRole('doctor')}
              className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition duration-150 cursor-pointer ${
                simulationRole === 'doctor'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-650 hover:bg-slate-50'
              }`}
            >
              🩺 محاكاة الطبيب المعالج
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Right Column: Available Doctors directory (5 cols) or Doctor's Active Sessions */}
          <div className="lg:col-span-5 space-y-4 text-right">
            {simulationRole === 'doctor' ? (
              <div className="space-y-4">
                {/* Doctor active select card */}
                <div className="bg-gradient-to-b from-indigo-50 to-indigo-100/20 border border-indigo-100 p-4 rounded-2xl text-right">
                  <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1 justify-start">
                    <Activity className="w-3.5 h-3.5 text-indigo-500" />
                    تقمص دور الطبيب المشرف بالعيادة:
                  </label>
                  <select
                    value={simulatedDocId}
                    onChange={(e) => {
                      setSimulatedDocId(e.target.value);
                      const docSess = sessions.filter(s => s.doctorId === e.target.value);
                      setSelectedSessionId(docSess.length > 0 ? docSess[0].id : null);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none cursor-pointer font-sans"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                    ))}
                  </select>
                </div>

                {/* 📅 Doctor Scheduling & Postponement Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 text-right">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="text-xl">📅</span>
                    <div className="text-right">
                      <h4 className="font-bold text-slate-800 text-xs">إدارة جدولة العيادة وتأجيل المواعيد</h4>
                      <span className="text-[10px] text-indigo-600 font-bold block">تنظيم عيادة السكرتير الرقمي الآلي</span>
                    </div>
                  </div>

                  {postponements[simulatedDocId] ? (
                    <div className="space-y-3">
                      <div className="bg-rose-50 border border-rose-200/60 p-4 rounded-2xl text-right space-y-2">
                        <span className="text-rose-800 font-bold text-xs block flex items-center gap-1.5 justify-start">
                          ⚠️ العيادة مؤجلة حالياً!
                        </span>
                        <p className="text-[10.5px] text-rose-750 leading-relaxed font-sans m-0">
                          لقد قمت بتأجيل كافة جلسات هذه العيادة حتى تاريخ <strong>{postponements[simulatedDocId].postponedUntil}</strong> بسبب: <strong>{postponements[simulatedDocId].reason}</strong>.
                        </p>
                        <p className="text-[10px] text-rose-650 leading-normal font-sans m-0">
                          الموعد الجديد لمرضاك هو: <strong>{postponements[simulatedDocId].newAppointmentDate}</strong>.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCancelDoctorPostponement(simulatedDocId)}
                        className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-2 rounded-xl text-xs transition active:scale-98 cursor-pointer"
                      >
                        إلغاء التأجيل وإعادة فتح الحجز الفوري 🔓
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-500 leading-relaxed m-0 font-sans">
                        لتأجيل مواعيدك للأسبوع القادم مثلاً، حدد تاريخ انتهاء فترة التأجيل واكتب الموعد الجديد لكي يرسل السكرتير الرقمي رسائل التحديث لمرضاك تلقائياً:
                      </p>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">تأجيل الحجوزات حتى تاريخ:</label>
                          <input
                            type="date"
                            value={postponeUntilDate}
                            onChange={(e) => setPostponeUntilDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-right focus:outline-indigo-500 font-sans"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">السبب الطارئ للتأجيل:</label>
                          <select
                            value={postponeReason}
                            onChange={(e) => setPostponeReason(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-right focus:outline-indigo-500 font-sans cursor-pointer"
                          >
                            <option value="ظروف خاصة طارئة">ظروف خاصة طارئة</option>
                            <option value="مؤتمر طبي تخصصي خارج العراق">مؤتمر طبي تخصصي خارج العراق</option>
                            <option value="إجازة دورية وعطلة رسمية">إجازة دورية وعطلة رسمية</option>
                            <option value="توعك صحي طفيف للراحة">توعك صحي طفيف للراحة</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">الموعد القادم المحدد للمرضى (نص يحدده الطبيب):</label>
                          <input
                            type="text"
                            placeholder="مثال: الأحد القادم 5 يوليو الساعة 4:00 مساءً"
                            value={postponeReturnDateText}
                            onChange={(e) => setPostponeReturnDateText(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-right focus:outline-indigo-500 font-sans"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handlePostponeDoctorSessions}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs transition active:scale-98 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>تأجيل الجلسات وإخطار السكرتير الآلي 🤖</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">الغرف الطبية النشطة لمرضاك</h3>
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 font-mono font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    مرتبة بالأولوية الطبية ⏱️
                  </span>
                </div>

                {sessions.filter(s => s.doctorId === simulatedDocId && s.status !== 'closed').length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <span className="text-2xl block mb-2">📭</span>
                    <p className="text-xs text-slate-500 font-bold">لا يوجد جلسات استشارة نشطة حالياً.</p>
                    <p className="text-[10px] text-slate-400 mt-1">بمجرد قيام مريض بحجز استشارة أو مراسلتك، ستظهر غرفته هنا بالأولوية.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                    {sessions
                      .filter(s => s.doctorId === simulatedDocId && s.status !== 'closed')
                      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
                      .map((sess) => {
                        const isSelected = selectedSessionId === sess.id;
                        const isNew = sess.status === 'new';
                        const isOpen = sess.status === 'open';
                        const isClosed = sess.status === 'closed';

                        // Calculate dynamic borders and background states
                        let borderClass = "border-slate-150 bg-white hover:bg-slate-50 shadow-xs";
                        if (isSelected) {
                          if (isNew) {
                            borderClass = "border-amber-500 bg-amber-50/10 ring-2 ring-amber-500/30 animate-pulse shadow-md shadow-amber-200/50";
                          } else if (isOpen) {
                            borderClass = "border-emerald-500 bg-emerald-50/10 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-200/40";
                          } else {
                            borderClass = "border-slate-300 bg-slate-100 ring-2 ring-slate-400/20";
                          }
                        } else {
                          if (isNew) {
                            borderClass = "border-amber-400 bg-amber-50/5 hover:bg-amber-50/10 shadow-sm shadow-amber-50/50";
                          } else if (isOpen) {
                            borderClass = "border-emerald-200 hover:border-emerald-400 bg-white shadow-xs";
                          } else {
                            borderClass = "border-slate-200 opacity-60 bg-slate-50/50";
                          }
                        }

                        return (
                          <div
                            key={sess.id}
                            onClick={() => setSelectedSessionId(sess.id)}
                            className={`p-4 rounded-2xl border transition duration-150 cursor-pointer text-right relative ${borderClass}`}
                          >
                            {/* Status and notification badges */}
                            <div className="absolute top-3 left-3 flex flex-col items-end gap-1 font-sans">
                              {isNew && (
                                <span className="bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-xs">
                                  ● جديدة 🆕
                                </span>
                              )}
                              {isOpen && (
                                <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-xs">
                                  ● مفتوحة ومتابعة 🟢
                                </span>
                              )}
                              {isClosed && (
                                <span className="bg-slate-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  🔒 مكتملة/مغلقة
                                </span>
                              )}
                              {sess.hasFreeReviewActive && (
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[8px] px-1.5 py-0.5 rounded font-black">
                                  🧪 مراجعة مجانية نشطة
                                </span>
                              )}
                            </div>

                            <div className="space-y-1.5 font-sans text-right">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">👤</span>
                                <h4 className="font-bold text-slate-800 text-xs">{sess.patientName}</h4>
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono">{sess.patientEmail}</p>

                              {/* Vitals Summary Grid */}
                              <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-[10px] space-y-1 mt-1.5">
                                <div className="grid grid-cols-3 gap-1 text-center font-mono font-bold text-slate-700">
                                  <div className="border-l border-slate-150">
                                    <span className="block text-[8px] font-sans text-slate-400">الضغط</span>
                                    <span>{sess.vitalSigns?.bloodPressure || 'غير متوفر'}</span>
                                  </div>
                                  <div className="border-l border-slate-150">
                                    <span className="block text-[8px] font-sans text-slate-400">السكري</span>
                                    <span>{sess.vitalSigns?.bloodSugar || 'غير متوفر'}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[8px] font-sans text-slate-400">الأكسجين</span>
                                    <span>%{sess.vitalSigns?.oxygenLevel || 'غير متوفر'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Message snippet */}
                              <p className="text-[10.5px] text-slate-600 line-clamp-1 italic mt-1.5 leading-relaxed">
                                "{sess.lastMessageText || 'بدء الاستشارة وتأمين القياسات.'}"
                              </p>

                              {/* Footer relative time info */}
                              <div className="flex justify-end pt-1 border-t border-slate-100/50 mt-1">
                                <span className="text-[9px] text-slate-400 font-mono">
                                  نشط: {new Date(sess.lastMessageAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            ) : (
              /* Patient Mode: Show available doctors */
              <>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">الأطباء المشرفون النشطين المتاحين للواتساب</h3>
                
                {doctors.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-6 bg-slate-50 rounded-2xl border text-center">
                    لا يوجد أطباء مسجلون حالياً. يمكنك تسجيل طبيب من لوحة الأطباء لتجربة الربط.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                     {doctors.map((doc) => {
                      const isSelected = selectedWhatsAppDoc?.id === doc.id;
                      const duty = getDoctorDutyStatus(doc);
                      const isPaidService = doc.isPaid !== false;
                      const hasSess = sessions.find(s => s.patientEmail === profile.email && s.doctorId === doc.id && s.status !== 'closed');
                      
                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedWhatsAppDoc(doc)}
                          className={`p-4 rounded-2xl border transition duration-150 cursor-pointer text-right relative ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-50/10 shadow-xs ring-1 ring-emerald-500/20' 
                              : 'border-slate-150 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                          }`}
                        >
                          {/* Selection and monetization badges */}
                          <div className="absolute top-3 left-3 flex flex-col items-end gap-1 font-sans">
                            {isSelected && (
                              <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                ● نشط بالمحادثة
                              </span>
                            )}
                            {hasSess && (
                              <span className="bg-emerald-505 text-white text-[8px] px-1.5 py-0.5 rounded font-black animate-pulse">
                                ● استشارتك نشطة حالياً
                              </span>
                            )}
                            {isPaidService ? (
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[8px] px-1.5 py-0.5 rounded font-black">
                                💳 استشارة مدفوعة
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 text-[8px] px-1.5 py-0.5 rounded font-black">
                                💚 تطوعية بالكامل
                              </span>
                            )}
                            {localStorage.getItem(`medpulse_free_review_${profile.email}_${doc.id}`) === 'true' && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[8px] px-1.5 py-0.5 rounded font-black animate-pulse">
                                🧪 مراجعة مجانية نشطة
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">⚕️</span>
                              <h4 className="font-bold text-slate-800 text-sm">{doc.name}</h4>
                            </div>
                            <p className="text-xs text-slate-500 font-sans">
                              💼 التخصص: <strong className="text-emerald-700">{doc.specialty}</strong>
                            </p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              🏥 الممارس بـ: {doc.hospital}
                            </p>
                            
                            {/* Dynamic working hours display */}
                            <div className="bg-slate-50/80 border border-slate-100 p-2 rounded-xl text-[10px] space-y-1 leading-normal mt-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-450 font-bold">حالة الدوام الآن:</span>
                                <span className={`px-2 py-0.5 rounded-md border text-[9px] ${
                                  duty.isOnDuty ? 'bg-emerald-50 text-emerald-900 border-emerald-250 font-semibold' : 'bg-amber-50 text-amber-900 border-amber-250 font-semibold'
                                }`}>
                                  {duty.text}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-slate-500">
                                <span>أيام الدوام:</span>
                                <span className="font-bold text-slate-700">
                                  {doc.availabilityType === '24/7' ? 'طيلة الأسبوع (24/7)' : doc.workingDays?.join('، ') || 'لا يوجد'}
                                </span>
                              </div>
                            </div>

                            {/* Consultation dynamic metrics */}
                            <div className="bg-indigo-50/30 border border-indigo-100/50 p-2 rounded-xl text-[10.5px] space-y-1 leading-normal mt-1.5 text-right font-sans">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">💵 قيمة كشفية العيادة:</span>
                                <span className="font-black text-indigo-750">
                                  {doc.isPaid !== false ? `${(doc.consultationFee || 20000).toLocaleString()} د.ع` : "مجانية تطوعية 💚"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">👥 سعة استقبال المرضى اليومية:</span>
                                <span className="font-bold text-slate-700">
                                  {doc.maxPatientsPerDay || 12} مرضى / اليوم الواحد
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 font-sans">
                              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                                ⭐ <span>{doc.rating} / 5.0</span>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center gap-1">
                                🛡️ رقم الوساطة: {MEDIATOR_WHATSAPP_PHONE}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quick Helper Banner */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-500 leading-relaxed text-right">
                🎯 <strong>ملاحظة التوجيه الجغرافي:</strong> عند اختيار الطبيب، يرجى كتابة عوارضك بدقة لتوليد رسالة طبية مشفرة بـ (Clinical WhatsApp Code). الضغط على الطبيب يحضر التنسيق فوراً.
              </div>
            </>
          )}
        </div>

        {/* Left Column: Interactive WhatsApp chat panel (7 cols) */}
        <div className="lg:col-span-7 border border-slate-200 rounded-3xl bg-[#E5DDD5] overflow-hidden flex flex-col justify-between min-h-[480px] relative">
          {simulationRole === 'doctor' ? (
            (() => {
              const activeSess = sessions.find(s => s.id === selectedSessionId);
              if (!activeSess || activeSess.doctorId !== simulatedDocId) {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-50 h-full space-y-3">
                    <span className="text-5xl animate-pulse">🩺</span>
                    <p className="font-black text-sm text-indigo-950">مرحباً بك دكتور في عيادتك الإلكترونية الموحدة</p>
                    <p className="text-xs max-w-sm leading-relaxed text-slate-500 font-sans">
                      الرجاء تحديد غرفة مريض نشطة من القائمة اليمنى لمباشرة الكشف الطبي ومراجعة المؤشرات وصرف الروشتة.
                    </p>
                  </div>
                );
              }
              return (
                <DoctorClinicalWorkspace
                  activeSess={activeSess}
                  simulatedDocId={simulatedDocId}
                  MEDIATOR_WHATSAPP_PHONE={MEDIATOR_WHATSAPP_PHONE}
                  doctorPrescriptionText={doctorPrescriptionText}
                  setDoctorPrescriptionText={setDoctorPrescriptionText}
                  handleSendPrescription={handleSendPrescription}
                  handleEndSession={handleEndSession}
                  handleToggleFreeReviewForSession={handleToggleFreeReviewForSession}
                  onSendChatMessage={(txt) => {
                    const newMsg = {
                      id: String(Date.now()),
                      sender: 'doctor' as const,
                      text: txt,
                      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                    };
                    const updatedSess: MedicalSession = {
                      ...activeSess,
                      status: 'open',
                      lastMessageAt: new Date().toISOString(),
                      lastMessageText: txt,
                      chats: [...activeSess.chats, newMsg]
                    };
                    const finalSessions = [updatedSess, ...sessions.filter(s => s.id !== activeSess.id)];
                    saveSessions(finalSessions);
                  }}
                />
              );
            })()
          ) : selectedWhatsAppDoc ? (
            !isConsultationActive ? (
              <div id="consultation-paygate-panel" className="flex-1 flex flex-col justify-between p-6 bg-slate-50 text-right h-full overflow-y-auto">
                {bookingStep === 'review' ? (
                  /* Step 1: Pre-booking Slot Review (مراجعة تفاصيل الموعد المقترح) */
                  <div className="space-y-5 my-auto animate-fade-in flex flex-col justify-center">
                    <div className="bg-white border border-slate-150 p-6 rounded-3xl space-y-4 shadow-sm text-right">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="h-12 w-12 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center text-xl font-bold">
                          🤖
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-indigo-700 font-bold block">مساعد العيادة الذكي والجدولة المسبقة</span>
                          <h4 className="font-bold text-slate-800 text-sm">مراجعة الموعد مع السكرتير الرقمي للعيادة</h4>
                        </div>
                      </div>

                      {/* Display Postponement Notice if Doctor Postponed */}
                      {(() => {
                        const slot = getNextAvailableBookingSlot(selectedWhatsAppDoc, sessions);
                        if (slot.isPostponed) {
                          return (
                            <div className="bg-rose-50 border border-rose-200/60 p-4 rounded-2xl text-right space-y-2">
                              <span className="text-rose-800 font-extrabold text-xs block flex items-center gap-1.5 justify-start">
                                ⚠️ إعلان تأجيل طارئ من العيادة:
                              </span>
                              <p className="text-[11px] text-rose-750 leading-relaxed font-sans m-0">
                                نود إعلامكم بأن الدكتور <strong>{selectedWhatsAppDoc.name}</strong> قد قام بتأجيل عيادته وجلساته مؤقتاً حتى تاريخ <strong>{slot.postponedUntil}</strong> بسبب: "{slot.postponeReason}".
                              </p>
                              <p className="text-[11px] text-rose-900 font-black leading-normal m-0 bg-white/60 p-2 rounded-xl">
                                📅 الموعد الجديد المحدد والمتاح من الطبيب هو: <span className="text-rose-750 underline">{slot.newAppointmentDate || slot.formattedDate}</span>
                              </p>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-indigo-50/40 p-4 rounded-2xl space-y-1 text-slate-700 text-xs leading-relaxed font-sans">
                              <p className="m-0 font-bold text-indigo-905">أهلاً بك يا مستفيدنا الكريم!</p>
                              <p className="m-0">
                                أنا السكرتير الرقمي المساعد للدكتور <strong>{selectedWhatsAppDoc.name}</strong>. لقد قمت بمراجعة جدول المواعيد المعتمد للطبيب والأيام الشاغرة هذا الأسبوع، وقمت بتأمين وحجز الموعد الأقرب التالي لك مسبقاً:
                              </p>
                            </div>
                          );
                        }
                      })()}

                      {/* Proposed Slot Details Grid */}
                      {(() => {
                        const slot = getNextAvailableBookingSlot(selectedWhatsAppDoc, sessions);
                        return (
                          <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3 font-sans">
                            <div className="grid grid-cols-2 gap-y-2.5 text-xs text-slate-700">
                              <div className="text-right text-slate-400 font-bold">اليوم واليومية:</div>
                              <div className="text-left font-black text-slate-800">{slot.dayName}</div>

                              <div className="text-right text-slate-400 font-bold">تاريخ الموعد المقترح:</div>
                              <div className="text-left font-black text-indigo-700">
                                {slot.isPostponed ? (slot.newAppointmentDate || slot.formattedDate) : slot.formattedDate}
                              </div>

                              <div className="text-right text-slate-400 font-bold">ساعات المناوبة:</div>
                              <div className="text-left font-black text-slate-850">
                                {formatTimeArabic(selectedWhatsAppDoc.startTime || '16:00')} - {formatTimeArabic(selectedWhatsAppDoc.endTime || '21:00')}
                              </div>

                              <div className="text-right text-slate-400 font-bold">رقم الحجز الفوري:</div>
                              <div className="text-left font-black text-emerald-600">تسلسل ({slot.queueNumber}) بالطابور</div>

                              <div className="text-right text-slate-400 font-bold">كشفية الطبيب المشرف:</div>
                              <div className="text-left font-black text-slate-900">
                                {(selectedWhatsAppDoc.consultationFee || 20000).toLocaleString()} د.ع
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Alternate Doctors Suggestions Section */}
                      {(() => {
                        const alts = getAvailableAlternativeDoctors(selectedWhatsAppDoc.id, doctors, sessions);
                        // Only suggest if other doctors are registered
                        if (alts.length > 0) {
                          return (
                            <div className="bg-emerald-50/60 border border-emerald-150 p-4 rounded-2xl space-y-3 text-right">
                              <span className="text-[11px] font-extrabold text-emerald-800 block flex items-center gap-1.5 justify-start">
                                💡 أطباء بدلاء متوفرون حالياً بالمنصة:
                              </span>
                              <p className="text-[10px] text-slate-500 m-0 leading-normal">
                                السكرتير الرقمي يرشح لك الزملاء الأطباء الآخرين المتاحين حالياً ولديهم إمكانية حجز (لم تنتهِ سعتهم اليومية):
                              </p>
                              <div className="space-y-2">
                                {alts.map(alt => {
                                  return (
                                    <div key={alt.doctor.id} className="bg-white border border-slate-150 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                                      <div className="text-right space-y-0.5">
                                        <span className="font-extrabold text-slate-800 text-xs">{alt.doctor.name}</span>
                                        <span className="text-[9px] text-slate-400 block">{alt.doctor.specialty}</span>
                                        <p className="text-[10px] text-indigo-700 font-bold m-0">
                                          📅 متاح: يوم {alt.nextSlot.dayName} الموافق {alt.nextSlot.formattedDate}
                                        </p>
                                        <p className="text-[9px] text-slate-500 m-0">
                                          ⏰ الدوام: {formatTimeArabic(alt.doctor.startTime || '16:00')} - {formatTimeArabic(alt.doctor.endTime || '21:00')}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedWhatsAppDoc(alt.doctor);
                                          setBookingStep('review');
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-750 text-white font-black text-[9px] px-3 py-1.5 rounded-lg cursor-pointer transition text-center shrink-0"
                                      >
                                        🔄 تبديل وحجز موعد معه
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <p className="text-[11px] text-amber-700 leading-normal bg-amber-50/50 border border-amber-100 p-3 rounded-2xl">
                        ⚠️ <strong>ملاحظة للمريض:</strong> إذا لم يناسبك هذا الموعد، يمكنك الضغط على "إلغاء" والرجوع للبحث عن طبيب آخر بمواعيد مختلفة. في حال ملائمته لك، اضغط "تأكيد" لمتابعة حجز الموعد وسداد الرسم.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setBookingStep('payment')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold px-5 py-3 rounded-2xl cursor-pointer text-xs transition duration-150 active:scale-95 shadow-sm text-center"
                        >
                          تأكيد الموعد ومتابعة الحجز والواتساب 📱
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setSelectedWhatsAppDoc(null)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-3 rounded-2xl cursor-pointer text-xs transition duration-150 active:scale-95 text-center"
                        >
                          لا يناسبني، إلغاء الموعد 🛑
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Step 2: Payment and Activation (السداد وتأكيد الحجز) */
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    <div className="bg-white border border-slate-150 p-5 rounded-3xl space-y-4 shadow-sm text-right">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center text-lg font-bold">
                          🔒
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-indigo-700 font-bold block">الخطوة الثانية: السداد وتأكيد الحجز</span>
                          <h4 className="font-bold text-slate-800 text-xs">طرق تفعيل الغرفة الطبية مع {selectedWhatsAppDoc.name}</h4>
                        </div>
                      </div>

                      <p className="text-xs text-slate-650 leading-relaxed font-sans m-0">
                        يرجى اختيار أحد الخيارات التالية لإتمام حجز الموعد وتفعيل خط الاتصال المباشر مع العيادة ومحاكاة التحاق الطبيب بالاستشارة:
                      </p>

                      {/* Interactive free medical review bypass simulation */}
                      {simulationRole === 'patient' ? (
                        <div className="bg-slate-100/90 border border-slate-205 p-3.5 rounded-2xl text-[11px] leading-relaxed text-slate-600 space-y-1">
                          <p className="m-0">
                            💡 <strong>هل أنت طبيب وترغب في تفعيل "المراجعة المجانية" لهذا المريض؟</strong>
                          </p>
                          <p className="text-[10px] text-slate-500 m-0 leading-normal">
                            لتجربة تدفق المراجعة الذاتية والإعفاء التلقائي من الكشفية، قم بالصعود لأعلى الصفحة وتبديل المنظار لـ <strong>🩺 محاكاة الطبيب المعالج</strong>. سيمكنك حصد الممر ومحاكاة طلب التحاليل مجاناً!
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-250 p-4 rounded-3xl text-right space-y-2 mt-2">
                          <span className="font-extrabold text-[#128C7E] text-[11.5px] block flex items-center gap-1">
                            🧬 محاكاة الطبيب (فحص ومطابقة المراجعة المجانية):
                          </span>
                          <p className="text-[10px] text-slate-650 leading-normal font-medium">
                            كطبيب معالج، يمكنك تجربة تفعيل ميزة "طلب الفحوصات المختبرية" للمستفيد بالضغط أدناه لإعفائه من سداد قيمة الكشفية مرة أخرى عند العودة.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.setItem(`medpulse_free_review_${profile.email}_${selectedWhatsAppDoc.id}`, 'true');
                              setFreeReviewDocIds(prev => [...prev, selectedWhatsAppDoc.id]);
                              setIsConsultationActive(true);
                              
                              // Initialize with a lab request simulation message in chat
                              const labMsg = {
                                id: String(Date.now()),
                                sender: 'doctor' as const,
                                text: `🔬 أهلاً بك يا مستفيدنا العزيز. لقد قمت بتفعيل "خيار مراجعة الفحوصات الطبية" مجاناً لك بالمنصة. يرجى تزويدي بنتائج الفحوصات المختبرية أو تخطيط القلب ومؤشرات القياس التي طلبتها لكي نقوم بمراجعتها وتعديل جرعات العلاج فوراً وبدون كشفية جديدة! 👍`,
                                time: 'الآن'
                              };
                              setWaChats(prev => ({
                                ...prev,
                                [selectedWhatsAppDoc.id]: [...(prev[selectedWhatsAppDoc.id] || []), labMsg]
                              }));
                            }}
                            className="bg-emerald-600 hover:bg-emerald-750 text-white font-black px-4 py-2 rounded-xl cursor-pointer text-[10px] transition duration-150 inline-block active:scale-95 shadow-xs"
                          >
                            🧪 محاكاة: الطبيب يطلب فحوصات ويفعل المراجعة المجانية ⚕️
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Payment checkout options container */}
                    <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-xs space-y-4 my-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold block">قيمة الاستشارة وتأمين الحجز</span>
                          <span className="text-lg font-black text-emerald-600 font-sans">{(selectedWhatsAppDoc?.consultationFee || 20000).toLocaleString()} دينار عراقي</span>
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full">تأكيد رقمي سريع ⚡</span>
                      </div>

                      {/* Zain cash container */}
                      <div className="space-y-2.5 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-1.5 justify-start">
                          <span className="text-sm">📱</span>
                          <span className="text-xs font-bold text-slate-700">الخيار الأول: السداد الآلي الفوري عبر زين كاش (Zain Cash)</span>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500">أدخل رقم محفظة زين كاش لخصم فوري لرسوم الخدمة:</label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                              type="text"
                              maxLength={11}
                              placeholder="077XXXXXXXX"
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-right focus:outline-emerald-500 font-mono"
                              value={zainWalletPhone}
                              onChange={(e) => setZainWalletPhone(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => handlePayWithZainCash(selectedWhatsAppDoc.id)}
                              disabled={isZainPaying}
                              className="bg-emerald-600 hover:bg-emerald-750 disabled:bg-slate-300 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition shrink-0 cursor-pointer"
                            >
                              {isZainPaying ? 'جاري التحقق الرقمي...' : 'دفع وتفعيل المراسلة الفورية 💳'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp reservation & manual confirmation container */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center gap-1.5 justify-start">
                          <span className="text-sm">💬</span>
                          <span className="text-xs font-bold text-slate-700">الخيار الثاني: إرسال تفاصيل الموعد والدفع اليدوي عبر WhatsApp</span>
                        </div>

                        <p className="text-[10px] text-slate-500 leading-relaxed m-0 font-sans">
                          بموجب فكرتكم الذكية، يمكنك إرسال كود الموعد المحجوز آلياً إلى واتساب الحجز لتحويل قيمة الكشفية يدوياً وتفعيل الغرفة من المشرف فوراً:
                        </p>

                        {(() => {
                          const slot = getNextAvailableBookingSlot(selectedWhatsAppDoc, sessions);
                          const targetBookingPhone = localStorage.getItem('whatsappSalesPhone') || MEDIATOR_WHATSAPP_PHONE;
                          const whatsappMsg = `مرحباً سكرتارية منصة مدبلس، أود حجز استشارة مع الدكتور ${selectedWhatsAppDoc.name}. الموعد الشاغر المقترح هو يوم ${slot.dayName} الموافق ${slot.formattedDate} برقم حجز (${slot.queueNumber}). يرجى تزويدي بطرق السداد لتأكيد الحجز وتفعيل غرفتي بالمنصة يدوياً. بريد المريض الإلكتروني: ${profile.email}`;
                          const whatsappLink = `https://wa.me/${targetBookingPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMsg)}`;

                          return (
                            <div className="flex flex-col sm:flex-row gap-2 font-sans">
                              <a 
                                href={whatsappLink}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                className="flex-1 bg-[#128C7E] hover:bg-[#075E54] text-white font-extrabold py-2 px-4 rounded-xl text-xs text-center transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <span>إرسال تأكيد الحجز والدفع إلى الواتساب ({targetBookingPhone}) 📱</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => {
                                  handleStartNewSession(selectedWhatsAppDoc);
                                  alert(`🧬 [محاكاة المشرف] تم استلام الحجز من واتساب العيادة (${targetBookingPhone})، وقام المشرف/الأدمن بتأكيد السداد وتفعيل غرفتك الطبية بنجاح! 💾`);
                                }}
                                className="bg-indigo-650 hover:bg-indigo-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer shrink-0"
                              >
                                ⚙️ محاكاة المشرف: تفعيل الحجز يدوياً 💾
                              </button>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setBookingStep('review')}
                          className="text-[10.5px] text-indigo-600 hover:underline font-bold"
                        >
                          ← الرجوع لتفاصيل الموعد والجدولة مسبقاً
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
                /* isConsultationActive is true -> Render Active Chat Screen! */
                <div className="flex-1 flex flex-col justify-between">
                  {/* Top Header of Chat Panel */}
                  <div className="bg-[#ECE5DD] p-3 border-b border-slate-300 flex items-center justify-between">
                    {/* User profile inside the header bar */}
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase">
                        {selectedWhatsAppDoc.name[0]}
                      </div>
                      <div className="text-right">
                        <h4 className="font-bold text-slate-800 text-xs">{selectedWhatsAppDoc.name}</h4>
                        <span className="text-[9px] text-emerald-700 font-bold block">{selectedWhatsAppDoc.specialty}</span>
                      </div>
                    </div>

                    {/* WhatsApp Call Actions for testing and quality check */}
                    <div className="flex items-center gap-2">
                    <button
                      onClick={() => startVirtualWhatsAppCall('voice')}
                      title="مكالمة تشخيص صوتية واتساب (اختبار الجودة والسرعة)"
                      className="flex items-center gap-1 text-[11px] bg-emerald-600 hover:bg-[#128C7E] px-2.5 py-1.5 rounded-full text-white font-bold transition shadow-xs cursor-pointer"
                    >
                      <PhoneCall className="w-3 h-3 text-white" />
                      <span>اتصال صوتي 📞</span>
                    </button>
                    <button
                      onClick={() => startVirtualWhatsAppCall('video')}
                      title="مكالمة تشخيص مرئية واتساب (اختبار الكاميرا والصوت الكلي)"
                      className="flex items-center gap-1 text-[11px] bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1.5 rounded-full text-white font-bold transition shadow-xs cursor-pointer animate-pulse"
                    >
                      <Video className="w-3 h-3 text-white" />
                      <span>فيديو 📹</span>
                    </button>
                    <div className="hidden md:flex items-center gap-1 text-[11px] bg-[#128C7E]/85 px-2.5 py-1.5 rounded-full text-emerald-100 font-sans">
                      <span>الوساطة الآمنة 🔐:</span>
                      <strong className="font-mono">{profile.role === 'doctor' ? (selectedWhatsAppDoc.whatsappPhone || "+966500000000") : MEDIATOR_WHATSAPP_PHONE}</strong>
                    </div>
                  </div>
                </div>

                {/* Doctor Lab Request Status / Review Controller / Patient State View */}
                {simulationRole === 'patient' ? (
                  <>
                    {/* Active Booking Ticket Card */}
                    {getActiveBooking() && (
                      <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-3 text-right font-sans animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-xl bg-white p-1 rounded-xl shadow-xs leading-none">🎟️</span>
                          <div className="text-right">
                            <span className="text-amber-950 font-black text-xs block">
                              تم تأكيد حجز موعدك من السكرتارية الرقمية بنجاح!
                            </span>
                            <span className="text-[10px] text-amber-800 block leading-relaxed mt-0.5">
                              الموعد المعتمد: <strong>{getActiveBooking()?.dayName}، {getActiveBooking()?.formattedDate}</strong>. ساعات المناوبة: <strong>{formatTimeArabic(selectedWhatsAppDoc.startTime || '16:00')} - {formatTimeArabic(selectedWhatsAppDoc.endTime || '21:00')}</strong>.
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                          <span className="text-[10px] text-amber-900 bg-amber-100/60 px-3 py-1 rounded-lg border border-amber-250 font-extrabold shadow-3xs">
                            🎟️ حجز رقم: {getActiveBooking()?.queueNumber}
                          </span>
                        </div>
                      </div>
                    )}

                    {localStorage.getItem(`medpulse_free_review_${profile.email}_${selectedWhatsAppDoc.id}`) === 'true' ? (
                      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-200 px-4 py-3 flex items-center justify-between gap-3 text-right animate-fade-in font-sans">
                        <div className="flex items-start gap-2">
                          <span className="text-lg bg-white p-1 rounded-lg shadow-2xs leading-none">🧪</span>
                          <div className="text-right">
                            <span className="text-emerald-950 font-black text-xs block">
                              ✨ فترة مراجعة الفحوصات الطبية المجانية (معفاة من الكشفية) نشطة حالياً!
                            </span>
                            <span className="text-[10px] text-emerald-700 block leading-normal mt-0.5">
                              لقد قام د. {selectedWhatsAppDoc.name} بتفعيل خيار "المراجعة المجانية لنتائج التحاليل" لملفك. يمكنك الرجوع للدردشة مجاناً وإرسال الفحوصات أو الرد على الطبيب دون سداد كشفية جديدة حتى مراجعة حالتك بشكل نهائي!
                            </span>
                          </div>
                        </div>
                        <span className="bg-emerald-600 text-white text-[9px] font-black px-2 mt-1 rounded-lg py-1 select-none shrink-0 border border-emerald-750 shadow-2xs animate-pulse">
                          مراجعة نشطة ✅
                        </span>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border-b border-slate-200/60 px-4 py-2 text-right font-sans">
                        <span className="text-[10px] text-slate-500 leading-normal block">
                          🔒 <strong>معلومة الكشفية ومراجعة التحاليل الفنية:</strong> دورة الاستشارة تكون كشفية واحدة. في حال رغبة الطبيب بطلب فحوصات إضافية، سيقوم هو بتفعيل ميزة <strong>"طلب الفحوصات والمراجعة المجانية"</strong> من بوابته الخاصة لكي يتسنى لك تزويده بها مجاناً وبدون أي تكاليف جديدة.
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/30 border-b border-indigo-150 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl bg-white p-1 rounded-xl shadow-xs leading-none">🧪</span>
                      <div className="text-right">
                        {localStorage.getItem(`medpulse_free_review_${profile.email}_${selectedWhatsAppDoc.id}`) === 'true' ? (
                          <span className="text-indigo-900 font-extrabold text-xs block">
                            ✨ فترة مراجعة الفحوصات الطبية المجانية (معفاة من الكشفية) نشطة حالياً!
                          </span>
                        ) : (
                          <span className="text-slate-700 font-extrabold text-xs block">
                            طلب الفحوصات والمراجعة (لوحة تحكم الطبيب المعالج 🥼)
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 block leading-relaxed mt-0.5 font-sans whitespace-pre-line">
                          بإمكانك كطبيب تفعيل هذا الخيار لتمكين المريض من العودة معك مجاناً للمراجعة دون كشفية جديدة.
                          {simulationRole === 'doctor' && " 💡 (أنت الآن تستعرض دور الطبيب بفضل بوابات المعاينة)"}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const isCurrentlyActive = localStorage.getItem(`medpulse_free_review_${profile.email}_${selectedWhatsAppDoc.id}`) === 'true';
                        if (isCurrentlyActive) {
                          localStorage.removeItem(`medpulse_free_review_${profile.email}_${selectedWhatsAppDoc.id}`);
                          setFreeReviewDocIds(prev => prev.filter(id => id !== selectedWhatsAppDoc.id));
                          
                          // Add doctor message stating the review period is closed
                          const closedMsg = {
                            id: String(Date.now()),
                            sender: 'doctor' as const,
                            text: `🔒 تم إنهاء فترة مراجعة الفحوصات الطبية وإعادة ضبط رسوم الاستشارة. شكراً لكم وسنتمنى لكم دوام العافية وصحة مستدامة!`,
                            time: 'الآن'
                          };
                          setWaChats(prev => ({
                            ...prev,
                            [selectedWhatsAppDoc.id]: [...(prev[selectedWhatsAppDoc.id] || []), closedMsg]
                          }));
                        } else {
                          localStorage.setItem(`medpulse_free_review_${profile.email}_${selectedWhatsAppDoc.id}`, 'true');
                          setFreeReviewDocIds(prev => [...prev, selectedWhatsAppDoc.id]);
                          
                          // Push doctor message order lab tests
                          const labMsg = {
                            id: String(Date.now()),
                            sender: 'doctor' as const,
                            text: `🔬 أهلاً بك. لمتابعة آمنة، أطلب منك عمل الفحوصات المختبرية التالية (تحليل السكر التراكمي، رسم قلب ECG، والدهون الثلاثية).\n\n💡 لقد قمت الآن بتفعيل 'خيار المراجعة المجانية المعفاة من الكشفية (10 آلاف د.ع)' في ملفك. يمكنك الذهاب وعمل التحاليل ثم العودة وإرسالها هنا مجاناً عبر رفع الملفات لكي أقوم بمراجعتها وصرف الروشتة المناسبة لك بدون تكاليف إضافية!`,
                            time: 'الآن'
                          };
                          setWaChats(prev => ({
                            ...prev,
                            [selectedWhatsAppDoc.id]: [...(prev[selectedWhatsAppDoc.id] || []), labMsg]
                          }));
                        }
                      }}
                      className={`text-[10.5px] font-black px-3.5 py-2 rounded-xl border transition cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 shadow-xs ${
                        localStorage.getItem(`medpulse_free_review_${profile.email}_${selectedWhatsAppDoc.id}`) === 'true'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
                      }`}
                    >
                      {localStorage.getItem(`medpulse_free_review_${profile.email}_${selectedWhatsAppDoc.id}`) === 'true' ? (
                        <span>إنهاء المراجعة وإعادة القفل 🛑</span>
                      ) : (
                        <span>طلب فحوصات + تفعيل مراجعة مجانية 🧬</span>
                      )}
                    </button>
                  </div>
                )}

                {/* WhatsApp Interactive Virtual Call Screen Overlay */}
                {waCallState !== 'idle' && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col justify-between p-6 z-20 text-white animate-fade-in text-right">
                    {/* Call Header */}
                    <div className="flex items-start justify-between">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-2.5 text-right max-w-[200px]">
                        <span className="text-[10px] text-emerald-400 font-bold block">🟢 اختبار تدفق الصوت المباشر</span>
                        <span className="text-[9px] text-slate-350 leading-loose">
                          لتجنب أي أخطاء عند النشر، يقوم المحرك بإنشاء جودة VoIP مطابقة.
                        </span>
                      </div>
                      
                      <div className="text-center space-y-1">
                        <div className="h-14 w-14 bg-emerald-900/60 rounded-full flex items-center justify-center font-bold text-lg border border-emerald-500 mx-auto">
                          ⚕️
                        </div>
                        <h4 className="font-bold text-sm">{selectedWhatsAppDoc.name}</h4>
                        <p className="text-[10px] text-slate-350 font-sans">{selectedWhatsAppDoc.specialty}</p>
                        <span className="inline-block text-[10px] bg-emerald-500/25 px-2 py-0.5 rounded-full text-emerald-300 font-mono">
                          {waCallType === 'voice' ? 'اتصال صوتي مع الطبيب' : 'مكالمة مرئية مشفرة'}
                        </span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 font-mono text-[9px] text-slate-300">
                        <div className="flex items-center justify-between gap-2">
                          <span>الكمون (Ping):</span>
                          <strong className="text-emerald-400">14ms</strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>جودة الصوت:</span>
                          <strong className="text-emerald-400">99.2%</strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>البروتوكول:</span>
                          <strong className="text-indigo-400">SRTP Secure</strong>
                        </div>
                      </div>
                    </div>

                    {/* Call Body: Waves or video feed */}
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 my-2">
                      {waCallType === 'voice' ? (
                        <div className="relative flex items-center justify-center">
                          {/* Pulse wave rings */}
                          <div className="absolute h-28 w-28 bg-emerald-500/10 rounded-full animate-ping"></div>
                          <div className="absolute h-20 w-20 bg-emerald-500/20 rounded-full animate-pulse"></div>
                          <div className="h-16 w-16 bg-[#128C7E] rounded-full flex items-center justify-center relative">
                            <span className="text-2xl animate-bounce">🎙️</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full max-w-xs h-32 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center">
                          {/* Simulated video frame */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                          <span className="text-slate-400 text-xs font-sans text-center z-10 leading-relaxed font-bold">
                            📷 جاري مكاملة البث المرئي الطبي<br />
                            <span className="text-[10px] text-emerald-400 font-mono tracking-wide">Doctor Camera Feed Active (Simulated)</span>
                          </span>
                          {/* Mini user camera preview */}
                          <div className="absolute bottom-2 left-2 w-16 h-12 bg-slate-850 rounded border border-slate-700 font-mono text-[7px] flex items-center justify-center text-slate-500">
                            صورة المريض
                          </div>
                        </div>
                      )}

                      {/* Status and timer */}
                      <div className="text-center space-y-1">
                        <span className="text-xs font-bold block text-slate-200">{waCallStatusMsg}</span>
                        {waCallState === 'connected' && (
                          <span className="text-xs font-mono font-bold text-amber-400">
                            الوقت المستغرق: {Math.floor(waCallSeconds / 60)}:{(waCallSeconds % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>

                      {/* Clinical audio output logs with speech feedback */}
                      {waCallTranscripts.length > 0 && (
                        <div className="w-full max-w-md bg-slate-900/85 border border-slate-800/80 rounded-2xl p-3 text-[11px] leading-relaxed max-h-[85px] overflow-y-auto text-right font-sans scrollbar-thin scrollbar-thumb-slate-700">
                          <p className="text-[10px] font-bold text-amber-500 mb-1 flex items-center gap-1 justify-start">
                            <span>🔊 استلام تدفق الصوت حياً (الصوت والكلمات من الطبيب):</span>
                          </p>
                          <div className="space-y-1">
                            {waCallTranscripts.map((t, i) => (
                              <p key={i} className="text-slate-200">{t}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Call Footer: End button */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={endVirtualWhatsAppCall}
                        className="bg-red-650 hover:bg-red-750 text-white font-bold px-8 py-3 rounded-full text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>إنهاء مكالمة واتساب ونقل المحادثة 📞</span>
                      </button>
                    </div>

                    <div className="text-[9px] text-center text-slate-500 mt-2">
                      خدمة اختبار الصوت VoIP لـ WhatsApp مشفرة بالكامل. في النظام الخارجي الحقيقي، يتم استخدام هذه الخدمة عبر هاتف الطبيب المسجل لدعم الرعاية المتنقلة بمرونة.
                    </div>
                  </div>
                )}

                {/* Messages scroll content */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col max-h-[300px]">
                  {/* Static disclaimer */}
                  <div className="mx-auto bg-amber-100 text-amber-900 border border-amber-200/50 text-[10px] px-3 py-1.5 rounded-xl text-center shadow-xs max-w-sm mb-2 leading-relaxed font-sans">
                    🔒 تشفير الأمان: تجري هذه المحادثة الافتراضية محلياً لتجهيز التقرير، ثم يتم نقلها لتطبيق واتساب الخارجي فور تفعيله.
                  </div>

                  {/* Message loop */}
                  {(waChats[selectedWhatsAppDoc.id] || []).map((msg) => {
                    const isUser = msg.sender === 'patient';
                    const emailMatch = msg.text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
                    const matchedEmail = emailMatch ? emailMatch[0] : null;

                    return (
                      <div 
                        key={msg.id} 
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs leading-relaxed ${
                          isUser 
                            ? 'bg-[#DCF8C6] text-slate-800 ml-auto rounded-tl-none self-end' 
                            : 'bg-white text-slate-800 mr-auto rounded-tr-none self-start text-right'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        
                        {/* Interactive digital prescription writing trigger shortcut if patient email is present */}
                        {matchedEmail && onWriteRxForPatient && (
                          <div className="mt-2.5 pt-2 border-t border-emerald-200 text-right flex flex-col gap-1.5">
                            <span className="text-[9px] text-emerald-800 font-bold block">🩹 نظام الطبيب المكامل:</span>
                            <button
                              type="button"
                              onClick={() => onWriteRxForPatient(matchedEmail)}
                              className="w-full flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs border border-indigo-500 hover:shadow-sm"
                            >
                              <span>📝 تحويل وكتابة وصفة للمستفيد ({matchedEmail})</span>
                            </button>
                          </div>
                        )}

                        <span className="block text-[8px] text-slate-400 text-left mt-1 opacity-80">{msg.time}</span>
                      </div>
                    );
                  })}

                  {/* Typing simulator */}
                  {isWaTyping && (
                    <div className="bg-white text-slate-650 rounded-2xl rounded-tr-none max-w-xs p-3 text-xs italic self-start flex items-center gap-1 text-right">
                      <span className="h-1 bg-emerald-600 rounded-full w-1 animate-bounce inline-block"></span>
                      <span className="h-1 bg-emerald-600 rounded-full w-1 animate-bounce inline-block delay-100"></span>
                      <span className="h-1 bg-emerald-600 rounded-full w-1 animate-bounce inline-block delay-200"></span>
                      <span>{selectedWhatsAppDoc.name} يكتب الرد السريري الآن...</span>
                    </div>
                  )}
                </div>

                {/* Form to submit local virtual chat & WhatsApp trigger link generate */}
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  {/* Dynamic Vital Signs / Biometrics Panel */}
                  <div className="mb-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-right animate-fade-in">
                    <span className="text-[11px] font-bold text-slate-700 block mb-2 font-sans flex items-center gap-1 justify-start">
                      🩺 العلامات الحيوية والمؤشرات المقاسة الحالية للمريض:
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      <div className="bg-white border border-slate-200 rounded-lg p-1.5 text-center">
                        <span className="block text-[8px] font-bold text-slate-400">العمر (سنة)</span>
                        <input 
                          type="number"
                          className="w-full bg-transparent text-center font-mono font-bold text-slate-800 text-xs focus:outline-none"
                          value={patientAgeStr}
                          onChange={(e) => setPatientAgeStr(e.target.value)}
                        />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-1.5 text-center">
                        <span className="block text-[8px] font-bold text-slate-400">الوزن (كجم)</span>
                        <input 
                          type="number"
                          className="w-full bg-transparent text-center font-mono font-bold text-slate-800 text-xs focus:outline-none"
                          value={patientWeightStr}
                          onChange={(e) => setPatientWeightStr(e.target.value)}
                        />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-1.5 text-center">
                        <span className="block text-[8px] font-bold text-slate-400">الطول (سم)</span>
                        <input 
                          type="number"
                          className="w-full bg-transparent text-center font-mono font-bold text-slate-800 text-xs focus:outline-none"
                          value={patientHeightStr}
                          onChange={(e) => setPatientHeightStr(e.target.value)}
                        />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-1.5 text-center">
                        <span className="block text-[8px] font-bold text-slate-400">ضغط الدم</span>
                        <input 
                          type="text"
                          className="w-full bg-transparent text-center font-mono font-bold text-slate-850 text-xs focus:outline-none"
                          value={bloodPressure}
                          onChange={(e) => setBloodPressure(e.target.value)}
                        />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-1.5 text-center">
                        <span className="block text-[8px] font-bold text-slate-400">السكري</span>
                        <input 
                          type="text"
                          className="w-full bg-transparent text-center font-mono font-bold text-slate-850 text-xs focus:outline-none"
                          value={bloodSugar}
                          onChange={(e) => setBloodSugar(e.target.value)}
                        />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-1.5 text-center">
                        <span className="block text-[8px] font-bold text-slate-400">الأكسجين %</span>
                        <input 
                          type="text"
                          className="w-full bg-transparent text-center font-mono font-bold text-slate-850 text-xs focus:outline-none"
                          value={oxygenLevel}
                          onChange={(e) => setOxygenLevel(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload progress indicator */}
                  {isUploading && (
                    <div className="mb-3 bg-indigo-50 border border-indigo-150 rounded-xl p-3 text-right space-y-1.5 animate-pulse">
                      <div className="flex items-center justify-between text-[11px] font-bold text-indigo-800">
                        <span>جاري رفع وتأمين السجل الطبي على السحابة الآمنة...</span>
                        <span className="font-mono">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <span className="text-[9px] text-indigo-550 block leading-relaxed">
                        * يتم ضغط وصيانة الملف قبل التمرير السحابي لتخفيف الضغط على خوادم المنصة الرئيسية.
                      </span>
                    </div>
                  )}

                  {/* Uploaded files representation list */}
                  {uploadedFiles.length > 0 && (
                    <div className="mb-3 bg-white/80 border border-slate-200 rounded-xl p-3 space-y-2 text-right">
                      <span className="text-[10px] font-extrabold text-emerald-800 block flex items-center gap-1 justify-start">
                        📎 المرفقات والتحاليل المجهزة سحابياً لتوصيلها للطبيب:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {uploadedFiles.map((file) => (
                          <div key={file.id} className="bg-emerald-50/50 border border-emerald-150 px-3 py-1.5 rounded-lg flex items-center gap-2 text-right transition hover:bg-emerald-50">
                            <span className="text-base">{file.type === 'pdf' ? '📄' : '🖼️'}</span>
                            <div className="text-right min-w-[120px]">
                              <span className="block text-[11px] font-bold text-slate-800 truncate max-w-[150px]" title={file.name}>
                                {file.name}
                              </span>
                              <span className="block text-[9px] text-slate-400 font-mono">{file.size}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
                              }}
                              className="text-rose-650 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 p-1 w-5 h-5 rounded-full flex items-center justify-center transition text-[10px] cursor-pointer"
                              title="حذف المرفق"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSendWhatsAppMessage} className="flex gap-2 items-center">
                    <input 
                      type="file"
                      id="clinical-file-uploader"
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (!selectedFile) return;

                        setIsUploading(true);
                        setUploadProgress(10);

                        let progress = 10;
                        const interval = setInterval(() => {
                          progress += 30;
                          if (progress >= 100) {
                            clearInterval(interval);
                            setUploadProgress(100);

                            setTimeout(() => {
                              const fileId = 'rec_' + Math.floor(1000 + Math.random() * 9000);
                              const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf');
                              const fileUrl = `https://cdn.medpulse.health/secure-records/${profile.email.replace(/[@.]/g, '_')}_${fileId}.${isPdf ? 'pdf' : 'jpg'}`;
                              
                              const newFile: UploadedFile = {
                                id: fileId,
                                name: selectedFile.name,
                                url: fileUrl,
                                type: isPdf ? 'pdf' : 'image',
                                size: (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB',
                                uploadedAt: 'الآن'
                              };

                              setUploadedFiles(prev => [...prev, newFile]);
                              setIsUploading(false);
                              setUploadProgress(0);
                            }, 400);
                          } else {
                            setUploadProgress(progress);
                          }
                        }, 120);
                      }}
                    />
                    
                    <button
                      type="button"
                      onClick={() => document.getElementById('clinical-file-uploader')?.click()}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-full shrink-0 text-slate-700 transition flex items-center justify-center cursor-pointer shadow-xs"
                      title="إرفاق تقارير طبية، تحاليل، أو صور قياسات الضغط والسكري سحابياً"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input 
                      type="text" required
                      placeholder="اذكر تفاصيل حالتك (مثال: مستويات السكري لدي 160 بعد ساعة ونصف)..."
                      className="flex-1 bg-white border border-slate-300 rounded-full px-4 py-2.5 text-xs focus:outline-emerald-650 text-right font-sans"
                      value={waText}
                      onChange={(e) => setWaText(e.target.value)}
                    />
                    <button
                      type="submit"
                      title="إرسال للعرض داخل المحاكاة والتحضير"
                      className="bg-[#128C7E] hover:bg-[#075E54] text-white p-2.5 rounded-full shrink-0 transition cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Real Direct WhatsApp External launch trigger */}
                  <div className="mt-3 flex flex-col gap-1.5 text-right font-sans">
                    <a
                      href={`https://wa.me/${(profile.role === 'doctor' ? (selectedWhatsAppDoc.whatsappPhone || "+966500000000") : MEDIATOR_WHATSAPP_PHONE).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        generateWhatsAppMessage(waText.trim() || "السلام عليكم دكتور، أود الحصول على استشارتكم الطبية بخصوص مؤشراتي الحيوية ومتابعة حالتي الصحية.")
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-[11.5px] font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      إرسال رسالتك والتحاليل والمرفقات كاملة للطبيب عبر تطبيق WhatsApp الفعلي 💬
                    </a>
                    
                    {profile.role === 'patient' ? (
                      <span className="text-[9.5px] text-amber-800 bg-amber-50 rounded-lg p-2 border border-amber-200/50 leading-relaxed font-sans mt-1 block">
                        🔒 <strong>حماية الخصوصية:</strong> لضمان حجب خصوصية الأطباء، يتم ربط المكالمة وإجراء الإجابة من خلال رقم وساطة المنصة الموحد <strong>({MEDIATOR_WHATSAPP_PHONE})</strong> بطريقة تمنع تسريب الرقم الشخصي للطبيب لسلامته ووقاره المهني.
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-500 font-sans text-center block">
                        * اضغط على الزر الأخضر أعلاه لإرسال الرسالة التي كتبتها + مؤشراتك الحيوية المكاملة لهاتف المستفيد.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
                <span className="text-4xl text-slate-350">💬</span>
                <p className="font-bold text-sm text-slate-700">الرجاء اختيار طبيب من القائمة اليمنى</p>
                <p className="text-xs">بمجرد اختيار الطبيب، يمكنك بدء خطة المراسلة الطبية الفورية عبر واتساب.</p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
