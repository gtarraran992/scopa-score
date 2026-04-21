import { NativeAudio } from '@capacitor-community/native-audio'
import { Capacitor } from '@capacitor/core'

const suoni = [
  { assetId: 'vittoria', assetPath: 'vittoria.mp3' },
  { assetId: 'sconfitta', assetPath: 'sconfitta.mp3' },
  { assetId: 'notifica', assetPath: 'notifica.mp3' },
]

export async function initAudio() {
  if (!Capacitor.isNativePlatform()) return
  for (const s of suoni) {
    try {
      await NativeAudio.preload({
        assetId: s.assetId,
        assetPath: s.assetPath,
        audioChannelNum: 1,
        isUrl: false,
      })
    } catch (e) {
      // già caricato, ignora
    }
  }
}

export async function playSound(assetId) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await NativeAudio.play({ assetId })
  } catch (e) {
    console.warn('Audio error:', e)
  }
}