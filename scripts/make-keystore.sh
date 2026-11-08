#!/usr/bin/env bash
# Creates the upload keystore + android/keystore.properties. Run ONCE, on your own machine.
# BACK UP dar-upload.jks and the passwords — losing them blocks future Play updates.
set -e
cd "$(dirname "$0")/../android"
read -rsp "Keystore password: " PW; echo
keytool -genkeypair -v -keystore dar-upload.jks -alias dar-upload -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$PW" -keypass "$PW" -dname "CN=Dar Al-Uloom, O=Dar Al-Uloom, C=SA"
cat > keystore.properties <<P
storeFile=dar-upload.jks
storePassword=$PW
keyAlias=dar-upload
keyPassword=$PW
P
echo "Done. Now run: npm run android:aab"
