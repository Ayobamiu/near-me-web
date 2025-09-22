import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, startAfter, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { FeedPost } from '@/types';

// GET /api/places/[placeId]/feed - Get feed posts for a place
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = request.url.split('/')[5];
    const limitParam = searchParams.get('limit');
    const lastPostId = searchParams.get('lastPostId');

    if (!placeId) {
      return NextResponse.json({ error: 'Place ID is required' }, { status: 400 });
    }

    const postsRef = collection(db, 'places', placeId, 'feed');

    let q = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      limit(parseInt(limitParam || '20'))
    );

    // Handle pagination
    if (lastPostId) {
      const lastPostSnapshot = await getDocs(query(collection(db, 'places', placeId, 'feed'), where('__name__', '==', lastPostId)));
      if (!lastPostSnapshot.empty) {
        const lastPost = lastPostSnapshot.docs[0];
        q = query(
          postsRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastPost),
          limit(parseInt(limitParam || '20'))
        );
      }
    }

    const snapshot = await getDocs(q);

    const posts: FeedPost[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        placeId: data.placeId,
        authorId: data.authorId,
        content: data.content,
        postType: data.postType,
        mediaUrls: data.mediaUrls || [],
        tags: data.tags || [],
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        likes: data.likes || [],
        comments: data.comments || [],
        shares: data.shares || 0,
        isPinned: data.isPinned || false,
        isAnnouncement: data.isAnnouncement || false,
      });
    });

    return NextResponse.json({
      posts,
      hasMore: snapshot.docs.length === parseInt(limitParam || '20'),
      lastPostId: snapshot.docs[snapshot.docs.length - 1]?.id || null,
    });
  } catch (error) {
    console.error('Error fetching feed posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST /api/places/[placeId]/feed - Create a new post
export async function POST(request: NextRequest) {
  try {
    const placeId = request.url.split('/')[5];
    const body = await request.json();
    const { authorId, content, postType, tags, mediaUrls } = body;

    if (!placeId || !authorId || !content || !postType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const postsRef = collection(db, 'places', placeId, 'feed');
    const postData = {
      placeId,
      authorId,
      content,
      postType,
      tags: tags || [],
      mediaUrls: mediaUrls || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: [],
      comments: [],
      shares: 0,
      isPinned: false,
      isAnnouncement: false,
    };

    const docRef = await addDoc(postsRef, postData);

    return NextResponse.json({
      success: true,
      postId: docRef.id,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
