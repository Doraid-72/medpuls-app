import React, { useState, useEffect } from 'react';
import { UserHealthProfile, DietPlan, RecipeRecommendation } from '../types';
import { Apple, Activity, Flame, Clock, ClipboardCheck, AlertCircle, RefreshCw, Pill, Sparkles } from 'lucide-react';

interface AiNutritionProps {
  profile: UserHealthProfile;
  onUpdateProfile: (updated: Partial<UserHealthProfile>) => void;
}

export default function AiNutrition({ profile, onUpdateProfile }: AiNutritionProps) {
  if (!profile) {
    return (
      <div className="p-6 text-center text-slate-500 font-sans">
        يرجى تسجيل الدخول أولاً لعرض التغذية الطبية والبدائل السريرية.
      </div>
    );
  }

  const [loading, setLoading] = useState(false);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Nutrition-specific dynamic parameters
  const [age, setAge] = useState<number | ''>(profile.age || 35);
  const [weight, setWeight] = useState<number | ''>(profile.weight || 80);
  const [height, setHeight] = useState<number | ''>(profile.height || 170);
  const [healthGoal, setHealthGoal] = useState('healthy-lifestyle');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [dietType, setDietType] = useState('balanced');

  const conditionsStr = (profile.chronicConditions || []).join(',');

  // Reset vital metrics to blank/zero
  const resetVitals = () => {
    setAge('');
    setWeight('');
    setHeight('');
  };

  // Keep state synced with the active profile only when the user changes (by email)
  // This prevents resetting typed input values when other parent states update
  useEffect(() => {
    if (profile) {
      setAge(profile.age || 35);
      setWeight(profile.weight || 80);
      setHeight(profile.height || 170);
      setHealthGoal(profile.chronicConditions && profile.chronicConditions.length > 0 ? 'disease-control' : 'healthy-lifestyle');
    }
  }, [profile.email]);

  // Recalculates calories by calling server endpoint
  const generateDietAndCaloriePlan = async (force: boolean = false) => {
    // Check if client cache exists to prevent unnecessary loading states and server fetches
    const sortedConditions = [...(profile.chronicConditions || [])].sort().join(",");
    const clientCacheKey = `diet_${age}_${weight}_${height}_sorted_${sortedConditions}_goal_${healthGoal}_act_${activityLevel}_diet_${dietType}`;

    if (!force) {
      const cachedPlan = sessionStorage.getItem(clientCacheKey);
      if (cachedPlan) {
        try {
          const parsed = JSON.parse(cachedPlan);
          setDietPlan(parsed);
          setError(null);
          return;
        } catch (e) {
          // ignore parsing error
        }
      }
    }

    if (!age || !weight || !height || Number(age) <= 0 || Number(weight) <= 0 || Number(height) <= 0) {
      setError('يرجى إدخال قيم صالحة (أكبر من الصفر) لكل من الوزن والطول والعمر لحساب السعرات بدقة.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/calculate-calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: Number(age),
          weight: Number(weight),
          height: Number(height),
          chronicConditions: profile.chronicConditions,
          healthGoal,
          activityLevel,
          dietType,
        }),
      });
      if (!response.ok) throw new Error('فشل الاتصال بخادم الذكاء الاصطناعي');
      const data: DietPlan = await response.json();
      setDietPlan(data);
      
      // Save to client cache
      sessionStorage.setItem(clientCacheKey, JSON.stringify(data));

      if (data.dailyCalories) {
        onUpdateProfile({ 
          dailyCalorieBudget: data.dailyCalories,
          age: Number(age),
          weight: Number(weight),
          height: Number(height)
        });
      }
    } catch (e: any) {
      setError(e.message || 'حدث خطأ غير متوقع أثناء توليد الخطة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch automatically when all vital metrics are filled and positive to avoid loading state/errors during typing/resetting
    if (age && weight && height && Number(age) > 0 && Number(weight) > 0 && Number(height) > 0) {
      generateDietAndCaloriePlan(false);
    }
  }, [conditionsStr, age, weight, height, healthGoal, activityLevel, dietType]);

  return (
    <div id="ai-nutrition-container" className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 md:p-8 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-600 font-mono">
            نظام التوصيات السريري • MedPulse AI
          </span>
          <h2 className="text-2xl font-bold font-display text-slate-800 mt-2 flex items-center gap-2">
            <Apple className="w-6 h-6 text-teal-500" />
            التغذية الذكية وحساب السعرات السريري
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            يقوم الذكاء الاصطناعي بتحليل معايير أسلوب حياتك أو حالتك الصحية لتفصيل السعرات والبدائل الغذائية المناسبة لك.
          </p>
        </div>
        
        <button
          onClick={() => generateDietAndCaloriePlan(true)}
          disabled={loading}
          id="btn-recalculate"
          className="flex items-center justify-center gap-2 text-sm bg-teal-600 text-white hover:bg-teal-700 font-medium px-5 py-2.5 rounded-xl transition duration-200 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          إعادة حساب بالذكاء الاصطناعي 🩺
        </button>
      </div>

      {/* Dynamic Parameters Form Section */}
      <div className="bg-slate-50 border border-slate-200/60 p-5 md:p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 leading-none m-0">
          <Activity className="w-4 h-4 text-teal-500" />
          تخصيص معايير وأهداف التغذية الشخصية:
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-right">
          
          {/* Current Weight, Height, Age */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 mb-0">المقاييس الحيوية الحالية:</label>
              <button
                type="button"
                onClick={resetVitals}
                className="text-[10px] text-rose-600 hover:text-rose-700 font-extrabold bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition duration-150 cursor-pointer flex items-center gap-1 active:scale-95"
                title="تصفير المقاييس الحالية لإدخال قيم جديدة بالكامل"
              >
                <span>تصفير المقاييس 🧹</span>
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="number" 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold focus:outline-teal-500"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="الوزن"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">كجم</span>
              </div>
              <div className="relative flex-1">
                <input 
                  type="number" 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold focus:outline-teal-500"
                  value={height}
                  onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="الطول"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">سم</span>
              </div>
              <div className="relative flex-1">
                <input 
                  type="number" 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold focus:outline-teal-500"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="العمر"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">سنة</span>
              </div>
            </div>
          </div>

          {/* Goal Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">الهدف الصحي التغذوي المرجو:</label>
            <select
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-teal-500"
              value={healthGoal}
              onChange={(e) => setHealthGoal(e.target.value)}
            >
              <option value="healthy-lifestyle">🌱 نمط حياة صحي ووقاية ممتازة (صحي)</option>
              <option value="weight-loss">📉 خسارة الوزن وحرق الدهون الفعال</option>
              <option value="muscle-gain">💪 زيادة الوزن والبناء العضلي الرياضي</option>
              <option value="disease-control">🩺 ضبط طبي صارم (سكري وضغط وسمنة)</option>
            </select>
          </div>

          {/* Preferred Diet */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">أسلوب ونوع الحمية المفضلة:</label>
            <select
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-teal-500"
              value={dietType}
              onChange={(e) => setDietType(e.target.value)}
            >
              <option value="balanced">🥗 متوازنة وشاملة (جميع المجموعات غذائية)</option>
              <option value="low-carb">🥩 قليلة النشويات / لو-كارب (Low Carb)</option>
              <option value="keto">🥑 كيتو دايت متكامل (High Fat / Low Carb)</option>
              <option value="mediterranean">🐠 حمية البحر الأبيض المتوسط (زيت زيتون وألياف)</option>
            </select>
          </div>

          {/* Physical Activity Level */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">معدل ومستوى نشاطك البدني:</label>
            <select
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-teal-500"
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
            >
              <option value="sedentary">🛋️ خامل / قليل النشاط والحركة اليومية</option>
              <option value="moderate">🚶 نشاط معتدل / مشي وحركة خفيفة باستمرار</option>
              <option value="active">🏃 نشيط جداً / ممارسة الرياضة يومياً بانتظام</option>
            </select>
          </div>

          {/* Connected state indicators */}
          <div className="sm:col-span-2 lg:col-span-2 flex items-end justify-start gap-2.5">
            <div className="bg-teal-50 border border-teal-100 p-2.5 rounded-xl w-full flex items-center justify-between">
              <div className="text-[10px] text-teal-800 leading-tight">
                <strong>💡 معالج الذكاء الاصطناعي متصل:</strong>
                {healthGoal === 'healthy-lifestyle' ? (
                  <span className="block text-slate-500 mt-0.5">مفعل في الوضع الوقائي والصحي لغير المرضى.</span>
                ) : (
                  <span className="block text-slate-500 mt-0.5">مفعل في الوضع العيادي والمطابقة السريرية لحالتك المزمنة.</span>
                )}
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            </div>
          </div>

        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div id="loading-animation-nutrition" className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-12 h-12 border-4 border-teal-500/20 rounded-full animate-ping"></div>
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-500 text-sm font-medium animate-pulse">
            يقوم طبيب الرعاية الرقمي MedPulse بحساب احتياجك السعري وتوليد وجبات مناسبة...
          </p>
        </div>
      ) : (
        dietPlan && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Calories & Macros Cards */}
            <div className="lg:col-span-4 space-y-6">
              {/* Daily Calorie Goal Card */}
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl text-white p-6 shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10">
                  <Flame className="w-48 h-48" />
                </div>
                
                <span className="text-xs uppercase tracking-wider font-semibold opacity-80">الهدف اليومي الموصى به</span>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold font-mono tracking-tight">{dietPlan.dailyCalories}</span>
                  <span className="text-sm font-medium">سُعرة حرارية</span>
                </div>
                <p className="text-teal-50 text-xs mt-3 leading-relaxed">
                  تم الحساب موازنةً مع احتياجك وعمرك ({profile.age} عاماً) والوزن المستهدف ({profile.targetWeight} كجم).
                </p>
              </div>

              {/* Macro Nutrients breakdown */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-500" />
                  توزيع المغذيات الكبرى (Macros)
                </h3>
                <div className="space-y-3">
                  {/* Carbs */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>كربوهيدرات</span>
                      <span className="font-mono">{dietPlan.macroRatio.carbs}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${dietPlan.macroRatio.carbs}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Proteins */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>بروتين رئيسي</span>
                      <span className="font-mono">{dietPlan.macroRatio.protein}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${dietPlan.macroRatio.protein}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Fats */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                      <span>دهون صحية</span>
                      <span className="font-mono">{dietPlan.macroRatio.fat}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-400 rounded-full transition-all duration-500"
                        style={{ width: `${dietPlan.macroRatio.fat}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200 leading-relaxed">
                  * تم تعديل نسب الكربوهيدرات والبروتين تلقائياً لمواءمة الحالة الصحية المحددة مسبقاً في ملفك الشخصي.
                </div>
              </div>
            </div>

            {/* AI Medical Advice & Suggested Recipes */}
            <div className="lg:col-span-8 space-y-6">
              {/* Doctor Nutrition Medical Commentary */}
              <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/60">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                  إرشادات التغذية الطبية المخصصة:
                </div>
                <p className="text-slate-700 text-sm mt-2 leading-relaxed whitespace-pre-line select-none">
                  {dietPlan.advice}
                </p>
              </div>

              {/* Intelligent Dietary Supplements Selection */}
              {dietPlan.supplements && dietPlan.supplements.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50/60 to-teal-50/20 rounded-3xl p-6 border border-indigo-100/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-100/30">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-500 rounded-xl text-white shrink-0">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5 font-display">
                          المكملات الغذائية والدعم الخلوي الذكي
                          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300 animate-pulse" />
                        </h3>
                        <p className="text-slate-500 text-xs mt-0.5">تم تحليل ومعايرة الاحتياج الفيتاميني الكلينيكي لتعزيز صحتك المستهدفة</p>
                      </div>
                    </div>
                    <span className="self-start sm:self-center text-[11px] font-bold text-indigo-600 bg-indigo-100/80 px-2.5 py-1 rounded-full font-mono shrink-0">
                      خوارزمية رعاية المستشار
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dietPlan.supplements.map((supp, index) => (
                      <div key={index} className="bg-white/90 backdrop-blur-xs border border-slate-100 rounded-2xl p-4 space-y-2 hover:border-indigo-200 hover:shadow-xs transition-all duration-150">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 font-sans">
                            <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>
                            {supp.name}
                          </h4>
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-lg font-sans shrink-0">
                            {supp.dosage}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed font-sans">
                          <strong className="text-slate-700">دواعي الاستعمال:</strong> {supp.purpose}
                        </p>
                        {supp.whySuitable && (
                          <div className="text-[11px] text-slate-500 border-t border-slate-100/80 pt-2 mt-2 leading-relaxed">
                            <strong className="text-teal-600">التأثير الحيوي المواتي:</strong> {supp.whySuitable}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipes Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                  الوجبات الطبية المقترحة بواسطة الذكاء الاصطناعي:
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dietPlan.recipes?.map((recipe, index) => (
                    <div 
                      key={index}
                      className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-teal-200/80 hover:shadow-xs transition duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Recipe Header */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-800 text-base">{recipe.title}</h4>
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-mono shrink-0">
                            {recipe.calories} كالو
                          </span>
                        </div>

                        {/* Prep Time */}
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-2 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>وقت التحضير: {recipe.prepTime}</span>
                        </div>

                        {/* Ingredients List */}
                        <div className="mt-4">
                          <span className="text-xs font-bold text-slate-500">المكونات المستخدمة:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {recipe.ingredients.map((ing, k) => (
                              <span key={k} className="text-[11px] bg-slate-50 text-slate-600 px-2 py-1 rounded-lg">
                                • {ing}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Instructions */}
                        <div className="mt-4">
                          <span className="text-xs font-bold text-slate-500">طريقة التحضير باختصار:</span>
                          <ul className="list-decimal list-inside text-xs text-slate-600 space-y-1 mt-1 font-sans">
                            {recipe.instructions.map((inst, k) => (
                              <li key={k} className="leading-snug">{inst}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Clinical Suitability note */}
                      <div className="mt-5 pt-3 border-t border-slate-100 bg-slate-50 rounded-lg p-2.5 text-[11px] text-slate-500 leading-normal">
                        <strong>التأثير السريري:</strong> {recipe.whySuitable}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
