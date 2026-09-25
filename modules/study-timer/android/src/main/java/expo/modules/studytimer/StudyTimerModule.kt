package expo.modules.studytimer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class StudyTimerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("StudyTimer")

    AsyncFunction("showRunning") { startedAt: Double, elapsedMs: Double, subject: String ->
      showNotification(startedAt, elapsedMs, subject, true)
    }

    AsyncFunction("showPaused") { elapsedMs: Double, subject: String ->
      showNotification(0.0, elapsedMs, subject, false)
    }

    AsyncFunction("clear") {
      manager()?.cancel(NOTIFICATION_ID)
    }
  }

  private fun manager(): NotificationManager? =
    appContext.reactContext?.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

  private fun showNotification(startedAt: Double, elapsedMs: Double, subject: String, running: Boolean) {
    val context = appContext.reactContext ?: return
    val notificationManager = manager() ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      notificationManager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Cronômetro de estudo", NotificationManager.IMPORTANCE_LOW).apply {
          description = "Tempo da sessão de estudo em andamento"
          setSound(null, null)
          enableVibration(false)
        }
      )
    }

    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("meuedital://estudar")).apply {
      setPackage(context.packageName)
      flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
    val pendingIntent = PendingIntent.getActivity(
      context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID)
    } else {
      Notification.Builder(context).setPriority(Notification.PRIORITY_LOW)
    }

    builder
      .setSmallIcon(android.R.drawable.ic_media_play)
      .setContentTitle(if (running) "Estudo em andamento" else "Estudo pausado")
      .setContentText(subject)
      .setContentIntent(pendingIntent)
      .setAutoCancel(false)
      .setOngoing(running)
      .setOnlyAlertOnce(true)
      .setShowWhen(true)

    if (running) {
      builder.setWhen((startedAt - elapsedMs).toLong()).setUsesChronometer(true)
    } else {
      val seconds = (elapsedMs / 1000).toLong()
      val time = "%02d:%02d:%02d".format(seconds / 3600, seconds / 60 % 60, seconds % 60)
      builder.setSubText(time).setUsesChronometer(false).setShowWhen(false)
    }

    notificationManager.notify(NOTIFICATION_ID, builder.build())
  }

  companion object {
    private const val CHANNEL_ID = "study_timer"
    private const val NOTIFICATION_ID = 3107
  }
}
