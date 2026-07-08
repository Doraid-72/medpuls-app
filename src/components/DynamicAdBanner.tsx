import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Volume2, Phone, MapPin, Plus, Trash, CheckCircle, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { DoctorInfo, PharmacyInfo } from '../types';

export interface Advertisement {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  badge: 'طبيب' | 'صيدلية' | 'مكمل غذائي' | 'مختبر' | 'عيادة ورشاقة' | 'إعلان عام';
  phoneOrLink?: string;
  address?: string;
  specs?: string[];
  image1?: string; // base64 or URL
  image2?: string; // base64 or URL
  image1Width?: number; // percentage (20 to 100)
  image2Width?: number; // percentage (20 to 100)
  image1Height?: number; // px (50 to 250)
  image2Height?: number; // px (50 to 250)
  imageFit?: 'contain' | 'cover';
  bgColor?: string; // e.g. from-teal-500 to-emerald-600 or CSS linear-gradient
  textColor?: string; // text color class
}

// Helper to resolve highly vivid, high-contrast gradients for maximum clarity and vibrancy
export function getBannerGradientStyle(bgColor: string | undefined): string {
  if (!bgColor) {
    return 'linear-gradient(135deg, #0f9f90 0%, #0b7a6e 60%, #044b43 100%)';
  }

  // Already a direct CSS linear-gradient or hex color
  if (bgColor.startsWith('linear-gradient') || bgColor.startsWith('rgba') || bgColor.startsWith('#')) {
    return bgColor;
  }

  // Safely translate legacy or fallback tailwind gradient classes into extremely brilliant high-contrast gradients
  const bg = bgColor.toLowerCase();
  if (bg.includes('emerald') || bg.includes('teal')) {
    return 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)'; // Luminous Royal Emerald
  }
  if (bg.includes('indigo') || bg.includes('slate-900')) {
    return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e3a8a 100%)'; // Brilliant Sapphire Royal Blue
  }
  if (bg.includes('cyan') || bg.includes('slate-950') || bg.includes('blue')) {
    return 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #155e75 100%)'; // Bright High-Contrast Ocean Cyan
  }
  if (bg.includes('rose') || bg.includes('red')) {
    return 'linear-gradient(135deg, #f43f5e 0%, #be123c 50%, #881337 100%)'; // Vibrant Crimson Red
  }
  if (bg.includes('amber') || bg.includes('orange') || bg.includes('slate-950')) {
    return 'linear-gradient(135deg, #ea580c 0%, #c2410c 50%, #7c2d12 100%)'; // Rich Sunset Orange / Luxury Amber
  }

  // default fallback is a magnificent, bright deep teal gradient
  return 'linear-gradient(135deg, #0f9f90 0%, #0b7a6e 60%, #044b43 100%)';
}

const DEFAULT_ADS: Advertisement[] = [];

interface DynamicAdBannerProps {
  currentUser: any | null;
  doctors?: DoctorInfo[];
  pharmacies?: PharmacyInfo[];
  onNavigateToTab?: (tab: 'dashboard' | 'nutrition' | 'voip' | 'chatbot' | 'partners' | 'admin' | 'archive') => void;
}

