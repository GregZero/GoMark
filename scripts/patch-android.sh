#!/bin/bash
set -e

echo "Patching Android project for directory picker..."

# Remove any previous references to directory-picker plugin from settings.gradle
if [ -f android/settings.gradle ]; then
    # Remove lines that reference capacitor-directory-picker
    sed -i '/capacitor-directory-picker/d' android/settings.gradle
fi

# Remove any previous references from app/build.gradle
if [ -f android/app/build.gradle ]; then
    sed -i '/implementation project.*capacitor-directory-picker/d' android/app/build.gradle
fi

# Create directory for the plugin in the main android project
mkdir -p android/app/src/main/java/com/gregzero/gomark/directorypicker

# Copy the Java file from directory-picker to android project
cp directory-picker/android/src/main/java/com/gregzero/gomark/directorypicker/DirectoryPickerPlugin.java \
   android/app/src/main/java/com/gregzero/gomark/directorypicker/DirectoryPickerPlugin.java

echo "Android project patched successfully!"
