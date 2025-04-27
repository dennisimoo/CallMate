import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CallDetails from './CallDetails';
import { getHistory } from '../api';
import { supabase } from '../supabaseClient';

const CallHistory = ({ phone, userId, darkMode }) => {
  const [history, setHistory] = useState([]);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Helper: refresh guest history from localStorage
  const refreshGuestHistory = () => {
    const guestHistory = JSON.parse(localStorage.getItem('plektu_guest_call_history') || '[]');
    setHistory(Array.isArray(guestHistory) ? guestHistory : []);
  };

  const fetchCallHistoryFromSupabase = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Important: We no longer filter by phone number for logged-in users
      // This ensures users only see their own calls regardless of phone number
      const { data, error: supabaseError } = await supabase
        .from('call_history')
        .select('*')
        .eq('user_id', userId)
        .order('call_time', { ascending: false });
      
      if (supabaseError) throw supabaseError;
      
      if (data && Array.isArray(data)) {
        console.log('Setting history from Supabase:', data.length, 'calls');
        setHistory(data);
      }
    } catch (err) {
      console.error('Error fetching call history from Supabase:', err);
      // Fallback to API if Supabase fails - also don't filter by phone for users
      try {
        // Note: passing null as phone number to get all user's calls
        const apiHistory = await getHistory(null, userId);
        setHistory(Array.isArray(apiHistory) ? apiHistory : []);
      } catch (apiErr) {
        setError('Failed to load call history');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and setup refresh interval
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // For guest accounts (no userId), use localStorage
    if (!userId) {
      refreshGuestHistory();
      setLoading(false);
      return;
    }
    
    // For signed-in users, get data from Supabase or API
    fetchCallHistoryFromSupabase();
    
    // Set up a refresh interval every 2 seconds for real-time updates
    const intervalId = setInterval(() => {
      fetchCallHistoryFromSupabase();
    }, 2000);
    
    setRefreshInterval(intervalId);
    
    // Clean up on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [userId]);
  
  // Stop polling interval when component unmounts
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Listen for autoExpandCall event
  useEffect(() => {
    function handleAutoExpand(e) {
      if (e.detail && e.detail.callId) {
        // If guest, refresh the latest localStorage before expanding
        if (!userId) {
          refreshGuestHistory();
        } else {
          // For logged in users, refresh from Supabase
          fetchCallHistoryFromSupabase();
        }
        setSelectedCallId(e.detail.callId);
      }
    }
    window.addEventListener('autoExpandCall', handleAutoExpand);
    return () => window.removeEventListener('autoExpandCall', handleAutoExpand);
  }, [userId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date).replace(',', '');
  };
  
  // Format the call destination nicely
  const formatPhoneDetails = (call) => {
    if (!call.phone_number) return null;
    
    const fromNumber = call.from_number || '+19064981948'; // Default Bland number if not available
    
    return (
      <div style={{
        fontSize: '13px',
        color: darkMode ? '#9aa0b5' : '#666',
        marginTop: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>To: +{call.phone_number}</span>
        <span style={{ margin: '0 4px' }}>•</span>
        <span>From: {fromNumber}</span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      style={{ 
        padding: '16px',
        maxWidth: '800px',
        margin: '0 auto'
      }}
    >
      <h2 style={{ 
        color: darkMode ? '#fff' : '#111', 
        marginBottom: 24, 
        fontSize: 22,
        fontWeight: 500,
        letterSpacing: '-0.01em'
      }}>
        Call History
      </h2>
      
      {loading && history.length === 0 && (
        <div style={{ 
          padding: 16, 
          color: darkMode ? '#aaa' : '#666',
          textAlign: 'center',
          fontSize: 15
        }}>Loading...</div>
      )}
      
      {error && (
        <div style={{ 
          padding: 16, 
          color: '#f44336',
          textAlign: 'center',
          fontSize: 15
        }}>{error}</div>
      )}
      
      {history.length === 0 && !loading && !error && (
        <div style={{ 
          padding: '28px 20px', 
          textAlign: 'center',
          color: darkMode ? '#aaa' : '#666',
          backgroundColor: darkMode ? '#1a1a1a' : '#f9f9f9',
          borderRadius: 12,
          boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h3 style={{ marginBottom: 8, fontWeight: 500, fontSize: 16 }}>No call history</h3>
          <p style={{ fontSize: 14, margin: '0 auto', maxWidth: 260 }}>Place a call to get started</p>
        </div>
      )}
      
      {history.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          <AnimatePresence>
            {history.map((call, idx) => (
              <motion.div
                key={call.call_id || call.id || idx}
                initial={{ opacity: 0.8, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                style={{
                  backgroundColor: darkMode ? '#18191e' : '#ffffff',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  border: `1px solid ${darkMode ? '#2a2b36' : '#eaeaea'}`
                }}
                onClick={() => setSelectedCallId(
                  selectedCallId === (call.call_id || call.id) ? null : (call.call_id || call.id)
                )}
                layout
              >
                <div style={{ 
                  padding: '15px 18px',
                  borderLeft: `4px solid ${call.status === 'success' ? '#43a047' : call.status === 'pending' ? '#ff9800' : '#e53935'}`
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div>
                      <span style={{ 
                        fontWeight: 500, 
                        fontSize: 16,
                        color: darkMode ? '#eaebef' : '#333'
                      }}>
                        {call.topic || 'No topic'} <span style={{ 
                          color: call.status === 'success' ? '#66bb6a' : 
                                call.status === 'pending' ? '#ffa726' : '#ef5350',
                          fontWeight: 400,
                          fontSize: 14
                        }}>
                          ({call.status || 'unknown'})
                        </span>
                      </span>
                      
                      {formatPhoneDetails(call)}
                    </div>
                    
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                      <span style={{ 
                        fontSize: 13,
                        color: darkMode ? '#9aa0b5' : '#777',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                      }}>
                        {formatDate(call.call_time || call.timestamp)}
                      </span>
                      
                      <div style={{
                        marginTop: '8px',
                        color: darkMode ? '#9aa0b5' : '#777',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{selectedCallId === (call.call_id || call.id) ? 'Hide Details' : 'View Details'}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path 
                            d={selectedCallId === (call.call_id || call.id) 
                              ? "M7.41 15.41L12 10.83L16.59 15.41L18 14L12 8L6 14L7.41 15.41Z" 
                              : "M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z"}
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible call details */}
                <AnimatePresence>
                  {selectedCallId === (call.call_id || call.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ 
                        padding: '5px 18px 18px',
                        backgroundColor: darkMode ? '#1f2028' : '#fafafa',
                        borderTop: `1px solid ${darkMode ? '#2a2b36' : '#eaeaea'}`
                      }}
                      layout
                    >
                      <CallDetails callId={call.call_id || call.id} darkMode={darkMode} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default CallHistory;
