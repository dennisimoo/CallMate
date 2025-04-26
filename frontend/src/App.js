import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line no-unused-vars
import { triggerCall, getHistory, getCallTranscript, getCallDetails, getCallRecording } from './api';
import './themeToggle.css';
import './loader.css';
import TypewriterEffect from './TypewriterEffect';

const MAX_CALLS = 5;
const CALLS_KEY = 'plektu_calls_left';
const PHONE_KEY = 'plektu_phone';
const ADMIN_KEY = 'plektu_admin';
const THEME_KEY = 'plektu_theme';

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
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [callsLeft, setCallsLeft] = useState(parseInt(localStorage.getItem(CALLS_KEY) || MAX_CALLS));
  const [activeTab, setActiveTab] = useState('main');
  const [adminPass, setAdminPass] = useState('');
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem(ADMIN_KEY));
  const [alignedTrans, setAlignedTrans] = useState({});
  const [transcriptLoading, setTranscriptLoading] = useState({});
  const [transcriptError, setTranscriptError] = useState({});
  const [recordingUrls, setRecordingUrls] = useState({});
  const [darkMode, setDarkMode] = useState(localStorage.getItem(THEME_KEY) === 'light' ? false : true);
  const [showLoader, setShowLoader] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sample conversation ideas - expanded list (30 total)
  const conversationIdeas = [
    "Tell me about your current health insurance policy",
    "Schedule an appointment for next Tuesday",
    "Follow up on my recent order status",
    "Ask about cancellation policy",
    "Discuss pricing options for your premium plan",
    "Check if my prescription is ready for pickup",
    "Request information about your new service",
    "Ask about payment plans for the premium package",
    "Inquire about job opportunities at your company",
    "Schedule a technician for home installation",
    "Ask about the status of my application",
    "Request a call back from a customer service agent",
    "Check on delivery status for my recent purchase",
    "Discuss the features of your enterprise plan",
    "Get details about warranty coverage for my device",
    "Update my billing information in your system",
    "Ask about return policy for recent purchase",
    "Schedule a demo of your software product",
    "Request a quote for commercial insurance",
    "Cancel my upcoming appointment",
    "Ask about business hours for your store",
    "Inquire about available sizes for a product",
    "Find out if my insurance covers this procedure",
    "Request a change to my subscription plan",
    "Ask about international shipping options",
    "Confirm my reservation for dinner",
    "Schedule a site visit with your consultant",
    "Request a copy of my recent invoice",
    "Ask about discounts for bulk ordering",
    "Inquire about package tracking details"
  ];

  useEffect(() => {
    if (phone) {
      getHistory(phone).then(h => setHistory(h)).catch(() => setHistory([]));
    }
    
    // Add loader timeout
    const timer = setTimeout(() => {
      const loaderElement = document.querySelector('.loader-container');
      if (loaderElement) {
        loaderElement.classList.add('fade-out');
        setTimeout(() => {
          setShowLoader(false);
          // Start showing suggestions with a delay after loader disappears
          setTimeout(() => {
            setShowSuggestions(true);
          }, 1000);
        }, 800); // Match the CSS transition time
      } else {
        setShowLoader(false);
        // Start showing suggestions with a delay
        setTimeout(() => {
          setShowSuggestions(true);
        }, 1000);
      }
    }, 3000); // Changed to 3 seconds
    
    return () => clearTimeout(timer);
  }, [phone]);

  useEffect(() => {
    localStorage.setItem(CALLS_KEY, callsLeft);
    localStorage.setItem(PHONE_KEY, phone);
    localStorage.setItem(ADMIN_KEY, isAdmin.toString());
  }, [callsLeft, phone, isAdmin]);

  // Update document title
  useEffect(() => {
    document.title = "Plektu";
  }, []);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

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

  // Toggle dark/light mode
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const renderMainTab = () => (
    <motion.form 
      onSubmit={handleCall} 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8, 
        ease: [0.2, 0.65, 0.3, 0.9]
      }}
      style={{ 
        background: darkMode ? '#222' : '#fff', 
        color: darkMode ? '#fff' : '#222',
        borderRadius: 10, 
        boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.1)', 
        padding: 28, 
        width: 340, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 16 
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <motion.h2 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 1, 
            ease: [0.2, 0.65, 0.3, 0.9],
            type: "tween" 
          }}
          style={{ 
            margin: 0, 
            color: darkMode ? '#fff' : '#222', 
            fontWeight: 600, 
            fontSize: 22, 
            letterSpacing: -1 
          }}
        >
          Plektu
        </motion.h2>
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 1, 
            ease: [0.2, 0.65, 0.3, 0.9]
          }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <span style={{ fontSize: 12, color: darkMode ? '#ccc' : '#666' }}>by Dennis & Nicholas</span>
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          duration: 0.8, 
          delay: 0.1,
          ease: "easeOut"
        }}
        style={{ fontSize: 14, color: darkMode ? '#ccc' : '#555', marginBottom: 5, lineHeight: 1.4 }}
      >
        Plektu will make an AI-powered call for you. Just enter a phone number and topic to get started!
        {!isAdmin && (
          <div style={{ 
            fontSize: 13, 
            marginTop: 5, 
            color: darkMode ? '#ddd' : '#555', 
            fontWeight: 500 
          }}>
            Available Calls: <span style={{ fontWeight: 600 }}>{callsLeft}</span> / {MAX_CALLS}
          </div>
        )}
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: 0.2,
          ease: "easeOut"
        }}
      >
        <input
          type="tel"
          placeholder="Enter recipient's phone number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={{ 
            padding: 12,
            fontSize: 16,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            borderRadius: 8,
            border: darkMode ? '1px solid #444' : '1px solid #ddd',
            backgroundColor: darkMode ? '#333' : '#fff',
            color: darkMode ? '#fff' : '#333',
            width: '100%',
            boxSizing: 'border-box'
          }}
          required
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: 0.3,
          ease: "easeOut"
        }}
        style={{ position: "relative" }}
      >
        {/* Background suggestion bubbles - reduced to 8 with truly random positions */}
        {showSuggestions && (
          <>
            <div style={{
              position: "absolute",
              pointerEvents: "none", 
              top: -217, 
              left: -376, 
              padding: 10,
              fontSize: 14,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              maxWidth: 200,
              backgroundColor: darkMode ? 'rgba(80,80,80,0.2)' : 'rgba(240,240,240,0.3)',
              backdropFilter: 'blur(2px)',
              zIndex: 1
            }}>
              <TypewriterEffect 
                phrases={[conversationIdeas[0], conversationIdeas[8], conversationIdeas[16], conversationIdeas[24]]} 
                typingSpeed={50} 
                deletingSpeed={30} 
                pauseBetween={2000}
              />
            </div>
            
            <div style={{
              position: "absolute",
              pointerEvents: "none", 
              top: -31, 
              left: -492, 
              padding: 10,
              fontSize: 14,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              maxWidth: 200,
              backgroundColor: darkMode ? 'rgba(80,80,80,0.2)' : 'rgba(240,240,240,0.3)',
              backdropFilter: 'blur(2px)',
              zIndex: 1
            }}>
              <TypewriterEffect 
                phrases={[conversationIdeas[1], conversationIdeas[9], conversationIdeas[17], conversationIdeas[25]]} 
                typingSpeed={45} 
                deletingSpeed={28} 
                pauseBetween={1900}
              />
            </div>
            
            <div style={{
              position: "absolute",
              pointerEvents: "none", 
              top: -197, 
              right: -351, 
              padding: 10,
              fontSize: 14,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              maxWidth: 200,
              backgroundColor: darkMode ? 'rgba(80,80,80,0.2)' : 'rgba(240,240,240,0.3)',
              backdropFilter: 'blur(2px)',
              zIndex: 1
            }}>
              <TypewriterEffect 
                phrases={[conversationIdeas[2], conversationIdeas[10], conversationIdeas[18], conversationIdeas[26]]} 
                typingSpeed={60} 
                deletingSpeed={40} 
                pauseBetween={1800}
              />
            </div>
            
            <div style={{
              position: "absolute",
              pointerEvents: "none", 
              top: -42, 
              right: -512, 
              padding: 10,
              fontSize: 14,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              maxWidth: 200,
              backgroundColor: darkMode ? 'rgba(80,80,80,0.2)' : 'rgba(240,240,240,0.3)',
              backdropFilter: 'blur(2px)',
              zIndex: 1
            }}>
              <TypewriterEffect 
                phrases={[conversationIdeas[3], conversationIdeas[11], conversationIdeas[19], conversationIdeas[27]]} 
                typingSpeed={55} 
                deletingSpeed={35} 
                pauseBetween={2100}
              />
            </div>
            
            <div style={{
              position: "absolute",
              pointerEvents: "none", 
              bottom: -227, 
              right: -375, 
              padding: 10,
              fontSize: 14,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              maxWidth: 200,
              backgroundColor: darkMode ? 'rgba(80,80,80,0.2)' : 'rgba(240,240,240,0.3)',
              backdropFilter: 'blur(2px)',
              zIndex: 1
            }}>
              <TypewriterEffect 
                phrases={[conversationIdeas[4], conversationIdeas[12], conversationIdeas[20], conversationIdeas[28]]} 
                typingSpeed={40} 
                deletingSpeed={30} 
                pauseBetween={2200}
              />
            </div>
            
            <div style={{
              position: "absolute",
              pointerEvents: "none", 
              bottom: -47, 
              right: -498, 
              padding: 10,
              fontSize: 14,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              maxWidth: 200,
              backgroundColor: darkMode ? 'rgba(80,80,80,0.2)' : 'rgba(240,240,240,0.3)',
              backdropFilter: 'blur(2px)',
              zIndex: 1
            }}>
              <TypewriterEffect 
                phrases={[conversationIdeas[5], conversationIdeas[13], conversationIdeas[21], conversationIdeas[29]]} 
                typingSpeed={48} 
                deletingSpeed={32} 
                pauseBetween={1950}
              />
            </div>
            
            <div style={{
              position: "absolute",
              pointerEvents: "none", 
              bottom: -185, 
              left: -408, 
              padding: 10,
              fontSize: 14,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              maxWidth: 200,
              backgroundColor: darkMode ? 'rgba(80,80,80,0.2)' : 'rgba(240,240,240,0.3)',
              backdropFilter: 'blur(2px)',
              zIndex: 1
            }}>
              <TypewriterEffect 
                phrases={[conversationIdeas[6], conversationIdeas[14], conversationIdeas[22], conversationIdeas[15]]} 
                typingSpeed={52} 
                deletingSpeed={33} 
                pauseBetween={2100}
              />
            </div>
            
            <div style={{
              position: "absolute",
              pointerEvents: "none", 
              bottom: -59, 
              left: -536, 
              padding: 10,
              fontSize: 14,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              maxWidth: 200,
              backgroundColor: darkMode ? 'rgba(80,80,80,0.2)' : 'rgba(240,240,240,0.3)',
              backdropFilter: 'blur(2px)',
              zIndex: 1
            }}>
              <TypewriterEffect 
                phrases={[conversationIdeas[7], conversationIdeas[15], conversationIdeas[23], conversationIdeas[0]]} 
                typingSpeed={43} 
                deletingSpeed={27} 
                pauseBetween={2300}
              />
            </div>
          </>
        )}
  
        <textarea
          placeholder="Describe your conversation topic"
          value={topic}
          onChange={e => {
            setTopic(e.target.value);
          }}
          onClick={() => {
            // No longer hiding suggestions on click
          }}
          style={{ 
            padding: 12,
            fontSize: 16,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            borderRadius: 8,
            border: darkMode ? '1px solid #444' : '1px solid #ddd',
            backgroundColor: darkMode ? '#333' : '#fff',
            color: darkMode ? '#fff' : '#333',
            minHeight: 48,
            resize: 'vertical',
            width: '100%',
            boxSizing: 'border-box',
            position: "relative",
            zIndex: 2
          }}
          required
        />
      </motion.div>
      
      <motion.button 
        type="submit" 
        disabled={loading || (!isAdmin && callsLeft === 0)} 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: 0.4,
          ease: "easeOut"
        }}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        whileTap={{ 
          scale: 0.98,
          transition: { duration: 0.1, ease: "easeOut" }
        }}
        style={{ 
          padding: 12,
          fontSize: 16,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: 8,
          border: 'none',
          background: darkMode ? '#444' : '#222',
          color: '#fff',
          cursor: loading || (!isAdmin && callsLeft === 0) ? 'not-allowed' : 'pointer',
          fontWeight: 500,
          width: '100%'
        }}
      >
        {loading ? 'Calling...' : 'Call'}
      </motion.button>
      
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: 0.8, 
            delay: 0.5,
            ease: "easeOut"
          }}
          style={{ fontSize: 14, color: darkMode ? '#ddd' : '#555', textAlign: 'center' }}
        >
          Admin Mode - Unlimited Calls
          <motion.button 
            onClick={handleLogout} 
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            whileTap={{ 
              scale: 0.95,
              transition: { duration: 0.1, ease: "easeOut" }
            }}
            style={{ 
              marginLeft: 8, 
              fontSize: 12, 
              padding: '4px 8px', 
              border: 'none', 
              background: darkMode ? '#333' : '#f0f0f0', 
              color: darkMode ? '#fff' : '#333',
              borderRadius: 4, 
              cursor: 'pointer' 
            }}
          >
            Logout
          </motion.button>
        </motion.div>
      )}
      
      <AnimatePresence>
        {status && (
          <motion.div 
            initial={{ opacity: 0, y: 5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            transition={{ 
              duration: 0.5,
              ease: "easeInOut"
            }}
            style={{ 
              marginTop: 8, 
              padding: '12px', 
              borderRadius: '8px',
              backgroundColor: darkMode 
                ? (status.includes('Call triggered') ? 'rgba(46, 125, 50, 0.2)' : (status.startsWith('This topic') || status.startsWith('You have reached')) ? 'rgba(176, 0, 32, 0.2)' : 'rgba(255, 255, 255, 0.1)') 
                : (status.includes('Call triggered') ? '#e8f5e9' : (status.startsWith('This topic') || status.startsWith('You have reached')) ? '#ffebee' : '#f5f5f5'),
              color: darkMode 
                ? (status.includes('Call triggered') ? '#81c784' : (status.startsWith('This topic') || status.startsWith('You have reached')) ? '#f48fb1' : '#fff')
                : (status.includes('Call triggered') ? '#2e7d32' : (status.startsWith('This topic') || status.startsWith('You have reached')) ? '#b00020' : '#333'),
              fontWeight: 500, 
              textAlign: 'center',
              boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {status.replace('Bland.ai call triggered!', 'Call triggered!')}
            {status.includes('Call triggered') && (
              <div style={{marginTop: 5, fontSize: 13, fontWeight: 'normal'}}>
                The number you chose will receive a call shortly. Please wait...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {history.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.5,
              ease: "easeOut"
            }}
            style={{marginTop: 18}}
          >
            <div style={{fontWeight: 600, marginBottom: 6, fontSize: 15, color: darkMode ? '#fff' : '#333'}}>Call History</div>
            <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
              {history.map((call, i) => (
                <motion.li 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.5 + (i * 0.05),
                    ease: "easeOut"
                  }}
                  style={{
                    borderBottom: darkMode ? '1px solid #333' : '1px solid #eee', 
                    marginBottom: 7, 
                    paddingBottom: 7
                  }}
                >
                  <div style={{fontSize: 13, color: darkMode ? '#fff' : '#333'}}>
                    <b>{call.topic}</b> <span style={{color: call.status === 'success' ? (darkMode ? '#81c784' : '#388e3c') : (darkMode ? '#f48fb1' : '#b00020')}}>({call.status})</span>
                    {call.timestamp && <span style={{marginLeft: 6, color: darkMode ? '#999' : '#888'}}>{getPSTTimeString(call.timestamp)}</span>}
                  </div>
                  {call.call_id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ 
                        duration: 0.6,
                        ease: "easeOut"
                      }}
                      style={{
                        fontSize: 12, 
                        color: darkMode ? '#ccc' : '#444', 
                        background: darkMode ? '#333' : '#f5f5f5', 
                        borderRadius: 5, 
                        padding: 7, 
                        marginTop: 5, 
                        whiteSpace: 'pre-wrap', 
                        minHeight: 28
                      }}
                    >
                      {/* Display audio player for recordings */}
                      {recordingUrls[call.call_id] && (
                        <div style={{marginBottom: 8}}>
                          <audio src={recordingUrls[call.call_id]} controls style={{width: '100%', height: 30}} />
                        </div>
                      )}
                      
                      {transcriptError[call.call_id] && (
                        <div style={{color: darkMode ? '#f48fb1' : '#b00020', fontStyle: 'italic'}}>Transcript error: {transcriptError[call.call_id]}</div>
                      )}
                      {transcriptLoading[call.call_id] && (!alignedTrans[call.call_id] || alignedTrans[call.call_id].length === 0) && !transcriptError[call.call_id] && (
                        <div style={{color: darkMode ? '#999' : '#888', fontStyle: 'italic'}}>Waiting for transcript...</div>
                      )}
                      {alignedTrans[call.call_id] && alignedTrans[call.call_id].length > 0 && alignedTrans[call.call_id].map((seg, j) => (
                        <motion.div 
                          key={j} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ 
                            duration: 0.4, 
                            delay: j * 0.03,
                            ease: "easeOut"
                          }}
                          style={{marginBottom: 2}}
                        >
                          <b style={{color: seg.speaker === 'user' ? (darkMode ? '#90caf9' : '#1976d2') : (darkMode ? '#a5d6a7' : '#43a047')}}>
                            {seg.speaker === 'user' ? 'User' : 'Agent'}:
                          </b> {seg.text}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
  
  const renderAdminTab = () => (
    <motion.form 
      onSubmit={handleAdminLogin} 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8, 
        ease: [0.2, 0.65, 0.3, 0.9]
      }}
      style={{ 
        background: darkMode ? '#222' : '#fff', 
        color: darkMode ? '#fff' : '#222',
        borderRadius: 10, 
        boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.1)', 
        padding: 28, 
        width: 340, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 16 
      }}
    >
      <motion.h2 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ 
          duration: 1, 
          ease: [0.2, 0.65, 0.3, 0.9],
          type: "tween"
        }}
        style={{ margin: 0, color: darkMode ? '#fff' : '#222', fontWeight: 600, fontSize: 22, letterSpacing: -1 }}
      >
        Admin Login
      </motion.h2>
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: 0.2,
          ease: "easeOut"
        }}
      >
        <input
          type="password"
          placeholder="Admin Password"
          value={adminPass}
          onChange={e => setAdminPass(e.target.value)}
          style={{ 
            padding: 12,
            fontSize: 16,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            borderRadius: 8,
            border: darkMode ? '1px solid #444' : '1px solid #ddd',
            backgroundColor: darkMode ? '#333' : '#fff',
            color: darkMode ? '#fff' : '#333',
            width: '100%',
            boxSizing: 'border-box'
          }}
          required
        />
      </motion.div>
      
      <motion.button 
        type="submit" 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: 0.3,
          ease: "easeOut"
        }}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        whileTap={{ 
          scale: 0.98,
          transition: { duration: 0.1, ease: "easeOut" }
        }}
        style={{ 
          padding: 12,
          fontSize: 16,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: 8,
          border: 'none',
          background: darkMode ? '#444' : '#222',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 500,
          width: '100%'
        }}
      >
        Login
      </motion.button>
    </motion.form>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: darkMode ? '#111' : '#f7f7f7', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center',
      transition: 'background 0.5s ease'
    }}>
      {showLoader && (
        <div className="loader-container">
          <div className="loader">
            <div className="loader-square"></div>
            <div className="loader-square"></div>
            <div className="loader-square"></div>
            <div className="loader-square"></div>
            <div className="loader-square"></div>
            <div className="loader-square"></div>
            <div className="loader-square"></div>
          </div>
        </div>
      )}
      
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.8,
          ease: "easeOut"
        }}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '340px', 
          marginBottom: 16 
        }}
      >
        <div style={{ display: 'flex', gap: 5 }}>
          <motion.button 
            onClick={() => setActiveTab('main')} 
            whileHover={{ 
              scale: 1.03,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            whileTap={{ 
              scale: 0.97,
              transition: { duration: 0.1, ease: "easeOut" }
            }}
            style={{ 
              padding: '8px 16px', 
              fontSize: 14, 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              border: 'none', 
              background: activeTab === 'main' ? (darkMode ? '#444' : '#222') : (darkMode ? '#333' : '#e0e0e0'), 
              color: activeTab === 'main' ? '#fff' : (darkMode ? '#ccc' : '#222'), 
              borderRadius: 6, 
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Home
          </motion.button>
          <motion.button 
            onClick={() => setActiveTab('admin')} 
            whileHover={{ 
              scale: 1.03,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            whileTap={{ 
              scale: 0.97,
              transition: { duration: 0.1, ease: "easeOut" }
            }}
            style={{ 
              padding: '8px 16px', 
              fontSize: 14, 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              border: 'none', 
              background: activeTab === 'admin' ? (darkMode ? '#444' : '#222') : (darkMode ? '#333' : '#e0e0e0'), 
              color: activeTab === 'admin' ? '#fff' : (darkMode ? '#ccc' : '#222'), 
              borderRadius: 6, 
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Admin
          </motion.button>
        </div>
        <motion.label 
          className="switch"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: 0.8, 
            delay: 0.1,
            ease: "easeOut"
          }}
        >
          <input id="input" type="checkbox" checked={darkMode} onChange={toggleTheme} />
          <div className="slider round">
            <div className="sun-moon">
              <svg id="moon-dot-1" className="moon-dot" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="moon-dot-2" className="moon-dot" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="moon-dot-3" className="moon-dot" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="light-ray-1" className="light-ray" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="light-ray-2" className="light-ray" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="light-ray-3" className="light-ray" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="cloud-1" className="cloud-dark" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="cloud-2" className="cloud-dark" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="cloud-3" className="cloud-dark" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="cloud-4" className="cloud-light" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="cloud-5" className="cloud-light" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
              <svg id="cloud-6" className="cloud-light" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50"></circle>
              </svg>
            </div>
            <div className="stars">
              <svg id="star-1" className="star" viewBox="0 0 20 20">
                <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
              </svg>
              <svg id="star-2" className="star" viewBox="0 0 20 20">
                <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
              </svg>
              <svg id="star-3" className="star" viewBox="0 0 20 20">
                <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
              </svg>
              <svg id="star-4" className="star" viewBox="0 0 20 20">
                <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
              </svg>
            </div>
          </div>
        </motion.label>
      </motion.div>
      
      <AnimatePresence mode="wait">
        {activeTab === 'main' ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ 
              duration: 0.6,
              ease: [0.2, 0.65, 0.3, 0.9]
            }}
          >
            {renderMainTab()}
          </motion.div>
        ) : (
          <motion.div
            key="admin"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ 
              duration: 0.6,
              ease: [0.2, 0.65, 0.3, 0.9]
            }}
          >
            {renderAdminTab()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
