package com.giacomo.scopascore;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    createNotificationChannels();
  }

  private void createNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationManager manager = getSystemService(NotificationManager.class);

      AudioAttributes audioAttributes = new AudioAttributes.Builder()
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
        .build();

      // Canale vittoria
      Uri vittoriaSound = Uri.parse("android.resource://" + getPackageName() + "/raw/vittoria");
      NotificationChannel vittoriaChannel = new NotificationChannel(
        "vittoria",
        "Vittoria",
        NotificationManager.IMPORTANCE_HIGH
      );
      vittoriaChannel.setDescription("Notifica di vittoria");
      vittoriaChannel.setSound(vittoriaSound, audioAttributes);
      manager.createNotificationChannel(vittoriaChannel);

      // Canale sconfitta
      Uri sconfittaSound = Uri.parse("android.resource://" + getPackageName() + "/raw/sconfitta");
      NotificationChannel sconfittaChannel = new NotificationChannel(
        "sconfitta",
        "Sconfitta",
        NotificationManager.IMPORTANCE_HIGH
      );
      sconfittaChannel.setDescription("Notifica di sconfitta");
      sconfittaChannel.setSound(sconfittaSound, audioAttributes);
      manager.createNotificationChannel(sconfittaChannel);

      // Canale promemoria
      Uri notificaSound = Uri.parse("android.resource://" + getPackageName() + "/raw/notifica");
      NotificationChannel promemoriaChannel = new NotificationChannel(
        "promemoria",
        "Promemoria giornaliero",
        NotificationManager.IMPORTANCE_DEFAULT
      );
      promemoriaChannel.setDescription("Promemoria giornaliero per giocare");
      promemoriaChannel.setSound(notificaSound, audioAttributes);
      manager.createNotificationChannel(promemoriaChannel);
    }
  }
}