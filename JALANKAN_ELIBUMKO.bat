@echo off
setlocal enabledelayedexpansion
title Server Perpustakaan Digital - ElibUMKO
chcp 65001 >nul
cls

echo =====================================================================
echo       PERPUSTAKAAN DIGITAL UNIVERSITAS MUHAMMADIYAH KOTABUMI
echo                         (ElibUMKO Server)
echo =====================================================================
echo.

:: 1. Cek instalasi Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang di komputer ini!
    echo Silakan unduh dan pasang Node.js LTS terlebih dahulu dari:
    echo https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 2. Masuk ke direktori aplikasi
cd /d "%~dp0"

:: 3. Cek node_modules
if not exist "node_modules\" (
    echo [INFO] Menyiapkan modul aplikasi pertama kali...
    echo Mohon tunggu sebentar...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Gagal memasang modul aplikasi. Periksa koneksi internet Anda.
        pause
        exit /b 1
    )
)

:: 4. Deteksi Alamat IP Lokal untuk Akses Wi-Fi / LAN Kampus
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
call npm run dev -- --host 0.0.0.0 --port 5173
