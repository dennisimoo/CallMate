import React from 'react';
import { motion } from 'framer-motion';

export default function SimpleTopicInput({ topic, setTopic, darkMode }) {
  // Parse topic once on mount
  const [person, setPerson] = React.useState("");
  const [about, setAbout] = React.useState("");
  
  // Set initial values
  React.useEffect(() => {
    if (topic) {
      const parts = topic.split(",");
      if (parts[0] && parts[0].includes("PERSON:")) {
        setPerson(parts[0].replace("PERSON:", "").trim());
      }
      if (parts[1] && parts[1].includes("ABOUT:")) {
        setAbout(parts[1].replace("ABOUT:", "").trim());
      }
    }
  }, []);
  
  // Handle person input
  function handlePersonChange(e) {
    setPerson(e.target.value);
    setTopic(`PERSON: ${e.target.value}, ABOUT: ${about}`);
  }
  
  // Handle about input 
  function handleAboutChange(e) {
    setAbout(e.target.value);
    setTopic(`PERSON: ${person}, ABOUT: ${e.target.value}`);
  }
  
  return (
    <div>
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
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
}
