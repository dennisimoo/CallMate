import { moderateTopic } from './ContentModeration';
import { supabase } from '../supabaseClient';
import { triggerCall } from '../api';

/**
 * Handle a new call request
 * @param {Object} params - Call parameters
 * @returns {Object} - Call result with status
 */
export const handleCallRequest = async ({
  phone,
  topic,
  isAdmin,
  callsLeft,
  session,
  setStatus,
  setCallsLeft,
  setActiveTab
}) => {
  try {
    // Check if regular user has calls left
    if (!isAdmin && callsLeft <= 0) {
      return {
        success: false,
        message: 'You have reached the maximum number of calls for your account.'
      };
    }

    // Use the ContentModeration utility for client-side moderation
    const moderationResult = moderateTopic(topic, isAdmin);
    if (!moderationResult.allowed) {
      return {
        success: false,
        message: moderationResult.reason
      };
    }

    // If premium, pass a flag to bypass moderation and set longer call time
    const premiumFlag = isAdmin ? { premium: true, max_time: 180 } : { max_time: 60 };
    // Include user_id if available
    const userIdFlag = session?.user?.id ? { user_id: session.user.id } : {};

    // Actually make the call
    const callRes = await triggerCall(phone, topic, { ...premiumFlag, ...userIdFlag });
    let latestCallId = null;
    
    if (callRes && callRes.call_id) {
      latestCallId = callRes.call_id;
      
      // Save call to appropriate history store
      if (session?.user?.id) {
        // For signed-in users, save to Supabase
        try {
          const { error } = await supabase
            .from('call_history')
            .insert({
              user_id: session.user.id,
              phone_number: phone,
              call_id: callRes.call_id,
              topic,
              status: callRes.status || 'pending',
              call_time: new Date().toISOString()
            });
            
          if (error) {
            console.error('Error saving call to Supabase:', error);
            // Save to localStorage as backup if Supabase fails
            saveToLocalStorage(callRes.call_id, topic, callRes.status);
          } else {
            console.log('Successfully saved call to Supabase');
            
            // Also update user's calls_left in Supabase if not admin
            if (!isAdmin) {
              const newCallsLeft = callsLeft - 1;
              const { error: updateError } = await supabase
                .from('user_preferences')
                .update({ calls_left: newCallsLeft })
                .eq('user_id', session.user.id);
                
              if (updateError) {
                console.error('Error updating calls_left in Supabase:', updateError);
              }
            }
          }
        } catch (supabaseError) {
          console.error('Failed to save call to Supabase:', supabaseError);
        }
      } else {
        // For guests, update localStorage with new call
        saveToLocalStorage(callRes.call_id, topic, callRes.status);
      }
      
      // Only decrease calls left for regular users, not premium/admin
      if (!isAdmin && callsLeft > 0) {
        const newCallsLeft = callsLeft - 1;
        setCallsLeft(newCallsLeft);
        localStorage.setItem('plektu_calls_left', String(newCallsLeft));
      }
      
      // After a short delay, switch to the call history tab and auto-expand the latest call
      setTimeout(() => {
        setActiveTab('chat');
        if (latestCallId) {
          setTimeout(() => {
            // Use a custom event to tell CallHistory to auto-select the latest call
            window.dispatchEvent(new CustomEvent('autoExpandCall', { detail: { callId: latestCallId } }));
          }, 400);
        }
      }, 800);
      
      return {
        success: true,
        message: 'Call placed successfully!',
        callId: callRes.call_id
      };
    } else if (callRes && callRes.message) {
      return {
        success: false,
        message: callRes.message
      };
    } else {
      return {
        success: false,
        message: 'Call failed.'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: (error && error.message) || 'Call failed.'
    };
  }
};

/**
 * Save call data to local storage (for guests or as backup)
 */
const saveToLocalStorage = (callId, topic, status) => {
  const guestHistory = JSON.parse(localStorage.getItem('plektu_guest_call_history') || '[]');
  const newCall = {
    call_id: callId,
    topic,
    status: status || 'pending',
    call_time: new Date().toISOString(),
  };
  const updatedGuestHistory = [newCall, ...guestHistory];
  localStorage.setItem('plektu_guest_call_history', JSON.stringify(updatedGuestHistory));
};

export default {
  handleCallRequest
};
