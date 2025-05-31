import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'; // Added useCallback and useMemo
import { 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import firebaseService, { auth, isDemoMode } from '../services/firebase';
import apiService from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state listener
  useEffect(() => {
    let unsubscribe = () => {};
    // setLoading(true); // Initial loading is handled by useState(true)
    
    try {
      if (auth && typeof auth.onAuthStateChanged === 'function') {
        unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          setLoading(true); // Set loading true at the start of processing any auth state change
          if (firebaseUser) {
            try {
              // Get Firebase ID token
              const idToken = await firebaseUser.getIdToken();
              
              // Set token in API service
              apiService.setToken(idToken);
              
              // Try to get user profile from backend
              try {
                const profileResponse = await apiService.getProfile();
                const userProfile = profileResponse.data?.user || profileResponse;
                setUser({
                  ...userProfile,
                  firebaseUser
                });
              } catch (profileError) {
                console.log('User not found in backend, attempting auto-registration...');
                
                // If user doesn't exist in backend (401/404), auto-register them
                if (profileError.message.includes('User not found') || 
                    profileError.message.includes('Unauthorized') ||
                    profileError.message.includes('Access token required')) {
                  
                  // Extract name from Firebase user
                  const displayName = firebaseUser.displayName || '';
                  const nameParts = displayName.split(' ');
                  const firstName = nameParts[0] || 'User';
                  const lastName = nameParts.slice(1).join(' ') || 'Name';
                  
                  try {
                    // Auto-register the Firebase user in our backend
                    const registrationResult = await apiService.register({
                      idToken,
                      firstName,
                      lastName,
                      phoneNumber: firebaseUser.phoneNumber || ''
                    });
                    
                    // Set the new token if provided (prefer accessToken from response)
                    if (registrationResult.data?.tokens?.accessToken) {
                      apiService.setToken(registrationResult.data.tokens.accessToken);
                    } else if (registrationResult.token) {
                      apiService.setToken(registrationResult.token);
                    } else {
                      // Keep using the Firebase ID token if no access token provided
                      console.log('Using Firebase ID token for API calls');
                    }
                    
                    // Set user data from registration response
                    setUser({
                      ...registrationResult.data?.user || registrationResult.user,
                      firebaseUser
                    });
                    
                    console.log('User auto-registered successfully');
                  } catch (registrationError) {
                    console.error('Auto-registration failed:', registrationError);
                    
                    // Check if user already exists
                    if (registrationError.message.includes('already exists')) {
                      console.log('User already exists, trying to fetch profile again...');
                      try {
                        // Try to get profile one more time
                        const retryProfileResponse = await apiService.getProfile();
                        const retryUserProfile = retryProfileResponse.data?.user || retryProfileResponse;
                        setUser({
                          ...retryUserProfile,
                          firebaseUser
                        });
                        return;
                      } catch (retryError) {
                        console.error('Retry profile fetch failed:', retryError);
                      }
                    }
                    
                    setError('Failed to register user automatically');
                    
                    // Fall back to basic Firebase user data
                    setUser({
                      uid: firebaseUser.uid,
                      email: firebaseUser.email,
                      displayName: firebaseUser.displayName,
                      photoURL: firebaseUser.photoURL,
                      firebaseUser
                    });
                  }
                } else {
                  // Other error, use basic Firebase user data
                  console.error('Profile fetch error:', profileError);
                  setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    firebaseUser
                  });
                }
              }
            } catch (error) {
              console.error('Error in auth state change:', error);
              setError(error.message);
              // If all else fails, still set basic Firebase user
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                firebaseUser
              });
            }
          } else {
            setUser(null);
            apiService.setToken(null);
          }
          setLoading(false);
        });
      } else {
        // Firebase not available, set up demo mode
        console.warn('Firebase auth not available, using demo mode');
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setUser(null);
      setLoading(false);
    }

    // Check for redirect result on component mount
    const checkRedirectResult = async () => {
      if (auth && typeof getRedirectResult === 'function') {
        try {
          const result = await getRedirectResult(auth);
          if (result) {
            console.log('Redirect result found:', result);
            // The auth state listener will handle the user update
          }
        } catch (error) {
          console.error('Redirect result error:', error);
          setError('Authentication failed: ' + error.message);
        }
      }
    };

    checkRedirectResult();

    return unsubscribe;
  }, []);

  // Email/Password sign in
  const signIn = useCallback(async (email, password) => {
    try {
      setError(null);
      // setLoading(true); // setLoading is called by onAuthStateChanged now at the start
      
      if (auth && typeof signInWithEmailAndPassword === 'function') {
        // Use Firebase v9+ syntax
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        
        // Set token in API service for backend calls
        apiService.setToken(idToken);
        
        return userCredential;
      } else if (auth && auth.signInWithEmailAndPassword) {
        // Fallback for demo mode
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const idToken = await userCredential.user.getIdToken();
        apiService.setToken(idToken);
        return userCredential;
      } else {
        // Direct backend authentication (fallback)
        const response = await apiService.login(email, password);
        apiService.setToken(response.token);
        
        setUser({
          email: email,
          uid: response.user?.id || 'demo-user',
          displayName: response.user?.firstName + ' ' + response.user?.lastName,
          ...response.user
        });
        
        return { user: response.user };
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      // setLoading(false); // setLoading is managed by onAuthStateChanged
    }
  }, [setError]); // setLoading removed as it's handled by onAuthStateChanged

  // Email/Password sign up
  const signUp = useCallback(async (email, password, userData) => {
    try {
      setError(null);
      // setLoading(true);
      
      if (auth && typeof createUserWithEmailAndPassword === 'function') {
        // Use Firebase v9+ syntax
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        
        // Register with backend using the correct payload
        const response = await apiService.register({
          idToken,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber
        });
        
        apiService.setToken(response.token || idToken);
        return userCredential;
      } else if (auth && auth.createUserWithEmailAndPassword) {
        // Fallback for demo mode
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const idToken = await userCredential.user.getIdToken();
        
        // Register with backend using the correct payload
        const response = await apiService.register({
          idToken,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber
        });
        
        apiService.setToken(response.token || idToken);
        return userCredential;
      } else {
        // Direct backend registration (fallback)
        const response = await apiService.register({
          email,
          password,
          ...userData
        });
        
        apiService.setToken(response.token);
        
        setUser({
          email: email,
          uid: response.user?.id || 'demo-user',
          displayName: userData.firstName + ' ' + userData.lastName,
          ...response.user
        });
        
        return { user: response.user };
      }
      
      return userCredential;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      // setLoading(false);
    }
  }, [setError, setUser]); // setUser added as it's used in a fallback path

  // Google sign in
  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      // setLoading(true);
      
      if (isDemoMode) {
        // Demo mode - simulate Google auth
        const demoGoogleUser = {
          uid: 'demo-google-user',
          email: 'demo.google@example.com',
          displayName: 'Demo Google User',
          photoURL: 'https://via.placeholder.com/100',
          getIdToken: () => Promise.resolve('demo-google-token')
        };
        
        const userCredential = { 
          user: demoGoogleUser, 
          operationType: 'signIn',
          providerId: 'google.com'
        };
        
        apiService.setToken('demo-google-token');
        return userCredential;
      } else {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        // Try popup first, fallback to redirect if popup fails
        try {
          const userCredential = await signInWithPopup(auth, provider);
          const idToken = await userCredential.user.getIdToken();
          
          console.log('Google sign-in successful (popup), Firebase user:', userCredential.user);
          
          apiService.setToken(idToken);
          
          // Note: User registration/profile fetching will be handled by the auth state listener
          // which will automatically register the user if they don't exist in the backend
          
          return userCredential;
        } catch (popupError) {
          console.warn('Popup sign-in failed, trying redirect:', popupError.message);
          
          // If popup fails (blocked, closed, etc.), try redirect
          if (popupError.code === 'auth/popup-blocked' || 
              popupError.code === 'auth/popup-closed-by-user' ||
              popupError.message.includes('popup')) {
            
            console.log('Using redirect method for Google sign-in...');
            await signInWithRedirect(auth, provider);
            
            // Redirect will happen, so we don't return anything here
            // The result will be handled by getRedirectResult in the useEffect
            return null;
          } else {
            // Re-throw other errors
            throw popupError;
          }
        }
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle specific popup errors
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError('Another sign-in request is in progress.');
      } else {
        setError(error.message || 'Failed to sign in with Google');
      }
      throw error;
    } finally {
      // setLoading(false);
    }
  }, [setError]);

  // Sign out
  const logout = useCallback(async () => {
    try {
      setError(null);
      // setLoading(true); // Not typically needed for logout, onAuthStateChanged will handle state
      
      if (auth && typeof signOut === 'function') {
        // Use Firebase v9+ syntax
        await signOut(auth);
      } else if (auth && auth.signOut) {
        // Fallback for demo mode
        await auth.signOut();
      }
      
      // Clear API token and logout from backend
      await apiService.logout();
      
      // Clear user state
      setUser(null); // This will trigger onAuthStateChanged which will set loading states
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [setError, setUser]); // Added setUser

  // Update user profile
  const updateUserProfile = useCallback(async (profileData) => {
    try {
      setError(null);
      const updatedProfile = await apiService.updateProfile(profileData);
      setUser(prev => ({ ...prev, ...updatedProfile })); // This will update the user object
      return updatedProfile;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [setError, setUser]); // Added setUser

  // Memoize setError separately if it's passed down and used in useEffect dependencies by consumers
  const memoizedSetError = useCallback((err) => {
    setError(err);
  }, [setError]);

  const value = useMemo(() => ({
    user,
    loading,
    error, // The error state itself
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateUserProfile,
    setError: memoizedSetError // Pass down the memoized setError
  }), [user, loading, error, signIn, signUp, signInWithGoogle, logout, updateUserProfile, memoizedSetError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
