import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, orderBy, limit, onSnapshot, Timestamp, GeoPoint } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import {firebaseConfig} from './api/keys.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

export { db, auth, Timestamp, GeoPoint }
