import {
  collection,
  getDocs,
  addDoc,
  setDoc,
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
  range?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'FollowUp';
  category?: 'School' | 'Collage' | 'Office' | 'Hospital' | 'Studio' | 'Other';
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
  createdByVendorId?: string;
  createdByVendorName?: string;
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

const LOCAL_CITIES_KEY = 'acl_cities';

const getLocalCities = (): string[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_CITIES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse local storage cities:', e);
    return [];
  }
};

const saveLocalCities = (cities: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_CITIES_KEY, JSON.stringify(cities));
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
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

    if (this.isCloudConnected() && db) {
      try {
        const cleanedData = cleanUndefined(visitData);
        const docRef = doc(collection(db, 'visits'));
        const newId = docRef.id;

        const dataToSave = {
          ...cleanedData,
          createdAt: now,
          updatedAt: now,
        };

        if (isOnline) {
          await setDoc(docRef, dataToSave);
        } else {
          // If offline, save in background without awaiting so the UI doesn't hang
          setDoc(docRef, dataToSave).catch((error) => {
            console.error('Background Firestore save error:', error);
          });
        }

        return {
          id: newId,
          ...visitData,
          createdAt: now,
          updatedAt: now,
        };
      } catch (error) {
        console.error('Firestore save error, saving locally:', error);
      }
    }

    // Local Storage save fallback
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
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

    if (this.isCloudConnected() && db && !id.startsWith('local_')) {
      try {
        const docRef = doc(db, 'visits', id);
        const cleanedUpdates = cleanUndefined(updates);
        const dataToUpdate = {
          ...cleanedUpdates,
          updatedAt: now,
        };

        if (isOnline) {
          await updateDoc(docRef, dataToUpdate);
        } else {
          // If offline, update in background without awaiting so the UI doesn't hang
          updateDoc(docRef, dataToUpdate).catch((error) => {
            console.error('Background Firestore update error:', error);
          });
        }
        return;
      } catch (error) {
        console.error('Firestore update error, updating locally:', error);
      }
    }

    // Local Storage update fallback
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
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

    if (this.isCloudConnected() && db && !id.startsWith('local_')) {
      try {
        const docRef = doc(db, 'visits', id);
        if (isOnline) {
          await deleteDoc(docRef);
        } else {
          // If offline, delete in background without awaiting so the UI doesn't hang
          deleteDoc(docRef).catch((error) => {
            console.error('Background Firestore delete error:', error);
          });
        }
        return;
      } catch (error) {
        console.error('Firestore delete error, deleting locally:', error);
      }
    }

    // Local Storage delete fallback
    const localVisits = getLocalVisits();
    const filtered = localVisits.filter(v => v.id !== id);
    saveLocalVisits(filtered);
  },

  async getCities(): Promise<string[]> {
    if (this.isCloudConnected() && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'cities'));
        const cities: string[] = [];
        querySnapshot.forEach((docSnap) => {
          const name = docSnap.data().name;
          if (name) cities.push(name);
        });
        return cities.sort();
      } catch (error) {
        console.error('Firestore cities read error, falling back to local storage:', error);
        return getLocalCities();
      }
    } else {
      return getLocalCities();
    }
  },

  async saveCity(cityName: string): Promise<void> {
    const name = cityName.trim();
    if (!name) return;

    // Add to Local Storage fallback
    const localCities = getLocalCities();
    if (!localCities.includes(name)) {
      localCities.push(name);
      saveLocalCities(localCities.sort());
    }

    if (this.isCloudConnected() && db) {
      try {
        const cityId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const docRef = doc(db, 'cities', cityId);
        await setDoc(docRef, { name });
      } catch (error) {
        console.error('Firestore saveCity error:', error);
      }
    }
  },

  async getVendors(): Promise<Vendor[]> {
    if (this.isCloudConnected() && db) {
      try {
        const q = query(collection(db, 'vendors'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const vendors: Vendor[] = [];
        querySnapshot.forEach((docSnap) => {
          vendors.push({
            id: docSnap.id,
            ...docSnap.data()
          } as Vendor);
        });
        return vendors;
      } catch (error) {
        console.error('Firestore vendors read error:', error);
        return getLocalVendors();
      }
    } else {
      return getLocalVendors();
    }
  },

  async saveVendor(vendorData: Omit<Vendor, 'id' | 'createdAt'>): Promise<Vendor> {
    const now = new Date().toISOString();
    const vendorId = 'vendor_' + Math.random().toString(36).substring(2, 11);
    const newVendor: Vendor = {
      id: vendorId,
      ...vendorData,
      createdAt: now
    };

    const localVendors = getLocalVendors();
    localVendors.push(newVendor);
    saveLocalVendors(localVendors);

    if (this.isCloudConnected() && db) {
      try {
        const docRef = doc(db, 'vendors', vendorId);
        await setDoc(docRef, cleanUndefined(newVendor));
      } catch (error) {
        console.error('Firestore saveVendor error:', error);
      }
    }
    return newVendor;
  },

  async updateVendor(vendorId: string, vendorData: Partial<Omit<Vendor, 'id' | 'createdAt'>>): Promise<void> {
    const localVendors = getLocalVendors();
    const idx = localVendors.findIndex(v => v.id === vendorId);
    if (idx !== -1) {
      localVendors[idx] = { ...localVendors[idx], ...vendorData };
      saveLocalVendors(localVendors);
    }

    if (this.isCloudConnected() && db) {
      try {
        const docRef = doc(db, 'vendors', vendorId);
        await setDoc(docRef, cleanUndefined(vendorData), { merge: true });
      } catch (error) {
        console.error('Firestore updateVendor error:', error);
      }
    }
  }
};

export interface Vendor {
  id: string;
  name: string;
  firmName: string;
  address: string;
  mobile: string;
  email: string;
  allowedCities: string[];
  user: string;
  pass: string;
  createdAt: string;
}

const LOCAL_VENDORS_KEY = 'acl_vendors';

const getLocalVendors = (): Vendor[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_VENDORS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse local vendors:', e);
    return [];
  }
};

const saveLocalVendors = (vendors: Vendor[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_VENDORS_KEY, JSON.stringify(vendors));
};
