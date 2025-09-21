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

        const usersInRange: User[] = [];
        const usersOutOfRange: User[] = [];

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();

            // Process all users who have been at the place (regardless of current status)
            if (userData.location) {
                const distance = calculateDistance(
                    userData.location.lat,
                    userData.location.lng,
                    originLat,
                    originLng
                );

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

                    // Categorize based on distance
                    if (distance <= 100) {
                        usersInRange.push(user);
                    } else {
                        usersOutOfRange.push(user);
                    }
                } else {
                    console.log('❌ No profile found for user:', userData.userId);
                }
            } else {
                console.log('❌ User has no location data:', userData.userId);
            }
        }

        return NextResponse.json({
            usersInRange,
            usersOutOfRange,
            totalUsers: usersInRange.length + usersOutOfRange.length
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
