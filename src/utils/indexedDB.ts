let currentDbName = 'sail_cbt_db_guest';
const DB_VERSION = 2;
const ACTIVE_STORE = 'active_exam';
const HISTORY_STORE = 'exam_history';
const PROGRESS_STORE = 'study_progress';
const FAVORITES_STORE = 'study_favorites';
const RECENT_STORE = 'study_recent';

export function setDatabaseNamespace(userId: string) {
  currentDbName = `sail_cbt_db_${userId}`;
}

export interface StudyProgress {
  chapterUniqueId: string; // e.g. "ica_chapter01"
  material: 'ica' | 'gpoe';
  chapterId: string;
  chapterNum: number;
  chapterTitle: string;
  lastPageRead: number;
  totalPages: number;
  percentage: number;
  timestamp: number;
}

export interface StudyFavorite {
  chapterUniqueId: string;
  material: 'ica' | 'gpoe';
  chapterId: string;
  chapterNum: number;
  chapterTitle: string;
  timestamp: number;
}

export interface StudyRecent {
  chapterUniqueId: string;
  material: 'ica' | 'gpoe';
  chapterId: string;
  chapterNum: number;
  chapterTitle: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(currentDbName, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ACTIVE_STORE)) {
        db.createObjectStore(ACTIVE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
        db.createObjectStore(PROGRESS_STORE, { keyPath: 'chapterUniqueId' });
      }
      if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
        db.createObjectStore(FAVORITES_STORE, { keyPath: 'chapterUniqueId' });
      }
      if (!db.objectStoreNames.contains(RECENT_STORE)) {
        db.createObjectStore(RECENT_STORE, { keyPath: 'chapterUniqueId' });
      }
    };
  });
}

export async function saveActiveExam(state: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ACTIVE_STORE, 'readwrite');
      const store = transaction.objectStore(ACTIVE_STORE);
      const request = store.put({ id: 'current_active_exam', ...state, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error saving active exam to IndexedDB:', error);
  }
}

export async function getActiveExam(): Promise<any | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ACTIVE_STORE, 'readonly');
      const store = transaction.objectStore(ACTIVE_STORE);
      const request = store.get('current_active_exam');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error fetching active exam from IndexedDB:', error);
    return null;
  }
}

export async function clearActiveExam(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ACTIVE_STORE, 'readwrite');
      const store = transaction.objectStore(ACTIVE_STORE);
      const request = store.delete('current_active_exam');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing active exam in IndexedDB:', error);
  }
}

export async function saveExamHistory(item: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HISTORY_STORE, 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error saving exam history to IndexedDB:', error);
  }
}

export async function getExamHistory(): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HISTORY_STORE, 'readonly');
      const store = transaction.objectStore(HISTORY_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error fetching exam history from IndexedDB:', error);
    return [];
  }
}

// Progress functions
export async function saveStudyProgress(progress: StudyProgress): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PROGRESS_STORE, 'readwrite');
      const store = transaction.objectStore(PROGRESS_STORE);
      const request = store.put(progress);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error saving study progress to IndexedDB:', error);
  }
}

export async function getStudyProgress(chapterUniqueId: string): Promise<StudyProgress | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PROGRESS_STORE, 'readonly');
      const store = transaction.objectStore(PROGRESS_STORE);
      const request = store.get(chapterUniqueId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting study progress from IndexedDB:', error);
    return null;
  }
}

export async function getAllStudyProgress(): Promise<StudyProgress[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PROGRESS_STORE, 'readonly');
      const store = transaction.objectStore(PROGRESS_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting all study progress from IndexedDB:', error);
    return [];
  }
}

// Favorites functions
export async function toggleFavoriteMaterial(item: Omit<StudyFavorite, 'timestamp'>): Promise<boolean> {
  try {
    const db = await openDB();
    const isFav = await isMaterialFavorite(item.chapterUniqueId);
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FAVORITES_STORE, 'readwrite');
      const store = transaction.objectStore(FAVORITES_STORE);
      
      let request;
      if (isFav) {
        request = store.delete(item.chapterUniqueId);
      } else {
        request = store.put({ ...item, timestamp: Date.now() });
      }
      
      request.onsuccess = () => resolve(!isFav);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error toggling favorite material in IndexedDB:', error);
    return false;
  }
}

export async function getFavoriteMaterials(): Promise<StudyFavorite[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FAVORITES_STORE, 'readonly');
      const store = transaction.objectStore(FAVORITES_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const list = request.result || [];
        list.sort((a, b) => b.timestamp - a.timestamp);
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting favorite materials from IndexedDB:', error);
    return [];
  }
}

export async function isMaterialFavorite(chapterUniqueId: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FAVORITES_STORE, 'readonly');
      const store = transaction.objectStore(FAVORITES_STORE);
      const request = store.get(chapterUniqueId);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error checking if material is favorite in IndexedDB:', error);
    return false;
  }
}

// Recent functions
export async function addRecentMaterial(item: Omit<StudyRecent, 'timestamp'>): Promise<void> {
  try {
    const db = await openDB();
    
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(RECENT_STORE, 'readwrite');
      const store = transaction.objectStore(RECENT_STORE);
      const request = store.put({ ...item, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const recents = await getRecentMaterials();
    if (recents.length > 5) {
      recents.sort((a, b) => a.timestamp - b.timestamp);
      const toDelete = recents.slice(0, recents.length - 5);
      const transaction = db.transaction(RECENT_STORE, 'readwrite');
      const store = transaction.objectStore(RECENT_STORE);
      for (const t of toDelete) {
        store.delete(t.chapterUniqueId);
      }
    }
  } catch (error) {
    console.error('Error adding recent material to IndexedDB:', error);
  }
}

export async function getRecentMaterials(): Promise<StudyRecent[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(RECENT_STORE, 'readonly');
      const store = transaction.objectStore(RECENT_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const list = request.result || [];
        list.sort((a, b) => b.timestamp - a.timestamp);
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting recent materials from IndexedDB:', error);
    return [];
  }
}