export default function DynamicAdBanner({ currentUser, doctors = [], pharmacies = [], onNavigateToTab }: DynamicAdBannerProps) {
  const [ads, setAds] = useState<Advertisement[]>(() => {
    try {
      const stored = localStorage.getItem('medpulse_ads');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_ADS;
  });

  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('medpulse_ads_enabled');
      return stored !== 'false'; // Enabled by default
    } catch (e) {
      return true;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-generate ads based on registered doctors & pharmacies, merging with custom ads
  const combinedAds = useMemo(() => {
    const autoAds: Advertisement[] = [];

    // 1. Doctors auto-ads
    doctors.forEach((doc) => {
      autoAds.push({
        id: `auto_doc_${doc.id}`,
        title: `العيادة الاستشارية: د. ${doc.name}`,
        subtitle: `أخصائي ${doc.specialty} • متاح للاستشارة الطبية بالمنصة ⚕️`,
        description: `تواصل مباشرة مع الدكتور عبر مكالمة صوتية أو مرئية بالمنصة لتشخيص حالتك بدقة، والحصول على نصائح علاجية متكاملة، وإصدار وصفاتك الطبية المعتمدة رقمياً في الحال.`,
        badge: 'طبيب',
        phoneOrLink: undefined, // HIDE private phone number of doctor (حجب رقم الهاتف للطبيب العامل في المنصة)
        address: doc.hospital || 'مركز الاستشارات الطبي الرقمي بالمنصة',
        specs: [
          `⭐ التقييم: ${doc.rating || '5.0'}`,
          doc.isPaid ? `كشفية الاستشارة: ${(doc.consultationFee || 20000).toLocaleString()} د.ع` : 'استشارة طوعية مجانية 💚',
          `🩺 كادر المنصة المعتمد`
        ],
        bgColor: 'linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #115e59 100%)', // Vibrant Teal
        imageFit: 'contain'
      });
    });

    // 2. Pharmacies auto-ads
    pharmacies.forEach((ph) => {
      autoAds.push({
        id: `auto_ph_${ph.id}`,
        title: `صيدلية ${ph.name}`,
        subtitle: `الربط الآلي وصرف الأدوية الفوري بالمنصة 💊`,
        description: `شريك معتمد لصرف وتوصيل الوصفات الطبية والمكملات الغذائية المسجلة بالمنصة. التجهيز مباشر والتوصيل آمن وسريع وبأسعار وزارة الصحة الرسمية.`,
        badge: 'صيدلية',
        phoneOrLink: ph.phone, // Pharmacy phone is kept public so patients can order!
        address: ph.district + (ph.address ? ` - ${ph.address}` : ''),
        specs: [
          '🚗 خدمة توصيل منزلي سريعة',
          '💊 أدوية معتمدة وأصلية 100%',
          '📝 صرف تلقائي للوصفات الرقمية'
        ],
        bgColor: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #1e3a8a 100%)', // Rich Royal Sapphire Blue
        imageFit: 'contain'
      });
    });

    return [...ads, ...autoAds];
  }, [ads, doctors, pharmacies]);

  // Sync state with localStorage and custom window event to respond to Admin Panel modifications
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('medpulse_ads');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setAds(parsed);
        }
        const storedEnabled = localStorage.getItem('medpulse_ads_enabled');
        setIsEnabled(storedEnabled !== 'false');
      } catch (e) {}
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('medpulse_ads_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('medpulse_ads_updated', handleUpdate);
    };
  }, []);

  // Automatic slide rotation
  useEffect(() => {
    if (!isEnabled || combinedAds.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % combinedAds.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [combinedAds.length, isEnabled, isPaused]);

  if (!isEnabled || combinedAds.length === 0) return null;

  // Protect index overflow
  const safeIndex = currentIndex >= combinedAds.length ? 0 : currentIndex;
  const currentAd = combinedAds[safeIndex] || combinedAds[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % combinedAds.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + combinedAds.length) % combinedAds.length);
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'طبيب':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'صيدلية':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'مكمل غذائي':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'مختبر':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'عيادة ورشاقة':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div 
      className="relative overflow-hidden rounded-3xl text-white shadow-xl transition-all duration-700 ease-in-out border border-white/10"
      style={{ 
        backgroundImage: getBannerGradientStyle(currentAd.bgColor) 
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      id="medpulse-dynamic-ads-banner"
    >
      {/* Decorative premium element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

      {/* Grid Content */}
      <div className="p-6 md:p-8 flex flex-col lg:flex-row items-center gap-6 md:gap-8 justify-between relative z-10">
        
        {/* Left Side: Dynamic/Uploaded Images (Supports 1 or 2 images with custom sizing) */}
        <div className="flex flex-wrap items-center justify-center gap-4 shrink-0 w-full lg:w-auto order-last lg:order-first">
          {/* Image 1 */}
          {currentAd.image1 ? (
            <div 
              className="relative rounded-2xl overflow-hidden bg-black/10 border border-white/10 flex items-center justify-center shadow-xs"
              style={{ 
                width: `${currentAd.image1Width || 80}px`, 
                height: `${currentAd.image1Height || 120}px` 
              }}
            >
              <img 
                src={currentAd.image1} 
                alt="Ad Asset 1" 
                className={`w-full h-full object-${currentAd.imageFit || 'contain'}`}
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            // Exquisite high-end clinical vector placeholder if no custom image is loaded
            <div 
              className="bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-3 text-center text-white/50 shrink-0 shadow-inner"
              style={{ 
                width: '100px', 
                height: '100px' 
              }}
            >
              {currentAd.badge === 'طبيب' && <span className="text-3xl">🥼</span>}
              {currentAd.badge === 'مكمل غذائي' && <span className="text-3xl">💊</span>}
              {currentAd.badge === 'مختبر' && <span className="text-3xl">🔬</span>}
              {currentAd.badge === 'صيدلية' && <span className="text-3xl">🏥</span>}
              {currentAd.badge === 'عيادة ورشاقة' && <span className="text-3xl">🏋️</span>}
              {!['طبيب', 'مكمل غذائي', 'مختبر', 'صيدلية', 'عيادة ورشاقة'].includes(currentAd.badge) && <span className="text-3xl">📢</span>}
              <span className="text-[8px] mt-1 font-bold block uppercase text-teal-300">MedPulse Partner</span>
            </div>
          )}

          {/* Image 2 (Optional secondary image) */}
          {currentAd.image2 && (
            <div 
              className="relative rounded-2xl overflow-hidden bg-black/10 border border-white/10 flex items-center justify-center shadow-xs"
              style={{ 
                width: `${currentAd.image2Width || 80}px`, 
                height: `${currentAd.image2Height || 120}px` 
              }}
            >
              <img 
                src={currentAd.image2} 
                alt="Ad Asset 2" 
                className={`w-full h-full object-${currentAd.imageFit || 'contain'}`}
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        {/* Right Side: Advertisement text metadata */}
        <div className="flex-1 text-right space-y-3 w-full">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-[9px] bg-white/10 text-teal-200 border border-white/10 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-teal-300" />
              منصة مدبلس الإعلانية المرخصة
            </span>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getBadgeColor(currentAd.badge)}`}>
              {currentAd.badge}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-black font-display text-white leading-tight">
              {currentAd.title}
            </h3>
            {currentAd.subtitle && (
              <p className="text-xs md:text-sm text-teal-300 font-extrabold font-sans">
                {currentAd.subtitle}
              </p>
            )}
          </div>

          <p className="text-xs text-slate-200/90 leading-relaxed font-sans max-w-3xl ml-auto">
            {currentAd.description}
          </p>

          {/* Specifications list */}
          {currentAd.specs && currentAd.specs.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-end pt-1">
              {currentAd.specs.map((spec, sIdx) => (
                <span key={sIdx} className="text-[10px] bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-slate-200 flex items-center gap-1 font-medium">
                  <span className="w-1 h-1 bg-teal-400 rounded-full" />
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* Footer of the banner: address and contact button */}
          {/* Footer of the banner: address and contact button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/15">
            {currentAd.id?.startsWith('auto_doc_') ? (
              <button
                onClick={() => {
                  if (onNavigateToTab) {
                    onNavigateToTab('voip');
                  }
                }}
                className="bg-teal-500 hover:bg-teal-400 text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition flex items-center gap-1.5 border border-teal-400/30 shadow-lg cursor-pointer hover:scale-105 transform active:scale-95 duration-150"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>اتصل أو احجز استشارة فورية بالمنصة ⚕️</span>
              </button>
            ) : currentAd.phoneOrLink ? (
              <a
                href={currentAd.phoneOrLink.startsWith('http') ? currentAd.phoneOrLink : `https://wa.me/${currentAd.phoneOrLink.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white text-white hover:text-slate-900 font-extrabold text-[11px] px-4 py-2 rounded-xl transition flex items-center gap-1.5 border border-white/10 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>تواصل أو احجز الخدمة 📱</span>
              </a>
            ) : null}

            {currentAd.address && (
              <div className="flex items-center gap-1 text-slate-300 text-right">
                <span className="text-[10px] font-semibold leading-none">{currentAd.address}</span>
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Slide Navigator and Paginators (Shown only if ads count > 1) */}
      {combinedAds.length > 1 && (
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 z-20 bg-black/25 px-2.5 py-1 rounded-full border border-white/5">
          <button 
            onClick={handlePrev}
            className="text-white/60 hover:text-white hover:bg-white/10 p-0.5 rounded-full transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex gap-1">
            {combinedAds.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-teal-400' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="text-white/60 hover:text-white hover:bg-white/10 p-0.5 rounded-full transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden banner counter for professional touch */}
      <span className="absolute top-4 left-4 font-mono text-[9px] text-white/30 font-bold">
        AD {currentIndex + 1} / {combinedAds.length}
      </span>

    </div>
  );
}
