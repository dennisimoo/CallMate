/**
 * Handles the premium login and transitions
 */

/**
 * Validate premium code and handle login
 * @param {string} code - The premium code entered
 * @returns {boolean} - Whether code is valid 
 */
export const validatePremiumCode = (code) => {
  return code === 'premium1001' || code === 'PREMIUM1001';
};

/**
 * Premium activation success handler
 * @param {Function} setIsAdmin - Function to update admin state
 * @param {Function} setAdminPass - Function to reset admin password state
 * @param {Function} setActiveTab - Function to set active tab
 * @param {Function} setShowPremiumPopup - Function to show premium popup
 */
export const handlePremiumSuccess = (setIsAdmin, setAdminPass, setActiveTab, setShowPremiumPopup) => {
  setIsAdmin(true);
  setAdminPass('');
  setActiveTab('main');
  setShowPremiumPopup(true);
  
  // Auto-hide the popup after 6 seconds
  setTimeout(() => {
    setShowPremiumPopup(false);
  }, 6000);
};

export default {
  validatePremiumCode,
  handlePremiumSuccess
};
