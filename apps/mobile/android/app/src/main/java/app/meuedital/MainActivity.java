package app.meuedital;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins próprios do app precisam ser registrados antes do onCreate.
        registerPlugin(StudyTimerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
