"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Create user profile in Firestore
      const userProfile = {
        id: userCredential.user.uid,
        displayName: name,
        email: email,
        profilePictureUrl: userCredential.user.photoURL || "",
        interests: [],
        bio: "",
        createdAt: new Date(),
        isOnline: true,
      };

      await setDoc(
        doc(db, "userProfiles", userCredential.user.uid),
        userProfile
      );
      console.log("✅ User profile created in Firestore");
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut: signOutUser,
    signUp,
    signInWithEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
