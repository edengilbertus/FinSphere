import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:123456789012:web:demo',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase configuration is valid (not demo values)
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && 
         firebaseConfig.authDomain && 
         firebaseConfig.projectId &&
         firebaseConfig.appId &&
         !firebaseConfig.apiKey.includes('demo-') &&
         !firebaseConfig.apiKey.startsWith('your-');
};

// Create a comprehensive demo auth object that matches Firebase Auth interface
const createDemoAuth = () => {
  let currentUser = null;
  const listeners = new Set();

  const demoUser = {
    uid: 'demo-user-id',
    email: 'demo@example.com',
    displayName: 'Demo User',
    emailVerified: true,
    photoURL: null,
    phoneNumber: null,
    providerData: [],
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    },
    getIdToken: () => Promise.resolve('demo-token'),
    getIdTokenResult: () => Promise.resolve({
      token: 'demo-token',
      claims: {},
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      signInProvider: 'password'
    }),
    reload: () => Promise.resolve(),
    toJSON: () => ({ uid: 'demo-user-id', email: 'demo@example.com' })
  };

  const notifyListeners = (user) => {
    listeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.warn('Auth listener error:', error);
      }
    });
  };

  return {
    currentUser,
    app: { name: '[DEFAULT]' },
    config: { ...firebaseConfig },
    name: 'demo-auth',
    tenantId: null,
    settings: { appVerificationDisabledForTesting: false },
    languageCode: null,
    emulatorConfig: null,
    
    // Core auth methods
    onAuthStateChanged: (callback) => {
      listeners.add(callback);
      // Call immediately with current state
      setTimeout(() => callback(currentUser), 0);
      return () => listeners.delete(callback);
    },
    
    signInWithEmailAndPassword: (email, password) => {
      const user = { ...demoUser, email };
      currentUser = user;
      notifyListeners(user);
      return Promise.resolve({ user, operationType: 'signIn' });
    },
    
    createUserWithEmailAndPassword: (email, password) => {
      const user = { ...demoUser, email };
      currentUser = user;
      notifyListeners(user);
      return Promise.resolve({ user, operationType: 'signIn' });
    },
    
    signOut: () => {
      currentUser = null;
      notifyListeners(null);
      return Promise.resolve();
    },
    
    updateCurrentUser: (user) => {
      currentUser = user;
      notifyListeners(user);
      return Promise.resolve();
    },
    
    // Additional methods that Firebase might expect
    beforeAuthStateChanged: () => () => {},
    onIdTokenChanged: (callback) => {
      listeners.add(callback);
      setTimeout(() => callback(currentUser), 0);
      return () => listeners.delete(callback);
    },
    
    // Properties that Firebase expects
    _delegate: {},
    _errorFactory: { create: () => new Error('Demo mode error') }
  };
};

// Initialize app and auth
let app = null;
let auth = null;
export const isDemoMode = !isFirebaseConfigured();

try {
  if (isFirebaseConfigured()) {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    // Initialize Firebase Authentication and get a reference to the service
    auth = getAuth(app);
    console.log('✅ Firebase initialized successfully with config:', 
      { 
        apiKey: firebaseConfig.apiKey?.substring(0, 5) + '...',
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId
      }
    );
  } else {
    console.warn('⚠️ Firebase not properly configured. Using demo mode.');
    console.log('Missing or invalid Firebase configuration values:', 
      Object.entries(firebaseConfig)
        .filter(([key, value]) => !value || value.includes('demo-') || value.includes('your-'))
        .map(([key]) => key)
    );
    app = {
      name: '[DEFAULT]',
      options: { ...firebaseConfig },
      automaticDataCollectionEnabled: false
    };
    auth = createDemoAuth();
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.log('Falling back to demo mode due to initialization error');
  app = {
    name: '[DEFAULT]',
    options: { ...firebaseConfig },
    automaticDataCollectionEnabled: false
  };
  auth = createDemoAuth();
}

// Create a Firebase service object that combines both auth and app
const firebaseService = {
  app,
  auth,
  isDemoMode
};

export { auth };
export default firebaseService;
