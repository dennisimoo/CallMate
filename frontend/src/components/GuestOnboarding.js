import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyName } from '../api';
import TermsOfService from './TermsOfService';

const GuestOnboarding = ({ darkMode, windowSize, onComplete }) => {
  const [step, setStep] = useState(1); // 1: Name input, 2: Terms of Service
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Verify name with Gemini API
  const validateName = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }

    setIsVerifying(true);
    setError('');
    
    try {
      const data = await verifyName(name.trim());
      
      if (!data.isValidName) {
        setError('Please enter a valid name');
        setIsVerifying(false);
        return false;
      }
      
      setIsVerifying(false);
      return true;
    } catch (error) {
      console.error('Error verifying name:', error);
      setError('Error verifying name. Please try again.');
      setIsVerifying(false);
      return false;
    }
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateName();
    if (isValid) {
      setStep(2);
    }
  };

  const handleTermsSubmit = (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError('You must accept the Terms of Service to continue');
      return;
    }
    
    // Store the user's name and complete onboarding
    localStorage.setItem('plektu_guest_name', name);
    onComplete(name);
  };

  return (
    <AnimatePresence mode="wait">
      {step === 1 ? (
        <motion.form 
          key="nameForm"
          onSubmit={handleNameSubmit} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
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
            Welcome to Plektu
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.1,
              ease: "easeOut"
            }}
            style={{ 
              fontSize: 14, 
              color: darkMode ? '#ccc' : '#555', 
              marginBottom: 5, 
              lineHeight: 1.4 
            }}
          >
            Please enter your name to get started
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
            <label 
              htmlFor="name" 
              style={{ 
                display: 'block', 
                marginBottom: '5px', 
                color: darkMode ? '#ccc' : '#666', 
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                borderRadius: '8px',
                border: darkMode ? '1px solid #444' : '1px solid #ccc',
                backgroundColor: darkMode ? '#333' : '#fff',
                color: darkMode ? '#fff' : '#333',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.2s ease-in-out',
              }}
              placeholder="Enter your name"
            />
          </motion.div>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 5, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -5, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ 
                  color: '#ff4b4b', 
                  fontSize: '14px',
                  fontWeight: 500,
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: darkMode ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.05)',
                  borderRadius: 6
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button
            type="submit"
            disabled={isVerifying}
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
              padding: '12px',
              fontSize: '16px',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              borderRadius: '8px',
              border: 'none',
              background: 'rgb(136, 238, 238)',
              color: '#222',
              fontWeight: '500',
              cursor: isVerifying ? 'default' : 'pointer',
              opacity: isVerifying ? 0.7 : 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {isVerifying ? 'Verifying...' : 'Continue'}
          </motion.button>
        </motion.form>
      ) : (
        <motion.form 
          key="termsForm"
          onSubmit={handleTermsSubmit} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
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
            Terms of Service
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.1,
              ease: "easeOut"
            }}
            style={{ 
              fontSize: 14, 
              color: darkMode ? '#ccc' : '#555', 
              marginBottom: 5, 
              lineHeight: 1.4 
            }}
          >
            Please review and accept our Terms of Service to continue
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
            <TermsOfService darkMode={darkMode} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.3,
              ease: "easeOut"
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '5px'
            }}
          >
            <input
              id="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'rgb(136, 238, 238)',
                cursor: 'pointer'
              }}
            />
            <label
              htmlFor="terms"
              style={{
                fontSize: '14px',
                color: darkMode ? '#ddd' : '#444',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              I accept the Terms of Service
            </label>
          </motion.div>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 5, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -5, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ 
                  color: '#ff4b4b', 
                  fontSize: '14px',
                  fontWeight: 500,
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: darkMode ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.05)',
                  borderRadius: 6
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.4,
              ease: "easeOut"
            }}
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '10px'
            }}
          >
            <motion.button
              type="button"
              onClick={() => setStep(1)}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              whileTap={{ 
                scale: 0.98,
                transition: { duration: 0.1, ease: "easeOut" }
              }}
              style={{
                flex: '1',
                padding: '12px',
                fontSize: '16px',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                borderRadius: '8px',
                border: darkMode ? '1px solid #444' : '1px solid #ccc',
                backgroundColor: darkMode ? '#333' : '#f5f5f5',
                color: darkMode ? '#ddd' : '#444',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Back
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              whileTap={{ 
                scale: 0.98,
                transition: { duration: 0.1, ease: "easeOut" }
              }}
              style={{
                flex: '1',
                padding: '12px',
                fontSize: '16px',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                borderRadius: '8px',
                border: 'none',
                background: 'rgb(136, 238, 238)',
                color: '#222',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.form>
      )}
    </AnimatePresence>
  );
};

export default GuestOnboarding;
