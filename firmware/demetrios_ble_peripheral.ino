/*
  DEMETRIOS — BLE Rover Peripheral (companion firmware for demetrios_app.html)
  ------------------------------------------------------------------------
  Board:   ESP32 (any variant with BLE) driving the rover's motors + sensors.
  Library: built-in ESP32 BLE (BLEDevice / BLEServer / BLECharacteristic).

  This advertises a Nordic UART Service, matching BLE_CONFIG in the app:
    Service UUID:  6e400001-b5a3-f393-e0a9-e50e24dcca9e
    Write Char:    6e400002-b5a3-f393-e0a9-e50e24dcca9e  (app -> rover commands)
    Notify Char:   6e400003-b5a3-f393-e0a9-e50e24dcca9e  (rover -> app telemetry)

  Commands received (newline-terminated), matching driveStart()/sendCommand()
  in the app:
    F        drive forward (repeats ~every 400ms while a direction is held)
    B        drive backward
    L        turn left
    R        turn right
    S        stop
    M:L,R    set motor speeds, e.g. "M:62,58" (0-100 each side)
    DIAG     run a self-check and reply with a short status line

  Telemetry sent out on the notify characteristic, newline-terminated:
    T:<tempC>,H:<humidity%>,M:<soilMoisture%>,N:<nitrogen_mg_kg>,B:<battery%>

  Swap the placeholder analogRead()/pin logic below for your actual sensor
  and motor driver wiring (e.g. an L298N/TB6612 for motors, a capacitive soil
  sensor, DHT22 for temp/humidity, etc). If your BLE module is an HM-10 clone
  instead of an onboard ESP32 BLE radio, use its FFE0/FFE1 UUIDs instead (the
  app already tries these as a fallback automatically).
*/

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID        "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHAR_WRITE_UUID      "6e400002-b5a3-f393-e0a9-e50e24dcca9e" // app -> rover
#define CHAR_NOTIFY_UUID     "6e400003-b5a3-f393-e0a9-e50e24dcca9e" // rover -> app

// ---- pin map: replace with your actual wiring ----
const int PIN_MOTOR_L_PWM = 25;
const int PIN_MOTOR_R_PWM = 26;
const int PIN_MOTOR_L_DIR = 27;
const int PIN_MOTOR_R_DIR = 14;
const int PIN_SOIL_MOISTURE = 34;   // analog
const int PIN_BATTERY_SENSE = 35;   // analog, via voltage divider

BLECharacteristic *notifyChar;
bool deviceConnected = false;
String rxLine = "";
int speedL = 60, speedR = 60;
unsigned long lastTelemetry = 0;
unsigned long lastCommandTime = 0;
const unsigned long DRIVE_TIMEOUT_MS = 700; // auto-stop if commands stop arriving

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *s) override { deviceConnected = true; }
  void onDisconnect(BLEServer *s) override {
    deviceConnected = false;
    stopMotors();
    s->getAdvertising()->start(); // resume advertising for reconnects
  }
};

class WriteCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) override {
    String chunk = c->getValue().c_str();
    for (size_t i = 0; i < chunk.length(); i++) {
      char ch = chunk[i];
      if (ch == '\n') { handleCommand(rxLine); rxLine = ""; }
      else rxLine += ch;
    }
  }
};

void setup() {
  Serial.begin(115200);
  pinMode(PIN_MOTOR_L_PWM, OUTPUT);
  pinMode(PIN_MOTOR_R_PWM, OUTPUT);
  pinMode(PIN_MOTOR_L_DIR, OUTPUT);
  pinMode(PIN_MOTOR_R_DIR, OUTPUT);

  BLEDevice::init("DEMETRIOS-BLE");
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  BLEService *service = server->createService(SERVICE_UUID);

  BLECharacteristic *writeChar = service->createCharacteristic(
      CHAR_WRITE_UUID, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  writeChar->setCallbacks(new WriteCallbacks());

  notifyChar = service->createCharacteristic(
      CHAR_NOTIFY_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  notifyChar->addDescriptor(new BLE2902());

  service->start();
  server->getAdvertising()->addServiceUUID(SERVICE_UUID);
  server->getAdvertising()->start();

  Serial.println("DEMETRIOS-BLE advertising...");
}

void loop() {
  // auto-stop safety: if no drive command has arrived recently, stop motors
  if (millis() - lastCommandTime > DRIVE_TIMEOUT_MS) stopMotors();

  if (deviceConnected && millis() - lastTelemetry > 2000) {
    sendTelemetry();
    lastTelemetry = millis();
  }
}

void handleCommand(String cmd) {
  cmd.trim();
  if (cmd.length() == 0) return;
  lastCommandTime = millis();

  if (cmd == "F") driveForward();
  else if (cmd == "B") driveBackward();
  else if (cmd == "L") turnLeft();
  else if (cmd == "R") turnRight();
  else if (cmd == "S") stopMotors();
  else if (cmd.startsWith("M:")) {
    int comma = cmd.indexOf(',');
    if (comma > 2) {
      speedL = cmd.substring(2, comma).toInt();
      speedR = cmd.substring(comma + 1).toInt();
    }
  } else if (cmd == "DIAG") {
    notifyLine("DIAG:motors=ok,sensors=ok,battery=ok");
  }
}

void driveForward()  { digitalWrite(PIN_MOTOR_L_DIR, HIGH); digitalWrite(PIN_MOTOR_R_DIR, HIGH); setSpeeds(speedL, speedR); }
void driveBackward() { digitalWrite(PIN_MOTOR_L_DIR, LOW);  digitalWrite(PIN_MOTOR_R_DIR, LOW);  setSpeeds(speedL, speedR); }
void turnLeft()       { digitalWrite(PIN_MOTOR_L_DIR, LOW);  digitalWrite(PIN_MOTOR_R_DIR, HIGH); setSpeeds(speedL, speedR); }
void turnRight()      { digitalWrite(PIN_MOTOR_L_DIR, HIGH); digitalWrite(PIN_MOTOR_R_DIR, LOW);  setSpeeds(speedL, speedR); }
void stopMotors()     { setSpeeds(0, 0); }

void setSpeeds(int l, int r) {
  analogWrite(PIN_MOTOR_L_PWM, map(constrain(l, 0, 100), 0, 100, 0, 255));
  analogWrite(PIN_MOTOR_R_PWM, map(constrain(r, 0, 100), 0, 100, 0, 255));
}

void sendTelemetry() {
  // Replace these reads with your real sensors (DHT22, capacitive soil probe,
  // NPK sensor, battery voltage divider, etc). Values below are placeholders.
  float tempC = 24.0 + random(0, 60) / 10.0;
  int humidity = 55 + random(0, 20);
  int moisture = map(analogRead(PIN_SOIL_MOISTURE), 0, 4095, 0, 100);
  int nitrogen = 25 + random(0, 20);
  int battery = map(analogRead(PIN_BATTERY_SENSE), 0, 4095, 0, 100);

  String line = "T:" + String(tempC, 1) +
                ",H:" + String(humidity) +
                ",M:" + String(moisture) +
                ",N:" + String(nitrogen) +
                ",B:" + String(battery);
  notifyLine(line);
}

void notifyLine(String line) {
  line += "\n";
  notifyChar->setValue((uint8_t *)line.c_str(), line.length());
  notifyChar->notify();
}
