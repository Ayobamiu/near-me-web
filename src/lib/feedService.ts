import { FeedPost } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface CreatePostRequest {
  authorId: string;
  content: string;
  postType: 'text' | 'image' | 'recommendation' | 'question' | 'checkin';
  tags?: string[];
  mediaUrls?: string[];
}

export interface FeedResponse {
  posts: FeedPost[];
  hasMore: boolean;
  lastPostId: string | null;
}

class FeedService {
  // Get feed posts for a place
  async getPlaceFeed(
    placeId: string,
    limit: number = 20,
    lastPostId?: string
  ): Promise<FeedResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (lastPostId) {
      params.append('lastPostId', lastPostId);
    }

    const response = await fetch(`${API_BASE}/api/places/${placeId}/feed?${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch feed');
    }
    return response.json();
  }

  // Create a new post
  async createPost(placeId: string, postData: CreatePostRequest): Promise<{ success: boolean; postId: string }> {
    const response = await fetch(`${API_BASE}/api/places/${placeId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create post');
    }

    return response.json();
  }

  // Like a post
  async likePost(placeId: string, postId: string, userId: string): Promise<{ success: boolean; action: string }> {
    const response = await fetch(`${API_BASE}/api/places/${placeId}/feed/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, action: 'like' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to like post');
    }

    return response.json();
  }

  // Unlike a post
  async unlikePost(placeId: string, postId: string, userId: string): Promise<{ success: boolean; action: string }> {
    const response = await fetch(`${API_BASE}/api/places/${placeId}/feed/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, action: 'unlike' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unlike post');
    }

    return response.json();
  }

  // Add a comment to a post
  async addComment(placeId: string, postId: string, authorId: string, content: string): Promise<{ success: boolean; commentId: string }> {
    const response = await fetch(`${API_BASE}/api/places/${placeId}/feed/${postId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authorId, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add comment');
    }

    return response.json();
  }

  // Share a post
  async sharePost(placeId: string, postId: string, userId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/api/places/${placeId}/feed/${postId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to share post');
    }

    return response.json();
  }
}

const feedService = new FeedService();
export default feedService;
