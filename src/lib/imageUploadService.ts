import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
    try {
        console.log('ImageUploadService: Starting upload for user:', userId);
        console.log('ImageUploadService: File:', file.name, file.size, file.type);

        // Check if storage is properly initialized
        if (!storage) {
            throw new Error('Firebase Storage is not initialized');
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('File size must be less than 5MB');
        }

        // Create a reference to the file in Firebase Storage
        const imageRef = ref(storage, `profile-pictures/${userId}/${Date.now()}.jpg`);
        console.log('ImageUploadService: Storage reference created:', imageRef.fullPath);

        // Upload the file
        console.log('ImageUploadService: Uploading to Firebase Storage...');
        const snapshot = await uploadBytes(imageRef, file);
        console.log('ImageUploadService: Upload completed, bytes uploaded:', snapshot.metadata.size);

        // Get the download URL
        console.log('ImageUploadService: Getting download URL...');
        const downloadURL = await getDownloadURL(snapshot.ref);

        console.log('ImageUploadService: Upload successful, URL:', downloadURL);
        return downloadURL;
    } catch (error: any) {
        console.error('ImageUploadService: Upload failed:', error);
        console.error('ImageUploadService: Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });

        throw error;
    }
};

export const deleteProfilePicture = async (imageUrl: string): Promise<void> => {
    try {
        if (!storage) {
            throw new Error('Firebase Storage is not initialized');
        }

        // Extract the path from the URL
        const url = new URL(imageUrl);
        const path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');

        if (!path) {
            throw new Error('Invalid image URL');
        }

        const imageRef = ref(storage, path);
        await deleteObject(imageRef);
        console.log('ImageUploadService: Image deleted successfully');
    } catch (error: any) {
        console.error('ImageUploadService: Delete failed:', error);
        throw error;
    }
};

export const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Failed to compress image'));
                    }
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
};
