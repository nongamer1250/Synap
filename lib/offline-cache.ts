const DB_NAME = 'synap-offline-cache';
const DB_VERSION = 1;

export interface OfflineNote {
  id: string;
  title: string;
  content: string;
  summary?: string;
  key_concepts?: any[];
  updated_at: string;
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject('Not in browser');
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('flashcards')) {
        db.createObjectStore('flashcards', { keyPath: 'note_id' });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e: any) => reject(e.target.error);
  });
}

export async function saveOfflineNote(note: OfflineNote) {
  try {
    const db = await getDB();
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    store.put(note);
  } catch (err) {
    console.error('Failed to save offline note:', err);
  }
}

export async function getOfflineNote(id: string): Promise<OfflineNote | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', 'readonly');
      const store = tx.objectStore('notes');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get offline note:', err);
    return null;
  }
}

export async function saveOfflineDeck(noteId: string, flashcards: any[]) {
  try {
    const db = await getDB();
    const tx = db.transaction('flashcards', 'readwrite');
    const store = tx.objectStore('flashcards');
    store.put({ note_id: noteId, flashcards });
  } catch (err) {
    console.error('Failed to save offline deck:', err);
  }
}

export async function getOfflineDeck(noteId: string): Promise<any[] | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('flashcards', 'readonly');
      const store = tx.objectStore('flashcards');
      const req = store.get(noteId);
      req.onsuccess = () => resolve(req.result ? req.result.flashcards : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get offline deck:', err);
    return null;
  }
}
