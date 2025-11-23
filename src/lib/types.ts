import type { Timestamp } from 'firebase/firestore';

export interface UserPublic {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isOnline?: boolean;
  lastActive?: Timestamp;
}

export interface UserPrivate {
  uid: string;
  email: string;
  // Add any private user settings here
}

export type CallStatus = 'ringing' | 'accepted' | 'in-progress' | 'ended' | 'declined';

export interface Call {
  id: string;
  callId: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  status: CallStatus;
  roomId?: string;      // додається коли створюється VideoSDK room
  createdAt?: any;
  updatedAt?: any;
}
