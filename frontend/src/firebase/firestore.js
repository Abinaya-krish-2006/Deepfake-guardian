import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

/**
 * Saves a scan analysis record to Firestore under users/{userId}/scans/{scanId}
 * Note: Video/image raw binary is NEVER stored in Firestore.
 */
export async function saveScanRecord(userId, scanData) {
  if (!isFirebaseConfigured || !db || !userId) {
    return null;
  }

  try {
    const userScansRef = collection(db, 'users', userId, 'scans');
    const record = {
      fileName: scanData.file_name || scanData.fileName || 'unnamed_file',
      mediaType: scanData.media_type || scanData.mediaType || 'image',
      status: scanData.status || 'UNCERTAIN',
      confidence: Number(scanData.confidence) || 0,
      explanation: scanData.explanation || '',
      detectionMode: scanData.detection_mode || scanData.detectionMode || 'ai',
      isDemo: Boolean(scanData.is_demo || scanData.isDemo),
      createdAt: serverTimestamp(),
      clientTimestamp: new Date().toISOString(),
    };

    const docRef = await addDoc(userScansRef, record);
    return docRef.id;
  } catch (error) {
    console.error('Error saving scan to Firestore:', error);
    return null;
  }
}

/**
 * Retrieves all scan records for the authenticated user
 */
export async function getUserScans(userId) {
  if (!isFirebaseConfigured || !db || !userId) {
    return [];
  }

  try {
    const userScansRef = collection(db, 'users', userId, 'scans');
    const q = query(userScansRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      let formattedDate = 'Just now';
      if (data.createdAt?.toDate) {
        formattedDate = data.createdAt.toDate().toLocaleString();
      } else if (data.clientTimestamp) {
        formattedDate = new Date(data.clientTimestamp).toLocaleString();
      }

      return {
        id: docSnapshot.id,
        ...data,
        displayDate: formattedDate,
      };
    });
  } catch (error) {
    console.error('Error fetching user scans:', error);
    return [];
  }
}

/**
 * Deletes a specific scan record belonging to the authenticated user
 */
export async function deleteUserScan(userId, scanId) {
  if (!isFirebaseConfigured || !db || !userId || !scanId) {
    return false;
  }

  try {
    const scanDocRef = doc(db, 'users', userId, 'scans', scanId);
    await deleteDoc(scanDocRef);
    return true;
  } catch (error) {
    console.error('Error deleting scan:', error);
    return false;
  }
}
