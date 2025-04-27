import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CallDetails from './CallDetails';
import { getHistory } from '../api';

const ChatHistory = ({ phone, userId, darkMode }) => {
  const [history, setHistory] = useState([]);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!phone) return;
    setLoading(true);
    setError(null);
    // For guest accounts (no userId), use localStorage
    if (!userId) {
      const guestHistory = JSON.parse(localStorage.getItem('plektu_guest_history') || '[]');
      setHistory(Array.isArray(guestHistory) ? guestHistory : []);
      setLoading(false);
      return;
    }
    // For signed-in users, get from backend using getHistory to ensure query param
    getHistory(phone, userId)
      .then((data) => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load call history.');
        setLoading(false);
      });
  }, [phone, userId]);

  // Listen for autoExpandCall event to auto-select the latest call
  useEffect(() => {
    function handleAutoExpand(e) {
      if (e.detail && e.detail.callId) {
        setSelectedCallId(e.detail.callId);
      }
    }
    window.addEventListener('autoExpandCall', handleAutoExpand);
    return () => window.removeEventListener('autoExpandCall', handleAutoExpand);
  }, []);

  if (!phone) {
    return <div style={{ padding: 24 }}>Please enter your phone number to view call history.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      style={{ padding: 0, margin: 0 }}
    >
      <ul style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        {history.map((call, idx) => (
          <motion.li
            key={call.call_id || call.id || idx}
            initial={{ scale: 0.97, opacity: 0.7 }}
            animate={{ scale: selectedCallId === (call.call_id || call.id) ? 1.03 : 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              background: darkMode ? '#23272f' : '#f7f7fa',
              borderRadius: 18,
              boxShadow: selectedCallId === (call.call_id || call.id)
                ? '0 2px 14px 0 rgba(0,0,0,0.08)' : '0 1px 4px 0 rgba(0,0,0,0.03)',
              padding: 0,
              margin: 0,
              border: selectedCallId === (call.call_id || call.id)
                ? '2.5px solid #5e9cff' : '1.5px solid #e0e3ea',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              minHeight: 92,
              transition: 'border 0.3s cubic-bezier(.4,2,.6,1), box-shadow 0.25s cubic-bezier(.4,2,.6,1)'
            }}
            onClick={() => setSelectedCallId(call.call_id || call.id)}
          >
            {/* Left: summary column */}
            <div style={{
              flex: '0 0 210px',
              padding: '18px 18px 18px 22px',
              borderRight: '1.5px solid #e0e3ea',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minWidth: 150
            }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                {call.topic || 'No topic'}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>
                {new Date(call.call_time || call.timestamp).toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: call.status === 'success' ? '#388e3c' : '#d32f2f' }}>
                Status: {call.status || 'unknown'}
              </div>
            </div>
            {/* Right: details column */}
            <motion.div
              style={{
                flex: 1,
                padding: '16px 26px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minWidth: 0
              }}
              initial={false}
              animate={{
                opacity: selectedCallId === (call.call_id || call.id) ? 1 : 0.7,
                y: selectedCallId === (call.call_id || call.id) ? 0 : 12
              }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              {selectedCallId === (call.call_id || call.id) && userId && (
                <div style={{ marginTop: 0, marginBottom: 0 }}>
                  <CallDetails callId={call.call_id || call.id} darkMode={darkMode} />
                </div>
              )}
              {selectedCallId === (call.call_id || call.id) && !userId && (
                <div style={{ fontSize: 14, color: '#999', marginTop: 12 }}>
                  (Login to see full call details)
                </div>
              )}
            </motion.div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

export default ChatHistory;
