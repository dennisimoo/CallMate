import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line no-unused-vars
import { triggerCall, getHistory, getCallTranscript, getCallDetails, getCallRecording } from './api';
import './themeToggle.css';
import './App.css';
import Auth from './components/Auth';
import Header from './components/Header';
// eslint-disable-next-line no-unused-vars
import Settings from './components/Settings';
// eslint-disable-next-line no-unused-vars
import Feedback from './components/Feedback';
import CallDetails from './components/CallDetails';
import CallHistory from './components/CallHistory';
import { supabase } from './supabaseClient';
import { moderateTopic } from './utils/ContentModeration';

const MAX_CALLS = 10;
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
  const [activeTab, setActiveTab] = useState('main');
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
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [lastUpdated, setLastUpdated] = useState('');
  const [session, setSession] = useState(null);
  const [bypassAuth, setBypassAuth] = useState(localStorage.getItem('bypass_auth') === 'true');
  // eslint-disable-next-line no-unused-vars
  const [userPreferences, setUserPreferences] = useState({
    darkMode: true,
    isAdmin: false,
    callsLeft: MAX_CALLS,
    phoneNumber: ''
  });
  const [appVersion, setAppVersion] = useState('2.0.0');
  // eslint-disable-next-line no-unused-vars
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loaderShown, setLoaderShown] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const [topicSummary, setTopicSummary] = useState('');

  const fetchGeminiSummary = async (topic) => {
    if (!topic) return '';
    // Just use the topic directly, no API call needed
    setTopicSummary(topic);
  };

  useEffect(() => {
    if (topic) fetchGeminiSummary(topic);
    else setTopicSummary('');
  }, [topic]);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserPreferences(session.user.id);
      }
    });

    // Set up auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserPreferences(session.user.id);
      }
    });

    // Parse URL for error parameters from OAuth flow
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const errorDesc = urlParams.get('error_description');
    
    if (errorParam) {
      console.error('OAuth error:', errorParam, errorDesc);
      
      // If we get a code exchange error but have valid user session, ignore it
      // This can happen when the OAuth callback completes but has trouble with code exchange
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

  // Fetch user preferences from Supabase
  const fetchUserPreferences = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching preferences:', error);
        return;
      }

      if (data) {
        // Update local state from preferences
        setDarkMode(data.dark_mode !== false); // Default to dark mode if not specified
        setIsAdmin(data.is_admin || false);
        // Set calls_left to MAX_CALLS (or higher) for premium users, otherwise use the stored value
        const userCallsLeft = data.is_admin ? 100 : (data.calls_left || MAX_CALLS);
        setCallsLeft(userCallsLeft);
        setPhone(data.phone_number || '');
        
        // Update consolidated state
        setUserPreferences({
          darkMode: data.dark_mode !== false,
          isAdmin: data.is_admin || false,
          callsLeft: userCallsLeft,
          phoneNumber: data.phone_number || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  // Save preferences to Supabase
  const saveUserPreferences = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          dark_mode: darkMode,
          is_admin: isAdmin,
          calls_left: callsLeft,
          phone_number: phone,
          updated_at: new Date()
        });

      if (error) {
        console.error('Error saving preferences:', error);
      }
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  };

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
    
    // Save to Supabase if user is logged in
    if (session?.user?.id) {
      saveUserPreferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [darkMode]);

  useEffect(() => {
    if (session?.user?.id) {
      // Only save if we have some changes and the user is logged in
      saveUserPreferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callsLeft, isAdmin, phone]);

  useEffect(() => {
    // Fetch call history based on user ID, not phone number for logged-in users
    if (session?.user?.id) {
      // For logged-in users, fetch all of their call history regardless of phone number
      // This ensures premium users can see all their calls
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

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update callsLeft based on user type
  useEffect(() => {
    if (session?.user?.id) {
      // Authenticated user always gets 5 calls
      setCallsLeft(parseInt(localStorage.getItem(CALLS_KEY) || '5'));
    } else {
      // Guest user always gets 3 calls
      setCallsLeft(parseInt(localStorage.getItem(CALLS_KEY) || '3'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    localStorage.setItem(CALLS_KEY, String(callsLeft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callsLeft]);

  // Sign out function
  const handleSignOut = async () => {
    // Clear authentication state
    await supabase.auth.signOut();
    
    // Clear bypass auth flag if it exists
    localStorage.removeItem('bypass_auth');
    
    // Clear other stored values 
    localStorage.removeItem(CALLS_KEY);
    localStorage.removeItem(PHONE_KEY);
    localStorage.removeItem(ADMIN_KEY);
    
    // Force refresh to show login screen
    window.location.reload();
  };

  // Save message to chat history in Supabase or localStorage for guests
  const saveChatToHistory = async (message) => {
    if (session?.user?.id) {
      try {
        const response = await fetch('/chat_history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: session.user.id,
            message: message
          })
        });
        if (!response.ok) {
          console.error('Failed to save chat to history');
        }
      } catch (error) {
        console.error('Error saving chat to history:', error);
      }
    } else {
      // Guest: Save to localStorage
      const updatedHistory = [...guestChatHistory, { message, timestamp: new Date().toISOString() }];
      setGuestChatHistory(updatedHistory);
      localStorage.setItem('guest_chat_history', JSON.stringify(updatedHistory));
    }
  };

  const handleCall = async (e) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);
    
    try {
      console.log("Call attempt - isAdmin:", isAdmin, "callsLeft:", callsLeft, "phone:", phone);
      
      // PREMIUM USERS SHOULD ALWAYS BE ABLE TO MAKE CALLS
      // Only restrict non-premium users based on call limit
      if (!isAdmin && callsLeft <= 0) {
        setStatus('You have reached the maximum number of calls for your account.');
        setLoading(false);
        return;
      }

      // Use the ContentModeration utility for client-side moderation
      const moderationResult = moderateTopic(topic, isAdmin);
      if (!moderationResult.allowed) {
        setStatus(moderationResult.reason);
        setLoading(false);
        return;
      }

      // If premium, pass a flag to bypass moderation and set longer call time
      const premiumFlag = isAdmin ? { premium: true, max_time: 180 } : { max_time: 60 };
      // Include user_id if available
      const userIdFlag = session?.user?.id ? { user_id: session.user.id } : {};

      // Actually make the call
      const callRes = await triggerCall(phone, topic, { ...premiumFlag, ...userIdFlag });
      let latestCallId = null;
      if (callRes && callRes.call_id) {
        latestCallId = callRes.call_id;
        
        // Save call to appropriate history store
        if (session?.user?.id) {
          // For signed-in users, save to Supabase
          try {
            const { error } = await supabase
              .from('call_history')
              .insert({
                user_id: session.user.id,
                phone_number: phone,
                call_id: callRes.call_id,
                topic,
                status: callRes.status || 'pending',
                call_time: new Date().toISOString()
              });
              
            if (error) {
              console.error('Error saving call to Supabase:', error);
              // Save to localStorage as backup if Supabase fails
              const guestHistory = JSON.parse(localStorage.getItem('plektu_guest_call_history') || '[]');
              const newCall = {
                call_id: callRes.call_id,
                topic,
                status: callRes.status || 'pending',
                call_time: new Date().toISOString(),
              };
              const updatedGuestHistory = [newCall, ...guestHistory];
              localStorage.setItem('plektu_guest_call_history', JSON.stringify(updatedGuestHistory));
            } else {
              console.log('Successfully saved call to Supabase');
              
              // Also update user's calls_left in Supabase if not admin
              if (!isAdmin) {
                const newCallsLeft = callsLeft - 1;
                const { error: updateError } = await supabase
                  .from('user_preferences')
                  .update({ calls_left: newCallsLeft })
                  .eq('user_id', session.user.id);
                  
                if (updateError) {
                  console.error('Error updating calls_left in Supabase:', updateError);
                }
              }
            }
          } catch (supabaseError) {
            console.error('Failed to save call to Supabase:', supabaseError);
          }
        } else {
          // For guests, update localStorage with new call
          const guestHistory = JSON.parse(localStorage.getItem('plektu_guest_call_history') || '[]');
          const newCall = {
            call_id: callRes.call_id,
            topic,
            status: callRes.status || 'pending',
            call_time: new Date().toISOString(),
          };
          const updatedGuestHistory = [newCall, ...guestHistory];
          localStorage.setItem('plektu_guest_call_history', JSON.stringify(updatedGuestHistory));
        }
        
        // Only decrease calls left for regular users, not premium/admin
        if (!isAdmin && callsLeft > 0) {
          const newCallsLeft = callsLeft - 1;
          setCallsLeft(newCallsLeft);
          localStorage.setItem(CALLS_KEY, String(newCallsLeft));
        }
        
        setStatus('Call placed successfully!');
      } else if (callRes && callRes.message) {
        setStatus(callRes.message);
      } else {
        setStatus('Call failed.');
      }

      // After a short delay, switch to the call history tab and auto-expand the latest call
      setTimeout(() => {
        setActiveTab('chat');
        if (latestCallId) {
          setTimeout(() => {
            // Use a custom event to tell CallHistory to auto-select the latest call
            window.dispatchEvent(new CustomEvent('autoExpandCall', { detail: { callId: latestCallId } }));
          }, 400);
        }
      }, 800);
    } catch (error) {
      setStatus((error && error.message) || 'Call failed.');
    }
    setLoading(false);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPass === 'premium1001') || (adminPass === 'PREMIUM1001') {
      
      setIsAdmin(true);
      setAdminPass('');
      setActiveTab('main');
      setShowPremiumPopup(true);
      
      // Auto-hide the popup after 6 seconds
      setTimeout(() => {
        setShowPremiumPopup(false);
      }, 6000);
    } else {
      alert('Incorrect premium code');
    }
  };
  
  const handleLogout = () => {
    setIsAdmin(false);
  };

  // Toggle dark/light mode
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    setBackgroundColor(darkMode ? '#f7f7f7' : '#111');
  };

  useEffect(() => {
    if (session?.user?.id) {
      // Only save if we have some changes and the user is logged in
      saveUserPreferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callsLeft, isAdmin, phone]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Update document title
    document.title = "Plektu";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Listen for navigateToTab events
    function handleNavigate(e) {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab);
      }
    }
    window.addEventListener('navigateToTab', handleNavigate);
    return () => window.removeEventListener('navigateToTab', handleNavigate);
  }, []);

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

  // Function to handle background color change
  const handleBackgroundColorChange = (color) => {
    setBackgroundColor(color);
    // You could also store this in local storage or Supabase
    if (session?.user?.id) {
      // Update user preferences in database
      supabase
        .from('user_preferences')
        .update({ background_color: color })
        .eq('user_id', session.user.id)
        .then(result => {
          if (result.error) {
            console.error('Error saving background color:', result.error);
          }
        });
    } else {
      // Store in localStorage for guests
      localStorage.setItem('plektu_background_color', color);
    }
  };

  useEffect(() => {
    // Listen for navigateToTab events
    function handleNavigate(e) {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab);
      }
    }
    window.addEventListener('navigateToTab', handleNavigate);
    return () => window.removeEventListener('navigateToTab', handleNavigate);
  }, []);

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
        width: windowSize.width < 768 ? '90%' : 340, 
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
            fontWeight: 500,
            backgroundColor: darkMode ? 'rgba(50,50,50,0.3)' : 'rgba(240,240,240,0.8)',
            padding: '4px 8px',
            borderRadius: 4,
            display: 'inline-block'
          }}>
            Available Calls: <span style={{ fontWeight: 600 }}>{callsLeft}</span> / {session?.user?.id ? 5 : 3}
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
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{ 
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            marginBottom: 16
          }}
        >
          <label 
            htmlFor="phone" 
            style={{ 
              marginBottom: 6, 
              color: darkMode ? '#aaa' : '#666',
              fontSize: 13 
            }}
          >
            Phone Number
          </label>
          <motion.input
            id="phone"
            type="tel"
            pattern="[0-9]*"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => {
              // Only allow numeric input
              const numericValue = e.target.value.replace(/[^0-9]/g, '');
              setPhone(numericValue);
            }}
            style={{
              padding: 12,
              fontSize: 16,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              borderRadius: 8,
              border: darkMode ? '1px solid #444' : '1px solid #ddd',
              background: darkMode ? '#333' : '#fff',
              color: darkMode ? '#fff' : '#333',
              marginBottom: 16,
              boxSizing: 'border-box',
              width: '100%'
            }}
            required
          />
        </motion.div>
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
        <textarea
          placeholder="Describe your conversation topic"
          value={topic}
          onChange={e => {
            setTopic(e.target.value);
          }}
          style={{ 
            padding: 12,
            fontSize: 16,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            borderRadius: 8,
            border: darkMode ? '1px solid #444' : '1px solid #ccc',
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
          background: 'rgb(136, 238, 238)',
          color: '#222',
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
          style={{ fontSize: 14, color: darkMode ? '#8ee' : '#33a', textAlign: 'center' }}
        >
          Premium Mode - Unlimited Calls
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
      
      {/* Removed call history section from main tab - it's now only in the Call History tab */}
      
    </motion.form>
  );
  
  const renderPremiumTab = () => (
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
        width: windowSize.width < 768 ? '90%' : 340, 
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
        Premium Access
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
          placeholder="Premium Code"
          value={adminPass}
          onChange={e => setAdminPass(e.target.value)}
          style={{ 
            padding: 12,
            fontSize: 16,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            borderRadius: 8,
            border: darkMode ? '1px solid #444' : '1px solid #ccc',
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
          background: 'rgb(136, 238, 238)',
          color: '#222',
          cursor: 'pointer',
          fontWeight: 500,
          width: '100%'
        }}
      >
        Activate Premium
      </motion.button>
    </motion.form>
  );

  // Remove any call/chat history logic from App.js UI
  // Instead, use the CallHistory component wherever chat/call history should be displayed

  // Example: Replace any inline history tab rendering with this
  // <CallHistory phone={phone} userId={session?.user?.id} darkMode={darkMode} />
  const renderChatHistoryTab = () => (
    <CallHistory phone={phone} userId={session?.user?.id} darkMode={darkMode} />
  );

  // eslint-disable-next-line no-unused-vars
  const renderCallHistoryItem = (call, index) => {
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6,
          delay: 0.1 + (index * 0.05),
          ease: "easeOut"
        }}
        style={{
          backgroundColor: darkMode ? '#252525' : '#fff',
          borderRadius: 12,
          padding: 16,
          boxShadow: darkMode ? '0 2px 10px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.08)',
          marginBottom: 20,
          border: darkMode ? '1px solid #333' : '1px solid #eee'
        }}
      >
        {/* Call header with status and time */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 12,
          borderBottom: darkMode ? '1px solid #333' : '1px solid #eee',
          paddingBottom: 8
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 4
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: 16, 
              fontWeight: 600,
              color: darkMode ? '#fff' : '#333'
            }}>
              {call.topic || 'Phone Call'}
            </h3>
            <div style={{ 
              fontSize: 13, 
              color: darkMode ? '#aaa' : '#666',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>{call.phone_number}</span>
              <span>•</span>
              <span>{getPSTTimeString(call.timestamp)}</span>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: 16,
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: call.status === 'success' 
                ? (darkMode ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9') 
                : (darkMode ? 'rgba(176, 0, 32, 0.2)' : '#ffebee'),
              color: call.status === 'success'
                ? (darkMode ? '#81c784' : '#2e7d32')
                : (darkMode ? '#f48fb1' : '#b00020')
            }}>
              {call.status === 'success' ? 'Completed' : 'Failed'}
            </div>
            
            {call.call_id && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCallId(call.call_id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#8ee' : '#0077cc'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </motion.button>
            )}
          </div>
        </div>

        {/* Call details when expanded */}
        {selectedCallId === call.call_id && (
          <CallDetails callId={call.call_id} darkMode={darkMode} />
        )}
      </motion.div>
    );
  };

  useEffect(() => {
    // Update document title
    document.title = "Plektu";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    }, 2000); // every 2 seconds for more real-time feel
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, recordingUrls, phone, status]);

  useEffect(() => {
    // Listen for navigateToTab events
    function handleNavigate(e) {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab);
      }
    }
    window.addEventListener('navigateToTab', handleNavigate);
    return () => window.removeEventListener('navigateToTab', handleNavigate);
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: backgroundColor, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center', // Add this to center vertically
      transition: 'background 0.5s ease',
      color: darkMode ? '#fff' : '#222'
    }}>
      {!session && !bypassAuth ? (
        // Authentication screen when not logged in and not bypassing auth
        <Auth darkMode={darkMode} />
      ) : (
        // Application content when logged in or bypassing auth
        <>
          {/* Use the separated Header component */}
          <Header 
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            handleBackgroundColorChange={handleBackgroundColorChange}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            session={session}
            bypassAuth={bypassAuth}
            handleSignOut={handleSignOut}
            appVersion={appVersion}
            isAdmin={isAdmin}
          />
          {/* Main content container - needs top padding to accommodate fixed navbar */}
          <div style={{ 
            width: '100%', 
            maxWidth: '1200px', 
            marginTop: 80, 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1
          }}>
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
              ) : activeTab === 'chat' ? (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ 
                    duration: 0.6,
                    ease: [0.2, 0.65, 0.3, 0.9]
                  }}
                >
                  <div style={{ 
                    padding: '20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 20
                  }}>
                    {renderChatHistoryTab()}
                  </div>
                </motion.div>
              ) : activeTab === 'feedback' ? (
                <motion.div
                  key="feedback"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ 
                    duration: 0.6,
                    ease: [0.2, 0.65, 0.3, 0.9]
                  }}
                >
                  <div style={{ 
                    padding: '20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 20
                  }}>
                    <h2>Feedback</h2>
                    <textarea
                      placeholder="Enter your feedback"
                      value={feedback}
                      onChange={e => {
                        setFeedback(e.target.value);
                      }}
                      style={{ 
                        padding: 12,
                        fontSize: 16,
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        borderRadius: 8,
                        border: darkMode ? '1px solid #444' : '1px solid #ccc',
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
                    <motion.button 
                      type="button" 
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
                        background: 'rgb(136, 238, 238)',
                        color: '#222',
                        cursor: loading || (!isAdmin && callsLeft === 0) ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        width: '100%'
                      }}
                      onClick={handleFeedbackSubmit}
                    >
                      Submit Feedback
                    </motion.button>
                  </div>
                </motion.div>
              ) : activeTab === 'premium' ? (
                <motion.div
                  key="premium"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ 
                    duration: 0.6,
                    ease: [0.2, 0.65, 0.3, 0.9]
                  }}
                >
                  {renderPremiumTab()}
                </motion.div>
              ) : null}
            </AnimatePresence>
            {showPremiumPopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: 20
                }}
                onClick={() => setShowPremiumPopup(false)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  style={{
                    backgroundColor: darkMode ? '#222' : '#fff',
                    borderRadius: 16,
                    padding: 32,
                    maxWidth: 500,
                    textAlign: 'center',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    style={{
                      position: 'absolute',
                      top: -80,
                      left: -80,
                      width: 160,
                      height: 160,
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #8ee 0%, #4ac 100%)',
                      opacity: 0.15
                    }}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: -100,
                      right: -100,
                      width: 200,
                      height: 200,
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #8ee 0%, #4ac 100%)',
                      opacity: 0.1
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #8ee 0%, #4ac 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px'
                    }}
                  >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17L4 12" />
                    </svg>
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    style={{
                      color: darkMode ? '#fff' : '#333',
                      margin: '0 0 16px',
                      fontSize: 28,
                      fontWeight: 700
                    }}
                  >
                    Thank You for Going Premium!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    style={{
                      color: darkMode ? '#ccc' : '#666',
                      fontSize: 16,
                      lineHeight: 1.6,
                      marginBottom: 24
                    }}
                  >
                    We greatly appreciate your support! You now have access to all premium features, unlimited calls, and advanced settings. Enjoy the enhanced experience!
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPremiumPopup(false)}
                    style={{
                      background: 'rgb(136, 238, 238)',
                      color: '#222',
                      border: 'none',
                      padding: '12px 28px',
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    Start Using Premium
                  </motion.button>
                </motion.div>
              </motion.div>
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
        </>
      )}
    </div>
  );
}

export default App;
