import { db } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  deleteField,
} from 'firebase/firestore';
import { DailyEntry, WeeklySummary } from '@/types';

const COLLECTIONS = {
  entries: 'dailyEntries',
  users: 'users',
} as const;

// Recursively remove undefined values from an object
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  
  return obj;
}

// Save or update daily entry
export async function saveDailyEntry(entry: DailyEntry): Promise<void> {
  const docId = entry.id || `${entry.userId}_${entry.date}`;
  const entryRef = doc(db, COLLECTIONS.entries, docId);
  
  // Log what we're actually saving to Firestore
  console.log(`[DB] Saving entry - Doc ID: ${docId}, Date: ${entry.date}, User ID: ${entry.userId}`);
  
  // Prepare entry data with proper timestamp conversion
  const entryData: any = {
    id: docId,
    userId: entry.userId,
    date: entry.date,
    foodLogs: entry.foodLogs || [],
    activity: entry.activity,
    health: entry.health,
    metrics: entry.metrics,
    recommendations: entry.recommendations || [],
    createdAt: entry.createdAt ? Timestamp.fromDate(entry.createdAt) : Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Remove all undefined values recursively (but preserve 0, false, empty strings, etc.)
  const cleanEntry = removeUndefined(entryData);

  await setDoc(entryRef, cleanEntry, { merge: true });
  console.log(`[DB] Successfully saved to document: ${docId}`);
}

// Get daily entry for a specific date
export async function getDailyEntry(
  userId: string,
  date: string
): Promise<DailyEntry | null> {
  const entryRef = doc(db, COLLECTIONS.entries, `${userId}_${date}`);
  const entrySnap = await getDoc(entryRef);

  if (!entrySnap.exists()) {
    return null;
  }

  const data = entrySnap.data();
  
  // Debug: Log protein values when loading
  if (data.foodLogs) {
    data.foodLogs.forEach((log: any) => {
      if (log.customFoods) {
        log.customFoods.forEach((food: any) => {
          if (food.protein !== undefined) {
            console.log(`Loaded food ${food.name} with protein: ${food.protein}`);
          } else {
            console.log(`Loaded food ${food.name} WITHOUT protein`);
          }
        });
      }
    });
  }
  
  return {
    ...data,
    id: entrySnap.id,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as DailyEntry;
}

// Get all entries for a user within a date range
export async function getEntriesInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyEntry[]> {
  const entriesRef = collection(db, COLLECTIONS.entries);
  // Query only by userId to avoid compound index requirement
  const q = query(
    entriesRef,
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const allEntries = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as DailyEntry[];
  
  // Filter by date range and sort in memory
  return allEntries
    .filter(entry => entry.date >= startDate && entry.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Get entries for the current week
export async function getWeeklyEntries(
  userId: string,
  weekStart: string
): Promise<DailyEntry[]> {
  // Calculate week end (7 days later)
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  const endDate = end.toISOString().split('T')[0];
  return getEntriesInRange(userId, weekStart, endDate);
}

// Get all entries for a user
export async function getAllEntries(userId: string): Promise<DailyEntry[]> {
  const entriesRef = collection(db, COLLECTIONS.entries);
  const q = query(entriesRef, where('userId', '==', userId));

  const querySnapshot = await getDocs(q);
  const allEntries = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as DailyEntry[];
  
  // Sort by date
  return allEntries.sort((a, b) => a.date.localeCompare(b.date));
}

// Delete recommendations from a daily entry
export async function deleteRecommendations(userId: string, date: string): Promise<void> {
  const docId = `${userId}_${date}`;
  const entryRef = doc(db, COLLECTIONS.entries, docId);
  
  try {
    await updateDoc(entryRef, {
      recommendations: deleteField(),
    });
    console.log(`[DB] Deleted recommendations from document: ${docId}`);
  } catch (error) {
    // If document doesn't exist, that's fine - nothing to delete
    console.log(`[DB] Could not delete recommendations (document may not exist): ${docId}`);
  }
}

