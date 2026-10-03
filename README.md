# Demetrios – Smart Field Rover

One repository, three parts:

| Folder | What it is |
|---|---|
| `docs/` | **Web app / PWA.** Single-page app with Bluetooth LE rover control, live sensor readings, camera tab and demo mode. Served by GitHub Pages and installable on Android from Chrome. |
| `android-app/` | **Android app.** React + Vite UI packaged with Capacitor into an APK (package `com.demetrios.fieldrover`). Currently runs on simulated telemetry. |
| `firmware/` | **ESP32 sketch** (`demetrios_ble_peripheral.ino`) – the BLE side of the rover that the web app talks to. |

## 1. Web app on GitHub Pages

1. Push this repo to GitHub (repo name: `Demetrios`).
2. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, Folder = **`/docs`**, then Save.
3. After a minute the app is live at `https://<your-username>.github.io/Demetrios/`.
4. On Android, open that link in **Chrome → ⋮ → Install app**.

**Real rover control (Bluetooth)** works in Chrome on Android/desktop (Web Bluetooth needs HTTPS, which GitHub Pages provides). Without a rover the app starts in Demo Mode with simulated data. Safari/iOS does not support Web Bluetooth.

**Camera tab:** the ESP32-CAM stream is plain `http://` on a local network. Browsers block `http://` content inside an `https://` page, so on the Pages site the live camera view may not load. Open the app from a local copy, or serve the camera over HTTPS, if you need it.

Run locally: `cd docs && python -m http.server 8080` then open http://localhost:8080.

## 2. Android app (APK)

The native project is already generated in `android-app/android/`.

**Easiest – let GitHub build it:** GitHub → **Actions → Build Android APK → Run workflow**. When it finishes, download `demetrios-debug-apk` from the run page and install `app-debug.apk` on your phone (allow "install unknown apps").

**Or build locally** (needs Node 20+, Java 21, Android Studio):

```bash
cd android-app
npm install
npm run cap:sync     # builds the web UI and copies it into the Android project
npm run cap:open     # opens Android Studio -> press Run
```

Command-line APK: `cd android-app/android && ./gradlew assembleDebug` (Windows: `gradlew.bat assembleDebug`). Output: `android-app/android/app/build/outputs/apk/debug/app-debug.apk`.

## 3. Rover firmware

Open `firmware/demetrios_ble_peripheral.ino` in the Arduino IDE, select your ESP32 board and upload. It advertises a Nordic UART service, which is what `docs/index.html` expects (settings are in the `BLE_CONFIG` block of the script).

## Known limits (honest notes)

- The web app and the Android app are two separate UIs. Only the web app in `docs/` talks to real hardware over BLE. Android WebView has no Web Bluetooth, so the APK UI is a simulated demo until a native BLE plugin is added.
- The debug APK is unsigned for release; use Android Studio *Build → Generate Signed Bundle / APK* for Play Store builds.
