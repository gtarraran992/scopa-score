package com.giacomo.scopascore

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

class NotificationReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "promemoria",
                "Promemoria giornaliero",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            channel.description = "Promemoria giornaliero per giocare"
            manager.createNotificationChannel(channel)
        }

        val lang = getLanguage(context)
        val body = getNotificationBody(lang)

        val notification = NotificationCompat.Builder(context, "promemoria")
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentTitle("🃏 ScopaScore")
            .setContentText(body)
            .setAutoCancel(true)
            .build()

        manager.notify(1, notification)

        // Rischedula per domani alla stessa ora
        MainActivity.scheduleDailyNotification(context)
    }

    private fun getLanguage(context: Context): String {
        // @capacitor/preferences salva in SharedPreferences con nome "CapacitorStorage"
        // e prefissa ogni chiave con "CapacitorStorage."
        val prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
        val lang = prefs.getString("CapacitorStorage.appLang", null)
        if (!lang.isNullOrEmpty()) return lang

        // Fallback alla lingua di sistema
        return context.resources.configuration.locales[0].language
    }

    private fun getNotificationBody(lang: String): String {
        return when (lang) {
            "en" -> "Challenge a friend to Scopa today!"
            "es" -> "¡Reta a un amigo a jugar a la Scopa hoy!"
            "fr" -> "Défie un ami à la Scopa aujourd'hui !"
            "de" -> "Fordere heute einen Freund zur Scopa heraus!"
            else -> "Sfida un amico a Scopa oggi!"
        }
    }
}