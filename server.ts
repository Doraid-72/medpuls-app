import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import ws from "ws";

// Resolve the correct WebSocket constructor class (safe from default-export wrapper issues in ESBuild CJS bundler outputs)
const WebSocketClass = (ws as any)?.WebSocket || (ws as any)?.default || ws;

// Polyfill global WebSocket for Node environments lacking native WebSocket support (e.g. Node <= 20)
if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as any).WebSocket = WebSocketClass;
}
if (typeof global === "object" && typeof (global as any).WebSocket === "undefined") {
  (global as any).WebSocket = WebSocketClass;
}
import { 
  UserHealthProfile, 
  Prescription, 
  TwilioConfig, 
  ChatMessage, 
  DietPlan,
  DoctorInfo,
  PharmacyInfo,
  MedicalSession
} from "./src/types";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Enable CORS for all domains, including custom domains like medpulse-iq.com
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-email");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// -------------------------------------------------------------
// SECURE GEMINI CLIENT INITIALIZATION (LAZY & SAFE)
// -------------------------------------------------------------
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. Falling back to key validation gracefully.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_IF_ABSENT",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// IN-MEMORY DATABASE STATE (RESTORED WITH MEDICALLY POLISHED DATA)
// -------------------------------------------------------------
let usersList: UserHealthProfile[] = [
  {
    name: "مدير النظام الطبي",
    email: "admin@medpulse.com",
    role: "admin",
    age: 40,
    weight: 75,
    height: 178,
    chronicConditions: [],
    subscriptionType: "Premium",
    additionalMeds: [],
    targetWeight: 75,
    dailyCalorieBudget: 2200
  }
];

let prescriptions: Prescription[] = [];

let clinicalSessions: MedicalSession[] = [
  {
    id: "session_jaber_dr_1",
    patientEmail: "jaber@gmail.com",
    patientName: "جابر الموسوي",
    doctorId: "dr_1",
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
    doctorId: "dr_1",
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
    doctorId: "dr_1",
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
    doctorId: "dr_2",
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

let twilioConfig: TwilioConfig = {
  phoneNumber: "+18146313222",
  accountSid: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authToken: "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
  webhookUrl: "https://api.medpulse.com/v1/voice-webhook",
  isCallbotActive: true
};

let doctorsList: DoctorInfo[] = [
  {
    id: "dr_1",
    name: "د. أحمد الخفاجي",
    email: "ahmed@medpulse.com",
    specialty: "أخصائي الغدد الصماء والسكري الكلي",
    hospital: "مستشفى ابن سينا التعليمي - بغداد",
    rating: 5.0,
    whatsappPhone: "+9647716662902",
    isPaid: true,
    availabilityType: '24/7',
    startTime: '16:00',
    endTime: '21:00',
    workingDays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
    consultationFee: 20000,
    maxPatientsPerDay: 15,
    platformPercentage: 0
  },
  {
    id: "dr_2",
    name: "د. سارة التميمي",
    email: "sara@medpulse.com",
    specialty: "أخصائية أمراض القلب والضغط التراكمي",
    hospital: "مستشفى مدينة الطب - بغداد",
    rating: 4.9,
    whatsappPhone: "+9647701234567",
    isPaid: true,
    availabilityType: 'custom',
    startTime: '10:00',
    endTime: '15:00',
    workingDays: ["السبت", "الاثنين", "الأربعاء"],
    consultationFee: 25000,
    maxPatientsPerDay: 10,
    platformPercentage: 0
  }
];

let pharmaciesList: PharmacyInfo[] = [
  {
    id: "ph_1",
    name: "صيدلية بابل الكبرى",
    district: "بغداد - الحارثية",
    lat: 33.3248,
    lng: 44.3644,
    phone: "+9647711223344",
    address: "الشارع الخدمي، قرب مستشفى اليرموك، بغداد"
  },
  {
    id: "ph_2",
    name: "صيدلية السعادة المركزية",
    district: "البصرة - العشار",
    lat: 30.5081,
    lng: 47.8181,
    phone: "+9647709988776",
    address: "شارع الاستقلال، مقابل بناية التأمين، البصرة"
  }
];

// Persistent Booking Registry (synchronized across devices)
let bookingsRegistry: Array<{ doctorId: string, patientEmail: string, dateKey: string, queueNumber: number }> = [];

// Current Session State User Helper
let currentUserEmail = "admin@medpulse.com";

function getRequestUserEmail(req: any): string {
  const headerEmail = req.headers['x-user-email'];
  if (headerEmail && typeof headerEmail === 'string' && headerEmail.trim() !== '') {
    return headerEmail.trim().toLowerCase();
  }
  return currentUserEmail.toLowerCase();
}

// Simple in-memory cache to avoid hitting Gemini API quota limitations for identical patient profile requests
const calorieAndDietCache = new Map<string, any>();

// -------------------------------------------------------------
// SUPABASE SYNC SERVICE (REAL-TIME CLOUD PERSISTENCE)
// -------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || "";
// Note: Row-Level Security (RLS) can block server upserts if using a publishable anon key.
// To bypass RLS and allow full server sync, define SUPABASE_SERVICE_ROLE_KEY in your server environment variables.
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || "";

// Robust configuration detection to prevent crashing or continuous abnormal socket errors when not configured
const isSupabaseConfigured = !!(
  SUPABASE_URL && 
  SUPABASE_URL.startsWith("https://") && 
  !SUPABASE_URL.includes("xyz.supabase.co") && 
  !SUPABASE_URL.includes("your-project") && 
  SUPABASE_KEY &&
  !SUPABASE_KEY.includes("your-anon-key") &&
  !SUPABASE_KEY.includes("your-service-role-key")
);

let supabase: any = null;
let isSupabaseInitAttempted = false;

async function getSupabaseClient() {
  if (isSupabaseInitAttempted) return supabase;
  isSupabaseInitAttempted = true;

  if (isSupabaseConfigured) {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY) {
      console.log("🔌 [MedPulse Supabase] Initializing client dynamically with SERVICE_ROLE key (bypassing Row-Level Security).");
    } else {
      console.log("🔌 [MedPulse Supabase] Initializing client dynamically with project URL:", SUPABASE_URL);
    }
    try {
      const { createClient } = await import("@supabase/supabase-js");
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false
        },
        realtime: {
          transport: WebSocketClass as any,
          heartbeatIntervalMs: 15000,
          params: {
            eventsPerSecond: 10
          }
        }
      });
    } catch (err: any) {
      console.warn("⚠️ [MedPulse Supabase] Failed to initialize Supabase client dynamically (is @supabase/supabase-js installed?):", err.message || err);
      supabase = null;
    }
  } else {
    console.log("ℹ️ [MedPulse Supabase] Supabase is NOT configured or has placeholder values. Using local JSON database (medpulse_db.json) fallback.");
  }
  return supabase;
}

let lastReceivedUpdatedAt = "";

let sseClients: any[] = [];

function broadcastUpdate(type: string = "update") {
  const payload = {
    usersList,
    prescriptions,
    doctorsList,
    pharmaciesList,
    twilioConfig,
    clinicalSessions,
    bookingsRegistry
  };
  const serialized = JSON.stringify({ type, data: payload });
  sseClients.forEach(client => {
    try {
      client.write(`data: ${serialized}\n\n`);
    } catch (e) {
      // client connection might be closed
    }
  });
}

// Define collections in Firestore
let isSyncingToSupabase = false;

// Helper to encode emails safely as row IDs
function encodeEmail(email: string): string {
  return email.toLowerCase().replace(/[^a-zA-Z0-9@._-]/g, "_");
}

// Utility to check if two lists of objects are identical (prevents recursive loops)
function isIdentical(arr1: any[], arr2: any[]): boolean {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length !== arr2.length) return false;
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

