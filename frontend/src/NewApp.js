import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHistory, getCallTranscript, getCallDetails, getCallRecording } from './api';
import './themeToggle.css';
import './App.css';
import Auth from './components/Auth';
import Header from './components/Header';
import Settings from './components/Settings';
import Feedback from './components/Feedback';
import CallDetails from './components/CallDetails';
import CallHistory from './components/CallHistory';
import MainForm from './components/MainForm';
import PremiumForm from './components/PremiumForm';
import { supabase } from './supabaseClient';
import { validatePremiumCode, handlePremiumSuccess } from './utils/PremiumTransition';
import { getPSTTimeString } from './utils/TimeFormatter';
import { handleCallRequest } from './utils/CallHandlers';
import { fetchUserPreferences, saveUserPreferences, handleSignOut } from './utils/AuthHandlers';
import useNavigation from './hooks/useNavigation';
import useWindowSize from './hooks/useWindowSize';

// Constants
const MAX_CALLS = 10;
const CALLS_KEY = 'plektu_calls_left';
const PHONE_KEY = 'plektu_phone';
const ADMIN_KEY = 'plektu_admin';
const THEME_KEY = 'plektu_theme';

function App() {
  // Use custom hooks
  const { activeTab, setActiveTab } = useNavigation();
  const { width, height, setWindowSize } = useWindowSize();
  
  // State variables
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('');
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [callsLeft, setCallsLeft] = useState(() => {
    // Always set from correct source on load
    const stored = localStorage.getItem(CALLS_KEY);
    return stored ? parseInt(stored, 10) : MAX_CALLS;
  });
  const [adminPass, setAdminPass] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [alignedTrans, setAlignedTrans] = useState({});
  const [transcriptLoading, setTranscriptLoading] = useState({});
  const [transcriptError, setTranscriptError] = useState({});
  const [recordingUrls, setRecordingUrls] = useState({});
  const [darkMode, setDarkMode] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState(() => {
    return darkMode ? '#111' : '#f7f7f7';
  });
  const [guestChatHistory, setGuestChatHistory] = useState(() => {
    const stored = localStorage.getItem('guest_chat_history');
    return stored ? JSON.parse(stored) : [];
  });
  const [lastUpdated, setLastUpdated] = useState('');
  const [session, setSession] = useState(null);
  const [bypassAuth, setBypassAuth] = useState(localStorage.getItem('bypass_auth') === 'true');
  const [userPreferences, setUserPreferences] = useState({
    darkMode: true,
    isAdmin: false,
    callsLeft: MAX_CALLS,
    phoneNumber: ''
  });
  const [appVersion, setAppVersion] = useState('2.0.0');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loaderShown, setLoaderShown] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [topicSummary, setTopicSummary] = useState('');

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserPreferences(
          session.user.id,
          setDarkMode,
          setIsAdmin,
          setCallsLeft,
          setPhone,
          setUserPreferences
        );
      }
    });

    // Set up auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserPreferences(
          session.user.id,
          setDarkMode,
          setIsAdmin,
          setCallsLeft,
          setPhone,
          setUserPreferences
        );
      }
    });

    // Parse URL for error parameters from OAuth flow
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const errorDesc = urlParams.get('error_description');
    
    if (errorParam) {
      console.error('OAuth error:', errorParam, errorDesc);
      
      // If we get a code exchange error but have valid user session, ignore it
      if (errorParam === 'server_error' && errorDesc?.includes('Unable to exchange external code')) {
        console.log('Proceeding despite OAuth code exchange error');
        localStorage.setItem('bypass_auth', 'true');
        setBypassAuth(true);
        
        // Remove error params from URL without refreshing page
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  // Theme handling
  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
    
    // Save to Supabase if user is logged in
    if (session?.user?.id) {
      saveUserPreferences(session, darkMode, isAdmin, callsLeft, phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [darkMode]);

  useEffect(() => {
    if (session?.user?.id) {
      // Only save if we have some changes and the user is logged in
      saveUserPreferences(session, darkMode, isAdmin, callsLeft, phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callsLeft, isAdmin, phone]);

  // Load call history when phone or user changes
  useEffect(() => {
    // Fetch call history based on user ID, not phone number for logged-in users
    if (session?.user?.id) {
      // For logged-in users, fetch all of their call history regardless of phone number
      getHistory(null, session.user.id).then(h => {
        console.log("Fetched user history:", h);
        setHistory(h);
      }).catch((err) => {
        console.error("Error fetching history:", err);
        setHistory([]);
      });
    } else if (phone) {
      // For guests, still use phone-based history
      getHistory(phone).then(h => setHistory(h)).catch(() => setHistory([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, session?.user?.id]);

  // Loader handling
  useEffect(() => {
    // Only show loader once after login
    if ((session || bypassAuth) && !loaderShown) {
      let loaderElement = document.querySelector('.loader-container');
      
      // If no loader exists, create one
      if (!loaderElement) {
        loaderElement = document.createElement('div');
        loaderElement.className = 'loader-container';
        loaderElement.innerHTML = `
          <div class="loader">
            <div class="loader-square"></div>
            <div class="loader-square"></div>
            <div class="loader-square"></div>
            <div class="loader-square"></div>
            <div class="loader-square"></div>
            <div class="loader-square"></div>
            <div class="loader-square"></div>
          </div>
        `;
        document.body.appendChild(loaderElement);
        setLoaderShown(true);
        
        // Keep loader visible for 3 seconds then fade out
        setTimeout(() => {
          if (loaderElement) {
            loaderElement.classList.add('fade-out');
            
            // Remove the element completely after animation finishes
            setTimeout(() => {
              if (loaderElement && loaderElement.parentNode) {
                loaderElement.parentNode.removeChild(loaderElement);
              }
            }, 1000); // Remove after fade completes
          }
        }, 3000); // 3 second delay before fading
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, bypassAuth, loaderShown]);

  // Version and app info
  useEffect(() => {
    // Fetch the latest commit info from GitHub
    fetch('https://api.github.com/repos/dennisimoo/CallMate/commits?per_page=1')
      .then(response => response.json())
      .then(data => {
        if (data && data[0] && data[0].commit) {
          const date = new Date(data[0].commit.author.date);
          setLastUpdated(date);
        }
      })
      .catch(error => console.error('Error fetching repo data:', error));

    // Fetch app version from Supabase
    async function fetchVersion() {
      try {
        const { data, error } = await supabase
          .from('app_versions')
          .select('version')
          .order('deployed_at', { ascending: false })
          .limit(1)
          .single();
        if (data?.version) setAppVersion(data.version);
      } catch (err) {
        setAppVersion('');
      }
    }
    fetchVersion();
    
    // Set document title
    document.title = "Plektu";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh transcript polling
  useEffect(() => {
    // Auto-refresh transcript for successful calls (more frequent polling)
    const interval = setInterval(() => {
      // Update status messages and history automatically after a call is triggered
      if (status.includes('Call triggered')) {
        getHistory(phone, session?.user?.id).then(h => setHistory(h)).catch(() => {});
      }
      
      history.forEach(call => {
        if (call.call_id && call.status === 'success') {
          // Fetch transcript
          setTranscriptLoading(tl => ({ ...tl, [call.call_id]: true }));
          getCallTranscript(call.call_id).then(data => {
            if (Array.isArray(data.aligned) && data.aligned.length > 0) {
              setAlignedTrans(at => ({ ...at, [call.call_id]: data.aligned }));
            }
            setTranscriptLoading(tl => ({ ...tl, [call.call_id]: false }));
          }).catch(error => {
            console.error('Transcript error:', error);
            setTranscriptError(te => ({ ...te, [call.call_id]: error }));
            setTranscriptLoading(tl => ({ ...tl, [call.call_id]: false }));
          });
          
          // Fetch recording URL (less frequent)
          if (!recordingUrls[call.call_id]) {
            getCallRecording(call.call_id).then(data => {
              if (data.recording_url) {
                setRecordingUrls(ru => ({ ...ru, [call.call_id]: data.recording_url }));
              }
            }).catch(() => {
              // Just skip if recording not available
            });
          }
        }
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, status, phone, session]);

  // Handle call submission
  const handleCall = async (e) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);
    
    try {
      console.log("Call attempt - isAdmin:", isAdmin, "callsLeft:", callsLeft, "phone:", phone);
      
      const result = await handleCallRequest({
        phone,
        topic,
        isAdmin,
        callsLeft,
        session,
        setStatus,
        setCallsLeft,
        setActiveTab
      });
      
      setStatus(result.message || (result.success ? 'Call placed successfully!' : 'Call failed.'));
    } catch (error) {
      setStatus((error && error.message) || 'Call failed.');
    }
    
    setLoading(false);
  };

  // Premium code activation
  const handleAdminLogin = (e) => {
    e.preventDefault();
    
    if (validatePremiumCode(adminPass)) {
      handlePremiumSuccess(setIsAdmin, setAdminPass, setActiveTab, setShowPremiumPopup);
    } else {
      alert('Incorrect premium code');
    }
  };

  // Admin logout (return to regular user)
  const handleLogout = () => {
    setIsAdmin(false);
  };

  // Toggle dark/light mode
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    setBackgroundColor(darkMode ? '#f7f7f7' : '#111');
  };

  // Handle feedback submissions
  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      alert('Please enter your feedback');
      return;
    }
    
    // Prevent spam submissions
    if (loading) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Store feedback in Supabase
      const feedbackData = {
        user_id: session?.user?.id || 'guest',
        message: feedback,
        timestamp: new Date().toISOString()
      };
      
      if (supabase) {
        const { error } = await supabase
          .from('feedback')
          .insert(feedbackData);
          
        if (error) throw error;
      }
      
      alert('Thank you for your feedback!');
      setFeedback('');
      setActiveTab('main'); // Return to main tab after submission
      
      // Add a cooldown period to prevent spam
      setTimeout(() => {
        setLoading(false);
      }, 5000); // 5 second cooldown
    } catch (err) {
      console.error('Error saving feedback:', err);
      alert('Error submitting feedback. Please try again.');
      setLoading(false);
    }
  };

  // Tab content rendering functions
  const renderMainTab = () => (
    <MainForm
      handleCall={handleCall}
      phone={phone}
      setPhone={setPhone}
      topic={topic}
      setTopic={setTopic}
      isAdmin={isAdmin}
      callsLeft={callsLeft}
      loading={loading}
      status={status}
      darkMode={darkMode}
      handleLogout={handleLogout}
      windowSize={{ width, height }}
    />
  );
  
  const renderPremiumTab = () => (
    <PremiumForm
      handleAdminLogin={handleAdminLogin}
      adminPass={adminPass}
      setAdminPass={setAdminPass}
      darkMode={darkMode}
      windowSize={{ width, height }}
    />
  );

  const renderChatHistoryTab = () => (
    <CallHistory 
      phone={phone} 
      userId={session?.user?.id} 
      darkMode={darkMode} 
    />
  );

  // Main render
  return (
    <div 
      style={{
        transition: "background 0.3s ease",
        background: backgroundColor,
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {!session && !bypassAuth ? (
        <Auth />
      ) : (
        <>
          <Header 
            darkMode={darkMode} 
            toggleTheme={toggleTheme} 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isAdmin={isAdmin}
            onSignOut={handleSignOut}
            windowSize={{ width, height }}
          />
          
          <AnimatePresence mode="wait">
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 60px)',
                width: '100%',
                maxWidth: '100%',
                position: 'relative',
                paddingTop: 60
              }}
            >
              {activeTab === 'main' && renderMainTab()}
              {activeTab === 'premium' && renderPremiumTab()}
              {activeTab === 'chat' && renderChatHistoryTab()}
              {activeTab === 'settings' && (
                <Settings 
                  darkMode={darkMode} 
                  toggleTheme={toggleTheme}
                  windowSize={{ width, height }}
                />
              )}
              {activeTab === 'feedback' && (
                <Feedback
                  feedback={feedback}
                  setFeedback={setFeedback}
                  handleSubmit={handleFeedbackSubmit}
                  darkMode={darkMode}
                  windowSize={{ width, height }}
                  loading={loading}
                />
              )}

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8,
                  delay: 0.5,
                  ease: "easeOut"
                }}
                style={{
                  position: 'absolute',
                  bottom: 15,
                  fontSize: 12,
                  color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5
                }}
              >
                <div>
                  by <a 
                    href="https://github.com/dennisimoo" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: darkMode ? '#8ee' : '#0077cc', textDecoration: 'none' }}
                  >
                    Dennis K.
                  </a> & <a 
                    href="https://github.com/Neekoras" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: darkMode ? '#8ee' : '#0077cc', textDecoration: 'none' }}
                  >
                    Nicholas L.
                  </a> & <a 
                    href="https://www.youtube.com/@julianwhitfield2158" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: darkMode ? '#8ee' : '#0077cc', textDecoration: 'none' }}
                  >
                    Julian W.
                  </a>
                </div>

                {lastUpdated && (
                  <div style={{ fontSize: 11 }}>
                    Last updated: {lastUpdated.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          </AnimatePresence>

          {/* Show the premium popup modal when needed */}
          {showPremiumPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{  
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                zIndex: 1000,
                backdropFilter: 'blur(3px)'
              }}
              onClick={() => setShowPremiumPopup(false)}
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                style={{ 
                  backgroundColor: darkMode ? '#222' : '#fff',
                  padding: 24,
                  borderRadius: 12,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  maxWidth: 320,
                  textAlign: 'center',
                  color: darkMode ? '#fff' : '#333',
                  pointerEvents: 'all'
                }}
                onClick={e => e.stopPropagation()}
              >
                <h2 style={{ marginTop: 0, fontSize: 24, fontWeight: 700 }}>Premium Active!</h2>
                <div style={{ 
                  margin: '15px 0',
                  padding: '10px 15px',
                  backgroundColor: darkMode ? '#333' : '#f7f7f7',
                  borderRadius: 8,
                  color: darkMode ? '#8ee' : '#0077cc',
                  fontWeight: 500,
                  fontSize: 14,
                }}>
                  You now have unlimited calls and
                  <br/>no content restrictions!
                </div>
                <p style={{ fontSize: 14, marginBottom: 15, color: darkMode ? '#bbb' : '#666' }}>
                  Enjoy the full capabilities of Plektu's premium features. You can make as many calls as you want.
                </p>
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgb(136, 238, 238)',
                    color: '#222',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600, 
                    fontSize: 14
                  }}
                  onClick={() => setShowPremiumPopup(false)}
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
