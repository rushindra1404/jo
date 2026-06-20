import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged as fbOnAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';

// User structure for our application
export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  firstName: string;
}

// Check if Firebase environment variables are provided
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    // Initialize Analytics (non-blocking)
    if (firebaseConfig.measurementId) {
      getAnalytics(app);
    }
  } catch (error) {
    console.error('Failed to initialize Firebase app:', error);
  }
}

// Mock auth database of accounts for simulation
export const MOCK_ACCOUNTS = [
  {
    uid: 'google-user-123',
    email: 'rushindra@example.com',
    displayName: 'Rushindra',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  },
  {
    uid: 'google-user-456',
    email: 'demo.user@sail.co.in',
    displayName: 'Demo User',
    photoURL: '',
  }
];

// Helper to extract first name
export const getFirstName = (fullName: string): string => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};

type AuthCallback = (user: AuthUser | null) => void;
const listeners = new Set<AuthCallback>();
let currentMockUser: AuthUser | null = null;

// Initialize mock session from localStorage
const savedMockSession = localStorage.getItem('sail_mock_session');
if (savedMockSession) {
  try {
    currentMockUser = JSON.parse(savedMockSession);
  } catch (e) {
    localStorage.removeItem('sail_mock_session');
  }
}

// Expose mock auth controls
export const mockAuthService = {
  getCurrentUser: () => currentMockUser,
  
  signInMock: (user: Omit<AuthUser, 'firstName'>) => {
    const fullUser: AuthUser = {
      ...user,
      firstName: getFirstName(user.displayName)
    };
    currentMockUser = fullUser;
    localStorage.setItem('sail_mock_session', JSON.stringify(fullUser));
    listeners.forEach(cb => cb(fullUser));
  },
  
  signOutMock: () => {
    currentMockUser = null;
    localStorage.removeItem('sail_mock_session');
    listeners.forEach(cb => cb(null));
  },
  
  subscribe: (callback: AuthCallback) => {
    listeners.add(callback);
    callback(currentMockUser);
    return () => {
      listeners.delete(callback);
    };
  }
};

// Universal Authentication API that works with either real Firebase or dynamic simulation
export const authService = {
  // Check if real Firebase auth is running
  isRealAuth: () => isFirebaseConfigured && auth !== null,

  // Get current auth state listener
  onAuthStateChanged: (callback: AuthCallback) => {
    if (authService.isRealAuth()) {
      return fbOnAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const appUser: AuthUser = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'User',
            photoURL: fbUser.photoURL || '',
            firstName: getFirstName(fbUser.displayName || 'User'),
          };
          callback(appUser);
        } else {
          callback(null);
        }
      });
    } else {
      return mockAuthService.subscribe(callback);
    }
  },

  // Trigger Google Login
  signInWithGoogle: async (): Promise<AuthUser> => {
    if (authService.isRealAuth()) {
      const provider = new GoogleAuthProvider();
      // Configure prompt to always select account (helpful for debugging)
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      
      return {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'User',
        photoURL: fbUser.photoURL || '',
        firstName: getFirstName(fbUser.displayName || 'User'),
      };
    } else {
      // In offline/mock mode, the LoginScreen component will handle launching the simulation modal.
      // We throw a specific signal or return the active mock user if already set.
      if (currentMockUser) return currentMockUser;
      throw new Error('MOCK_LOGIN_TRIGGER');
    }
  },

  // Trigger Sign Out
  signOut: async (): Promise<void> => {
    if (authService.isRealAuth()) {
      await fbSignOut(auth);
    } else {
      mockAuthService.signOutMock();
    }
  }
};
