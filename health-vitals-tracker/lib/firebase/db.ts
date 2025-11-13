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
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { DailyEntry, WeeklySummary } from '@/types';

const COLLECTIONS = {
  entries: 'dailyEntries',
  users: 'users',
} as const;

// Save or update daily entry
export async function saveDailyEntry(entry: DailyEntry): Promise<void> {
  const entryRef = doc(db, COLLECTIONS.entries, entry.id || `${entry.userId}_${entry.date}`);
  
  const entryData = {
    ...entry,
    createdAt: entry.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(entryRef, entryData, { merge: true });
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
  // Use simpler query to avoid compound index requirement
  const q = query(
    entriesRef,
    where('userId', '==', userId),
    orderBy('date', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const allEntries = querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as DailyEntry[];
  
  // Filter by date range in memory
  return allEntries.filter(entry => entry.date >= startDate && entry.date <= endDate);
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

