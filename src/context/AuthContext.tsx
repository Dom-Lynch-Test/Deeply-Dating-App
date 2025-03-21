import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { signIn, signUp, logOut, resetPassword, signInWithGoogle } from '../services/auth';
import { getUserProfile } from '../services/users';

// Define the shape of our context
interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  googleSignIn: (idToken: string) => Promise<User>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isLoading: true,
  login: async () => { throw new Error('Not implemented'); },
  register: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); },
  sendPasswordReset: async () => { throw new Error('Not implemented'); },
  googleSignIn: async () => { throw new Error('Not implemented'); },
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Define props for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// Create a provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Fetch user profile from Firestore
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    return signIn(email, password);
  };

  // Signup function
  const register = async (name: string, email: string, password: string) => {
    return signUp(name, email, password);
  };

  // Logout function
  const logout = async () => {
    await logOut();
    setUser(null);
    setUserProfile(null);
  };

  // Reset password function
  const sendPasswordReset = async (email: string) => {
    return resetPassword(email);
  };

  // Google sign in function
  const googleSignIn = async (idToken: string) => {
    return signInWithGoogle(idToken);
  };

  const value = {
    user,
    userProfile,
    isLoading,
    login,
    register,
    logout,
    sendPasswordReset,
    googleSignIn
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
