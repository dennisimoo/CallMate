import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium access form component
 */
const PremiumForm = ({
  handleAdminLogin,
  adminPass,
  setAdminPass,
  darkMode,
  windowSize
}) => {
  return (
    <motion.form 
      onSubmit={handleAdminLogin} 
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
        style={{ margin: 0, color: darkMode ? '#fff' : '#222', fontWeight: 600, fontSize: 22, letterSpacing: -1 }}
      >
        Premium Access
      </motion.h2>
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: 0.2,
          ease: "easeOut"
        }}
      >
        <input
          type="password"
          placeholder="Premium Code"
          value={adminPass}
          onChange={e => setAdminPass(e.target.value)}
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
          required
        />
      </motion.div>
      
      <motion.button 
        type="submit" 
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
          padding: 12,
          fontSize: 16,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: 8,
          border: 'none',
          background: 'rgb(136, 238, 238)',
          color: '#222',
          cursor: 'pointer',
          fontWeight: 500,
          width: '100%'
        }}
      >
        Activate Premium
      </motion.button>
    </motion.form>
  );
};

export default PremiumForm;
