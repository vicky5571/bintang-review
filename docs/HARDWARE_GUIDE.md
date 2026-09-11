# Panduan Hardware Fisik Bintang Review: Akrilik Meja & Chip NFC

Panduan lengkap pengadaan bahan, spesifikasi cetak, dan pemrograman chip NFC untuk stand meja akrilik **Bintang Review**.

---

## 1. Spesifikasi Bahan & Pengadaan

| Komponen | Spesifikasi Rekomendasi | Catatan Pengadaan (Indonesia) |
| :--- | :--- | :--- |
| **Chip NFC** | **NTAG213** atau **NTAG215** Round Coin Sticker (Diameter 25mm). | Tersedia di Tokopedia / Shopee dengan kata kunci *"NFC Sticker NTAG213"*. Harga berkisar **Rp 2.000 – Rp 3.500 / keping**. |
| **Varian Anti-Metal** | Varian dengan lapisan ferit isolator belakang. | **WAJIB** jika stand diletakkan di atas meja berbahan plat besi/logam atau tiang logam. Jika meja kayu atau plastik, gunakan stiker NFC standar. |
| **Bahan Akrilik** | **Cast Acrylic** bening/transparan ketebalan **2mm atau 3mm**. | Gunakan Cast Acrylic (bukan Extruded) agar potongan laser rapi, tepian mengkilap (*flame/laser polished*), dan tidak mudah retak. |
| **Bentuk / Form Factor** | • **Mini Table Tent** (Ukuran 8 × 12 cm atau 10 × 15 cm)<br>• **Stand Akrilik Tatakan Kayu (*Wooden Base*)** (Ukuran 10 × 14 cm). | Ukuran kompak agar tidak memakan ruang saji di meja kafe/restoran. |
| **Teknik Cetak** | **UV Flatbed Direct Print** (CMYK + Lapisan Tinta Putih /*White Undercoat*). | Tahan air tumpahan minuman, tahan gores, dan tahan semprotan alkohol/cairan pembersih sanitasi meja. **Jangan gunakan stiker kertas/vynil biasa**. |

---

## 2. Tata Letak Desain Akrilik (Print Layout)

```text
┌──────────────────────────────────────────────┐
│                                              │
│             [ LOGO KAFE / RESTO ]            │
│                                              │
│      "Suka dengan Menu & Suasana Kami?"      │
│                                              │
│                  ((( 🛜 )))                  │
│           [ DEKATKAN HP DI SINI ]            │
│            (NFC Sensor Terdeteksi)           │
│                                              │
│                   — ATAU —                   │
│                                              │
│               ┌──────────────┐               │
│               │   QR CODE    │               │
│               │  HIGH-RES /  │               │
│               │     SVG      │               │
│               └──────────────┘               │
│              [ SCAN KAMERA HP ]              │
│                                              │
│    Bantu kami berkembang & dapatkan kejutan! │
│                                              │
│          Powered by Bintang Review           │
└──────────────────────────────────────────────┘
```

### Posisi Pemasangan Stiker NFC:
1. Tempelkan stiker koin NFC di sisi **belakang** akrilik tepat sejajar dengan ikon `((( 🛜 )))`.
2. Gelombang radio frekuensi 13.56 MHz dapat menembus ketebalan akrilik 2mm–3mm tanpa hambatan.
3. Posisi pembacaan NFC di smartphone:
   - **iPhone (XR s/d iPhone 16)**: Sensor NFC berada di ujung bingkai atas (dekat kamera).
   - **Android**: Sebagian besar di bagian tengah belakang bodi atau di samping modul kamera.

---

## 3. Cara Mengunduh Aset QR Code Vektor (SVG)

1. Masuk ke halaman **Super Admin**:
   ```
   https://[domain-aplikasi-anda]/admin
   ```
2. Pada baris venue yang ingin dicetak (misalnya *Kopi Senja Nusantara*), klik tombol **`QR & NFC`**.
3. Klik tombol **`Download SVG`**:
   - File SVG adalah format vektor murni berbasis kurva matematika.
   - Vendor percetakan UV dapat memperbesar/mengatur ukuran cetak tanpa pecah atau blur (300+ DPI).
4. Tombol **`Download PNG`** (1024 × 1024 px) juga tersedia untuk preview digital atau materi media sosial.

---

## 4. Panduan Pemrograman Chip NFC via Smartphone

Pemrograman stiker NFC hanya membutuhkan waktu **5 detik per stand** menggunakan smartphone Anda:

### Langkah-langkah (Android & iOS):

1. **Unduh Aplikasi Gratis**:
   - **NFC Tools** by wakdev ([Google Play Store](https://play.google.com/store/apps/details?id=com.wakdev.wdnfc) / [Apple App Store](https://apps.apple.com/app/nfc-tools/id1252962749)).
2. **Buat Rekaman URL**:
   - Buka aplikasi **NFC Tools**.
   - Pilih tab menu **Write** &rarr; klik tombol **Add a record**.
   - Pilih opsi **Custom URL / URI**.
3. **Ketikkan URL Tap Bintang Review**:
   - Masukkan link tap venue yang bersangkutan, contoh:
     ```
     https://[domain-anda].vercel.app/r/kopi-senja
     ```
     *(Pastikan menggunakan awalan `https://`)*.
   - Klik **OK**.
4. **Tuliskan ke Chip**:
   - Klik tombol **Write / [ukuran bytes]**.
   - Tempelkan bagian atas belakang smartphone ke stiker koin NFC.
   - Aplikasi akan menampilkan tanda centang hijau **Write Complete!** disertai getar haptik/bunyi.
5. **Uji Coba**:
   - Kunci smartphone Anda, lalu dekatkan kembali ke stiker NFC.
   - Notifikasi pop-up Safari/Chrome akan otomatis muncul untuk membuka alur Bintang Review.

---

## 5. Keunggulan Sistem URL Dinamis Seumur Hidup (*Lifetime Hardware*)

- Link yang diprogram ke dalam NFC dan dicetak pada QR Code adalah URL tetap: `https://[domain]/r/[slug]`.
- Jika kafe/restoran di kemudian hari:
  1. Mengganti link Google Maps / Google Business Profile,
  2. Mengganti nomor WhatsApp komplain manajer kafe,
  3. Mengubah mode routing dari *Smart Funnel* ke *Direct Google*,
- Anda **TIDAK PERLU** mengganti akrilik fisik atau memprogram ulang NFC.
- Cukup ubah pengaturannya di portal **`/admin`**, dan seluruh akrilik meja otomatis mengarah ke link tujuan baru dalam hitungan detik!
