// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyAcb9q1eX1QM9Gl_W6U9WZNbeg6M-uyhpk",
    authDomain: "cyfencedevbyken.firebaseapp.com",
    projectId: "cyfencedevbyken",
    storageBucket: "cyfencedevbyken.firebasestorage.app",
    messagingSenderId: "632813871756",
    appId: "1:632813871756:web:57d674643f258ddd2e11a9",
    measurementId: "G-1EJNKSHNQ3"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other files
window.auth = auth;
window.db = db;