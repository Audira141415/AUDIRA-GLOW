@echo off
title AUDIRA GLOW - Stop Server
color 0C
cls
echo =====================================================================
echo                     AUDIRA GLOW - STOP SERVER
echo =====================================================================
echo.

set FOUND=0

:: 1. Cari dan hentikan semua proses yang mendengarkan di port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo [*] Menghentikan proses server - PID: %%a
    taskkill /f /pid %%a >nul 2>&1
    set FOUND=1
)

:: 2. Hentikan window server bertitle AUDIRA_GLOW_SERVER jika masih ada
taskkill /fi "WINDOWTITLE eq AUDIRA_GLOW_SERVER*" /f >nul 2>&1

:: 3. Cetak status
if %FOUND% equ 1 (
    echo.
    echo [OK] Server AUDIRA GLOW di port 3000 telah BERHASIL DIHENTIKAN.
) else (
    echo.
    echo [i] Tidak ada server AUDIRA GLOW yang sedang berjalan di port 3000.
)

echo.
echo =====================================================================
echo  Untuk menyalakan kembali server, klik 2x file: start.bat
echo =====================================================================
ping 127.0.0.1 -n 3 >nul
