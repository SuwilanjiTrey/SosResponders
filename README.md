# SafeCircle Responder System

A comprehensive web-based emergency response dashboard for institutions to receive and respond to SOS alerts from premium SafeCircle app users within a 10km radius.

![SafeCircle](https://img.shields.io/badge/SafeCircle-Emergency%20Response-red)
![React](https://img.shields.io/badge/React-18.x-blue)
![Firebase](https://img.shields.io/badge/Firebase-10.x-orange)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Database Structure](#database-structure)
- [API Integration](#api-integration)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

SafeCircle Responder System is a real-time emergency response platform that allows emergency institutions (Police, Fire Department, Hospitals, etc.) to:

- Receive instant SOS alerts from premium users within their coverage area (10km radius)
- View emergency locations on interactive maps
- Get turn-by-turn navigation to emergency sites
- Manage emergency status (Active → Responding → Resolved)
- Track response times and statistics

## ✨ Features

### 🚨 Real-Time Emergency Management
- **Live SOS Alerts**: Instant notifications when premium users send SOS alerts
- **Real-time Updates**: Automatic synchronization using Firebase Firestore
- **Status Tracking**: Monitor emergency lifecycle (active/responding/resolved)

### 🗺️ Interactive Mapping
- **OpenStreetMap Integration**: High-quality, open-source maps
- **Visual Markers**: 
  - 🔴 Red pulsing circles for active emergencies
  - 🟠 Orange circles for emergencies being responded to
  - 🟢 Green circles for resolved emergencies
  - 🔵 Blue circle for responder location
- **In-App Navigation**: Turn-by-turn directions using OSRM routing
- **Distance Calculation**: Automatic distance calculation to each emergency

### 📊 Dashboard & Analytics
- **Statistics Cards**: 
  - Total active emergencies
  - Currently responding count
  - Resolved today count
- **Filtering System**: Filter by status (all/active/responding)
- **Time Tracking**: Shows when each emergency was reported
- **Response Management**: Quick status updates with single click

### 🔐 Authentication & Security
- **Secure Login**: Firebase Authentication
- **Role-Based Access**: Responder-only access
- **Protected Routes**: Authenticated routes only
- **Session Management**: Automatic logout functionality

### 📱 User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Clean Interface**: Modern, intuitive UI
- **Quick Actions**: One-click status updates and navigation
- **Detailed Views**: Comprehensive emergency information

## 🏗️ System Architecture

```
SafeCircle Responder System
│
├── Frontend (React)
│   ├── Authentication Module
│   │   ├── Login Component
│   │   └── Registration Component
│   │
│   ├── Dashboard Module
│   │   ├── Statistics Cards
│   │   ├── Emergency List (Sidebar)
│   │   ├── Interactive Map
│   │   └── Emergency Details Panel
│   │
│   └── Navigation Module
│       ├── Route Display
│       └── Turn-by-turn Directions
│
├── Backend (Firebase)
│   ├── Firestore Database
│   │   ├── Responders Collection
│   │   └── SOS Subcollection
│   │
│   ├── Authentication
│   │   └── Email/Password Auth
│   │
│   └── Real-time Listeners
│       └── onSnapshot Updates
│
└── External Services
    ├── OpenStreetMap (Mapping)
    ├── Leaflet (Map Library)
    └── OSRM (Routing Engine)
```

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Modern web browser

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/safecircle-responder.git
cd safecircle-responder
```

### Step 2: Install Dependencies

```bash
npm install
```

Required dependencies:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.x",
    "firebase": "^10.x",
    "leaflet": "^1.9.4",
    "leaflet-routing-machine": "^3.2.12",
    "lucide-react": "^0.263.1"
  }
}
```

### Step 3: Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Get your Firebase configuration

### Step 4: Configure Environment

Create a `.env` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Step 5: Update Firebase Config

In your main app file, update the Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
```

### Step 6: Run the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

## ⚙️ Configuration

### Firestore Security Rules

Apply these security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Responders collection
    match /Responders/{responderId} {
      // Responder can read/write their own document
      allow read, write: if request.auth.uid == responderId;
      // All authenticated users can read responder data
      allow read: if request.auth != null;
      
      // SOS subcollection for emergency alerts
      match /SOS/{sosId} {
        // Responder can read/update/delete their SOS alerts
        allow read, update, delete: if request.auth.uid == responderId;
        // Premium users can create SOS alerts
        allow create: if request.auth != null;
      }
    }
  }
}
```

### Default Location Settings

Update in `src/constants.js`:

```javascript
// Default location (Lusaka, Zambia)
export const LUSAKA_CENTER = { 
  lat: -15.4167, 
  lng: 28.2833 
};

// Coverage radius (in kilometers)
export const COVERAGE_RADIUS = 10;
```

## 🚀 Usage

### For Emergency Institutions

#### 1. Registration

1. Navigate to the registration page
2. Fill in institution details:
   - Institution Name (e.g., "Lusaka Central Police")
   - Branch (e.g., "Central District")
   - Email address
   - Password (minimum 6 characters)
   - Contact Information
   - Location Coordinates (optional - defaults to Lusaka center)
3. Click "Register"

#### 2. Login

1. Enter your registered email and password
2. Click "Sign in"
3. You'll be redirected to the dashboard

#### 3. Monitoring Emergencies

**Dashboard Overview:**
- View statistics cards showing active, responding, and resolved counts
- See all emergencies in the sidebar
- View emergency locations on the map

**Emergency List:**
- Red pulsing indicator = Active emergency
- Orange indicator = Currently responding
- Green indicator = Resolved emergency
- Click any emergency to view details

#### 4. Responding to Emergencies

**When you see an active emergency:**

1. **Select Emergency**: Click on the emergency in the sidebar
2. **View Details**: Review contact info, location, and additional information
3. **Show Route**: Click "Show Route" to see navigation path
4. **Start Responding**: Click "Start Responding" to update status
5. **Navigate**: Follow the blue route line on the map
6. **Mark Resolved**: Once handled, click "Mark as Resolved"

**Navigation Features:**
- Blue route line shows optimal path
- Distance and estimated time displayed
- Click "Clear Route" to view other emergencies

#### 5. Filtering

Use filter buttons to show:
- **All**: All emergencies regardless of status
- **Active**: Only active emergencies requiring response
- **Responding**: Emergencies currently being handled

### For Mobile App Integration

When a premium user sends an SOS from the mobile app:

```javascript
// Mobile app creates document
await addDoc(collection(db, "Responders", responderId, "SOS"), {
  madeBy: userId,
  contact: userPhone,
  location: {
    latitude: -15.4142,
    longitude: 28.2809
  },
  information: "Armed robbery in progress",
  status: "active",
  createdAt: new Date()
});
```

The web dashboard will:
1. Receive the alert instantly via real-time listener
2. Display it on the map with a red pulsing marker
3. Show it in the sidebar with distance and time
4. Allow responders to view and respond

## 🗄️ Database Structure

### Responders Collection

```
Responders/{responderId}/
├── institutionName: string          // "Lusaka Central Police"
├── branch: string                   // "Central District"
├── email: string                    // "police@lusaka.gov.zm"
├── contactInfo: string              // "+260 97 1234567"
├── createdAt: timestamp             // Account creation date
└── location: {                      // Responder's base location
    latitude: number,                // -15.4186
    longitude: number                // 28.2817
}
```

### SOS Subcollection

```
Responders/{responderId}/SOS/{sosId}/
├── madeBy: string                   // User ID who sent SOS
├── contact: string                  // "+260 97 1234567"
├── location: {                      // Emergency location
│   latitude: number,                // -15.4142
│   longitude: number                // 28.2809
}
├── information: string              // "Armed robbery in progress"
├── status: string                   // "active" | "responding" | "resolved"
├── createdAt: timestamp             // When SOS was sent
└── resolvedAt: timestamp            // When marked as resolved (optional)
```

### Data Flow Example

```javascript
// 1. Premium user sends SOS (Mobile App)
const sosData = {
  madeBy: "user-premium-001",
  contact: "+260 97 1234567",
  location: { latitude: -15.4142, longitude: 28.2809 },
  information: "Medical emergency",
  status: "active",
  createdAt: new Date()
};

// 2. System finds responders within 10km

// 3. Creates SOS document for each responder
await setDoc(doc(db, "Responders", responderId, "SOS", sosId), sosData);

// 4. Web dashboard receives via onSnapshot listener
onSnapshot(collection(db, "Responders", currentUser.uid, "SOS"), (snapshot) => {
  // Update UI with new emergencies
});

// 5. Responder updates status
await updateDoc(doc(db, "Responders", responderId, "SOS", sosId), {
  status: "responding"
});

// 6. When resolved
await updateDoc(doc(db, "Responders", responderId, "SOS", sosId), {
  status: "resolved",
  resolvedAt: new Date()
});
```

## 🔌 API Integration

### Firebase Authentication

```javascript
// Login
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// Register
const userCredential = await createUserWithEmailAndPassword(auth, email, password);

// Logout
await signOut(auth);

// Auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
  } else {
    // User is signed out
  }
});
```

### Firestore Operations

```javascript
// Real-time listener for SOS alerts
const unsubscribe = onSnapshot(
  collection(db, "Responders", responderId, "SOS"),
  (snapshot) => {
    snapshot.forEach((doc) => {
      const sosData = doc.data();
      // Handle new/updated SOS
    });
  }
);

// Update SOS status
await updateDoc(
  doc(db, "Responders", responderId, "SOS", sosId),
  { status: "responding" }
);

// Get responder data
const responderDoc = await getDoc(doc(db, "Responders", responderId));
const responderData = responderDoc.data();
```

### OpenStreetMap Routing

```javascript
// Using Leaflet Routing Machine
L.Routing.control({
  waypoints: [
    L.latLng(fromLat, fromLng),  // Responder location
    L.latLng(toLat, toLng)        // Emergency location
  ],
  router: L.Routing.osrmv1({
    serviceUrl: 'https://router.project-osrm.org/route/v1'
  })
}).addTo(map);
```

## 🔒 Security

### Authentication Security

- Passwords are hashed by Firebase Authentication
- Minimum 6 character password requirement
- Email verification recommended (optional enhancement)
- Session management handled by Firebase

### Data Access Control

- Responders can only access their own SOS alerts
- Premium user data is only shared with authorized responders
- Location data is transmitted securely via HTTPS
- No sensitive data stored in localStorage

### Best Practices

1. **Environment Variables**: Never commit Firebase config to version control
2. **HTTPS Only**: Deploy only on HTTPS domains
3. **Regular Updates**: Keep dependencies updated
4. **Rate Limiting**: Consider implementing rate limits for API calls
5. **Error Logging**: Implement proper error tracking (e.g., Sentry)

## 🐛 Troubleshooting

### Common Issues

#### Map not loading
```
Error: Map container not found
```
**Solution**: Ensure the map container div exists before initializing Leaflet

#### Firebase connection errors
```
Error: Firebase: Error (auth/network-request-failed)
```
**Solution**: Check internet connection and Firebase config

#### Authentication fails
```
Error: Firebase: Error (auth/wrong-password)
```
**Solution**: Verify credentials or reset password

#### Route not displaying
```
Error: OSRM routing failed
```
**Solution**: Check internet connection, OSRM service may be temporarily down

### Debug Mode

Enable console logging:

```javascript
// Add to your app initialization
if (process.env.NODE_ENV === 'development') {
  console.log('Debug mode enabled');
  window.debugSafeCircle = {
    sosList: sosList,
    responderData: responderData,
    selectedSOS: selectedSOS
  };
}
```

### Performance Issues

If experiencing slow performance:

1. Check number of active listeners
2. Limit query results using `.limit()`
3. Implement pagination for large datasets
4. Use indexes in Firestore for complex queries

## 📱 Mobile App Integration

### Sending SOS from Mobile

The mobile app should use this function to send SOS alerts:

```javascript
// utils/sosNotifications.ts
export const sendSOSNotification = async (sosData) => {
  const { userId, userName, userPhone, location, information } = sosData;
  
  // Check if user is premium
  const userDoc = await getDoc(doc(db, "users", userId));
  const isPremium = userDoc.data()?.isPremium === true;
  
  if (!isPremium) {
    console.log("User is not premium - only sending to circle members");
    return;
  }
  
  // Find responders within 10km
  const respondersQuery = query(collection(db, "Responders"));
  const respondersSnapshot = await getDocs(respondersQuery);
  
  respondersSnapshot.forEach(async (responderDoc) => {
    const responderData = responderDoc.data();
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      responderData.location.latitude,
      responderData.location.longitude
    );
    
    // If within 10km, send SOS
    if (distance <= 10) {
      await addDoc(
        collection(db, "Responders", responderDoc.id, "SOS"),
        {
          madeBy: userId,
          contact: userPhone,
          location: location,
          information: information || "Emergency - no details provided",
          status: "active",
          createdAt: new Date()
        }
      );
    }
  });
};
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

For support, please contact:
- Email: support@safecircle.com
- Documentation: [docs.safecircle.com](https://docs.safecircle.com)
- Issues: [GitHub Issues](https://github.com/yourusername/safecircle-responder/issues)

## 🙏 Acknowledgments

- OpenStreetMap contributors for mapping data
- Leaflet team for the mapping library
- OSRM for routing services
- Firebase for backend infrastructure
- React team for the frontend framework

## 📈 Roadmap

### Planned Features

- [ ] Push notifications for new emergencies
- [ ] Voice navigation integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Export emergency reports
- [ ] Team coordination features
- [ ] Offline mode support
- [ ] Mobile responder app

---

**Built with ❤️ for emergency responders in Zambia and beyond**

Version: 1.0.0 | Last Updated: 2025
