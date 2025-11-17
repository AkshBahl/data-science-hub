# Firestore Security Rules

Since the site is now publicly accessible, you need to update your Firestore security rules to allow public read access to certain collections.

## Required Security Rules

Go to Firebase Console > Firestore Database > Rules and update your rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to interview questions
    match /interviewQuestions/{questionId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Allow public read access to blog posts
    match /blogPosts/{postId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Allow public read access to services
    match /services/{serviceId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Allow public read access to case studies
    match /caseStudies/{studyId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Allow public read access to projects
    match /projects/{projectId} {
      allow read: if true; // Public read access
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Users collection - only authenticated users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      // Admins can read/write any user
      allow read, write: if request.auth != null && 
                           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## What These Rules Do:

1. **Public Read Access**: Anyone (authenticated or not) can read:
   - `interviewQuestions` - All interview questions
   - `blogPosts` - All blog posts
   - `services` - All services
   - `caseStudies` - All case studies
   - `projects` - All projects

2. **Admin Write Access**: Only authenticated admin users can write to these collections.

3. **User Data Protection**: Users can only read/write their own user document, and admins can access any user document.

## How to Update:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** > **Rules** tab
4. Paste the rules above
5. Click **Publish**

## Testing:

After updating the rules, refresh your interview prep page. The questions should load without requiring authentication.

## Important Notes:

- These rules allow **public read access** to content collections, which is necessary for the public site
- Write access is still restricted to admins only
- User data remains protected
- Make sure to test thoroughly after updating rules

