#!/bin/bash
set -e

echo "Patching Android project for directory picker..."

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
