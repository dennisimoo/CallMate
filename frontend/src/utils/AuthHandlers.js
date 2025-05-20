import { supabase } from '../supabaseClient';

/**
 * Fetch user preferences from Supabase
 * @param {string} userId - The user's ID
 * @param {Function} setDarkMode - State setter for dark mode
 * @param {Function} setIsAdmin - State setter for admin status
 * @param {Function} setCallsLeft - State setter for calls left
 * @param {Function} setPhone - State setter for phone number
 * @param {Function} setUserPreferences - State setter for consolidated user preferences
 */
export const fetchUserPreferences = async (
  userId,
  setDarkMode,
  setIsAdmin,
  setCallsLeft,
  setPhone,
  setUserPreferences
) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      return;
    }

    if (data) {
      // Update local state from preferences
      setDarkMode(data.dark_mode !== false); // Default to dark mode if not specified
      setIsAdmin(data.is_admin || false);
      // Set calls_left to MAX_CALLS (or higher) for premium users, otherwise use the stored value
      const userCallsLeft = data.is_admin ? 100 : (data.calls_left || 10);
      setCallsLeft(userCallsLeft);
      setPhone(data.phone_number || '');
      
      // Update consolidated state
      setUserPreferences({
        darkMode: data.dark_mode !== false,
        isAdmin: data.is_admin || false,
        callsLeft: userCallsLeft,
        phoneNumber: data.phone_number || ''
      });
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error);
  }
};

/**
 * Save user preferences to Supabase
 * @param {Object} session - User session
 * @param {boolean} darkMode - Dark mode setting
 * @param {boolean} isAdmin - Admin status
 * @param {number} callsLeft - Calls remaining
 * @param {string} phone - User phone number
 */
export const saveUserPreferences = async (
  session,
  darkMode,
  isAdmin, 
  callsLeft,
  phone
) => {
  if (!session?.user?.id) return;
  
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.user.id,
        dark_mode: darkMode,
        is_admin: isAdmin,
        calls_left: callsLeft,
        phone_number: phone,
        updated_at: new Date()
      });

    if (error) {
      console.error('Error saving preferences:', error);
    }
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

/**
 * Handle sign out process
 */
export const handleSignOut = async () => {
  // Clear authentication state
  await supabase.auth.signOut();
  
  // Clear bypass auth flag if it exists
  localStorage.removeItem('bypass_auth');
  
  // Clear other stored values 
  localStorage.removeItem('plektu_calls_left');
  localStorage.removeItem('plektu_phone');
  localStorage.removeItem('plektu_admin');
  
  // Force refresh to show login screen
  window.location.reload();
};

export default {
  fetchUserPreferences,
  saveUserPreferences,
  handleSignOut
};
