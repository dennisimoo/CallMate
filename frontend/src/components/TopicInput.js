import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * An improved version of TopicInput that properly handles spaces
 */
const TopicInput = ({ topic, setTopic, darkMode }) => {
  const [person, setPerson] = useState("");
  const [about, setAbout] = useState("");
  
  // Parse topic when it changes externally
  useEffect(() => {
    if (topic) {
      const personMatch = topic.match(/PERSON:\s*([^,]+)/);
      const aboutMatch = topic.match(/ABOUT:\s*(.+)/);
      
      if (personMatch && personMatch[1]) setPerson(personMatch[1].trim());
      if (aboutMatch && aboutMatch[1]) setAbout(aboutMatch[1].trim());
    }
  }, [topic]);
  
  // Update the full topic string when either field changes
  const handlePersonChange = (e) => {
    const newPerson = e.target.value;
    setPerson(newPerson);
    setTopic(`PERSON: ${newPerson}, ABOUT: ${about}`);
  };
  
  const handleAboutChange = (e) => {
    const newAbout = e.target.value;
    setAbout(newAbout);
    setTopic(`PERSON: ${person}, ABOUT: ${newAbout}`);
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
        value={person}
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
      
      <input
        type="text"
        placeholder="What will the conversation be about?"
        value={about}
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
          zIndex: 2
        }}
        required
      />
    </motion.div>
  );
};

export default TopicInput;
