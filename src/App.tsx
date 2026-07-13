import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Heart, 
  User, 
  ShieldAlert, 
  FileText, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit,
  CheckCircle, 
  Clock, 
  Truck, 
  ShieldCheck, 
  MapPin,
  Mail, 
  Phone, 
  Lock, 
  LogIn, 
  ArrowLeft, 
  HelpCircle, 
  Dumbbell, 
  Award, 
  CreditCard, 
  Sparkles, 
  RefreshCw, 
  Layers,
  LogOut,
  ChevronRight,
  TrendingDown,
  ChevronLeft,
  DollarSign,
  QrCode,
  Download,
  Laptop,
  Smartphone,
  Share2,
  Copy,
  ExternalLink,
  Monitor
} from 'lucide-react';
import { UserHealthProfile, Prescription, ChatMessage, SubscriptionType, DoctorInfo, PharmacyInfo, MedicalSession } from './types';
import AiNutrition from './components/AiNutrition';
import VoipTwilio from './components/VoipTwilio';
import PatientArchive from './components/PatientArchive';
import DynamicAdBanner from './components/DynamicAdBanner';
import AdManager from './components/AdManager';

// Supabase and Server-Sent Events are used for real-time synchronization.
// No client-side Firebase initialization needed.


// --- Elite Local Storage Simulation Router (For Static Deployments like Netlify) ---
const handleLocalApiRequest = async (url: any, init: any): Promise<Response> => {
  const urlStr = typeof url === 'string' ? url : (url?.url || '');
  const method = (init?.method || 'GET').toUpperCase();
  const body = init?.body ? JSON.parse(init.body) : null;

  // Utility to parse URL parameters or path segments
  const getPathSegment = (index: number) => {
    const parts = urlStr.split('?')[0].split('/');
    return parts[index];
  };

  // Helper to load/save localStorage tables with codebase default merging (prevents data loss and syncs updates)
  const loadLocalTable = (key: string, defaultData: any) => {
    try {
      const x = localStorage.getItem(key);
      const deletedKey = `${key}_deleted`;
      let deletedList: string[] = [];
      try {
        const d = localStorage.getItem(deletedKey);
        if (d) deletedList = JSON.parse(d);
      } catch {}

      if (!x) {
        const filteredDefault = defaultData.filter((defItem: any) => {
          if (!defItem) return false;
          const uniqueKey = key === 'medpulse_users' ? 'email' : 'id';
          const defVal = String(defItem[uniqueKey] || '').toLowerCase().trim();
          return !deletedList.includes(defVal);
        });
        localStorage.setItem(key, JSON.stringify(filteredDefault));
        return filteredDefault;
      }
      const parsed = JSON.parse(x);
      if (Array.isArray(defaultData)) {
        if (!Array.isArray(parsed)) {
          localStorage.setItem(key, JSON.stringify(defaultData));
          return defaultData;
        }

        // Merge codebase default data with user's local storage data
        const merged = [...parsed];
        const uniqueKey = key === 'medpulse_users' ? 'email' : 'id';

        defaultData.forEach((defItem: any) => {
          if (!defItem) return;
          const defVal = String(defItem[uniqueKey] || '').toLowerCase().trim();

          const exists = merged.some((item: any) => {
            if (!item) return false;
            const itemVal = String(item[uniqueKey] || '').toLowerCase().trim();
            return itemVal === defVal;
          });

          const isDeleted = deletedList.includes(defVal);

          if (!exists && !isDeleted) {
            // New default record shipped in code updates! Merge it.
            merged.push(defItem);
          }
        });

        // Persist merged set
        localStorage.setItem(key, JSON.stringify(merged));
        return merged.filter((item: any) => item && typeof item === 'object');
      }
      return parsed && typeof parsed === 'object' ? parsed : defaultData;
    } catch {
      return defaultData;
    }
  };

  const saveLocalTable = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn('[MedPulse] localStorage write failed in saveLocalTable:', err);
    }
  };

  // Initialize standard tables with medically polished, highly realistic databases
  const defaultUsers: UserHealthProfile[] = [
    {
      name: "مدير النظام الطبي الموحد",
      email: "admin@medpulse.com",
      role: "admin",
      age: 40,
      weight: 75,
      height: 178,
      chronicConditions: [],
      subscriptionType: "Premium",
      additionalMeds: [],
      targetWeight: 75,
      dailyCalorieBudget: 2200,
      secondaryNotes: "إشراف شامل على البوابة والوصفات الطبية لمستفيدي السمنة والسكري."
    },
    {
      name: "د. فيصل العوادي",
      email: "doctor@medpulse.com",
      role: "doctor",
      age: 45,
      weight: 80,
      height: 182,
      chronicConditions: [],
      subscriptionType: "Premium",
      additionalMeds: [],
      targetWeight: 80,
      dailyCalorieBudget: 2200,
      secondaryNotes: "أخصائي مرخص في بوابات الرعاية السريرية المتكاملة."
    }
  ];

  const defaultDoctors: DoctorInfo[] = [
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

  const defaultPharmacies: PharmacyInfo[] = [
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

  const defaultPrescriptions: Prescription[] = [
    {
      id: "rx_1",
      doctorName: "د. أحمد الخفاجي",
      medicationName: "Metformin 500mg",
      dosage: "حبة واحدة مرتين يومياً",
      instructions: "بعد الأكل صباحاً ومساءً للتحكم بمعدل السكر التراكمي",
      pharmacyId: "ph_1",
      pharmacyName: "صيدلية بابل الكبرى",
      deliveryStatus: "Delivered",
      deliveryEstimatedDate: "تم الوصول والتسليم",
      createdAt: new Date().toISOString(),
      isSupplement: false,
      patientName: "المستفيد تجريبي",
      patientEmail: "admin@medpulse.com",
      isDigitalSigned: true,
      digitalSignatureHash: "sha256_0x4f12e8b9ac",
      sourceType: 'Doctor'
    }
  ];

  const localUsers = loadLocalTable('medpulse_users', defaultUsers);
  const localDoctors = loadLocalTable('medpulse_doctors', defaultDoctors);
  const localPharmacies = loadLocalTable('medpulse_pharmacies', defaultPharmacies);
  const localPrescriptions = loadLocalTable('medpulse_prescriptions', defaultPrescriptions);

  let currentEmail = 'admin@medpulse.com';
  try {
    currentEmail = localStorage.getItem('medpulse_current_email') || 'admin@medpulse.com';
  } catch (err) {
    console.warn('[MedPulse] localStorage read failed for currentEmail:', err);
  }

  const respondJSON = (status: number, data: any) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  // --- API ROUTER SWITCH ---

  // 1. Auth Login
  if (urlStr.includes('/api/login') && method === 'POST') {
    const email = body?.email;
    if (!email) return respondJSON(400, { error: 'Email is required' });

    const emailLower = email.toLowerCase();
    
    // Check if user exists in our local storage DB
    let user = localUsers.find((u: any) => (u?.email || '').toLowerCase() === emailLower);
    
    // If we have a registered doctor, link their user profile
    const matchedDoc = localDoctors.find((d: any) => (d?.email || '').toLowerCase() === emailLower);
    if (matchedDoc) {
      if (user) {
        user.role = 'doctor';
        user.name = matchedDoc.name || user.name;
      } else {
        user = {
          name: matchedDoc.name || 'مستشار طبي',
          email: matchedDoc.email || email,
          role: 'doctor',
          age: 42,
          weight: 78,
          height: 175,
          chronicConditions: [],
          subscriptionType: "Premium",
          additionalMeds: [],
          targetWeight: 75,
          dailyCalorieBudget: 2100
        };
        localUsers.push(user);
      }
      saveLocalTable('medpulse_users', localUsers);
    }

    if (!user) {
      // Auto-create to support instant login on Netlify
      user = {
        name: email.split('@')[0],
        email: email,
        role: emailLower.includes('admin') ? 'admin' : (emailLower.includes('dr') || emailLower.includes('doctor')) ? 'doctor' : 'patient',
        age: 38,
        weight: 85,
        height: 170,
        chronicConditions: ["obesity"],
        subscriptionType: "Basic",
        additionalMeds: [],
        targetWeight: 75,
        dailyCalorieBudget: 1800
      };
      localUsers.push(user);
      saveLocalTable('medpulse_users', localUsers);
    }

    try {
      localStorage.setItem('medpulse_current_email', email);
    } catch (err) {}
    return respondJSON(200, { success: true, user });
  }

  // 2. Auth Register
  if (urlStr.includes('/api/register') && method === 'POST') {
    const { name, email, age, weight, height, chronicConditions, targetWeight, role, secondaryNotes } = body;
    if (!email) return respondJSON(400, { error: 'Email is required' });

    const existing = localUsers.find((u: any) => (u?.email || '').toLowerCase() === email.toLowerCase());
    if (existing) {
      return respondJSON(400, { error: "المستخدم مسجل مسبقاً بهذا البريد الإلكتروني" });
    }

    const newUser = {
      name: name || "مستفيد جديد",
      email: email,
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

    localUsers.push(newUser);
    saveLocalTable('medpulse_users', localUsers);
    try {
      localStorage.setItem('medpulse_current_email', email);
    } catch (err) {}
    return respondJSON(200, { success: true, user: newUser });
  }

  // 3. User Health Profile get/set
  if (urlStr.includes('/api/health-profile')) {
    if (method === 'GET') {
      const user = localUsers.find((u: any) => (u?.email || '').toLowerCase() === (currentEmail || '').toLowerCase()) || localUsers[0];
      return respondJSON(200, user);
    }
    if (method === 'POST') {
      const idx = localUsers.findIndex((u: any) => (u?.email || '').toLowerCase() === (currentEmail || '').toLowerCase());
      if (idx !== -1) {
        localUsers[idx] = { ...localUsers[idx], ...body };
        saveLocalTable('medpulse_users', localUsers);
        if (localUsers[idx]?.email) {
          try {
            localStorage.setItem('medpulse_current_email', localUsers[idx].email);
          } catch (err) {}
        }
        return respondJSON(200, { success: true, user: localUsers[idx] });
      }
      return respondJSON(404, { error: "User not found" });
    }
  }

  // 4. All users (Roster)
  if (urlStr.includes('/api/all-users') && method === 'GET') {
    return respondJSON(200, localUsers);
  }

  // 5. Delete specific user
  if (urlStr.includes('/api/delete-user') && method === 'POST') {
    const { email } = body;
    const filtered = localUsers.filter((u: any) => (u?.email || '').toLowerCase() !== (email || '').toLowerCase());
    saveLocalTable('medpulse_users', filtered);
    return respondJSON(200, { success: true });
  }

  // 6. Admin create user manually
  if (urlStr.includes('/api/admin/create-user') && method === 'POST') {
    const { name, email, role, age, weight, height, chronicConditions, targetWeight, subscriptionType, secondaryNotes } = body;
    if (!email || !name) {
      return respondJSON(400, { error: "الرجاء تحديد الاسم والبريد الإلكتروني للمستخدم الجديد" });
    }
    const existing = localUsers.find((u: any) => (u?.email || '').toLowerCase() === (email || '').toLowerCase());
    if (existing) {
      return respondJSON(400, { error: "البريد الإلكتروني مسجل بالفعل لمستفيد آخر في النظام" });
    }

    const newUser = {
      name,
      email: (email || '').toLowerCase(),
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

    localUsers.push(newUser);
    saveLocalTable('medpulse_users', localUsers);
    return respondJSON(200, { success: true, user: newUser });
  }

  // 7. Doctors List & Actions
  if (urlStr.includes('/api/doctors')) {
    if (method === 'GET') {
      return respondJSON(200, localDoctors);
    }
    if (urlStr.includes('/register') && method === 'POST') {
      const { name, email, specialty, hospital, whatsappPhone, isPaid, availabilityType, startTime, endTime, workingDays, consultationFee, maxPatientsPerDay, platformPercentage } = body;
      if (!name || !email || !specialty) {
        return respondJSON(400, { error: "الرجاء تعبئة الاسم والبريد الإلكتروني والتخصص الطبي الحقيقي" });
      }

      const existing = localDoctors.find((d: any) => (d?.email || '').toLowerCase() === (email || '').toLowerCase());
      if (existing) {
        return respondJSON(400, { error: "هذا الطبيب مسجل مسبقاً في قاعدة بيانات المنصة" });
      }

      const newDoctor = {
        id: "dr_" + Math.floor(Math.random() * 10000),
        name,
        email,
        specialty,
        hospital: hospital || "مستشفى مجمع كير الطبي",
        rating: 5.0,
        whatsappPhone: whatsappPhone || "+9647700000000",
        isPaid: isPaid !== undefined ? isPaid : true,
        availabilityType: availabilityType || '24/7',
        startTime: startTime || '16:00',
        endTime: endTime || '21:00',
        workingDays: workingDays || ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
        consultationFee: consultationFee !== undefined ? Number(consultationFee) : 20000,
        maxPatientsPerDay: maxPatientsPerDay !== undefined ? Number(maxPatientsPerDay) : 15,
        platformPercentage: platformPercentage !== undefined ? Number(platformPercentage) : 0
      };

      localDoctors.push(newDoctor);
      saveLocalTable('medpulse_doctors', localDoctors);

      // Link User health profile
      const usr = localUsers.find((u: any) => (u?.email || '').toLowerCase() === (email || '').toLowerCase());
      if (!usr) {
        localUsers.push({
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
        saveLocalTable('medpulse_users', localUsers);
      }

      return respondJSON(200, { success: true, doctor: newDoctor });
    }
    if (urlStr.includes('/delete') && method === 'POST') {
      const { id } = body;
      const filtered = localDoctors.filter((d: any) => d.id !== id);
      saveLocalTable('medpulse_doctors', filtered);
      
      try {
        const delKey = 'medpulse_doctors_deleted';
        const d = localStorage.getItem(delKey);
        const dList = d ? JSON.parse(d) : [];
        const normId = String(id || '').toLowerCase().trim();
        if (!dList.includes(normId)) {
          dList.push(normId);
          localStorage.setItem(delKey, JSON.stringify(dList));
        }
      } catch (err) {}

      return respondJSON(200, { success: true });
    }
    if (urlStr.includes('/update') && method === 'POST') {
      const { id } = body;
      const idx = localDoctors.findIndex((d: any) => d.id === id);
      if (idx !== -1) {
        localDoctors[idx] = { ...localDoctors[idx], ...body };
        saveLocalTable('medpulse_doctors', localDoctors);
        return respondJSON(200, { success: true, doctor: localDoctors[idx] });
      }
      return respondJSON(444, { error: "Doctor not found" });
    }
  }

  // 8. Pharmacies
  if (urlStr.includes('/api/pharmacies')) {
    if (method === 'GET') {
      return respondJSON(200, localPharmacies);
    }
    if (urlStr.includes('/register') && method === 'POST') {
      const { name, district, lat, lng, phone, address } = body;
      if (!name || !district) return respondJSON(400, { error: "Name and district required" });

      const newPh = {
        id: "ph_" + Math.floor(Math.random() * 10000),
        name,
        district,
        lat: Number(lat) || 33.3248,
        lng: Number(lng) || 44.3644,
        phone: phone || "+9647701122334",
        address: address || `${district}، العراق`
      };
      localPharmacies.push(newPh);
      saveLocalTable('medpulse_pharmacies', localPharmacies);
      return respondJSON(200, { success: true, pharmacy: newPh });
    }
    if (urlStr.includes('/delete') && method === 'POST') {
      const { id } = body;
      const filtered = localPharmacies.filter((p: any) => p.id !== id);
      saveLocalTable('medpulse_pharmacies', filtered);

      try {
        const delKey = 'medpulse_pharmacies_deleted';
        const d = localStorage.getItem(delKey);
        const dList = d ? JSON.parse(d) : [];
        const normId = String(id || '').toLowerCase().trim();
        if (!dList.includes(normId)) {
          dList.push(normId);
          localStorage.setItem(delKey, JSON.stringify(dList));
        }
      } catch (err) {}

      return respondJSON(200, { success: true });
    }
    if (urlStr.includes('/update') && method === 'POST') {
      const { id } = body;
      const idx = localPharmacies.findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        localPharmacies[idx] = { ...localPharmacies[idx], ...body };
        saveLocalTable('medpulse_pharmacies', localPharmacies);
        return respondJSON(200, { success: true, pharmacy: localPharmacies[idx] });
      }
      return respondJSON(404, { error: "Pharmacy not found" });
    }
  }

  // 9. Prescriptions
  if (urlStr.includes('/api/prescriptions')) {
    if (method === 'GET') {
      return respondJSON(200, localPrescriptions);
    }
    if (method === 'POST') {
      if (urlStr.includes('/status')) {
        const rxId = getPathSegment(3);
        const rx = localPrescriptions.find((p: any) => p.id === rxId);
        if (rx) {
          rx.deliveryStatus = body.status;
          saveLocalTable('medpulse_prescriptions', localPrescriptions);
          return respondJSON(200, { success: true, prescription: rx });
        }
        return respondJSON(404, { error: "Prescription not found" });
      }
      if (urlStr.includes('/pharmacy')) {
        const rxId = getPathSegment(3);
        const rx = localPrescriptions.find((p: any) => p.id === rxId);
        if (rx) {
          rx.pharmacyName = body.pharmacyName;
          saveLocalTable('medpulse_prescriptions', localPrescriptions);
          return respondJSON(200, { success: true, prescription: rx });
        }
        return respondJSON(404, { error: "Prescription not found" });
      }

      // Create standard prescription
      const { medicationName, dosage, instructions, pharmacyName, isSupplement, patientName, patientEmail, isDigitalSigned, digitalSignatureHash, sourceType } = body;
      const newRx = {
        id: "rx_" + Math.floor(Math.random() * 10000),
        doctorName: body.doctorName || "د. سمر الخالدي",
        medicationName,
        dosage,
        instructions,
        pharmacyId: "ph_" + Math.floor(Math.random() * 1000),
        pharmacyName: pharmacyName || "صيدلية بابل الكبرى",
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
      
      localPrescriptions.unshift(newRx);
      saveLocalTable('medpulse_prescriptions', localPrescriptions);
      return respondJSON(200, { success: true, prescription: newRx });
    }
  }

  // 10. Offline Chatbot AI Fallback
  if (urlStr.includes('/api/chatbot') && method === 'POST') {
    const message = body?.message || "";
    let reply = "مرحباً بك! كطبيب رقمي ذكي، قمت بتحليل استفسارك. يرجى المتابعة بانتظام مع الأطباء المختصين لأي استشارة سريرية.";
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes("سكري") || lowerMsg.includes("سكر")) {
      reply = "مرحباً! لمستشارك الصحي للسكري، أنصح بالآتي: 1. الحفاظ على جرعات الميتفورمين أو الإنسولين المحددة من دكتورك. 2. مراقبة قياس السكر اليومي صباحاً وقبل النوم. 3. تقليل تناول الكربوهيدرات والاعتماد على الألياف الغذائية الشاملة والبروتين الخفيف. هل تود أن أعرض عليك جدول تغذية مخصص؟";
    } else if (lowerMsg.includes("ضغط") || lowerMsg.includes("الضغط")) {
      reply = "أهلاً بك! لصحة ضغط الدم والشرايين: 1. تقليل استهلاك ملح الصوديوم لأقل من غرامين يومياً. 2. الالتزام ببرنامج السير المعتدل لمدة 30 دقيقة يومياً. 3. رصد قياسات الضغط بانتظام والتأكد من استقرارها حول 120/80 ملليمتر زئبقي.";
    } else if (lowerMsg.includes("سمنة") || lowerMsg.includes("وزن")) {
      reply = "للتخلص من السمنة والوصول للوزن الصحي: 1. التركيز على حرق السعرات الحرارية عبر الالتزام ببرنامج عجز السعرات (مثال: 1500-1800 سعرة يومياً). 2. استهلاك أطعمة غنية بالبروتينات لزيادة الشعور بالشبع لفترة أطول. 3. شرب ما لا يقل عن 3 لترات من الماء للمساعدة في تنشيط الأيض وتطهير الجسم.";
    } else if (lowerMsg.includes("دواء") || lowerMsg.includes("وصفة")) {
      reply = "يمكنك مراجعة كافة وصفاتك الطبية المعتمدة في علامة تبويب الوصفات. كما يمكنك ربط أي وصفة بالصيدليات الشريكة لتوصيل الدواء لباب منزلك مباشرة بنطاق التوصيل الجغرافي المعزز.";
    }

    return respondJSON(200, { reply });
  }

  // 11. Offline AI Calorie & Diet Calculation Fallback (Supports custom domains like medpulse-iq.com and Netlify)
  if (urlStr.includes('/api/calculate-calories') && method === 'POST') {
    const { age, weight, height, chronicConditions, healthGoal, activityLevel, dietType } = body || {};
    const conditions = chronicConditions || [];
    const hasDiabetes = conditions.includes("diabetes");
    const hasHypertension = conditions.includes("hypertension");
    const hasObesity = conditions.includes("obesity");

    // Mifflin-St Jeor equation baseline for average activity
    let bmr = 10 * (Number(weight) || 80) + 6.25 * (Number(height) || 170) - 5 * (Number(age) || 35) + 5;
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

    let advice = "يرجى الالتزام بالترطيب اليومي الكافي من خلال شرب المياه النقية والابتعاد التام عن الدهون المشبعة المسببة للالتهابات الخلوية.";
    
    if (hasDiabetes && hasHypertension && hasObesity) {
      advice = "توجيه طبي معتمد لحالتك الثلاثية (السكري وضغط الدم المرتفع والسمنة): نوصي باتباع نمط غذائي هجين يدمج حمية DASH ومحدد الكربوهيدرات. يجب ألا يتجاوز استهلاك الملح اليومي 1500 ملجم (أقل من نصف ملعقة صغيرة)، مع الامتناع التام عن الدقيق والخبز الأبيض والأرز الأبيض لتعويضها بالحبوب الكاملة وبراعم الكينوا، والمواظبة على النشاط البدني المعتدل كالمشي السريع لمدة 30 دقيقة يومياً لتحفيز حساسية مستقبلات الإنسولين الطرفية.";
    } else if (hasDiabetes && hasObesity) {
      advice = "توجيه طبي لمكافحة السكري والسمنة معاً: نوصي بخفض السعرات الحرارية تدريجياً لضمان خسارة آمنة لمخزون الدهون بمعدل 0.5 إلى 1 كجم أسبوعياً. ركز كلياً على الحد من السكريات البسيطة والمشروبات الغازية الخالية، والاعتماد على الخضروات الورقية والبروتين الصافي لتنشيط الأيض وتحسين استجابة الميتفورمين.";
    } else if (hasDiabetes && hasHypertension) {
      advice = "توجيه طبي هام للتحكم في الضغط المرتفع والسكري: يوصى بدمج حمية DASH مع توزيع منظم للكربوهيدرات على مدار اليوم. احرص على تناول الأغذية الغنية بالبوتاسيوم والمغنيسيوم كالمكسرات النيئة وحبوب السمسم والسبانخ الطازجة بالتوازي مع قياس المؤشرات الحيوية بشكل مستمر.";
    } else if (hasDiabetes) {
      advice = "توجيه طبي للسيطرة المثالية على تذبذب سكر الدم وسكر التراكمي: يُوصى بتقسيم وجباتك الغذائية إلى 3 وجبات رئيسية ووجبتين خفيفتين تفصل بينها 4 ساعات، مع تضمين الألياف القابلة للذوبان من الشوفان والبقوليات، لضمان استقرار إفراز الإنسولين الطبيعي.";
    } else if (hasHypertension) {
      advice = "توجيه طبي لخفض ضغط الدم المرتفع وحماية الشرايين: يوصى بباتباع حمية DASH الطبية ذات المحتوى المنخفض من صوديوم الطعام. تجنب تماماً المعلبات، الشيبس، والوجبات الجاهزة، واعتمد كلياً على نكهات الليمون، الثوم الطازج، وزيت الزيتون كبدائل للملح مع تناول أغذية غنية بالبوتاسيوم مثل الموز والأفوكادو.";
    } else if (hasObesity) {
      advice = "توجيه طبي لدعم تخفيف الوزن الزائد بأسلوب صحي دائم: ركز على تحقيق عجز حراري مدروس يتراوح بين 300 إلى 500 سعرة حرارية يومياً. ابدأ وجباتك بتناول كوبين من الماء العذب وطبق سلطة كبير لملء فراغ المعدة ومساعدة الأنسجة على حرق الخلايا الشحمية بكفاءة.";
    }

    const recipesPool = [
      {
        title: "شرائح صدور الدجاج المشوية بالأعشاب الطبية مع البطاطا الحلوة المهروسة",
        prepTime: "25 دقيقة",
        calories: 390,
        ingredients: [
          "150 جرام صدر دجاج طازج بلا جلد",
          "طماطم كرزية طازجة، جرجير بري، فص ثوم مهروس",
          "حبة متوسطة بطاطا حلوة مسلوقة",
          "ملعقة صغيرة زيت زيتون بكر ممتاز وثوم وتوابل طبيعية خالية من الصوديوم"
        ],
        instructions: [
          "يُنقع الدجاج في عصير الليمون والروزماري والأوريغانو والجرجير والثوم المهروس.",
          "يُطهى الدجاج على شواية كهربائية دافئة بدون استخدام أي دهون مهدرجة إضافية.",
          "تهرس البطاطا الحلوة الدافئة جيداً كبديل ممتاز غني بالألياف ومنخفض الحمل الجلايسيمي.",
          "يقدم الطبق منسقاً مع كوب ماء بارد."
        ],
        whySuitable: "خالٍ تماماً من الملح المضاف لخفض ضغط الشرايين، وغني ببروتين بناء العضلات والنشويات المعقدة التي تثبت سكر الأوعية لعدة ساعات."
      },
      {
        title: "طبق سلطة الكينوا العضوية مع سمك السلمون المخبوز والأفوكادو",
        prepTime: "20 دقيقة",
        calories: 430,
        ingredients: [
          "نصف كوب كينوا مطبوخة على البخار",
          "شريحة سلمون بري طازج (100 جرام)",
          "أوراق البقدونس والخيار المقطع الصغير، طماطم، ربع حبة أفوكادو",
          "عصير ليمونة حامضة وملعقة زيت زيتون بكر"
        ],
        instructions: [
          "يُوضع السلمون داخل الفرن مع ورقة الليمون والكمون والفلفل الأسود لمدة 14 دقيقة.",
          "تُخلط الكينوا الباردة بالخضار والأفوكادو المفروم مع إضافة عصير الليمونة وزيت الزيتون.",
          "تُوضع شريحة السلمون الساخنة فوق السلطة الملونة وتقدم بلطف لمريض السكري والقلب."
        ],
        whySuitable: "خني بمركبات أوميجا-3 الصحية لتقوية عضلات القلب وخفض الدهون الثلاثية، مع مؤشر جلايسيمي شديد الانخفاض لثبات السكر."
      },
      {
        title: "شوربة الشوفان الصحية المحضرة بمرق اللحم والخضروات العضوية",
        prepTime: "15 دقيقة",
        calories: 280,
        ingredients: [
          "4 ملاعق شوفان حبة كاملة",
          "كوب ونصف مرق دجاج أو لحم محضر بالمنزل خالي من الدهون ومنزوع الدسم",
          "كرفس مقطع، جزر، وبازلاء طازجة",
          "رشة ثوم بودرة وقرنفل مطحون"
        ],
        instructions: [
          "تُسخن المرقة النقية وتغمر معها قطع الكرفس والجزر والبازلاء حتى تليين.",
          "يُضاف الشوفان رويداً رويداً ويُطهى على نار هادئة لمدة 10 دقائق لتتحول لشوربة متماسكة ولذيذة.",
          "تُسكب دافئة في كوب تقديم صحي."
        ],
        whySuitable: "محتوى البيتا جلوكان العالي بالشوفان يخفض السكر التراكمي والكوليسترول، ومثالي كوجبة متكاملة دافئة لتخفيف السمنة والوزن الزائد."
      }
    ];

    let recipes = [recipesPool[0]];
    if (hasDiabetes || hasHypertension) {
      recipes = [recipesPool[1], recipesPool[0]];
    } else if (hasObesity) {
      recipes = [recipesPool[0], recipesPool[2]];
    }

    const supplements = [];
    if (hasDiabetes) {
      supplements.push({
        name: "بيكولينات الكروم (Chromium Picolinate)",
        purpose: "زيادة حساسية مستقبلات الأنسولين وتقليل مقاومة الأنسولين بالجسم والتحكم العالي في تذبذب السكر.",
        dosage: "200 ميكروجرام حبة واحدة مع وجبة الغداء الرئيسية",
        whySuitable: "يساعد على الحد من الرغبة الشديدة في تناول الحلويات والكربوهيدرات البسيطة، وهو معزز سريري رائع."
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
        whySuitable: "داعم خلوعي ممتاز للقلب والأوعية ويقلل من الإجهاد الشرياني."
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
        whySuitable: "يعمل على تفعيل حرق خلايا الدهون البنية بأمان وبدون إثارة مفرطة للضغط."
      });
    }

    if (supplements.length === 0) {
      supplements.push({
        name: "أوميغا-3 البحري المقطر (Omega-3 Fish Oil)",
        purpose: "دعم صحة الأوعية، وتقوية خلايا الإدراك الذهني، وتخفيف مسببات الالتهابات الخلوية الخفية.",
        dosage: "1000 ملجم كبسولة واحدة يومياً مع وجبة الغداء",
        whySuitable: "داعم مثالي للصحة العامة للشرايين والجهاز العصبي."
      });
    }

    const dietPlan = {
      dailyCalories,
      macroRatio: { carbs, protein, fat },
      advice,
      recipes,
      supplements
    };

    return respondJSON(200, dietPlan);
  }

  // Default Fallback Response
  return respondJSON(200, { success: true });
};

// Auto intercept local and global fetch calls to support foolproof fallback offline simulation globally (e.g. on Netlify)
let originalFetch = window.fetch;
const customGlobalFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as any).url || '');
  
  let isApi = false;
  try {
    if (urlStr.startsWith('/') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      const urlObj = urlStr.startsWith('/') ? new URL(urlStr, window.location.origin) : new URL(urlStr);
      isApi = urlObj.pathname.startsWith('/api/');
    } else {
      isApi = urlStr.includes('/api/');
    }
  } catch (e) {
    isApi = urlStr.includes('/api/');
  }

  if (isApi) {
    try {
      let isNetlify = false;
      try {
        isNetlify = window.location.hostname.includes('netlify.app');
      } catch {}

      if (isNetlify) {
        // Direct local storage routing to avoid slow connection delays or 404 blocks on static hosts like Netlify
        return await handleLocalApiRequest(input, init);
      }
      
      const apiBase = "";
      const targetInput = typeof input === 'string' && input.startsWith('/api/') ? apiBase + input : input;

      // Inject user email header with fallback try-catch for iframe security constraints
      let email = '';
      try {
        email = localStorage.getItem('medpulse_current_email') || '';
      } catch (err) {
        console.warn('[MedPulse] localStorage read failed in customGlobalFetch:', err);
      }

      const headers = new Headers(init?.headers);
      if (email) {
        headers.set('x-user-email', email);
      }
      
      const modifiedInit = {
        ...(init || {}),
        headers
      };

      const response = await originalFetch(targetInput, modifiedInit).catch(() => null);
      if (response) {
        // If the server responded, we should ALWAYS return the server response.
        // We should NEVER fall back to localStorage if the server responded (even if response.ok is false, e.g., 400 Bad Request).
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.warn(`[MedPulse Failover] API ${urlStr} returned text/html (likely 404 SPA fallback). Fallback to localStorage.`);
          return await handleLocalApiRequest(input, init);
        }
        return response;
      }
      
      // If the server could not be reached (network is offline / response is null)
      const method = (init?.method || 'GET').toUpperCase();
      if (method === 'GET') {
        console.warn(`[MedPulse Offline] Server unreachable for GET ${urlStr}. Falling back to localStorage cache.`);
        return await handleLocalApiRequest(input, init);
      } else {
        console.error(`[MedPulse Offline] Server unreachable for write request ${method} ${urlStr}. Cannot persist changes.`);
        return new Response(JSON.stringify({ error: 'عذراً، الخادم غير متصل بالشبكة حالياً. لا يمكن حفظ التعديلات.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.warn(`[MedPulse Failover] API error on ${urlStr}. Intercepting request:`, error);
      const method = (init?.method || 'GET').toUpperCase();
      if (method === 'GET') {
        try {
          return await handleLocalApiRequest(input, init);
        } catch (innerErr) {
          console.error('[MedPulse Failover] localStorage also failed:', innerErr);
          return new Response(JSON.stringify({ error: 'Critical Database Failover Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } else {
        return new Response(JSON.stringify({ error: 'عذراً، حدّث خطأ في الشبكة ولم نتمكن من إرسال البيانات.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
  return originalFetch(input, init);
};

// Override globally for other components (e.g., VoipTwilio, AiNutrition)
try {
  Object.defineProperty(window, 'fetch', {
    value: customGlobalFetch,
    writable: true,
    configurable: true
  });
} catch (e) {
  console.warn('[MedPulse] Could not redefine window.fetch, fallback to lexical const');
}

// Local helper for references inside App.tsx
const fetch = customGlobalFetch;

export default function App() {
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState(35);
  const [regWeight, setRegWeight] = useState(80);
  const [regHeight, setRegHeight] = useState(175);
  const [regMeds, setRegMeds] = useState('');
  const [regConditions, setRegConditions] = useState<('diabetes' | 'hypertension' | 'obesity')[]>([]);
  const [regNotes, setRegNotes] = useState('');
  
  // App primary states
  const [currentUser, setCurrentUser] = useState<UserHealthProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserHealthProfile[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'nutrition' | 'voip' | 'chatbot' | 'partners' | 'admin' | 'archive'>('dashboard');
  
  // Chatbot states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome_01",
      sender: "bot",
      text: "مرحباً بك في تطبيق MedPulse الذكي للرعاية الصحية. أنا طبيبك الرقمي المساعد، تفضل بطرح أي سؤال وسأقوم بتحليل ملفك الطبي فورا ومساعدتك.",
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userQuery, setUserQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showTrialBlockedModal, setShowTrialBlockedModal] = useState(false);

  // New Prescription Creator states (Doctor/Admin view)
  const [newRxMeds, setNewRxMeds] = useState('');
  const [newRxDosage, setNewRxDosage] = useState('');
  const [medicationItems, setMedicationItems] = useState<{ name: string; dosage: string; instructions: string }[]>([{ name: '', dosage: '', instructions: '' }]);
  const [newRxInstructions, setNewRxInstructions] = useState('');
  const [newRxPharmacy, setNewRxPharmacy] = useState('صيدلية بابل الكبرى');
  const [isRxSupplement, setIsRxSupplement] = useState(false);
  const [newRxPatientEmail, setNewRxPatientEmail] = useState('');
  const [isDigitalSignedRx, setIsDigitalSignedRx] = useState(true);
  const [isRxFreeReviewRequest, setIsRxFreeReviewRequest] = useState(false);
  const [selectedRxForPrint, setSelectedRxForPrint] = useState<Prescription | null>(null);
  const [rxSourceFilter, setRxSourceFilter] = useState<'all' | 'doctor' | 'ai'>('all');
  const [forceRender, setForceRender] = useState(0); // For reactive localstorage state updates
  const [patientSearch, setPatientSearch] = useState('');

  // Subscription Checkout Modal state
  const [showCheckoutModal, setShowCheckoutModal] = useState<SubscriptionType | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'plan' | 'pay' | 'success'>('plan');
  const [cardNumber, setCardNumber] = useState('4000 1234 5678 9010');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  // QR Barcode & Portable App Installer Screen Simulator states
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [activeLaunchTab, setActiveLaunchTab] = useState<'qr' | 'install' | 'simulator'>('qr');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [simulatedDevice, setSimulatedDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  
  // Doctor/Pharmacy/Admin keychain QR login states
  const [showKeychainModal, setShowKeychainModal] = useState(false);
  const [keychainUser, setKeychainUser] = useState<{ name: string; email: string; role: 'doctor' | 'pharmacy' | 'admin'; detail?: string } | null>(null);
  
  // Simulated Barcode Camera Scanner Login states
  const [isBarcodeLoginMode, setIsBarcodeLoginMode] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [selectedScanTarget, setSelectedScanTarget] = useState<string>('doctor@medpulse.com');

  // WhatsApp Sales and Service Number (Persisted in localStorage)
  const [whatsappSalesPhone, setWhatsappSalesPhoneInternal] = useState<string>(() => {
    return localStorage.getItem('whatsappSalesPhone') || '+9647716662902';
  });

  const setWhatsappSalesPhone = (val: string) => {
    localStorage.setItem('whatsappSalesPhone', val);
    setWhatsappSalesPhoneInternal(val);
  };

  // Public/Shared App Platform URL (Persisted in localStorage for QR and sharing)
  const [platformUrl, setPlatformUrlInternal] = useState<string>(() => {
    return localStorage.getItem('medpulse_platform_url') || (window.location.origin.includes('localhost') ? 'https://ais-pre-bi6ebxu27ytej4bnnm2c5u-725546486101.europe-west2.run.app' : window.location.origin);
  });

  const setPlatformUrl = (val: string) => {
    localStorage.setItem('medpulse_platform_url', val);
    setPlatformUrlInternal(val);
  };

  // Register PWA "beforeinstallprompt" events to capture device loading suitability
  useEffect(() => {
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    
    // Check if running in standalone display mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  const handlePwaInstall = async () => {
    if (!deferredPrompt) {
      showToast('جهازك لا يدعم التثبيت التلقائي التلقائي حالياً. يرجى استخدام متصفح Chrome/Safari واختيار "إضافة للشاشة الرئيسية" يدوياً.', 'info');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setPwaInstalled(true);
      setDeferredPrompt(null);
      showToast('رائع! تمت إضافة تطبيق MedPulse إلى شاشتك بنجاح 🎉', 'success');
    }
  };

  // Listen for magicLogin query parameter to support direct login via QR code
  useEffect(() => {
    if (!isLoggedIn) {
      const params = new URLSearchParams(window.location.search);
      const email = params.get('magicLogin');
      if (email) {
        const performAutoLogin = async () => {
          try {
            const res = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) {
              setIsLoggedIn(true);
              setCurrentUser(data.user);
              localStorage.setItem('medpulse_current_email', data.user.email);
              showToast(`مرحباً بك! تم تسجيل الدخول تلقائياً بالرمز المشفر: ${data.user.name} 🔑`, 'success');
              fetchPrescriptions();
              fetchAllUsers();
              
              // Clean query parameters from URL without full reload so user has clean experience
              const cleanUrl = window.location.origin + window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
            }
          } catch (e) {
            showToast('فشل الدخول التلقائي بالرمز المشفر', 'error');
          }
        };
        performAutoLogin();
      }
    }
  }, [isLoggedIn]);

  // Listen for query parameter / rxEmail to auto-route doctors to prescription screen
  useEffect(() => {
    if (isLoggedIn) {
      const params = new URLSearchParams(window.location.search);
      const rxEmail = params.get('rxEmail');
      if (rxEmail) {
        setNewRxPatientEmail(rxEmail);
        setActiveTab('admin');
        // Clean query parameters from URL without full reload so user has clean experience
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        showToast(`مرحباً دكتور! تم الانتقال تلقائياً لصفحة كتابة الوصفة وتحديد بريد المريض المرجعي (${rxEmail}) 📋🩺`, 'success');
      }
    }
  }, [isLoggedIn]);

  // Local weight state for range slider to prevent slamming the server on every drag step
  const [sliderWeight, setSliderWeight] = useState<number>(75);

  useEffect(() => {
    if (currentUser) {
      setSliderWeight(currentUser.weight);
    }
  }, [currentUser?.weight]);

  // Info message state (toast)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Doctors & Pharmacies States
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyInfo[]>([]);
  const [sessions, setSessions] = useState<MedicalSession[]>([]);
  const [editingDoctor, setEditingDoctor] = useState<DoctorInfo | null>(null);
  const [editingPharmacy, setEditingPharmacy] = useState<PharmacyInfo | null>(null);
  const [syncCode, setSyncCode] = useState('');
  const [importCode, setImportCode] = useState('');

  // Registration form inputs
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docHospital, setDocHospital] = useState('');
  const [docWhatsApp, setDocWhatsApp] = useState('');
  const [docIsPaid, setDocIsPaid] = useState<boolean>(true);
  const [docAvailabilityType, setDocAvailabilityType] = useState<'24/7' | 'custom'>('custom');
  const [docStartTime, setDocStartTime] = useState('16:00');
  const [docEndTime, setDocEndTime] = useState('21:00');
  const [docWorkingDays, setDocWorkingDays] = useState<string[]>(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]);
  const [docConsultationFee, setDocConsultationFee] = useState<number>(20000);
  const [docMaxPatientsPerDay, setDocMaxPatientsPerDay] = useState<number>(12);
  const [docPlatformPercentage, setDocPlatformPercentage] = useState<number>(0);

  const [phName, setphName] = useState('');
  const [phProvince, setPhProvince] = useState('');
  const [phDistrictDetail, setPhDistrictDetail] = useState('');
  const [phDistrict, setphDistrict] = useState('');
  const [phPhone, setphPhone] = useState('');
  const [phLat, setphLat] = useState('33.3248');
  const [phLng, setphLng] = useState('44.3644');
  const [phAddress, setphAddress] = useState('');

  // Geographic matching simulation
  const [userLocationQuery, setUserLocationQuery] = useState('بغداد - الحارثية');

  // Fetch Doctors List
  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (e) {
      console.error("Error fetching doctors:", e);
    }
  };

  // Fetch Pharmacies List
  const fetchPharmacies = async () => {
    try {
      const res = await fetch('/api/pharmacies');
      if (res.ok) {
        const data = await res.json();
        setPharmacies(data);
      }
    } catch (e) {
      console.error("Error fetching pharmacies:", e);
    }
  };

  // Fetch Clinical Sessions List
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/clinical-sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("Error fetching clinical sessions:", e);
    }
  };

  const handleUpdateSession = async (updatedSess: MedicalSession) => {
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === updatedSess.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updatedSess;
        return copy;
      } else {
        return [updatedSess, ...prev];
      }
    });

    try {
      await fetch('/api/clinical-sessions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSess)
      });
    } catch (err) {
      console.error("Error pushing session update to server:", err);
    }
  };

  // Export and import clinical data sync functions (for local offline multi-device sync)
  const handleExportSyncCode = () => {
    const exportKeys = [
      'medpulse_doctors',
      'medpulse_pharmacies',
      'medpulse_users',
      'medpulse_prescriptions',
      'medpulse_doctors_deleted',
      'medpulse_pharmacies_deleted'
    ];
    
    const syncObj: Record<string, any> = {};
    exportKeys.forEach(k => {
      try {
        const val = localStorage.getItem(k);
        if (val) syncObj[k] = JSON.parse(val);
      } catch (e) {}
    });
    
    syncObj['exported_at'] = new Date().toISOString();
    
    try {
      const jsonStr = JSON.stringify(syncObj);
      const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
      setSyncCode(b64);
      showToast('تم توليد كود المزامنة بنجاح! انسخه واستورده في الهاتف المحمول الخاص بك 📲', 'success');
    } catch (err) {
      showToast('فشل تشفير كود المزامنة، الرجاء المحاولة مجدداً', 'error');
    }
  };

  const handleImportSyncCode = (codeStr: string) => {
    if (!codeStr || !codeStr.trim()) {
      showToast('الرجاء لصق كود المزامنة أولاً للبدء الاستيراد', 'error');
      return;
    }
    
    const exportKeys = [
      'medpulse_doctors',
      'medpulse_pharmacies',
      'medpulse_users',
      'medpulse_prescriptions',
      'medpulse_doctors_deleted',
      'medpulse_pharmacies_deleted'
    ];

    try {
      let jsonStr = '';
      try {
        jsonStr = decodeURIComponent(escape(atob(codeStr.trim())));
      } catch (e) {
        jsonStr = codeStr.trim(); // fallback if plain JSON
      }
      
      const syncObj = JSON.parse(jsonStr);
      let importedCount = 0;
      
      exportKeys.forEach(k => {
        if (syncObj[k] !== undefined) {
          localStorage.setItem(k, JSON.stringify(syncObj[k]));
          importedCount++;
        }
      });
      
      if (importedCount === 0) {
        showToast('كود المزامنة غير صالح أو لا يحتوي على بيانات متوافقة', 'error');
        return;
      }
      
      showToast('تم استيراد كافة البيانات الطبية وجدول الأطباء بنجاح! جاري تحديث الشاشة...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      showToast('كود المزامنة تالف أو غير كامل، يرجى التأكد من نسخه بالكامل', 'error');
    }
  };

  // Delete a Doctor
  const handleDeleteDoctor = async (id: string, name: string) => {
    try {
      const res = await fetch('/api/doctors/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast(`تم حذف وإلغاء اعتماد الطبيب "${name}" من المنصة`, 'info');
        fetchDoctors();
      } else {
        showToast('فشل حذف الطبيب، يرجى المحاولة لاحقاً', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('خطأ في الاتصال بالخادم عند حذف الطبيب', 'error');
    }
  };

  // Delete a Pharmacy
  const handleDeletePharmacy = async (id: string, name: string) => {
    try {
      const res = await fetch('/api/pharmacies/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast(`تم شطب وإلغاء صيدلية "${name}" من قاعدة البيانات`, 'info');
        fetchPharmacies();
      } else {
        showToast('فشل حذف الصيدلية، يرجى المحاولة لاحقاً', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('خطأ في الاتصال بالخادم عند حذف الصيدلية', 'error');
    }
  };

  // Handle editing/updating a doctor
  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    if (!editingDoctor.name || !editingDoctor.email || !editingDoctor.specialty) {
      showToast('الرجاء تعبئة الحقول الأساسية للطبيب', 'error');
      return;
    }
    try {
      const res = await fetch('/api/doctors/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDoctor)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`تم تحديث بيانات الطبيب "${editingDoctor.name}" بنجاح!`, 'success');
        setEditingDoctor(null);
        fetchDoctors();
        fetchAllUsers();
        if (currentUser && currentUser.email.toLowerCase() === editingDoctor.email.toLowerCase()) {
          fetchProfile();
        }
      } else {
        showToast(data.error || 'فشلت عملية تحديث بيانات الطبيب', 'error');
      }
    } catch (e) {
      showToast('خطأ في الاتصال بالخادم', 'error');
    }
  };

  // Handle editing/updating a pharmacy
  const handleUpdatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPharmacy) return;
    if (!editingPharmacy.name || !editingPharmacy.district) {
      showToast('الرجاء تعبئة الاسم الرسمي والصيدلية والحي لتعديل الصيدلية', 'error');
      return;
    }
    try {
      const res = await fetch('/api/pharmacies/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPharmacy)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`تم تعديل بيانات الصيدلية "${editingPharmacy.name}" بنجاح!`, 'success');
        setEditingPharmacy(null);
        fetchPharmacies();
      } else {
        showToast(data.error || 'فشلت عملية تعديل بيانات الصيدلية', 'error');
      }
    } catch (e) {
      showToast('خطأ في الاتصال بالخادم', 'error');
    }
  };

  // Handle registering a new doctor
  const handleRegisterDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docEmail || !docSpecialty) {
      showToast('الرجاء تعبئة الحقول الأساسية للطبيب', 'error');
      return;
    }
    try {
      const res = await fetch('/api/doctors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName,
          email: docEmail,
          specialty: docSpecialty,
          hospital: docHospital,
          whatsappPhone: docWhatsApp,
          isPaid: docIsPaid,
          availabilityType: docAvailabilityType,
          startTime: docStartTime,
          endTime: docEndTime,
          workingDays: docWorkingDays,
          consultationFee: docConsultationFee,
          maxPatientsPerDay: docMaxPatientsPerDay,
          platformPercentage: docPlatformPercentage
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('تم تسجيل الطبيب بنجاح وتفعيل حسابه المهني بالمنصة!', 'success');
        setDocName('');
        setDocEmail('');
        setDocSpecialty('');
        setDocHospital('');
        setDocWhatsApp('');
        setDocIsPaid(true);
        setDocAvailabilityType('custom');
        setDocStartTime('16:00');
        setDocEndTime('21:00');
        setDocWorkingDays(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]);
        setDocConsultationFee(20000);
        setDocMaxPatientsPerDay(12);
        setDocPlatformPercentage(0);
        fetchDoctors();
        // Sync system logins as doctor too
        fetchAllUsers();
      } else {
        showToast(data.error || 'فشل تسجيل الطبيب', 'error');
      }
    } catch (e) {
      showToast('خطأ في شبكة الخادم', 'error');
    }
  };

  // Handle registering a new pharmacy
  const handleRegisterPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phName || !phProvince || !phDistrictDetail) {
      showToast('الرجاء تعبئة الاسم الرسمي والمحافظة والقضاء لتسجيل الصيدلية', 'error');
      return;
    }
    const finalDistrictString = `${phProvince.trim()} - ${phDistrictDetail.trim()}`;
    try {
      const res = await fetch('/api/pharmacies/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: phName,
          district: finalDistrictString,
          phone: phPhone,
          lat: phLat ? Number(phLat) : null,
          lng: phLng ? Number(phLng) : null,
          address: phAddress
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('تم تسجيل الصيدلية كشريك معتمد بنطاق التوصيل الجغرافي المفلتر!', 'success');
        setphName('');
        setPhProvince('');
        setPhDistrictDetail('');
        setphDistrict('');
        setphPhone('');
        setphLat('33.3248');
        setphLng('44.3644');
        setphAddress('');
        fetchPharmacies();
      } else {
        showToast(data.error || 'فشلت عملية التسجيل', 'error');
      }
    } catch (e) {
      showToast('خطأ في إرسال طلب الصيدلية', 'error');
    }
  };

  // Request Medication from Pharmacy States
  const [selectedPharmacyForOrder, setSelectedPharmacyForOrder] = useState<PharmacyInfo | null>(null);
  const [orderMedName, setOrderMedName] = useState('');
  const [orderMedQty, setOrderMedQty] = useState('علبة واحدة');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderDeliveryAddress, setOrderDeliveryAddress] = useState('');

  // Handle direct medication order from any pharmacy
  const handleOrderFromPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderMedName) {
      showToast('الرجاء إدخال اسم الدواء أو العلاج المطلوب', 'error');
      return;
    }
    if (!selectedPharmacyForOrder) return;

    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationName: orderMedName,
          dosage: orderMedQty,
          instructions: orderNotes ? `طلب توصيل مباشر: ${orderNotes}` : `طلب توصيل مباشر للعنوان: ${orderDeliveryAddress || 'العنوان الوطني للمستفيد'}`,
          pharmacyName: selectedPharmacyForOrder.name,
          doctorName: "طلب مباشر (مستفيد)"
        }),
      });
      if (res.ok) {
        showToast(`تم استقبال طلبك بنجاح من صيدلية "${selectedPharmacyForOrder.name}" وجاري تجهيز الدواء للتوصيل الفوري!`, 'success');
        setOrderMedName('');
        setOrderMedQty('علبة واحدة');
        setOrderNotes('');
        setOrderDeliveryAddress('');
        setSelectedPharmacyForOrder(null); // close dialog
        fetchPrescriptions(); // reload list
      } else {
        showToast('فشل تسجيل طلب الدواء، الرجاء المحاولة مجدداً', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('خطأ في إرسال طلب الصرف الفوري للصيدلية الشريكة', 'error');
    }
  };
  const [adminNewName, setAdminNewName] = useState('');
  const [adminNewEmail, setAdminNewEmail] = useState('');
  const [adminNewRole, setAdminNewRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [adminNewAge, setAdminNewAge] = useState<string>('35');
  const [adminNewWeight, setAdminNewWeight] = useState<string>('75');
  const [adminNewHeight, setAdminNewHeight] = useState<string>('170');
  const [adminNewSubscription, setAdminNewSubscription] = useState<'Basic' | 'Premium'>('Basic');
  const [adminNewConditions, setAdminNewConditions] = useState<string[]>([]);
  const [adminNewNotes, setAdminNewNotes] = useState('');

  const toggleAdminCondition = (cond: string) => {
    if (adminNewConditions.includes(cond)) {
      setAdminNewConditions(adminNewConditions.filter(c => c !== cond));
    } else {
      setAdminNewConditions([...adminNewConditions, cond]);
    }
  };

  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewName || !adminNewEmail) {
      showToast('الرجاء تعبئة الاسم والبريد الإلكتروني الأساسي للمستفيد', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/create-user', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           name: adminNewName,
           email: adminNewEmail,
           role: adminNewRole,
           age: Number(adminNewAge) || 35,
           weight: Number(adminNewWeight) || 75,
           height: Number(adminNewHeight) || 170,
           chronicConditions: adminNewConditions,
           subscriptionType: adminNewSubscription,
           targetWeight: (Number(adminNewWeight) || 75) - 5,
           secondaryNotes: adminNewNotes
         })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`تمت إضافة المستخدم الجديد "${adminNewName}" لتطبيق رعاية السكري والسمنة والضغط بنجاح!`, 'success');
        setAdminNewName('');
        setAdminNewEmail('');
        setAdminNewRole('patient');
        setAdminNewAge('35');
        setAdminNewWeight('75');
        setAdminNewHeight('170');
        setAdminNewConditions([]);
        setAdminNewSubscription('Basic');
        setAdminNewNotes('');
        fetchAllUsers(); // update the table lists immediately
      } else {
        showToast(data.error || 'فشلت عملية الإضافة', 'error');
      }
    } catch (err) {
      showToast('خطأ في شبكة الاتصال لتسجيل البيانات', 'error');
    }
  };

  // Restore session on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('medpulse_current_email');
    if (savedEmail && !isLoggedIn) {
      const restoreSession = async () => {
        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: savedEmail }),
          });
          const data = await res.json();
          if (data.success) {
            setIsLoggedIn(true);
            setCurrentUser(data.user);
            fetchPrescriptions();
            fetchAllUsers();
          }
        } catch (e) {
          console.error("Failed to restore session:", e);
        }
      };
      restoreSession();
    }
  }, []);

  // Fetch initial partners lists in useEffect
  useEffect(() => {
    if (isLoggedIn) {
      fetchDoctors();
      fetchPharmacies();
      fetchSessions();
    }
  }, [isLoggedIn]);

  // Connect to the real-time Server-Sent Events stream for instant cross-device updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        console.log("📡 [MedPulse Sync] Connecting to real-time Server-Sent Events stream...");
        const apiBase = "";
        eventSource = new EventSource(apiBase + "/api/sync-stream");

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === "ping") return; // heart-beat ping
            
            console.log("⚡ [MedPulse Sync] Received real-time update event:", payload.type);
            if (payload.data) {
              const { doctorsList, pharmaciesList, prescriptions: serverPrescriptions, usersList, clinicalSessions: serverSessions } = payload.data;
              
              if (Array.isArray(doctorsList)) {
                setDoctors(doctorsList);
              }
              if (Array.isArray(pharmaciesList)) {
                setPharmacies(pharmaciesList);
              }
              if (Array.isArray(serverPrescriptions)) {
                setPrescriptions(serverPrescriptions);
              }
              if (Array.isArray(serverSessions)) {
                setSessions(serverSessions);
              }
              if (Array.isArray(usersList)) {
                setAllUsers(usersList);
                
                // Keep the current logged in user profile dynamically synchronized
                const savedEmail = localStorage.getItem('medpulse_current_email');
                if (savedEmail) {
                  const matchedUser = usersList.find((u: any) => u.email.toLowerCase() === savedEmail.toLowerCase());
                  if (matchedUser) {
                    setCurrentUser(matchedUser);
                  }
                }
              }
            }
          } catch (err) {
            console.error("❌ [MedPulse Sync] Error parsing SSE payload:", err);
          }
        };

        eventSource.onerror = (err) => {
          console.warn("⚠️ [MedPulse Sync] SSE connection dropped. Reconnecting in 5 seconds...");
          if (eventSource) {
            eventSource.close();
          }
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.error("❌ [MedPulse Sync] Failed to initialize SSE EventSource:", err);
        reconnectTimeout = setTimeout(connectSSE, 10000);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // Dynamic Real-Time Sync Timer (Poll every 10 seconds to sync data between devices as a failover)
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const interval = setInterval(() => {
      fetchDoctors();
      fetchPharmacies();
      fetchPrescriptions();
      fetchAllUsers();
    }, 10000); // 10 seconds sync loop
    
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // 1. Fetch current profile
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/health-profile');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Fetch prescriptions
  const fetchPrescriptions = async () => {
    try {
      const res = await fetch('/api/prescriptions');
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2b. Update the target pharmacy chosen by beneficiary/patient
  const handleSelectPharmacyForRx = async (rxId: string, pharmacyName: string) => {
    try {
      const res = await fetch(`/api/prescriptions/${rxId}/pharmacy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pharmacyName }),
      });
      if (res.ok) {
        showToast('تم بنجاح ربط وصرف وصفتك بالصيدلية المختارة! فريق التوصيل على أتم الاستعداد 📍', 'success');
        fetchPrescriptions();
      }
    } catch (e) {
      console.error(e);
      showToast('خطأ أثناء تحديد صيدلية الصرف', 'error');
    }
  };

  // Generate dynamic WhatsApp link for pharmacies containing full digital prescription details
  const getWhatsAppShareLink = (rx: Prescription) => {
    const targetPh = pharmacies.find(p => p.name === rx.pharmacyName);
    let rawPhone = targetPh ? targetPh.phone : "";
    if (!rawPhone || rawPhone.trim() === "") {
      rawPhone = "+966500000000"; // fallback
    }
    // Clean spaces and signs for Whatsapp api
    const cleanPhone = rawPhone.replace(/[\s\+\-\(\)]/g, "");
    
    const formattedMeds = rx.medicationName.split('\n').filter(Boolean).map((med, idx) => {
      const dsg = rx.dosage.split('\n')[idx] || 'حسب الإرشادات المرفقة والتعليمات الجانبية';
      return `  💊 *${med.trim()}* — الجرعة: ${dsg.trim()}`;
    }).join('\n');

    // Access full web domain ticket checking link dynamically
    const shareLink = `${window.location.origin}/?rxId=${rx.id}`;

    const text = `السلام عليكم ورحمة الله وبركاته صيدلية *${rx.pharmacyName}* المحترمين،
أود طلب صرف وتوصيل وصفتي الطبية الإلكترونية الصادرة والموقعة لبرنامجي الموثق عبر منصة *MedPulse* الرقمية:

👤 *اسم المستفيد (المريض):* ${rx.patientName || currentUser?.name || 'مستفيد المنصة المعتمد'}
🩺 *الطبيب المصدر للوصفة:* ${rx.doctorName || 'د. سمر الخالدي'}
🔢 *الرقم المرجعي للوصفة (ID):* \`${rx.id}\`
📅 *تاريخ التحرير والتسجيل:* ${new Date(rx.createdAt).toLocaleDateString('ar-SA')}

📋 *المستحضرات والجرعات المقررة لي:*
${formattedMeds}

💡 *إرشادات الاستعمال الشاملة:*
${rx.instructions || 'لا توجد ملاحظات أو توجيهات إضافية.'}

🔗 *رابط التدقيق المباشر والتذكرة الطبية الذكية للطباعة من النظام:*
${shareLink}

يرجى مراجعة الوصفة وتجهيز الشحنة الدوائية للتوصيل فوري وشاكراً جداً لاهتمامكم وسرعة استجابتكم 🌿🩺`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // 3. Fetch all system users (highly required for Admin tab)
  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/all-users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Direct Demo Login for quick testing
  const handleDirectDemoLogin = async (email: string) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        localStorage.setItem('medpulse_current_email', data.user.email);
        showToast(`أهلاً بك في الدخول التجريبي: ${data.user.name}`, 'success');
        fetchPrescriptions();
        fetchAllUsers();
      }
    } catch (e) {
      showToast('فشل الدخول التجريبي السريع', 'error');
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        localStorage.setItem('medpulse_current_email', data.user.email);
        showToast(`أهلاً بك مجدداً، ${data.user.name}`, 'success');
        // Initial dashboard sync
        fetchPrescriptions();
        fetchAllUsers();
      }
    } catch (e) {
      showToast('خطأ في الاتصال بالشبكة', 'error');
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName || 'مستفيد جديد',
          email: authEmail,
          age: regAge,
          weight: regWeight,
          height: regHeight,
          chronicConditions: regConditions,
          targetWeight: regWeight - 5,
          secondaryNotes: regNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        localStorage.setItem('medpulse_current_email', data.user.email);
        showToast('تم إنشاء ملفك الصحي بالذكاء الاصطناعي بنجاح', 'success');
        fetchPrescriptions();
        fetchAllUsers();
      } else {
        showToast(data.error || 'فشلت عملية التسجيل', 'error');
      }
    } catch (e) {
      showToast('خطأ بالخادم الخارجي', 'error');
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('medpulse_current_email');
    showToast('تم تسجيل الخروج بأمان من بوابة MedPulse الطبية');
  };

  // Post prescription dispatch (Doctor API call)
  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out any completely empty items
    const validItems = medicationItems.filter(item => item.name.trim() !== '');
    
    let finalMeds = '';
    let finalDosage = '';
    
    if (validItems.length > 0) {
      finalMeds = validItems.map(item => item.name.trim()).join('\n');
      finalDosage = validItems.map(item => {
        const d = item.dosage.trim() || 'الجرعة مقررة';
        const inst = item.instructions ? item.instructions.trim() : '';
        return inst ? `${d} - طريقة الاستعمال: ${inst}` : d;
      }).join('\n');
    } else if (newRxMeds.trim() !== '') {
      finalMeds = newRxMeds.trim();
      finalDosage = newRxDosage.trim() || 'حسب إرشادات العيادة';
    } else {
       showToast('الرجاء إضافة دواء واحد على الأقل وتحديد الجرعة المقررة له', 'error');
       return;
    }
    
    // Find chosen patient details
    const targetPatient = allUsers.find(u => u.email === newRxPatientEmail) || 
                          (newRxPatientEmail === currentUser?.email ? currentUser : null) || 
                          allUsers[0] || 
                          currentUser;
                          
    const patientName = targetPatient?.name || "المستفيد الحالي";
    const patientEmail = targetPatient?.email || currentUser?.email || "";
    const digitalSignatureHash = isDigitalSignedRx ? `MEDPULSE-SIG-${Math.floor(100000 + Math.random() * 900000)}-SHA256` : undefined;

    try {
       const res = await fetch('/api/prescriptions', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           medicationName: finalMeds,
           dosage: finalDosage,
           instructions: newRxInstructions,
           pharmacyName: "بانتظار تحديد المستفيد للصيدلية المفضلة",
           isSupplement: isRxSupplement,
           doctorName: currentUser?.name || "د. سمر الخالدي",
           patientName,
           patientEmail,
           isDigitalSigned: isDigitalSignedRx,
           digitalSignatureHash,
           sourceType: 'Doctor'
         }),
       });
       if (res.ok) {
         if (isRxSupplement) {
           showToast(`تم إرسال ووصف المكمل الغذائي للمستفيد "${patientName}" وربطه بالربط الصيدلاني الفوري للتوصيل العاجل!`, 'success');
         } else {
           showToast(`تم إصدار الوصفة الإلكترونية المعتمدة للمستفيد "${patientName}" وإرسال نسخة لصيدلية الشريك!`, 'success');
         }
         setNewRxMeds('');
         setNewRxDosage('');
         setMedicationItems([{ name: '', dosage: '', instructions: '' }]);
         setNewRxInstructions('');
         setIsRxSupplement(false);
         if (isRxFreeReviewRequest) {
           localStorage.setItem(`medpulse_free_review_${patientEmail}_doc1`, 'true');
           localStorage.setItem(`medpulse_free_review_${patientEmail}_doc2`, 'true');
           localStorage.setItem(`medpulse_free_review_${patientEmail}_doc3`, 'true');
            localStorage.setItem(`medpulse_free_review_${patientEmail}_doc4`, 'true');
            if (doctors && doctors.length > 0) {
              doctors.forEach(d => {
                localStorage.setItem(`medpulse_free_review_${patientEmail}_${d.id}`, 'true');
              });
            }
          }
          setIsRxFreeReviewRequest(false);
          fetchPrescriptions();
        }
    } catch (e) {
      console.error(e);
      showToast('خطأ في إرسال الوصفة الطبية، الرجاء المحاولة مجدداً', 'error');
    }
  };

  const handleAddPresetToMeds = (name: string, dosage: string, instructions: string) => {
    setMedicationItems(prev => {
      if (prev.length === 1 && !prev[0].name.trim()) {
        return [{ name, dosage, instructions }];
      }
      return [...prev, { name, dosage, instructions }];
    });
    setNewRxInstructions(prev => prev ? `${prev} • ${instructions}` : instructions);
  };

  const toggleFreeReviewForPatient = (patientEmail: string) => {
    const isCurrentlyFree = localStorage.getItem(`medpulse_free_review_${patientEmail}_doc1`) === 'true';
    const doctorsList = ['doc1', 'doc2', 'doc3', 'doc4', 'dr_samar', 'dr_faisal'];
    
    if (isCurrentlyFree) {
      doctorsList.forEach(id => localStorage.removeItem(`medpulse_free_review_${patientEmail}_${id}`));
      doctors.forEach(d => localStorage.removeItem(`medpulse_free_review_${patientEmail}_${d.id}`));
      showToast(`🔒 تم إلغاء تفعيل المراجعة المجانية للمستفيد "${patientEmail}" وتكليفه بالكشفية اعتيادياً`, 'info');
    } else {
      doctorsList.forEach(id => localStorage.setItem(`medpulse_free_review_${patientEmail}_${id}`, 'true'));
      doctors.forEach(d => localStorage.setItem(`medpulse_free_review_${patientEmail}_${d.id}`, 'true'));
      showToast(`🏆 تم منح المستفيد "${patientEmail}" إعفاء من كود الكشفية وتفعيل المراجعة المجانية بنجاح!`, 'success');
    }
    setForceRender(prev => prev + 1);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const isUserPremium = currentUser?.subscriptionType === 'Premium' || currentUser?.role === 'admin' || currentUser?.role === 'doctor';
    const trialKey = `trial_count_${currentUser?.email || 'guest'}`;
    const currentCount = Number(localStorage.getItem(trialKey) || 0);

    if (!isUserPremium && currentCount >= 3) {
      setUserQuery('');
      setShowTrialBlockedModal(true);
      return;
    }

    const userMessage = {
      id: "msg_" + Math.random().toString(),
      sender: "user",
      text: userQuery,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    const originalQuery = userQuery;
    setUserQuery('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: originalQuery,
          history: chatMessages,
          context: currentUser
        }),
      });
      const data = await res.json();
      const botMessage = {
        id: "msg_" + Math.random().toString(),
        sender: "bot",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, botMessage]);

      if (!isUserPremium) {
        const nextCount = currentCount + 1;
        localStorage.setItem(trialKey, String(nextCount));
        if (nextCount >= 3) {
          setTimeout(() => {
            setShowTrialBlockedModal(true);
          }, 4500);
        }
      }
    } catch (e) {
      showToast('تعذر الوصول لطبيبك الرقمي الآن، يرجى المحاولة بعد قليل', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const toggleCondition = (cond) => {
    if (regConditions.includes(cond)) {
      setRegConditions(regConditions.filter(c => c !== cond));
    } else {
      setRegConditions([...regConditions, cond]);
    }
  };

  const handleUpdateShippingStatus = async (id: string, newStatus: any) => {
    try {
      const res = await fetch(`/api/prescriptions/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast('تم تحديث إرسالية الصيدلية وشركة الشحن بنجاح', 'success');
        fetchPrescriptions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update profile subscription via API checkout simulation
  const handleConfirmSubscriptionPayment = async () => {
    if (!currentUser) return;
    try {
      const targetSub = showCheckoutModal;
      const res = await fetch('/api/health-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionType: targetSub }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setCheckoutStep('success');
        showToast(`مبارك! تم ترقية اشتراكك بنجاح إلى الباقة ${targetSub === 'Premium' ? 'الذهبية المتكاملة' : 'الفضية القياسية'}`, 'success');
        fetchAllUsers();
      }
    } catch (e) {
      showToast('فشل تفعيل الدفع الإلكتروني', 'error');
    }
  };

  // Triggered when AiNutrition updates the client calorie budget
  const handleUpdateCalorieBudget = async (updatedFields: Partial<UserHealthProfile>) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/health-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        fetchAllUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="app-root-wrapper" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-500 selection:text-white" dir="rtl">
      
      {/* Dynamic Toast System */}
      {toastMsg && (
        <div 
          id="system-toast"
          className={`fixed top-6 left-6 z-50 text-sm font-semibold rounded-2xl py-3.5 px-6 shadow-xl border flex items-center gap-3 transition-transform animate-bounce ${
            toastMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            toastMsg.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
            'bg-slate-900 text-slate-100 border-slate-700'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-current animate-ping"></span>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* --- Auth Screen Layer (if not logged in) --- */}
      {!isLoggedIn ? (
        <div id="auth-layer" className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6">
          <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-200/50 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 bg-teal-600 rounded-2xl items-center justify-center font-bold text-white tracking-widest text-xl shadow-sm font-display">
                M
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                سجل دخولك لبوابتك الصحية
              </h2>
              <p className="text-slate-500 text-xs">
                الرجاء إدخال بريدك الإلكتروني المعتمد للدخول الآمن وسحب ملفك الصحي الفوري.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">البريد الإلكتروني المعتمد</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-sans text-right"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition duration-150 shadow-xs cursor-pointer text-sm"
              >
                دخول آمن 🔒
              </button>
            </form>

            {/* Quick Demo Login */}
            <div className="pt-4 border-t border-slate-150 text-center space-y-3">
              <button
                type="button"
                onClick={() => handleDirectDemoLogin('patient@medpulse.com')}
                className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-250 font-black py-3 rounded-xl transition duration-150 shadow-xs flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <span>👤</span>
                <span>دخول تجريبي فوري (مستفيد)</span>
              </button>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                * للأطباء وإداريي المنصة، يرجى كتابة البريد الإلكتروني المعتمد للدخول، أو مسح الباركود الخاص بالميدالية بكاميرا الموبايل ليتم توجيهك وتسجيل دخولك تلقائياً.
              </p>
            </div>

            <div className="text-center pt-4 border-t border-slate-100">
              <a
                href="https://wa.me/9647716662902?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%85%D9%86%D8%B5%D8%A9%20%D9%85%D9%8A%D8%AF%D8%A8%D9%84%D8%B3%20%D8%A7%D9%84%D8%B7%D8%A8%D9%8A%D8%A9%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%88%D8%AA%D8%B3%D8%AC%D9%8A%D9%84%20%D9%85%D8%B3%D8%AA%D9%81%D9%8A%D8%AF%20%D8%AC%D8%AF%D9%8A%D8%AF%20%D9%81%D9%8A%20%D8%A7%D9%84%D9%85%D9%86%D8%B5%D8%A9."
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-block transition-colors duration-150"
              >
                تسجيل مستفيد جديد مستقل مع تحديد السمنة أو الأمراض 💬
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* --- Main application Workspace with dynamic tabs --- */
        currentUser && (
          <div id="main-admin-patient-portal" className="flex-1 flex flex-col">
            
            {/* Top Navigation Header bar */}
            <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-30 shadow-xs">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Logo and patient details */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-teal-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-sm font-display">
                    M
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-800 font-display">MedPulse Portal</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">v1.2 MVP-Clinical</span>
                    </div>
                    {/* Welcome banner */}
                    <div className="text-xs text-slate-500 mt-0.5">
                      أهلاً بك، <strong className="text-slate-700 font-bold">{currentUser.name}</strong> • الدور الطبي: 
                      <span className={`mr-1 px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                        currentUser.role === 'admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        currentUser.role === 'doctor' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        'bg-teal-50 text-teal-600 border border-teal-100'
                      }`}>
                        {currentUser.role === 'admin' ? 'مدير عام النظام' : currentUser.role === 'doctor' ? 'طبيب ومستشار' : 'مستفيد/مريض'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-status, pricing tiers and logout */}
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* QR Code and Multi-Screen Installer trigger */}
                  <button
                    onClick={() => setShowLaunchModal(true)}
                    className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-indigo-800 cursor-pointer transition font-bold"
                  >
                    <span>الشاشات الموازية 📺</span>
                  </button>

                  <button
                    onClick={logout}
                    className="bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-rose-800 cursor-pointer transition font-bold"
                  >
                    <span>تسجيل الخروج 🚪</span>
                  </button>
                </div>

              </div>
            </header>

            {/* Interactive Tab Controller Bar */}
            <div className="bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-6 overflow-x-auto flex gap-4">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-3.5 px-2 text-sm font-semibold border-b-2 transition duration-150 shrink-0 ${
                    activeTab === 'dashboard' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  الصفحة الشخصية 👤
                </button>
                <button
                  onClick={() => setActiveTab('nutrition')}
                  className={`py-3.5 px-2 text-sm font-semibold border-b-2 transition duration-150 shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'nutrition' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  حساب السعرات والتغذية للسكري/الضغط
                </button>
                <button
                  onClick={() => setActiveTab('voip')}
                  className={`py-3.5 px-2 text-sm font-semibold border-b-2 transition duration-150 shrink-0 ${
                    activeTab === 'voip' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  بوت الاتصالات الصوتية (Twilio Web)
                </button>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('partners')}
                    className={`py-3.5 px-2 text-sm font-semibold border-b-2 transition duration-150 shrink-0 flex items-center gap-1.5 ${
                      activeTab === 'partners' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-emerald-500" />
                    تحكم المشرف بالأطباء والصيدليات والربط ⚙️
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('chatbot')}
                  className={`py-3.5 px-2 text-sm font-semibold border-b-2 transition duration-150 shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'chatbot' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-teal-500" />
                  الدردشة الطبية (AI Chatbot)
                </button>
                {(currentUser.role === 'doctor' || currentUser.role === 'admin') && (
                  <button
                    onClick={() => setActiveTab('archive')}
                    className={`py-3.5 px-2 text-sm font-semibold border-b-2 transition duration-150 shrink-0 flex items-center gap-1.5 ${
                      activeTab === 'archive' ? 'border-indigo-600 text-indigo-700 font-bold bg-indigo-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📂 أرشيف المرضى والروشتات
                  </button>
                )}
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`py-3.5 px-2 text-sm font-semibold border-b-2 transition duration-150 shrink-0 text-rose-600 flex items-center gap-1 ${
                      activeTab === 'admin' ? 'border-rose-600 text-rose-700 font-bold bg-rose-50/50 rounded-t-lg' : 'border-transparent hover:text-rose-800'
                    }`}
                  >
                    لوحة إدارة النظام (Admin Control Hub) ⚙️
                  </button>
                )}
              </div>
            </div>

            {/* Tab panel views body */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">

              {/* Dynamic & Premium interim WhatsApp Billing Activation Banner */}
              {currentUser.subscriptionType === 'Free' && (
                <div className="bg-gradient-to-br from-emerald-500/10 via-teal-600/5 to-white border border-emerald-500/20 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden animate-fade-in group">
                  {/* Decorative faint background glowing elements */}
                  <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-300"></div>
                  
                  <div className="flex gap-4 items-start text-right">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Phone className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-widest font-sans">تحديث الدفع المؤقت 💸</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">الباقة الأساسية المحدودة</span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-base font-display">تفعيل الاشتراك الموحد للمنصة عبر WhatsApp (بديل Zain Cash المؤقت)</h3>
                      <p className="text-slate-500 text-xs leading-relaxed max-w-2xl font-sans">
                        إلى حين اكتمال وتفعيل بوابة دفع <strong>زين كاش (Zain Cash)</strong> الآلية الرسمية للفوترة، صممنا لك ميزة التوثيق اليدوي المؤقت عبر الواتساب للترقية الفورية. بمجرد الضغط، يمكنك مشاركة رمز تأكيد الاشتراك مع المسؤول لتفعيل الباقة الكاملة لحسابك في لحظات.
                      </p>
                      
                      <div className="mt-3 flex flex-wrap items-center gap-3 bg-white/80 border border-emerald-500/10 rounded-xl p-2.5 max-w-lg shadow-2xs">
                        <span className="text-[10px] font-extrabold text-emerald-800 shrink-0">📞 رقم واتساب المبيعات الحقيقي:</span>
                        <input
                          type="text"
                          value={whatsappSalesPhone}
                          onChange={(e) => setWhatsappSalesPhone(e.target.value)}
                          placeholder="+9647700000000"
                          className="flex-1 min-w-[140px] bg-white text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-center"
                          title="أدخل رقمك لتجربة المبيعات!"
                        />
                        <span className="text-[9px] text-slate-400 font-sans hidden sm:inline">👈 (يمكن تعديل الرقم وتجربة الضغطة)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                    <a
                      href={`https://wa.me/${whatsappSalesPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `السلام عليكم خدمة مبيعات مدبلس، أود تفعيل "الاشتراك الموحد للمنصة" (MedPulse Core Subscription) بقيمة 5,000 دينار عراقي لحساب المريض المسجل بالاسم: ${
                          currentUser.name
                        } والبريد الإلكتروني: ${currentUser.email}. بانتظار إشعار التفعيل يدوياً.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        showToast(`جاري فتح WhatsApp للإرسال للرقم ${whatsappSalesPhone}...`, 'success');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition duration-150 shadow-md cursor-pointer text-center"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>تفعيل الاشتراك الموحد (5,000 د.ع)</span>
                    </a>

                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/health-profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ subscriptionType: 'Basic' }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setCurrentUser(data.user);
                            showToast('⚡ توضيح ديمو: تم تفعيل الاشتراك الموحد للمنصة (5,000 د.ع) بنجاح غامر للرعاية الطبية!', 'success');
                            fetchAllUsers();
                          }
                        } catch(err) {
                          showToast('فشل التحديث الفوري', 'error');
                        }
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200 text-center"
                      title="تفعيل فوري للمنصة بنقرة واحدة لتسريع استعراض كود الترقية الفعال"
                    >
                      <span>تنشيط فوري للتجربة ⚡</span>
                    </button>
                  </div>
                </div>
              )}

              {/* --- 1. Dashboard Tab --- */}
              {activeTab === 'dashboard' && (
                <div id="dashboard-tab-content" className="space-y-8">
                  
                  {/* Dynamic Ad Banner system */}
                  <DynamicAdBanner 
                    currentUser={currentUser} 
                    doctors={doctors}
                    pharmacies={pharmacies}
                    onNavigateToTab={(tab) => setActiveTab(tab)}
                  />
                  
                  {/* Banner summary metrics */}
                  {currentUser.role === 'patient' ? (
                    <div className="bg-gradient-to-r from-teal-800 to-emerald-900 rounded-3xl text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                      <div className="space-y-2 text-center md:text-right">
                        <span className="bg-teal-700 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full text-teal-200">خلاصة التشخيص المدمجة</span>
                        <h2 className="text-xl md:text-2xl font-bold font-display leading-tight text-right">رعاية متوائمة للمستفيد: {currentUser.name} </h2>
                        <p className="text-teal-100/80 text-xs md:text-sm max-w-2xl leading-relaxed font-sans text-right">
                          نظام المتابعة المستمرة للأمراض المزمنة والمكملات الطبيعية. تم ربط ملفك بنظام الصرف الآلي للوصفات مع صيدلية بابل الكبرى وصيدلية الحياة المركزية لضمان سلامتك وصرف أدويتك ومكملاتك العلاجية فوراً.
                        </p>
                      </div>
                      {/* Weight controller slider for demonstration */}
                      <div className="bg-teal-900/60 p-4 rounded-2xl border border-teal-700/60 w-full md:w-64 space-y-3 shrink-0">
                        <div className="flex justify-between text-xs">
                          <span>تحديث الوزن الحالي</span>
                          <strong className="text-white font-mono">{sliderWeight} كجم</strong>
                        </div>
                        <input 
                          type="range" min="40" max="150" 
                          className="w-full accent-teal-400 h-1 bg-teal-800 rounded-lg cursor-pointer"
                          value={sliderWeight}
                          onChange={(e) => setSliderWeight(Number(e.target.value))}
                          onMouseUp={() => handleUpdateCalorieBudget({ weight: sliderWeight })}
                          onTouchEnd={() => handleUpdateCalorieBudget({ weight: sliderWeight })}
                        />
                        <div className="text-[10px] text-teal-300 leading-tight">
                          * اسحب لتعديل الوزن ثم أفلت لتحديث السعرات والمكملات بالذكاء الاصطناعي تلقائياً.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-slate-900 via-[#008080]/90 to-emerald-950 rounded-3xl text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm" style={{ direction: 'rtl' }}>
                      <div className="space-y-2 text-right">
                        <span className="bg-teal-500/30 text-teal-100 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-teal-400/20 inline-block text-right">
                          {currentUser.role === 'admin' ? '⚙️ لوحة الإشراف والتحكم الكامل بالشبكة' : '⚕️ الصفحة الشخصية وبوابة الطبيب الاستشاري'}
                        </span>
                        <h2 className="text-xl md:text-2xl font-bold font-display leading-tight text-right">مرحباً بك، {currentUser.role === 'admin' ? 'المدير العام' : 'الدكتور'} {currentUser.name} 💼</h2>
                        <p className="text-teal-100/90 text-xs md:text-sm max-w-4xl leading-relaxed font-sans text-right">
                          بصفتك معتمداً في غرف استشارات <strong>مدبلس (MedPulse)</strong>، يمكنك كتابة الوصفات الطبية والمكملات الغذائية لأي مستفيد، ومتابعة الفحوصات الطبية، ومنح وتفعيل المراجعة الثانية والتحليل المجاني للمرضى.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0 font-sans">
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/5 text-center min-w-[120px]">
                          <span className="text-[10px] text-teal-200 block">إجمالي الوصفات</span>
                          <strong className="text-xl font-mono text-white font-black">{prescriptions.length}</strong>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/5 text-center min-w-[120px]">
                          <span className="text-[10px] text-teal-200 block">المرضى المسجلين</span>
                          <strong className="text-xl font-mono text-white font-black">{allUsers.filter(u => u.role === 'patient').length}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Body grid: list of Prescriptions and Delivery shipping states */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left detailed Prescription tracker column */}
                    <div className={(currentUser.role === 'doctor' || currentUser.role === 'admin') ? "col-span-12 lg:col-span-8 space-y-6 w-full min-w-0" : "col-span-12 lg:col-span-12 space-y-6 w-full min-w-0"}>
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6">
                        
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 font-display">الوصفات الطبية المعتمدة ومسار الشحن والتوصيل</h3>
                            <p className="text-slate-500 text-xs mt-0.5">صادرة من دكاترة MedPulse ومرتبطة آلياً بالصيدليات الشريكة</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-400">عدد الوصفات: {prescriptions.length}</span>
                        </div>

                        {/* Source Filter and Interactive Title */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-100/50 p-2.5 rounded-2xl border border-slate-150 font-sans">
                          <span className="text-xs font-bold text-slate-600 pr-2">📋 تصنيف وسجل الوصفات:</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setRxSourceFilter('all')}
                              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                                rxSourceFilter === 'all' ? 'bg-[#008080] text-white shadow-xs border-transparent' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-150'
                              }`}
                            >
                              كل الوصفات والمكملات ({prescriptions.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setRxSourceFilter('doctor')}
                              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                                rxSourceFilter === 'doctor' ? 'bg-[#008080] text-white shadow-xs border-transparent' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-150'
                              }`}
                            >
                              🩺 وصفات طبيب معتمد ({prescriptions.filter(r => r.sourceType === 'Doctor' || !r.sourceType).length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setRxSourceFilter('ai')}
                              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                                rxSourceFilter === 'ai' ? 'bg-[#008080] text-white shadow-xs border-transparent' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-150'
                              }`}
                            >
                              🤖 مكملات بالذكاء الاصطناعي ({prescriptions.filter(r => r.sourceType === 'AI').length})
                            </button>
                          </div>
                        </div>

                        {(() => {
                          const filteredRxs = prescriptions.filter(rx => {
                            const matchesFilter = 
                              rxSourceFilter === 'all' ? true :
                              rxSourceFilter === 'doctor' ? (rx.sourceType === 'Doctor' || !rx.sourceType) :
                              rxSourceFilter === 'ai' ? rx.sourceType === 'AI' : true;
                              
                            const isOwner = currentUser?.role !== 'patient' || !rx.patientEmail || rx.patientEmail === currentUser?.email;
                            return matchesFilter && isOwner;
                          });

                          return filteredRxs.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 italic font-sans border border-dashed border-slate-200 bg-slate-50 rounded-2xl">
                              لا يوجد وصفات طبية مطابقة للتصنيف حالياً في المسار الرقمي للمستفيد.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {filteredRxs.map((rx) => (
                                <div key={rx.id} className="border border-slate-150 bg-slate-50/50 rounded-2xl p-5 hover:border-teal-200 transition duration-150 text-right">
                                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    
                                    {/* Prescriptions details */}
                                    <div className="space-y-2 flex-1">
                                      <div className="flex items-center flex-wrap gap-2 justify-start">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                                          {rx.id}
                                        </span>
                                        {rx.isSupplement ? (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            مكمل غذائي وعلاجي
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                            دواء طبي موثق
                                          </span>
                                        )}
                                        
                                        <div className="flex flex-col gap-1 w-full mt-1.5 text-right">
                                          {rx.medicationName.includes('\n') ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 w-full">
                                              {rx.medicationName.split('\n').map((med, idx) => {
                                                const dsg = rx.dosage.split('\n')[idx] || 'حسب الإرشادات المرفقة';
                                                return (
                                                  <div key={idx} className="bg-white/80 border border-slate-200/60 p-2.5 rounded-xl flex flex-col justify-between text-right shadow-2xs hover:shadow-xs transition-shadow">
                                                    <span className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                                                      <span className="text-emerald-600">💊</span> <span className="font-sans leading-relaxed text-[13px]">{med}</span>
                                                    </span>
                                                    <span className="text-[10px] text-indigo-700 bg-indigo-50 max-w-max px-2 py-0.5 mt-2 rounded font-bold border border-indigo-100/50 mr-4">
                                                      الجرعة المحددة: {dsg}
                                                    </span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div className="flex items-center flex-wrap gap-2 text-right">
                                              <span className="text-sm font-black text-slate-800 font-sans">💊 {rx.medicationName}</span>
                                              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">الجرعة: {rx.dosage}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <p className="text-xs text-slate-600 font-bold leading-normal m-0 pt-1">
                                        👨‍⚕️ المصدر: {rx.sourceType === 'AI' ? 'مقترح ذكاء اصطناعي ذكي' : `الطبيب المباشر (${rx.doctorName || 'د. سمر الخالدي'})`} • 🏥 الصيدلية الشريكة: {rx.pharmacyName}
                                      </p>
                                      
                                      {rx.patientName && (
                                        <p className="text-xs text-teal-700 font-bold leading-none m-0 pt-0.5">
                                          👤 المستفيد: {rx.patientName} ({rx.patientEmail})
                                        </p>
                                      )}
                                      
                                      <p className="text-xs text-slate-500 leading-relaxed max-w-xl m-0 pt-0.5">
                                        📋 إرشادات الاستخدام: {rx.instructions}
                                      </p>
                                      
                                      {/* Pharmacy Selection / Transfer Widget */}
                                      <div className="mt-3 p-3 bg-slate-100 rounded-xl border border-slate-200/60 max-w-xl text-right">
                                        <div className="flex items-center gap-1.5 mb-1 text-slate-700">
                                          <MapPin className="w-3.5 h-3.5 text-[#008080]" />
                                          <span className="text-[11px] font-bold">توجيه صيدلية الصرف والتوصيل للمستفيد:</span>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                          <div className="flex-1 text-xs">
                                            {rx.pharmacyName.includes("بانتظار") ? (
                                              <span className="text-amber-600 font-bold flex items-center gap-1 animate-pulse">
                                                ⚠️ بانتظار تحديد فرع الصيدلية المطلوب للتسليم
                                              </span>
                                            ) : (
                                              <span className="text-slate-800 font-medium">
                                                فرع التوصيل المعتمد: <strong className="text-[#008080]">{rx.pharmacyName}</strong>
                                              </span>
                                            )}
                                          </div>
                                          
                                          <div className="shrink-0 flex items-center gap-1">
                                            <select
                                              onChange={(e) => {
                                                if (e.target.value) handleSelectPharmacyForRx(rx.id, e.target.value);
                                              }}
                                              value={rx.pharmacyName.includes("بانتظار") ? "" : rx.pharmacyName}
                                              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-705 focus:ring-1 focus:ring-teal-500 cursor-pointer text-right"
                                            >
                                              <option value="" disabled>-- اختر الصيدلية الأقرب لك --</option>
                                              {/* Support dynamic matching of registered pharmacies from db */}
                                              {pharmacies.map((ph) => (
                                                <option key={ph.id} value={ph.name}>
                                                  📍 {ph.name} - {ph.district}{ph.address ? ` - ${ph.address}` : ''}
                                                </option>
                                              ))}
                                              <option value="صيدلية اورنج">صيدلية اورنج - الانبار - الرمادي - شارع المستشفى العام</option>
                                              <option value="صيدلية زمزم">صيدلية زمزم - الانبار - القائم - الشارع العام</option>
                                              <option value="صيدلية احمد">صيدلية احمد - بغداد - الحارثية - شارع الكندي</option>
                                            </select>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* View & Print Prescription vs Order/Send to Pharmacy */}
                                      <div className="pt-2.5 flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedRxForPrint(rx)}
                                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1 border border-indigo-100"
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                          <span>عرض وطباعة الوصفة 📋</span>
                                        </button>

                                        {rx.pharmacyName.includes("بانتظار") ? (
                                          <button
                                            type="button"
                                            onClick={() => showToast('الرجاء اختيار صيدلية الصرف الأقرب لك أولاً لتوجيه الطلب وإرساله إليها عبر واتساب!', 'error')}
                                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1 border border-emerald-100/70 opacity-60"
                                          >
                                            <Share2 className="w-3.5 h-3.5" />
                                            <span>ارسال الوصفة للصيدلية 📲</span>
                                          </button>
                                        ) : (
                                          <a
                                            href={getWhatsAppShareLink(rx)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => {
                                              showToast('جاري توجيهك إلى واتساب لصرف الوصفة بطلب رسمي فوري صادر من المنصة 🚀', 'success');
                                            }}
                                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-1.5 px-3 rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1 border border-emerald-100"
                                          >
                                            <Share2 className="w-3.5 h-3.5" />
                                            <span>ارسال الوصفة للصيدلية 📲</span>
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    {/* Delivery status Tracker */}
                                    <div className="bg-white border border-slate-100 p-4 rounded-xl shrink-0 min-w-[200px] flex flex-col justify-between">
                                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-start gap-1 font-display">
                                        <Truck className="w-3.5 h-3.5 text-teal-500" />
                                        {rx.isSupplement ? 'تتبع شحن المكمل الغذائي' : 'تتبع إرسالية دواء وصرف'}
                                      </div>

                                      {/* Indicator bars */}
                                      <div className="flex gap-1.5 h-1.5 w-full bg-slate-100 rounded mb-2.5">
                                        <div className={`h-full flex-1 rounded-full ${['Processing', 'Shipped', 'Out for Delivery', 'Delivered'].includes(rx.deliveryStatus) ? 'bg-amber-400' : 'bg-slate-200'}`} />
                                        <div className={`h-full flex-1 rounded-full ${['Shipped', 'Out for Delivery', 'Delivered'].includes(rx.deliveryStatus) ? 'bg-teal-500' : 'bg-slate-200'}`} />
                                        <div className={`h-full flex-1 rounded-full ${['Out for Delivery', 'Delivered'].includes(rx.deliveryStatus) ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                                        <div className={`h-full flex-1 rounded-full ${rx.deliveryStatus === 'Delivered' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                      </div>

                                      <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-705">
                                          الحالة: {
                                            rx.deliveryStatus === 'Processing' ? 'قيد التجهيز بالصيدلية' :
                                            rx.deliveryStatus === 'Shipped' ? 'تم الشحن للتوصيل' :
                                            rx.deliveryStatus === 'Out for Delivery' ? 'جاهز مع المندوب' : 'تم الوصول والتسليم لليد'
                                          }
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 mt-1 block">التوقيت المتوقع: {rx.deliveryEstimatedDate}</span>
                                    </div>

                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}



                      </div>
                    </div>

                    {/* Right column: Prescription generator form (Only for doctor or admin) */}
                    {(currentUser.role === 'doctor' || currentUser.role === 'admin') && (
                      <div className="col-span-12 lg:col-span-4 space-y-6 w-full min-w-0" id="prescription-creator-console">
                        {/* Prescription generator form */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs text-right">
                          <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2 justify-end">
                              <span>لوحة تحرير الوصفات والربط الصيدلاني</span>
                              <span className="text-xl">✏️</span>
                            </h3>
                            <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">بصفتك طبيباً استشارياً مرخصاً، يمكنك وصف وإرسال دواء علاجي أو مكمل غذائي ليرحل تلقائياً لملف المستفيد</p>
                          </div>

                          <form onSubmit={handleCreatePrescription} className="space-y-4">
                            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100 text-right font-sans">
                              <span className="block text-xs font-bold text-amber-900 leading-none mb-1">💡 تمكين حرية اختيار الصيدلية للمستفيد:</span>
                              <p className="text-[10px] text-amber-800 leading-relaxed m-0">
                                تم إلغاء تحديد الصيدلية المسبق لإعطاء المستفيد كامل الحرية في اختيار فرع الصيدلية الأقرب لمنطقته أو سكنه مباشرة من لوحة تحكمه الخاصة لضمان سرعة وملاءمة التوصيل وسهولته.
                              </p>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">تصنيف المستحضر المحرر</label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-150 ${!isRxSupplement ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                  onClick={() => setIsRxSupplement(false)}
                                >
                                  دواء علاجي
                                </button>
                                <button
                                  type="button"
                                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-150 ${isRxSupplement ? 'bg-teal-600 border-teal-600 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                  onClick={() => setIsRxSupplement(true)}
                                >
                                  مكمل غذائي
                                </button>
                              </div>
                            </div>

                            {/* Preset suggestions */}
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 mb-1.5 font-sans">🌿 اقتراحات سريعة (انقر للإضافة):</span>
                              <div className="flex flex-wrap gap-1">
                                {!isRxSupplement ? (
                                  <>
                                    <button type="button" onClick={() => handleAddPresetToMeds('Glucophage (جلوكوفاج)', '500 ملجم مرتين يومياً', 'قرص واحد مع الوجبة صباحاً ومساءً للتحكم بسكر الدم')} className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-lg transition-colors border border-indigo-100">➕ جلوكوفاج</button>
                                    <button type="button" onClick={() => handleAddPresetToMeds('Concor (كونكور للضغط)', '5 ملجم صباحاً', 'قرص واحد على الريق مع كوب ماء وبدون مضغ')} className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-lg transition-colors border border-indigo-100">➕ كونكور</button>
                                    <button type="button" onClick={() => handleAddPresetToMeds('Lipitor (ليبيتور)', '20 ملجم ليلاً', 'قرص واحد قبل النوم مباشرة')} className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-lg transition-colors border border-indigo-100">➕ ليبيتور</button>
                                  </>
                                ) : (
                                  <>
                                    <button type="button" onClick={() => handleAddPresetToMeds('فيتامين د3 السائل (Vitamin D3)', '5000 وحدة دولية يومياً', 'حبة واحدة يومياً مع الوجبة الرئيسية الدسمة')} className="text-[9px] bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-lg transition-colors border border-teal-100">➕ فيتامين د3</button>
                                    <button type="button" onClick={() => handleAddPresetToMeds('بيسجليسينات المغنيسيوم (Magnesium)', '400 ملجم ليلاً', 'حبة واحدة قبل النوم بساعة')} className="text-[9px] bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-lg transition-colors border border-teal-100">➕ مغنيسيوم</button>
                                    <button type="button" onClick={() => handleAddPresetToMeds('أوميغا-3 البحري (Omega 3)', '1000 ملجم مع الغداء', 'كبسولة واحدة مع وجبة الغداء لتعزيز صحة القلب')} className="text-[9px] bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-lg transition-colors border border-teal-100">➕ أوميغا-3</button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">المستفيد / المريض المستهدف في المنصة</label>
                              <select 
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-sans"
                                value={newRxPatientEmail}
                                onChange={(e) => setNewRxPatientEmail(e.target.value)}
                              >
                                <option value="">-- اختر المريض لإرسال الوصفة --</option>
                                <option value={currentUser?.email || ""}>{currentUser?.name || "المستخدم الحالي"} ({currentUser?.email}) - حسابك</option>
                                {allUsers.filter(u => u.role === 'patient').map(u => (
                                  <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-4 border border-slate-100 bg-slate-50/50 p-3 rounded-2xl">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#008080] flex items-center gap-1 font-sans">💊 المواد الموصوفة:</span>
                                <button
                                  type="button"
                                  onClick={() => setMedicationItems(prev => [...prev, { name: '', dosage: '', instructions: '' }])}
                                  className="text-[9px] text-white bg-[#008080] hover:bg-teal-700 font-bold px-2 py-1 rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer font-sans"
                                >
                                  ➕ إضافة علاج
                                </button>
                              </div>

                              <div className="space-y-2">
                                {medicationItems.map((item, index) => (
                                  <div key={index} className="bg-white border border-slate-200/80 p-2.5 rounded-xl space-y-2 relative text-right">
                                    {medicationItems.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => setMedicationItems(prev => prev.filter((_, i) => i !== index))}
                                        className="absolute left-2 top-2 text-rose-500 hover:text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 transition-colors text-[9px] cursor-pointer"
                                      >
                                        🗑️
                                      </button>
                                    )}
                                    
                                    <div className="text-[9px] bg-slate-100 text-[#008080] px-1.5 py-0.5 rounded font-bold inline-block">
                                      العلاج #{index + 1}
                                    </div>

                                    <div className="space-y-2 text-right">
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5 font-sans">اسم العلاج / المكمل:</label>
                                        <input 
                                          type="text"
                                          required
                                          placeholder={isRxSupplement ? "مثال: كبسولات فيتامين د3" : "مثال: جلوكوفاج 500 ملجم"}
                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-[#008080] font-semibold"
                                          value={item.name}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setMedicationItems(prev => prev.map((it, i) => i === index ? { ...it, name: val } : it));
                                          }}
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-right">
                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-405 mb-0.5 font-sans">الجرعة:</label>
                                          <input 
                                            type="text"
                                            required
                                            placeholder="حبة واحدة"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-[#008080] font-semibold"
                                            value={item.dosage}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setMedicationItems(prev => prev.map((it, i) => i === index ? { ...it, dosage: val } : it));
                                            }}
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-405 mb-0.5 font-sans">استعمال:</label>
                                          <input 
                                            type="text"
                                            required
                                            placeholder="صباحاً ومساءً"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-[#008080] font-semibold"
                                            value={item.instructions || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setMedicationItems(prev => prev.map((it, i) => i === index ? { ...it, instructions: val } : it));
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">إرشادات وصيدلية الصرف المحددة</label>
                              <div className="space-y-2">
                                <select 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-teal-500"
                                  value={newRxPharmacy}
                                  onChange={(e) => setNewRxPharmacy(e.target.value)}
                                >
                                  <option value="">-- فرع صيدلية صرف مسبق (خياري) --</option>
                                  {pharmacies.map(ph => (
                                    <option key={ph.id} value={ph.name}>{ph.name} - {ph.district}</option>
                                  ))}
                                  <option value="صيدلية اورنج">صيدلية اورنج - الانبار - الرمادي</option>
                                  <option value="صيدلية زمزم">صيدلية زمزم - الانبار - القائم</option>
                                  <option value="صيدلية احمد">صيدلية احمد - بغداد - الحارثية</option>
                                </select>

                                <textarea 
                                  rows={2}
                                  placeholder="ملاحظات الطبيب وصور الفحوصات المطلوبة..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-teal-500 font-sans"
                                  value={newRxInstructions}
                                  onChange={(e) => setNewRxInstructions(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="isDigitalSignedRxDashboard"
                                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer text-xs"
                                checked={isDigitalSignedRx}
                                onChange={(e) => setIsDigitalSignedRx(e.target.checked)}
                              />
                              <label htmlFor="isDigitalSignedRxDashboard" className="text-[11px] text-slate-700 cursor-pointer font-sans font-bold select-none">
                                توقيع الوصفة إلكترونياً بختم الطبيب ⚕️
                              </label>
                            </div>

                            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-150 flex items-start gap-2">
                              <input
                                type="checkbox"
                                id="isRxFreeReviewRequestDashboard"
                                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-0.5 text-xs"
                                checked={isRxFreeReviewRequest}
                                onChange={(e) => setIsRxFreeReviewRequest(e.target.checked)}
                              />
                              <div>
                                <label htmlFor="isRxFreeReviewRequestDashboard" className="text-[11px] text-emerald-950 font-black cursor-pointer select-none block text-right">
                                  🧬 طلب فحوصات وتفعيل مراجعة مجانية
                                </label>
                                <span className="text-[9px] text-emerald-850 block mt-0.5 leading-tight text-right">
                                  تفعيل هذا الخيار لتمكين المريض من مراجعة الطبيب بالدردشة مجاناً لإرسال الفحوصات بمدبلس.
                                </span>
                              </div>
                            </div>

                            <button
                              type="submit"
                              className={`w-full text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 cursor-pointer ${isRxSupplement ? 'bg-teal-600 hover:bg-teal-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                              {isRxSupplement ? 'صرف مكمل غذائي آلي للمستفيد ⚕️' : 'صرف دواء علاجي آلي للمستفيد ⚕️'}
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Dedicated Doctor's Desks and Controls Section */}
                    {(currentUser.role === 'doctor' || currentUser.role === 'admin') && (
                      <div className="col-span-12 lg:col-span-12 border-t border-slate-200 pt-8 mt-8 space-y-6 animate-fade-in w-full min-w-0 overflow-hidden" id="doctor-desk-workspace" style={{ direction: 'rtl' }}>
                        {/* Patients Bento Hub - Full Width Panel */}
                        <div className="bg-white border border-slate-150 rounded-3xl p-6 md:p-8 space-y-6 shadow-xs text-right w-full">
                          
                          {/* Bento Header with Integrated Search */}
                          <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-right w-full">
                            <div className="flex items-center gap-3 justify-end w-full md:w-auto">
                              <div className="text-right">
                                <h3 className="text-sm font-bold text-slate-800 text-right">سجل مستفيدي المنصة والتحكم بالمراجعات 🎁</h3>
                                <p className="text-slate-400 text-[10px] text-right">متابعة ملفات المرضى وتفويض كشوفات المراجعة المجانية في وقت حقيقي</p>
                              </div>
                              <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold shadow-xs shrink-0">👥</span>
                            </div>
                            
                            {/* Live Search Bar for Patients and Status */}
                            <div className="relative w-full md:w-80">
                              <input
                                type="text"
                                placeholder="ابحث باسم المريض، البريد، أو المرض كـ (سكري)..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-xs text-right placeholder-slate-400 focus:outline-none focus:border-indigo-550 focus:ring-2 focus:ring-indigo-100 transition-all font-sans font-medium"
                              />
                              <span className="absolute right-3.5 top-3 text-slate-400 text-xs">🔍</span>
                            </div>
                          </div>

                          <div className="max-h-[580px] overflow-y-auto pr-1 text-right">
                            {(() => {
                              const matchedPatients = allUsers.filter(u => u.role === 'patient').filter(u => {
                                if (!patientSearch) return true;
                                const searchLower = patientSearch.toLowerCase();
                                return (
                                  u.name.toLowerCase().includes(searchLower) ||
                                  u.email.toLowerCase().includes(searchLower) ||
                                  (u.chronicConditions && u.chronicConditions.some(c => c.toLowerCase().includes(searchLower)))
                                );
                              });

                              if (matchedPatients.length === 0) {
                                return (
                                  <div className="py-12 text-center text-slate-450 italic font-sans border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl text-right text-xs">
                                    {patientSearch ? 'لم نعثر على أي مستفيد ينطبق عليه شروط بحثك الطبية.' : 'لا يوجد حسابات مرضى مسجلة بالمنصة حالياً.'}
                                  </div>
                                );
                              }

                              return (
                                <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-2xs">
                                  <table className="w-full text-right border-collapse min-w-[950px]" style={{ direction: 'rtl' }}>
                                    <thead>
                                      <tr className="bg-slate-50/80 border-b border-slate-150 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                        <th className="py-4 px-4 text-right whitespace-nowrap">المستفيد</th>
                                        <th className="py-4 px-4 text-right whitespace-nowrap">عنوان البريد الإلكتروني</th>
                                        <th className="py-4 px-4 text-right whitespace-nowrap">الحالة الطبية والأمراض المزمنة</th>
                                        <th className="py-4 px-4 text-center whitespace-nowrap">حالة الزيارة (الكشفية)</th>
                                        <th className="py-4 px-4 text-center whitespace-nowrap">تفويض الإرسال والصلاحيات</th>
                                        <th className="py-4 px-4 text-left whitespace-nowrap">التوجيه المباشر للعيادة</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs text-slate-705">
                                      {matchedPatients.map((u) => {
                                        const isFreeActive = localStorage.getItem(`medpulse_free_review_${u.email}_doc1`) === 'true' ||
                                                             localStorage.getItem(`medpulse_free_review_${u.email}_dr_samar`) === 'true' ||
                                                             doctors.some(d => localStorage.getItem(`medpulse_free_review_${u.email}_${d.id}`) === 'true');

                                        return (
                                          <tr 
                                            key={u.email} 
                                            className={`hover:bg-indigo-50/20 transition-all duration-150 ${
                                              isFreeActive ? 'bg-teal-50/15' : 'bg-white'
                                            }`}
                                          >
                                            {/* Name & Badge Cell */}
                                            <td className="py-3.5 px-4 font-bold text-slate-850 text-right whitespace-nowrap">
                                              <div className="flex items-center gap-2.5 justify-start">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-650 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                                                  {u.name ? u.name.charAt(0).toUpperCase() : 'P'}
                                                </div>
                                                <div className="space-y-1 block text-right">
                                                  <div className="flex items-center gap-1.5 flex-wrap justify-start">
                                                    <span className="text-slate-800 text-xs font-bold">{u.name}</span>
                                                    {u.age && (
                                                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[9px] font-extrabold border border-indigo-100 shrink-0">
                                                        {u.age} سنة
                                                      </span>
                                                    )}
                                                  </div>
                                                  <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] border inline-block ${
                                                    u.subscriptionType === 'Premium' 
                                                      ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                                      : 'bg-slate-50 text-slate-500 border-slate-200'
                                                  }`}>
                                                    {u.subscriptionType === 'Premium' ? '⭐ رعاية ذهبية' : 'رعاية أساسية'}
                                                  </span>
                                                </div>
                                              </div>
                                            </td>

                                            {/* Email Cell */}
                                            <td className="py-3.5 px-4 font-mono text-slate-500 text-[10px] text-right antialiased whitespace-nowrap">
                                              {u.email}
                                            </td>

                                            {/* Medical Status Cell */}
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                              <div className="flex flex-wrap gap-1 justify-start">
                                                {u.chronicConditions && u.chronicConditions.map(c => (
                                                  <span key={c} className="bg-rose-50 text-rose-600 border border-rose-100 font-extrabold rounded-full text-[9px] px-2 py-0.5 block shrink-0 select-none whitespace-nowrap">
                                                    {c === 'diabetes' ? '🩺 سكري' : c === 'hypertension' ? '❤️ ضغط شرياني' : '⚖️ سمنة/وزن زائد'}
                                                  </span>
                                                ))}
                                                {(!u.chronicConditions || u.chronicConditions.length === 0) && (
                                                  <span className="bg-slate-50 text-slate-500 border border-slate-200 font-bold rounded-full text-[9px] px-2 py-0.5 shrink-0 select-none whitespace-nowrap">
                                                    حالة وقائية عامة
                                                  </span>
                                                )}
                                              </div>
                                            </td>

                                            {/* Consultation status Cell */}
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                              {isFreeActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200 animate-pulse select-none whitespace-nowrap">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                                  مراجعة مجانية نشطة 🔓
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold text-slate-400 bg-slate-50 border border-slate-200 select-none whitespace-nowrap">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-350"></span>
                                                  كشفية اعتيادية 🔒
                                                </span>
                                              )}
                                            </td>

                                            {/* Switch Action Cell */}
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                              <button
                                                type="button"
                                                onClick={() => toggleFreeReviewForPatient(u.email)}
                                                className={`text-[9px] font-black px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shadow-xs select-none whitespace-nowrap ${
                                                  isFreeActive
                                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100 hover:border-rose-250'
                                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-150 hover:border-emerald-300'
                                                }`}
                                              >
                                                {isFreeActive ? 'إلغاء الإعفاء وقفل الوصول 🛑' : 'تفويض إعفاء ومراجعة مجانية 🎁'}
                                              </button>
                                            </td>

                                            {/* Action trigger prescription Cell */}
                                            <td className="py-3.5 px-4 text-left whitespace-nowrap">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setNewRxPatientEmail(u.email);
                                                  showToast(`✏️ تم تحديد المريض "${u.name}" بنجاح! تم ملء بريده في حقل إرسال الوصفة الطبية بالجانب الأيمن.`, 'success');
                                                  const deskEl = document.getElementById("prescription-creator-console");
                                                  if (deskEl) {
                                                    deskEl.scrollIntoView({ behavior: 'smooth' });
                                                  }
                                                }}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-extrabold px-3 py-2 rounded-xl transition cursor-pointer inline-flex items-center gap-1 w-full sm:w-auto shadow-xs active:scale-[0.98] select-none"
                                              >
                                                <span>كتابة وروشتة علاجية</span>
                                                <span>📝</span>
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* --- 2. AI Nutrition Tab --- */}
              {activeTab === 'nutrition' && (
                <div id="nutrition-tab-content">
                  <AiNutrition 
                    profile={currentUser} 
                    onUpdateProfile={handleUpdateCalorieBudget} 
                  />
                </div>
              )}

              {/* --- 3. VoIP Twilio Tab --- */}
              {activeTab === 'voip' && (
                <div id="voip-tab-content">
                  <VoipTwilio 
                    profile={currentUser} 
                    doctors={doctors} 
                    sessions={sessions}
                    onUpdateSession={handleUpdateSession}
                    onWriteRxForPatient={(email) => {
                      setNewRxPatientEmail(email);
                      setActiveTab('admin');
                      showToast(`تم إدراج المستفيد وتحديد بريده الإلكتروني (${email}) في لوحة صرف الوصفات بنجاح 📋⚕️`, 'success');
                    }}
                  />
                </div>
              )}

              {/* --- 4. Chatbot Tab --- */}
              {activeTab === 'chatbot' && (
                <div id="mock-chatbot-tab-content" className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                  
                  {/* Chatbot left sidebar instructions */}
                  <div className="md:w-1/3 bg-slate-50 p-6 border-l border-slate-100 flex flex-col justify-between space-y-6">
                    <div className="space-y-4 text-right">
                      <div className="bg-teal-600/10 text-teal-700 font-bold text-xs px-2.5 py-1.5 rounded-lg w-max">
                        طبيب الرعاية الرقمي MedPulse AI
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-800 font-display">مساعدك الذكي على مدار الساعة</h3>
                      
                      <p className="text-slate-500 text-xs leading-relaxed">
                        يتلقى هذا البوت بيانات مستواك الحالي ويعمل على صياغة الحلول التثقيفية فوراً لمشاكل التغذية وحساب السعرات، والحد من السمنة وتفسير قراءات الضغط والسكري التراكمي.
                      </p>

                      {/* Explicit Legal Disclaimer */}
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-right space-y-2 mt-4 transition hover:bg-amber-100/30">
                        <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5 justify-start">
                          ⚠️ إخلاء مسؤولية طبي وقانوني حاسم
                        </span>
                        <p className="text-[10px] text-amber-900 leading-relaxed font-sans font-medium">
                          أنظمة الذكاء الاصطناعي بالمنصة تقدم <strong>إرشادات إحصائية وتثقيفية استرشادية فقط</strong>، ولا تقوم أبداً مقام الطبيب البشري المختص في التشخيص، أو تحديد جرعات الأنسولين، أو صرف العلاجات. 
                        </p>
                        <p className="text-[10px] text-amber-900 leading-relaxed font-sans">
                          الحصول على العلاج الفعلي والوصفة الطبية الآمنة والمصادق عليها رقمياً يتم <strong>حصراً وجوباً</strong> من خلال حجز موعد ومراسلة أحد الأطباء البشريين الاستشاريين المعتمدين والمدرجين في العراق عبر علامة تبويب <strong className="text-teal-850">الأطباء والصيدليات والربط الجغرافي</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-teal-50 Rounded-xl border border-teal-100/50 text-[11px] text-teal-800 space-y-1.5 text-right">
                      <strong>💡 تلميحات للاستفسارات:</strong>
                      <p>• "ما هي السعرات المثالية لأحمد؟"</p>
                      <p>• "أشعر بارتفاع السكر صباحاً، كيف أتصرف؟"</p>
                      <p>• "وددت التعرف على فوائد التقارب بقرص الجلوكوفاج"</p>
                    </div>
                  </div>

                  {/* Chat primary window */}
                  <div className="flex-1 flex flex-col justify-between p-6">
                    {/* Message view area */}
                    <div id="chat-messages-scroll" className="flex-1 space-y-4 overflow-y-auto max-h-[380px] mb-4 pr-1.5">
                      {chatMessages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex items-start gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
                        >
                          {/* Avatars */}
                          <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                            msg.sender === 'user' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {msg.sender === 'user' ? 'أنا' : 'AI'}
                          </div>

                          {/* Balloons */}
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.sender === 'user' ? 'bg-teal-600 text-white rounded-tl-none' : 'bg-slate-100 text-slate-800 rounded-tr-none'
                          }`}>
                            <p className="whitespace-pre-line">{msg.text}</p>
                            <span className={`text-[9px] mt-1 text-left block opacity-60`}>{msg.timestamp}</span>
                          </div>

                        </div>
                      ))}

                      {chatLoading && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-ping"></span>
                          <span>طبيب الرعاية الرقمي يحلل ملفك الطبي ويصيغ الرد دقيقة واحدة...</span>
                        </div>
                      )}
                    </div>

                    {/* Trial Progress Notice Bar */}
                    {currentUser && currentUser.subscriptionType !== 'Premium' && currentUser.role !== 'admin' && currentUser.role !== 'doctor' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-right flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-amber-800 flex items-center gap-1 justify-end">وضع الاستشارة التجريبية المجانية النشط ⚡</h4>
                          <p className="text-[10px] text-amber-700 font-medium">
                            متبقي لك <strong>{Math.max(0, 3 - Number(localStorage.getItem(`trial_count_${currentUser.email}`) || 0))}</strong> من أصل 3 استشارات طبية بالذكاء الاصطناعي مخصصة مجاناً لتجربة دقة النظام.
                          </p>
                        </div>
                        <div className="flex gap-1.5 self-end sm:self-auto">
                          {[1, 2, 3].map((step) => {
                            const currentCount = Number(localStorage.getItem(`trial_count_${currentUser.email}`) || 0);
                            const isCompleted = currentCount >= step;
                            return (
                              <div 
                                key={step} 
                                className={`h-2 w-8 rounded-full transition-all duration-300 ${
                                  isCompleted ? 'bg-amber-500 shadow-2xs' : 'bg-slate-200'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Chat input box */}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input 
                        type="text" required
                        placeholder="اكتب استشارتك الصحية أو استفسارك هنا..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-teal-500 text-right"
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        disabled={chatLoading}
                      />
                      <button
                        type="submit"
                        disabled={chatLoading}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition cursor-pointer"
                      >
                        إرسال
                      </button>
                    </form>

                    {/* Legal Footer Note */}
                    <p className="text-[10px] text-slate-400 text-center mt-3 font-sans leading-relaxed text-slate-500">
                      ⚖️ <strong>تنبيه السامة الطبية:</strong> الدردشة الذكية لغرض التثقيف والإرشاد الصحي فقط ولا تقدم علاجاً دوائياً أو قياسات حيوية سريرية. للحصول على وصفة رسمية مرخصة أو استشارة حية، يرجى الارتباط بطبيب بشري مباشرةً من علامة تبويب <strong className="text-teal-700">الأطباء والصيدليات والربط الجغرافي</strong>.
                    </p>
                  </div>

                </div>
              )}

              {/* --- Patient Archive Tab (Doctors & Admins only) --- */}
              {activeTab === 'archive' && (currentUser.role === 'doctor' || currentUser.role === 'admin') && (
                <div id="patient-archive-tab-content" className="animate-fade-in">
                  <PatientArchive currentUser={currentUser} doctors={doctors} />
                </div>
              )}

              {/* --- 4.5 Partners and Geographic Matchmaking Tab --- */}
              {activeTab === 'partners' && currentUser.role === 'admin' && (
                <div id="partners-tab-content" className="space-y-8 animate-fade-in">
                  
                  {/* Top Hub Welcome Info Banner */}
                  <div className="bg-gradient-to-br from-teal-900 to-slate-900 rounded-3xl text-white p-6 md:p-8 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <span className="bg-emerald-500 text-slate-950 text-xs font-black uppercase px-3 py-1 rounded-full self-start">محرك الربط الجغرافي الفوري (GPS Core)</span>
                      <button
                        onClick={() => {
                          setKeychainUser({
                            name: currentUser?.name || "مشرف النظام",
                            email: currentUser?.email || "admin@medpulse.com",
                            role: 'admin',
                            detail: "لوحة التحكم والعمليات المباشرة"
                          });
                          setShowKeychainModal(true);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4.5 py-2 rounded-2xl text-[11px] transition flex items-center gap-2 cursor-pointer shadow-sm self-start md:self-center"
                      >
                        <QrCode className="w-4 h-4 animate-pulse" />
                        <span>ميدالية الباركود للدخول السريع للمشرف (Admin Key QR) 🔑</span>
                      </button>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold font-display">منظومة الرعاية والتعاقد مع الأطباء والصيدليات في العراق</h2>
                    <p className="text-emerald-100/80 text-xs md:text-sm max-w-3xl leading-relaxed">
                      تتغلب منصة <strong className="text-white hover:underline cursor-pointer">MedPulse</strong> على المنصات العالمية مثل Medvi عبر دمج الذكاء الاصطناعي مع التواجد الجغرافي الفعلي. نقوم بحساب المسافة الحقيقية لأقرب صيدلية لضمان تسليم ووصول أدوية السكري والضغط لليد في غضون دقائق، مع إمكانية تسجيل الكوادر الطبية والمرافق فوراً وبسرية تامة.
                    </p>
                  </div>

                  {/* SECTION 1: Interconnected GPS Matchmaker and Pharmacy Locator */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Simulated GPS Coordinates and sorted Nearest Pharmacies */}
                    <div className="lg:col-span-8 space-y-6">
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">محدد الصيدلية الشريكة الأقرب لموقعك</h3>
                            <p className="text-slate-500 text-xs mt-0.5">اختر موقع الحي الحالي لتحديث المسافة والربط التلقائي فوراً</p>
                          </div>
                          
                          {/* Live Coordinates Display */}
                          <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-left font-mono text-xs shrink-0">
                            <span className="text-slate-400">موقعك (GPS):</span> <strong className="text-teal-600">{phLat || "33.3248"}</strong>, <strong className="text-teal-600">{phLng || "44.3644"}</strong>
                          </div>
                        </div>

                        {/* Location preset buttons */}
                        <div className="space-y-3">
                          <span className="text-xs font-bold text-slate-500 block">اضغط لتغيير موقعك الافتراضي ومحاكاتها في العراق لمعرفة الصيدلية الأقرب:</span>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { name: 'الرمادي - مركز الانبار', lat: '33.4244', lng: '43.3039' },
                              { name: 'القائم - غرب الانبار', lat: '34.3794', lng: '41.0772' },
                              { name: 'الحارثية - بغداد', lat: '33.3248', lng: '44.3644' },
                              { name: 'الفلوجة - الانبار', lat: '33.3494', lng: '43.7844' },
                              { name: 'الكرادة - بغداد', lat: '33.3011', lng: '44.4233' }
                            ].map((preset) => {
                              const active = phLat === preset.lat && phLng === preset.lng;
                              return (
                                <button
                                  key={preset.name}
                                  onClick={() => {
                                    setphLat(preset.lat);
                                    setphLng(preset.lng);
                                    setUserLocationQuery(preset.name);
                                    showToast(`تم محاكاة موقعك الجديد: ${preset.name}`, 'info');
                                  }}
                                  className={`text-xs py-2 px-3 rounded-xl border font-medium transition ${
                                    active ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200/60 hover:bg-slate-100'
                                  }`}
                                >
                                  📍 {preset.name.split(' - ')[0]}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Calculate Distance Helper and sort pharmacies list */}
                        <div className="space-y-4 pt-2">
                          <span className="text-xs font-bold text-slate-500 block">الصيدليات المعتمدة ومسافات الشحن بناءً على إحداثيات المشترك:</span>
                          
                          {pharmacies.length === 0 ? (
                            <div className="text-center py-6 text-slate-500 bg-slate-50 border border-slate-100/80 rounded-2xl italic text-xs">
                              لم يتم تسجيل أي صيدلية شريكة حتى الآن. يمكن لمدير النظام إضافة الصيدليات الشريكة من لوحة التحكم لتظهر في الخريطة ودليل الصرف الفوري.
                            </div>
                          ) : (
                            <div className="space-y-3.5">
                              {/* Map pharmacies list with dynamically calculated distance */}
                              {[...pharmacies].map((ph) => {
                                // Default back to Baghdad coordinates if not typed yet or absent
                                const uLat = phLat ? Number(phLat) : 33.3248;
                                const uLng = phLng ? Number(phLng) : 44.3644;

                                // Haversine formula calculation
                                const R = 6371; // earth radius in km
                                const dLat = (ph.lat - uLat) * Math.PI / 180;
                                const dLon = (ph.lng - uLng) * Math.PI / 180;
                                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                          Math.cos(uLat * Math.PI / 180) * Math.cos(ph.lat * Math.PI / 180) * 
                                          Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                const distanceKm = Number((R * c).toFixed(2));

                                return { ...ph, distanceKm };
                              })
                              // Sort by nearest distance
                              .sort((a, b) => a.distanceKm - b.distanceKm)
                              .map((ph, idx) => (
                                <div 
                                  key={ph.id} 
                                  onClick={() => {
                                    setSelectedPharmacyForOrder(ph);
                                    showToast(`تم فتح نافذة طلب الصرف السريع من صيدلية: ${ph.name}`, 'info');
                                  }}
                                  title="اضغط على خانة الصيدلية لطلب العلاج منها فوراً"
                                  className={`border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition duration-150 cursor-pointer hover:border-teal-400 hover:shadow-md hover:scale-[1.01] ${
                                    idx === 0 ? 'bg-amber-50/40 border-amber-200/70 shadow-xs' : 'bg-slate-50/50 border-slate-150 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono">
                                        {ph.id}
                                      </span>
                                      <h4 className="font-bold text-slate-800 text-sm">
                                        {ph.name} - {ph.district}{ph.address ? ` - ${ph.address}` : ''}
                                      </h4>
                                      {idx === 0 && (
                                        <span className="bg-emerald-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                          ★ الأقرب لموقعك
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                      🗺️ العنوان الكامل: <strong className="text-teal-700">{ph.district}{ph.address ? ` - ${ph.address}` : ''}</strong> • الإحداثيات: {ph.lat}, {ph.lng}
                                    </p>
                                    
                                    <div className="text-[10px] text-zinc-500">
                                      📞 هاتف التواصل الفوري: {ph.phone}
                                    </div>
                                  </div>

                                  <div className="flex flex-row md:flex-col items-end gap-2 justify-between border-t md:border-t-0 pt-2.5 md:pt-0 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <div className="text-right">
                                      <span className="text-[10px] font-bold text-slate-400 block uppercase">المسافة الفعلية</span>
                                      <span className="text-sm font-black text-rose-600 font-mono">{ph.distanceKm} كم</span>
                                    </div>
                                    <div className="flex gap-2 items-center font-sans">
                                      <button
                                        onClick={() => {
                                          setSelectedPharmacyForOrder(ph);
                                        }}
                                        className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition cursor-pointer"
                                      >
                                        طلب دواء مباشر 💊
                                      </button>
                                      <button
                                        onClick={() => {
                                          setNewRxPharmacy(ph.name);
                                          showToast(`تم تعيين "${ph.name}" كصيدلية صرف رئيسية للمريض ودعم النطاق الجغرافي الشاحن!`, 'success');
                                        }}
                                        className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                                      >
                                        تعيين كصيدلية صرف 🚚
                                      </button>
                                      <button
                                        onClick={() => handleDeletePharmacy(ph.id, ph.name)}
                                        title="إلغاء شطب الصيدلية من النظام"
                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition cursor-pointer shrink-0"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setKeychainUser({
                                            name: ph.name,
                                            email: `pharmacy.${ph.id}@medpulse.com`,
                                            role: 'pharmacy',
                                            detail: ph.district
                                          });
                                          setShowKeychainModal(true);
                                        }}
                                        title="توليد وعرض باركود الولوج السريع (ميدالية المفاتيح) 🔑"
                                        className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 p-2 rounded-xl transition cursor-pointer shrink-0"
                                      >
                                        <QrCode className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingPharmacy(ph);
                                        }}
                                        title="تعديل بيانات الصيدلية"
                                        className="text-slate-400 hover:text-teal-600 hover:bg-teal-50 p-2 rounded-xl transition cursor-pointer shrink-0"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Right Column: Register New Pharmacy */}
                    <div className="lg:col-span-4 space-y-6">
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-5">
                        <div className="border-b border-slate-100 pb-3">
                          <h3 className="text-base font-bold text-slate-800">تسجيل صيدلية جديدة</h3>
                          <p className="text-[11px] text-slate-400 leading-snug mt-1">تسهل هذه الواجهة تسجيل المراكز الطبية وإتاحتها فوراً لعمليات البحث الجغرافي للأقرب.</p>
                        </div>

                        <form onSubmit={handleRegisterPharmacy} className="space-y-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">اسم الصيدلية الرسمي</label>
                            <input 
                              type="text" required
                              placeholder="مثال: صيدلية اورنج"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500"
                              value={phName} onChange={(e) => setphName(e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">المحافظة</label>
                              <input 
                                type="text" required
                                placeholder="مثال: الانبار"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500"
                                value={phProvince} onChange={(e) => setPhProvince(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">القضاء</label>
                              <input 
                                type="text" required
                                placeholder="مثال: الرمادي"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500"
                                value={phDistrictDetail} onChange={(e) => setPhDistrictDetail(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">خط العرض (Lat)</label>
                              <input 
                                type="text"
                                placeholder="مثال: 33.4244"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-mono"
                                value={phLat} onChange={(e) => setphLat(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">خط الطول (Lng)</label>
                              <input 
                                type="text"
                                placeholder="مثال: 43.3039"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-mono"
                                value={phLng} onChange={(e) => setphLng(e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">الموقع أو العنوان التفصيلي (الشارع أو الحي)</label>
                            <input 
                              type="text" required
                              placeholder="مثال: شارع المستشفى العام"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 font-sans"
                              value={phAddress} onChange={(e) => setphAddress(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم هاتف الصيدلية</label>
                            <input 
                              type="text"
                              placeholder="مثال: 966501234567+"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 font-mono"
                              value={phPhone} onChange={(e) => setphPhone(e.target.value)}
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                          >
                            تأكيد التسجيل وتوليد الإحداثيات 💾
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Dynamic Doctors & Medical Professionals Registry with specialty lookup */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: List on board medical doctors */}
                    <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">طاقم الأطباء المعتمدين والمشرفين بالمنصة</h3>
                          <p className="text-slate-500 text-xs mt-0.5">يمكنك حجز استشارة أو تحفيز الذكاء الاصطناعي مع تخصص الطبيب</p>
                        </div>
                        
                        {/* Search Doctors input */}
                        <div className="relative">
                          <input 
                            type="text"
                            placeholder="ابحث بالتخصص أو اسم الطبيب..."
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-teal-500 w-full sm:w-64"
                            value={docHospital} // Reuse docHospital temporary as a search filtering state to minimize state impact or we can just filter
                            onChange={(e) => setDocHospital(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doctors.filter(doc => {
                          const query = docHospital.trim().toLowerCase();
                          if (!query) return true;
                          return doc.name.toLowerCase().includes(query) || doc.specialty.toLowerCase().includes(query);
                        }).map((doc) => (
                          <div key={doc.id} className="relative border border-slate-100 rounded-2xl p-5 hover:border-teal-100 transition duration-150 flex items-start justify-between gap-4 bg-slate-50/50">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="h-11 w-11 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-800 shrink-0">
                                ⚕️
                              </div>
                              <div className="space-y-1 flex-1">
                                <h4 className="font-bold text-slate-800 text-sm">{doc.name}</h4>
                                <p className="text-xs text-slate-500 leading-normal">
                                  💊 التخصص: <strong className="text-teal-700">{doc.specialty}</strong>
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  🏥 مستشفى الممارسة: {doc.id.startsWith("dr_") ? doc.hospital : "مستشفى الرعاية الافتراضية للضغط والسمنة"}
                                </p>
                                <div className="flex items-center gap-1 text-[11px] text-amber-500 pt-1 font-bold">
                                  ⭐️ تقييم المستفيدين: {doc.rating} / 5.0
                                </div>

                                {/* Newly added dynamic operational parameters */}
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100/80 text-[10.5px] text-slate-650 bg-slate-100/50 p-2 rounded-xl" dir="rtl">
                                  <div>
                                    💵 الكشفية: <span className="font-extrabold text-indigo-750">{doc.isPaid !== false ? `${(doc.consultationFee || 20000).toLocaleString()} د.ع` : "مجانية تطوعية"}</span>
                                  </div>
                                  <div>
                                    👥 سعة اليوم الواحد: <span className="font-bold text-slate-800">{doc.maxPatientsPerDay || 12} مرضى</span>
                                  </div>
                                  <div className="col-span-2 pt-0.5 mt-0.5 border-t border-dotted border-slate-200">
                                    🏛️ استقطاع المنصة: <span className="font-semibold text-slate-700">{doc.platformPercentage || 0}% %</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Actions Buttons */}
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setKeychainUser({
                                    name: doc.name,
                                    email: doc.email,
                                    role: 'doctor',
                                    detail: doc.specialty
                                  });
                                  setShowKeychainModal(true);
                                }}
                                title="توليد وعرض باركود الولوج السريع (ميدالية المفاتيح) 🔑"
                                className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 p-2 rounded-xl transition duration-150 cursor-pointer"
                              >
                                <QrCode className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDoctor(doc);
                                }}
                                title="تعديل ملف الطبيب"
                                className="text-slate-400 hover:text-teal-600 hover:bg-teal-50 p-2 rounded-xl transition duration-150 cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDoctor(doc.id, doc.name);
                                }}
                                title="حذف وإلغاء اعتماد الطبيب"
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition duration-150 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Right Column: Register as doctor */}
                    <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 space-y-5">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-bold text-slate-800">تسجيل طبيب مشرف جديد</h3>
                        <p className="text-[11px] text-slate-400 leading-snug mt-1">يتيح هذا القسم للأطباء في العراق الانضمام لـ MedPulse وكتابة وصفات دوائية بصفائح مرئية.</p>
                      </div>

                      <form onSubmit={handleRegisterDoctor} className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">الاسم الكامل للطبيب</label>
                          <input 
                            type="text" required
                            placeholder="مثال: د. حيدر الجبوري"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500"
                            value={docName} onChange={(e) => setDocName(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">البريد الإلكتروني للولوج</label>
                          <input 
                            type="email" required
                            placeholder="dr.faisal@medpulse.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 font-mono"
                            value={docEmail} onChange={(e) => setDocEmail(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">التخصص الدقيق</label>
                          <input 
                            type="text" required
                            placeholder="مثال: أمراض السكري والغدد الصماء وتراكمي السكر"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 text-right"
                            value={docSpecialty} onChange={(e) => setDocSpecialty(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">المستشفى أو المركز الطبي المشرف</label>
                          <input 
                            type="text" required
                            placeholder="مثال: مستشفى مدينة الطب، بغداد"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500"
                            value={docHospital} onChange={(e) => setDocHospital(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم هاتف التواصل السريع (واتساب الطبي)</label>
                          <input 
                            type="text" required
                            placeholder="مثال: +966501234567"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 font-mono text-left"
                            value={docWhatsApp} onChange={(e) => setDocWhatsApp(e.target.value)}
                          />
                          <p className="text-[10px] text-indigo-500 mt-1">يُستعمل للربط المباشر مع المرضى عبر منصة واتساب للرد على الحالات.</p>
                        </div>

                        {/* Consultation payment mode */}
                        <div className="space-y-4 border-t border-slate-100 pt-3 text-right">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">نوع الخدمة والفوترة</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDocIsPaid(false);
                                setDocConsultationFee(0);
                              }}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                !docIsPaid
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-sans'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-sans'
                              }`}
                            >
                              <span>💚 مجانية تطوعية</span>
                              <span className="text-[9px] font-normal">تخطي بوابة الدفع بالكامل</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDocIsPaid(true);
                                setDocConsultationFee(20000);
                              }}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                docIsPaid
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-sans'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-sans'
                              }`}
                            >
                              <span>💳 استشارة مدفوعة</span>
                              <span className="text-[9px] font-normal">بوابة دفع مخصصة بالكشفية</span>
                            </button>
                          </div>
                        </div>

                        {/* MedPulse Financial & Operational Parameters */}
                        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-right">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">قيمة كشفية الطبيب (د.ع)</label>
                            <input
                              type="number" required min="0" step="500"
                              placeholder="مثال: 20000"
                              disabled={!docIsPaid}
                              className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-mono text-center ${!docIsPaid ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                              value={docConsultationFee}
                              onChange={(e) => setDocConsultationFee(Number(e.target.value))}
                            />
                            <p className="text-[9px] text-slate-400 mt-1">سعر الكشفية بالدينار العراقي</p>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">مرضى اليوم الواحد</label>
                            <input
                              type="number" required min="1"
                              placeholder="مثال: 12"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-mono text-center text-slate-800"
                              value={docMaxPatientsPerDay}
                              onChange={(e) => setDocMaxPatientsPerDay(Number(e.target.value))}
                            />
                            <p className="text-[9px] text-slate-400 mt-1">الحد الأقصى للمرضى يومياً</p>
                          </div>
                        </div>

                        <div className="text-right pt-1 pb-2">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">نسبة المنصة المستقطعة من الكشفية (%)</label>
                          <input
                            type="number" required min="0" max="100"
                            placeholder="يمكن تركها 0%"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-mono text-center text-slate-800"
                            value={docPlatformPercentage}
                            onChange={(e) => setDocPlatformPercentage(Number(e.target.value))}
                          />
                          <p className="text-[9px] text-slate-400 mt-1">سيتم استقطاع هذه النسبة مئوياً وتوثيقها ببيانات الطبيب المالي.</p>
                        </div>

                        {/* Availability hours mode */}
                        <div className="space-y-3 border-t border-slate-100 pt-3 text-right">
                          <label className="block text-[11px] font-bold text-slate-500">ساعات الدوام وأوقات الاستشارات</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setDocAvailabilityType('24/7')}
                              className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer font-sans ${
                                docAvailabilityType === '24/7'
                                  ? 'border-teal-500 bg-teal-50 text-teal-850'
                                  : 'border-slate-200 bg-slate-50 text-slate-600'
                              }`}
                            >
                              مفتوح 24/7
                            </button>
                            <button
                              type="button"
                              onClick={() => setDocAvailabilityType('custom')}
                              className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer font-sans ${
                                docAvailabilityType === 'custom'
                                  ? 'border-teal-500 bg-teal-50 text-teal-850'
                                  : 'border-slate-200 bg-slate-50 text-slate-600'
                              }`}
                            >
                              مواعيد دوام مخصصة
                            </button>
                          </div>

                          {docAvailabilityType === 'custom' && (
                            <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-150 animate-fade-in text-right">
                              {/* Hourly schedule */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] text-slate-400 font-bold mb-1">ساعة البدء</label>
                                  <input
                                    type="time"
                                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-center font-mono focus:outline-teal-500"
                                    value={docStartTime}
                                    onChange={(e) => setDocStartTime(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-slate-400 font-bold mb-1">ساعة الانتهاء</label>
                                  <input
                                    type="time"
                                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-center font-mono focus:outline-teal-500"
                                    value={docEndTime}
                                    onChange={(e) => setDocEndTime(e.target.value)}
                                  />
                                </div>
                              </div>

                              {/* Day Selector */}
                              <div className="space-y-1">
                                <label className="block text-[9px] text-slate-400 font-bold">أيام الدوام الأسبوعية:</label>
                                <div className="flex flex-wrap gap-1 justify-start">
                                  {["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day) => {
                                    const isSelected = docWorkingDays.includes(day);
                                    return (
                                      <button
                                        type="button"
                                        key={day}
                                        onClick={() => {
                                          if (isSelected) {
                                            setDocWorkingDays(docWorkingDays.filter(d => d !== day));
                                          } else {
                                            setDocWorkingDays([...docWorkingDays, day]);
                                          }
                                        }}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer font-sans ${
                                          isSelected
                                            ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                      >
                                        {day.replace("السبت", "سبت").replace("الأحد", "أحد").replace("الاثنين", "اثنين").replace("الثلاثاء", "ثلاثاء").replace("الأربعاء", "أربعاء").replace("الخميس", "خميس").replace("الجمعة", "جمعة")}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
                        >
                          تأكيد الانضمام كطبيب مشرف ⚕️
                        </button>
                      </form>
                    </div>

                  </div>

                  {/* SECTION 3: Multi-Device Cloud Sync Console */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6 mt-8 animate-fade-in text-right">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2.5 justify-start flex-row-reverse">
                        <span className="text-xl">📲</span>
                        <h3 className="text-lg font-bold text-slate-800 font-display">مزامنة ونقل البيانات سحابياً ومحلياً بين الأجهزة (Clinical Sync)</h3>
                      </div>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                        بما أن المنصة تعتمد على مبدأ الخصوصية التامة والتشغيل الفوري دون انقطاع لحماية بيانات المرضى والأطباء في العراق، يمكنك الآن مزامنة الأطباء المضافين، الصيدليات، والبيانات السريرية بسهولة فائقة بين جهاز الحاسوب والهاتف المحمول أو أجهزة الكوادر الطبية الأخرى.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Block: Export Sync Code */}
                      <div className="space-y-4 border-l border-slate-100 pl-0 md:pl-6 text-right">
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 justify-end flex-row-reverse">
                            <span className="text-indigo-600 font-bold">1.</span>
                            <span>تصدير البيانات وتوليد كود المزامنة (من الحاسوب مثلاً)</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1">
                            اضغط على الزر أدناه لتجميع كافة الأطباء، الصيدليات، الوصفات، وقائمة التعديلات في كود مشفر واحد لنسخه ونقله.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleExportSyncCode}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-150 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          📥 توليد كود المزامنة السريع وتصدير البيانات
                        </button>

                        {syncCode && (
                          <div className="space-y-2 animate-fade-in">
                            <label className="block text-[10px] font-bold text-indigo-700">كود المزامنة السري (انسخه بالكامل):</label>
                            <textarea
                              readOnly
                              className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] font-mono focus:outline-none select-all text-slate-600 resize-none break-all"
                              value={syncCode}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(syncCode);
                                showToast('تم نسخ كود المزامنة بالكامل بنجاح! أرسله لهاتفك عبر الواتساب أو الإيميل واحفظه هناك', 'success');
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                            >
                              📋 نسخ الكود المولد للحافظة
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right Block: Import Sync Code */}
                      <div className="space-y-4 text-right">
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 justify-end flex-row-reverse">
                            <span className="text-emerald-600 font-bold">2.</span>
                            <span>استيراد البيانات وتحديث المنصة (على الهاتف مثلاً)</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1">
                            قم بلصق كود المزامنة الذي قمت بنسخه من جهازك الآخر لتحديث قاعدة بيانات الهاتف فوراً ومزامنة الأطباء والصيدليات والوصفات المحذوفة أو المضافة.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <textarea
                            placeholder="قم بلصق كود المزامنة الطويل هنا..."
                            className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] font-mono focus:outline-teal-500 text-slate-700 placeholder-slate-300 resize-none break-all"
                            value={importCode}
                            onChange={(e) => setImportCode(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => handleImportSyncCode(importCode)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-150 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            📤 استيراد كود المزامنة ودمج قاعدة البيانات فوراً
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100 text-right text-[11px] leading-relaxed text-amber-900 font-sans">
                      💡 <strong>ملاحظة للمشرفين:</strong> هذه الميزة آمنة تماماً وخاصة، حيث يتم نقل البيانات مباشرة ومشفرة بواسطة الكود دون حفظها في أي خوادم خارجية مجهولة الهوية لتأمين معلومات وصيدليات العراق الرقمية 100%.
                    </div>
                  </div>

                </div>
              )}

              {/* --- 5. Doctors & Admin Panel Tab --- */}
              {activeTab === 'admin' && (currentUser.role === 'admin' || currentUser.role === 'doctor') && (
                <div id="admin-tab-content" className="space-y-8">
                  
                  {/* Doctor creator prescription console */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Sidebar with Forms */}
                    <div className={currentUser.role === 'admin' ? "lg:col-span-4 space-y-6" : "lg:col-span-12 max-w-3xl mx-auto w-full space-y-6"}>
                      
                      {/* Prescription generator form */}
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 font-display">لوحة تحرير الوصفات والربط الصيدلاني</h3>
                          <p className="text-slate-500 text-xs mt-0.5">يمكنك بصفتك دكتور أو مشرف إدخال دواء أو مكمل غذائي ليرحل فوراً ومباشرة للمستفيد</p>
                        </div>

                        <form onSubmit={handleCreatePrescription} className="space-y-4">
                          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100 text-right font-sans">
                            <span className="block text-xs font-bold text-amber-900 leading-none mb-1">💡 تمكين حرية اختيار الصيدلية للمستفيد:</span>
                            <p className="text-[11px] text-amber-800 leading-relaxed m-0">
                              تم إلغاء تحديد الصيدلية المسبق لإعطاء المستفيد كامل الحرية في اختيار فرع الصيدلية الأقرب لمنطقته أو سكنه (مثل صيدلية بابل الكبرى، صيدلية الحياة، أو غيرها) مباشرة من لوحة تحكمه الخاصة لضمان سرعة وملاءمة التوصيل وسهولته.
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">تصنيف المستحضر المحرر</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-150 ${!isRxSupplement ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                onClick={() => setIsRxSupplement(false)}
                              >
                                دواء علاجي
                              </button>
                              <button
                                type="button"
                                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-150 ${isRxSupplement ? 'bg-teal-600 border-teal-600 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                onClick={() => setIsRxSupplement(true)}
                              >
                                مكمل غذائي
                              </button>
                            </div>
                          </div>

                          {/* Preset suggestions */}
                          <div>
                            <span className="block text-xs font-bold text-slate-400 mb-1.5 font-sans">🌿 اقتراحات سريرية سريعة (انقر للإضافة والدمج في قائمتك):</span>
                            <div className="flex flex-wrap gap-1.5">
                              {!isRxSupplement ? (
                                <>
                                  <button type="button" onClick={() => handleAddPresetToMeds('Glucophage (جلوكوفاج)', '500 ملجم مرتين يومياً', 'قرص واحد مع الوجبة صباحاً ومساءً للتحكم بسكر الدم')} className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-indigo-100">➕ جلوكوفاج 500مجم</button>
                                  <button type="button" onClick={() => handleAddPresetToMeds('Concor (كونكور للضغط)', '5 ملجم صباحاً', 'قرص واحد على الريق مع كوب ماء وبدون مضغ')} className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-indigo-100">➕ كونكور للضغط</button>
                                  <button type="button" onClick={() => handleAddPresetToMeds('Lipitor (ليبيتور)', '20 ملجم ليلاً', 'قرص واحد قبل النوم مباشرة')} className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-indigo-100">➕ ليبيتور كوليسترول</button>
                                </>
                              ) : (
                                <>
                                  <button type="button" onClick={() => handleAddPresetToMeds('فيتامين د3 السائل (Vitamin D3)', '5000 وحدة دولية يومياً', 'حبة واحدة يومياً مع الوجبة الرئيسية الدسمة لتعويض عجز الحرق والسمنة')} className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-teal-100">➕ فيتامين د3</button>
                                  <button type="button" onClick={() => handleAddPresetToMeds('بيسجليسينات المغنيسيوم (Magnesium)', '400 ملجم ليلاً', 'حبة واحدة قبل النوم بساعة لإراحة العضلات وتوسيع شرايين الأوعية')} className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-teal-100">➕ مغنيسيوم</button>
                                  <button type="button" onClick={() => handleAddPresetToMeds('أوميغا-3 البحري (Omega 3)', '1000 ملجم مع الغداء', 'كبسولة واحدة مع وجبة الغداء لتعزيز صحة شرايين القلب والدماغ وثبات الدهون')} className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-teal-100">➕ أوميغا-3</button>
                                  <button type="button" onClick={() => handleAddPresetToMeds('بيكولينات الكروم (Chromium)', '200 ميكروجرام حبة واحدة', 'حبة واحدة قبل الغذاء بـ 20 دقيقة لزيادة كفاءة مستقبلات الإنسولين')} className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-teal-100">➕ كروميوم</button>
                                </>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">المستفيد / المريض المستهدف في المنصة</label>
                            <select 
                              required
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-teal-500 font-sans"
                              value={newRxPatientEmail}
                              onChange={(e) => setNewRxPatientEmail(e.target.value)}
                            >
                              <option value="">-- اختر المريض لإرسال الوصفة لصفحته --</option>
                              <option value={currentUser?.email || ""}>{currentUser?.name || "المستخدم الحالي"} ({currentUser?.email}) - حسابك</option>
                              {allUsers.filter(u => u.email !== currentUser?.email).map(u => (
                                <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1">
                              * سيقوم النظام فورياً بربط الوصفة بملف المريض وإظهارها في محفظة أدويته وسجلاته.
                            </p>
                          </div>

                          <div className="space-y-4 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#008080] flex items-center gap-1 font-sans">💊 قائمة المواد العلاجية والمكملات الموصوفة:</span>
                              <button
                                type="button"
                                onClick={() => setMedicationItems(prev => [...prev, { name: '', dosage: '', instructions: '' }])}
                                className="text-xs text-white bg-[#008080] hover:bg-teal-700 font-bold px-3 py-1.5 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer"
                              >
                                ➕ إضافة علاج جديد
                              </button>
                            </div>

                            <div className="space-y-3">
                              {medicationItems.map((item, index) => (
                                <div key={index} className="bg-white border border-slate-200/80 p-3.5 rounded-xl space-y-3 relative text-right">
                                  {medicationItems.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setMedicationItems(prev => prev.filter((_, i) => i !== index))}
                                      className="absolute left-2.5 top-2 text-rose-500 hover:text-rose-700 bg-rose-50 p-1 rounded-lg border border-rose-100 transition-colors text-xs cursor-pointer"
                                      title="حذف هذا الدواء"
                                    >
                                      🗑️ حذف
                                    </button>
                                  )}
                                  
                                  <div className="text-[10px] bg-slate-100 text-[#008080] px-2 py-0.5 rounded font-bold inline-block">
                                    العلاج #{index + 1}
                                  </div>

                                  <div className="space-y-2.5 text-right">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1 font-sans">اسم العلاج / المكمل العلمي والتجاري:</label>
                                      <input 
                                        type="text"
                                        required
                                        placeholder={isRxSupplement ? "مثال: كبسولات فيتامين د3" : "مثال: جلوكوفاج 500 ملجم"}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-[#008080] font-semibold"
                                        value={item.name}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setMedicationItems(prev => prev.map((it, i) => i === index ? { ...it, name: val } : it));
                                        }}
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 font-sans">الجرعة المحددة:</label>
                                        <input 
                                          type="text"
                                          required
                                          placeholder="مثال: 500 ملجم أو حبة واحدة"
                                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-[#008080] font-semibold"
                                          value={item.dosage}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setMedicationItems(prev => prev.map((it, i) => i === index ? { ...it, dosage: val } : it));
                                          }}
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 font-sans">طريقة تناول العلاج المقررة:</label>
                                        <input 
                                          type="text"
                                          required
                                          placeholder="مثال: صباحاً ومساءً مع الغداء"
                                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-[#008080] font-semibold"
                                          value={item.instructions || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setMedicationItems(prev => prev.map((it, i) => i === index ? { ...it, instructions: val } : it));
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">صيدلية الصرف المعتمدة الرقمية</label>
                            <select 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-teal-500"
                              value={newRxPharmacy}
                              onChange={(e) => setNewRxPharmacy(e.target.value)}
                            >
                              <option value="">-- اختر صيدلية شريكة معتمدة --</option>
                              {pharmacies.map(ph => (
                                <option key={ph.id} value={ph.name}>{ph.name} - {ph.district}{ph.address ? ` - ${ph.address}` : ''}</option>
                              ))}
                              <option value="صيدلية اورنج">صيدلية اورنج - الانبار - الرمادي</option>
                              <option value="صيدلية زمزم">صيدلية زمزم - الانبار - القائم</option>
                              <option value="صيدلية احمد">صيدلية احمد - بغداد - الحارثية</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">إرشادات الاستعمال، طلب الفحوصات وملاحظات الطبيب</label>
                            <textarea 
                              rows={3}
                              placeholder="مثال: يرجى عمل تحليل السكر التراكمي ومؤشر الدهون ورسم قلب (ECG) لتدقيق الجرعات ومراجعتي لمطابقتها..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-teal-500"
                              value={newRxInstructions}
                              onChange={(e) => setNewRxInstructions(e.target.value)}
                            />
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="isDigitalSignedRx"
                              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={isDigitalSignedRx}
                              onChange={(e) => setIsDigitalSignedRx(e.target.checked)}
                            />
                            <label htmlFor="isDigitalSignedRx" className="text-xs text-slate-700 cursor-pointer font-sans font-bold select-none">
                              توقيع الوصفة إلكترونياً بختم الطبيب وتزويدها بكود SHA-256 للتحقق
                            </label>
                          </div>

                          <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-150 flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              id="isRxFreeReviewRequest"
                              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-0.5"
                              checked={isRxFreeReviewRequest}
                              onChange={(e) => setIsRxFreeReviewRequest(e.target.checked)}
                            />
                            <div>
                              <label htmlFor="isRxFreeReviewRequest" className="text-xs text-emerald-950 font-black cursor-pointer select-none block text-right">
                                🧬 طلب فحوصات وتفعيل مراجعة مجانية (إعفاء من الكشفية)
                              </label>
                              <span className="text-[10px] text-emerald-850 block mt-0.5 leading-normal text-right">
                                قم بتفعيل هذا الخيار عندما تطلب من المريض تحاليل أو تخطيط قلب أو غيرها، لتمكينه من العودة للدردشة مجاناً وإرسال نتائج الفحوصات دون دفع كشفية جديدة مجدداً.
                              </span>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className={`w-full text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 ${isRxSupplement ? 'bg-teal-600 hover:bg-teal-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                          >
                            {isRxSupplement ? 'صرف ونقل مكمل غذائي آلي للمستفيد' : 'صرف ونقل دواء علاجي آلي للمستفيد'}
                          </button>
                        </form>
                      </div>

                      {/* Add New User form */}
                      {currentUser.role === 'admin' && (
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 font-display">إضافة مستفيد / مستخدم جديد</h3>
                            <p className="text-slate-500 text-xs mt-0.5">تسجيل وريد المرضى أو الكوادر الطبية بالبوابات مباشرة</p>
                          </div>

                          <form onSubmit={handleAdminCreateUser} className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">اسم العميل / المستفيد الكامل</label>
                              <input 
                                type="text" required
                                placeholder="مثال: أحمد عبد الله الرويلي"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 font-sans"
                                value={adminNewName}
                                onChange={(e) => setAdminNewName(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">البريد الإلكتروني للولوج</label>
                              <input 
                                type="email" required
                                placeholder="ahmed.ruwaili@email.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 font-mono"
                                value={adminNewEmail}
                                onChange={(e) => setAdminNewEmail(e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">الصفة / الصلاحية</label>
                                <select 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-teal-500 font-sans"
                                  value={adminNewRole}
                                  onChange={(e) => setAdminNewRole(e.target.value as any)}
                                >
                                  <option value="patient">مستفيد (مريض)</option>
                                  <option value="doctor">طبيب معالج</option>
                                  <option value="admin">مدير نظام</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">باقة العضوية</label>
                                <select 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-teal-500 font-sans"
                                  value={adminNewSubscription}
                                  onChange={(e) => setAdminNewSubscription(e.target.value as any)}
                                >
                                  <option value="Basic">الرعاية الأساسية</option>
                                  <option value="Premium">الرعاية الذهبية Premium</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 font-sans">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">العمر (سنة)</label>
                                <input 
                                  type="number" required min="1" max="120"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-teal-500 font-mono"
                                  value={adminNewAge}
                                  onChange={(e) => setAdminNewAge(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">الوزن (كجم)</label>
                                <input 
                                  type="number" required min="20" max="250"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-teal-500 font-mono"
                                  value={adminNewWeight}
                                  onChange={(e) => setAdminNewWeight(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">الطول (سم)</label>
                                <input 
                                  type="number" required min="50" max="250"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-teal-500 font-mono"
                                  value={adminNewHeight}
                                  onChange={(e) => setAdminNewHeight(e.target.value)}
                                />
                              </div>
                            </div>

                            <div>
                              <span className="block text-xs font-bold text-slate-500 mb-2 font-display">الحالات الصحية المزمنة:</span>
                              <div className="flex flex-wrap gap-1.5 font-sans">
                                {[
                                  { id: 'diabetes', label: 'سكري' },
                                  { id: 'hypertension', label: 'ضغط الدم' },
                                  { id: 'obesity', label: 'السمنة وزيادة الوزن' }
                                ].map((cond) => {
                                  const selected = adminNewConditions.includes(cond.id);
                                  return (
                                    <button
                                      type="button"
                                      key={cond.id}
                                      onClick={() => toggleAdminCondition(cond.id)}
                                      className={`text-[10px] py-1.5 px-2.5 rounded-lg border font-medium transition ${
                                        selected ? 'bg-teal-600 text-white border-teal-600 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      {cond.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">ملاحظات ثانوية إضافية تخص المستخدم (اختياري)</label>
                              <textarea 
                                placeholder="مثال: حساسية معينة، تفاصيل الاتصال، أو تفضيلات المتابعة..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-teal-500 h-16 resize-none text-right font-sans"
                                value={adminNewNotes} onChange={(e) => setAdminNewNotes(e.target.value)}
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition transition duration-150 shadow-xs"
                            >
                              إنشاء الحساب وتفعيل الرعاية الطبية 💾
                            </button>
                          </form>
                        </div>
                      )}

                    </div>

                    {/* Users subscriber administration database simulator */}
                    {currentUser.role === 'admin' && (
                      <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 font-display">قاعدة بيانات المستفيدين وإدارة الاشتراكات</h3>
                            <p className="text-slate-500 text-xs mt-0.5">تفاصيل وسم المريض والحالات المسجلة بمدبلس</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-400">إجمالي الحسابات: {allUsers.length}</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                              <tr>
                                <th className="p-3">اسم المستفيد</th>
                                <th className="p-3">العمر/الوزن</th>
                                <th className="p-3">الحالات المزمنة</th>
                                <th className="p-3">الباقة للشهر</th>
                                <th className="p-3 text-center">الإجراءات والتحكم</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {allUsers.map((u) => (
                                <tr key={u.email} className="hover:bg-slate-50/50">
                                  <td className="p-3">
                                    <div className="font-bold text-slate-800">{u.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                                    {u.secondaryNotes && (
                                      <div className="text-[10px] bg-amber-50 text-amber-805 border border-amber-200/50 rounded-lg p-1.5 mt-1 leading-relaxed text-right">
                                        📝 <strong>ملاحظات التسجيل:</strong> {u.secondaryNotes}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 font-mono">{u.age} سنة / {u.weight} كجم</td>
                                  <td className="p-3">
                                    <div className="flex flex-wrap gap-1">
                                      {u.chronicConditions.length > 0 ? (
                                        u.chronicConditions.map((c) => (
                                          <span key={c} className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                            {c === 'diabetes' ? 'سكري' : c === 'hypertension' ? 'ضغط' : 'سمنة'}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-slate-400 italic">لا يوجد (سليم)</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                      u.subscriptionType === 'Premium' ? 'bg-indigo-100 text-indigo-800' :
                                      u.subscriptionType === 'Basic' ? 'bg-teal-100 text-teal-800' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {u.subscriptionType}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center justify-center gap-1">
                                      {/* Action button simulating medical status change/dispatch */}
                                      <button
                                        onClick={async () => {
                                          const res = await fetch('/api/delete-user', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email: u.email }),
                                          });
                                          if (res.ok) {
                                            showToast('تم شطب وإلغاء حساب المستفيد من لوحات الرعاية الطبية', 'info');
                                            fetchAllUsers();
                                          }
                                        }}
                                        title="حذف الحساب"
                                        className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Simulator of logistics shipping / pharmacy dispatch state dispatcher */}
                        <div className="pt-4 border-t border-slate-100 bg-indigo-50/20 p-4 rounded-xl border border-indigo-100/50">
                          <span className="text-xs font-bold text-indigo-900 block mb-2"> Dispatcher Simulator (دعم محاكاة الشحن السريع للنهدي/الدواء):</span>
                          <div className="flex flex-wrap gap-2">
                            {prescriptions.map((rx) => (
                              <div key={rx.id} className="bg-white border border-indigo-100 text-[10px] p-2 rounded-lg flex items-center justify-between gap-4 w-full md:w-auto md:max-w-xs">
                                <div>
                                  <strong className="text-slate-800 block">{rx.medicationName}</strong>
                                  <span className="text-slate-400 font-mono text-[9px]">الرقم: {rx.id}</span>
                                </div>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => handleUpdateShippingStatus(rx.id, 'Shipped')} 
                                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-1.5 py-1 rounded text-[9px]"
                                  >
                                    شحن
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateShippingStatus(rx.id, 'Out for Delivery')} 
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-1.5 py-1 rounded text-[9px]"
                                  >
                                    توصيل
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateShippingStatus(rx.id, 'Delivered')} 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-1.5 py-1 rounded text-[9px]"
                                  >
                                    تسليم
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* Dynamic Ad Banner Manager for Admin */}
                  <AdManager />

                </div>
              )}

            </main>

            {/* Sticky bottom disclaimer text */}
            <footer className="bg-slate-900 text-slate-400 py-6 px-10 border-t border-slate-800 text-center text-xs space-y-2 mt-auto">
              <p>منصة MedPulse للرعاية الطبية الذكية مكاملة بالكامل بالذكاء الاصطناعي وبوت الرد الصوتي VoIP وهاتف Twilio.</p>
              <p className="text-slate-500 text-[11px]">ملاحظة سريرية: الوجبات وتتبع السعرات والوصفات الطبية مسجلة وموثوقة بالاستناد إلى الأدلة الطبية.</p>
            </footer>

            {/* --- SUBSCRIPTION CHECKOUT PAYGATE MODAL (SIMULATION) --- */}
            {showCheckoutModal && (
              <div id="modal-checkout-backdrop" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 relative border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Close button */}
                  <button 
                    onClick={() => setShowCheckoutModal(null)}
                    className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-full"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {/* Header info */}
                  <div className="space-y-2 text-center">
                    <div className="h-10 w-10 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto text-teal-600">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 font-display">
                      تعديل باقة الاشتراك في MedPulse
                    </h3>
                    <p className="text-slate-400 text-xs">
                      أنت بصدد الاشتراك في باقة الرعاية الصحية {showCheckoutModal === 'Premium' ? 'الذهبية المتكاملة' : 'الفضية القياسية'}
                    </p>
                  </div>

                  {checkoutStep === 'plan' && (
                    <div className="space-y-4 pt-2">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-700 block text-sm">الباقة {showCheckoutModal === 'Premium' ? 'الذهبية والاتصال' : 'الفضية'}</span>
                          <span className="text-slate-400">تجدد تلقائياً كل شهر وتمنحك كل المميزات السريرية.</span>
                        </div>
                        <span className="font-bold text-teal-600 text-sm font-sans">{showCheckoutModal === 'Premium' ? '15,000 د.ع' : '5,000 د.ع'} / شهرياً</span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">تشمل هذه הבاقة:</span>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p className="flex items-center gap-2">✔ اقتراح فوري للسعرات الحرارية بدقة طبية عالية.</p>
                          <p className="flex items-center gap-2">✔ توصيات طبية مخصصة للضغط والسكري والسمنة.</p>
                          <p className="flex items-center gap-2">✔ دعم كامل للمكالمات الخارجية وبوت الرد الصوتي VoIP.</p>
                          <p className="flex items-center gap-2">✔ أولوية الصرف والتوصيل الفوري مع صيدلية بابل الكبرى.</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => setCheckoutStep('pay')}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>💳 الدفع الآمن بالبطاقة المصرفية</span>
                        </button>

                        <a
                          href={`https://wa.me/${whatsappSalesPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `السلام عليكم خدمة مبيعات مدبلس، أود تفعيل الباقة ${
                              showCheckoutModal === 'Premium' ? 'الذهبية المتكاملة (MedPulse Premium) بقيمة 15,000 دينار عراقي' : 'الفضية القياسية (MedPulse Basic) بقيمة 5,000 دينار عراقي'
                            } لحسابي المسجل باسم: ${currentUser.name} والبريد الإلكتروني: ${currentUser.email}. يرجى تفعيل حسابي يدوياً عبر الواتساب.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            showToast(`تم توجيهك لـ WhatsApp لتفعيل الباقة على الرقم ${whatsappSalesPhone}...`, 'success');
                            setShowCheckoutModal(null);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 text-center cursor-pointer"
                        >
                          <Phone className="w-4 h-4 text-emerald-100" />
                          <span>💬 تفعيل فوري مؤقت عبر WhatsApp (بديل Zain Cash)</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {checkoutStep === 'pay' && (
                    <div className="space-y-4 pt-2">
                      <div className="bg-slate-100 text-slate-800 text-[10px] py-1.5 px-3 rounded-lg border border-slate-200 text-center font-bold">
                        🔒 بوابة الدفع الآمن (محاكاة مصرف الرافدين العراقي الافتراضي)
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">رقم بطاقة الائتمان</label>
                        <input 
                          type="text" required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-teal-500 font-mono"
                          value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">تاريخ الانتهاء</label>
                          <input 
                            type="text" required
                            placeholder="MM/YY"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-teal-500 font-mono"
                            value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">رمز التحقق (CVV)</label>
                          <input 
                            type="password" required
                            maxLength={3}
                            placeholder="***"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-teal-500 font-mono"
                            value={cardCvv} onChange={(e) => setCardCvv(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleConfirmSubscriptionPayment}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-sm"
                      >
                        تأكيد ودفع قيمة الاشتراك
                      </button>
                    </div>
                  )}

                  {checkoutStep === 'success' && (
                    <div className="space-y-4 text-center py-4">
                      <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-lg animate-bounce">
                        ✔
                      </div>
                      <h4 className="font-bold text-lg text-slate-800">تم تفعيل الاشتراك الطبي بنجاح!</h4>
                      <p className="text-slate-500 text-xs">
                        تم ترقيتك بنجاح للباقة الفعالة بنجاح. سنرسل إليك الآن تفاصيل الفاتورة عبر البريد والنصية فورا.
                      </p>
                      <button
                        onClick={() => setShowCheckoutModal(null)}
                        className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs transition"
                      >
                        العودة للوحة الرئيسية
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        )
      )}

      {/* Interactive Prescription & Medication Direct Request Modal */}
      {selectedPharmacyForOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4" id="pharmacy-request-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 relative space-y-6 shadow-2xl border border-slate-100 animate-fade-in max-h-[90vh] overflow-y-auto">
            
            {/* Close button */}
            <button 
              onClick={() => setSelectedPharmacyForOrder(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-full cursor-pointer transition"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>

            {/* Header info */}
            <div className="space-y-2 text-center">
              <div className="h-10 w-10 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <span className="text-xl">💊</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-display">
                طلب صرف وتوصيل دواء فوري
              </h3>
              <p className="text-xs text-teal-600 font-bold bg-teal-50 px-3 py-1 rounded-full inline-block">
                🏥 من صيدلية: {selectedPharmacyForOrder.name}
              </p>
              {selectedPharmacyForOrder.address && (
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  📍 العنوان المعتمد: {selectedPharmacyForOrder.address}
                </p>
              )}
            </div>

            <form onSubmit={handleOrderFromPharmacy} className="space-y-4 pt-2 font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم العلاج أو الدواء المطلوب صرفه</label>
                <input 
                  type="text" required
                  placeholder="مثال: Glucophage 500mg أو جهاز قياس السكر"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 text-right"
                  value={orderMedName}
                  onChange={(e) => setOrderMedName(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1">يرجى كتابة الاسم التجاري أو العلمي بدقة لتجنب الأخطاء الصيدلانية</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الكمية المقررة</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-sans"
                    value={orderMedQty}
                    onChange={(e) => setOrderMedQty(e.target.value)}
                  >
                    <option value="علبة واحدة">علبة واحدة (صرف شهري)</option>
                    <option value="علبتين">علبتين (صرف شهرين)</option>
                    <option value="3 علب">3 علب (دورة علاجية كاملة)</option>
                    <option value="صرف مستمر">صرف مستمر (باقي الوصفة)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">رقم جوال المستلم للتأكيد</label>
                  <input 
                    type="text"
                    placeholder="مثال: 0501234567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-mono text-left"
                    defaultValue={currentUser?.email ? "0500000001" : "0501234567"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">عنوان التوصيل للتأكيد</label>
                <input 
                  type="text" required
                  placeholder="مثال: بغداد، شارع فلسطين، قرب مول النخيل"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 font-sans"
                  value={orderDeliveryAddress}
                  onChange={(e) => setOrderDeliveryAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">تعليمات إضافية للصيدلي ومندوب التوصيل</label>
                <textarea 
                  rows={2}
                  placeholder="مثال: يرجى الاتصال قبل الوصول، أو ترك الشحنة عند الباب للمحافظة على التبريد (للإنسولين)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-teal-500"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer"
                >
                  تأكيد وإرسال طلب الصرف الفوري 🚀
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPharmacyForOrder(null)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 text-[10px] text-slate-500 leading-relaxed text-right">
              📢 <strong>ملحوظة الرعاية الصحية:</strong> هذا الطلب يشغل نظام الربط الآلي (GPS Delivery Core) التابع لمنصة MedPulse. سيتم شحن ووصف العلاج خلال مدة أقصاها 45 دقيقة ليكون الدواء بين يديك.
            </div>

          </div>
        </div>
      )}

      {/* --- 4.10 Smart Keychain QR Login Modal --- */}
      {showKeychainModal && keychainUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-fade-in" id="keychain-modal-backdrop">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative space-y-6 shadow-2xl border border-slate-100 text-right animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button 
              onClick={() => {
                setShowKeychainModal(false);
                setKeychainUser(null);
              }}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full cursor-pointer transition"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>

            <div className="space-y-1.5 pr-2">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 justify-end">
                <span>ميدالية الدخول السريع الذكية 🔑</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                قم بطباعة هذا الباركود ولصقه على ميدالية المفاتيح لتسجيل الدخول السريع للمنصة فورا عن طريق توجيه كاميرا الموبايل دون كتابة أي بريد إلكتروني!
              </p>
            </div>

            {/* Simulated Physical Keychain Container */}
            <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl border border-slate-150/50">
              {/* Keychain loop holder */}
              <div className="flex flex-col items-center -space-y-1 mb-2">
                {/* Steel ring hoop */}
                <div className="w-10 h-10 rounded-full border-4 border-slate-400/80 bg-transparent shadow-xs"></div>
                {/* Steel connector hook */}
                <div className="w-2 h-4 bg-gradient-to-r from-slate-400 to-slate-300 rounded-b"></div>
              </div>

              {/* The Keychain Card itself (printable) */}
              <div 
                id="printable-keychain" 
                className="bg-gradient-to-b from-slate-900 to-slate-950 text-white w-72 rounded-[2rem] p-6 text-center space-y-4 shadow-xl border-4 border-slate-300 relative overflow-hidden"
              >
                {/* Background ambient lighting */}
                <div className="absolute inset-0 bg-radial-gradient from-teal-500/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>

                {/* MedPulse Brand Header */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-black tracking-widest text-[#008080] font-display">MEDPULSE</span>
                  <div className="h-5 w-5 bg-[#008080] rounded-lg flex items-center justify-center font-bold text-white text-[10px] font-display">
                    M
                  </div>
                </div>

                <div className="border-t border-slate-800/85 my-1"></div>

                {/* QR Code section */}
                <div className="bg-white p-3.5 rounded-2xl inline-block shadow-md">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${platformUrl}?magicLogin=${keychainUser.email}`)}`}
                    alt="Quick Login Barcode"
                    className="w-40 h-40 object-contain mx-auto"
                  />
                </div>

                {/* User info inside card */}
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-100">{keychainUser.name}</h4>
                  <p className="text-[10px] text-teal-400/90 font-mono select-all font-semibold break-all">{keychainUser.email}</p>
                  
                  {keychainUser.detail && (
                    <span className="text-[10px] text-slate-400 block">{keychainUser.detail}</span>
                  )}
                </div>

                {/* Role Badge */}
                <div className="pt-1">
                  <span className={`inline-block text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    keychainUser.role === 'admin' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    keychainUser.role === 'doctor' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {keychainUser.role === 'admin' ? '⚙️ مشرف النظام' : 
                     keychainUser.role === 'doctor' ? '🩺 طبيب مشرف معتمد' : '🚚 صيدلية شريكة'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions for Admin */}
            <div className="grid grid-cols-2 gap-3 font-sans">
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>🖨️ طباعة الميدالية الآن</span>
              </button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${platformUrl}?magicLogin=${keychainUser.email}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <span>📥 تحميل الباركود HD</span>
              </a>
            </div>

            <div className="bg-sky-50 text-sky-800 p-3 rounded-xl border border-sky-100 text-[10px] leading-relaxed">
              💡 <strong>كيف تعمل؟</strong> بمجرد توجيه كاميرا الهاتف من قبل الطبيب أو الصيدلية إلى هذا الباركود، سيتم نقله إلى الرابط وتفعيل الولوج الفوري بشكل آمن دون الحاجة لكتابة بريده الإلكتروني يدوياً!
            </div>
          </div>
        </div>
      )}

      {showLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" id="launch-modal-backdrop">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 relative space-y-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-250 max-h-[92vh] overflow-y-auto">
            
            {/* Close button */}
            <button 
              onClick={() => setShowLaunchModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full cursor-pointer transition"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>

            {/* Header branding */}
            <div className="text-center space-y-2">
              <div className="h-11 w-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-xl shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-display">
                الباركود وتثبيت MedPulse على شاشات الأجهزة 📱
              </h3>
              <p className="text-slate-500 text-xs max-w-md mx-auto">
                يمكنك الآن تشغيل وتنزيل التطبيق على أي شاشة (موبايل، تابلت، أو تلفزيون العيادة الذكي) ومراقبته بسهولة عبر بوابتك المفتوحة.
              </p>
            </div>

            {/* Tabs switcher inside modal */}
            <div className="flex border-b border-slate-100 pb-1">
              <button
                onClick={() => setActiveLaunchTab('qr')}
                className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition ${
                  activeLaunchTab === 'qr' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                📷 رمز الباركود وفتح التطبيق
              </button>
              <button
                onClick={() => setActiveLaunchTab('install')}
                className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition ${
                  activeLaunchTab === 'install' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                📲 تنزيل وتثبيت كبرنامج (PWA)
              </button>
              <button
                onClick={() => setActiveLaunchTab('simulator')}
                className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition ${
                  activeLaunchTab === 'simulator' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                🖥️ محاكي ملاءمة الشاشات المتعددة
              </button>
            </div>

            {/* Tab content 1: QR Code generator */}
            {activeLaunchTab === 'qr' && (
              <div className="space-y-5 py-2 text-right">
                <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-150 text-xs text-indigo-950 leading-relaxed">
                  💡 <strong>لتنزيل ونشر التطبيق بأمان:</strong> قم بمعاينة وتعديل <strong>رابط منصتك العام</strong> في الحقل أدناه قبل تحميل الباركود. مسح الباركود سيوجه المريض فوراً لفتح حالته ومراقبة مؤشراته الحيوية وبوت الاتصالات!
                </div>

                {/* Configuration of Platform URL with smart presets */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-indigo-700 font-extrabold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">📌 إعداد وتحديث الرابط المشفر في الباركود</span>
                    <span className="text-[9px] text-slate-400">مثالي للنشر والطباعة للعيادة</span>
                  </div>
                  
                  <input
                    type="text"
                    value={platformUrl}
                    onChange={(e) => setPlatformUrl(e.target.value)}
                    placeholder="https://your-domain.com"
                    className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs font-mono text-left text-slate-755 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-bold"
                  />

                  {/* Preset helpers */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPlatformUrl('https://ais-pre-bi6ebxu27ytej4bnnm2c5u-725546486101.europe-west2.run.app');
                        showToast('تم تعيين رابط النشر العام المشترك بنجاح! 🌐', 'success');
                      }}
                      className="text-[9px] bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition cursor-pointer font-bold"
                    >
                      🔗 تعيين رابط المنصة المشترك العام (الموصى به للهواتف)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlatformUrl(window.location.origin);
                        showToast('تم التراجع لرابط المتصفح الحالي! 🌍', 'success');
                      }}
                      className="text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer font-bold"
                    >
                      🔄 استخدام رابط المتصفح وعنوانه الحالي
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-150">
                  {/* QR Image */}
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 shrink-0 flex flex-col items-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(platformUrl)}`}
                      alt="MedPulse App Barcode QR"
                      className="w-[180px] h-[180px] object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-[9px] text-center text-slate-400 mt-2 font-mono max-w-[190px] truncate text-wrap" title={platformUrl}>
                      {platformUrl}
                    </div>
                  </div>

                  {/* QR Controls */}
                  <div className="flex-1 space-y-4 text-right w-full">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold leading-normal">الرابط المُمثل في الباركود حالياً:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="text" readOnly
                          className="flex-1 bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-mono text-left text-slate-600 select-all"
                          value={platformUrl} 
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(platformUrl);
                            showToast('تم نسخ الرابط المدرج بنجاح! 📋', 'success');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition text-xs flex items-center gap-1 font-sans cursor-pointer"
                          title="نسخ الرابط"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">نسخ</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(platformUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          showToast('جاري فتح صورة الباركود الطبية بجودة طباعة فائقة 📥 (انقر باليمين لحفظها كصورة)', 'success');
                        }}
                        className="w-full bg-[#128C7E] hover:bg-[#075E54] text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer text-center"
                      >
                        <Download className="w-3.5 h-3.5" />
                        تحميل الباركود كصورة لعرضه / طباعته للعيادة والمرضى 💾
                      </a>

                      <a
                        href={platformUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer text-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        فتح نسخة تصفح مستقلة جديدة في علامة تبويب أخرى 🌐
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab content 2: PWA detailed step documentation */}
            {activeLaunchTab === 'install' && (
              <div className="space-y-4 py-2 text-right font-sans">
                {/* Instant install prompt trigger if available */}
                {deferredPrompt ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-right">
                      <h4 className="font-bold text-sm text-emerald-800">✅ تثبيت وتنزيل مستقل فوري متاح لجهازك!</h4>
                      <p className="text-xs text-slate-600 leading-normal">
                        يتيح متصفحك الحالي إمكانية تحويل MedPulse إلى تطبيق جوال/مكتب أصيل ومراقبته دون الحاجة للدخول للمتصفح.
                      </p>
                    </div>
                    <button
                      onClick={handlePwaInstall}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shrink-0 transition flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      بث وتحميل التطبيق فوراً الآن
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed font-sans">
                    💡 <strong>خاصية التثبيت السحابي المستقل (PWA):</strong> لتنزيل تطبيق MedPulse على الشاشة والعمل به مثل أي برنامج أصيل على أي شاشة، اتبع التعليمات البسيطة أدناه حسب نوع نظام تشغيل شاشتك:
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* iOS / Safari instruction cards */}
                  <div className="bg-white border border-slate-150 p-4 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">أبل iOS / iPhone / iPad</span>
                      <Smartphone className="w-4 h-4 text-slate-500" />
                    </div>
                    <h4 className="font-bold text-xs text-slate-800">خطوات تشغيل وتثبيت سفاري (Safari):</h4>
                    <ol className="text-[11px] text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed pr-1">
                      <li>افتح الرابط الحالي في متصفح <strong>Safari</strong> الرسمي بالهاتف.</li>
                      <li>اضغط على أيقونة <strong>المشاركة (Share Button) 📤</strong> المتواجدة في شريط الأدوات بالأسفل.</li>
                      <li>قم بالتمرير للأسفل قليلاً لتعيين خيار <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.</li>
                      <li>قم بالضغط على <strong>"إضافة" (Add)</strong> في الزاوية العلوية اليمنى!</li>
                    </ol>
                    <div className="bg-sky-50 text-sky-800 text-[9px] p-2 rounded-lg leading-normal">
                      📌 ستحصل على أيقونة MedPulse أنيقة على شاشتك تعمل بشكل متكامل وكأنها برنامج تم تنزيله من الـ App Store!
                    </div>
                  </div>

                  {/* Android / Chrome Chrome instructions */}
                  <div className="bg-white border border-slate-150 p-4 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-md">أندرويد / شاشات ذكية / Chrome</span>
                      <Laptop className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h4 className="font-bold text-xs text-slate-800">خطوات أندرويد وكروم للكمبيوتر (Chrome):</h4>
                    <ol className="text-[11px] text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed pr-1">
                      <li>افتح الرابط الحالي في متصفح <strong>Google Chrome</strong> على الشاشة المعنية.</li>
                      <li>اضغط على أيقونة <strong>النقاط الثلاثة ⠇</strong> المجاورة لشريط البحث العلوي.</li>
                      <li>اختر من القائمة المنسدلة: <strong>"إضافة للشاشة الرئيسية" (Add to home screen)</strong> أو <strong>"تثبيت التطبيق" (Install application)</strong>.</li>
                      <li>قم بتأكيد مربع التنصيب بالكبس على زر <strong>تثبيت (Install)</strong>.</li>
                    </ol>
                    <div className="bg-emerald-50 text-emerald-800 text-[9px] p-2 rounded-lg leading-normal">
                      📌 سيقوم نظام Android بوضع أيقونة التطبيق على المنصة فوراً وتعميمه على أي شاشة مرتبطة بالهاتف!
                    </div>
                  </div>
                </div>

                {/* Auto-Update Engine Explanation Block */}
                <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-5 rounded-2xl border border-teal-850 space-y-3 mt-4 text-right">
                  <div className="flex items-center gap-2 justify-start flex-row-reverse">
                    <span className="text-lg">🔄</span>
                    <h4 className="font-extrabold text-sm text-teal-400">تقنية التحديث التلقائي المستمر دون إعادة تثبيت (PWA Auto-Update Engine)</h4>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    تعتمد منصة <strong>MedPulse</strong> على بنية برمجية سحابية متقدمة من نوع <strong>(Progressive Web App)</strong>. هذا يعني أنه بمجرد تثبيت التطبيق على جهازك أو جهاز السكرتارية أو الطبيب، فإن أي تحديثات نقوم بها للمنصة (مثل جداول الأطباء، تأجيل الجلسات، أو الوصفات الطبية) ستنعكس وتتحول تلقائياً على جهازك في الخلفية فور حدوثها!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-center space-y-1">
                      <span className="text-xs font-bold block text-emerald-400">⚡ تحديث فوري سحابي</span>
                      <p className="text-[9.5px] text-slate-400 leading-normal">لا داعي لتحميل أي ملفات APK أو حزم تحديث يدوية، التطبيق يحدث نفسه سحابياً.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-center space-y-1">
                      <span className="text-xs font-bold block text-emerald-400">💾 حفظ التفضيلات والملفات</span>
                      <p className="text-[9.5px] text-slate-400 leading-normal">يتم الحفاظ على تسجيل دخولك الدائم ومؤشراتك الحيوية والطبية حتى بعد تصفية الذاكرة.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-center space-y-1">
                      <span className="text-xs font-bold block text-emerald-400">🌐 أمان ومزامنة مشفرة</span>
                      <p className="text-[9.5px] text-slate-400 leading-normal">تشفير كامل لكافة الاتصالات والبيانات الطبية والوصفات الطبية المنقولة في الخلفية بأمان.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab content 3: Interactive Responsive preview simulation showing how layout handles screens */}
            {activeLaunchTab === 'simulator' && (
              <div className="space-y-4 py-2 text-right">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <div className="text-xs text-slate-500 pr-1 font-sans">
                    🔍 <strong>مستشعر دقة المظهر:</strong> غير وضع العرض أدناه لتجربة واختبار كيف تتوافق شاشات MedPulse الرقمية:
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-2xs border border-slate-100 font-sans">
                    <button
                      onClick={() => setSimulatedDevice('mobile')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        simulatedDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      📱 هاتف ذكي
                    </button>
                    <button
                      onClick={() => setSimulatedDevice('tablet')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        simulatedDevice === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      💼 جهاز لوحي
                    </button>
                    <button
                      onClick={() => setSimulatedDevice('desktop')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                        simulatedDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🖥️ حاسوب وشاشات عريضة
                    </button>
                  </div>
                </div>

                {/* Simulated frame viewport with beautiful schematic */}
                <div className="flex justify-center items-center py-6 bg-slate-900 rounded-3xl relative overflow-hidden h-[300px] shadow-inner select-none">
                  
                  {simulatedDevice === 'mobile' && (
                    <div className="w-[180px] h-[270px] bg-white border-[6px] border-slate-800 rounded-[30px] p-2 shadow-xl flex flex-col justify-between text-slate-800 animate-in zoom-in-95 duration-150">
                      <div className="h-2 w-12 bg-slate-800 rounded-full mx-auto my-0.5 mb-1.5"></div>
                      <div className="flex-1 rounded-xl bg-teal-50/50 p-1.5 text-[9px] text-center flex flex-col justify-center items-center gap-1.5 font-sans">
                        <Smartphone className="w-5 h-5 text-teal-600 text-center animate-bounce" />
                        <span className="font-bold text-teal-800">شاشة الجوال الذكي</span>
                        <p className="text-[8px] text-slate-500 leading-tight">شريط تنقل مخصص مريح، لوحة النبض الطبية، واتصالات WhatsApp سريعة ومبسطة بالكامل.</p>
                        <span className="bg-teal-600 text-white font-bold px-1.5 py-0.5 rounded-md text-[7px]" style={{ fontSize: '7px' }}>تصميم متجاوب 100%</span>
                      </div>
                      <div className="h-1.5 w-6 bg-slate-400 rounded-full mx-auto mt-1"></div>
                    </div>
                  )}

                  {simulatedDevice === 'tablet' && (
                    <div className="w-[300px] h-[230px] bg-white border-[8px] border-slate-800 rounded-[24px] p-3 shadow-xl flex flex-col justify-between text-slate-800 animate-in zoom-in-95 duration-150">
                      <div className="flex-1 rounded-xl bg-indigo-50 p-2 text-xs text-center flex flex-col justify-center items-center gap-1.5 font-sans">
                        <Laptop className="w-6 h-6 text-indigo-600 animate-pulse" />
                        <span className="font-bold text-indigo-950">شاشة الجهاز اللوحي - عيادات</span>
                        <p className="text-[10px] text-slate-600 leading-normal">تخطيط بانتو (Bento Layout) موسع، تتبع مؤشرات السكر والضغط جنباً إلى جنب مع الخرائط وبوت الرد VoIP المناسب ليد الطبيب.</p>
                      </div>
                    </div>
                  )}

                  {simulatedDevice === 'desktop' && (
                    <div className="w-[450px] h-[210px] bg-white border-[10px] border-slate-800 rounded-t-[16px] rounded-b-sm p-4 shadow-xl flex flex-col justify-between text-slate-800 animate-in zoom-in-95 duration-150 relative">
                      <div className="flex-1 rounded-xl bg-slate-50 border border-slate-150 p-2 text-center flex flex-col justify-center items-center gap-1 font-sans">
                        <Monitor className="w-7 h-7 text-slate-700" />
                        <span className="font-bold text-slate-800">شاشات العيادات الذكية / التلفزيون</span>
                        <p className="text-[10px] text-slate-500 max-w-sm leading-normal">
                          عرض متكامل لبوابة الإدارة الطبية، تتبع جغرافي حي للصيدليات والأطباء بمملكتنا وتخاطب فوري مشفر مع تدفق Twilio الصوتي على شاشة عريضة.
                        </p>
                      </div>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-700"></div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Bottom guide footer */}
            <div className="bg-slate-50 p-3 px-4 rounded-2xl border border-slate-150 flex items-center justify-between text-[11px] text-slate-500 font-sans">
              <span>🔒 تشفير سحابي معتمد (SSL SECURE)</span>
              <span>رابط البث: <strong className="font-mono text-indigo-600 select-all">{window.location.origin}</strong></span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowLaunchModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer text-center font-sans"
              >
                حسناً، فهمت الطريقة العودة للبوابة الصحية 👍
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📋 Official Digital Prescription Ticket / Wallet Modal */}
      {selectedRxForPrint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in text-right">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-150 overflow-hidden text-right font-sans">
            
            {/* Header branding */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 bg-teal-500 rounded-xl flex items-center justify-center text-slate-950 font-bold">
                  ⚕️
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white m-0">الوصفة الطبية الإلكترونية الرسمية</h3>
                  <p className="text-[10px] text-teal-400 font-mono m-0">MEDPULSE SECURE DIGITAL PRESCRIPTION</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRxForPrint(null)}
                className="text-slate-400 hover:text-white transition text-xs font-bold font-sans bg-slate-800 p-2 rounded-lg cursor-pointer border-0"
              >
                إغلاق ✕
              </button>
            </div>

            {/* Prescriptions printable body sheet */}
            <div className="p-6 md:p-8 space-y-6 bg-radial from-white to-slate-50/75 text-right">
              
              {/* Medical Clinic Seal Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start gap-3">
                <div className="text-right space-y-1">
                  <span className="text-xs uppercase font-bold text-slate-500 block leading-none">مستشفى ميدبلس الافتراضي التخصصي</span>
                  <strong className="text-base text-slate-900 block font-display">MedPulse Virtual Clinic Network</strong>
                  <span className="text-[9px] text-slate-400 block">منصة الرعاية الصحية المتكاملة وبرامج التوصيل الدوائي والسكري</span>
                </div>
                <div className="text-left font-mono text-[9px] text-slate-500 leading-tight">
                  <div>Ref Code: {selectedRxForPrint.id}</div>
                  <div>Date: {selectedRxForPrint.createdAt ? new Date(selectedRxForPrint.createdAt).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA')}</div>
                  <div>Clinic: السكري والغدد الصماء</div>
                </div>
              </div>

              {/* Patient Core File Info */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-teal-600 block">معلومات المستفيد / المريض</span>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الاسم الكامل:</span>
                    <strong className="text-slate-800 text-xs">{selectedRxForPrint.patientName || currentUser?.name || "المستفيد المسجل"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">البريد الإلكتروني للربط:</span>
                    <strong className="text-slate-800 text-xs font-mono">{selectedRxForPrint.patientEmail || currentUser?.email || "غير متوفر"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">الوزن الحالي للربط:</span>
                    <strong className="text-slate-800 text-xs font-mono">{currentUser?.weight || 85} كجم</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">التشخيص والمتابعة الدورية:</span>
                    <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                      متابعة مستوى السكر والضغط
                    </span>
                  </div>
                </div>
              </div>

              {/* Prescription Body Item Rx */}
              <div className="bg-teal-50/20 rounded-2xl p-5 border border-teal-100/50 space-y-4">
                
                {/* RX Symbolic Sign */}
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-teal-100">
                  <span className="text-2xl font-serif text-teal-800">℞</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${selectedRxForPrint.isSupplement ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                    {selectedRxForPrint.isSupplement ? 'مكمل غذائي وعلاجي مقترح' : 'دواء علاجي بجرعة محددة'}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-3 text-right">
                  {selectedRxForPrint.medicationName.includes('\n') ? (
                    <div className="space-y-3">
                      <span className="text-slate-400 text-[10px] block font-sans">قائمة الأدوية المعتمدة والجرعات المقررة:</span>
                      <div className="border border-slate-150 rounded-xl bg-white/70 overflow-hidden text-right leading-relaxed">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead>
                            <tr className="bg-slate-100/90 border-b border-slate-200 font-bold text-slate-700">
                              <th className="p-2.5 font-sans">الاسم العلمي والتجاري</th>
                              <th className="p-2.5 font-sans">💊 الجرعة وطريقة الاستعمال</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRxForPrint.medicationName.split('\n').filter(Boolean).map((med, idx) => {
                              const dsg = selectedRxForPrint.dosage.split('\n')[idx] || 'حسب الإرشادات المرفقة';
                              return (
                                <tr key={idx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                                  <td className="p-2.5 font-semibold text-slate-800">{med}</td>
                                  <td className="p-2.5 font-medium text-[#008080]">{dsg}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div>
                        <span className="text-slate-400 text-[10px] block font-sans">الصيدلية الموجهة للتسليم والتأمين:</span>
                        <strong className="text-sm text-slate-800 block font-sans">📍 {selectedRxForPrint.pharmacyName || 'بانتظار اختيار المستفيد للفروع'}</strong>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-slate-400 text-[10px] block">اسم الدواء والمستحضر المعتمد:</span>
                        <strong className="text-lg text-slate-900 block font-display">{selectedRxForPrint.medicationName}</strong>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-400 text-[10px] block">الجرعة المحددة:</span>
                          <strong className="text-sm text-indigo-700 block">{selectedRxForPrint.dosage}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">الصيدلية الموجهة للتسليم:</span>
                          <strong className="text-sm text-slate-800 block">{selectedRxForPrint.pharmacyName || 'صيدلية الشريك المعتمدة الكبرى'}</strong>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="p-3 bg-white border border-slate-100 rounded-xl">
                    <span className="text-slate-400 text-[10px] block">إرشادات الاستخدام الطبي السليم للمريض:</span>
                    <p className="text-xs text-slate-705 font-medium leading-relaxed mt-0.5 m-0 p-0">
                      {selectedRxForPrint.instructions || 'لا توجد ملاحظات أو توجيهات إضافية من الطبيب المعالج.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Diagnostic Digital Stamp Cryptography */}
              <div className="pt-2 border-t border-slate-150 flex items-center justify-between gap-4 text-xs">
                {/* Left signature */}
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[9px]">الطبيب المشرف المصرح:</span>
                  <strong className="text-slate-800 block">{selectedRxForPrint.doctorName || 'د. سمر الخالدي'}</strong>
                  <span className="text-[9px] bg-slate-150 text-slate-700 px-1.5 py-0.5 rounded font-bold inline-block leading-none">عضوية هيئة التخصصات ⚕️</span>
                  
                  {selectedRxForPrint.isDigitalSigned && (
                    <div className="mt-1 bg-emerald-50 text-emerald-800 font-mono text-[8px] p-1.5 rounded-lg border border-emerald-100 leading-normal select-all font-bold">
                      🛡️ SHA-256 SIGNED:<br />
                      {selectedRxForPrint.digitalSignatureHash || `MEDPULSE-SIG-${Math.floor(100000 + Math.random() * 900000)}-SHA256`}
                    </div>
                  )}
                </div>

                {/* Right stamp QR */}
                <div className="flex flex-col items-center gap-1 bg-slate-50 p-2 rounded-xl border border-slate-100 shrink-0 select-none">
                  <QrCode className="w-12 h-12 text-slate-800" />
                  <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-none">SCAN VERIFY</span>
                </div>
              </div>

            </div>

            {/* Modal actions trigger */}
            <div className="bg-slate-50 p-4 border-t border-slate-150 flex gap-3">
              <button
                onClick={() => {
                  window.print();
                  showToast('تم فتح أمر الطباعة، يُرجى حفظ ملف PDF الخاص ببلدك 🖨️', 'success');
                }}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center flex items-center justify-center gap-2 font-sans border-0"
              >
                <Download className="w-4 h-4" />
                <span>طباعة وتصدير الوصفة الطبية كـ PDF 🖨️</span>
              </button>
              <button
                onClick={() => setSelectedRxForPrint(null)}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                تراجع
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ⚠️ Trial Period Exceeded Modal */}
      {showTrialBlockedModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in text-right" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-amber-200 overflow-hidden font-sans p-6 space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex h-14 w-14 bg-amber-100 rounded-2xl items-center justify-center text-amber-600 text-3xl shadow-xs">
                ⚠️
              </div>
              <h3 className="text-xl font-black text-slate-800">انتهت الفترة التجريبية المجانية!</h3>
              <p className="text-slate-500 text-xs leading-normal">
                عذراً! لقد استنفدت محاولاتك الـ 3 المجانية للاستشارة عبر طبيب الذكاء الاصطناعي بنجاح.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed space-y-2 border border-slate-100">
              <p>
                منصة <strong className="text-teal-750">MedPulse</strong> تقدم لك بوابتك الطبية الكاملة والمصممة خصيصاً لمستفيدي السمنة والسكري والضغط في العراق:
              </p>
              <ul className="list-disc pr-4 space-y-1">
                <li>ربط مباشر مع نخبة من أخصائيي العراق الاستشاريين البشريين.</li>
                <li>تصدير روشتات طبية إلكترونية معتمدة بختم مشفر (SHA-256).</li>
                <li>ربط جغرافي وتوصيل فوري للدواء من كبرى الصيدليات الشريكة.</li>
                <li>متابعة مستمرة ومراقبة حيوية ذكية من الطبيب لنتائجك.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <a
                href={`https://wa.me/9647716662902?text=السلام%20عليكم%20منصة%20ميدبلس%20الطبية،%20لقد%20أتممت%20الفترة%20التجريبية%20وأود%20تفعيل%20اشتراكي%20الكامل%20وربطي%20مع%20طبيبي%20المستشار.%20(بريدي%20المسجل:%20${currentUser?.email || 'مستفيد%20تجريبي'})`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-teal-600 hover:bg-teal-750 text-white font-bold py-3 rounded-xl transition duration-150 shadow-sm cursor-pointer text-center text-xs flex items-center justify-center gap-2"
              >
                💬 تفعيل الاشتراك وربط طبيب العائلة عبر واتساب
              </a>
              <button
                onClick={() => {
                  setShowTrialBlockedModal(false);
                  logout();
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold py-3 rounded-xl transition duration-150 text-xs cursor-pointer border-0"
              >
                🚪 تسجيل الخروج والعودة لصفحة الدخول
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Doctor Edit Modal Overlay --- */}
      {editingDoctor && (
        <div id="edit-doctor-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col" dir="rtl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">تعديل الملف السريري للطبيب</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">معرف الحساب: {editingDoctor.id}</p>
              </div>
              <button 
                onClick={() => setEditingDoctor(null)}
                className="text-slate-400 hover:text-slate-600 h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateDoctor} className="p-6 space-y-4 flex-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">الاسم الكامل للطبيب</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500"
                  value={editingDoctor.name} 
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">البريد الإلكتروني للولوج</label>
                <input 
                  type="email" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 font-mono"
                  value={editingDoctor.email} 
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">التخصص الدقيق</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 text-right"
                  value={editingDoctor.specialty} 
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">المستشفى أو المركز الطبي المشرف</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500"
                  value={editingDoctor.hospital} 
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, hospital: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم هاتف التواصل (واتساب الطبي)</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 font-mono text-left"
                  value={editingDoctor.whatsappPhone || ''} 
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, whatsappPhone: e.target.value })}
                />
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-right">
                <label className="block text-[11px] font-bold text-slate-500">نوع الخدمة والفوترة</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDoctor({ ...editingDoctor, isPaid: false, consultationFee: 0 })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      !editingDoctor.isPaid
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>💚 مجانية تطوعية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDoctor({ ...editingDoctor, isPaid: true, consultationFee: editingDoctor.consultationFee || 20000 })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      editingDoctor.isPaid
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>💳 استشارة مدفوعة</span>
                  </button>
                </div>
              </div>

              {/* MedPulse operational edit params */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-right">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">قيمة الكشفية (د.ع)</label>
                  <input
                    type="number" required min="0" step="500"
                    disabled={!editingDoctor.isPaid}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-mono text-center ${!editingDoctor.isPaid ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    value={editingDoctor.consultationFee !== undefined ? editingDoctor.consultationFee : 0}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, consultationFee: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">مرضى اليوم الواحد</label>
                  <input
                    type="number" required min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-mono text-center text-slate-800"
                    value={editingDoctor.maxPatientsPerDay !== undefined ? editingDoctor.maxPatientsPerDay : 12}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, maxPatientsPerDay: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="text-right border-t border-slate-100 pt-3">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">نسبة استقطاع المنصة (%)</label>
                <input
                  type="number" required min="0" max="100"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-mono text-center text-slate-800"
                  value={editingDoctor.platformPercentage !== undefined ? editingDoctor.platformPercentage : 0}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, platformPercentage: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-3 text-right">
                <label className="block text-[11px] font-bold text-slate-500">ساعات الدوام وأوقات الاستشارات</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDoctor({ ...editingDoctor, availabilityType: '24/7' })}
                    className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                      editingDoctor.availabilityType === '24/7'
                        ? 'border-teal-500 bg-teal-50 text-teal-850'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    مفتوح 24/7
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDoctor({ ...editingDoctor, availabilityType: 'custom' })}
                    className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                      editingDoctor.availabilityType === 'custom'
                        ? 'border-teal-500 bg-teal-50 text-teal-850'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    مواعيد دوام مخصصة
                  </button>
                </div>

                {editingDoctor.availabilityType === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold mb-1">ساعة البدء</label>
                      <input
                        type="time"
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-center font-mono focus:outline-teal-500"
                        value={editingDoctor.startTime || '16:00'}
                        onChange={(e) => setEditingDoctor({ ...editingDoctor, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold mb-1">ساعة الانتهاء</label>
                      <input
                        type="time"
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-center font-mono focus:outline-teal-500"
                        value={editingDoctor.endTime || '21:00'}
                        onChange={(e) => setEditingDoctor({ ...editingDoctor, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Day Selector for Editing Doctor */}
              <div className="space-y-1.5 border-t border-slate-100 pt-3 text-right">
                <label className="block text-[11px] font-bold text-slate-500">أيام الدوام الأسبوعية:</label>
                <div className="flex flex-wrap gap-1 justify-start">
                  {["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day) => {
                    const currentDays = editingDoctor.workingDays || ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
                    const isSelected = currentDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          let nextDays;
                          if (isSelected) {
                            nextDays = currentDays.filter(d => d !== day);
                          } else {
                            nextDays = [...currentDays, day];
                          }
                          setEditingDoctor({ ...editingDoctor, workingDays: nextDays });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer font-sans ${
                          isSelected
                            ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {day.replace("السبت", "سبت").replace("الأحد", "أحد").replace("الاثنين", "اثنين").replace("الثلاثاء", "ثلاثاء").replace("الأربعاء", "أربعاء").replace("الخميس", "خميس").replace("الجمعة", "جمعة")}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  تأكيد التحديث وحفظ البيانات 💾
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  إلغاء ✕
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Pharmacy Edit Modal Overlay --- */}
      {editingPharmacy && (
        <div id="edit-pharmacy-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col" dir="rtl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">تعديل بيانات الصيدلية الشريكة</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">معرف الصيدلية: {editingPharmacy.id}</p>
              </div>
              <button 
                onClick={() => setEditingPharmacy(null)}
                className="text-slate-400 hover:text-slate-600 h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePharmacy} className="p-6 space-y-4 flex-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">اسم الصيدلية الرسمي</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500"
                  value={editingPharmacy.name} 
                  onChange={(e) => setEditingPharmacy({ ...editingPharmacy, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">المحافظة و الحي أو المنطقة الجغرافية</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500"
                  value={editingPharmacy.district} 
                  onChange={(e) => setEditingPharmacy({ ...editingPharmacy, district: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">خط العرض (Lat)</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-mono"
                    value={editingPharmacy.lat} 
                    onChange={(e) => setEditingPharmacy({ ...editingPharmacy, lat: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">خط الطول (Lng)</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-mono"
                    value={editingPharmacy.lng} 
                    onChange={(e) => setEditingPharmacy({ ...editingPharmacy, lng: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">العنوان أو الحي التفصيلي</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500"
                  value={editingPharmacy.address || ''} 
                  onChange={(e) => setEditingPharmacy({ ...editingPharmacy, address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم هاتف الصيدلية</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-teal-500 font-mono text-left"
                  value={editingPharmacy.phone} 
                  onChange={(e) => setEditingPharmacy({ ...editingPharmacy, phone: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  تأكيد التحديث وحفظ البيانات 💾
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPharmacy(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  إلغاء ✕
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
