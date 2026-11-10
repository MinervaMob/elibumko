@echo off
setlocal enabledelayedexpansion
title Konfigurasi Firewall Windows 11 - ElibUMKO
chcp 65001 >nul
cls

echo =====================================================================
echo    PENGATURAN FIREWALL & AKSES JARINGAN LOKAL (WINDOWS 11)
echo                         ElibUMKO Server
echo =====================================================================
echo.

:: 1. Cek hak akses Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [PERHATIAN] Skrip ini membutuhkan izin Administrator untuk mengatur Firewall.
    echo.
    echo Meminta izin Administrator secara otomatis...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo [1/3] Menambahkan izin port 5173 pada Windows Defender Firewall...
:: Hapus rule lama jika ada, lalu tambahkan rule baru yang bersih
netsh advfirewall firewall delete rule name="ElibUMKO Perpustakaan Digital" >nul 2>&1
netsh advfirewall firewall add rule name="ElibUMKO Perpustakaan Digital" dir=in action=allow protocol=TCP localport=5173 profile=any description="Mengizinkan perangkat HP/Laptop mahasiswa mengakses ElibUMKO di jaringan perpustakaan" >nul 2>&1

if %errorlevel% equ 0 (
    echo       -> [SUKSES] Port 5173 berhasil dibuka di Windows Firewall!
) else (
    echo       -> [PERINGATAN] Gagal mengatur firewall otomatis. Pastikan antivirus pihak ketiga tidak memblokir.
)

echo.
echo [2/3] Memeriksa Nama Komputer untuk Akses mDNS (Nama Domain Lokal)...
set "HOST_NAME=%COMPUTERNAME%"
echo       -> Nama Komputer Server : %HOST_NAME%
echo       -> Alamat Akses mDNS    : http://%HOST_NAME%.local:5173
echo          (Dapat langsung diketik di browser iPhone/Android/Laptop)

echo.
echo [3/3] Memeriksa Alamat IP Lokal Saat Ini...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" 2^>nul') do (
    set "IP_TEMP=%%a"
    set "IP_TEMP=!IP_TEMP: =!"
    if not "!IP_TEMP!"=="" if not "!IP_TEMP!"=="127.0.0.1" (
        echo       -> Alamat IP Wi-Fi/LAN  : http://!IP_TEMP!:5173
    )
)

echo.
echo =====================================================================
echo [SELESAI] Komputer Windows 11 ini sekarang SIAP melayani perangkat lain!
echo.
echo TIPS PENTING UNTUK WINDOWS 11:
echo 1. Pastikan jenis jaringan diatur ke "Private Network":
echo    (Buka Settings ^> Network ^& internet ^> Wi-Fi/Ethernet ^> Pilih 'Private network')
echo.
echo 2. Matikan mode Sleep pada komputer server:
echo    (Buka Settings ^> System ^> Power ^& battery ^> 'Put device to sleep' ^> Pilih 'Never')
echo =====================================================================
echo.
echo Tekan tombol apa saja untuk keluar...
pause >nul
exit /b 0
