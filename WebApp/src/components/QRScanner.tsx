import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerProps {
  onScan: (data: string) => void;
}

export const QRScanner = ({ onScan }: QRScannerProps) => {
  const [status, setStatus] = useState<"initializing" | "running" | "error" | "stopped">("initializing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      setStatus("initializing");
      setErrorMessage("");

      // Clean up existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // Ignore stop errors
        }
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      const devices = await Html5Qrcode.getCameras();

      if (!devices || devices.length === 0) {
        setStatus("error");
        setErrorMessage("No camera found on this device.");
        return;
      }

      // Prefer back camera for mobile
      const backCamera = devices.find(
        (d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear"),
      );
      const cameraId = backCamera?.id || devices[0].id;

      const config: Html5QrcodeCameraScanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Strict 4-second lockout after any successful scan
      const LOCKOUT_MS = 1000;
      const scanState = { lastScanTime: 0 };

      await scanner.start(
        cameraId,
        config,
        (decodedText) => {
          const now = Date.now();

          // Ignore ALL scans within 4 seconds of last accepted scan
          if (now - scanState.lastScanTime < LOCKOUT_MS) {
            return;
          }

          scanState.lastScanTime = now;
          onScan(decodedText.trim());
        },
        () => {
          // QR code scan failure - ignore, scanner keeps running
        },
      );

      setStatus("running");
    } catch (err) {
      console.error("Camera error:", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Camera access failed. Please allow camera permissions.");
    }
  }, [onScan]);

  useEffect(() => {
    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [startScanner]);

  return (
    <div className="relative w-full h-full bg-secondary">
      {/* Scanner container */}
      <div
        id="qr-reader"
        ref={containerRef}
        className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
      />

      {/* Status overlays */}
      {status === "initializing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <div className="flex flex-col items-center gap-3 text-secondary-foreground">
            <Camera className="w-12 h-12 animate-pulse" />
            <p className="text-sm">Initializing camera...</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <CameraOff className="w-12 h-12 text-destructive" />
            <p className="text-sm text-secondary-foreground">{errorMessage}</p>
            <Button onClick={startScanner} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Scan frame overlay */}
      {status === "running" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-primary rounded-2xl relative">
            {/* Corner accents */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </div>
        </div>
      )}
    </div>
  );
};
