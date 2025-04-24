// Simple API utility for backend calls
const API_BASE = 'http://localhost:8000';

export async function triggerCall(phone_number, topic) {
  const res = await fetch(`${API_BASE}/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number, topic }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getHistory(phone_number) {
  const res = await fetch(`${API_BASE}/history/${phone_number}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCallDetails(call_id) {
  const res = await fetch(`${API_BASE}/call_details/${call_id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCallTranscript(call_id) {
  const res = await fetch(`${API_BASE}/call_transcript/${call_id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
