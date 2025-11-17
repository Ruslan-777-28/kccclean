import { ref, uploadBytes, getDownloadURL, deleteObject, type FirebaseStorage } from 'firebase/storage';

/**
 * Uploads an avatar for a user and returns the download URL.
 * @param storage The Firebase Storage instance.
 * @param uid The user's ID.
 * @param file The avatar file to upload.
 * @returns The public URL of the uploaded image.
 */
export async function uploadAvatar(storage: FirebaseStorage, uid: string, file: File): Promise<string> {
  const filePath = `avatars/${uid}.jpg`;
  const storageRef = ref(storage, filePath);

  // Upload the file
  await uploadBytes(storageRef, file);

  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Deletes a user's avatar from Firebase Storage.
 * @param storage The Firebase Storage instance.
 * @param uid The user's ID.
 */
export async function deleteAvatar(storage: FirebaseStorage, uid: string): Promise<void> {
  const filePath = `avatars/${uid}.jpg`;
  const storageRef = ref(storage, filePath);

  try {
    await deleteObject(storageRef);
  } catch (error: any) {
    // It's okay if the file doesn't exist.
    if (error.code !== 'storage/object-not-found') {
      throw error;
    }
  }
}
