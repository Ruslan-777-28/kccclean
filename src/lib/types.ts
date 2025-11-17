import type { Timestamp } from 'firebase/firestore';

export interface UserPublic {
  uid: string;
  email?: string;
  displayName: string;
  photoURL: string;
}

export interface UserPrivate {
  uid: string;
  email: string;
  // Add any private user settings here
}

export type CallStatus = 'ringing' | 'accepted' | 'ended' | 'declined';

export interface Call {
  id: string;
  callerId: string;
  calleeId: string;
  status: CallStatus;
  roomUrl: string | null;
  createdAt: Timestamp;
}
