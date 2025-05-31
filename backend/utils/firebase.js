const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let app;

const initializeFirebase = () => {
  if (!app) {
    try {
      // Option 1: Using environment variables
      if (process.env.FIREBASE_PRIVATE_KEY) {
        console.log('🔥 Initializing Firebase with environment variables...');
        const serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI,
          token_uri: process.env.FIREBASE_TOKEN_URI,
          auth_provider_x509_cert_url: `https://www.googleapis.com/oauth2/v1/certs`,
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        };

        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }
      // Option 2: Using service account key file (local development)
      else if (fs.existsSync(path.join(__dirname, '../config/firebase-service-account.json'))) {
        console.log('🔥 Initializing Firebase with service account file...');
        const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');
        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
      }
      // Option 3: Using Google Application Default Credentials (Cloud environment)
      else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.log('🔥 Initializing Firebase with Application Default Credentials...');
        app = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } 
      // Option 4: Development mode without Firebase (for testing)
      else {
        console.warn('⚠️  Firebase not configured. Identity Platform features will be disabled.');
        console.warn('💡 To enable Firebase:');
        console.warn('   1. Set environment variables in .env, or');
        console.warn('   2. Place firebase-service-account.json in config/ folder');
        return null;
      }

      console.log('✅ Firebase Admin SDK initialized successfully');
      return app;
    } catch (error) {
      console.error('❌ Firebase initialization error:', error.message);
      return null;
    }
  }
  return app;
};

const getFirebaseApp = () => {
  return app || initializeFirebase();
};

const verifyIdToken = async (idToken) => {
  // Allow demo mode in development environment
  if (process.env.NODE_ENV === 'development' && (idToken === 'demo-token' || idToken?.includes('demo-'))) {
    console.log('⚠️ Using demo token in development mode');
    return {
      success: true,
      user: {
        authId: 'demo-user-' + Date.now(),
        email: 'demo@example.com',
        emailVerified: true,
        name: 'Demo User',
        picture: 'https://via.placeholder.com/150'
      }
    };
  }
  
  try {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      success: true,
      user: {
        authId: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture
      }
    };
  } catch (error) {
    console.error('Firebase token verification error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  initializeFirebase,
  getFirebaseApp,
  verifyIdToken,
  admin
};
