import React from 'react';
import { motion } from 'framer-motion';
import Settings from './Settings';

const Header = ({ 
  darkMode, 
  toggleTheme, 
  handleBackgroundColorChange, 
  activeTab, 
  setActiveTab, 
  session, 
  bypassAuth, 
  handleSignOut,
  appVersion,
  isAdmin
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8,
        ease: "easeOut"
      }}
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        width: '100%',
        padding: '12px 24px',
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        borderBottom: darkMode ? '1px solid #333' : '1px solid #eaeaea'
      }}
    >
      {/* Plektu title on the left */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 10
      }}>
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 0.8,
            ease: "easeOut"
          }}
          style={{ 
            margin: 0, 
            color: darkMode ? '#fff' : '#222', 
            fontWeight: 600, 
            fontSize: 22,
            letterSpacing: -0.5
          }}
        >
          Plektu
        </motion.h2>
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ 
            fontSize: 12, 
            color: darkMode ? '#aaa' : '#888',
            fontWeight: 500
          }}
        >
          v2.0.0
        </motion.span>
      </div>
      
      {/* Navigation buttons in the center */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 5
      }}>
        <motion.button 
          onClick={() => setActiveTab('main')} 
          whileHover={{ 
            scale: 1.03,
            transition: { duration: 0.3, ease: "easeOut" }
          }}
          whileTap={{ 
            scale: 0.97,
            transition: { duration: 0.1, ease: "easeOut" }
          }}
          style={{ 
            padding: '8px 16px', 
            fontSize: 14, 
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            border: 'none', 
            background: activeTab === 'main' ? (darkMode ? '#444' : '#222') : (darkMode ? '#333' : '#e0e0e0'), 
            color: activeTab === 'main' ? '#fff' : (darkMode ? '#ccc' : '#222'), 
            borderRadius: 6, 
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Home
        </motion.button>
        <motion.button 
          onClick={() => setActiveTab('chat')} 
          whileHover={{ 
            scale: 1.03,
            transition: { duration: 0.3, ease: "easeOut" }
          }}
          whileTap={{ 
            scale: 0.97,
            transition: { duration: 0.1, ease: "easeOut" }
          }}
          style={{ 
            padding: '8px 16px', 
            fontSize: 14, 
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            border: 'none', 
            background: activeTab === 'chat' ? (darkMode ? '#444' : '#222') : (darkMode ? '#333' : '#e0e0e0'), 
            color: activeTab === 'chat' ? '#fff' : (darkMode ? '#ccc' : '#222'), 
            borderRadius: 6, 
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Call History
        </motion.button>
        <motion.button 
          onClick={() => setActiveTab('feedback')} 
          whileHover={{ 
            scale: 1.03,
            transition: { duration: 0.3, ease: "easeOut" }
          }}
          whileTap={{ 
            scale: 0.97,
            transition: { duration: 0.1, ease: "easeOut" }
          }}
          style={{ 
            padding: '8px 16px', 
            fontSize: 14, 
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            border: 'none', 
            background: activeTab === 'feedback' ? (darkMode ? '#444' : '#222') : (darkMode ? '#333' : '#e0e0e0'), 
            color: activeTab === 'feedback' ? '#fff' : (darkMode ? '#ccc' : '#222'), 
            borderRadius: 6, 
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Feedback
        </motion.button>
        <motion.button 
          onClick={() => setActiveTab('premium')} 
          whileHover={{ 
            scale: 1.03,
            transition: { duration: 0.3, ease: "easeOut" }
          }}
          whileTap={{ 
            scale: 0.97,
            transition: { duration: 0.1, ease: "easeOut" }
          }}
          style={{ 
            padding: '8px 16px', 
            fontSize: 14, 
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            border: 'none', 
            background: activeTab === 'premium' ? (darkMode ? '#444' : '#222') : (darkMode ? '#333' : '#e0e0e0'), 
            color: activeTab === 'premium' ? '#fff' : (darkMode ? '#ccc' : '#222'), 
            borderRadius: 6, 
            cursor: 'pointer',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>Premium</span>
          {isAdmin && (
            <span style={{
              display: 'inline-flex',
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#8ee',
              marginLeft: 2
            }}></span>
          )}
        </motion.button>
        <motion.button 
          onClick={() => setActiveTab('sms')} 
          whileHover={{ 
            scale: 1.03,
            transition: { duration: 0.3, ease: "easeOut" }
          }}
          whileTap={{ 
            scale: 0.97,
            transition: { duration: 0.1, ease: "easeOut" }
          }}
          style={{ 
            padding: '8px 16px', 
            fontSize: 14, 
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            border: 'none', 
            background: activeTab === 'sms' ? (darkMode ? '#444' : '#222') : (darkMode ? '#333' : '#e0e0e0'), 
            color: activeTab === 'sms' ? '#fff' : (darkMode ? '#ccc' : '#222'), 
            borderRadius: 6, 
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          SMS
        </motion.button>
      </div>
      
      {/* Right side - Settings and Sign Out */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 12,
        marginRight: 25,
        position: 'relative',
        right: '10px'
      }}>
        <Settings 
          darkMode={darkMode} 
          toggleTheme={toggleTheme} 
          handleBackgroundColorChange={handleBackgroundColorChange} 
        />
        
        {/* Only render Sign Out button if user is logged in or bypassing auth */}
        {(session || bypassAuth) && (
          <motion.button 
            onClick={handleSignOut} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
            whileTap={{ 
              scale: 0.95,
              transition: { duration: 0.1, ease: "easeOut" }
            }}
            style={{ 
              padding: '7px 14px',
              fontSize: 13,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              border: 'none',
              background: darkMode ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.1)',
              color: darkMode ? '#ff5c5c' : '#e53935',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              minWidth: '90px',
              whiteSpace: 'nowrap',
              boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            Sign Out
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default Header;
