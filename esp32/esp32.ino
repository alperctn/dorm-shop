#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Wi-Fi Bilgileri
#define WIFI_SSID "WIFI_ADINIZ"
#define WIFI_PASSWORD "WIFI_SIFRENIZ"

// Firebase Bilgileri
#define API_KEY "FIREBASE_API_KEY_BURAYA"
#define DATABASE_URL "FIREBASE_DATABASE_URL_BURAYA"

// Kullanıcı Giriş Bilgileri (Anonim giriş yapılabilir ama email/pass önerilir)
#define USER_EMAIL "esp32@yurtshop.com"
#define USER_PASSWORD "esp32password"

// Pin Tanımları
#define ROLE_PIN 2   // Tabelayı kontrol eden Röle veya MOSFET (D2)
#define ZIL_PIN 4    // Zil/Buzzer (D4)
#define BUTON_PIN 5  // Stok güncelleme butonu (D5)

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool signupOK = false;

void setup() {
  Serial.begin(115200);

  pinMode(ROLE_PIN, OUTPUT);
  pinMode(ZIL_PIN, OUTPUT);
  pinMode(BUTON_PIN, INPUT_PULLUP);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("WiFi Baglaniyor");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Baglandi IP: ");
  Serial.println(WiFi.localIP());

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Anonim giriş veya Email/Pass
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase Baglandi");
    signupOK = true;
  } else {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (Firebase.ready() && signupOK) {
    // 1. Tabela Durumunu Oku (Web'den kontrol)
    if (Firebase.RTDB.getBool(&fbdo, "/settings/signage_open")) {
      bool isOpen = fbdo.boolData();
      digitalWrite(ROLE_PIN, isOpen ? HIGH : LOW);
    }

    // 2. Zil Durumunu Oku (Web'den "Geldim" dendiğinde)
    if (Firebase.RTDB.getBool(&fbdo, "/settings/doorbell_ring")) {
      bool ring = fbdo.boolData();
      if (ring) {
        digitalWrite(ZIL_PIN, HIGH);
        delay(1000); // 1 saniye çal
        digitalWrite(ZIL_PIN, LOW);
        // Zili susturduktan sonra DB'de false yap
        Firebase.RTDB.setBool(&fbdo, "/settings/doorbell_ring", false);
      }
    }
  }
  
  // Örnek: Butona basınca stok azaltma
  if (digitalRead(BUTON_PIN) == LOW) {
    // Debounce eklenmeli
    Serial.println("Butona basildi!");
    // Firebase.RTDB.setInt(&fbdo, "/products/cola/stock", yeniStok);
    delay(500); 
  }
  
  delay(1000); // Çok sık sorgu atmamak için bekleme
}
