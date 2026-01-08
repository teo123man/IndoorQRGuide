import { useEffect, useState, useRef } from "react";
import { useTypewriter } from "@/hooks/useTypewriter";
import { cn } from "@/lib/utils";

interface SpeechBubbleProps {
  text: string;
  isVisible: boolean;
  autoHideDelay?: number;
  onHidden?: () => void;
}

export const SpeechBubble = ({
  text,
  isVisible,
  autoHideDelay = 3000,
  onHidden,
}: SpeechBubbleProps) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { displayedText, isComplete } = useTypewriter({
    text: isVisible ? text : "",
    wordDelay: 100,
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  // Auto-hide after typing completes
  useEffect(() => {
    if (isComplete && isVisible && !isAnimatingOut && text) {
      hideTimerRef.current = setTimeout(() => {
        setIsAnimatingOut(true);
        setTimeout(() => {
          setIsAnimatingOut(false);
          onHidden?.();
        }, 300);
      }, autoHideDelay);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [isComplete, isVisible, autoHideDelay, isAnimatingOut, onHidden, text]);

  if (!isVisible || !text) return null;

  return (
    <div
      className={cn(
        "absolute bottom-36 left-20 max-w-[220px] z-10 transition-all duration-300",
        isAnimatingOut
          ? "opacity-0 scale-95 translate-y-2"
          : "opacity-100 scale-100 translate-y-0 animate-scale-in"
      )}
    >
      {/* Speech bubble */}
      <div className="relative bg-card border border-border rounded-2xl px-3 py-2 shadow-lg">
        <p className="text-card-foreground text-sm leading-relaxed">
          {displayedText}
          {!isComplete && (
            <span className="inline-block w-1 h-4 ml-1 bg-primary animate-pulse" />
          )}
        </p>
        
        {/* Bubble tail pointing to character */}
        <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-card" />
        <div className="absolute -bottom-[10px] left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-border" style={{ zIndex: -1 }} />
      </div>
    </div>
  );
};
