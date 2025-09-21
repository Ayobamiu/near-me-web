"use client";

import { useState, useRef } from "react";
import { uploadProfilePicture, compressImage } from "@/lib/imageUploadService";

interface ProfilePictureProps {
  imageUrl?: string;
  displayName?: string;
  size?: number;
  onImageChange?: (imageUrl: string) => void;
  editable?: boolean;
  loading?: boolean;
  className?: string;
}

export default function ProfilePicture({
  imageUrl,
  displayName = "",
  size = 80,
  onImageChange,
  editable = true,
  loading = false,
  className = "",
}: ProfilePictureProps) {
  const [uploading, setUploading] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageClick = () => {
    if (editable && !loading && !uploading) {
      fileInputRef.current?.click();
    } else if (!editable) {
      setShowImageViewer(true);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !onImageChange) return;

    try {
      setUploading(true);

      // Compress the image before uploading
      const compressedFile = await compressImage(file, 400, 0.8);

      // Upload to Firebase Storage
      const downloadURL = await uploadProfilePicture(
        displayName || "user",
        compressedFile
      );

      // Call the callback with the new URL
      onImageChange(downloadURL);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isLoading = loading || uploading;

  return (
    <>
      <div
        className={`relative cursor-pointer group ${className}`}
        onClick={handleImageClick}
        style={{ width: size, height: size }}
      >
        <div
          className="w-full h-full rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-all duration-200 group-hover:bg-gray-300"
          style={{ fontSize: size * 0.4 }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(displayName)
          )}
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}

        {/* Edit overlay for editable images */}
        {editable && !isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-30 rounded-full flex items-center justify-center transition-all duration-200">
            <svg
              className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Image viewer modal */}
      {showImageViewer && imageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowImageViewer(false)}
        >
          <div className="max-w-4xl max-h-full p-4">
            <img
              src={imageUrl}
              alt={displayName}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
