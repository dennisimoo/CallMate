import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CallDetails from './CallDetails';
import { getHistory } from '../api';
import { supabase } from '../supabaseClient';

const CallHistory = ({ phone, userId, darkMode }) => {
  const [callHistory, setCallHistory] = useState([]);
  const [smsHistory, setSmsHistory] = useState([]);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [selectedSmsId, setSelectedSmsId] = useState(null);
  const [activeTab, setActiveTab] = useState('calls'); // 'calls' or 'sms'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Helper: refresh guest history from localStorage
  const refreshGuestHistory = () => {
    const guestCallHistory = JSON.parse(localStorage.getItem('plektu_guest_call_history') || '[]');
    setCallHistory(Array.isArray(guestCallHistory) ? guestCallHistory : []);
    
    const guestSmsHistory = JSON.parse(localStorage.getItem('plektu_guest_sms_history') || '[]');
    setSmsHistory(Array.isArray(guestSmsHistory) ? guestSmsHistory : []);
  };

  const fetchHistoryFromSupabase = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Get all calls for this user (not filtered by phone number)
      const { data: callData, error: callError } = await supabase
        .from('call_history')
        .select('*')
        .eq('user_id', userId)
        .order('call_time', { ascending: false });
      
      if (callError) throw callError;
      
      if (callData && Array.isArray(callData)) {
        console.log('Setting call history from Supabase:', callData.length, 'calls');
        setCallHistory(callData);
      }
      
      // Get all SMS messages for this user
      const { data: smsData, error: smsError } = await supabase
        .from('sms_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });
        
      if (smsError) throw smsError;
      
      if (smsData && Array.isArray(smsData)) {
        console.log('Setting SMS history from Supabase:', smsData.length, 'messages');
        setSmsHistory(smsData);
      }
    } catch (err) {
      console.error('Error fetching history from Supabase:', err);
      // Fallback to API if Supabase fails
      try {
        // Get call history
        const apiCallHistory = await getHistory(null, userId);
        setCallHistory(Array.isArray(apiCallHistory) ? apiCallHistory : []);
        
        // Get SMS history from localStorage as fallback
        const smsHistoryFallback = JSON.parse(localStorage.getItem('plektu_sms_history') || '[]');
        setSmsHistory(Array.isArray(smsHistoryFallback) ? smsHistoryFallback : []);
      } catch (apiErr) {
        setError('Failed to load history');
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
    fetchHistoryFromSupabase();
    
    // Set up a less aggressive refresh interval (3 seconds) to avoid excessive API calls
    // Only sync the list data, not the individual call details
    const intervalId = setInterval(() => {
      fetchHistoryFromSupabase();
    }, 3000); // Reduced frequency to prevent too many API calls
    
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
          fetchHistoryFromSupabase();
        }
        setActiveTab('calls'); // Switch to calls tab
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
    
    const fromNumber = call.from_number || '+19064981948'; // Default phone number if not available
    
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
        marginBottom: 16, 
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        History
      </h2>
      
      {/* Tabs to switch between calls and SMS */}
      <div style={{
        display: 'flex',
        marginBottom: 20,
        borderBottom: darkMode ? '1px solid #333' : '1px solid #eee',
      }}>
        <button 
          onClick={() => setActiveTab('calls')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            padding: '8px 16px',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            color: activeTab === 'calls' ? (darkMode ? '#8ee' : '#0066cc') : (darkMode ? '#aaa' : '#666'),
            borderBottom: activeTab === 'calls' ? (darkMode ? '2px solid #8ee' : '2px solid #0066cc') : 'none',
            marginBottom: '-1px',
          }}
        >
          Calls
        </button>
        <button 
          onClick={() => setActiveTab('sms')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            padding: '8px 16px',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            color: activeTab === 'sms' ? (darkMode ? '#8ee' : '#0066cc') : (darkMode ? '#aaa' : '#666'),
            borderBottom: activeTab === 'sms' ? (darkMode ? '2px solid #8ee' : '2px solid #0066cc') : 'none',
            marginBottom: '-1px',
          }}
        >
          SMS
        </button>
      </div>
      
      {loading && ((activeTab === 'calls' && callHistory.length === 0) || (activeTab === 'sms' && smsHistory.length === 0)) && (
        <div style={{ 
          padding: 16, 
          color: darkMode ? '#aaa' : '#666',
          textAlign: 'center',
          fontSize: 15,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>Loading...</div>
      )}
      
      {error && (
        <div style={{ 
          padding: 16, 
          color: '#f44336',
          textAlign: 'center',
          fontSize: 15,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>{error}</div>
      )}
      
      {/* No calls history */}
      {activeTab === 'calls' && callHistory.length === 0 && !loading && !error && (
        <div style={{ 
          padding: '28px 20px', 
          textAlign: 'center',
          color: darkMode ? '#aaa' : '#666',
          backgroundColor: darkMode ? '#1a1a1a' : '#f9f9f9',
          borderRadius: 12,
          boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <div style={{ marginBottom: 14 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 10px', opacity: 0.7 }}>
              <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM12 3v10l3-3h6V3h-9z" fill="currentColor" opacity=".6"/>
            </svg>
          </div>
          <h3 style={{ marginBottom: 8, fontWeight: 500, fontSize: 16 }}>Your call history will appear here</h3>
          <p style={{ fontSize: 14, margin: '0 auto', maxWidth: 300, lineHeight: 1.5 }}>Place a call using the form above to get started. Your complete call history and transcripts will be saved here.</p>
        </div>
      )}
      
      {/* No SMS history */}
      {activeTab === 'sms' && smsHistory.length === 0 && !loading && !error && (
        <div style={{ 
          padding: '28px 20px', 
          textAlign: 'center',
          color: darkMode ? '#aaa' : '#666',
          backgroundColor: darkMode ? '#1a1a1a' : '#f9f9f9',
          borderRadius: 12,
          boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <div style={{ marginBottom: 14 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 10px', opacity: 0.7 }}>
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" fill="currentColor" opacity=".6"/>
            </svg>
          </div>
          <h3 style={{ marginBottom: 8, fontWeight: 500, fontSize: 16 }}>No SMS messages yet</h3>
          <p style={{ fontSize: 14, margin: '0 auto', maxWidth: 300, lineHeight: 1.5 }}>This feature provides basic SMS functionality only. Send a text message to get started. Note that AI capabilities are not yet available in the SMS section.</p>
        </div>
      )}
      
      {/* Calls history list */}
      {activeTab === 'calls' && callHistory.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          <AnimatePresence>
            {callHistory.map((call, idx) => (
              <motion.div
                key={call.call_id || call.id || idx}
                initial={{ opacity: 0.8, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                style={{
                  backgroundColor: darkMode ? 
                    (selectedCallId === (call.call_id || call.id) ? '#1d1e24' : '#18191e') : 
                    (selectedCallId === (call.call_id || call.id) ? '#f8f8f8' : '#ffffff'),
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: selectedCallId === (call.call_id || call.id) ? 
                    '0 3px 12px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  border: `1px solid ${darkMode ? 
                    (selectedCallId === (call.call_id || call.id) ? '#3a3b46' : '#2a2b36') : 
                    (selectedCallId === (call.call_id || call.id) ? '#ddd' : '#eaeaea')}`,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setSelectedCallId(
                  selectedCallId === (call.call_id || call.id) ? null : (call.call_id || call.id)
                )}
                whileHover={{ 
                  boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                  borderColor: darkMode ? '#3a3b46' : '#ddd'
                }}
                layout
              >
                <div style={{ 
                  padding: '16px 18px',
                  borderLeft: `4px solid ${call.status === 'success' || call.status === 'completed' ? '#43a047' : call.status === 'pending' || call.status === 'in-progress' ? '#ff9800' : '#e53935'}`,
                  position: 'relative',
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div>
                      <span style={{ 
                        fontWeight: 600, 
                        fontSize: 16,
                        color: darkMode ? '#eaebef' : '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {call.topic || 'No topic'} 
                        <span style={{ 
                          color: call.status === 'success' || call.status === 'completed' ? '#66bb6a' : 
                                call.status === 'pending' || call.status === 'in-progress' ? '#ffa726' : '#ef5350',
                          fontWeight: 400,
                          fontSize: 13,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: call.status === 'success' || call.status === 'completed' ? 
                            (darkMode ? 'rgba(102, 187, 106, 0.15)' : 'rgba(102, 187, 106, 0.1)') : 
                            call.status === 'pending' || call.status === 'in-progress' ? 
                              (darkMode ? 'rgba(255, 167, 38, 0.15)' : 'rgba(255, 167, 38, 0.1)') : 
                              (darkMode ? 'rgba(239, 83, 80, 0.15)' : 'rgba(239, 83, 80, 0.1)'),
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}>
                          {(call.status === 'success' || call.status === 'completed') && (
                            <svg width="12" height="12" viewBox="0 0 24 24" style={{marginRight: '3px'}}>
                              <path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                            </svg>
                          )}
                          {(call.status === 'pending' || call.status === 'in-progress') && (
                            <svg width="12" height="12" viewBox="0 0 24 24" style={{marginRight: '3px'}}>
                              <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                            </svg>
                          )}
                          {call.status === 'completed' ? 'success' : call.status || 'unknown'}
                        </span>
                      </span>
                      
                      {formatPhoneDetails(call)}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end'
                    }}>
                      <span style={{ 
                        fontSize: 13,
                        color: darkMode ? '#9aa0b5' : '#777',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                      }}>
                        {formatDate(call.call_time || call.timestamp)}
                      </span>
                      
                      <motion.div 
                        style={{
                          marginTop: '8px',
                          color: darkMode ? '#9aa0b5' : '#777',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: selectedCallId === (call.call_id || call.id) ? 
                            (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent'
                        }}
                        whileHover={{ 
                          backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                        }}
                      >
                        <span>{selectedCallId === (call.call_id || call.id) ? 'Hide Details' : 'View Details'}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path 
                            d={selectedCallId === (call.call_id || call.id) 
                              ? "M7.41 15.41L12 10.83L16.59 15.41L18 14L12 8L6 14L7.41 15.41Z" 
                              : "M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z"}
                            fill="currentColor"
                          />
                        </svg>
                      </motion.div>
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
      
      {/* SMS history list */}
      {activeTab === 'sms' && smsHistory.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          <AnimatePresence>
            {smsHistory.map((sms, idx) => (
              <motion.div
                key={sms.id || idx}
                initial={{ opacity: 0.8, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                style={{
                  backgroundColor: darkMode ? '#18191e' : '#ffffff',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  border: `1px solid ${darkMode ? '#2a2b36' : '#eaeaea'}`,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
                onClick={() => setSelectedSmsId(
                  selectedSmsId === sms.id ? null : sms.id
                )}
                layout
              >
                <div style={{ 
                  padding: '15px 18px',
                  borderLeft: `4px solid ${sms.status === 'success' ? '#43a047' : sms.status === 'pending' ? '#ff9800' : '#e53935'}`
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
                        SMS to {sms.phone_number} <span style={{ 
                          color: sms.status === 'success' ? '#66bb6a' : 
                                sms.status === 'pending' ? '#ffa726' : '#ef5350',
                          fontWeight: 400,
                          fontSize: 14
                        }}>
                          ({sms.status || 'unknown'})
                        </span>
                      </span>
                      
                      <div style={{
                        fontSize: '13px',
                        color: darkMode ? '#9aa0b5' : '#666',
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>Message sent: {formatDate(sms.timestamp)}</span>
                      </div>
                    </div>
                    
                    <span style={{ 
                      color: darkMode ? '#aab' : '#999',
                      fontSize: 12
                    }}>
                      {formatDate(sms.timestamp)}
                    </span>
                  </div>
                  
                  {/* Show SMS details when expanded */}
                  {selectedSmsId === sms.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ 
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                      }}
                    >
                      <div style={{ 
                        fontSize: 14,
                        color: darkMode ? '#ddd' : '#555',
                        lineHeight: 1.5 
                      }}>
                        <strong>Message:</strong><br />
                        {sms.message}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default CallHistory;
