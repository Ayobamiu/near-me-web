import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { calculateDistance } from '@/lib/geospatial';
import { User } from '@/types';
import userProfileService from '@/lib/userProfileService';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ placeId: string }> }
) {
    try {
        const { placeId } = await params;
        const { searchParams } = new URL(request.url);
        const originLat = parseFloat(searchParams.get('originLat') || '0');
        const originLng = parseFloat(searchParams.get('originLng') || '0');

        if (!originLat || !originLng) {
            return NextResponse.json(
                { error: 'Origin location is required' },
                { status: 400 }
            );
        }

        // Get users in the place
        const usersRef = collection(db, 'places', placeId, 'users');
        const usersSnapshot = await getDocs(usersRef);

        const users: User[] = [];

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();

            // Only process online users within range
            if (userData.isOnline && !userData.outOfRange && userData.location) {
                const distance = calculateDistance(
                    userData.location.lat,
                    userData.location.lng,
                    originLat,
                    originLng
                );

                if (distance <= 100) {
                    // Fetch user profile using the service
                    const userProfile = await userProfileService.getUserProfile(userData.userId);

                    if (userProfile) {
                        // Convert UserProfile to User
                        const user = userProfileService.convertToUser(
                            userProfile,
                            userData.location,
                            distance
                        );
                        user.joinedAt = userData.joinedAt?.toDate() || new Date();
                        user.isOnline = userData.isOnline;
                        users.push(user);
                    }
                }
            }
        }

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
