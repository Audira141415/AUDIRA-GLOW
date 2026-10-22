@echo off
title AUDIRA GLOW - Start Server
color 0A
cls
echo =====================================================================
echo                     AUDIRA GLOW - WEB SERVER
echo =====================================================================
echo.

:: 1. Cek apakah port 3000 sudah berjalan
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [i] Server AUDIRA GLOW sudah aktif di http://localhost:3000/
    echo [*] Membuka browser...
    start http://localhost:3000/
    goto :selesai
)

:: 2. Cek ketersediaan Python
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!] PERINGATAN: Python tidak ditemukan di PATH.
    echo [*] Mencoba menjalankan menggunakan Node.js npx serve...
    where npx >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        start "AUDIRA_GLOW_SERVER" /min npx serve -l 3000 .
    ) else (
        echo [X] GAGAL: Harap install Python atau Node.js untuk menjalankan server.
        pause
        exit /b 1
    )
) else (
    echo [*] Menjalankan server lokal di port 3000...
    start "AUDIRA_GLOW_SERVER" /min python -m http.server 3000
)

:: 3. Tunggu hingga server siap (1-2 detik)
ping 127.0.0.1 -n 3 >nul

:: 4. Verifikasi apakah server berhasil menyala di port 3000
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Server AUDIRA GLOW BERHASIL DIJALANKAN!
    echo.
    echo   - URL Utama    : http://localhost:3000/
    echo   - Colorfigures : http://localhost:3000/colorfigures.html
    echo   - Playable 3D  : http://localhost:3000/playable.html
    echo   - Gundam Mecha : http://localhost:3000/gundam.html
    echo   - Shipwright 3D: http://localhost:3000/shipwright.html
    echo   - Audira Studio: http://localhost:3000/audira-studio.html
    echo   - Data Center  : http://localhost:3000/datacenter.html
    echo   - Cyber Lab    : http://localhost:3000/cyberlab.html
    echo   - Classic Demo : http://localhost:3000/objects.html
    echo.
    echo [*] Membuka browser ke http://localhost:3000/ ...
    start http://localhost:3000/
) else (
    echo [X] Server belum terdeteksi aktif di port 3000.
    echo     Silakan periksa izin firewall atau port 3000 di sistem Anda.
)

:selesai
echo.
echo =====================================================================
echo  Untuk menghentikan server, klik 2x file: stop.bat
echo =====================================================================
ping 127.0.0.1 -n 3 >nul
