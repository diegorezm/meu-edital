package app.meuedital;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;

/** Serviço em primeiro plano com a notificação do cronômetro. */
public class StudyTimerService extends Service {

    static final String ACTION_RUNNING = "app.meuedital.timer.RUNNING";
    static final String ACTION_PAUSED = "app.meuedital.timer.PAUSED";
    static final String ACTION_PAUSE_TAPPED = "app.meuedital.timer.PAUSE_TAPPED";
    static final String EXTRA_SINCE = "since";
    static final String EXTRA_ACCUMULATED = "accumulatedMs";
    static final String EXTRA_SUBJECT = "subject";

    private static final String CHANNEL_ID = "cronometro";
    private static final int NOTIFICATION_ID = 3107;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;
        if (ACTION_PAUSE_TAPPED.equals(intent.getAction())) {
            StudyTimerPlugin.notifyPause();
            return START_NOT_STICKY;
        }
        boolean running = ACTION_RUNNING.equals(intent.getAction());
        long since = intent.getLongExtra(EXTRA_SINCE, 0);
        long accumulated = intent.getLongExtra(EXTRA_ACCUMULATED, 0);
        String subject = intent.getStringExtra(EXTRA_SUBJECT);
        Notification notification = build(running, since, accumulated, subject == null ? "Estudo" : subject);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        return START_NOT_STICKY;
    }

    private Notification build(boolean running, long since, long accumulated, String subject) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel =
                new NotificationChannel(CHANNEL_ID, "Cronômetro de estudo", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Tempo da sessão de estudo em andamento");
            channel.setSound(null, null);
            channel.enableVibration(false);
            manager.createNotificationChannel(channel);
        }

        Intent open = new Intent(Intent.ACTION_VIEW, Uri.parse("meuedital://estudar"));
        open.setPackage(getPackageName());
        open.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openApp =
            PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);
        builder
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentTitle(running ? "Estudo em andamento" : "Estudo pausado")
            .setContentText(subject)
            .setContentIntent(openApp)
            .setOngoing(true)
            .setOnlyAlertOnce(true);

        if (running) {
            Intent pause = new Intent(this, StudyTimerService.class).setAction(ACTION_PAUSE_TAPPED);
            PendingIntent pauseIntent =
                PendingIntent.getService(this, 1, pause, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            builder
                .setWhen(since - accumulated)
                .setUsesChronometer(true)
                .setShowWhen(true)
                .addAction(new Notification.Action.Builder(null, "Pausar", pauseIntent).build());
        } else {
            long seconds = accumulated / 1000;
            builder
                .setSubText(String.format("%02d:%02d:%02d", seconds / 3600, seconds / 60 % 60, seconds % 60))
                .setUsesChronometer(false)
                .setShowWhen(false);
        }
        return builder.build();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
