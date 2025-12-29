# SafeCircle Responder System Implementation Documentation

## Overview
This document covers the implementation of a responder system for the SafeCircle app, which allows emergency response institutions to receive and respond to SOS alerts from premium users within a 10km radius.

## Database Structure

### Users Collection
```
users/{userId}/
├── circles/{circleId}/
│   ├── addedAt: timestamp
│   ├── category: string (e.g., "Sibling", "Emergency")
│   ├── invitedBy: string (userId)
│   ├── isRegistered: boolean
│   ├── mobileNumber: string
│   ├── name: string
│   └── status: string ("pending" | "accepted" | "rejected")
├── notifications/{notificationId}/
│   ├── category: string
│   ├── circleMemberId: string
│   ├── createdAt: timestamp
│   ├── fromUserId: string
│   ├── fromUserName: string
│   ├── fromUserPhone: string
│   ├── message: string
│   ├── status: string
│   └── type: string
├── createdAt: timestamp
├── email: string
├── fcmTokens: map
├── isPremium: boolean
├── lastActiveAt: timestamp
├── mobileNumber: string
├── name: string
├── phoneVerified: boolean
├── settings: map
└── updatedAt: timestamp
```

### Responders Collection
```
Responders/{responderId}/
├── institutionName: string
├── branch: string
├── location: { latitude: number, longitude: number }
├── contactInfo: string
├── email: string
├── createdAt: timestamp
└── SOS/{sosId}/
    ├── madeBy: string (userId)
    ├── location: { latitude: number, longitude: number }
    ├── information: string
    ├── contact: string
    ├── status: string ("active" | "responding" | "resolved")
    └── createdAt: timestamp
```

### Recorded Locations Collection
```
recorded_locations/{locationId}/
├── userId: string
├── latitude: number
├── longitude: number
├── accuracy: number
├── timestamp: timestamp
└── createdAt: string
```

## Key Components

### 1. Authentication System

#### Login Screen (app/auth/login.tsx)
```typescript
// Key logic to differentiate between regular users and responders
const handleLogin = async () => {
  // ... authentication logic
  
  // Check if user is a regular user or responder
  const userDoc = await getDoc(doc(db, "users", user.uid));
  
  if (userDoc.exists()) {
    // Regular user - redirect to dashboard
    router.replace('/(tabs)/dashboard');
  } else {
    // Check if user is a responder
    const respondersQuery = await getDoc(doc(db, "Responders", user.uid));
    
    if (respondersQuery.exists()) {
      // Responder - redirect to responder dashboard
      router.replace('/responder/dashboard');
    }
  }
};
```

#### Responder Registration (app/auth/register-responder.tsx)
```typescript
// Create responder document in Firestore
await setDoc(doc(db, "Responders", user.uid), {
  institutionName,
  branch,
  email,
  contactInfo,
  createdAt: new Date(),
  location: {
    latitude: 0,
    longitude: 0
  }
});
```

### 2. SOS Notification System

#### SOS Button (components/SOSButton.tsx)
```typescript
// Send SOS Alert (after timer expires)
const sendSOSAlert = async () => {
  // Get user details
  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  const userData = userDoc.data();
  
  // Get current location
  const locationData = await getCurrentLocation();
  
  // Convert to the format expected by sendSOSNotification
  const location = {
    latitude: locationData.lat,
    longitude: locationData.lng
  };
  
  // Send SOS notification to circles and responders
  await sendSOSNotification({
    userId: currentUser.uid,
    userName: userData.name,
    userPhone: userData.mobileNumber,
    location,
    information: '' // User didn't have time to specify
  });
};
```

#### SOS Notification Utility (utils/sosNotifications.ts)
```typescript
export const sendSOSNotification = async (sosData: SOSData) => {
  // Get user data to check if they're premium
  const userDocQuery = query(collection(db, "users"), where("__name__", "==", currentUser.uid));
  const userDocSnapshot = await getDocs(userDocQuery);
  const userData = userDocSnapshot.docs[0].data();
  const isPremium = userData.isPremium === true;
  
  // ALWAYS send to circle members (for both basic and premium users)
  const circlesQuery = query(
    collection(db, "users", currentUser.uid, "circles"), 
    where("status", "==", "accepted")
  );
  const circlesSnapshot = await getDocs(circlesQuery);
  
  // Get all unique mobile numbers from circle members
  const mobileNumbers = circlesSnapshot.docs
    .map(doc => doc.data().mobileNumber)
    .filter(phone => phone && typeof phone === 'string' && phone.trim() !== '');
  
  // Find user UIDs for these mobile numbers
  const memberUidMap = new Map<string, string>();
  // ... logic to map mobile numbers to UIDs
  
  // Send notifications to circle members
  circlesSnapshot.docs.map(async (circleDoc) => {
    const memberUid = memberUidMap.get(memberPhone);
    if (memberUid) {
      const notificationRef = doc(collection(db, "users", memberUid, "notifications"));
      await setDoc(notificationRef, {
        category: "Emergency",
        // ... notification data
      });
    }
  });
  
  // ONLY send to responders if user is premium
  if (isPremium) {
    await sendToResponders(sosData);
  }
};
```

### 3. Responder Dashboard

#### Mobile Responder Dashboard (app/responder/dashboard.tsx)
```typescript
// Subscribe to SOS updates
const unsubscribe = onSnapshot(
  query(collection(db, "Responders", currentUser.uid, "SOS")),
  (snapshot) => {
    const sosData: SOS[] = [];
    snapshot.forEach((doc) => {
      sosData.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as SOS);
    });
    setSosList(sosData);
    setLoading(false);
  }
);
```

