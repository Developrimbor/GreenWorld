📦 Green World

<img src='https://github.com/Developrimbor/GreenWorld/blob/main/B%C3%A9hance.png'>

Report, Inform and Clean Up!
Green World, çevresel kirliliğe dikkat çekmek, gönüllü çöp toplama sürecini desteklemek ve toplumsal çevre bilincini artırmak amacıyla geliştirilmiş konum tabanlı bir mobil uygulamadır.

🧭 Uygulama Özeti

Green World, kullanıcıların çevresinde gördükleri çöp yığınlarını harita üzerinde işaretleyebildiği, sosyal gönderiler paylaşabildiği ve temizlik yaptıkça puan kazanabildiği bir sosyal temizlik platformudur. Uygulama React Native ile geliştirilmiş olup, Firebase altyapısıyla desteklenmektedir.

🧩 Uygulama Özellikleri

- Harita Tabanlı Atık Bildirimi (Report Trash)
- Çevredeki bildirilen çöp noktalarını görüntüleme (View Trash)
- Çöp temizleme bildirme ve temizlik puanı kazanma
- Sosyal gönderi (blog) paylaşımı
- Puanlama ve sıralama sistemi
- Gerçek zamanlı bildirim sistemi
- Kullanıcı profili ve katkı geçmişi

🛠️ Kullanılan Teknolojiler

- React Native + Expo Go (mobil uygulama geliştirme)
- Firebase Authentication (kullanıcı kimlik doğrulama)
- Firebase Firestore (veri saklama)
- Firebase Cloud Messaging (bildirimler)
- Google Maps API (harita ve konum hizmetleri)
- Figma (UI tasarımı ve bileşen sistemi)

🎨 Tasarım Sistemi

Uygulamanın arayüzü, kullanıcı deneyimi odaklı olarak Figma üzerinde aşağıdaki yapıda planlanmıştır:

- Renk Paleti: #3B7C57, #E6F4EA, #F1F1F1, #D92525 vb. çevreci renkler
- Yazı Tipi: Poppins (Başlık ve içerik için sade bir yazı tipi)
- UI Bileşenleri: Arama çubuğu, harita butonları, gönderi kartları, etiket rozetleri
- Sayfa Düzenleri: Home Page, Blog Page, Map & Report, Map & Cleaning, Ranking, Notification, Profile

📱 Uygulama Ekranları

Uygulama şu ekranları içerir:

- Home Page: Bilgilendirici gönderiler (postlar), arama ve yeni gönderi butonu
- Blog Page: Gönderi detayları, görsel, etiketler ve yorum alanı
- Map & Report Page: Harita üzerinden atık bildirimi
- Trash Cleaning Page: Temizlenen atıklar ve kullanıcıya puan geri bildirimi
- Trash Info Page: Bildirilen çöp noktalarının içeriği
- Ranking & Profile Page: Katkı sıralamaları, kullanıcı bilgileri ve geçmiş

📁 Proje Yapısı

GreenWorld/
├── assets/ (ikonlar ve görseller)
├── components/ (tekrar kullanılabilir bileşenler)
├── screens/ (uygulama ekranları)
├── services/ (firebase servisleri, bildirim vs.)
├── navigation/ (tab navigasyon)
├── styles/
└── App.js
