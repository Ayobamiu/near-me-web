"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const initScanner = async () => {
      try {
        // Check for camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        setHasPermission(true);
        setIsScanning(true);

        // Initialize ZXing reader
        readerRef.current = new BrowserMultiFormatReader();

        // Start scanning
        if (videoRef.current) {
          readerRef.current.decodeFromVideoDevice(
            null,
            videoRef.current,
            (result, error) => {
              if (result) {
                setIsScanning(false);
                onScan(result.getText());
              }
              if (error && error.name !== "NotFoundException") {
                console.error("QR Scan error:", error);
                onError?.(error);
              }
            }
          );
        }

        // Stop the stream after getting permission
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.error("Camera permission error:", error);
        setHasPermission(false);
        onError?.(error as Error);
      }
    };

    initScanner();

    // Cleanup on unmount
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [onScan, onError]);

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Requesting camera permission...</p>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 mb-4">Camera permission denied</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isScanning && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded">
            Scanning for QR code...
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-64 object-cover rounded-lg"
        playsInline
        muted
      />
    </div>
  );
}
