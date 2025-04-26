import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

const THEME_KEY = 'theme';

const Auth = ({ darkMode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Create an anonymous session
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) throw error;
      
      // Set up initial user preferences in Supabase
      if (data?.user) {
        const { error: prefError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: data.user.id,
            dark_mode: true,
            calls_left: 5,
            is_admin: false
          });
        
        if (prefError) console.error('Error setting initial preferences:', prefError);
      }
      
    } catch (err) {
      setError(err.message || 'An error occurred during guest login');
    } finally {
      setLoading(false);
    }
  };

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