// Helper to write changes locally to disk cache
function saveDbLocalOnly() {
  try {
    const data = {
      usersList,
      prescriptions,
      doctorsList,
      pharmaciesList,
      twilioConfig,
      clinicalSessions
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("❌ Failed to write local cache DB_FILE:", e);
  }
}

// Handler functions for real-time Postgres changes from Supabase
function handleDoctorsChange(payload: any) {
  if (isSyncingToSupabase) return;
  if (payload.eventType === 'DELETE') {
    const deletedId = payload.old?.id;
    if (deletedId) {
      doctorsList = doctorsList.filter(d => d.id !== deletedId);
      saveDbLocalOnly();
      broadcastUpdate("doctors_sync");
    }
    return;
  }
  
  const newRecord = payload.new;
  if (!newRecord || !newRecord.data) return;
  const docData = newRecord.data as DoctorInfo;
  
  const index = doctorsList.findIndex(d => d.id === docData.id);
  if (index !== -1) {
    if (JSON.stringify(doctorsList[index]) !== JSON.stringify(docData)) {
      doctorsList[index] = docData;
      saveDbLocalOnly();
      broadcastUpdate("doctors_sync");
    }
  } else {
    doctorsList.push(docData);
    saveDbLocalOnly();
    broadcastUpdate("doctors_sync");
  }
}

function handlePharmaciesChange(payload: any) {
  if (isSyncingToSupabase) return;
  if (payload.eventType === 'DELETE') {
    const deletedId = payload.old?.id;
    if (deletedId) {
      pharmaciesList = pharmaciesList.filter(p => p.id !== deletedId);
      saveDbLocalOnly();
      broadcastUpdate("pharmacies_sync");
    }
    return;
  }
  
  const newRecord = payload.new;
  if (!newRecord || !newRecord.data) return;
  const pharData = newRecord.data as PharmacyInfo;
  
  const index = pharmaciesList.findIndex(p => p.id === pharData.id);
  if (index !== -1) {
    if (JSON.stringify(pharmaciesList[index]) !== JSON.stringify(pharData)) {
      pharmaciesList[index] = pharData;
      saveDbLocalOnly();
      broadcastUpdate("pharmacies_sync");
    }
  } else {
    pharmaciesList.push(pharData);
    saveDbLocalOnly();
    broadcastUpdate("pharmacies_sync");
  }
}

function handlePrescriptionsChange(payload: any) {
  if (isSyncingToSupabase) return;
  if (payload.eventType === 'DELETE') {
    const deletedId = payload.old?.id;
    if (deletedId) {
      prescriptions = prescriptions.filter(p => p.id !== deletedId);
      saveDbLocalOnly();
      broadcastUpdate("prescriptions_sync");
    }
    return;
  }
  
  const newRecord = payload.new;
  if (!newRecord || !newRecord.data) return;
  const presData = newRecord.data as Prescription;
  
  const index = prescriptions.findIndex(p => p.id === presData.id);
  if (index !== -1) {
    if (JSON.stringify(prescriptions[index]) !== JSON.stringify(presData)) {
      prescriptions[index] = presData;
      prescriptions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveDbLocalOnly();
      broadcastUpdate("prescriptions_sync");
    }
  } else {
    prescriptions.push(presData);
    prescriptions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    saveDbLocalOnly();
    broadcastUpdate("prescriptions_sync");
  }
}

function handleUsersChange(payload: any) {
  if (isSyncingToSupabase) return;
  if (payload.eventType === 'DELETE') {
    const deletedId = payload.old?.id;
    if (deletedId) {
      usersList = usersList.filter(u => encodeEmail(u.email) !== deletedId);
      saveDbLocalOnly();
      broadcastUpdate("users_sync");
    }
    return;
  }
  
  const newRecord = payload.new;
  if (!newRecord || !newRecord.data) return;
  const userData = newRecord.data as UserHealthProfile;
  
  const index = usersList.findIndex(u => u.email.toLowerCase() === userData.email.toLowerCase());
  if (index !== -1) {
    if (JSON.stringify(usersList[index]) !== JSON.stringify(userData)) {
      usersList[index] = userData;
      saveDbLocalOnly();
      broadcastUpdate("users_sync");
    }
  } else {
    usersList.push(userData);
    saveDbLocalOnly();
    broadcastUpdate("users_sync");
  }
}

function handleSessionsChange(payload: any) {
  if (isSyncingToSupabase) return;
  if (payload.eventType === 'DELETE') {
    const deletedId = payload.old?.id;
    if (deletedId) {
      clinicalSessions = clinicalSessions.filter(s => s.id !== deletedId);
      saveDbLocalOnly();
      broadcastUpdate("sessions_sync");
    }
    return;
  }
  
  const newRecord = payload.new;
  if (!newRecord || !newRecord.data) return;
  const sessData = newRecord.data as MedicalSession;
  
  const index = clinicalSessions.findIndex(s => s.id === sessData.id);
  if (index !== -1) {
    if (JSON.stringify(clinicalSessions[index]) !== JSON.stringify(sessData)) {
      clinicalSessions[index] = sessData;
      saveDbLocalOnly();
      broadcastUpdate("sessions_sync");
    }
  } else {
    clinicalSessions.push(sessData);
    saveDbLocalOnly();
    broadcastUpdate("sessions_sync");
  }
}

function handleConfigChange(payload: any) {
  if (isSyncingToSupabase) return;
  if (payload.eventType === 'DELETE') return;
  
  const newRecord = payload.new;
  if (!newRecord || newRecord.id !== 'twilio' || !newRecord.data) return;
  const configData = newRecord.data as TwilioConfig;
  
  if (JSON.stringify(twilioConfig) !== JSON.stringify(configData)) {
    twilioConfig = configData;
    saveDbLocalOnly();
    broadcastUpdate("config_sync");
  }
}

async function loadFromSupabase() {
  const client = await getSupabaseClient();
  if (!client) {
    console.info("ℹ️ [MedPulse Supabase] Skipping load from Supabase (not configured).");
    return;
  }
  const supabase = client;
  try {
    console.log("⏳ [MedPulse Supabase] Syncing all main collections from Supabase...");

    // 1. Load Doctors
    const { data: doctorsData, error: doctorsErr } = await supabase.from('doctors').select('*');
    if (doctorsData && doctorsData.length > 0) {
      doctorsList = doctorsData.map(r => r.data as DoctorInfo);
    } else if (doctorsErr) {
      console.warn("⚠️ doctors table load issue or empty. Details:", doctorsErr.message);
    }

    // 2. Load Pharmacies
    const { data: pharmaciesData, error: pharmaciesErr } = await supabase.from('pharmacies').select('*');
    if (pharmaciesData && pharmaciesData.length > 0) {
      pharmaciesList = pharmaciesData.map(r => r.data as PharmacyInfo);
    } else if (pharmaciesErr) {
      console.warn("⚠️ pharmacies table load issue or empty. Details:", pharmaciesErr.message);
    }

    // 3. Load Prescriptions
    const { data: prescriptionsData, error: prescriptionsErr } = await supabase.from('prescriptions').select('*');
    if (prescriptionsData && prescriptionsData.length > 0) {
      const loadedPrescriptions = prescriptionsData.map(r => r.data as Prescription);
      loadedPrescriptions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      prescriptions = loadedPrescriptions;
    } else if (prescriptionsErr) {
      console.warn("⚠️ prescriptions table load issue or empty. Details:", prescriptionsErr.message);
    }

    // 4. Load Users
    const { data: usersData, error: usersErr } = await supabase.from('users_profiles').select('*');
    if (usersData && usersData.length > 0) {
      usersList = usersData.map(r => r.data as UserHealthProfile);
    } else if (usersErr) {
      console.warn("⚠️ users_profiles table load issue or empty. Details:", usersErr.message);
    }

    // 5. Load Twilio Configuration
    const { data: configData, error: configErr } = await supabase.from('system_config').select('*').eq('id', 'twilio').maybeSingle();
    if (configData && configData.data) {
      twilioConfig = configData.data as TwilioConfig;
    } else if (configErr) {
      console.warn("⚠️ system_config table load issue. Details:", configErr.message);
    }

    // 6. Load Clinical Sessions
    const { data: sessionsData, error: sessionsErr } = await supabase.from('clinical_sessions').select('*');
    if (sessionsData && sessionsData.length > 0) {
      clinicalSessions = sessionsData.map(r => r.data as MedicalSession);
    } else if (sessionsErr) {
      console.warn("⚠️ clinical_sessions table load issue or empty. Details:", sessionsErr.message);
    }

    console.log("🔥 [MedPulse Supabase] Successfully restored all collections from Supabase!");
  } catch (err: any) {
    console.warn("⚠️ [MedPulse Supabase] Failed loading collections from Supabase. Attempting to seed locally...", err.message || err);
    await saveToSupabase();
  }
}

// Reconcile and mirror local state arrays perfectly with Supabase tables
async function saveToSupabase() {
  const client = await getSupabaseClient();
  if (!client) return;
  const supabase = client;
  isSyncingToSupabase = true;
  try {
    console.log("🔥 [MedPulse Supabase] Reconciling and mirroring local database to Supabase tables...");

    const reconcileTable = async (tableName: string, localList: any[], idField: string) => {
      const { data: remoteRows, error: selectErr } = await supabase.from(tableName).select('id');
      if (selectErr) {
        console.warn(`⚠️ Error selecting from table ${tableName}:`, selectErr.message);
        return;
      }
      
      const remoteIds = new Set<string>((remoteRows || []).map(r => String((r as any).id)));
      const localIds = new Set<string>(localList.map(item => String(idField === "email" ? encodeEmail(item[idField]) : item[idField])));

      // Delete removed rows from Supabase
      const toDelete = Array.from(remoteIds).filter(id => !localIds.has(id));
      if (toDelete.length > 0) {
        console.log(`🗑️ [Supabase Sync] Deleting obsolete records from ${tableName}:`, toDelete);
        await supabase.from(tableName).delete().in('id', toDelete);
      }

      // Upsert local rows to Supabase
      const upsertData = localList.map(item => {
        const idVal = String(idField === "email" ? encodeEmail(item[idField]) : item[idField]);
        return {
          id: idVal,
          data: item,
          updated_at: new Date().toISOString()
        };
      });

      if (upsertData.length > 0) {
        const { error: upsertErr } = await supabase.from(tableName).upsert(upsertData);
        if (upsertErr) {
          console.warn(`⚠️ Error upserting to ${tableName}:`, upsertErr.message);
        }
      }
    };

    // Parallel execution for peak performance
    await Promise.all([
      reconcileTable('doctors', doctorsList, 'id'),
      reconcileTable('pharmacies', pharmaciesList, 'id'),
      reconcileTable('prescriptions', prescriptions, 'id'),
      reconcileTable('users_profiles', usersList, 'email'),
      reconcileTable('clinical_sessions', clinicalSessions, 'id'),
      supabase.from('system_config').upsert({ id: 'twilio', data: twilioConfig, updated_at: new Date().toISOString() })
    ]);

    console.log("✅ [MedPulse Supabase] Global multi-table Supabase mirroring completed successfully.");
  } catch (err: any) {
    console.warn("⚠️ [MedPulse Supabase] Failed multi-table Supabase sync:", err.message || err);
  } finally {
    setTimeout(() => {
      isSyncingToSupabase = false;
    }, 1000);
  }
}

async function subscribeToSupabase() {
  const client = await getSupabaseClient();
  if (!client) {
    console.info("ℹ️ [MedPulse Supabase] Skipping real-time subscription (not configured).");
    return;
  }
  const supabase = client;
  try {
    console.log("📡 [MedPulse Supabase Real-time] Establishing multi-table real-time subscriptions...");

    const channel = supabase
      .channel('medpulse-postgres-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, handleDoctorsChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pharmacies' }, handlePharmaciesChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, handlePrescriptionsChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users_profiles' }, handleUsersChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinical_sessions' }, handleSessionsChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_config' }, handleConfigChange)
      .subscribe((status, err) => {
        if (err) {
          const errMsg = err.message || String(err);
          if (errMsg.includes("1006") || errMsg.includes("socket closed")) {
            console.info("📡 [MedPulse Supabase Real-time] Connection temporarily idle/reconnecting (socket closed: 1006).");
          } else {
            console.warn("⚠️ [MedPulse Supabase Real-time] Subscription error/retry:", errMsg);
          }
        } else {
          if (status === "SUBSCRIBED") {
            console.log("📡 [MedPulse Supabase Real-time] Channel successfully subscribed.");
          } else if (status === "CLOSED") {
            console.info("📡 [MedPulse Supabase Real-time] Channel connection closed (initiating automatic reconnect)...");
          } else if (status === "TIMED_OUT") {
            console.warn("⚠️ [MedPulse Supabase Real-time] Channel subscription timed out (retrying)...");
          } else {
            console.log(`📡 [MedPulse Supabase Real-time] Channel subscription status: ${status}`);
          }
        }
      });
  } catch (err: any) {
    console.warn("⚠️ [MedPulse Supabase Real-time] Failed to register multi-table listeners:", err.message || err);
  }
}

