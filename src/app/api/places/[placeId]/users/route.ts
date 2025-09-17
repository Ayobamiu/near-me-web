import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { calculateDistance } from '@/lib/geospatial';
import { User } from '@/types';

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
                    // Fetch user profile
                    const userProfileRef = doc(db, 'userProfiles', userData.userId);
                    const userProfileSnapshot = await getDoc(userProfileRef);

                    if (userProfileSnapshot.exists()) {
                        const profileData = userProfileSnapshot.data();
                        users.push({
                            id: userData.userId,
                            name: profileData.name || 'Anonymous User',
                            email: profileData.email || 'Anonymous',
                            profilePictureUrl: profileData.profilePictureUrl || '',
                            interests: profileData.interests || [],
                            bio: profileData.bio || '',
                            location: userData.location,
                            joinedAt: userData.joinedAt?.toDate() || new Date(),
                            isOnline: userData.isOnline,
                            distance
                        });
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
