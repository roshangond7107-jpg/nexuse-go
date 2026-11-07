# Windows Android build (local, no EAS)

**Status: NOT YET VERIFIED.** No APK has been built from this repo by the authors of these instructions. The sandbox that prepared them had no network, no Android SDK and no Windows. Everything below is derived from inspecting `apps/mobile/android`. Treat the first run on your machine as the verification, and send back the full output of any failure.

## What was inspected (facts from the repo)
- Gradle wrapper 8.10.2 (`gradle-wrapper.properties`) -> needs **JDK 17-23**; JDK 17 or 21 recommended (Android Studio's bundled JBR works).
- `compileSdk 35`, `targetSdk 34`, `minSdk 24`, Build-Tools `35.0.0`, NDK `26.1.10909125`, Kotlin 1.9.25.
- Package/namespace/applicationId: `com.nexusego.app`. New Architecture on, Hermes on.
- Gradle files call `node` on PATH (autolinking, entry file, hermesc), so Node must be on PATH in the same shell.
- Debug and release both sign with the committed `app/debug.keystore` (Android's public debug key). **Never publish a build signed this way.**

## One-time setup
1. Node >= 20.11 and `corepack enable` (pnpm 9.15.0 is pinned in `package.json`).
2. Android Studio -> SDK Manager -> install: Android SDK Platform **35**, SDK Build-Tools **35.0.0**, NDK (Side by side) **26.1.10909125**, CMake **3.22.1**, Platform-Tools.
3. Environment variables (System Properties -> Environment Variables), then open a **new** terminal:
   - `ANDROID_HOME` = `C:\Users\<you>\AppData\Local\Android\Sdk`
   - `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr` (or a JDK 17/21)
   - Add `%ANDROID_HOME%\platform-tools` to `Path`.
4. Keep the repo at a short path (e.g. `C:\dev\nexuse-go`) and enable Windows long paths; native C++ builds can hit the 260-char limit.
5. Do **not** commit `apps/mobile/android/local.properties`; it is gitignored.

## Install and check
```bat
cd C:\dev\nexuse-go
pnpm install
pnpm android:doctor
```
`android:doctor` is read-only and lists missing tools. A pass does not prove the build works.

If `pnpm install --frozen-lockfile` complains the lockfile is out of date, that is expected once after this change (see CHANGELOG): run plain `pnpm install` and commit `pnpm-lock.yaml`.

## Build
Debug APK (needs Metro at runtime; see below):
```bat
cd apps\mobile\android
gradlew.bat assembleDebug --stacktrace
```
or from the repo root: `pnpm --filter @nexuse/mobile android:apk:debug`.

Standalone APK with the JS bundle embedded (for testing on a phone without a dev server; **debug-signed, not for distribution**):
```bat
cd apps\mobile\android
gradlew.bat assembleRelease --stacktrace
```
or `pnpm --filter @nexuse/mobile android:apk:release-local`.

First build downloads Gradle 8.10.2 and many dependencies and can take 10-30+ minutes.

## Output locations
- `apps\mobile\android\app\build\outputs\apk\debug\app-debug.apk`
- `apps\mobile\android\app\build\outputs\apk\release\app-release.apk`

## Verify the APK exists and is what you expect
```bat
dir apps\mobile\android\app\build\outputs\apk\debug\app-debug.apk
"%ANDROID_HOME%\build-tools\35.0.0\aapt2.exe" dump badging apps\mobile\android\app\build\outputs\apk\debug\app-debug.apk | findstr /C:"package:" /C:"sdkVersion"
```
Expect `name='com.nexusego.app'`. Install: `adb install -r <path-to-apk>`.

## Running the debug APK
The debug variant does not contain the JS bundle. Start Metro and forward the port:
```bat
pnpm --filter @nexuse/mobile start
adb reverse tcp:8081 tcp:8081
```
Without Metro the app shows a red error screen; that is expected, not a bug.

## Troubleshooting
- `Unsupported class file major version` / `JAVA_HOME` errors: use JDK 17 or 21.
- `SDK location not found`: set `ANDROID_HOME` or create `apps\mobile\android\local.properties` with `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk`.
- `'node' is not recognized` inside Gradle: start the terminal from a shell where `node -v` works.
- `NDK ... not found` / CMake errors: install the exact NDK and CMake versions above.
- Path-too-long errors: move the repo closer to the drive root; enable long paths.
- Stale state: `gradlew.bat clean`, then rebuild. Do **not** re-run `expo prebuild --clean` unless you intend to regenerate and re-review the native project.
- Gradle download blocked: check proxy/antivirus; the wrapper fetches from services.gradle.org.
