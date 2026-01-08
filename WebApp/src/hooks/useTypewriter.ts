import { useState, useEffect, useCallback } from "react";

interface UseTypewriterOptions {
  text: string;
  wordDelay?: number;
  onComplete?: () => void;
}

export const useTypewriter = ({
  text,
  wordDelay = 120,
  onComplete,
}: UseTypewriterOptions) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  const words = text.split(" ");

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("");
    setWordIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (wordIndex < words.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => {
          const newText = prev ? `${prev} ${words[wordIndex]}` : words[wordIndex];
          return newText;
        });
        setWordIndex((prev) => prev + 1);
      }, wordDelay);

      return () => clearTimeout(timer);
    } else if (wordIndex === words.length && words.length > 0) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [wordIndex, words, wordDelay, onComplete]);

  const reset = useCallback(() => {
    setDisplayedText("");
    setWordIndex(0);
    setIsComplete(false);
  }, []);

  return { displayedText, isComplete, reset };
};
