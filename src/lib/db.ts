import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

export interface SchoolVisit {
  id: string;
  schoolName: string;
  city?: string;
  visitDate: string;
  notes?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'FollowUp';
  rejectionReason?: string;
  followUpDate?: string;
  followUpAction?: string;
  followUpNotes?: string;
  schoolDetails?: {
    address: string;
    principalName: string;
    principalMobile: string;
    principalEmail: string;
  };
  idIncharge?: {
    name?: string;
    mobile?: string;
    email?: string;
  };
  reception?: {
    name?: string;
    mobile?: string;
    email?: string;
  };
  classes?: {
    from: string;
    to: string;
  };
  cardTypes?: string[];
  sections?: string[];
  houses?: string[];
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper to strip out all 'undefined' properties recursively before sending to Firestore
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

const LOCAL_STORAGE_KEY = 'school_visits';

// Helper to get local visits from local storage
const getLocalVisits = (): SchoolVisit[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse local storage visits:', e);
    return [];
  }
};

// Helper to save local visits to local storage
const saveLocalVisits = (visits: SchoolVisit[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(visits));
};

export const dbService = {
  isCloudConnected(): boolean {
    return isFirebaseConfigured && db !== null;
  },

  async getVisits(): Promise<SchoolVisit[]> {
    if (this.isCloudConnected() && db) {
      try {
        const q = query(collection(db, 'visits'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const visits: SchoolVisit[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const createdAt = data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate().toISOString() 
            : data.createdAt || new Date().toISOString();
          const updatedAt = data.updatedAt instanceof Timestamp 
            ? data.updatedAt.toDate().toISOString() 
            : data.updatedAt || new Date().toISOString();
            
          visits.push({
            id: docSnap.id,
            ...data,
            createdAt,
            updatedAt,
          } as SchoolVisit);
        });
        return visits;
      } catch (error) {
        console.error('Firestore read error, falling back to local storage:', error);
        return getLocalVisits();
      }
    } else {
      return getLocalVisits().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  async saveVisit(visitData: Omit<SchoolVisit, 'id' | 'createdAt' | 'updatedAt'>): Promise<SchoolVisit> {
    const now = new Date().toISOString();
    
    if (this.isCloudConnected() && db) {
      try {
        const cleanedData = cleanUndefined(visitData);
        const docRef = await addDoc(collection(db, 'visits'), {
          ...cleanedData,
          createdAt: now,
          updatedAt: now,
        });
        return {
          id: docRef.id,
          ...visitData,
          createdAt: now,
          updatedAt: now,
        };
      } catch (error) {
        console.error('Firestore save error, saving locally:', error);
      }
    }

    // Local Storage save
    const localVisits = getLocalVisits();
    const newVisit: SchoolVisit = {
      id: 'local_' + Math.random().toString(36).substring(2, 11),
      ...visitData,
      createdAt: now,
      updatedAt: now,
    };
    localVisits.push(newVisit);
    saveLocalVisits(localVisits);
    return newVisit;
  },

  async updateVisit(id: string, updates: Partial<SchoolVisit>): Promise<void> {
    const now = new Date().toISOString();

    if (this.isCloudConnected() && db && !id.startsWith('local_')) {
      try {
        const docRef = doc(db, 'visits', id);
        const cleanedUpdates = cleanUndefined(updates);
        await updateDoc(docRef, {
          ...cleanedUpdates,
          updatedAt: now,
        });
        return;
      } catch (error) {
        console.error('Firestore update error, updating locally:', error);
      }
    }

    // Local Storage update
    const localVisits = getLocalVisits();
    const index = localVisits.findIndex(v => v.id === id);
    if (index !== -1) {
      localVisits[index] = {
        ...localVisits[index],
        ...updates,
        updatedAt: now,
      };
      saveLocalVisits(localVisits);
    }
  },

  async deleteVisit(id: string): Promise<void> {
    if (this.isCloudConnected() && db && !id.startsWith('local_')) {
      try {
        const docRef = doc(db, 'visits', id);
        await deleteDoc(docRef);
        return;
      } catch (error) {
        console.error('Firestore delete error, deleting locally:', error);
      }
    }

    // Local Storage delete
    const localVisits = getLocalVisits();
    const filtered = localVisits.filter(v => v.id !== id);
    saveLocalVisits(filtered);
  }
};
