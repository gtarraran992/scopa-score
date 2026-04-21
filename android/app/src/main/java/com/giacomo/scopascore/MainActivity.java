package com.giacomo.scopascore;

import android.app.NotificationChannel;
import android.app.NotificationManager;
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

      // Canale partita
      NotificationChannel partitaChannel = new NotificationChannel(
        "partita",
        "Fine partita",
        NotificationManager.IMPORTANCE_HIGH
      );
      partitaChannel.setDescription("Notifiche di fine partita");
      manager.createNotificationChannel(partitaChannel);

      // Canale promemoria
      NotificationChannel promemoriaChannel = new NotificationChannel(
        "promemoria",
        "Promemoria giornaliero",
        NotificationManager.IMPORTANCE_DEFAULT
      );
      promemoriaChannel.setDescription("Promemoria giornaliero per giocare");
      manager.createNotificationChannel(promemoriaChannel);
    }
  }
}