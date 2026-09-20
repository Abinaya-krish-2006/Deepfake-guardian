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

const LOCAL_STORAGE_KEY = 'deepfake_guardian_scans';

function getLocalScans() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function setLocalScans(scans) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scans));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }
}

/**
 * Saves a scan record:
 * - To Firestore if Firebase is configured & user is authenticated.
 * - To LocalStorage as a seamless zero-config fallback.
 */
export async function saveScanRecord(userId, scanData) {
  const newScan = {
    fileName: scanData.file_name || scanData.fileName || 'unnamed_file',
    mediaType: scanData.media_type || scanData.mediaType || 'image',
    status: scanData.status || 'UNCERTAIN',
    confidence: Number(scanData.confidence) || 0,
    explanation: scanData.explanation || '',
    detectionMode: scanData.detection_mode || scanData.detectionMode || 'ai',
    isDemo: Boolean(scanData.is_demo || scanData.isDemo),
    clientTimestamp: new Date().toISOString(),
    displayDate: new Date().toLocaleString(),
  };

  // If Firebase is active and user is logged in, save to Firestore
  if (isFirebaseConfigured && db && userId && userId !== 'local_user') {
    try {
      const userScansRef = collection(db, 'users', userId, 'scans');
      const record = {
        ...newScan,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(userScansRef, record);
      return docRef.id;
    } catch (error) {
      console.error('Error saving to Firestore, falling back to local storage:', error);
    }
  }

  // Local storage fallback
  const scans = getLocalScans();
  const localRecord = {
    id: 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    ...newScan,
  };
  scans.unshift(localRecord);
  setLocalScans(scans);
  return localRecord.id;
}

/**
 * Retrieves scan records:
 * - From Firestore if authenticated.
 * - From LocalStorage if offline/unauthenticated.
 */
export async function getUserScans(userId) {
  if (isFirebaseConfigured && db && userId && userId !== 'local_user') {
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
      console.error('Error fetching from Firestore, falling back to local storage:', error);
    }
  }

  return getLocalScans();
}

/**
 * Deletes a scan record from Firestore or LocalStorage
 */
export async function deleteUserScan(userId, scanId) {
  if (isFirebaseConfigured && db && userId && userId !== 'local_user') {
    try {
      const scanDocRef = doc(db, 'users', userId, 'scans', scanId);
      await deleteDoc(scanDocRef);
      return true;
    } catch (error) {
      console.error('Error deleting from Firestore:', error);
    }
  }

  const scans = getLocalScans().filter((s) => s.id !== scanId);
  setLocalScans(scans);
  return true;
}
