import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * A standalone TopicInput component that properly handles spaces
 */
const TopicInput = ({ topic, setTopic, darkMode }) => {
  // Use direct DOM references to avoid React's state reconciliation issues with spaces
  const personRef = React.useRef(null);
  const aboutRef = React.useRef(null);
  
  // Initialize values when topic changes
  useEffect(() => {
    if (topic && personRef.current && aboutRef.current) {
      const personMatch = topic.match(/PERSON:\s*([^,]*),?/);
      const aboutMatch = topic.match(/ABOUT:\s*(.*)$/);
      
      if (personMatch && personMatch[1]) personRef.current.value = personMatch[1].trim();
      if (aboutMatch && aboutMatch[1]) aboutRef.current.value = aboutMatch[1].trim();
    }
  }, [topic]);
  
  // Handle input changes directly using the DOM values
  const handleChange = () => {
    // Read directly from DOM to preserve ALL characters including spaces
    const personValue = personRef.current?.value || "";
    const aboutValue = aboutRef.current?.value || "";
    
    // Set the complete topic string
    setTopic(`PERSON: ${personValue}, ABOUT: ${aboutValue}`);
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
        ref={personRef}
        type="text"
        placeholder="Who will you be talking to?"
        onChange={handleChange}
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
      
      <input
        ref={aboutRef}
        type="text"
        placeholder="What will the conversation be about?"
        onChange={handleChange}
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
          zIndex: 2
        }}
        required
      />
    </motion.div>
  );
};

export default TopicInput;
