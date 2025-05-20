import React from 'react';
import { motion } from 'framer-motion';

/**
 * Input field with label and animation
 */
export const PhoneInput = ({ phone, setPhone, darkMode }) => {
  return (
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
  );
};

/**
 * Topic textarea input with animation
 */
export const TopicInput = ({ topic, setTopic, darkMode }) => {
  return (
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
  );
};

/**
 * Submit button with animation
 */
export const SubmitButton = ({ loading, isAdmin, callsLeft, darkMode }) => {
  return (
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
  );
};

/**
 * Message textarea input with animation
 */
export const MessageInput = ({ message, setMessage, darkMode }) => {
  return (
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
        placeholder="Enter your SMS message"
        value={message}
        onChange={e => {
          setMessage(e.target.value);
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
  );
};

/**
 * SMS Submit button with animation
 */
export const SMSSubmitButton = ({ loading, isAdmin, smsLeft, darkMode }) => {
  return (
    <motion.button 
      type="submit" 
      disabled={loading || (!isAdmin && smsLeft === 0)} 
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
        cursor: loading || (!isAdmin && smsLeft === 0) ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        width: '100%'
      }}
    >
      {loading ? 'Sending...' : 'Send SMS'}
    </motion.button>
  );
};

export default {
  PhoneInput,
  TopicInput,
  SubmitButton,
  MessageInput,
  SMSSubmitButton
};
