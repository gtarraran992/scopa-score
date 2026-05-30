package com.giacomo.scopascore

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import androidx.core.net.toUri
import android.os.Build
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    companion object {
        private const val REQUEST_NOTIFICATION_PERMISSION = 1001

        fun scheduleDailyNotification(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, NotificationReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val calendar = java.util.Calendar.getInstance().apply {
                set(java.util.Calendar.HOUR_OF_DAY, 12)
                set(java.util.Calendar.MINUTE, 0)
                set(java.util.Calendar.SECOND, 0)
                set(java.util.Calendar.MILLISECOND, 0)
                if (timeInMillis <= System.currentTimeMillis()) {
                    add(java.util.Calendar.DAY_OF_YEAR, 1)
                }
            }

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        calendar.timeInMillis,
                        pendingIntent
                    )
                } else {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        calendar.timeInMillis,
                        pendingIntent
                    )
                }
            } catch (e: SecurityException) {
                android.util.Log.e("ScopaScore", "Notification scheduling error: ${e.message}")
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        createNotificationChannels()
        requestNotificationPermissionIfNeeded()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)

            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build()

            // Canale vittoria
            val vittoriaSound = "android.resource://$packageName/raw/vittoria".toUri()
            val vittoriaChannel = NotificationChannel(
                "vittoria", "Vittoria", NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifica di vittoria"
                setSound(vittoriaSound, audioAttributes)
            }
            manager.createNotificationChannel(vittoriaChannel)

            // Canale sconfitta
            val sconfittaSound = "android.resource://$packageName/raw/sconfitta".toUri()
            val sconfittaChannel = NotificationChannel(
                "sconfitta", "Sconfitta", NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifica di sconfitta"
                setSound(sconfittaSound, audioAttributes)
            }
            manager.createNotificationChannel(sconfittaChannel)

            // Canale promemoria
            val notificaSound = "android.resource://$packageName/raw/notifica".toUri()
            val promemoriaChannel = NotificationChannel(
                "promemoria", "Promemoria giornaliero", NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Promemoria giornaliero per giocare"
                setSound(notificaSound, audioAttributes)
            }
            manager.createNotificationChannel(promemoriaChannel)
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED

            if (!granted) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    REQUEST_NOTIFICATION_PERMISSION
                )
            } else {
                scheduleDailyNotification(this)
            }
        } else {
            scheduleDailyNotification(this)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_NOTIFICATION_PERMISSION) {
            scheduleDailyNotification(this)
        }
    }
}