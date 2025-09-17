import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
    try {
        console.log('Testing Firebase connection...');

        // Try to write a test document
        const testRef = doc(db, 'test', 'connection');
        await setDoc(testRef, {
            message: 'Hello from web app!',
            timestamp: new Date(),
        });

        // Try to read it back
        const docSnap = await getDoc(testRef);
        if (docSnap.exists()) {
            console.log('✅ Firebase connection successful!', docSnap.data());
            return true;
        } else {
            console.log('❌ Firebase connection failed - document not found');
            return false;
        }
    } catch (error) {
        console.error('❌ Firebase connection failed:', error);
        return false;
    }
};
