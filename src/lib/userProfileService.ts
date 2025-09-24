import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '@/types';

export interface UserProfile {
    id: string;
    displayName: string;
    email: string;
    interests: string[];
    headline?: string;
    bio?: string;
    age?: number;
    location?: string;
    occupation?: string;
    profilePictureUrl?: string;
    socialLinks?: {
        instagram?: string;
        twitter?: string;
        linkedin?: string;
    };
    isVisible?: boolean;
    distanceRadius?: number;
    showAge?: boolean;
    showEmail?: boolean;
    createdAt: Date | { toDate: () => Date };
    updatedAt: Date | { toDate: () => Date };
    joinedAt?: Date | { toDate: () => Date };
}

class UserProfileService {
    private profilesRef = 'userProfiles';

    // Get user profile by ID
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            // Check if userId is valid
            if (!userId || typeof userId !== 'string') {
                console.error('UserProfileService: Invalid userId provided:', userId);
                return null;
            }

            const userDoc = doc(db, this.profilesRef, userId);
            const userSnap = await getDoc(userDoc);

            if (userSnap.exists()) {
                const data = userSnap.data();
                const profile: UserProfile = {
                    id: userSnap.id,
                    displayName: data.displayName || data.name || 'Unknown User',
                    email: data.email || '',
                    interests: data.interests || [],
                    headline: data.headline || 'Cirql User',
                    bio: data.bio || '',
                    age: data.age || '',
                    location: data.location || '',
                    occupation: data.occupation || '',
                    profilePictureUrl: data.profilePictureUrl || '',
                    socialLinks: data.socialLinks || {},
                    isVisible: data.isVisible !== false, // Default to true
                    distanceRadius: data.distanceRadius || 100,
                    showAge: data.showAge || false,
                    showEmail: data.showEmail || false,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                };
                return profile;
            } else {
                return null;
            }
        } catch (error) {
            console.error('UserProfileService: Error fetching profile:', error);
            throw error;
        }
    }

    // Get multiple user profiles by IDs
    async getManyUserProfiles(userIds: string[]): Promise<UserProfile[]> {
        try {
            const profiles: UserProfile[] = [];

            // Use Promise.all to fetch all profiles concurrently
            const profilePromises = userIds.map(async (userId) => {
                const profile = await this.getUserProfile(userId);
                return profile;
            });

            const results = await Promise.all(profilePromises);

            // Filter out null profiles and add to results
            results.forEach(profile => {
                if (profile) {
                    profiles.push(profile);
                }
            });

            return profiles;
        } catch (error) {
            console.error('UserProfileService: Error fetching multiple profiles:', error);
            throw error;
        }
    }

    // Create or update user profile
    async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
        try {
            const userDoc = doc(db, this.profilesRef, userId);

            // Check if profile exists
            const existingProfile = await this.getUserProfile(userId);

            const updateData = {
                ...profileData,
                updatedAt: serverTimestamp(),
            };

            if (existingProfile) {
                // Update existing profile
                await updateDoc(userDoc, updateData);
            } else {
                // Create new profile
                await setDoc(userDoc, {
                    ...profileData,
                    id: userId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }
        } catch (error) {
            console.error('UserProfileService: Error updating profile:', error);
            throw error;
        }
    }

    // Update user interests
    async updateUserInterests(userId: string, interests: string[]): Promise<void> {
        try {
            await this.updateUserProfile(userId, { interests });
        } catch (error) {
            console.error('UserProfileService: Error updating interests:', error);
            throw error;
        }
    }

    // Update user visibility
    async updateUserVisibility(userId: string, isVisible: boolean): Promise<void> {
        try {
            await this.updateUserProfile(userId, { isVisible });
        } catch (error) {
            console.error('UserProfileService: Error updating visibility:', error);
            throw error;
        }
    }

    // Get user display name (with fallback)
    async getUserDisplayName(userId: string): Promise<string> {
        try {
            const profile = await this.getUserProfile(userId);
            return profile?.displayName || 'Unknown User';
        } catch (error) {
            console.error('UserProfileService: Error getting display name:', error);
            return 'Unknown User';
        }
    }

    // Convert UserProfile to User (for compatibility)
    convertToUser(profile: UserProfile, location?: { lat: number; lng: number }, distance?: number): User {
        return {
            id: profile.id,
            displayName: profile.displayName,
            email: profile.email,
            profilePictureUrl: profile.profilePictureUrl,
            interests: profile.interests,
            headline: profile.headline,
            bio: profile.bio,
            age: profile.age,
            location,
            occupation: profile.occupation,
            socialLinks: profile.socialLinks,
            isVisible: profile.isVisible,
            distanceRadius: profile.distanceRadius,
            joinedAt: new Date(), // This will be set by the place service
            isOnline: true, // This will be set by the place service
            distance,
            createdAt: typeof profile.createdAt === 'object' && 'toDate' in profile.createdAt
                ? profile.createdAt.toDate()
                : profile.createdAt || new Date(),
            updatedAt: typeof profile.updatedAt === 'object' && 'toDate' in profile.updatedAt
                ? profile.updatedAt.toDate()
                : profile.updatedAt || new Date(),
        };
    }
}

const userProfileService = new UserProfileService();
export default userProfileService;
