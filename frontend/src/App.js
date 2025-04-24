import React, { useState, useEffect } from 'react';
import { triggerCall } from './api';

const MAX_CALLS = 3;
const CALLS_KEY = 'callmate_calls_left';
const PHONE_KEY = 'callmate_phone';
const HISTORY_KEY = 'callmate_history';

function getPSTTimeString(iso) {
  try {
    return new Date(iso).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  } catch {
    return iso;
  }
}

function App() {
  const [phone, setPhone] = useState(localStorage.getItem(PHONE_KEY) || '');
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [callsLeft, setCallsLeft] = useState(() => {
    const val = localStorage.getItem(CALLS_KEY);
    return val ? parseInt(val, 10) : MAX_CALLS;
  });
  const [history, setHistory] = useState(() => {
    const val = localStorage.getItem(HISTORY_KEY);
    return val ? JSON.parse(val) : [];
  });

  useEffect(() => {
    localStorage.setItem(CALLS_KEY, callsLeft);
    localStorage.setItem(PHONE_KEY, phone);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [callsLeft, phone, history]);

  const handleCall = async (e) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);
    try {
      if (callsLeft <= 0) {
        setStatus('You have reached the maximum number of calls.');
        setLoading(false);
        return;
      }
      const timestamp = new Date().toISOString();
      const res = await triggerCall(phone, topic);
      const newCall = {
        topic,
        status: res.message === 'Bland.ai call triggered!' ? 'success' : 'blocked',
        timestamp,
        call_id: res.call_id || null
      };
      setHistory(h => [...h, newCall]);
      setStatus(res.message === 'Bland.ai call triggered!' ? 'Call triggered.' : res.message);
      setCallsLeft(c => c - 1);
      setTopic('');
    } catch (err) {
      setStatus(err.message || 'Error making call.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <form onSubmit={handleCall} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 16px #0001', padding: 28, width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ margin: 0, color: '#222', fontWeight: 600, fontSize: 22, letterSpacing: -1 }}>CallMate</h2>
        <input
          type="tel"
          placeholder="Phone number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={{ padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ddd' }}
          required
        />
        <textarea
          placeholder="Describe what you want to call about"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          style={{ padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ddd', minHeight: 48, resize: 'vertical' }}
          required
        />
        <button type="submit" disabled={loading || callsLeft === 0} style={{ padding: 10, fontSize: 17, borderRadius: 6, border: 'none', background: '#222', color: '#fff', cursor: loading || callsLeft === 0 ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Calling...' : 'Call Me'}
        </button>
        <div style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
          Calls left: <b>{callsLeft}</b> / {MAX_CALLS}
        </div>
        {status && <div style={{ marginTop: 8, color: status.startsWith('This topic') || status.startsWith('You have reached') ? '#b00020' : '#222', fontWeight: 500, textAlign: 'center' }}>{status.replace('Bland.ai call triggered!', 'Call triggered.')}</div>}
        {history.length > 0 && <div style={{marginTop: 18}}>
          <div style={{fontWeight: 600, marginBottom: 6, fontSize: 15}}>Call History</div>
          <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
            {history.map((call, i) => (
              <li key={i} style={{borderBottom: '1px solid #eee', marginBottom: 7, paddingBottom: 7}}>
                <div style={{fontSize: 13}}>
                  <b>{call.topic}</b> <span style={{color: call.status === 'success' ? '#388e3c' : '#b00020'}}>({call.status})</span>
                  {call.timestamp && <span style={{marginLeft: 6, color: '#888'}}>{getPSTTimeString(call.timestamp)}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>}
      </form>
    </div>
  );
}

export default App;
