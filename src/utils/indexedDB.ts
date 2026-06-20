const DB_NAME = 'sail_cbt_db';
const DB_VERSION = 1;
const ACTIVE_STORE = 'active_exam';
const HISTORY_STORE = 'exam_history';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

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
