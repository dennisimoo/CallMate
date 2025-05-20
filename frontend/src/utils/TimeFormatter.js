/**
 * Time formatting utilities for the Plektu app
 */

/**
 * Format a date string to PST/PDT timezone
 * @param {string} iso - ISO timestamp string
 * @returns {string} - Formatted date/time string in PST/PDT
 */
export function getPSTTimeString(iso) {
  try {
    if (!iso) return '';
    
    // Create a date object from the ISO string
    const date = new Date(iso);
    
    // Format directly using PST/PDT timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    // Format the date
    return formatter.format(date);
  } catch (error) {
    console.error("Time formatting error:", error);
    return iso || ''; // Return original if there's an error
  }
}

export default getPSTTimeString;
