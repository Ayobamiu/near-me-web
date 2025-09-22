import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';

// POST /api/places/[placeId]/feed/[postId]/like - Like/unlike a post
export async function POST(request: NextRequest) {
  try {
    const urlParts = request.url.split('/');
    const placeId = urlParts[5];
    const postId = urlParts[7];
    const body = await request.json();
    const { userId, action } = body; // action: 'like' or 'unlike'

    if (!placeId || !postId || !userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const postRef = doc(db, 'places', placeId, 'feed', postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = postDoc.data();
    const currentLikes = postData.likes || [];

    if (action === 'like') {
      if (!currentLikes.includes(userId)) {
        await updateDoc(postRef, {
          likes: arrayUnion(userId),
        });
      }
    } else if (action === 'unlike') {
      if (currentLikes.includes(userId)) {
        await updateDoc(postRef, {
          likes: arrayRemove(userId),
        });
      }
    }

    return NextResponse.json({
      success: true,
      action,
    });
  } catch (error) {
    console.error('Error updating like:', error);
    return NextResponse.json({ error: 'Failed to update like' }, { status: 500 });
  }
}
