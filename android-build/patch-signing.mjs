// CI-only: adds release signing (android/keystore.properties) to the generated Capacitor project.
import { readFileSync, writeFileSync } from "node:fs";
const p = "android/app/build.gradle";
let s = readFileSync(p, "utf8");
s = s.replace("apply plugin: 'com.android.application'\n", `apply plugin: 'com.android.application'

def keystoreProps = new Properties()
def keystoreFile = rootProject.file('keystore.properties')
if (keystoreFile.exists()) { keystoreFile.withInputStream { keystoreProps.load(it) } }
`);
s = s.replace("    buildTypes {\n        release {", `    signingConfigs {
        release {
            if (keystoreFile.exists()) {
                storeFile rootProject.file(keystoreProps['storeFile'])
                storePassword keystoreProps['storePassword']
                keyAlias keystoreProps['keyAlias']
                keyPassword keystoreProps['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            if (keystoreFile.exists()) { signingConfig signingConfigs.release }`);
if (!s.includes("signingConfigs.release")) throw new Error("patch failed");
writeFileSync(p, s);
console.log("signing patched");
