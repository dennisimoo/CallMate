import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainForm from './MainForm';
import PremiumForm from './PremiumForm';
import CallHistory from './CallHistory';
import Settings from './Settings';
import Feedback from './Feedback';
import CallForm from './CallForm';
import SMSForm from './SMSForm';

/**
 * Main content component that handles tab display
 */
const MainContent = ({
  activeTab,
  handleCall,
  handleSMS,
  phone,
  setPhone,
  topic,
  setTopic,
  message,
  setMessage,
  isAdmin,
  callsLeft,
  smsLeft,
  loading,
  status,
  darkMode,
  handleLogout,
  width, // Using width directly instead of windowSize object
  handleAdminLogin,
  adminPass,
  setAdminPass,
  userId,
  handleFeedbackSubmit,
  feedback,
  setFeedback,
  toggleTheme,
  callHistory,
  setCallHistory,
  setDarkMode,
  setLanguage,
  language
}) => {
  // Render the appropriate content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'main':
        return (
          <MainForm
            handleCall={handleCall}
            phone={phone}
            setPhone={setPhone}
            topic={topic}
            setTopic={setTopic}
            isAdmin={isAdmin}
            callsLeft={callsLeft}
            loading={loading}
            status={status}
            darkMode={darkMode}
            handleLogout={handleLogout}
            windowSize={{ width }}
          />
        );
      case 'premium':
        return (
          <PremiumForm
            handleAdminLogin={handleAdminLogin}
            adminPass={adminPass}
            setAdminPass={setAdminPass}
            darkMode={darkMode}
            windowSize={{ width }}
          />
        );
      case 'chat':
        return (
          <CallHistory 
            phone={phone} 
            userId={userId} 
            darkMode={darkMode} 
          />
        );
      case 'settings':
        return (
          <Settings
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            windowSize={{ width }}
          />
        );
      case 'feedback':
        return (
          <Feedback
            feedback={feedback}
            setFeedback={setFeedback}
            handleSubmit={handleFeedbackSubmit}
            darkMode={darkMode}
            windowSize={{ width }}
            loading={loading}
          />
        );
      case 'home':
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <CallForm
              handleCall={handleCall}
              phone={phone}
              setPhone={setPhone}
              topic={topic}
              setTopic={setTopic}
              isAdmin={isAdmin}
              callsLeft={callsLeft}
              loading={loading}
              status={status}
              darkMode={darkMode}
              windowSize={{ width }}
            />
          </motion.div>
        );
      case 'sms':
        return (
          <motion.div
            key="sms"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <SMSForm
              handleSMS={handleSMS}
              phone={phone}
              setPhone={setPhone}
              message={message}
              setMessage={setMessage}
              isAdmin={isAdmin}
              smsLeft={smsLeft}
              loading={loading}
              status={status}
              darkMode={darkMode}
              windowSize={{ width }}
            />
          </motion.div>
        );
      case 'history':
        return (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <CallHistory
              callHistory={callHistory}
              setCallHistory={setCallHistory}
              darkMode={darkMode}
            />
          </motion.div>
        );
      case 'settings':
        return (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Settings
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              setLanguage={setLanguage}
              language={language}
            />
          </motion.div>
        );
      default:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: 20,
              textAlign: 'center',
              color: darkMode ? '#fff' : '#222'
            }}
          >
            Page not found. Please go back to the main page.
          </motion.div>
        );
    }
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        width: '100%',
        maxWidth: '100%',
        position: 'relative',
        paddingTop: 60
      }}
    >
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </div>
  );
};

export default MainContent;
