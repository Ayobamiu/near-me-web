"use client";

import { useState, useEffect } from "react";
import { Place } from "@/types";

interface PlaceShareModalProps {
  place: Place;
  onClose: () => void;
}

export default function PlaceShareModal({
  place,
  onClose,
}: PlaceShareModalProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate shareable URL
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/place/${place.id}`;
    setShareUrl(shareUrl);
  }, [place.id]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join me at ${place.name} on NearMe`,
          text: `I'm at ${place.name}. Join me on NearMe!`,
          url: shareUrl,
        });
      } catch {
        console.log("Share cancelled");
      }
    } else {
      // Fallback to copy
      copyToClipboard();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Share Place</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {place.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{place.name}</h4>
              <p className="text-sm text-gray-500">Join this place on NearMe</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share Link
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-white hover:bg-gray-700"
              }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={shareNative}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
            Share via App
          </button>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> Anyone with this link can join your place
            and see who else is there!
          </p>
        </div>
      </div>
    </div>
  );
}
