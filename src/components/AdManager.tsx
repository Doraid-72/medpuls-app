import React, { useState, useEffect } from 'react';
import { Advertisement, getBannerGradientStyle } from './DynamicAdBanner';
import { ToggleRight, ToggleLeft, Plus, Trash2, Edit, CheckCircle, Image as ImageIcon, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';

const DEFAULT_GRADIENTS = [
  { name: '🟢 زمردي ملكي مشرق', value: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)' },
  { name: '🔵 ياقوتي أزرق ملكي', value: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e3a8a 100%)' },
  { name: '🟣 بنفسجي متوهج مبهج', value: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #4c1d95 100%)' },
  { name: '🔴 ياقوتي وردي قرمزي', value: 'linear-gradient(135deg, #f43f5e 0%, #be123c 50%, #881337 100%)' },
  { name: '🟡 ذهبي كلاسيكي ملكي', value: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)' },
  { name: '🟠 برتقالي غروب مشرق', value: 'linear-gradient(135deg, #ea580c 0%, #c2410c 50%, #7c2d12 100%)' }
];

const PRESET_DEFAULT_ADS: Advertisement[] = [];

export default function AdManager() {
  const [ads, setAds] = useState<Advertisement[]>(() => {
    try {
      const stored = localStorage.getItem('medpulse_ads');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return PRESET_DEFAULT_ADS;
  });

  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('medpulse_ads_enabled');
      return stored !== 'false';
    } catch (e) {
      return true;
    }
  });

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState<Advertisement['badge']>('طبيب');
  const [phoneOrLink, setPhoneOrLink] = useState('');
  const [address, setAddress] = useState('');
  const [specsInput, setSpecsInput] = useState('');
  const [bgColor, setBgColor] = useState('linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)');
  const [imageFit, setImageFit] = useState<'contain' | 'cover'>('contain');

  // Custom sizes
  const [image1, setImage1] = useState<string | undefined>(undefined);
  const [image2, setImage2] = useState<string | undefined>(undefined);
  const [image1Width, setImage1Width] = useState(80);
  const [image1Height, setImage1Height] = useState(120);
  const [image2Width, setImage2Width] = useState(80);
  const [image2Height, setImage2Height] = useState(120);

  // Success state feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync with localStorage
  const saveState = (updatedAds: Advertisement[], enabled: boolean) => {
    localStorage.setItem('medpulse_ads', JSON.stringify(updatedAds));
    localStorage.setItem('medpulse_ads_enabled', String(enabled));
    // Dispatch event for reactive updates in other components
    window.dispatchEvent(new Event('medpulse_ads_updated'));
  };

  const handleToggleSystem = () => {
    const nextEnabled = !isEnabled;
    setIsEnabled(nextEnabled);
    saveState(ads, nextEnabled);
    showFeedback(nextEnabled ? 'تم تفعيل نظام الإعلانات والشركاء بنجاح 🟢' : 'تم إيقاف وحذف نظام الإعلانات من صفحات المرضى بالكامل 🔴');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageNum: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً! يرجى اختيار صورة أقل من 2 ميغابايت لضمان سرعة التحميل.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (imageNum === 1) {
          setImage1(reader.result as string);
        } else {
          setImage2(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert('يرجى كتابة عنوان الإعلان والوصف على الأقل.');
      return;
    }

    const parsedSpecs = specsInput
      ? specsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    let updatedAds: Advertisement[];

    if (editingId) {
      // Edit existing
      updatedAds = ads.map(ad => {
        if (ad.id === editingId) {
          return {
            ...ad,
            title,
            subtitle: subtitle || undefined,
            description,
            badge,
            phoneOrLink: phoneOrLink || undefined,
            address: address || undefined,
            specs: parsedSpecs,
            bgColor,
            imageFit,
            image1: image1 || ad.image1,
            image2: image2 || ad.image2,
            image1Width,
            image1Height,
            image2Width,
            image2Height
          };
        }
        return ad;
      });
      showFeedback('تم تحديث الإعلان وحفظ التعديلات بنجاح! ⚕️');
    } else {
      // Add new
      const newAd: Advertisement = {
        id: 'ad_' + Date.now(),
        title,
        subtitle: subtitle || undefined,
        description,
        badge,
        phoneOrLink: phoneOrLink || undefined,
        address: address || undefined,
        specs: parsedSpecs,
        bgColor,
        imageFit,
        image1,
        image2,
        image1Width,
        image1Height,
        image2Width,
        image2Height
      };
      updatedAds = [...ads, newAd];
      showFeedback('تم إضافة إعلان الشريك الجديد لشبكة البنرات الدوارة! 📢');
    }

    setAds(updatedAds);
    saveState(updatedAds, isEnabled);
    resetForm();
  };

  const handleDeleteAd = (id: string) => {
    const updatedAds = ads.filter(ad => ad.id !== id);
    setAds(updatedAds);
    saveState(updatedAds, isEnabled);
    showFeedback('تم حذف إعلان الشريك من النظام نهائياً 🗑️');
  };

  const handleEditAd = (ad: Advertisement) => {
    setEditingId(ad.id);
    setTitle(ad.title);
    setSubtitle(ad.subtitle || '');
    setDescription(ad.description);
    setBadge(ad.badge);
    setPhoneOrLink(ad.phoneOrLink || '');
    setAddress(ad.address || '');
    setSpecsInput(ad.specs ? ad.specs.join(', ') : '');
    setBgColor(ad.bgColor || 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)');
    setImageFit(ad.imageFit || 'contain');
    setImage1(ad.image1);
    setImage2(ad.image2);
    setImage1Width(ad.image1Width || 80);
    setImage1Height(ad.image1Height || 120);
    setImage2Width(ad.image2Width || 80);
    setImage2Height(ad.image2Height || 120);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setDescription('');
    setBadge('طبيب');
    setPhoneOrLink('');
    setAddress('');
    setSpecsInput('');
    setBgColor('linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)');
    setImageFit('contain');
    setImage1(undefined);
    setImage2(undefined);
    setImage1Width(80);
    setImage1Height(120);
    setImage2Width(80);
    setImage2Height(120);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6" id="partners-ads-admin-console">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white font-bold text-xs py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-800 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Toggle System (Safety features!) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="text-right space-y-1">
          <h3 className="text-lg font-bold text-slate-800 font-display flex items-center justify-end gap-1.5">
            <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
            نظام إدارة البنرات الدوارة للشركاء والإعلانات
          </h3>
          <p className="text-slate-550 text-xs">
            تحكّم بشكل كامل بظهور الإعلانات والمواصفات والصور ومقاساتها في صفحات المستفيدين.
          </p>
        </div>

        {/* Master Control switch to turn off ALL ads instantly! */}
        <div className="bg-slate-50/80 border border-slate-150 p-3 rounded-2xl flex items-center gap-4 shrink-0 w-full md:w-auto justify-between">
          <div className="text-right">
            <span className="block text-xs font-black text-slate-800">حالة النظام الكلي:</span>
            <span className={`text-[10px] font-bold ${isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isEnabled ? '● نشط ويظهر للمستفيدين' : '○ متوقف ومخفي تماماً'}
            </span>
          </div>
          <button 
            type="button"
            onClick={handleToggleSystem}
            className="focus:outline-none cursor-pointer"
          >
            {isEnabled ? (
              <ToggleRight className="w-12 h-8 text-teal-600" />
            ) : (
              <ToggleLeft className="w-12 h-8 text-slate-350" />
            )}
          </button>
        </div>
      </div>

      <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-right text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <strong>💡 ميزة الإزالة الفورية (تلبية لطلبك الكريم):</strong> إذا شعرت أن المنصة تحولت إلى طابع إعلاني ولا ترغب في ذلك، يمكنك ببساطة إيقاف تشغيل <strong>"حالة النظام الكلي"</strong> أعلاه. سيقوم النظام فوراً بإلغاء إخراج البنرات من كافة لوحات المرضى لتعود المنصة طبية وبسيطة 100%.
        </div>
      </div>

      {/* Grid: Editor Form and Current Ads List */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pt-2">
        
        {/* Left Column: Form to create/edit ads */}
        <div className="xl:col-span-7 bg-slate-50/45 border border-slate-150/60 p-5 rounded-2xl space-y-4 text-right">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <span className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-lg font-bold">
              {editingId ? '✍️ تعديل إعلان شريك حالي' : '➕ إضافة شريك/إعلان جديد للبنرات الدوارة'}
            </span>
            {editingId && (
              <button 
                onClick={resetForm}
                className="text-[10px] text-slate-500 hover:text-slate-800 underline font-semibold"
              >
                إلغاء التعديل والرجوع للإضافة
              </button>
            )}
          </div>

          <form onSubmit={handleSaveAd} className="space-y-4">
            
            {/* Category badge */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(['طبيب', 'صيدلية', 'مكمل غذائي', 'مختبر', 'عيادة ورشاقة', 'إعلان عام'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBadge(b)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all duration-150 ${badge === b ? 'bg-teal-650 border-teal-650 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Title & Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم الشريك أو عنوان الإعلان الرئيسي *</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: مختبر بابل التحليلي المتكامل"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-semibold"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">العنوان الفرعي أو اسم الخدمة/المنتج</label>
                <input 
                  type="text"
                  placeholder="مثال: خصومات حصرية لمرضى السكري والضغط"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">شرح تفصيلي للخدمة أو مبررات الإعلان ووصف المنتج *</label>
              <textarea 
                rows={2}
                required
                placeholder="اكتب تفاصيل إعلانك هنا ليقرأها المرضى بشكل منسق وجذاب..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-sans"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Address & Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">العنوان الفعلي (للعيادات والمختبرات والصيدليات)</label>
                <input 
                  type="text"
                  placeholder="مثال: بغداد - شارع فلسطين - قرب ساحة بيروت"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-sans"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">المميزات والمواصفات (افصل بينها بفارزة ",")</label>
                <input 
                  type="text"
                  placeholder="مثال: خصم 30%, كادر ألماني متخصص, سحب دم منزلي"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-sans"
                  value={specsInput}
                  onChange={(e) => setSpecsInput(e.target.value)}
                />
              </div>
            </div>

            {/* Contact details & Bg Color */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم الهاتف للطلب أو رابط الواتساب المباشر</label>
                <input 
                  type="text"
                  placeholder="مثال: 07700000000 أو رابط موقع"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-sans"
                  value={phoneOrLink}
                  onChange={(e) => setPhoneOrLink(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">تدرج اللون والسمة البصرية للبنر</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-teal-500 font-sans font-bold"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                >
                  {DEFAULT_GRADIENTS.map((grad) => (
                    <option key={grad.value} value={grad.value}>{grad.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Sizing Image Upload Panel (Strict requirement met: "التي نستطيع ان نتحكم بحجمها عند تحميلها") */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
              <span className="block text-xs font-black text-slate-700 flex items-center justify-end gap-1">
                <ImageIcon className="w-4 h-4 text-teal-650" />
                تحميل وإعداد صور الإعلان (صورة أو صورتين كحد أقصى) ومقاساتها:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Image 1 */}
                <div className="space-y-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  <label className="block text-[10px] font-extrabold text-slate-600">🖼️ تحميل الصورة الأولى للإعلان:</label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 1)}
                    className="w-full text-[10px] text-slate-500"
                  />
                  {image1 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>الارتفاع: {image1Height}px</span>
                        <span>العرض: {image1Width}px</span>
                      </div>
                      
                      {/* Control size of image 1 dynamically! */}
                      <div className="space-y-1">
                        <span className="block text-[9px] text-slate-400">تحكم بعرض الصورة الأولى:</span>
                        <input 
                          type="range" min="40" max="250" 
                          className="w-full accent-teal-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                          value={image1Width}
                          onChange={(e) => setImage1Width(Number(e.target.value))}
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[9px] text-slate-400">تحكم بارتفاع الصورة الأولى:</span>
                        <input 
                          type="range" min="40" max="250" 
                          className="w-full accent-teal-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                          value={image1Height}
                          onChange={(e) => setImage1Height(Number(e.target.value))}
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          type="button" 
                          onClick={() => setImage1(undefined)}
                          className="text-[9px] text-rose-500 hover:underline"
                        >
                          ❌ إزالة الصورة الأولى
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Image 2 */}
                <div className="space-y-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  <label className="block text-[10px] font-extrabold text-slate-600">🖼️ تحميل الصورة الثانية (اختياري):</label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 2)}
                    className="w-full text-[10px] text-slate-500"
                  />
                  {image2 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>الارتفاع: {image2Height}px</span>
                        <span>العرض: {image2Width}px</span>
                      </div>
                      
                      {/* Control size of image 2 dynamically! */}
                      <div className="space-y-1">
                        <span className="block text-[9px] text-slate-400">تحكم بعرض الصورة الثانية:</span>
                        <input 
                          type="range" min="40" max="250" 
                          className="w-full accent-teal-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                          value={image2Width}
                          onChange={(e) => setImage2Width(Number(e.target.value))}
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[9px] text-slate-400">تحكم بارتفاع الصورة الثانية:</span>
                        <input 
                          type="range" min="40" max="250" 
                          className="w-full accent-teal-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                          value={image2Height}
                          onChange={(e) => setImage2Height(Number(e.target.value))}
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          type="button" 
                          onClick={() => setImage2(undefined)}
                          className="text-[9px] text-rose-500 hover:underline"
                        >
                          ❌ إزالة الصورة الثانية
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Fit controls */}
              <div className="flex items-center justify-end gap-4 text-xs pt-1.5 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">طريقة احتواء وضغط الصورة:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="fitMode" 
                    className="accent-teal-600" 
                    checked={imageFit === 'contain'} 
                    onChange={() => setImageFit('contain')} 
                  />
                  <span>كاملة ومنسقة (Contain)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="fitMode" 
                    className="accent-teal-600" 
                    checked={imageFit === 'cover'} 
                    onChange={() => setImageFit('cover')} 
                  />
                  <span>ملء المربع المخصص (Cover)</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-2 justify-end">
              <button
                type="submit"
                className="bg-teal-650 hover:bg-teal-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition duration-150 cursor-pointer shadow-xs"
              >
                {editingId ? '💾 حفظ تعديلات الإعلان' : '📢 إضافة الإعلان للقائمة الدوارة'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition duration-150 cursor-pointer"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

          </form>
        </div>

        {/* Right Column: List of existing ads */}
        <div className="xl:col-span-5 space-y-4 text-right">
          <span className="block text-xs text-slate-400 font-extrabold font-sans">📋 الإعلانات والشركاء المسجلين حالياً بالقائمة ({ads.length}):</span>
          
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {ads.map((ad) => (
              <div 
                key={ad.id} 
                className="bg-white border border-slate-150 rounded-2xl p-4 space-y-3 relative shadow-2xs hover:border-teal-500/45 transition-colors"
              >
                {/* Badge & delete/edit controllers */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditAd(ad)}
                      className="text-teal-650 hover:bg-teal-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-teal-100"
                      title="تعديل هذا الإعلان"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAd(ad.id)}
                      className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                      title="حذف هذا الإعلان"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-5.5 h-3.5 rounded-md shadow-inner border border-slate-200/80" 
                      style={{ backgroundImage: getBannerGradientStyle(ad.bgColor) }}
                      title="معاينة الخلفية البصرية للبنر"
                    />
                    <span className="text-[10px] font-black bg-slate-50 border border-slate-250/50 px-2.5 py-0.5 rounded-full text-slate-700">
                      {ad.badge}
                    </span>
                  </div>
                </div>

                {/* Ad Content summary */}
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800 leading-tight">
                    {ad.title}
                  </h4>
                  {ad.subtitle && (
                    <span className="block text-[10px] font-bold text-teal-650">
                      {ad.subtitle}
                    </span>
                  )}
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    {ad.description}
                  </p>
                </div>

                {/* Display Specs */}
                {ad.specs && ad.specs.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end">
                    {ad.specs.map((s, idx) => (
                      <span key={idx} className="text-[8.5px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Images summary indicators */}
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-sans border-t border-slate-100/50 pt-2">
                  <div className="flex items-center gap-2">
                    {ad.image1 ? (
                      <span className="text-emerald-600 flex items-center gap-0.5 font-bold">🖼️ صورة 1 نشطة ({ad.image1Width}x{ad.image1Height}px)</span>
                    ) : (
                      <span className="text-slate-400">لا توجد صورة مخصصة</span>
                    )}
                    {ad.image2 && (
                      <span className="text-emerald-600 flex items-center gap-0.5 font-bold">🖼️ صورة 2 نشطة ({ad.image2Width}x{ad.image2Height}px)</span>
                    )}
                  </div>
                  {ad.address && (
                    <span className="truncate max-w-[150px]" title={ad.address}>📍 {ad.address}</span>
                  )}
                </div>

              </div>
            ))}

            {ads.length === 0 && (
              <div className="bg-slate-50 text-slate-400 text-xs p-6 rounded-2xl border border-slate-150 border-dashed text-center">
                لا توجد إعلانات مسجلة بالقائمة حالياً. أضف إعلانك الأول للبدء!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
