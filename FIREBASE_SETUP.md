# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication and Firestore for the Toledo Doctors application.

## Prerequisites

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database

## Environment Variables

Add the following variables to your `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Firestore Database Structure

Create a `users` collection in Firestore with the following structure:

### Collection: `users`

Each document should have the user's UID as the document ID:

```json
{
  "email": "user@example.com",
  "role": "admin",  // or "staff"
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Example Documents

**Admin User:**
- Document ID: `{user_uid_from_auth}`
- Fields:
  - `email`: "admin@clinic.com"
  - `role`: "admin"
  - `createdAt`: timestamp

**Staff User:**
- Document ID: `{user_uid_from_auth}`
- Fields:
  - `email`: "staff1@clinic.com"
  - `role`: "staff"
  - `createdAt`: timestamp

## Setting Up Users

### Option 1: Using Firebase Console

1. Go to Firebase Console → Authentication
2. Create users with email/password
3. Copy the User UID from each user
4. Go to Firestore Database
5. Create a `users` collection
6. For each user, create a document with:
   - Document ID: The User UID from Authentication
   - Fields: `email`, `role` ("admin" or "staff")

### Option 2: Using Firebase CLI

Install Firebase CLI and run:

```bash
firebase login
firebase init firestore
```

Then create a script to add users programmatically.

## Security Rules

Update your Firestore security rules to ensure users can only read their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Prevent client-side writes
    }
  }
}
```

## Testing

1. Create test users in Firebase Authentication
2. Add corresponding documents in Firestore with roles
3. Test login with both admin and staff accounts
4. Verify that the correct role is stored in localStorage

## Migration from Hardcoded Accounts

The old hardcoded accounts were:
- admin@clinic.com / admin123 (admin role)
- staff1@clinic.com / staff123 (staff role)
- staff2@clinic.com / staff123 (staff role)

You should create these same users in Firebase Authentication with the same passwords, then add their role information in Firestore.
