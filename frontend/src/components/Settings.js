import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/Settings.css';

const Settings = ({ darkMode, toggleTheme, handleBackgroundColorChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [bgColor, setBgColor] = useState(darkMode ? '#111' : '#f7f7f7');

  const toggleSettings = () => {
    setIsOpen(!isOpen);
  };

  const changeBgColor = (color) => {
    setBgColor(color);
    handleBackgroundColorChange(color);
  };

  return (
    <div className="settings-container" style={{ backgroundColor: isOpen ? bgColor : 'transparent' }}>
      <div className="btn-cont" style={{ border: darkMode ? '1px solid #333' : '1px solid #ddd' }}>
        <button className="button" onClick={toggleSettings}>
          <svg
            className="settings-btn"
            xmlns="http://www.w3.org/2000/svg"
            height="24"
            viewBox="0 -960 960 960"
            width="24"
            fill={darkMode ? "#e8eaed" : "#555"}
          >
            <path
              d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"
            ></path>
          </svg>
          <span className="tooltip">settings</span>
        </button>
      </div>

      {isOpen && (
        <motion.div 
          className="settings-panel"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            backgroundColor: darkMode ? '#222' : '#fff',
            color: darkMode ? '#fff' : '#333',
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.1)',
            border: darkMode ? '1px solid #333' : '1px solid #ddd'
          }}
        >
          <h3>Settings</h3>
          
          <div className="settings-section">
            <h4>Theme</h4>
            <div className="theme-toggle">
              <span>Dark Mode</span>
              <div className="switch-container">
                <input 
                  type="checkbox" 
                  id="theme-switch" 
                  checked={darkMode} 
                  onChange={toggleTheme} 
                />
                <label htmlFor="theme-switch"></label>
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h4>Background Color</h4>
            <div className="color-options">
              {darkMode ? (
                <>
                  <div 
                    className="color-option" 
                    style={{ backgroundColor: '#111' }}
                    onClick={() => changeBgColor('#111')}
                  ></div>
                  <div 
                    className="color-option" 
                    style={{ backgroundColor: '#1a1a2e' }}
                    onClick={() => changeBgColor('#1a1a2e')}
                  ></div>
                  <div 
                    className="color-option" 
                    style={{ backgroundColor: '#16213e' }}
                    onClick={() => changeBgColor('#16213e')}
                  ></div>
                  <div 
                    className="color-option" 
                    style={{ backgroundColor: '#1e1e30' }}
                    onClick={() => changeBgColor('#1e1e30')}
                  ></div>
                </>
              ) : (
                <>
                  <div 
                    className="color-option" 
                    style={{ backgroundColor: '#f7f7f7' }}
                    onClick={() => changeBgColor('#f7f7f7')}
                  ></div>
                  <div 
                    className="color-option" 
                    style={{ backgroundColor: '#f0f2f5' }}
                    onClick={() => changeBgColor('#f0f2f5')}
                  ></div>
                  <div 
                    className="color-option" 
                    style={{ backgroundColor: '#e6f7ff' }}
                    onClick={() => changeBgColor('#e6f7ff')}
                  ></div>
                  <div 
                    className="color-option" 
                    style={{ backgroundColor: '#f5f5f5' }}
                    onClick={() => changeBgColor('#f5f5f5')}
                  ></div>
                </>
              )}
            </div>
          </div>
          
          <button 
            className="close-button"
            onClick={toggleSettings}
          >
            Close
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default Settings;