// -------------------------------------------------------------
// DYNAMIC FILE-BASED PERSISTENT DATABASE ENGINE
// -------------------------------------------------------------
const DB_FILE = path.join(process.cwd(), "medpulse_db.json");

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      if (data.usersList) usersList = data.usersList;
      if (data.prescriptions) prescriptions = data.prescriptions;
      if (data.doctorsList && Array.isArray(data.doctorsList) && data.doctorsList.length > 0) doctorsList = data.doctorsList;
      if (data.pharmaciesList && Array.isArray(data.pharmaciesList) && data.pharmaciesList.length > 0) pharmaciesList = data.pharmaciesList;
      if (data.twilioConfig) twilioConfig = data.twilioConfig;
      if (data.clinicalSessions) clinicalSessions = data.clinicalSessions;
      if (data.bookingsRegistry && Array.isArray(data.bookingsRegistry)) bookingsRegistry = data.bookingsRegistry;
      console.log("💾 MedPulse Database load: restored from " + DB_FILE);
    } else {
      saveDb();
    }
  } catch (err) {
    console.error("❌ Failed to load/parse database file:", err);
  }
}

function saveDb() {
  try {
    const data = {
      usersList,
      prescriptions,
      doctorsList,
      pharmaciesList,
      twilioConfig,
      clinicalSessions,
      bookingsRegistry
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    console.log("💾 MedPulse Database write: persisted successfully back to " + DB_FILE);
    
    // Asynchronously back up database changes to Supabase
    saveToSupabase().catch(err => {
      console.warn("⚠️ Failed async save to Supabase:", err);
    });
    
    // Broadcast the updated state to all connected Server-Sent Events clients
    broadcastUpdate("update");
  } catch (err) {
    console.error("❌ Failed to save database file:", err);
  }
}

// Auto-boot sequence database restoration
loadDb();
loadFromSupabase().then(() => {
  // Overwrite the local cache file once Supabase is successfully restored
  try {
    const data = {
      usersList,
      prescriptions,
      doctorsList,
      pharmaciesList,
      twilioConfig,
      clinicalSessions
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {}
  
  // Establish real-time sync with Supabase and other connected locations
  subscribeToSupabase();
}).catch(err => {
  console.warn("⚠️ Failed startup Supabase restoration sync:", err.message || err);
  // Fail-safe: try subscribing to Supabase updates even if initial load had issues
  subscribeToSupabase();
});

// -------------------------------------------------------------
// ENDPOINTS
// -------------------------------------------------------------

// Auth simulator
app.post("/api/login", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Force sync matching doctor details if they exist in doctorsList
  const matchingDoc = doctorsList.find(d => d.email.toLowerCase() === email.toLowerCase());
  if (matchingDoc) {
    const existingUser = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      existingUser.role = 'doctor';
      existingUser.name = matchingDoc.name;
      saveDb();
    } else {
      usersList.push({
        name: matchingDoc.name,
        email: matchingDoc.email,
        role: 'doctor',
        age: 42,
        weight: 78,
        height: 175,
        chronicConditions: [],
        subscriptionType: "Premium",
        additionalMeds: [],
        targetWeight: 75,
        dailyCalorieBudget: 2100
      });
      saveDb();
    }
  }

  const user = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    currentUserEmail = user.email;
    res.json({ success: true, user });
  } else {
    // Return or create new patient automatically if new email to ease onboarding
    const newPatient: UserHealthProfile = {
      name: email.split('@')[0],
      email: email,
      role: email.includes('admin') ? 'admin' : email.includes('dr') ? 'doctor' : 'patient',
      age: 38,
      weight: 85,
      height: 170,
      chronicConditions: ["obesity"],
      subscriptionType: "Basic",
      additionalMeds: [],
      targetWeight: 75,
      dailyCalorieBudget: 1800
    };
    usersList.push(newPatient);
    saveDb();
    currentUserEmail = email;
    res.json({ success: true, user: newPatient });
  }
});

app.post("/api/register", (req, res) => {
  const { name, email, age, weight, height, chronicConditions, targetWeight, role, secondaryNotes } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  
  const existing = usersList.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ error: "المستخدم مسجل مسبقاً بهذا البريد الإلكتروني" });
  }

  const newUser: UserHealthProfile = {
    name: name || "مستفيد جديد",
    email,
    role: role || "patient",
    age: Number(age) || 30,
    weight: Number(weight) || 75,
    height: Number(height) || 170,
    chronicConditions: chronicConditions || [],
    subscriptionType: "Basic",
    additionalMeds: [],
    targetWeight: Number(targetWeight) || 70,
    dailyCalorieBudget: 1800,
    secondaryNotes: secondaryNotes || ""
  };

  usersList.push(newUser);
  saveDb();
  currentUserEmail = newUser.email;
  res.json({ success: true, user: newUser });
});

// Real-time synchronization event stream (SSE)
app.get("/api/sync-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Prevent proxy buffering
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Add the client response to the active connections list
  sseClients.push(res);

  // Immediately send current database state
  const initialPayload = {
    usersList,
    prescriptions,
    doctorsList,
    pharmaciesList,
    twilioConfig,
    clinicalSessions
  };
  res.write(`data: ${JSON.stringify({ type: "init", data: initialPayload })}\n\n`);

  // Heartbeat ping to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
    } catch (e) {
      // client connection likely broken
    }
  }, 15000); // every 15 seconds

  req.on("close", () => {
    clearInterval(heartbeatInterval);
    sseClients = sseClients.filter(client => client !== res);
  });
});

// Get Supabase public config for dynamic client initialization
app.get("/api/supabase-config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseKey: process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || ""
  });
});

// Get Clinical Sessions
app.get("/api/clinical-sessions", (req, res) => {
  res.json(clinicalSessions);
});

// Update or Create Clinical Session
app.post("/api/clinical-sessions/update", (req, res) => {
  const updatedSession = req.body as MedicalSession;
  if (!updatedSession || !updatedSession.id) {
    return res.status(400).json({ error: "Invalid session data" });
  }

  const index = clinicalSessions.findIndex(s => s.id === updatedSession.id);
  if (index !== -1) {
    clinicalSessions[index] = updatedSession;
  } else {
    clinicalSessions.push(updatedSession);
  }

  saveDb();
  res.json({ success: true, session: updatedSession });
});

// Get/Update Health Profile
app.get("/api/health-profile", (req, res) => {
  const email = getRequestUserEmail(req);
  const user = usersList.find(u => u.email.toLowerCase() === email) || usersList[0];
  res.json(user);
});

