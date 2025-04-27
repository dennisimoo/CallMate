// Simple API utility for backend calls
const API_BASE = '/api'; // Use /api prefix based on backend configuration

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

// Always include user_id as a query parameter if provided
export async function getHistory(phone_number, user_id) {
  try {
    let url;
    
    if (user_id && !phone_number) {
      // If we have a user_id but no phone_number, get all calls for that user
      url = `${API_BASE}/history?user_id=${encodeURIComponent(user_id)}`;
    } else if (phone_number) {
      // If we have a phone_number, get calls for that phone
      url = `${API_BASE}/history/${phone_number}`;
      // Add user_id as query param if available
      if (user_id) {
        url += `?user_id=${encodeURIComponent(user_id)}`;
      }
    } else {
      // If we have neither, return empty array
      console.error("getHistory requires either phone_number or user_id");
      return [];
    }
    
    console.log("Fetching history from:", url);
    const res = await fetch(url);
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

export async function getCorrectedTranscript(call_id) {
  try {
    const res = await fetch(`${API_BASE}/call_corrected_transcript/${call_id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error) {
    console.error("API Error in getCorrectedTranscript:", error);
    // Fall back to regular transcript if corrected isn't available
    try {
      return await getCallTranscript(call_id);
    } catch (fallbackError) {
      console.error("Fallback transcript also failed:", fallbackError);
      throw error; // Throw original error
    }
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