#### Web Responder Dashboard (src/pages/Dashboard.jsx)
```jsx
const Dashboard = ({ emergencies, loading }) => {
  // Filter active emergencies
  const activeEmergencies = emergencies.filter(emergency => emergency.status === 'active');
  
  // Get high priority emergencies
  const highPriorityEmergencies = activeEmergencies.filter(emergency => emergency.priority === 'high');
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Emergency Response Dashboard</h1>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats cards */}
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Recent Emergencies</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {/* Emergency list */}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 4. Map Implementation

#### Responder Map (app/responder/map/[id].tsx)
```typescript
const generateMapHTML = () => {
  if (!sos) return '';
  
  const centerLat = sos.location.latitude;
  const centerLon = sos.location.longitude;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        /* Map styles */
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${centerLat}, ${centerLon}], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);
        
        // Create emergency marker
        var emergencyIcon = L.divIcon({
          className: 'custom-marker',
          html: \`<div>...</div>\`,
          iconSize: [40, 50],
          iconAnchor: [20, 50]
        });
        
        var marker = L.marker([${centerLat}, ${centerLon}], { icon: emergencyIcon })
          .addTo(map)
          .bindPopup(\`<div>...</div>\`)
          .openPopup();
      </script>
    </body>
    </html>
  `;
};

// Platform-specific rendering
if (Platform.OS === 'web') {
  return (
    <View style={styles.mapContainer}>
      <iframe
        srcDoc={generateMapHTML()}
        style={styles.mapIframe}
        title="Emergency Location Map"
        frameBorder="0"
        scrolling="no"
        allowFullScreen
      />
    </View>
  );
} else {
  return (
    <View style={styles.mapContainer}>
      <WebView
        originWhitelist={['*']}
        source={{ html: generateMapHTML() }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}
```

## Key Features Implemented

1. **User Authentication**
   - Separate login flows for regular users and responders
   - Registration for emergency institutions
   - Automatic redirection to appropriate dashboard

2. **SOS System**
   - Timer-based SOS activation with countdown
   - Location-based emergency alerts
   - Different notification flows for basic and premium users

3. **Responder Dashboard**
   - List of active emergencies
   - Status tracking (active, responding, resolved)
   - Map view for emergency locations

4. **Location Services**
   - Integration with existing location utilities
   - OpenStreetMap implementation for both web and mobile
   - Location-based responder matching (10km radius)

5. **Notification System**
   - Circle member notifications for all users
   - Responder notifications for premium users only
   - Mobile number to UID mapping for circle members

## Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // User can read their own document
      allow read, write: if request.auth.uid == userId;
      
      // Allow authenticated users to read all user documents (for search by mobile)
      allow read: if request.auth != null;
      
      // Circles subcollection
      match /circles/{circleId} {
        allow read, write: if request.auth.uid == userId;
        allow read: if request.auth != null;
        allow update: if request.auth != null;
      }
      
      // Notifications subcollection
      match /notifications/{notificationId} {
        allow read, update, delete: if request.auth.uid == userId;
        allow create: if request.auth != null;
      }
    }
    
    // recorded_locations collection
    match /recorded_locations/{locationId} {
      allow read, create, update, delete: if request.auth != null;
    }
    
    // Responders collection
    match /Responders/{responderId} {
      allow read, write: if request.auth.uid == responderId;
      allow read: if request.auth != null;
      
      // SOS subcollection for emergency alerts
      match /SOS/{sosId} {
        allow read, update, delete: if request.auth.uid == responderId;
        allow create: if request.auth != null;
        allow update: if request.auth.uid == responderId;
      }
    }
  }
}
```

## Premium vs Basic User Functionality

### Basic Users
- Send SOS alerts to circle members only
- Receive notifications from circle members
- View live location of circle members

### Premium Users
- All basic user features
- Send SOS alerts to nearby responders (within 10km)
- Access to nearby emergency services (police, hospitals, fire stations)
- Enhanced location tracking features

## Technical Implementation Details

1. **Mobile-Web Compatibility**
   - Platform-specific rendering for maps (WebView for mobile, iframe for web)
   - Consistent UI/UX across platforms
   - Responsive design for web dashboard

2. **Location Services**
   - Integration with existing location utilities
   - Fallback to last known location if current location unavailable
   - Distance calculation for responder matching

3. **Error Handling**
   - Comprehensive error handling for all async operations
   - User-friendly error messages
   - Graceful degradation when features fail

4. **Performance Optimization**
   - Efficient Firestore queries with proper indexing
   - Batch processing for multiple notifications
   - Real-time updates with onSnapshot listeners

## Next Phase Considerations

1. **Push Notifications**
   - Implement FCM for real-time alerts
   - Handle notification permissions
   - Custom notification sounds and priority levels

2. **Enhanced Responder Features**
   - Responder availability status
   - Specialization tags for different emergency types
   - Response time tracking

3. **Advanced Location Features**
   - Geofencing for automatic alerts
   - Location history and patterns
   - Integration with external mapping services

4. **Analytics and Reporting**
   - SOS frequency and response time analytics
   - Emergency hotspots identification
   - Responder performance metrics

This implementation provides a solid foundation for the SafeCircle responder system, with clear separation between basic and premium features, robust error handling, and a scalable architecture for future enhancements.