app.post("/api/health-profile", (req, res) => {
  const email = getRequestUserEmail(req);
  const userIndex = usersList.findIndex(u => u.email.toLowerCase() === email);
  if (userIndex !== -1) {
    usersList[userIndex] = {
      ...usersList[userIndex],
      ...req.body
    };
    saveDb();
    currentUserEmail = usersList[userIndex].email; // update tracking fallback
    res.json({ success: true, user: usersList[userIndex] });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Bookings Endpoints
app.get("/api/bookings", (req, res) => {
  res.json(bookingsRegistry);
});

app.post("/api/bookings/add", (req, res) => {
  const { doctorId, patientEmail, dateKey, queueNumber } = req.body;
  if (!doctorId || !patientEmail || !dateKey || queueNumber === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Remove any existing booking for this patient with this doctor to avoid duplicate rows
  bookingsRegistry = bookingsRegistry.filter(b => !(b.doctorId === doctorId && b.patientEmail === patientEmail));

  bookingsRegistry.push({ doctorId, patientEmail, dateKey, queueNumber });
  saveDb();
  res.json({ success: true, bookingsRegistry });
});

// All users for admin panel
app.get("/api/all-users", (req, res) => {
  res.json(usersList);
});

app.post("/api/delete-user", (req, res) => {
  const { email } = req.body;
  usersList = usersList.filter(u => u.email !== email);
  saveDb();
  res.json({ success: true });
});

app.post("/api/admin/create-user", (req, res) => {
  const { name, email, role, age, weight, height, chronicConditions, targetWeight, subscriptionType, secondaryNotes } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "الرجاء تحديد الاسم والبريد الإلكتروني للمستخدم الجديد" });
  }

  const existing = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "البريد الإلكتروني مسجل بالفعل لمستفيد آخر في النظام" });
  }

  const newUser: UserHealthProfile = {
    name,
    email: email.toLowerCase(),
    role: role || "patient",
    age: Number(age) || 35,
    weight: Number(weight) || 75,
    height: Number(height) || 170,
    chronicConditions: chronicConditions || [],
    subscriptionType: subscriptionType || "Basic",
    additionalMeds: [],
    targetWeight: Number(targetWeight) || 70,
    dailyCalorieBudget: 2000,
    secondaryNotes: secondaryNotes || ""
  };

  usersList.push(newUser);
  saveDb();
  res.json({ success: true, user: newUser });
});

// -------------------------------------------------------------
// DOCTORS REGISTRY & PHARMACIES API ENDPOINTS
// -------------------------------------------------------------

// Active Doctors Registry
app.get("/api/doctors", (req, res) => {
  res.json(doctorsList);
});

app.post("/api/doctors/delete", (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "الرجاء تحديد معرف الطبيب المراد حذفه" });
  }
  doctorsList = doctorsList.filter(d => d.id !== id);
  saveDb();
  res.json({ success: true });
});

app.post("/api/doctors/register", (req, res) => {
  const { name, email, specialty, hospital, whatsappPhone, isPaid, availabilityType, startTime, endTime, workingDays, consultationFee, maxPatientsPerDay, platformPercentage } = req.body;
  if (!name || !email || !specialty) {
    return res.status(400).json({ error: "الرجاء تعبئة الاسم والبريد الإلكتروني والتخصص الطبي الحقيقي" });
  }
  
  const existing = doctorsList.find(d => d.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "هذا الطبيب مسجل مسبقاً في قاعدة بيانات المنصة" });
  }

  const newDocId = "dr_" + Math.floor(Math.random() * 10000);
  const newDoctor: DoctorInfo = {
    id: newDocId,
    name,
    email,
    specialty,
    hospital: hospital || "مستشفى عام بالتنسيق الطبي الرقمي",
    rating: 5.0,
    whatsappPhone: whatsappPhone || "+96477" + Math.floor(10000000 + Math.random() * 90000000),
    isPaid: isPaid !== undefined ? isPaid : true,
    availabilityType: availabilityType || '24/7',
    startTime: startTime || '16:00',
    endTime: endTime || '21:00',
    workingDays: workingDays || ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
    consultationFee: consultationFee !== undefined ? Number(consultationFee) : 0,
    maxPatientsPerDay: maxPatientsPerDay !== undefined ? Number(maxPatientsPerDay) : 15,
    platformPercentage: platformPercentage !== undefined ? Number(platformPercentage) : 0
  };

  doctorsList.push(newDoctor);

  // Auto-create/update in users list so they can immediately login using their email as doctor
  const existingUser = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!existingUser) {
    usersList.push({
      name,
      email,
      role: 'doctor',
      age: 42,
      weight: 78,
      height: 175,
      chronicConditions: [],
      subscriptionType: 'Premium',
      additionalMeds: [],
      targetWeight: 75,
      dailyCalorieBudget: 2100
    });
  } else {
    existingUser.role = 'doctor';
    existingUser.name = name;
  }

  saveDb();
  res.json({ success: true, doctor: newDoctor });
});

// Partner Pharmacies Registry
app.get("/api/pharmacies", (req, res) => {
  res.json(pharmaciesList);
});

app.post("/api/pharmacies/delete", (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "الرجاء تحديد معرف الصيدلية المراد حذفها" });
  }
  pharmaciesList = pharmaciesList.filter(ph => ph.id !== id);
  saveDb();
  res.json({ success: true });
});

app.post("/api/pharmacies/register", (req, res) => {
  const { name, district, lat, lng, phone, address } = req.body;
  if (!name || !district) {
    return res.status(400).json({ error: "الرجاء تحديد الاسم الرسمي للصيدلية والحي أو المنطقة الجغرافية" });
  }

  // Generate coordinates near Riyadh if absent
  const userLat = Number(lat) || (24.71 + Math.random() * 0.1);
  const userLng = Number(lng) || (46.67 + Math.random() * 0.1);

  const newPh: PharmacyInfo = {
    id: "ph_" + Math.floor(Math.random() * 10000),
    name,
    district,
    lat: Number(userLat.toFixed(5)),
    lng: Number(userLng.toFixed(5)),
    phone: phone || "+96477" + Math.floor(10000000 + Math.random() * 90000000),
    address: address || `${district}، جمهورية العراق`
  };

  pharmaciesList.push(newPh);
  saveDb();
  res.json({ success: true, pharmacy: newPh });
});

app.post("/api/doctors/update", (req, res) => {
  const { id, name, email, specialty, hospital, whatsappPhone, isPaid, availabilityType, startTime, endTime, workingDays, consultationFee, maxPatientsPerDay, platformPercentage } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: "الرجاء تحديد معرف الطبيب المراد تعديل بياناته" });
  }

  const doctorIdx = doctorsList.findIndex(d => d.id === id);
  if (doctorIdx === -1) {
    return res.status(444).json({ error: "الطبيب المطلوب غير موجود بالنظام" });
  }

  // Validate email uniqueness if changing email
  const existingDoc = doctorsList.find(d => d.email.toLowerCase() === email.toLowerCase() && d.id !== id);
  if (existingDoc) {
    return res.status(400).json({ error: "هناك طبيب آخر مسجل ب هذا البريد الإلكتروني" });
  }

  const oldEmail = doctorsList[doctorIdx].email;
  const updatedDoctor = {
    ...doctorsList[doctorIdx],
    name: name || doctorsList[doctorIdx].name,
    email: email || doctorsList[doctorIdx].email,
    specialty: specialty || doctorsList[doctorIdx].specialty,
    hospital: hospital || doctorsList[doctorIdx].hospital,
    whatsappPhone: whatsappPhone !== undefined ? whatsappPhone : doctorsList[doctorIdx].whatsappPhone,
    isPaid: isPaid !== undefined ? isPaid : doctorsList[doctorIdx].isPaid,
    availabilityType: availabilityType || doctorsList[doctorIdx].availabilityType,
    startTime: startTime || doctorsList[doctorIdx].startTime,
    endTime: endTime || doctorsList[doctorIdx].endTime,
    workingDays: workingDays || doctorsList[doctorIdx].workingDays,
    consultationFee: consultationFee !== undefined ? Number(consultationFee) : doctorsList[doctorIdx].consultationFee,
    maxPatientsPerDay: maxPatientsPerDay !== undefined ? Number(maxPatientsPerDay) : doctorsList[doctorIdx].maxPatientsPerDay,
    platformPercentage: platformPercentage !== undefined ? Number(platformPercentage) : doctorsList[doctorIdx].platformPercentage
  };

  doctorsList[doctorIdx] = updatedDoctor;

  // Sync users list so the login email is updated as well
  const userIdx = usersList.findIndex(u => u.email.toLowerCase() === oldEmail.toLowerCase());
  if (userIdx !== -1) {
    usersList[userIdx] = {
      ...usersList[userIdx],
      name: updatedDoctor.name,
      email: updatedDoctor.email
    };
  }

  saveDb();
  res.json({ success: true, doctor: updatedDoctor });
});

app.post("/api/pharmacies/update", (req, res) => {
  const { id, name, district, lat, lng, phone, address } = req.body;

  if (!id) {
    return res.status(400).json({ error: "الرجاء تحديد معرف الصيدلية المراد تعديلها" });
  }

  const phIdx = pharmaciesList.findIndex(ph => ph.id === id);
  if (phIdx === -1) {
    return res.status(404).json({ error: "الصيدلية المطلوبة غير موجودة في النظام" });
  }

  const updatedPharmacy = {
    ...pharmaciesList[phIdx],
    name: name || pharmaciesList[phIdx].name,
    district: district || pharmaciesList[phIdx].district,
    lat: lat !== undefined ? Number(lat) : pharmaciesList[phIdx].lat,
    lng: lng !== undefined ? Number(lng) : pharmaciesList[phIdx].lng,
    phone: phone !== undefined ? phone : pharmaciesList[phIdx].phone,
    address: address !== undefined ? address : pharmaciesList[phIdx].address
  };

  pharmaciesList[phIdx] = updatedPharmacy;
  saveDb();
  res.json({ success: true, pharmacy: updatedPharmacy });
});


