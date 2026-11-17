#!/bin/bash
set -e

echo "Patching Android project for directory picker..."

# Create directory for the plugin
mkdir -p android/app/src/main/java/com/gregzero/gomark/directorypicker

# Create DirectoryPickerPlugin.java
cat > android/app/src/main/java/com/gregzero/gomark/directorypicker/DirectoryPickerPlugin.java << 'JAVA_EOF'
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
JAVA_EOF

# Add plugin to settings.gradle
echo "" >> android/settings.gradle
echo "// Directory Picker Plugin" >> android/settings.gradle
echo "include ':capacitor-directory-picker'" >> android/settings.gradle
echo "project(':capacitor-directory-picker').projectDir = new File(rootProject.projectDir, '../directory-picker/android')" >> android/settings.gradle

# Add dependency to app/build.gradle
if grep -q "implementation project(':capacitor-community-barcode-scanner')" android/app/build.gradle; then
    sed -i '/implementation project(\":capacitor-community-barcode-scanner\">/a\    implementation project(\":capacitor-directory-picker\")' android/app/build.gradle
else
    sed -i '/dependencies {/a\    implementation project(\":capacitor-directory-picker\")' android/app/build.gradle
fi

echo "Android project patched successfully!"
