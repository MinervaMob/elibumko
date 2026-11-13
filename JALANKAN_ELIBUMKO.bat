@echo off
setlocal enabledelayedexpansion
title Server Perpustakaan Digital - ElibUMKO
chcp 65001 >nul

:: 1. Pindah ke direktori proyek ini berada
cd /d "%~dp0"

cls
echo =====================================================================
echo       PERPUSTAKAAN DIGITAL UNIVERSITAS MUHAMMADIYAH KOTABUMI
echo                         (ElibUMKO Server)
echo =====================================================================
echo.

:: 2. Tambahkan direktori default Node.js ke PATH jika belum terdaftar
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;!PATH!"
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "PATH=%ProgramFiles(x86)%\nodejs;!PATH!"
)
if exist "%LocalAppData%\Programs\node\node.exe" (
    set "PATH=%LocalAppData%\Programs\node;!PATH!"
)
if exist "%AppData%\npm" (
    set "PATH=%AppData%\npm;!PATH!"
)

:: 3. Verifikasi ketersediaan Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Program Node.js belum terdeteksi di komputer ini.
    echo.
    echo Silakan pastikan:
    echo 1. Anda telah mengunduh dan memasang Node.js LTS dari: https://nodejs.org
    echo 2. Jika baru saja selesai install Node.js, silakan restart / hidupkan ulang komputer sekali saja.
    echo.
    pause
    exit /b 1
)

:: 4. Cek berkas konfigurasi .env (Otomatis dibuat jika unduh dari ZIP GitHub)
if not exist ".env" (
    echo [INFO] Berkas konfigurasi .env belum ditemukan.
    echo [INFO] Membuat berkas .env otomatis dengan konfigurasi lokal...
    (
        echo # Drizzle Database
        echo DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
        echo.
        echo ORIGIN="http://localhost:5173"
        echo.
        echo # Better Auth Secret
        echo BETTER_AUTH_SECRET="c131691b-25ac-4ac9-9912-e5aeb25e36b8"
        echo.
        echo # Kredensial Pustakawan Default:
        echo # Email: pustakawan@umko.ac.id
        echo # Password: pustakawan123
    ) > ".env"
    echo [OK] Berkas .env berhasil dibuat secara otomatis!
    echo.
)

:: 5. Cek node_modules (Otomatis jalankan npm install jika pertama kali)
if not exist "node_modules\" (
    echo [INFO] Menyiapkan modul aplikasi pertama kali (npm install)...
    echo Mohon tunggu 1-2 menit hingga proses pengunduhan modul selesai...
    echo (Langkah ini hanya berjalan 1 kali saja saat awal unduh dari GitHub)
    echo.
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Gagal memasang modul aplikasi.
        echo Pastikan komputer terhubung ke internet untuk instalasi awal.
        pause
        exit /b 1
    )
    echo [OK] Modul aplikasi berhasil terpasang!
    echo.
)

:: 6. Deteksi Alamat IP Lokal untuk Akses Wi-Fi / LAN Kampus
set "LOCAL_IP=localhost"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" 2^>nul') do (
    set "IP_TEMP=%%a"
    set "IP_TEMP=!IP_TEMP: =!"
    if not "!IP_TEMP!"=="" (
        if not "!IP_TEMP!"=="127.0.0.1" (
            set "LOCAL_IP=!IP_TEMP!"
            goto :ip_found
        )
    )
)
:ip_found

echo [OK] Komputer Server Siap!
echo ---------------------------------------------------------------------
echo  ALAMAT AKSES SISTEM PERPUSTAKAAN:
echo.
echo    [1] Komputer Ini (Server Pustakawan)    : http://localhost:5173
echo    [2] Laptop/HP Mahasiswa via IP Wi-Fi    : http://!LOCAL_IP!:5173
echo    [3] Laptop/HP Mahasiswa via Nama Domain : http://%COMPUTERNAME%.local:5173
echo ---------------------------------------------------------------------
echo.
echo * Catatan untuk Penjaga Perpustakaan:
echo   - Jangan tutup jendela hitam ini selama perpustakaan beroperasi.
echo   - Mahasiswa/dosen yang terhubung ke Wi-Fi perpustakaan dapat langsung
echo     membuka alamat nomor [2] di browser mereka tanpa perlu login.
echo   - Jika ingin mematikan server, cukup tutup jendela ini atau jalankan
echo     berkas "HENTIKAN_ELIBUMKO.bat".
echo =====================================================================
echo.
echo Membuka peramban (browser) otomatis dalam 3 detik...

:: Buka browser secara otomatis di background
start "" /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

:: Jalankan server Vite dengan host 0.0.0.0 agar bisa diakses oleh komputer lain di Wi-Fi
call npm.cmd run dev -- --host 0.0.0.0 --port 5173
