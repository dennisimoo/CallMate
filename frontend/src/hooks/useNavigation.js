import { useState, useEffect } from 'react';

/**
 * Custom hook for handling tab navigation
 * @returns {Object} Navigation state and controls
 */
export const useNavigation = () => {
  const [activeTab, setActiveTab] = useState('main');

  useEffect(() => {
    // Listen for navigateToTab events
    function handleNavigate(e) {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab);
      }
    }
    window.addEventListener('navigateToTab', handleNavigate);
    return () => window.removeEventListener('navigateToTab', handleNavigate);
  }, []);

  return {
    activeTab,
    setActiveTab
  };
};

export default useNavigation;
