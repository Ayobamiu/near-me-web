"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import QRCode from "qrcode";

interface QRBadgeProps {
  onClose: () => void;
}

export default function QRBadge({ onClose }: QRBadgeProps) {
  const { user } = useAuth();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, [user]);

  const generateQRCode = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      // Create a profile URL that can be scanned
      const profileUrl = `${window.location.origin}/profile/${user.uid}`;

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(profileUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrCodeDataUrl(qrCodeUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement("a");
    link.download = `nearme-profile-${user?.uid}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  const shareProfile = async () => {
    if (!user) return;

    const profileUrl = `${window.location.origin}/profile/${user.uid}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Connect with ${user.displayName || "me"} on NearMe`,
          text: `Scan my QR code to connect on NearMe!`,
          url: profileUrl,
        });
      } catch {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(profileUrl);
      alert("Profile link copied to clipboard!");
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
          <p className="text-center text-gray-600">
            Please sign in to generate your QR badge
          </p>
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your QR Badge</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="text-center">
          <div className="mb-4">
            <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
              {isGenerating ? (
                <div className="text-gray-500">Generating...</div>
              ) : qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-500">Error generating QR</div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium text-gray-900">
              {user.displayName || "NearMe User"}
            </h3>
            <p className="text-sm text-gray-600">Scan to connect instantly</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={downloadQRCode}
              disabled={!qrCodeDataUrl}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download QR Code
            </button>

            <button
              onClick={shareProfile}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Share Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
