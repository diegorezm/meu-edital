package app.meuedital;

import android.content.Intent;
import android.os.Build;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Cronômetro de estudo no Android: mantém um serviço em primeiro plano com a
 * notificação do tempo correndo (o sistema não mata o app enquanto estuda) e
 * um botão "Pausar", que avisa o app pelo evento "pause".
 * Portado do módulo study-timer do projeto antigo.
 */
@CapacitorPlugin(name = "StudyTimer")
public class StudyTimerPlugin extends Plugin {

    private static StudyTimerPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    @Override
    protected void handleOnDestroy() {
        if (instance == this) instance = null;
        super.handleOnDestroy();
    }

    /** Chamado pelo serviço quando o estudante toca em "Pausar". */
    static void notifyPause() {
        if (instance != null) instance.notifyListeners("pause", new JSObject(), true);
    }

    @PluginMethod
    public void showRunning(PluginCall call) {
        Intent intent = serviceIntent(StudyTimerService.ACTION_RUNNING, call);
        intent.putExtra(StudyTimerService.EXTRA_SINCE, (long) call.getDouble("since", 0.0).doubleValue());
        startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void showPaused(PluginCall call) {
        startService(serviceIntent(StudyTimerService.ACTION_PAUSED, call));
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) {
        getContext().stopService(new Intent(getContext(), StudyTimerService.class));
        call.resolve();
    }

    private Intent serviceIntent(String action, PluginCall call) {
        Intent intent = new Intent(getContext(), StudyTimerService.class);
        intent.setAction(action);
        intent.putExtra(StudyTimerService.EXTRA_ACCUMULATED, (long) call.getDouble("accumulatedMs", 0.0).doubleValue());
        intent.putExtra(StudyTimerService.EXTRA_SUBJECT, call.getString("subject", "Estudo"));
        return intent;
    }

    private void startService(Intent intent) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) getContext().startForegroundService(intent);
            else getContext().startService(intent);
        } catch (RuntimeException error) {
            // Android 12+ pode recusar FGS quando o app não está em primeiro plano.
            Log.w("StudyTimerPlugin", "Não foi possível iniciar o serviço do cronômetro", error);
        }
    }
}
