import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Main form component for creating a new call
 */
const MainForm = ({
  handleCall,
  phone,
  setPhone,
  topic,
  setTopic,
  isAdmin,
  callsLeft,
  loading,
  status,
  darkMode,
  handleLogout,
  windowSize
}) => {
  return (
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
            Available Calls: <span style={{ fontWeight: 600 }}>{callsLeft}</span> / {5}
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
    </motion.form>
  );
};

export default MainForm;
