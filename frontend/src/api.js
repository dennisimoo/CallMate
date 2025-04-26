// Simple API utility for backend calls
const API_BASE = 'http://localhost:8000';

export async function triggerCall(phone_number, topic, options = {}) {
  try {
    const res = await fetch(`${API_BASE}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number, topic, ...options }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error) {
    console.error("API Error in triggerCall:", error);
    throw error;
  }
}

export async function getHistory(phone_number) {
  try {
    const res = await fetch(`${API_BASE}/history/${phone_number}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error) {
    console.error("API Error in getHistory:", error);
    return []; // Return empty array on error to prevent UI crashes
  }
}

export async function getCallDetails(call_id) {
  try {
    const res = await fetch(`${API_BASE}/call_details/${call_id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error) {
    console.error("API Error in getCallDetails:", error);
    throw error;
  }
}

export async function getCallTranscript(call_id) {
  try {
    const res = await fetch(`${API_BASE}/call_transcript/${call_id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error) {
    console.error("API Error in getCallTranscript:", error);
    throw error;
  }
}

export async function getCallRecording(call_id) {
  try {
    const res = await fetch(`${API_BASE}/call_recording/${call_id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error) {
    console.error("API Error in getCallRecording:", error);
    throw error;
  }
}
