import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

export function getSupabase() {
  return supabaseInstance;
}

export async function initSupabase() {
  if (supabaseInstance) return supabaseInstance;

  // 1. Try to read from Vite environmental variables
  let url = (import.meta as any).env.VITE_SUPABASE_URL || "";
  let key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

  // 2. Fallback: load from server if local/build vars are not present
  if (!url || !key) {
    try {
      const res = await window.fetch('/api/supabase-config');
      if (res.ok) {
        const data = await res.json();
        url = data.supabaseUrl;
        key = data.supabaseKey;
        console.log("🔌 [Client Supabase] Successfully fetched credentials from backend API.");
      }
    } catch (e) {
      console.warn("⚠️ [Client Supabase] Failed to fetch Supabase config from API:", e);
    }
  }

  if (url && key && url.startsWith("https://")) {
    try {
      supabaseInstance = createClient(url, key);
      console.log("🔌 [Client Supabase] Initialized Supabase client successfully with URL:", url);
    } catch (e) {
      console.error("❌ [Client Supabase] Error creating Supabase client:", e);
    }
  } else {
    console.info("ℹ️ [Client Supabase] Supabase credentials not found or placeholder values. Realtime features will use SSE fallback.");
  }

  return supabaseInstance;
}

export async function sendSupabaseMessage(
  sessionId: string,
  sender: 'doctor' | 'patient',
  text: string,
  doctorId: string,
  patientEmail: string
) {
  const supabase = getSupabase();
  if (!supabase) return false;

  const msgId = "msg_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  try {
    const { error } = await supabase.from('messages').insert({
      id: msgId,
      conversation_id: sessionId,
      sender_type: sender === 'doctor' ? 'DOCTOR' : 'PATIENT',
      sender_id: sender === 'doctor' ? doctorId : patientEmail,
      content: text,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.warn("⚠️ [Supabase Save Message Error]:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("⚠️ Failed direct write to Supabase messages table:", err.message || err);
    return false;
  }
}

export async function fetchSessionMessagesFromSupabase(sessionId: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn("⚠️ Error loading messages from Supabase:", error.message);
      return null;
    }

    if (data) {
      return data.map((r: any) => ({
        id: r.id,
        sender: r.sender_type === 'DOCTOR' ? 'doctor' as const : 'patient' as const,
        text: r.content,
        time: new Date(r.created_at || Date.now()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }));
    }
  } catch (err: any) {
    console.warn("⚠️ Failed to load messages from Supabase directly:", err.message || err);
  }
  return null;
}
