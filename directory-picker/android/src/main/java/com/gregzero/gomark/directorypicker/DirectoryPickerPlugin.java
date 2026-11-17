package com.gregzero.gomark.directorypicker;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.documentfile.provider.DocumentFile;
import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.PluginCall;

@NativePlugin
public class DirectoryPickerPlugin extends com.getcapacitor.Plugin {

    @com.getcapacitor.PluginMethod
    public void selectDirectory(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            call.reject("Directory selection requires Android 5.0+ (API 21+)");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION |
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        );

        startActivityForResult(call, intent, "selectDirectoryResult");
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);

        PluginCall savedCall = getSavedCall("selectDirectoryResult");
        if (savedCall == null) return;

        if (resultCode == Activity.RESULT_OK && data != null) {
            Uri treeUri = data.getData();
            
            getContext().getContentResolver().takePersistableUriPermission(
                treeUri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );

            DocumentFile pickedDir = DocumentFile.fromTreeUri(getContext(), treeUri);
            String path = pickedDir.getUri().toString();
            String name = pickedDir.getName();

            JSObject ret = new JSObject();
            ret.put("path", path);
            ret.put("name", name);
            ret.put("uri", path);

            savedCall.success(ret);
        } else {
            savedCall.error("Directory selection cancelled");
        }
    }
}
