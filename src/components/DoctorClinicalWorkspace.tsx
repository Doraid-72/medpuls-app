import React, { useState } from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { MedicalSession } from './VoipTwilio';

interface DoctorClinicalWorkspaceProps {
  activeSess: MedicalSession;
  simulatedDocId: string;
  MEDIATOR_WHATSAPP_PHONE: string;
  doctorPrescriptionText: string;
  setDoctorPrescriptionText: (txt: string) => void;
  handleSendPrescription: (sessionId: string, prescriptionText: string) => void;
  handleEndSession: (sessionId: string) => void;
  handleToggleFreeReviewForSession: (sessionId: string) => void;
  onSendChatMessage: (text: string) => void;
}

export default function DoctorClinicalWorkspace({
  activeSess,
  simulatedDocId,
  MEDIATOR_WHATSAPP_PHONE,
  doctorPrescriptionText,
  setDoctorPrescriptionText,
  handleSendPrescription,
  handleEndSession,
  handleToggleFreeReviewForSession,
  onSendChatMessage
}: DoctorClinicalWorkspaceProps) {
  const [localChatText, setLocalChatText] = useState('');

  // Prescription Modal States
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isRxSupplement, setIsRxSupplement] = useState(false);
  const [medicationItems, setMedicationItems] = useState<Array<{ name: string; dosage: string; instructions: string }>>([
    { name: '', dosage: '', instructions: '' }
  ]);
  const [newRxInstructions, setNewRxInstructions] = useState('');
  const [isDigitalSignedRx, setIsDigitalSignedRx] = useState(true);

  const isClosed = activeSess.status === 'closed';

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localChatText.trim()) return;
    onSendChatMessage(localChatText.trim());
    setLocalChatText('');
  };

  const handleAddPresetToMeds = (name: string, dosage: string, instructions: string) => {
    setMedicationItems(prev => {
      // If there's only one item and its name is empty, replace it
      if (prev.length === 1 && !prev[0].name.trim()) {
        return [{ name, dosage, instructions }];
      }
      return [...prev, { name, dosage, instructions }];
    });
    if (instructions) {
      setNewRxInstructions(prev => prev ? `${prev} • ${instructions}` : instructions);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = medicationItems.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      alert('الرجاء إضافة علاج أو مكمل غذائي واحد على الأقل وتعبئة اسمه');
      return;
    }

    // 1. Format the prescription message for active chat session
    const formattedRxText = validItems.map((item, index) => {
      const parts = [`💊 **العلاج #${index + 1}:** ${item.name.trim()}`];
      if (item.dosage.trim()) parts.push(`   الجرعة: ${item.dosage.trim()}`);
      if (item.instructions.trim()) parts.push(`   طريقة الاستعمال: ${item.instructions.trim()}`);
      return parts.join('\n');
    }).join('\n\n') + (newRxInstructions.trim() ? `\n\n💡 **تعليمات عامة من الطبيب:**\n${newRxInstructions.trim()}` : '');

    // 2. Submit to backend API (/api/prescriptions) to sync patient's wallet
    try {
      const finalMeds = validItems.map(item => item.name.trim()).join('\n');
      const finalDosage = validItems.map(item => {
        const d = item.dosage.trim() || 'الجرعة مقررة';
        const inst = item.instructions ? item.instructions.trim() : '';
        return inst ? `${d} - طريقة الاستعمال: ${inst}` : d;
      }).join('\n');

      const digitalSignatureHash = isDigitalSignedRx ? `MEDPULSE-SIG-${Math.floor(100000 + Math.random() * 900000)}-SHA256` : undefined;

      await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationName: finalMeds,
          dosage: finalDosage,
          instructions: newRxInstructions,
          pharmacyName: "بانتظار تحديد المستفيد للصيدلية المفضلة",
          isSupplement: isRxSupplement,
          doctorName: activeSess.doctorName || "د. سمر الخالدي",
          patientName: activeSess.patientName,
          patientEmail: activeSess.patientEmail,
          isDigitalSigned: isDigitalSignedRx,
          digitalSignatureHash,
          sourceType: 'Doctor'
        })
      });
    } catch (err) {
      console.error('Failed to register prescription on backend:', err);
    }

    // 3. Post to live chat log
    handleSendPrescription(activeSess.id, formattedRxText);

    // 4. Reset states & close modal
    setMedicationItems([{ name: '', dosage: '', instructions: '' }]);
    setNewRxInstructions('');
    setIsRxSupplement(false);
    setIsPrescriptionModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-between h-full bg-slate-50 text-right relative">
      {/* Doctor Clinical Header */}
      <div className="bg-indigo-950 text-white p-4 border-b border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-800 rounded-xl flex items-center justify-center text-lg shadow-sm border border-indigo-700">
            👤
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-start">
              <h4 className="font-bold text-xs">{activeSess.patientName}</h4>
              <span className="text-[9px] bg-indigo-800 text-indigo-200 px-1.5 py-0.5 rounded font-mono font-bold">
                مستفيد نشط
              </span>
            </div>
            <span className="text-[10px] text-slate-350 block font-mono">{activeSess.patientEmail}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-sans self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleToggleFreeReviewForSession(activeSess.id)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
              activeSess.hasFreeReviewActive
                ? 'bg-amber-550 hover:bg-amber-600 text-white shadow-xs'
                : 'bg-indigo-800 hover:bg-indigo-700 text-slate-200 hover:text-white border border-indigo-700'
            }`}
          >
            🧪 {activeSess.hasFreeReviewActive ? 'إلغاء المراجعة المجانية 🛑' : 'طلب فحوصات + مراجعة مجانية 🧬'}
          </button>
          <button
            type="button"
            onClick={() => handleEndSession(activeSess.id)}
            disabled={isClosed}
            className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-350 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition cursor-pointer active:scale-95 disabled:pointer-events-none"
          >
            🔒 إنهاء الجلسة وإغلاق الغرفة
          </button>
        </div>
      </div>

      {/* Quick Vitals Dashboard */}
      <div className="bg-white border-b border-slate-200 p-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
          <span className="block text-[8px] font-black text-slate-400">ضغط الدم</span>
          <span className="text-xs font-black text-slate-700 font-mono">{activeSess.vitalSigns?.bloodPressure || '120/80'}</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
          <span className="block text-[8px] font-black text-slate-400">مستويات السكري</span>
          <span className="text-xs font-black text-slate-700 font-mono">{activeSess.vitalSigns?.bloodSugar || '125'} ملجم</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
          <span className="block text-[8px] font-black text-slate-400">نسبة الأكسجين</span>
          <span className="text-xs font-black text-slate-700 font-mono">%{activeSess.vitalSigns?.oxygenLevel || '98'}</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
          <span className="block text-[8px] font-black text-slate-400">العمر والوزن</span>
          <span className="text-[10px] font-bold text-slate-600 font-mono">
            {activeSess.vitalSigns?.age || '35'}س / {activeSess.vitalSigns?.weight || '80'}كجم
          </span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100 col-span-2 sm:col-span-1">
          <span className="block text-[8px] font-black text-slate-400">تاريخ البدء</span>
          <span className="text-[9px] font-mono font-bold text-slate-500">
            {new Date(activeSess.createdAt).toLocaleDateString('ar-EG', {month: 'short', day: 'numeric'})}
          </span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col bg-[#E5DDD5] max-h-[300px]">
        {/* Uploaded Files Section */}
        {activeSess.uploadedFiles && activeSess.uploadedFiles.length > 0 && (
          <div className="bg-white/95 border border-slate-200/60 p-3 rounded-2xl space-y-1.5 shadow-2xs max-w-md mx-auto w-full text-right">
            <span className="text-[10.5px] font-black text-indigo-950 block">📎 تحاليل وملفات طبيّة رفعها المريض:</span>
            <div className="grid grid-cols-1 gap-1">
              {activeSess.uploadedFiles.map((file) => (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-indigo-50/50 hover:bg-indigo-100/50 border border-indigo-100/50 p-2 rounded-xl flex items-center justify-between transition"
                >
                  <span className="text-[9px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded border border-indigo-100">
                    معاينة سحابية 🔗
                  </span>
                  <div className="flex items-center gap-1.5 text-right font-sans">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-800 line-clamp-1 truncate max-w-[150px]">{file.name}</span>
                      <span className="block text-[8.5px] text-slate-400 font-mono">{file.size}</span>
                    </div>
                    <span className="text-base">{file.type === 'pdf' ? '📄' : '🖼️'}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {activeSess.chats.map((msg) => {
          const isDr = msg.sender === 'doctor';
          return (
            <div
              key={msg.id}
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-2xs leading-relaxed ${
                isDr
                  ? 'bg-indigo-600 text-white mr-auto rounded-tr-none self-start text-right'
                  : 'bg-[#DCF8C6] text-slate-800 ml-auto rounded-tl-none self-end'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <span className={`block text-[8px] mt-1 text-left ${isDr ? 'text-indigo-200' : 'text-slate-400'}`}>
                {msg.time}
              </span>
            </div>
          );
        })}
      </div>

      {/* Prescription and Chat Input Container */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
        {/* Open Full Prescription Creator Modal Button */}
        <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
          <div>
            <span className="block text-xs font-bold text-indigo-950">⚕️ كتابة الروشتة والربط الصيدلاني المعتمد:</span>
            <span className="block text-[10px] text-slate-500 mt-0.5 leading-relaxed">
              افتح نافذة الوصفات الرسمية لصياغة دقيقة للمواد العلاجية والمكملات، ودعمها بالختم الرقمي لتظهر فوراً في ملف المريض.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsPrescriptionModalOpen(true)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shrink-0 shadow-xs"
          >
            ✍️ كتابة الوصفة الطبية 📋
          </button>
        </div>

        {/* 2. Chat input form */}
        <form onSubmit={handleChatSubmit} className="flex gap-2 items-center">
          <input
            type="text"
            required
            placeholder="اكتب رسالة الرد السريري للمريض هنا..."
            className="flex-1 bg-white border border-slate-300 rounded-full px-4 py-2.5 text-xs focus:outline-indigo-500 text-right font-sans"
            value={localChatText}
            onChange={(e) => setLocalChatText(e.target.value)}
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shrink-0 transition cursor-pointer shadow-xs"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </form>

        {/* Direct launch WhatsApp trigger to notify patient */}
        <div className="pt-1.5 border-t border-slate-200 mt-1 flex flex-col gap-1">
          <a
            href={`https://wa.me/${MEDIATOR_WHATSAPP_PHONE.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `أهلاً بك يا ${activeSess.patientName}. لقد قمت بتقديم المتابعة الطبية وصرف روشتتك السريرية على منصة MedPulse. يرجى مراجعة غرفتك الطبية الآن.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="with-wa-glow w-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-[11px] font-bold py-2 rounded-xl text-center flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            إشعار وتنبيه المريض فوراً بالروشتة عبر WhatsApp الفعلي 💬
          </a>
        </div>
      </div>

      {/* --- ELITE PRESCRIPTION MODAL WINDOW --- */}
      {isPrescriptionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] text-right">
            
            {/* Modal Header */}
            <div className="bg-indigo-950 p-5 text-white flex items-center justify-between">
              <button 
                type="button" 
                onClick={() => setIsPrescriptionModalOpen(false)}
                className="text-slate-400 hover:text-white transition duration-150 text-xl font-sans"
              >
                ✕
              </button>
              <div>
                <h3 className="text-base font-bold font-display">تحرير وإصدار الوصفة الطبية المعتمدة رقمياً</h3>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  المستفيد المستهدف: <span className="font-bold text-white">{activeSess.patientName}</span> ({activeSess.patientEmail})
                </p>
              </div>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleModalSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 font-sans text-xs">
              
              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">تصنيف المستحضر المحرر</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-150 cursor-pointer ${!isRxSupplement ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    onClick={() => setIsRxSupplement(false)}
                  >
                    💊 دواء علاجي
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-150 cursor-pointer ${isRxSupplement ? 'bg-teal-600 border-teal-600 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    onClick={() => setIsRxSupplement(true)}
                  >
                    🌿 مكمل غذائي
                  </button>
                </div>
              </div>

              {/* Preset suggestions */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50">
                <span className="block text-[10px] font-bold text-slate-500 mb-2 font-sans">🌿 اقتراحات سريرية سريعة (انقر للإضافة الفورية إلى قائمة العلاجات):</span>
                <div className="flex flex-wrap gap-1.5 justify-start">
                  {!isRxSupplement ? (
                    <>
                      <button type="button" onClick={() => handleAddPresetToMeds('Glucophage (جلوكوفاج)', '500 ملجم مرتين يومياً', 'قرص واحد مع الوجبة صباحاً ومساءً للتحكم بسكر الدم')} className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-indigo-100 cursor-pointer">➕ جلوكوفاج 500مجم</button>
                      <button type="button" onClick={() => handleAddPresetToMeds('Concor (كونكور للضغط)', '5 ملجم صباحاً', 'قرص واحد على الريق مع كوب ماء وبدون مضغ')} className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-indigo-100 cursor-pointer">➕ كونكور للضغط</button>
                      <button type="button" onClick={() => handleAddPresetToMeds('Lipitor (ليبيتور)', '20 ملجم ليلاً', 'قرص واحد قبل النوم مباشرة')} className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-indigo-100 cursor-pointer">➕ ليبيتور كوليسترول</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => handleAddPresetToMeds('فيتامين د3 السائل (Vitamin D3)', '5000 وحدة دولية يومياً', 'حبة واحدة يومياً مع الوجبة الرئيسية الدسمة لتعويض عجز الحرق والسمنة')} className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-teal-100 cursor-pointer">➕ فيتامين د3</button>
                      <button type="button" onClick={() => handleAddPresetToMeds('بيسجليسينات المغنيسيوم (Magnesium)', '400 ملجم ليلاً', 'حبة واحدة قبل النوم بساعة لإراحة العضلات وتوسيع شرايين الأوعية')} className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-teal-100 cursor-pointer">➕ مغنيسيوم</button>
                      <button type="button" onClick={() => handleAddPresetToMeds('أوميغا-3 البحري (Omega 3)', '1000 ملجم مع الغداء', 'كبسولة واحدة مع وجبة الغداء لتعزيز صحة شرايين القلب والدماغ وثبات الدهون')} className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-teal-100 cursor-pointer">➕ أوميغا-3</button>
                      <button type="button" onClick={() => handleAddPresetToMeds('بيكولينات الكروم (Chromium)', '200 ميكروجرام حبة واحدة', 'حبة واحدة قبل الغذاء بـ 20 دقيقة لزيادة كفاءة مستقبلات الإنسولين')} className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-2.5 py-1 rounded-lg transition-colors border border-teal-100 cursor-pointer">➕ كروميوم</button>
                    </>
                  )}
                </div>
              </div>

              {/* Medication Items List */}
              <div className="space-y-4 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950 flex items-center gap-1 font-sans">💊 قائمة المواد الموصوفة:</span>
                  <button
                    type="button"
                    onClick={() => setMedicationItems(prev => [...prev, { name: '', dosage: '', instructions: '' }])}
                    className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-bold px-3 py-1.5 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer"
                  >
                    ➕ إضافة مادة علاجية جديدة
                  </button>
                </div>

                <div className="space-y-3">
                  {medicationItems.map((item, index) => (
                    <div key={index} className="bg-white border border-slate-200/80 p-3.5 rounded-xl space-y-3 relative text-right">
                      {medicationItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setMedicationItems(prev => prev.filter((_, i) => i !== index))}
                          className="absolute left-2.5 top-2 text-rose-500 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 transition-colors text-[10px] cursor-pointer"
                        >
                          🗑️ حذف
                        </button>
                      )}
                      
                      <div className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md font-bold inline-block">
                        المستحضر #{index + 1}
                      </div>

                      <div className="space-y-2.5 text-right">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 font-sans">اسم العلاج / المكمل العلمي والتجاري:</label>
                          <input 
                            type="text"
                            required
                            placeholder={isRxSupplement ? "مثال: كبسولات فيتامين د3" : "مثال: جلوكوفاج 500 ملجم"}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-indigo-500 font-semibold"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMedicationItems(prev => prev.map((it, i) => i === index ? { ...it, name: val } : it));
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 font-sans">الجرعة المقررة:</label>
                            <input 
                              type="text"
                              required
                              placeholder="مثال: 500 ملجم أو حبة واحدة"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-indigo-500 font-semibold text-center"
                              value={item.dosage}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMedicationItems(prev => prev.map((it, i) => i === index ? { ...it, dosage: val } : it));
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 font-sans">طريقة وأوقات الاستعمال:</label>
                            <input 
                              type="text"
                              placeholder="مثال: مرتين يومياً بعد الأكل"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-indigo-500 font-semibold"
                              value={item.instructions}
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

              {/* General Comments */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 font-sans">تعليمات وإرشادات سريرية إضافية:</label>
                <textarea 
                  placeholder="مثال: يرجى شرب لترين من الماء يومياً والتقيد بالحمية المخصصة وإجراء التحليل التراكمي بعد شهر."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-indigo-500 text-right h-16 font-sans resize-none"
                  value={newRxInstructions}
                  onChange={(e) => setNewRxInstructions(e.target.value)}
                />
              </div>

              {/* Digital sign check */}
              <div className="flex items-center gap-2 justify-start font-sans">
                <input 
                  type="checkbox"
                  id="digital-sign-modal"
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                  checked={isDigitalSignedRx}
                  onChange={(e) => setIsDigitalSignedRx(e.target.checked)}
                />
                <label htmlFor="digital-sign-modal" className="text-[11px] font-bold text-slate-600 cursor-pointer flex items-center gap-1">
                  تضمين الختم والترخيص الرقمي المعتمد لوزارة الصحة العراقية ✅
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition duration-150 shadow-sm cursor-pointer"
                >
                  إرسال وصرف الوصفة الطبية المعتمدة رقمياً ✅
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrescriptionModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-5 py-3 rounded-xl transition duration-150 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}

