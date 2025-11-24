import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { errorEmitter } from './error-emitter';
import { getFirebaseStorage } from './firebase';

/**
 * Uploads an avatar for a user and returns the download URL.
 * @param uid The user's ID.
 * @param file The avatar file to upload.
 * @returns The public URL of the uploaded image.
 */
export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const storage = getFirebaseStorage();
  const filePath = `avatars/${uid}`;
  const storageRef = ref(storage, filePath);

  try {
    // Upload the file
    await uploadBytes(storageRef, file, { contentType: file.type });

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    // Storage errors for permissions often have a specific code
    if (error.code === 'storage/unauthorized') {
      console.error("Firebase Storage Permission Error: You don't have permission to upload to", filePath);
      // Here you could potentially emit a more specific storage error if you had a system like Firestore's
    }
    // Re-throw the error to be handled by the calling function
    throw error;
  }
}

/**
 * Deletes a user's avatar from Firebase Storage.
 * @param uid The user's ID.
 */
export async function deleteAvatar(uid: string): Promise<void> {
  const storage = getFirebaseStorage();
  const filePath = `avatars/${uid}`;
  const storageRef = ref(storage, filePath);

  try {
    await deleteObject(storageRef);
  } catch (error: any) {
    // It's okay if the file doesn't exist.
    if (error.code !== 'storage/object-not-found') {
      if (error.code === 'storage/unauthorized') {
         console.error("Firebase Storage Permission Error: You don't have permission to delete", filePath);
      }
      throw error;
    }
  }
}
