import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type AuthUser } from '../utils/firebase';
import { setDatabaseNamespace } from '../utils/indexedDB';

interface AuthContextProps {
  user: AuthUser | null;
  loading: boolean;
  isFirstTimeUser: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setFirstTimeCompleted: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(false);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((appUser) => {
      if (appUser) {
        // Switch IndexedDB database name namespace instantly on login
        setDatabaseNamespace(appUser.uid);

        // Check if user has completed first-time onboarding before
        const onboardingCompleted = localStorage.getItem(`sail_onboarding_completed_${appUser.uid}`);
        
        setUser(appUser);
        setIsFirstTimeUser(!onboardingCompleted);
        setLoading(false);
      } else {
        setUser(null);
        setIsFirstTimeUser(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const appUser = await authService.signInWithGoogle();
      
      // Setup IndexedDB namespace
      setDatabaseNamespace(appUser.uid);
      
      // Onboarding state
      const onboardingCompleted = localStorage.getItem(`sail_onboarding_completed_${appUser.uid}`);
      
      setUser(appUser);
      setIsFirstTimeUser(!onboardingCompleted);
    } catch (error: any) {
      // If mock login is triggered, propagate mock sign in requirement
      if (error.message === 'MOCK_LOGIN_TRIGGER') {
        throw error;
      }
      console.error('Google Sign-In failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setIsFirstTimeUser(false);
    } catch (error) {
      console.error('Sign-out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const setFirstTimeCompleted = () => {
    if (user) {
      localStorage.setItem(`sail_onboarding_completed_${user.uid}`, 'true');
      setIsFirstTimeUser(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirstTimeUser,
        signInWithGoogle,
        signOut,
        setFirstTimeCompleted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
