import { useState, useEffect } from 'react';

/**
 * Custom hook to track window dimensions
 * @returns {Object} Current window width, height, and setter function
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Return both the dimensions and the setter for backward compatibility
  return {
    width: windowSize.width,
    height: windowSize.height,
    setWindowSize
  };
};

export default useWindowSize;
