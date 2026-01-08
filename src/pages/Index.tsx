import { useState, useCallback, useRef, useEffect } from "react";
import { Navigator, DESTINATIONS } from "@/lib/navigator";
import { QRScanner } from "@/components/QRScanner";
import { NavigationOverlay } from "@/components/NavigationOverlay";
import { DestinationSelector } from "@/components/DestinationSelector";
import { useVoiceGuidance } from "@/hooks/useVoiceGuidance";
import { QrCode, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [destination, setDestination] = useState(DESTINATIONS[0]);
  const navigatorRef = useRef<Navigator>(new Navigator(DESTINATIONS[0]));
  const [navigatorState, setNavigatorState] = useState(() => navigatorRef.current.getState());

  const { isMuted, isSpeaking, needsUserGesture, toggleMute, unlockAudio, playIntro, playDirection, playDestChanged, playScanError } = useVoiceGuidance();

  // Play intro on first user interaction (due to browser autoplay policies)
  useEffect(() => {
    const handleFirstInteraction = () => {
      playIntro();
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("touchstart", handleFirstInteraction);
    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [playIntro]);

  // Update navigator destination when it changes
  useEffect(() => {
    navigatorRef.current.setDestinationRoom(destination);
    setNavigatorState(navigatorRef.current.getState());
  }, [destination]);

  const handleScan = useCallback(
    (data: string) => {
      navigatorRef.current.handleQr(data);
      const state = navigatorRef.current.getState();
      setNavigatorState(state);

      // Trigger voice based on scan result
      if (state.lastScanResult === "direction" && state.nextDirection) {
        playDirection(state.nextDirection);
      } else if (state.lastScanResult === "arrival") {
        playDirection("done");
      } else if (state.lastScanResult === "unknown_marker") {
        playScanError();
      }
    },
    [playDirection, playScanError]
  );

  const handleDestinationChange = useCallback(
    (newDest: string) => {
      setDestination(newDest);
      playDestChanged();
    },
    [playDestChanged]
  );

  const getCameraStatus = () => {
    if (navigatorState.currentNode) {
      return `At: ${navigatorState.currentNode}`;
    }
    return "Scanning...";
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-foreground">QR Indoor Navigation</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8"
            aria-label={isMuted ? "Unmute voice guidance" : "Mute voice guidance"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-primary" />
            )}
          </Button>
          <span className="text-xs text-muted-foreground">HCI Project</span>
        </div>
      </header>

      {/* Main scanner area */}
      <div className="relative flex-1 overflow-hidden">
        <QRScanner onScan={handleScan} />
        <NavigationOverlay state={navigatorState} isSpeaking={isSpeaking} />
        
        {/* Audio unlock overlay for mobile */}
        {needsUserGesture && (
          <div 
            className="absolute inset-0 bg-background/80 flex items-center justify-center z-50 cursor-pointer"
            onClick={unlockAudio}
          >
            <div className="bg-card p-6 rounded-xl shadow-lg text-center border border-border">
              <Volume2 className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-foreground font-medium">Tap to enable voice guidance</p>
              <p className="text-muted-foreground text-sm mt-1">Required for audio on mobile</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <DestinationSelector
        value={destination}
        onChange={handleDestinationChange}
        status={getCameraStatus()}
      />
    </div>
  );
};

export default Index;
