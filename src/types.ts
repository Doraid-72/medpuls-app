export type SubscriptionType = 'Free' | 'Basic' | 'Premium';

export interface Prescription {
  id: string;
  doctorName: string;
  medicationName: string;
  dosage: string;
  instructions: string;
  pharmacyId: string;
  pharmacyName: string;
  deliveryStatus: 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered';
  deliveryEstimatedDate: string;
  createdAt: string;
  isSupplement?: boolean; // Toggles whether it is a dietary supplement or regular medication
  patientName?: string;
  patientEmail?: string;
  isDigitalSigned?: boolean;
  digitalSignatureHash?: string;
  sourceType?: 'Doctor' | 'AI';
}

export interface UserHealthProfile {
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  age: number;
  weight: number; // in kg
  height: number; // in cm
  chronicConditions: ('diabetes' | 'hypertension' | 'obesity')[];
  subscriptionType: SubscriptionType;
  additionalMeds: string[];
  targetWeight: number;
  dailyCalorieBudget: number;
  secondaryNotes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface UploadedFile {
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

export interface SupplementRec {
  name: string;
  purpose: string;
  dosage: string;
  whySuitable: string;
}

export interface DietPlan {
  dailyCalories: number;
  macroRatio: {
    carbs: number;
    protein: number;
    fat: number;
  };
  advice: string;
  recipes: RecipeRecommendation[];
  supplements?: SupplementRec[];
}

export interface RecipeRecommendation {
  title: string;
  prepTime: string;
  calories: number;
  ingredients: string[];
  instructions: string[];
  whySuitable: string;
}

export interface TwilioConfig {
  phoneNumber: string;
  accountSid: string;
  authToken: string;
  webhookUrl: string;
  isCallbotActive: boolean;
}

export interface DoctorInfo {
  id: string;
  name: string;
  email: string;
  specialty: string;
  hospital: string;
  rating: number;
  whatsappPhone?: string;
  isPaid?: boolean;           // True for paid consultation (fee is required), False for free/voluntary care
  availabilityType?: '24/7' | 'custom'; // '24/7' or 'custom'
  startTime?: string;         // e.g. "16:00"
  endTime?: string;           // e.g. "21:00"
  workingDays?: string[];     // Working days in Arabic, e.g. ["الأحد", "الاثنين", "الثلاثاء"]
  consultationFee?: number;   // Doctor's consultation fee
  maxPatientsPerDay?: number; // Max patients the doctor can receive per day
  platformPercentage?: number; // Platform commission/cut rate (percentage %)
}

export interface PharmacyInfo {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  phone: string;
  address?: string;
}

