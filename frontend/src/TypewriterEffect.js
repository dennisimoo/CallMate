import './TypewriterEffect.css';
import React, { useState, useEffect, useRef } from 'react';

/**
 * Modern, accessible typewriter effect with theme support and improved animation.
 * - Types one phrase at a time, looping through suggestions.
 * - Supports dark and light mode for cursor and text.
 */
const TypewriterEffect = ({ phrases, darkMode }) => {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const timerRef = useRef(null);

  // Theme-aware colors
  const cursorColor = darkMode ? '#fff' : '#222';
  const textColor = darkMode ? '#fff' : '#1b1b1b';

  // Typing/deleting animation for suggestions
  useEffect(() => {
    const phrase = phrases[index];
    if (!isDeleting && displayed.length < phrase.length) {
      timerRef.current = setTimeout(() => {
        setDisplayed(phrase.slice(0, displayed.length + 1));
      }, 55 + Math.random() * 40);
    } else if (!isDeleting && displayed.length === phrase.length) {
      timerRef.current = setTimeout(() => setIsDeleting(true), 1700);
    } else if (isDeleting && displayed.length > 0) {
      timerRef.current = setTimeout(() => {
        setDisplayed(displayed.slice(0, -1));
      }, 28 + Math.random() * 25);
    } else if (isDeleting && displayed.length === 0) {
      setTransitioning(true);
      timerRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % phrases.length);
        setIsDeleting(false);
        setTransitioning(false);
      }, 320);
    }
    return () => clearTimeout(timerRef.current);
  }, [displayed, isDeleting, index, phrases]);

  // Blinking cursor
  useEffect(() => {
    const blink = setInterval(() => setShowCursor((c) => !c), 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <span className={`typewriter-outer${transitioning ? ' slide-out' : ' slide-in'}`}>
      <span 
        className="typewriter-text" 
        style={{ 
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
          textDecoration: 'none',
          color: textColor 
        }} 
        unselectable="on"
      >
        {displayed}
      </span>
      <span 
        className={`typewriter-cursor${showCursor ? '' : ' hidden'}`} 
        style={{ 
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          color: cursorColor 
        }} 
        unselectable="on"
      > 
      </span>
    </span>
  );
};

export default TypewriterEffect;