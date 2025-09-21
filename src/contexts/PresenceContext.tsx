"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  default as presenceService,
  UserPresence,
} from "@/lib/presenceService";

interface PresenceContextType {
  onlineUsers: UserPresence[];
  placeUsers: UserPresence[];
  isOnline: boolean;
  currentPlace: string | null;
  loading: boolean;
  setOnline: (placeId?: string) => Promise<void>;
  setOffline: () => Promise<void>;
  updateCurrentPlace: (placeId: string | null) => Promise<void>;
  updateLocation: (lat: number, lng: number) => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(
  undefined
);

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error("usePresence must be used within a PresenceProvider");
  }
  return context;
};

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [placeUsers, setPlaceUsers] = useState<UserPresence[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [currentPlace, setCurrentPlace] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up presence when user logs in
  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      setPlaceUsers([]);
      setIsOnline(false);
      setCurrentPlace(null);
      setLoading(false);
      return;
    }

    // Set up user presence
    const setupPresence = async () => {
      try {
        console.log(`🔧 Setting up presence for user: ${user.uid}`);
        console.log(`👤 User data:`, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });

        await presenceService.setOnline(user.uid, {
          id: user.uid,
          displayName: user.displayName || "User",
          email: user.email || "",
          profilePictureUrl: user.photoURL || undefined,
        });
        setIsOnline(true);
        console.log(`✅ User ${user.uid} is now online`);
      } catch (error) {
        console.error("❌ Error setting up presence:", error);
      }
    };

    setupPresence();

    // Subscribe to all online users
    console.log(
      `🔍 Setting up online users subscription for user: ${user.uid}`
    );
    const unsubscribeOnline = presenceService.subscribeToOnlineUsers(
      (users) => {
        console.log(`📊 Received ${users.length} online users:`, users);
        // Filter out current user
        const otherUsers = users.filter((u) => u.id !== user.uid);
        console.log(
          `👥 Other users (excluding self): ${otherUsers.length}`,
          otherUsers
        );
        setOnlineUsers(otherUsers);
        setLoading(false);
      }
    );

    // Debug: Check what's in the Realtime Database
    presenceService.debugStatusCollection();

    return () => {
      unsubscribeOnline();
    };
  }, [user]);

  // Subscribe to place users when currentPlace changes
  useEffect(() => {
    if (!user || !currentPlace) {
      setPlaceUsers([]);
      return;
    }

    const unsubscribePlace = presenceService.subscribeToPlaceUsers(
      currentPlace,
      (users) => {
        // Filter out current user
        const otherUsers = users.filter((u) => u.id !== user.uid);
        setPlaceUsers(otherUsers);
      }
    );

    return () => {
      unsubscribePlace();
    };
  }, [user, currentPlace]);

  // Clean up presence when user logs out
  useEffect(() => {
    return () => {
      if (user) {
        presenceService.removePresence(user.uid);
      }
    };
  }, [user]);

  const setOnline = async (placeId?: string) => {
    if (!user) return;

    try {
      await presenceService.setOnline(
        user.uid,
        {
          id: user.uid,
          displayName: user.displayName || "User",
          email: user.email || "",
          profilePictureUrl: user.photoURL || undefined,
        },
        placeId
      );
      setIsOnline(true);
      if (placeId) {
        setCurrentPlace(placeId);
      }
    } catch (error) {
      console.error("Error setting online:", error);
    }
  };

  const setOffline = async () => {
    if (!user) return;

    try {
      await presenceService.setOffline(user.uid);
      setIsOnline(false);
      setCurrentPlace(null);
    } catch (error) {
      console.error("Error setting offline:", error);
    }
  };

  const updateCurrentPlace = async (placeId: string | null) => {
    if (!user) return;

    try {
      await presenceService.updateCurrentPlace(user.uid, placeId);
      setCurrentPlace(placeId);
    } catch (error) {
      console.error("Error updating current place:", error);
    }
  };

  const updateLocation = async (lat: number, lng: number) => {
    if (!user) return;

    try {
      await presenceService.updateLocation(user.uid, lat, lng);
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  const value: PresenceContextType = {
    onlineUsers,
    placeUsers,
    isOnline,
    currentPlace,
    loading,
    setOnline,
    setOffline,
    updateCurrentPlace,
    updateLocation,
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};
