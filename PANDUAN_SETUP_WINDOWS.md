# Panduan Setup Server Perpustakaan Lokal (Windows 11 On-Premise)

Dokumen ini adalah panduan lengkap implementasi **Server Lokal Perpustakaan Digital (ElibUMKO)** pada komputer **Windows 11** agar dapat dioperasikan dengan **1 kali klik** oleh pustakawan dan dapat diakses dengan lancar oleh mahasiswa dan dosen dari berbagai perangkat (**HP Android, iPhone, iPad, dan Laptop**) di jaringan perpustakaan.

---

## 🌐 1. Bagaimana Cara Pengguna Mengakses di Perangkat Lain?

Seluruh mahasiswa dan dosen **tidak perlu menginstal aplikasi apapun**. Mereka cukup menggunakan browser bawaan ponsel atau laptop (Google Chrome, Safari, Edge, Firefox).

### Syarat Koneksi:

Perangkat pengguna (HP/Laptop) dan Komputer Server Perpustakaan **harus terhubung ke jaringan lokal/Wi-Fi yang sama** (misalnya Wi-Fi: `WiFi-Perpustakaan-UMKO` atau Wi-Fi Kampus).

### Dua Cara Mengakses:

| Metode Akses                    | Contoh Alamat URL               | Keterangan                                                                                                                  |
| :------------------------------ | :------------------------------ | :-------------------------------------------------------------------------------------------------------------------------- |
| **A. Alamat IP Lokal**          | `http://192.168.1.50:5173`      | Metode standar yang didukung oleh 100% semua perangkat.                                                                     |
| **B. Nama Domain Lokal (mDNS)** | `http://perpus-umko.local:5173` | Sangat praktis! Otomatis didukung oleh iPhone, iPad, Mac, Windows 10/11, dan Android modern tanpa perlu mengingat angka IP. |

> [!TIP]
> **Best Practice Praktis: Pasang Cetakan Barcode / QR Code di Meja Perpustakaan!**
> Buat QR Code yang mengarah ke link `http://[IP-Komputer]:5173` (bisa digenerate gratis via situs QR Code Generator). Tempel stiker QR Code di meja baca atau pintu masuk perpustakaan bertuliskan: _"Scan untuk Membaca Ebook Digital UMKO"_. Mahasiswa tinggal scan lewat kamera HP, katalog langsung terbuka!

---

## 🛠️ 2. Best Practice Setup Komputer Server Windows 11 (Cukup Sekali di Awal)

> [!NOTE]
> **Jika Mengunduh Berkas ZIP dari GitHub:**
> Berkas `.env` dan `node_modules` memang tidak disertakan di GitHub (standar industri). Anda **tidak perlu repot membuat file .env manual ataupun mengetik `npm install`** di terminal!
> Skrip [`JALANKAN_ELIBUMKO.bat`](file:///home/ilhampangestu/Documents/Project/elibumko/JALANKAN_ELIBUMKO.bat) dan [`BUAT_SHORTCUT_DESKTOP.bat`](file:///home/ilhampangestu/Documents/Project/elibumko/BUAT_SHORTCUT_DESKTOP.bat) kami sudah diprogram untuk **mendeteksi dan otomatis membuatkan `.env` serta menjalankan `npm install` sendiri** saat pertama kali diklik.

Agar komputer Windows 11 berfungsi andal sebagai server lokal perpustakaan, lakukan 4 langkah praktis berikut:

### Langkah A: Buka Izin Port Firewall Windows 11 (1-Klik Otomatis)

Windows 11 secara ketat memblokir koneksi masuk dari perangkat luar jika port belum dibuka. Kami telah menyediakan skrip otomatis:

1. Buka folder `elibumko`.
2. Klik kanan berkas: 👉 **`BUAT_AKSES_JARINGAN_FIREWALL.bat`** lalu pilih **"Run as administrator"**.
3. Skrip akan otomatis mendaftarkan aturan Windows Defender Firewall untuk Port `5173`.

### Langkah B: Atur Profil Jaringan ke "Private Network" di Windows 11

Windows 11 mengunci firewall jika jaringan terdeteksi sebagai "Public".

1. Buka **Settings** Windows 11 (`Windows + I`).
2. Masuk ke menu **Network & internet** > pilih **Wi-Fi** atau **Ethernet** (sesuai koneksi yang dipakai).
3. Pada bagian _Network profile type_, ubah dari _Public network_ menjadi **Private network**.

### Langkah C: Kunci IP Address Komputer (Static IP / DHCP Reservation)

Jika IP berubah-ubah setiap hari, link atau QR Code yang dicetak kemarin tidak akan bisa dibuka lagi.

- **Opsi 1 (Disarankan oleh Admin Jaringan/Router Kampus):** Minta staf IT kampus mengatur _DHCP Reservation / Static Lease_ pada Router Wi-Fi perpustakaan agar Komputer Perpustakaan selalu mendapatkan IP tetap (misalnya: `192.168.1.50`).
- **Opsi 2 (Manual di Windows 11):**
  1. Buka **Settings** > **Network & internet** > **Wi-Fi** / **Ethernet**.
  2. Pada _IP assignment_, klik tombol **Edit**.
  3. Ubah dari _Automatic (DHCP)_ ke **Manual**, aktifkan **IPv4**, lalu masukkan IP tetap yang disepakati (misal: IP `192.168.1.50`, Subnet `255.255.255.0`, Gateway `192.168.1.1`).

### Langkah D: Matikan Fitur "Sleep" (Agar Server Tidak Tertidur)

Komputer perpustakaan tidak boleh masuk mode _Sleep/Hibernation_ saat jam buka perpustakaan.

1. Buka **Settings** > **System** > **Power & battery**.
2. Buka menu drop-down **Screen and sleep**:
   - _When plugged in, turn off my screen after_ : Boleh diatur misal **15 minutes** (menghemat listrik layar).
   - _When plugged in, put my device to sleep after_ : **PILIH "NEVER" (Jangan Pernah)**.
     _(Dengan setelan ini, layar monitor boleh mati, tapi sistem server tetap siaga melayani mahasiswa)._

---

## 🖱️ 3. Setup Operasional 1-Klik untuk Pustakawan

1. Di folder `elibumko`, klik ganda berkas:
   👉 **`BUAT_SHORTCUT_DESKTOP.bat`**
2. Di Desktop Windows pustakawan akan otomatis muncul:
   - 🌐 **Perpustakaan Digital UMKO** (Sekali klik langsung menyalakan server & membuka browser).
   - 🛡️ **Perpustakaan UMKO (Mode Senyap)** (Berjalan di latar belakang tanpa jendela hitam).
   - 🛑 **Matikan Perpustakaan UMKO** (Sekali klik mematikan server saat perpustakaan tutup).

---

## ⚡ 4. Opsi Otomatis Penuh: Server Menyala Sendiri Saat Komputer Dihidupkan

Agar penjaga perpustakaan tidak perlu mengklik apapun saat pagi hari:

1. Tekan tombol **`Windows + R`** di keyboard.
2. Ketik **`shell:startup`** lalu tekan **Enter**.
3. Salin (_copy-paste_) pintasan **"Perpustakaan UMKO (Mode Senyap)"** dari Desktop ke dalam jendela folder Startup tersebut.
4. **Selesai!** Setiap kali komputer perpustakaan dihidupkan, server langsung otomatis aktif di latar belakang dan siap melayani seluruh ruangan baca.
