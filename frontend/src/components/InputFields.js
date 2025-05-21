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
        marginBottom: 0
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
        inputMode="tel"
        autoComplete="tel"
        placeholder="Enter 10-digit phone number"
        value={phone}
        onChange={(e) => {
          // Allow digits and spaces, but store only digits
          const inputValue = e.target.value;
          const numericValue = inputValue.replace(/[^0-9]/g, '');
          
          // Only accept if it's within valid length (up to 11 digits)
          if (numericValue.length <= 11) {
            setPhone(numericValue);
          }
        }}
        style={{
          padding: 12,
          fontSize: 16,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: 8,
          border: darkMode ? '1px solid #444' : '1px solid #ccc',
          backgroundColor: darkMode ? '#333' : '#fff',
          color: darkMode ? '#fff' : '#333',
          marginBottom: 10,
          boxSizing: 'border-box',
          width: '100%',
          position: "relative",
          zIndex: 2
        }}
        required
      />
    </motion.div>
  );
};

/**
 * Topic input with animation using fill-in-the-blank format
 */
export const TopicInput = ({ topic, setTopic, darkMode }) => {
  // Get the initial values directly from the input ref
  const [personValue, setPersonValue] = React.useState("");
  const [aboutValue, setAboutValue] = React.useState("");
  
  // Initialize the values on component mount or when topic changes
  React.useEffect(() => {
    if (topic) {
      // Use more permissive regex to extract values with spaces
      const personMatch = topic.match(/PERSON:\s*([^,]*),?/);
      const aboutMatch = topic.match(/ABOUT:\s*(.*)$/);
      
      if (personMatch && personMatch[1]) setPersonValue(personMatch[1].trim());
      if (aboutMatch && aboutMatch[1]) setAboutValue(aboutMatch[1].trim());
    }
  }, [topic]);
  
  // Directly set person value and update topic
  const handlePersonChange = (e) => {
    const value = e.target.value;
    setPersonValue(value);
    setTopic(`PERSON: ${value}, ABOUT: ${aboutValue}`);
  };
  
  // Directly set about value and update topic
  const handleAboutChange = (e) => {
    const value = e.target.value;
    setAboutValue(value);
    setTopic(`PERSON: ${personValue}, ABOUT: ${value}`);
  };
  
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
      <label 
        style={{ 
          marginBottom: 6, 
          color: darkMode ? '#aaa' : '#666',
          fontSize: 13,
          display: 'block'
        }}
      >
        You will be talking to...
      </label>
      
      <input
        type="text"
        placeholder="Who will you be talking to?"
        value={personValue}
        onChange={handlePersonChange}
        style={{ 
          padding: 12,
          fontSize: 16,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: 8,
          border: darkMode ? '1px solid #444' : '1px solid #ccc',
          backgroundColor: darkMode ? '#333' : '#fff',
          color: darkMode ? '#fff' : '#333',
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 16
        }}
        required
      />
      
      <label 
        style={{ 
          marginBottom: 6, 
          color: darkMode ? '#aaa' : '#666',
          fontSize: 13,
          display: 'block'
        }}
      >
        And then about...
      </label>
      
      <textarea
        placeholder="What will the conversation be about?"
        value={aboutValue}
        onChange={handleAboutChange}
        style={{ 
          padding: 12,
          fontSize: 16,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: 8,
          border: darkMode ? '1px solid #444' : '1px solid #ccc',
          backgroundColor: darkMode ? '#333' : '#fff',
          color: darkMode ? '#fff' : '#333',
          width: '100%',
          boxSizing: 'border-box',
          position: "relative",
          zIndex: 2,
          resize: "vertical",
          minHeight: "42px",
          height: "42px"
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
      <label 
        style={{ 
          marginBottom: 6, 
          color: darkMode ? '#aaa' : '#666',
          fontSize: 13,
          display: 'block'
        }}
      >
        Message
      </label>
      
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
