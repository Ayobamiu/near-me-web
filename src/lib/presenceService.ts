import { database } from './firebase';
import { ref, onValue, onDisconnect, set, get } from 'firebase/database';

export interface UserPresence {
    id: string;
    displayName: string;
    email: string;
    isOnline: boolean;
    lastSeen: Date;
    currentPlace?: string | null;
    location?: {
        lat: number;
        lng: number;
    };
    profilePictureUrl?: string;
    headline?: string;
}

class PresenceService {
    private userStatusDatabaseRef: ReturnType<typeof ref> | null = null;

    // Set user as online using Realtime Database only
    async setOnline(userId: string, userData: Partial<UserPresence>, currentPlace?: string): Promise<void> {
        try {
            console.log(`🟢 Setting user ${userId} online with data:`, userData);
            console.log(`📍 Current place: ${currentPlace || 'none'}`);

            // Set up Realtime Database reference
            this.userStatusDatabaseRef = ref(database, `/status/${userId}`);

            // Define status objects
            const isOfflineForDatabase = {
                state: 'offline',
                last_changed: Date.now(),
            };

            // Filter out undefined values for Realtime Database
            const filteredUserData = Object.fromEntries(
                Object.entries(userData).filter(([, value]) => value !== undefined)
            );

            const isOnlineForDatabase = {
                state: 'online',
                last_changed: Date.now(),
                ...filteredUserData,
                currentPlace: currentPlace || null,
            };

            console.log(`📝 Realtime Database data to save:`, isOnlineForDatabase);

            // Listen to connection status
            const connectedRef = ref(database, '.info/connected');
            console.log('🔌 Setting up connection listener...');

            onValue(connectedRef, (snapshot) => {
                console.log(`🔌 Connection status: ${snapshot.val()}`);
                if (snapshot.val() == false) {
                    console.log('❌ Not connected, skipping online setup');
                    return;
                }

                console.log('✅ Connected, setting up onDisconnect...');
                if (this.userStatusDatabaseRef) {
                    onDisconnect(this.userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
                        console.log('🟢 Setting user online in Realtime Database...');
                        set(this.userStatusDatabaseRef!, isOnlineForDatabase).then(() => {
                            console.log('✅ Realtime Database status set successfully');
                        }).catch((error) => {
                            console.error('❌ Error setting Realtime Database status:', error);
                        });
                    }).catch((error) => {
                        console.error('❌ Error setting up onDisconnect:', error);
                    });
                }
            }, (error) => {
                console.error('❌ Error in connection listener:', error);
            });

        } catch (error) {
            console.error('❌ Error setting user online:', error);
            throw error;
        }
    }

    // Set user as offline
    async setOffline(userId: string): Promise<void> {
        try {
            console.log(`🔴 Setting user ${userId} offline`);
            const userStatusRef = ref(database, `/status/${userId}`);
            await set(userStatusRef, {
                state: 'offline',
                last_changed: Date.now(),
            });
            console.log('✅ User set offline successfully');
        } catch (error) {
            console.error('❌ Error setting user offline:', error);
            throw error;
        }
    }

    // Update user's current place
    async updateCurrentPlace(userId: string, placeId: string | null): Promise<void> {
        try {
            console.log(`📍 Updating current place for user ${userId}: ${placeId || 'none'}`);
            const userStatusRef = ref(database, `/status/${userId}`);

            // Get current status first
            const snapshot = await get(userStatusRef);
            if (snapshot.exists()) {
                const currentData = snapshot.val();
                await set(userStatusRef, {
                    ...currentData,
                    currentPlace: placeId,
                    last_changed: Date.now(),
                });
                console.log('✅ Current place updated successfully');
            } else {
                console.log('❌ User status not found, cannot update place');
            }
        } catch (error) {
            console.error('❌ Error updating current place:', error);
            throw error;
        }
    }

    // Update user's location
    async updateLocation(userId: string, lat: number, lng: number): Promise<void> {
        try {
            console.log(`📍 Updating location for user ${userId}: ${lat}, ${lng}`);
            const userStatusRef = ref(database, `/status/${userId}`);

            // Get current status first
            const snapshot = await get(userStatusRef);
            if (snapshot.exists()) {
                const currentData = snapshot.val();
                await set(userStatusRef, {
                    ...currentData,
                    location: { lat, lng },
                    last_changed: Date.now(),
                });
                console.log('✅ Location updated successfully');
            } else {
                console.log('❌ User status not found, cannot update location');
            }
        } catch (error) {
            console.error('❌ Error updating location:', error);
            throw error;
        }
    }

    // Subscribe to all online users using Realtime Database
    subscribeToOnlineUsers(callback: (users: UserPresence[]) => void): () => void {
        console.log('🔍 Setting up online users subscription from Realtime Database...');

        const statusRef = ref(database, 'status');

        const unsubscribe = onValue(statusRef, (snapshot) => {
            console.log(`📊 Realtime Database snapshot received`);
            const users: UserPresence[] = [];

            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log('📊 Raw status data:', data);

                Object.keys(data).forEach((userId) => {
                    const userData = data[userId];
                    console.log(`👤 User ${userId}:`, userData);

                    if (userData.state === 'online') {
                        users.push({
                            id: userId,
                            displayName: userData.displayName || 'Unknown',
                            email: userData.email || '',
                            isOnline: true,
                            lastSeen: new Date(userData.last_changed || Date.now()),
                            currentPlace: userData.currentPlace || null,
                            location: userData.location || null,
                            profilePictureUrl: userData.profilePictureUrl || null,
                            headline: userData.headline || null,
                        });
                    }
                });
            }

            console.log(`✅ Total online users: ${users.length}`, users);
            callback(users);
        }, (error) => {
            console.error('❌ Error in online users subscription:', error);
            callback([]);
        });

        return unsubscribe;
    }

    // Subscribe to users in a specific place
    subscribeToPlaceUsers(placeId: string, callback: (users: UserPresence[]) => void): () => void {
        console.log(`🔍 Setting up place users subscription for place: ${placeId}`);

        const statusRef = ref(database, 'status');

        const unsubscribe = onValue(statusRef, (snapshot) => {
            console.log(`📊 Place users snapshot received for place: ${placeId}`);
            const users: UserPresence[] = [];

            if (snapshot.exists()) {
                const data = snapshot.val();

                Object.keys(data).forEach((userId) => {
                    const userData = data[userId];

                    if (userData.state === 'online' && userData.currentPlace === placeId) {
                        users.push({
                            id: userId,
                            displayName: userData.displayName || 'Unknown',
                            email: userData.email || '',
                            isOnline: true,
                            lastSeen: new Date(userData.last_changed || Date.now()),
                            currentPlace: userData.currentPlace || null,
                            location: userData.location || null,
                            profilePictureUrl: userData.profilePictureUrl || null,
                            headline: userData.headline || null,
                        });
                    }
                });
            }

            console.log(`✅ Users in place ${placeId}: ${users.length}`, users);
            callback(users);
        }, (error) => {
            console.error('❌ Error in place users subscription:', error);
            callback([]);
        });

        return unsubscribe;
    }

    // Remove user presence (cleanup)
    async removePresence(userId: string): Promise<void> {
        try {
            console.log(`🗑️ Removing presence for user: ${userId}`);
            const userStatusRef = ref(database, `/status/${userId}`);
            await set(userStatusRef, null);
            console.log('✅ User presence removed successfully');
        } catch (error) {
            console.error('❌ Error removing user presence:', error);
            throw error;
        }
    }

    // Debug method to check what's in the status collection
    async debugStatusCollection(): Promise<void> {
        try {
            console.log('🔍 Debugging Realtime Database status...');
            const statusRef = ref(database, 'status');
            const snapshot = await get(statusRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log(`📊 Found ${Object.keys(data).length} users in Realtime Database:`);
                Object.keys(data).forEach((userId) => {
                    console.log(`👤 User ${userId}:`, data[userId]);
                });
            } else {
                console.log('📊 No users found in Realtime Database');
            }
        } catch (error) {
            console.error('❌ Error debugging Realtime Database:', error);
        }
    }
}

const presenceService = new PresenceService();
export default presenceService;