@echo off
setlocal enabledelayedexpansion
title Matikan Server ElibUMKO
chcp 65001 >nul
cls

echo =====================================================================
echo           MENGHENTIKAN SERVER PERPUSTAKAAN DIGITAL ELIBUMKO
echo =====================================================================
echo.

set "FOUND=0"

:: 1. Cari PID proses yang mendengarkan di port 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r ":5173.*LISTENING" 2^>nul') do (
    set "PID=%%a"
    if not "!PID!"=="" if not "!PID!"=="0" (
        echo [INFO] Menemukan server ElibUMKO berjalan pada PID: !PID!
        taskkill /f /pid !PID! >nul 2^>nul
        set "FOUND=1"
    )
)

:: 2. Cek apakah ada proses vite/node yang terkait
if "!FOUND!"=="1" (
    echo [OK] Server Perpustakaan Digital ElibUMKO berhasil dihentikan dengan aman.
) else (
    echo [INFO] Server ElibUMKO sedang tidak aktif atau sudah tertutup.
)

echo.
echo Jendela ini akan tertutup otomatis dalam 3 detik...
timeout /t 3 /nobreak >nul
exit /b 0
