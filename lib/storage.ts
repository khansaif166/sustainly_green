// lib/storage.ts
import { firebaseConfigError, isFirebaseConfigured, storage } from "@/lib/firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTaskSnapshot,
} from "firebase/storage";

export async function uploadFileWithProgress(
  file: File,
  path: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isFirebaseConfigured) {
      reject(
        new Error(
          firebaseConfigError ||
            "Firebase Storage is disabled. Migrate this upload to Supabase Storage."
        )
      );
      return;
    }

    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot: UploadTaskSnapshot) => {
          const percent =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(percent));
        },
        (err) => {
          reject(err);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}