// Prescriptions list
app.get("/api/prescriptions", (req, res) => {
  // Return all prescriptions for user, or all if doctor/admin
  const email = getRequestUserEmail(req);
  const currentUser = usersList.find(u => u.email.toLowerCase() === email) || usersList[0];
  if (currentUser.role === 'patient') {
    res.json(prescriptions);
  } else {
    res.json(prescriptions);
  }
});

// Post a prescription
app.post("/api/prescriptions", (req, res) => {
  const { medicationName, dosage, instructions, pharmacyName, isSupplement, patientName, patientEmail, isDigitalSigned, digitalSignatureHash, sourceType } = req.body;
  const newRx: Prescription = {
    id: "rx_" + Math.floor(Math.random() * 10000),
    doctorName: req.body.doctorName || "د. سمر الخالدي",
    medicationName,
    dosage,
    instructions,
    pharmacyId: "ph_" + Math.floor(Math.random() * 1000),
    pharmacyName: pharmacyName || "صيدلية النهدي الكبرى",
    deliveryStatus: "Processing",
    deliveryEstimatedDate: "خلال 24 ساعة",
    createdAt: new Date().toISOString(),
    isSupplement: !!isSupplement,
    patientName: patientName || undefined,
    patientEmail: patientEmail || undefined,
    isDigitalSigned: !!isDigitalSigned,
    digitalSignatureHash: digitalSignatureHash || undefined,
    sourceType: sourceType || 'Doctor'
  };
  prescriptions.unshift(newRx);
  saveDb();
  res.json({ success: true, prescription: newRx });
});

// Update prescription status (simulate pharmacy dispatch / shipping tracking)
app.post("/api/prescriptions/:id/status", (req, res) => {
  const { status } = req.body;
  const rx = prescriptions.find(p => p.id === req.params.id);
  if (rx) {
    rx.deliveryStatus = status;
    if (status === 'Shipped') rx.deliveryEstimatedDate = "غداً مساءً";
    else if (status === 'Out for Delivery') rx.deliveryEstimatedDate = "خلال ساعتين";
    else if (status === 'Delivered') rx.deliveryEstimatedDate = "تم الوصول والتسليم";
    saveDb();
    res.json({ success: true, prescription: rx });
  } else {
    res.status(404).json({ error: "Prescription not found" });
  }
});

// Update prescription pharmacy
app.post("/api/prescriptions/:id/pharmacy", (req, res) => {
  const { pharmacyName } = req.body;
  const rx = prescriptions.find(p => p.id === req.params.id);
  if (rx) {
    rx.pharmacyName = pharmacyName || "صيدلية غير محددة بعد";
    saveDb();
    res.json({ success: true, prescription: rx });
  } else {
    res.status(404).json({ error: "Prescription not found" });
  }
});

// Get / Update Twilio config
app.get("/api/twilio-config", (req, res) => {
  res.json(twilioConfig);
});

app.post("/api/twilio-config", (req, res) => {
  twilioConfig = {
    ...twilioConfig,
    ...req.body
  };
  saveDb();
  res.json({ success: true, config: twilioConfig });
});

// -------------------------------------------------------------
// NUTRITION AND CALORIES ENGINE (AI USING GEMINI-3.5-FLASH & SMART FALLBACKS)
// -------------------------------------------------------------
let lastQuotaExhaustionTime = 0;
const COOLDOWN_MS = 60000; // 1 minute cooldown to prevent hitting Gemini during quota lockouts

