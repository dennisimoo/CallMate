import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneInput, MessageInput, SMSSubmitButton } from './InputFields';

const SMSForm = ({
  handleSMS,
  phone,
  setPhone,
  message,
  setMessage,
  isAdmin,
  smsLeft,
  loading,
  status,
  darkMode,
  windowSize
}) => {
  return (
    <motion.form 
      onSubmit={handleSMS} 
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
        Plektu SMS
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
        Send an SMS message using Plektu. Just enter a phone number and message to get started!
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
            Available SMS: <span style={{ fontWeight: 600 }}>{smsLeft}</span> / {10}
          </div>
        )}
      </motion.div>
      
      <PhoneInput phone={phone} setPhone={setPhone} darkMode={darkMode} />
      <MessageInput message={message} setMessage={setMessage} darkMode={darkMode} />
      <SMSSubmitButton loading={loading} isAdmin={isAdmin} smsLeft={smsLeft} darkMode={darkMode} />
      
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
                ? (status.includes('SMS sent') ? 'rgba(46, 125, 50, 0.2)' : (status.startsWith('You have reached')) ? 'rgba(176, 0, 32, 0.2)' : 'rgba(255, 255, 255, 0.1)') 
                : (status.includes('SMS sent') ? 'rgba(46, 125, 50, 0.1)' : (status.startsWith('You have reached')) ? 'rgba(176, 0, 32, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
              color: darkMode 
                ? (status.includes('SMS sent') ? '#8ee' : (status.startsWith('You have reached')) ? '#f88' : '#fff') 
                : (status.includes('SMS sent') ? '#33a' : (status.startsWith('You have reached')) ? '#a33' : '#333'),
              fontSize: 14,
              fontWeight: 500
            }}
          >
            {status}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
};

export default SMSForm; 