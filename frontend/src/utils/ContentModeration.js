// ContentModeration.js - Utilities for moderating call content
// Works alongside backend Gemini moderation

/**
 * List of banned terms that are immediately rejected client-side
 * Note: Backend moderation via Gemini provides more sophisticated content filtering
 */
const BANNED_TERMS = [
  'kys',
  'kill yourself', 
  'suicide', 
  'die', 
  'death threat', 
  'bomb',
  'terrorist',
  'shoot',
  'murder',
  'attack'
];

/**
 * Check if a topic contains prohibited content
 * @param {string} topic - The call topic to moderate
 * @param {boolean} isPremium - Whether the user has premium (less strict moderation)
 * @returns {Object} Result with allowed status and reason if blocked
 */
export const moderateTopic = (topic, isPremium = false) => {
  // Skip basic moderation for premium users (they'll still get server-side moderation)
  if (isPremium) {
    return { allowed: true };
  }
  
  // Basic client-side moderation for regular users
  const lowerTopic = topic.toLowerCase();
  
  // Check against banned terms
  for (const term of BANNED_TERMS) {
    if (lowerTopic.includes(term)) {
      return { 
        allowed: false, 
        reason: 'Your topic contains prohibited content. Please choose a different topic.'
      };
    }
  }
  
  // Check for very short topics (likely to be rejected by backend anyway)
  if (topic.trim().length < 3) {
    return {
      allowed: false,
      reason: 'Please provide a more descriptive topic for your call.'
    };
  }
  
  return { allowed: true };
};

/**
 * Analyze topic complexity to suggest improvements
 * @param {string} topic - The call topic
 * @returns {string|null} Suggestion or null if topic is good
 */
export const analyzeTopic = (topic) => {
  if (topic.split(' ').length < 3) {
    return 'Consider adding more details to your topic for a better conversation.';
  }
  
  return null;
};

export default {
  moderateTopic,
  analyzeTopic,
  BANNED_TERMS
};