// Robust retry and backoff helper for Gemini generateContent calls
async function generateContentWithRetry(ai: any, options: any, maxRetries = 3, delayMs = 1000) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      // Check cooldown first
      if (Date.now() - lastQuotaExhaustionTime < COOLDOWN_MS) {
        throw new Error("COOLDOWN_ACTIVE");
      }
      return await ai.models.generateContent(options);
    } catch (error: any) {
      const errorMessage = error?.message || "";
      const isQuota = error?.status === "RESOURCE_EXHAUSTED" || errorMessage.includes("quota") || errorMessage.includes("429");
      if (isQuota) {
        lastQuotaExhaustionTime = Date.now();
        throw error;
      }
      if (attempt < maxRetries) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

// Robust dynamic clinical calculator for patient profiles (used during API quota-exhaustion or key absence)
function getDynamicClinicalFallback(age: number, weight: number, height: number, chronicConditions: string[]) {
  const conditions = chronicConditions || [];
  const hasDiabetes = conditions.includes("diabetes");
  const hasHypertension = conditions.includes("hypertension");
  const hasObesity = conditions.includes("obesity");

  // Mifflin-St Jeor equation baseline for average activity
  let bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  let dailyCalories = Math.round(bmr * 1.25);

  if (hasObesity) {
    dailyCalories = Math.round(dailyCalories - 400); // safe calorie deficit
  }

  if (dailyCalories < 1200) dailyCalories = 1200;
  if (dailyCalories > 2800) dailyCalories = 2800;

  let carbs = 50;
  let protein = 20;
  let fat = 30;

  if (hasDiabetes) {
    carbs = 40;  // controlled carbohydrate intake
    protein = 25;
    fat = 35;    // healthy monounsaturated fat
  }

  let advice = `بناءً على مقاييسك الشخصية (الوزن: ${weight} كجم، الطول: ${height} سم، العمر: ${age} سنة)، يرجى الالتزام بالترطيب اليومي الكافي من خلال شرب ما لا يقل عن ${Math.max(2, Math.round(weight * 0.035))} لتر من المياه النقية يومياً والابتعاد التام عن الدهون المشبعة المسببة للالتهابات الخلوية لضمان كفاءة الجهاز الهضمي والدموي.`;
  
  if (hasDiabetes && hasHypertension && hasObesity) {
    advice = `توجيه طبي معتمد لحالتك الثلاثية (السكري وضغط الدم المرتفع والسمنة) لوزنك البالغ ${weight} كجم وعمر ${age} عاماً: نوصي باتباع نمط غذائي هجين يدمج حمية DASH ومحدد الكربوهيدرات لضبط السعرات عند ${dailyCalories} سعرة. يجب ألا يتجاوز استهلاك الملح اليومي 1500 ملجم (أقل من نصف ملعقة صغيرة)، مع الامتناع التام عن الدقيق والخبز الأبيض والأرز الأبيض لتعويضها بالحبوب الكاملة وبراعم الكينوا، والمواظبة على النشاط البدني المعتدل كالمشي السريع لزيادة حساسية مستقبلات الإنسولين وحرق الشحوم.`;
  } else if (hasDiabetes && hasObesity) {
    advice = `توجيه طبي لمكافحة السكري والسمنة لوزن ${weight} كجم: نوصي بخفض السعرات الحرارية تدريجياً لضمان خسارة آمنة بمعدل 0.5 إلى 1 كجم أسبوعياً لتصل إلى وزنك المثالي بميزانية ${dailyCalories} سعرة حرارية. ركز كلياً على الحد من السكريات البسيطة والمشروبات الغازية، والاعتماد على الخضروات الورقية والبروتين الصافي لتنشيط الأيض وتحسين استجابة الميتفورمين.`;
  } else if (hasDiabetes && hasHypertension) {
    advice = `توجيه طبي هام للتحكم في الضغط المرتفع والسكري لعمر ${age} عاماً: يوصى بدمج حمية DASH مع توزيع منظم للكربوهيدرات على مدار اليوم لموازنة سكر الدم لوزنك البالغ ${weight} كجم بميزانية ${dailyCalories} سعرة. احرص على تناول الأغذية الغنية بالبوتاسيوم والمغنيسيوم كالمكسرات النيئة وحبوب السمسم والسبانخ الطازجة بالتوازي مع قياس المؤشرات الحيوية بشكل مستمر.`;
  } else if (hasDiabetes) {
    advice = `توجيه طبي للسيطرة المثالية على تذبذب سكر الدم وسكر التراكمي: يُوصى بتقسيم وجباتك الغذائية لتناسب وزنك الحالي (${weight} كجم) وااحتياجك البالغ ${dailyCalories} سعرة، مع تضمين الألياف القابلة للذوبان من الشوفان والبقوليات، لضمان استقرار إفراز الإنسولين الطبيعي وحماية الخلايا البنكرياسية.`;
  } else if (hasHypertension) {
    advice = `توجيه طبي لخفض ضغط الدم المرتفع وحماية الشرايين: يوصى باتباع حمية DASH الطبية المناسبة لوزن ${weight} كجم وعمر ${age} سنة بميزانية ${dailyCalories} سعرة. تجنب تماماً المعلبات، الشيبس، والوجبات الجاهزة، واعتمد كلياً على نكهات الليمون، الثوم الطازج، وزيت الزيتون كبدائل للملح مع تناول أغذية غنية بالبوتاسيوم مثل الموز والأفوكادو.`;
  } else if (hasObesity) {
    advice = `توجيه طبي لدعم تخفيف الوزن الزائد لوزنك البالغ ${weight} كجم: ركز على تحقيق عجز حراري مدروس لتصل إلى هدف ${dailyCalories} سعرة حرارية يومياً. ابدأ وجباتك بتناول كوبين من الماء العذب وطبق سلطة كبير لملء فراغ المعدة ومساعدة الأنسجة على حرق الخلايا الشحمية بكفاءة.`;
  }

  // Adjust portion sizes dynamically based on user's weight
  const chickenGrams = Math.round(weight * 1.8 + 40); // dynamic portion (e.g. 80kg -> 184g)
  const salmonGrams = Math.round(weight * 1.4 + 30);  // dynamic portion (e.g. 80kg -> 142g)
  const oatmealSpoons = Math.round(weight * 0.05 + 2); // dynamic portion (e.g. 80kg -> 6 spoons)

  const recipe1Cal = Math.round(dailyCalories * 0.35);
  const recipe2Cal = Math.round(dailyCalories * 0.38);
  const recipe3Cal = Math.round(dailyCalories * 0.25);

  // High quality realistic clinically formulated recipes pool
  const recipesPool = [
    {
      title: "شرائح صدور الدجاج المشوية بالأعشاب الطبية مع البطاطا الحلوة المهروسة",
      prepTime: "25 دقيقة",
      calories: recipe1Cal,
      ingredients: [
        `${chickenGrams} جرام صدر دجاج طازج بلا جلد`,
        "طماطم كرزية طازجة، جرجير بري، فص ثوم مهروس",
        "حبة متوسطة بطاطا حلوة مسلوقة ومهروسة",
        "ملعقة صغيرة زيت زيتون بكر ممتاز وثوم وتوابل طبيعية خالية من الصوديوم"
      ],
      instructions: [
        "يُنقع الدجاج في عصير الليمون والروزماري والأوريغانو والجرجير والثوم المهروس.",
        "يُطهى الدجاج على شواية كهربائية دافئة بدون استخدام أي دهون مهدرجة إضافية.",
        "تهرس البطاطا الحلوة الدافئة جيداً كبديل ممتاز غني بالألياف ومنخفض الحمل الجلايسيمي.",
        "يقدم الطبق منسقاً مع كوب ماء بارد."
      ],
      whySuitable: `محسوبة بدقة لمقاييسك لتمدك بـ ${recipe1Cal} سعرة حرارية. خالٍ تماماً من الملح المضاف لخفض ضغط الشرايين، وغني ببروتين بناء العضلات والنشويات المعقدة لثبات سكر الدم.`
    },
    {
      title: "طبق سلطة الكينوا العضوية مع سمك السلمون المخبوز والأفوكادو",
      prepTime: "20 دقيقة",
      calories: recipe2Cal,
      ingredients: [
        "نصف كوب كينوا مطبوخة على البخار",
        `شريحة سلمون بري طازج (${salmonGrams} جرام)`,
        "أوراق البقدونس والخيار المقطع الصغير، طماطم، ربع حبة أفوكادو",
        "عصير ليمونة حامضة وملعقة زيت زيتون بكر"
      ],
      instructions: [
        "يُوضع السلمون داخل الفرن مع ورقة الليمون والكمون والفلفل الأسود لمدة 14 دقيقة.",
        "تُخلط الكينوا الباردة بالخضار والأفوكادو المفروم مع إضافة عصير الليمونة وزيت الزيتون.",
        "تُوضع شريحة السلمون الساخنة فوق السلطة الملونة وتقدم بلطف لمريض السكري والقلب."
      ],
      whySuitable: `تمنحك ${recipe2Cal} سعرة غنية بمركبات أوميجا-3 الصحية لتقوية خلايا القلب وخفض الدهون الثلاثية، مع مؤشر جلايسيمي شديد الانخفاض لثبات السكر.`
    },
    {
      title: "شوربة الشوفان الصحية المحضرة بمرق اللحم والخضروات العضوية",
      prepTime: "15 دقيقة",
      calories: recipe3Cal,
      ingredients: [
        `${oatmealSpoons} ملاعق شوفان حبة كاملة`,
        "كوب ونصف مرق دجاج أو لحم محضر بالمنزل خالي من الدهون ومنزوع الدسم",
        "كرفس مقطع، جزر، وبازلاء طازجة",
        "رشة ثوم بودرة وقرنفل مطحون"
      ],
      instructions: [
        "تُسخن المرقة النقية وتغمر معها قطع الكرفس والجزر والبازلاء حتى تليين.",
        "يُضاف الشوفان رويداً رويداً ويُطهى على نار هادئة لمدة 10 دقائق لتتحول لشوربة متماسكة ولذيذة.",
        "تُسكب دافئة في كوب تقديم صحي."
      ],
      whySuitable: `شوربة مغذية دافئة توفر ${recipe3Cal} سعرة. محتوى البيتا جلوكان العالي بالشوفان يخفض السكر التراكمي والكوليسترول، ومثالية لتخفيف السمنة والوزن الزائد.`
    }
  ];

  let selectedRecipes = [recipesPool[0]];
  if (hasDiabetes || hasHypertension) {
    selectedRecipes = [recipesPool[1], recipesPool[0]];
  } else if (hasObesity) {
    selectedRecipes = [recipesPool[0], recipesPool[2]];
  }

  // Pre-seed high-quality customized dietary supplements
  const supplements = [];
  if (hasDiabetes) {
    supplements.push({
      name: "بيكولينات الكروم (Chromium Picolinate)",
      purpose: "زيادة حساسية مستقبلات الأنسولين وتقليل مقاومة الأنسولين بالجسم والتحكم العالي في تذبذب السكر.",
      dosage: "200 ميكروجرام حبة واحدة مع وجبة الغداء الرئيسية",
      whySuitable: "يساعد على الحد من الرغبة الشديدة في تناول الحلويات والكربوهيدرات البسيطة، وهو معزز سريري رائع للبنكرياس."
    });
    supplements.push({
      name: "حمض ألفا ليبويك (Alpha-Lipoic Acid)",
      purpose: "حماية الخلايا القشرية والوقاية من اعتلال الأعصاب الطرفية الذي يصيب مرضى السكري.",
      dosage: "600 ملجم صباحاً على معدة فارغة قبل الأكل بـ 30 دقيقة",
      whySuitable: "مضاد أكسدة استباقي ممتاز جداً لحماية النهايات العصبية من ضرر الأكسدة المرتفعة لمعدلات الجلوكوز."
    });
  }
  if (hasHypertension) {
    supplements.push({
      name: "بيسجليسينات المغنيسيوم (Magnesium Bisglycinate)",
      purpose: "المساعدة على استرخاء عضلات القلب الملساء وتوسيع جدران الأوعية الشريانية لخفض المقاومة الطرفية.",
      dosage: "400 ملجم مرة واحدة يومياً قبل النوم بساعة",
      whySuitable: "يعزز جودة نوم المريض ويساهم في خفض ضغط الدم الانقباضي والانبساطي بصورة هادئة وطبيعية."
    });
    supplements.push({
      name: "الإنزيم المساعد كيو 10 (Coenzyme Q10)",
      purpose: "تعزيز طاقة الميتوكوندريا بعضلة القلب وحماية الجدران الشريانية والحد من الكوليسترول الضار.",
      dosage: "100 ملجم مع وجبة دسمة تحتوي على دهون صحية",
      whySuitable: "داعم خلوعي ممتاز للقلب والأوعية ويقلل من الإجهاد الشرياني لضبط ضغط الدم."
    });
  }
  if (hasObesity) {
    supplements.push({
      name: "فيتامين د3 السائل (Vitamin D3)",
      purpose: "تعويض العجز الحاد لفيتامين د المصاحب للسمنة وتنظيم إفراز هرمون اللبتين المنظم للشهية.",
      dosage: "5000 وحدة دولية حبة واحدة يومياً مع الوجبة الأساسية",
      whySuitable: "ضروري لتحسين معدلات حرق الدهون العنيدة ومقاومة الخلايا الشحمية للالتهابات المزمنة."
    });
    supplements.push({
      name: "مستخلص الشاي الأخضر العضوي (EGCG)",
      purpose: "تحفيز التمثيل الغذائي الأساسي (Metabolism) ودعم أكسدة الأحماض الدهنية كطاقة مستهلكة.",
      dosage: "500 ملجم حبة واحدة صباحاً مع نشاط الحركة",
      whySuitable: "يعمل على تفعيل حرق خلايا الدهون البنية بأمان وبدون إثارة مفرطة للضغط الشرياني."
    });
  }

  // Fallback default supplements if user is currently healthy
  if (supplements.length === 0) {
    supplements.push({
      name: "أوميغا-3 البحري المقطر (Omega-3 Fish Oil)",
      purpose: "دعم صحة الأوعية، وتقوية خلايا الإدراك الذهني، وتخفيف مسببات الالتهابات الخلوية الخفية.",
      dosage: "1000 ملجم كبسولة واحدة يومياً مع وجبة الغداء",
      whySuitable: "داعم مثالي للصحة العامة للشرايين والجهاز العصبي."
    });
    supplements.push({
      name: "فيتامين د3 الأساسي (Vitamin D3)",
      purpose: "تثبيت الكالسيوم بالعظام وتعزيز قدرة جهاز المناعة لمقاومة العدوى الفيروسية والالتهابات.",
      dosage: "2000 وحدة دولية مرة واحدة يومياً",
      whySuitable: "يغطي العجز الأساسي لمستويات الفيتامينات للجسم في غياب التعرض المثالي لأشعة الشمس المباشرة."
    });
  }

  return {
    dailyCalories,
    macroRatio: { carbs, protein, fat },
    advice,
    recipes: selectedRecipes,
    supplements
  };
}

// Custom keyword-based dialogue generator for smart medical fallback responses during AI outage / quota constraints
function getSmartChatbotFallback(message: string, context?: any) {
  const text = (message || "").toLowerCase();
  const userName = context?.name || "المستفيد الكريم";

  if (text.includes("مكمل") || text.includes("مكملات") || text.includes("فيتامين") || text.includes("معادن") || text.includes("ماغنسيوم") || text.includes("مغنيسيوم") || text.includes("كروم")) {
    return `مرحباً بك يا ${userName}. بخصوص استفسارك عن المكملات الغذائية والفيتامينات العلاجية ومجالات التغذية والجرعات:
- المكملات الغذائية تلعب دوراً طبياً استباقياً لتعويض نقص المعادن الأساسية بالخلايا وضمان فاعلية الأنسولين وصحة شرايين القلب.
- في حالة السكري: الكروم (Chromium) يعزز استجابة الخلايا، وحمض ألفا-ليبويك (ALA) يمنع تلف واعتلال الأعصاب الطرفية.
- في حالة ضغط الدم: بيسجليسينات المغنيسيوم تعمل فوراً على ترخية الأوعية الشريانية وتوسعتها، أما الإنزيم كيو 10 يدعم طاقة بطين القلب بالتوازي مع الـ DASH.
- في حالة السمنة ونقص الحرق: تعويض النقص الحاد بفيتامين د3 يرفع معدل خسارة الوزن المستدام.
المستشار الذكي لدينا مبرمج ليقترح المكملات المثالية لحالتك. يمكنك تفقدها في علامة تبويب "التغذية العلاجية الذكية"، كما يمكن لأي طبيب بالمنصة صرف مكمل غذائي معتمد وموثق لصالح مستودع صيدليتنا الشريكة الحالية لتسليمها فوراً لمنزلك!`;
  }

  if (text.includes("ضغط") || text.includes("الضغط") || text.includes("ارتفاع") || text.includes("انخفاض") || text.includes("قلب")) {
    return `أهلاً بك يا ${userName}. بخصوص استفسارك عن ضغط الدم وصحة الأوعية الكارديولوجية:
من الناحية الكلينيكية، ينبغي الحفاظ على مستوى الضغط تحت حاجز 120/80 ملجم زئبقي في أوقات الاسترخاء.
إذا رصدت ارتفاعاً طارئاً (على سبيل المثال فوق 140/90)، ننصحك بالراحة التامة، الابتعاد الفوري عن التوتر، تجنب الوجبات المالحة، وشرب كمية معقولة من الماء.
نوصيك بإضافة قراءتك بدقة في النظام لكي يتسنى للفريق مراقبة حالتك. هل تشعر حالياً بصداع خلفي أو زغللة في العينين؟`;
  }

  if (text.includes("سكر") || text.includes("السكري") || text.includes("تراكمي") || text.includes("انسولين") || text.includes("أنسولين") || text.includes("ميتفورمين") || text.includes("منظم")) {
    return `مرحباً بك يا ${userName}. بخصوص مستويات سكر الدم والتحكم بالغدد الصماء:
- نذكرك بأن القراءة المثالية للصائم يجب أن تقع بين 70-100 ملجم/ديسيلتر، وبعد الطعام بساعتين تحت 140 ملجم/ديسيلتر.
- إذا لمست هبوطاً حاداً مصاحباً برجفة وتعرق، تناول فوراً نصف كوب عصير محلى أو 3 تمرات (قاعدة 15/15) وأعد القياس بعد 15 دقيقة.
- احرص على تناول جرعات الميتفورمين (الجلوكوفاج) المذكورة في وصفتك مع الوجبات بدقة.
هل تود مشاركتي آخر قراءة معملية للسكر التراكمي لديك لتعديل خطتك؟`;
  }

  if (text.includes("وزن") || text.includes("السمنة") || text.includes("sمنة") || text.includes("دهون") || text.includes("ريجيم") || text.includes("تسمين") || text.includes("بروتين") || text.includes("سعرات")) {
    return `مرحباً ${userName}. بخصوص السعرات الحرارية وإدارة السمنة والوزن المستهدف:
- لتحقيق نقصان صحي ومستدام للوزن، صممنا لك ميزانية سعرات يومية دقيقة في علامة التبويب "التغذية العلاجية الذكية".
- نقترح لرفع الحرق لديك: زيادة حصة الخضار الورقية، تناول الدجاج والأسماك المشوية والابتعاد الكامل عن الخبز الأبيض والزيوت المصنعة.
- الرياضة المعتدلة بمعدل 150 دقيقة أسبوعياً ستصنع فارقاً مهولاً في تحفيز الخلايا على استخدام الكربوهيدرات.
يمكنك تفقد خطتك الغذائية والوصفات الطبية المقترحة لدينا لقائمة وجبات لذيذة وصديقة للوزن المثالي!`;
  }

  if (text.includes("دواء") || text.includes("وصفة") || text.includes("صيدلية") || text.includes("علاج") || text.includes("روشتة") || text.includes("طبيب") || text.includes("دكتور")) {
    return `أهلاً بك يا ${userName}. نظام منصة مدبلس مجهز لربط وتوصيل وصفتك الطبية الطارئة والمكملات المعتمدة الكترونياً فور تسجيلها من قبل أخصائي الرعاية.
نصرف لك الدواء والمكملات من كبرى الصيدليات (مثل صيدلية بابل الكبرى أو صيدلية الحياة في العراق) لتأمين شحن الأدوية إلى منزلك وتتبع خط السير مباشرة.
يمكنك زيارة علامة التبويب "شركاء الرعاية والتوصيل" لمراقبة المعاملات أو إضافة طبيب جديد وربط رقمه بالواتساب ليتسنى له متابعتك فوراً.`;
  }

  if (text.includes("اتصال") || text.includes("رقم") || text.includes("هاتف") || text.includes("مكالمة") || text.includes("تلفون") || text.includes("صوت") || text.includes("ويب") || text.includes("واتس")) {
    return `أهلاً بك يا ${userName}. نحن نوفر ميزة الربط المباشر مع تطبيق واتساب لتسهيل تسليم التقارير والاتصالات الطبية المستقلة.
للأطباء المسجلين لدينا، بمجرد الضغط على الكبسة الخضراء ستقوم المنصة بتوليد رابط سريع يفتح نافذة المراسلة الفورية المجهزة سلفاً باسمك وحالتك وحاجتك مباشرة إلى متصفح الطبيب الفعلي.
هل تود مراجعة قائمة الأطباء وطلب استشارتهم المباشرة للعلامات الحيوية؟`;
  }

  return `مرحباً بك يا ${userName} في منصة مدبلس الطبية (MedPulse).
أنا دكتور مدبلس الرقمي (AI Clinical Assistant Module). أجهزة الرصد لدينا تعمل بشكل متقاطع لضمان تقديم الرعاية التامة والمكملات الغذائية المخصصة لك.
يمكنني بكل سرور كصيدلي واستشاري رقمي مساعدتك في:
1. ضبط ميزانية السعرات والماكروز والترشيح الطبي الذكي للمكملات الغذائية.
2. الاستعلام عن تداخلات الأدوية مثل منظم السكر وأدوية الكوليسترول والضغط والمكملات الفعالة.
3. توصيل وصفتك الحالية وتحديث تفاصيل ملفك الطبي والغذائي.
ما هو المؤشر العضوي أو العلامة الحيوية المكتسبة التي تود مشاركتها أو الاستفسار عنها معي اليوم؟`;
}

app.post("/api/calculate-calories", async (req, res) => {
  const { age, weight, height, chronicConditions, healthGoal, activityLevel, dietType } = req.body;
  
  const formattedConditions = (chronicConditions || []).join(", ");
  const goalStr = healthGoal || "disease-control";
  const activityStr = activityLevel || "moderate";
  const dietStr = dietType || "balanced";
  
  // Generate unique cache key based on the parameters
  const sortedConditions = [...(chronicConditions || [])].sort().join(",");
  const cacheKey = `${age || 0}_${weight || 0}_${height || 0}_${sortedConditions}_${goalStr}_${activityStr}_${dietStr}`;
  
  if (calorieAndDietCache.has(cacheKey)) {
    console.log(`[MedPulse Cache] Serving cached calorie calculations for key: ${cacheKey}`);
    return res.json(calorieAndDietCache.get(cacheKey));
  }
  
  // Fail-fast medical fallback if quota is known to be exhausted (cooldown period)
  if (Date.now() - lastQuotaExhaustionTime < COOLDOWN_MS) {
    console.log("[MedPulse QuotaGuard] Gemini API is currently cooling down from a 429 resource exhaustion. Activating dynamic offline clinical engine.");
    const fallbackData = getDynamicClinicalFallback(Number(age) || 35, Number(weight) || 75, Number(height) || 170, chronicConditions || []);
    return res.json(fallbackData);
  }
  
  const prompt = `Calculate daily calorie intake, dietary targets, and recommended dietary supplements inside a JSON structured object for a user with the following profile:
  Age: ${age} years old
  Weight: ${weight} kg
  Height: ${height} cm
  Chronic Conditions: ${formattedConditions || "No chronic health conditions / Healthy lifestyle seeker"}
  User's Main Health/Fitness Goal: ${goalStr} (Options are: healthy-lifestyle for pure healthy lifestyle, weight-loss for weight reduction, muscle-gain for muscle and healthy strength building, disease-control for strictly managing their diabetes/hypertension)
  Physical Activity Level: ${activityStr} (Options are: sedentary for light activity, moderate for average active lifestyle, active for strenuous sports/activity)
  Preferred Diet Type: ${dietStr} (Options are: balanced for standard healthy meals, low-carb for carbohydrate restriction, keto for ketogenic fat-adapted meals, mediterranean for healthy fats, vegetables, and high fiber)

  Return valid JSON matching this schema:
  {
    "dailyCalories": number,
    "macroRatio": {
      "carbs": number, (percentage value 0-100)
      "protein": number, (percentage value 0-100)
      "fat": number (percentage value 0-100)
    },
    "advice": "General clinical and nutrition advice tailored specifically to their goal, activity, and medical profile in elegant Arabic",
    "recipes": [
      {
        "title": "A highly specific healthy meal name matching their diet in Arabic",
        "prepTime": "Prep/cook duration e.g. 20 دقيقة",
        "calories": number,
        "ingredients": ["list of ingredients in Arabic"],
        "instructions": ["step 1", "step 2"],
        "whySuitable": "Why this is suitable for them medically or activity-wise in Arabic"
      }
    ],
    "supplements": [
      {
        "name": "Arabic name of the dietary supplement (e.g., مغنيسيوم بيسجليسينات, فيتامين د3, كروميوم, أوميجا-3)",
        "purpose": "Clinical purpose/role of this supplement in Arabic",
        "dosage": "Recommended dosage instructions in Arabic (e.g. 400 ملجم قبل النوم)",
        "whySuitable": "Medically why this is recommended for their goals, activity, or chronic conditions in Arabic"
      }
    ]
  }

  Important guidelines:
  - If they are a healthy lifestyle seeker ("healthy-lifestyle" and no chronic conditions), adjust their advice to reflect vitality, longevity, preventive nutrition, and sustained daily energy instead of focusing on disease management.
  - If their goal is "muscle-gain", increase protein recommendations (around 25-30% of calorie intake) and recipes with lean protein and clean active fuel.
  - If they have "diabetes" (السكري), limit carbohydrates (around 35-42%) and focus on complex carbs, with low glycemic index recipes. Also suggest chromium and alpha-lipoic acid supplements.
  - If they have "hypertension" (ارتفاع ضغط الدم), advise sodium restriction, potassium-rich recipes, and suggest magnesium and CoQ10 supplements.
  - If they have "obesity" (السمنة) or aim for "weight-loss", keep daily calories slightly below energy maintenance (target calorie deficit of 300-500 kcal) and suggest vitamin D and green tea extract/EGCG.
  - Adapt the recipes to their chosen Diet Type ("low-carb", "keto", "mediterranean", or "balanced").
  - All text descriptions (advice, recipes title, ingredients, instructions, whySuitable, supplements fields) must be in beautiful, clinical, supportive Arabic language. Do not output anything other than this clean JSON matching the structure.`;

  try {
    const ai = getGeminiClient();
    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyCalories: { type: Type.INTEGER },
            macroRatio: {
              type: Type.OBJECT,
              properties: {
                carbs: { type: Type.INTEGER },
                protein: { type: Type.INTEGER },
                fat: { type: Type.INTEGER }
              },
              required: ["carbs", "protein", "fat"]
            },
            advice: { type: Type.STRING },
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  prepTime: { type: Type.STRING },
                  calories: { type: Type.INTEGER },
                  ingredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  instructions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  whySuitable: { type: Type.STRING }
                },
                required: ["title", "prepTime", "calories", "ingredients", "instructions", "whySuitable"]
              }
            },
            supplements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  whySuitable: { type: Type.STRING }
                },
                required: ["name", "purpose", "dosage", "whySuitable"]
              }
            }
          },
          required: ["dailyCalories", "macroRatio", "advice", "recipes", "supplements"]
        }
      }
    });

    const text = response.text || "{}";
    const result = JSON.parse(text.trim());
    
    // Cache the successful result so we don't hit the Gemini API quota again for this health profile
    calorieAndDietCache.set(cacheKey, result);
    
    res.json(result);
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.warn(`[MedPulse Gemini Calorie QuotaGuard Activation] Calorie computation handled with graceful clinical fallback because: ${errorMsg}`);
    
    // Flag quota exhaustion to switch to dynamic local clinical engine for 1 minute
    if (error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota") || error?.message?.includes("429") || error?.message?.includes("exceeded")) {
      lastQuotaExhaustionTime = Date.now();
      console.log(`[MedPulse QuotaGuard] 429 Resource exhausted captured. Activating 1-minute system cooldown.`);
    }

    // Dynamic medical fallback output
    const fallbackData = getDynamicClinicalFallback(Number(age) || 35, Number(weight) || 75, Number(height) || 170, chronicConditions || []);
    res.json(fallbackData);
  }
});

