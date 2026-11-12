@echo off
setlocal
title Buat Shortcut Desktop ElibUMKO
chcp 65001 >nul
cls

echo =====================================================================
echo       MEMBUAT PINTASAN (SHORTCUT) DESKTOP UNTUK PUSTAKAWAN
echo =====================================================================
echo.

cd /d "%~dp0"
set "PROJECT_DIR=%~dp0"
:: Hilangkan trailing slash
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

:: Cek dan buatkan .env otomatis jika unduh dari ZIP GitHub
if not exist "%PROJECT_DIR%\.env" (
    echo [INFO] Berkas konfigurasi .env belum ada, membuatkan otomatis...
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
    ) > "%PROJECT_DIR%\.env"
    echo [OK] Berkas .env siap.
    echo.
)

echo Membuat pintasan di Desktop Windows...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$desktop = [Environment]::GetFolderPath('Desktop'); " ^
    "$s1 = $ws.CreateShortcut(\"$desktop\Perpustakaan Digital UMKO.lnk\"); " ^
    "$s1.TargetPath = '%PROJECT_DIR%\JALANKAN_ELIBUMKO.bat'; " ^
    "$s1.WorkingDirectory = '%PROJECT_DIR%'; " ^
    "$s1.Description = 'Jalankan Server Perpustakaan Digital ElibUMKO'; " ^
    "$s1.Save(); " ^
    "$s2 = $ws.CreateShortcut(\"$desktop\Perpustakaan UMKO (Mode Senyap).lnk\"); " ^
    "$s2.TargetPath = 'wscript.exe'; " ^
    "$s2.Arguments = '\"%PROJECT_DIR%\JALANKAN_BACKGROUND.vbs\"'; " ^
    "$s2.WorkingDirectory = '%PROJECT_DIR%'; " ^
    "$s2.Description = 'Jalankan Server ElibUMKO di Latar Belakang (Tanpa Jendela Hitam)'; " ^
    "$s2.Save(); " ^
    "$s3 = $ws.CreateShortcut(\"$desktop\Matikan Perpustakaan UMKO.lnk\"); " ^
    "$s3.TargetPath = '%PROJECT_DIR%\HENTIKAN_ELIBUMKO.bat'; " ^
    "$s3.WorkingDirectory = '%PROJECT_DIR%'; " ^
    "$s3.Description = 'Matikan Server Perpustakaan Digital ElibUMKO'; " ^
    "$s3.Save();"

if %errorlevel% equ 0 (
    echo.
    echo [SUKSES] Pintasan berhasil dibuat di Desktop komputer Anda:
    echo.
    echo   1. [Perpustakaan Digital UMKO]
    echo      -> Sekali klik langsung menyalakan server dan membuka browser.
    echo.
    echo   2. [Perpustakaan UMKO (Mode Senyap)]
    echo      -> Berjalan senyap di background tanpa jendela CMD hitam.
    echo.
    echo   3. [Matikan Perpustakaan UMKO]
    echo      -> Sekali klik untuk mematikan server dengan bersih.
    echo.
) else (
    echo [ERROR] Terjadi kendala saat membuat shortcut otomatis.
)

echo Tekan tombol apa saja untuk menutup jendela ini...
pause >nul
exit /b 0
