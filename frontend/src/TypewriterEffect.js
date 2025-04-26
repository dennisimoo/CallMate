import React, { useState, useEffect, useRef } from 'react';

const TypewriterEffect = ({ phrases, typingSpeed = 70, deletingSpeed = 40, pauseBetween = 1500, onComplete }) => {
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isComplete) return;

    const currentFullPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
      // Deleting text
      if (currentPhrase === '') {
        setIsDeleting(false);
        setPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
        timerRef.current = setTimeout(() => {
          // Wait before typing the next phrase
        }, pauseBetween);
      } else {
        timerRef.current = setTimeout(() => {
          setCurrentPhrase(currentPhrase.slice(0, -1));
        }, deletingSpeed);
      }
    } else {
      // Typing text
      if (currentPhrase === currentFullPhrase) {
        timerRef.current = setTimeout(() => {
          setIsDeleting(true);
        }, pauseBetween);
      } else {
        timerRef.current = setTimeout(() => {
          setCurrentPhrase(currentFullPhrase.slice(0, currentPhrase.length + 1));
        }, typingSpeed);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentPhrase, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseBetween, isComplete]);

  // Allow stopping the animation from outside
  useEffect(() => {
    if (onComplete) {
      return () => {
        setIsComplete(true);
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [onComplete]);

  return currentPhrase;
};

export default TypewriterEffect;
