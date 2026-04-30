import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import it from './it'
import en from './en'
import es from './es'
import fr from './fr'
import de from './de'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
    },
    fallbackLng: 'it',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

export default i18n