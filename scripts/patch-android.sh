#!/bin/bash
set -e

echo "Patching Android project for directory picker..."

# Create directory for the plugin in the main android project
mkdir -p android/app/src/main/java/com/gregzero/gomark/directorypicker

# Copy the Java file from directory-picker to android project
cp directory-picker/android/src/main/java/com/gregzero/gomark/directorypicker/DirectoryPickerPlugin.java \
   android/app/src/main/java/com/gregzero/gomark/directorypicker/DirectoryPickerPlugin.java

# No need to modify settings.gradle or build.gradle since the Java file is now part of the app
# The plugin will be automatically compiled as part of the app

echo "Android project patched successfully!"
