'use client';

import { doc, serverTimestamp, updateDoc, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";

let presenceInterval: NodeJS.Timeout | null = null;

// Function to start the presence system for a logged-in user
export function startUserPresence(db: Firestore, user: User) {
  if (typeof window === 'undefined' || !user) return;

  const userDocRef = doc(db, "users_public", user.uid);

  // 1. Set online immediately
  updateDoc(userDocRef, {
    isOnline: true,
    lastActive: serverTimestamp(),
  }).catch(console.error);

  // 2. Clear any existing heartbeat interval
  if (presenceInterval) {
    clearInterval(presenceInterval);
  }

  // 3. Start a new heartbeat every 60 seconds
  presenceInterval = setInterval(() => {
    updateDoc(userDocRef, {
      lastActive: serverTimestamp(),
      isOnline: true, // Keep setting to true as long as the tab is open
    }).catch(console.error);
  }, 60000);

  // 4. Set to offline when the window is closed
  window.addEventListener("beforeunload", () => {
    if (presenceInterval) clearInterval(presenceInterval);
    // Note: this is not guaranteed to run, but it's our best effort
    // For a more reliable solution, a Cloud Function checking lastActive is needed.
    updateDoc(userDocRef, {
      isOnline: false,
      lastActive: serverTimestamp(),
    });
  });
}

// Function to stop the presence system (e.g., on logout)
export function stopUserPresence(db: Firestore, user: User) {
    if (typeof window === 'undefined' || !user) return;
    
    if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
    }
    
    const userDocRef = doc(db, "users_public", user.uid);
    return updateDoc(userDocRef, {
        isOnline: false,
        lastActive: serverTimestamp(),
    });
}
