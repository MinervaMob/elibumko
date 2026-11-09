# Panduan Setup 1-Klik Komputer Perpustakaan (Windows On-Premise)

Dokumen ini berisi panduan praktis agar penjaga perpustakaan (pustakawan) yang non-teknis dapat mengoperasikan server **ElibUMKO** hanya dengan **1 kali klik** (atau bahkan otomatis menyala saat komputer dihidupkan).

---

## 🚀 Langkah 1: Persiapan Awal (Cukup Dilakukan 1 Kali Saja)

1. **Pasang Node.js LTS**:
   - Unduh installer resmi Node.js LTS dari [https://nodejs.org](https://nodejs.org).
   - Jalankan installer `.msi`, klik **Next**, dan pastikan opsi **"Add to PATH"** dicentang (aktif secara default).
2. **Salin Folder Proyek ke Komputer Perpustakaan**:
   - Letakkan folder proyek `elibumko` di lokasi yang aman, misalnya:
     `C:\ElibUMKO` atau `D:\Aplikasi_Perpustakaan\elibumko`.

---

## 🖱️ Langkah 2: Buat Pintasan Desktop (1-Klik Setup)

1. Buka folder `elibumko` melalui File Explorer Windows.
2. Klik ganda berkas:
   👉 **`BUAT_SHORTCUT_DESKTOP.bat`**
3. Di layar **Desktop Windows** pustakawan akan otomatis terbuat 3 pintasan:
   - 🌐 **Perpustakaan Digital UMKO** (Mode Normal dengan Info IP & Buka Browser Otomatis)
   - 🛡️ **Perpustakaan UMKO (Mode Senyap)** (Mode Latar Belakang tanpa jendela hitam)
   - 🛑 **Matikan Perpustakaan UMKO** (Tombol 1-klik untuk menghentikan server)

---

## 📖 Cara Operasional Harian Penjaga Perpustakaan

### Saat Perpustakaan Buka (Pagi Hari):

1. Pustakawan cukup **klik ganda ikon "Perpustakaan Digital UMKO"** di Desktop.
2. Server otomatis berjalan dan dalam 3 detik **Google Chrome / Microsoft Edge akan otomatis terbuka** menampilkan halaman perpustakaan.
3. Jendela konsol akan menampilkan informasi alamat akses jaringan, contohnya:
   ```text
   ALAMAT AKSES SISTEM PERPUSTAKAAN:
   [1] Komputer Ini (Server Pustakawan)  : http://localhost:5173
   [2] Laptop/HP Mahasiswa & Dosen (Wi-Fi): http://192.168.1.15:5173
   ```
4. Pustakawan dapat mencetak/menuliskan alamat nomor **[2]** pada papan pengumuman ruang baca atau meja pelayanan agar sivitas akademika dapat langsung membaca ebook dari perangkat masing-masing.

### Saat Perpustakaan Tutup (Sore Hari):

- Cukup klik ganda ikon **"Matikan Perpustakaan UMKO"** di Desktop, atau tutup jendela server.

---

## ⚡ Opsi Tercanggih: Otomatis Menyala Saat Komputer Dinyalakan (Auto-Start)

Agar pustakawan **tidak perlu mengklik apa pun sama sekali**:

1. Tekan tombol **`Windows + R`** pada keyboard.
2. Ketik **`shell:startup`** lalu tekan **Enter**. (Folder Startup Windows akan terbuka).
3. Salin (_copy-paste_) pintasan **"Perpustakaan UMKO (Mode Senyap)"** dari Desktop ke dalam folder Startup tersebut.
4. **Selesai!** Setiap kali komputer perpustakaan dinyalakan di pagi hari, server ElibUMKO akan langsung aktif di latar belakang dan browser langsung terbuka melayani perpustakaan.

---

## 🔒 Catatan Keamanan Jaringan & Firewall Windows

Saat pertama kali skrip dijalankan, Windows Defender Firewall mungkin menampilkan dialog:

> _"Windows Defender Firewall has blocked some features of this app"_

- Berikan tanda centang pada:
  - ☑️ **Private networks, such as my home or work network**
- Klik tombol **"Allow access"**.
  Ini penting agar mahasiswa dan dosen yang terhubung ke Wi-Fi perpustakaan diizinkan mengakses koleksi ebook dari laptop/smartphone mereka.
