import React, { useState, useEffect } from 'react';
import { triggerCall, getHistory, getCallTranscript, getCallDetails, getCallRecording } from './api';

const MAX_CALLS = 3;
const CALLS_KEY = 'voxio_calls_left';
const PHONE_KEY = 'voxio_phone';

// Fixed PST/PDT time conversion function
function getPSTTimeString(iso) {
  try {
    // Explicitly format with date and time components to ensure consistency
    const options = { 
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return new Date(iso).toLocaleString('en-US', options);
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
  const [history, setHistory] = useState([]);
  const [alignedTrans, setAlignedTrans] = useState({}); // {call_id: [ {speaker, text} ] }
  const [transcriptLoading, setTranscriptLoading] = useState({}); // {call_id: boolean}
  const [transcriptError, setTranscriptError] = useState({}); // {call_id: string}
  const [recordingUrls, setRecordingUrls] = useState({}); // {call_id: url}

  useEffect(() => {
    if (phone) {
      getHistory(phone).then(h => setHistory(h)).catch(() => setHistory([]));
    }
  }, [phone, status]);

  useEffect(() => {
    localStorage.setItem(CALLS_KEY, callsLeft);
    localStorage.setItem(PHONE_KEY, phone);
  }, [callsLeft, phone]);

  // Update document title
  useEffect(() => {
    document.title = "Voxio";
  }, []);

  // Auto-refresh transcript for successful calls
  useEffect(() => {
    const interval = setInterval(() => {
      history.forEach(call => {
        if (call.call_id && call.status === 'success') {
          // Fetch transcript
          setTranscriptLoading(tl => ({ ...tl, [call.call_id]: true }));
          getCallTranscript(call.call_id).then(data => {
            if (Array.isArray(data.aligned) && data.aligned.length > 0) {
              setAlignedTrans(at => ({ ...at, [call.call_id]: data.aligned }));
              setTranscriptLoading(tl => ({ ...tl, [call.call_id]: false }));
              setTranscriptError(errs => ({ ...errs, [call.call_id]: undefined }));
            } else if (data.status === 'error' || data.message) {
              setTranscriptError(errs => ({ ...errs, [call.call_id]: data.message || 'Transcript error.' }));
              setTranscriptLoading(tl => ({ ...tl, [call.call_id]: false }));
            } else {
              setTranscriptLoading(tl => ({ ...tl, [call.call_id]: true }));
            }
          }).catch(err => {
            setTranscriptError(errs => ({ ...errs, [call.call_id]: (err && err.message) || 'Transcript fetch error.' }));
            setTranscriptLoading(tl => ({ ...tl, [call.call_id]: false }));
          });
          
          // Fetch recording if we don't have it already
          if (!recordingUrls[call.call_id]) {
            getCallRecording(call.call_id).then(data => {
              if (data.status === 'success' && data.recording_url) {
                setRecordingUrls(urls => ({ ...urls, [call.call_id]: data.recording_url }));
              }
            }).catch(() => {
              // Silently fail - recording might not be available yet
            });
          }
        }
      });
    }, 3000); // every 3 seconds for more real-time feel
    return () => clearInterval(interval);
  }, [history, recordingUrls]);

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
      const res = await triggerCall(phone, topic);
      setStatus(res.message === 'Bland.ai call triggered!' ? 'Call triggered.' : res.message);
      setCallsLeft(res.calls_left);
      setTopic('');
    } catch (err) {
      let msg = err.message;
      if (msg.includes('Call topic rejected')) msg = 'This topic is not allowed. Please enter a safe, appropriate topic.';
      if (msg.includes('Call limit reached')) msg = 'You have reached the maximum number of calls.';
      setStatus(msg);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <form onSubmit={handleCall} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 16px #0001', padding: 28, width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ margin: 0, color: '#222', fontWeight: 600, fontSize: 22, letterSpacing: -1 }}>Voxio by Dennis</h2>
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
                {call.call_id && (
                  <div style={{fontSize: 12, color: '#444', background: '#f5f5f5', borderRadius: 5, padding: 7, marginTop: 5, whiteSpace: 'pre-wrap', minHeight: 28}}>
                    {/* Display audio player for recordings */}
                    {recordingUrls[call.call_id] && (
                      <div style={{marginBottom: 8}}>
                        <audio src={recordingUrls[call.call_id]} controls style={{width: '100%', height: 30}} />
                      </div>
                    )}
                    
                    {transcriptError[call.call_id] && (
                      <div style={{color: '#b00020', fontStyle: 'italic'}}>Transcript error: {transcriptError[call.call_id]}</div>
                    )}
                    {transcriptLoading[call.call_id] && (!alignedTrans[call.call_id] || alignedTrans[call.call_id].length === 0) && !transcriptError[call.call_id] && (
                      <div style={{color: '#888', fontStyle: 'italic'}}>Waiting for transcript...</div>
                    )}
                    {alignedTrans[call.call_id] && alignedTrans[call.call_id].length > 0 && alignedTrans[call.call_id].map((seg, j) => (
                      <div key={j} style={{marginBottom: 2}}>
                        <b style={{color: seg.speaker === 'user' ? '#1976d2' : '#43a047'}}>{seg.speaker === 'user' ? 'User' : 'Agent'}:</b> {seg.text}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>}
      </form>
    </div>
  );
}

export default App;
