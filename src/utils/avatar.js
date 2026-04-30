import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

export async function pickAndUploadAvatar(uid) {
  // Apre la galleria
  const image = await Camera.getPhoto({
    quality: 80,
    allowEditing: true,
    resultType: CameraResultType.Base64,
    source: CameraSource.Photos,
  })

  // Carica su Firebase Storage
  const storageRef = ref(storage, `avatars/${uid}/profile.jpg`)
  await uploadString(storageRef, image.base64String, 'base64', {
    contentType: 'image/jpeg'
  })

  // Restituisce l'URL pubblico
  const url = await getDownloadURL(storageRef)
  return url
}