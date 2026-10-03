# IoT Integration Scripts

## 1. Arduino Mega + Sensors (WiFi/ESP8266)
This script simulates the sensor data being sent from the Arduino Mega.

```cpp
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://your-app-url.demetrios.com/api/sensors";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Simulating sensor readings
    float moisture = analogRead(A0) / 10.24; // 0-100%
    float temp = 25.0 + random(-2, 2);
    float hum = 60.0 + random(-5, 5);
    float ph = 6.5 + (random(0, 10) / 10.0);
    float dist = random(10, 200);

    String payload = "{\"moisture\":" + String(moisture) + 
                     ",\"temperature\":" + String(temp) + 
                     ",\"humidity\":" + String(hum) + 
                     ",\"ph\":" + String(ph) + 
                     ",\"ultrasonic\":" + String(dist) + 
                     ",\"latitude\":34.0522,\"longitude\":-118.2437}";

    int httpResponseCode = http.POST(payload);
    Serial.println(httpResponseCode);
    http.end();
  }
  delay(5000); // Send data every 5 seconds
}
```

## 2. ESP32-CAM Snapshot Upload
This script captures an image and sends it to the analysis endpoint.

```cpp
#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include "Base64.h"

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://your-app-url.demetrios.com/api/analysis";

void captureAndUpload() {
  camera_fb_t * fb = esp_camera_fb_get();
  if(!fb) return;

  String base64Image = base64::encode(fb->buf, fb->len);
  
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  String json = "{\"base64\":\"data:image/jpeg;base64," + base64Image + "\", \"sensorSnapshot\": {}}";
  
  int httpResponseCode = http.POST(json);
  esp_camera_fb_return(fb);
  http.end();
}
```

## 3. Node.js Local Simulator
Run this on your computer to test the dashboard without hardware.

```javascript
const fetch = require('node-fetch');

const API_URL = 'https://your-app-url.demetrios.com/api/sensors';

async function simulate() {
  const data = {
    moisture: Math.random() * 100,
    temperature: 20 + Math.random() * 15,
    humidity: 40 + Math.random() * 40,
    ph: 5.5 + Math.random() * 2,
    ultrasonic: Math.random() * 200,
    latitude: 34.0522 + (Math.random() - 0.5) * 0.01,
    longitude: -118.2437 + (Math.random() - 0.5) * 0.01
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    console.log('Sent data:', data, 'Status:', res.status);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

setInterval(simulate, 5000);
```
