// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1C1mHbmGaBxfdsQ34Cosgoned1Cg5cWQ",
  authDomain: "groupmela.firebaseapp.com",
  databaseURL: "https://groupmela-default-rtdb.firebaseio.com",
  projectId: "groupmela",
  storageBucket: "groupmela.firebasestorage.app",
  messagingSenderId: "608978556223",
  appId: "1:608978556223:web:905c071ee45c2b010d6f8a",
  measurementId: "G-CPTNDSGTYE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get database reference
const database = firebase.database();