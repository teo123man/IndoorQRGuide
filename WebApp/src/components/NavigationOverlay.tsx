import { useState, useEffect, useRef } from "react";
import type { NavigatorState } from "@/lib/navigator";
import { DirectionArrow } from "./DirectionArrow";
import { GuideCharacter } from "./GuideCharacter";
import { SpeechBubble } from "./SpeechBubble";
import { MapPin } from "lucide-react";

interface NavigationOverlayProps {
  state: NavigatorState;
  isSpeaking: boolean;
}

export const NavigationOverlay = ({ state, isSpeaking }: NavigationOverlayProps) => {
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState("");
  const [bubbleKey, setBubbleKey] = useState(0);
  const prevMsgRef = useRef("");

  // Trigger speech bubble when statusMsg changes or on direction scan results
  useEffect(() => {
    if (state.statusMsg && state.statusMsg !== prevMsgRef.current) {
      setBubbleText(state.statusMsg);
      setShowBubble(true);
      setBubbleKey((k) => k + 1); // Force re-render for new animation
      prevMsgRef.current = state.statusMsg;
    }
  }, [state.statusMsg, state.lastScanResult]);

  const handleBubbleHidden = () => {
    setShowBubble(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
      {/* Top destination label */}
      <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg self-start">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="font-medium text-card-foreground text-sm">
          Destination: {state.destinationRoom}
        </span>
      </div>

      {/* Speech Bubble */}
      <SpeechBubble
        key={bubbleKey}
        text={bubbleText}
        isVisible={showBubble}
        autoHideDelay={4000}
        onHidden={handleBubbleHidden}
      />

      {/* Bottom navigation guide */}
      <div className="flex items-end gap-2">
        {/* Guide Character */}
        <GuideCharacter isSpeaking={isSpeaking} />
        
        {/* Direction Arrow */}
        <div className="flex-shrink-0 -ml-2 -mb-1">
          <DirectionArrow direction={state.nextDirection} />
        </div>

        {/* Progress and debug info */}
        <div className="flex-1 min-w-0">
          {state.stepsRemaining !== null && state.stepsRemaining > 0 && (
            <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(10, 100 - state.stepsRemaining * 3)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  ~{state.stepsRemaining} steps
                </span>
              </div>
              {/* Debug/status info showing start and current nodes */}
              {state.currentNode && (
                <div className="mt-1 text-xs text-muted-foreground opacity-70 truncate">
                  Start: {state.startNode ?? "-"} · Current: {state.currentNode}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