// -------------------------------------------------------------
// CHATBOT / TWILIO CALLBOT SIMULATOR API (GEMINI-3.5-FLASH & CONVERSATIONAL DEGRADATION)
// -------------------------------------------------------------
app.post("/api/chatbot", async (req, res) => {
  const { message, history, context } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Fail-fast logic if Gemini is in quota exhaustion cooling phase
  if (Date.now() - lastQuotaExhaustionTime < COOLDOWN_MS) {
    console.log("[MedPulse QuotaGuard] Activating smart medical dialogue engine for message during Gemini cooldown.");
    const reply = getSmartChatbotFallback(message, context);
    return res.json({ reply });
  }

  // contextualized instructions to act as both VoIP Interactive callbot and patient helper
  const profileHelp = context ? `بيانات المريض الحالية المعنية بالاستشارة:
  - الاسم: ${context.name}
  - العمر: ${context.age} سنة
  - الوزن الحالي: ${context.weight} كجم
  - الطول: ${context.height} سم
  - الحالات المزمنة: ${(context.chronicConditions || []).join(", ") || "لا يوجد"}
  - الأدوية الإضافية والمسجلة: ${(context.additionalMeds || []).join(", ") || "لا يوجد"}` : "";

  const systemInstruction = `أنت المساعد الطبي الذكي وبوت الرد الهاتفي الفوري ومنسق الرعاية لمنصة "مدبلس" (MedPulse).
  مهمتك تقديم رعاية طبية أولية، وتوجيهات غذائية، والإجابة كطبيب وصيدلي ذكي بلهجة لبقة، مهنية، واضحة جداً وباللغة العربية الفصحى أو لهجة بيضاء ممتازة.
  
  قوانينك في الرد:
  1. ركز دائماً على توفير الوقت وبث الطمأنينة.
  2. قدم معلومات دقيقة عن إدارة السكري (مستوى التراكمي)، الضغط (دعم نظام Dash الغذائي وتقليل الصوديوم)، والسمنة.
  3. تظاهر دائماً بأنك أيضاً بوت الرد على المكالمات الهاتفية (VoIP Twilio Callbot) عند سؤال المستخدم عن المكالمات، وأخبره أنك تستيطع تنسيق موعد طبي مرئي أو إرسال تنبيه SMS والبريد فوراً.
  4. إذا سألك المستفيد عن منصة MedPulse، وضح له مميزاتنا: اشتراكاتنا الرمزية بين 5-15 دولار شهرياً، وربط الوصفات لدينا مباشرة مع كبرى الصيدليات (مثل بابل الكبرى والحياة) والتوصيل الفوري مع شركات التوصيل الموثوقة.
  
  ${profileHelp}
  
  رجاءً لا تزد في طول الردود الهاتفية لكي تكون سهلة القراءة والاستماع. استخدم جملاً واضحة مدعمة بنصائح طبية هادئة وسلسة.`;

  try {
    const ai = getGeminiClient();
    
    // Transform formatting history to what Gemini SDK accepts or do a direct chat
    // For simplicity, we create a chat with system instruction
    const parts = [];
    if (history && Array.isArray(history)) {
      history.slice(-6).forEach(h => {
        parts.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }
    
    // Append the primary new user prompt
    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: [
        ...(history && history.length > 0 ? [] : []), // can chain previous parts if needed, but for simple request:
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text || "أهلاً بك، كيف يمكنني مساعدتك طبياً اليوم في منصة مدبلس؟" });
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.warn(`[MedPulse Gemini Chatbot QuotaGuard Activation] Chatbot request handled with graceful conversational fallback because: ${errorMsg}`);
    
    if (error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota") || error?.message?.includes("429") || error?.message?.includes("exceeded") || error?.status === "UNAVAILABLE" || error?.message?.includes("503")) {
      lastQuotaExhaustionTime = Date.now();
      console.log(`[MedPulse QuotaGuard] Resource exhausted or unavailable captured in Chatbot. Activation of 1-minute system cooldown.`);
    }

    const reply = getSmartChatbotFallback(message, context);
    res.json({ reply });
  }
});

// -------------------------------------------------------------
// VITE OR STATIC DIST SERVING (CRITICAL MIDDLEWARE STEPS)
// -------------------------------------------------------------
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        allowedHosts: [
          'medpulse-iq.com',
          '.medpulse-iq.com',
          'api.medpulse-iq.com',
          'dashboard.medpulse-iq.com',
          'localhost',
          '127.0.0.1',
          '.run.app',
        ],
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MedPulse Server] running robustly on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Server Bootstrap Failed:", err);
});
