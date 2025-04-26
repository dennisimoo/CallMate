import React, { useState, useEffect } from 'react';
import { triggerCall, getHistory, getCallTranscript, getCallDetails, getCallRecording } from './api';

const MAX_CALLS = 5;
const CALLS_KEY = 'voxio_calls_left';
const PHONE_KEY = 'voxio_phone';
const ADMIN_KEY = 'voxio_admin';

// Completely revised time formatting approach
function getPSTTimeString(iso) {
  try {
    if (!iso) return '';
    
    // Create a date object from the ISO string
    const date = new Date(iso);
    
    // Format directly using PST/PDT timezone
    // We'll use a direct approach to avoid timezone conversion issues
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    // Format the date
    return formatter.format(date);
  } catch (error) {
    console.error("Time formatting error:", error);
    return iso || ''; // Return original if there's an error
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
  const [activeTab, setActiveTab] = useState('main'); // 'main' or 'admin'
  const [adminPass, setAdminPass] = useState('');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem(ADMIN_KEY) === 'true');

  useEffect(() => {
    if (phone) {
      getHistory(phone).then(h => setHistory(h)).catch(() => setHistory([]));
    }
  }, [phone, status]);

  useEffect(() => {
    localStorage.setItem(CALLS_KEY, callsLeft);
    localStorage.setItem(PHONE_KEY, phone);
    localStorage.setItem(ADMIN_KEY, isAdmin.toString());
  }, [callsLeft, phone, isAdmin]);

  // Update document title
  useEffect(() => {
    document.title = "Voxio by Dennis";
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
      if (!isAdmin && callsLeft <= 0) {
        setStatus('You have reached the maximum number of calls.');
        setLoading(false);
        return;
      }
      
      // If admin, pass a flag to bypass moderation
      const adminFlag = isAdmin ? { admin: true } : {};
      
      const res = await triggerCall(phone, topic, adminFlag);
      setStatus(res.message === 'Bland.ai call triggered!' ? 'Call triggered.' : res.message);
      
      // Only decrease calls left if not in admin mode
      if (!isAdmin) {
        setCallsLeft(res.calls_left);
      }
      
      setTopic('');
    } catch (err) {
      let msg = err.message;
      if (msg.includes('Call topic rejected')) msg = 'This topic is not allowed. Please enter a safe, appropriate topic.';
      if (msg.includes('Call limit reached')) msg = 'You have reached the maximum number of calls.';
      setStatus(msg);
    }
    setLoading(false);
  };
  
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPass === 'admin') {
      setIsAdmin(true);
      setAdminPass('');
      setActiveTab('main');
    } else {
      alert('Incorrect admin password');
    }
  };
  
  const handleLogout = () => {
    setIsAdmin(false);
  };

  const renderMainTab = () => (
    <form onSubmit={handleCall} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 16px #0001', padding: 28, width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#222', fontWeight: 600, fontSize: 22, letterSpacing: -1 }}>Voxio</h2>
        <span style={{ fontSize: 12, color: '#666' }}>by Dennis</span>
      </div>
      
      <div style={{ fontSize: 14, color: '#555', marginBottom: 5, lineHeight: 1.4 }}>
        Voxio will connect you to talk about anything you want. Just enter your phone number and we'll call you!
      </div>
      
      <input
        type="tel"
        placeholder="Your phone number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        style={{ padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ddd' }}
        required
      />
      <textarea
        placeholder="Describe your conversation topic"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        style={{ padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ddd', minHeight: 48, resize: 'vertical' }}
        required
      />
      <button type="submit" disabled={loading || (!isAdmin && callsLeft === 0)} style={{ padding: 10, fontSize: 17, borderRadius: 6, border: 'none', background: '#222', color: '#fff', cursor: loading || (!isAdmin && callsLeft === 0) ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Calling...' : 'Call Me'}
      </button>
      <div style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
        {isAdmin ? (
          <div>
            Admin Mode - Unlimited Calls
            <button 
              onClick={handleLogout} 
              style={{ marginLeft: 8, fontSize: 12, padding: '2px 6px', border: 'none', background: '#f0f0f0', borderRadius: 4, cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
        ) : (
          <>Calls left: <b>{callsLeft}</b> / {MAX_CALLS}</>
        )}
      </div>
      {status && (
        <div 
          style={{ 
            marginTop: 8, 
            padding: '10px', 
            borderRadius: '6px',
            backgroundColor: status.includes('Call triggered') ? '#e8f5e9' : (status.startsWith('This topic') || status.startsWith('You have reached')) ? '#ffebee' : '#f5f5f5',
            color: status.includes('Call triggered') ? '#2e7d32' : (status.startsWith('This topic') || status.startsWith('You have reached')) ? '#b00020' : '#333',
            fontWeight: 500, 
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {status.replace('Bland.ai call triggered!', 'Call triggered!')}
          {status.includes('Call triggered') && (
            <div style={{marginTop: 5, fontSize: 13, fontWeight: 'normal'}}>
              You'll receive a call shortly. Please answer your phone!
            </div>
          )}
        </div>
      )}
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
  );
  
  const renderAdminTab = () => (
    <form onSubmit={handleAdminLogin} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 16px #0001', padding: 28, width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ margin: 0, color: '#222', fontWeight: 600, fontSize: 22, letterSpacing: -1 }}>Admin Login</h2>
      <input
        type="password"
        placeholder="Admin Password"
        value={adminPass}
        onChange={e => setAdminPass(e.target.value)}
        style={{ padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ddd' }}
        required
      />
      <button type="submit" style={{ padding: 10, fontSize: 17, borderRadius: 6, border: 'none', background: '#222', color: '#fff', cursor: 'pointer' }}>
        Login
      </button>
    </form>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
        <button 
          onClick={() => setActiveTab('main')} 
          style={{ 
            padding: '8px 16px', 
            fontSize: 14, 
            border: 'none', 
            background: activeTab === 'main' ? '#222' : '#e0e0e0', 
            color: activeTab === 'main' ? '#fff' : '#222', 
            borderRadius: 6, 
            cursor: 'pointer' 
          }}
        >
          Home
        </button>
        <button 
          onClick={() => setActiveTab('admin')} 
          style={{ 
            padding: '8px 16px', 
            fontSize: 14, 
            border: 'none', 
            background: activeTab === 'admin' ? '#222' : '#e0e0e0', 
            color: activeTab === 'admin' ? '#fff' : '#222', 
            borderRadius: 6, 
            cursor: 'pointer' 
          }}
        >
          Admin
        </button>
      </div>
      
      {activeTab === 'main' ? renderMainTab() : renderAdminTab()}
    </div>
  );
}

export default App;
