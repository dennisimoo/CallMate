import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

const Auth = ({ darkMode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Show loader during authentication
  const showAuthLoader = () => {
    setLoading(true);
    
    // Create loader element if it doesn't exist
    let loaderElement = document.querySelector('.loader-container');
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
    } else {
      // Make sure any existing loader is visible
      loaderElement.classList.remove('fade-out');
      loaderElement.style.opacity = '1';
      loaderElement.style.visibility = 'visible';
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      showAuthLoader();
      setError('');
      
      // Configure the Google OAuth provider options with additional parameters
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          scopes: 'email profile',
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          }
        }
      });
      
      if (error) throw error;
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(err.message || 'An error occurred during Google sign-in');
      setLoading(false);
      
      // Hide loader on error
      const loaderElement = document.querySelector('.loader-container');
      if (loaderElement) {
        loaderElement.classList.add('fade-out');
      }
    }
  };

  const handleGuestLogin = async () => {
    try {
      // Create a random guest ID
      const guestId = 'guest_' + Math.random().toString(36).substring(2, 15);
      
      // Initialize guest data in Supabase
      try {
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: guestId,
            calls_left: 3,
            dark_mode: true,
            is_admin: false,
            created_at: new Date(),
            updated_at: new Date()
          });
          
        if (error && !error.message.includes('duplicate')) {
          console.error('Error creating guest account:', error);
        }
      } catch (err) {
        console.error('Could not initialize guest in Supabase:', err);
      }
      
      // Always set calls_left to 3 for guests in localStorage
      localStorage.setItem('plektu_calls_left', '3');
      
      // Set bypass auth flag
      localStorage.setItem('bypass_auth', 'true');
      
      // Redirect to main app
      window.location.reload();
    } catch (error) {
      console.error('Guest login error:', error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      const loaderElement = document.querySelector('.loader-container');
      if (loaderElement) {
        loaderElement.classList.add('fade-out');
      }
    }
  }, [loading]);

  useEffect(() => {
    // Remove loader when authentication is complete
    const handleAuthStateChange = (event, session) => {
      if (event === 'SIGNED_IN') {
        // Wait for 3 seconds before fading out the loader
        setTimeout(() => {
          const loaderElement = document.querySelector('.loader-container');
          if (loaderElement) {
            loaderElement.classList.add('fade-out');
            
            // Remove the element completely after animation finishes
            setTimeout(() => {
              if (loaderElement.parentNode) {
                loaderElement.parentNode.removeChild(loaderElement);
              }
            }, 800);
          }
          setLoading(false);
        }, 3000); // Make loader last 3 seconds
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      style={{ 
        width: 340,
        padding: 24,
        borderRadius: 16,
        backgroundColor: darkMode ? '#222' : '#fff',
        boxShadow: darkMode ? '0 10px 25px rgba(0,0,0,0.3)' : '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div style={{
        marginBottom: 24,
        textAlign: 'center'
      }}>
        <h1 style={{ 
          margin: 0, 
          marginBottom: 8,
          fontSize: 22, 
          color: darkMode ? '#fff' : '#333',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontWeight: 600
        }}>
          Sign in to Plektu
        </h1>
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '12px 16px',
          border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          borderRadius: 8,
          backgroundColor: 'transparent',
          color: darkMode ? '#fff' : '#333',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.2s ease'
        }}
      >
        <svg 
          width="18" 
          height="18" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 48 48"
        >
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
        Sign in with Google
      </motion.button>

      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, margin: '15px 0' }}>
        <div style={{ 
          height: 1, 
          flex: 1, 
          backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
        }} />
        <span style={{ 
          color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
          fontSize: 12 
        }}>or</span>
        <div style={{ 
          height: 1, 
          flex: 1, 
          backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
        }} />
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleGuestLogin}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '12px 16px',
          border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          borderRadius: 8,
          backgroundColor: 'transparent',
          color: darkMode ? '#fff' : '#333',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.2s ease'
        }}
      >
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={darkMode ? "#fff" : "#333"} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        Continue as Guest
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ 
          fontSize: 11, 
          marginTop: 20, 
          color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          textAlign: 'center' 
        }}
      >
        By signing in, you agree to our Terms of Service and Privacy Policy
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            marginTop: 16, 
            color: '#ff4b4b', 
            fontSize: 14,
            fontWeight: 500,
            textAlign: 'center',
            padding: '8px 12px',
            backgroundColor: darkMode ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.05)',
            borderRadius: 6,
            maxWidth: '100%'
          }}
        >
          {error}
        </motion.div>
      )}
      
    </motion.div>
  );
};

export default Auth;
