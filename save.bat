@echo off
setlocal enabledelayedexpansion
title AUDIRA GLOW - Git Auto-Save and Push Tool
color 0b

echo ================================================================
echo     AUDIRA GLOW - Git Auto-Save and Push Tool
echo ================================================================
echo       Interactive Isometric Systems and 3D Engine Suite
echo       Author: Audira (Agus Dwi R)
echo       Target Repo: https://github.com/Audira141415/AUDIRA-GLOW.git
echo ================================================================
echo.

:: 1. Check Git Installation
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Git is not installed or not found in system PATH!
    echo Please install Git from https://git-scm.com/ and try again.
    pause
    exit /b 1
)

:: 2. Initialize Git Repository if not present
if not exist ".git" (
    echo [INFO] Git repository not initialized. Initializing new repo on branch 'main'...
    git init -b main
    if %errorlevel% neq 0 (
        git init
        git branch -M main
    )
    echo [OK] Initialized empty Git repository in %cd%
    echo.
)

:: 3. Configure Remote Origin
set REPO_URL=https://github.com/Audira141415/AUDIRA-GLOW.git
git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Setting remote origin to %REPO_URL% ...
    git remote add origin %REPO_URL%
) else (
    echo [INFO] Updating remote origin to %REPO_URL% ...
    git remote set-url origin %REPO_URL%
)
echo [OK] Remote origin configured: %REPO_URL%
echo.

:: 4. Prompt for Commit Message or use default timestamp
echo ----------------------------------------------------------------
set /p USER_MSG="Enter commit message (Press ENTER for auto-timestamp): "
if "!USER_MSG!"=="" (
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set DT=%%I
    set YYYY=!DT:~0,4!
    set MM=!DT:~4,2!
    set DD=!DT:~6,2!
    set HH=!DT:~8,2!
    set MIN=!DT:~10,2!
    set SEC=!DT:~12,2!
    set USER_MSG=Auto-Save: !YYYY!-!MM!-!DD! !HH!:!MIN!:!SEC! - Audira Glow Complete Suite Update
)
echo [COMMIT MSG] !USER_MSG!
echo ----------------------------------------------------------------
echo.

:: 5. Stage All Changes
echo [1/3] Staging all files (git add .)...
git add .
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Failed to stage files!
    pause
    exit /b 1
)

:: 6. Commit Changes
echo [2/3] Committing changes (git commit)...
git commit -m "!USER_MSG!"
if %errorlevel% neq 0 (
    echo [NOTICE] No new changes to commit or commit clean.
)

:: 7. Push to GitHub
echo.
echo [3/3] Pushing to GitHub (origin main)...
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    color 0e
    echo [WARNING] Standard push failed. Trying to pull rebase first or force push...
    echo Options:
    echo  [1] Pull and Rebase from remote, then push
    echo  [2] Force push to overwrite remote (Caution)
    echo  [3] Cancel
    set /p PUSH_OPT="Select option [1/2/3]: "
    if "!PUSH_OPT!"=="1" (
        git pull --rebase origin main
        git push -u origin main
    ) else if "!PUSH_OPT!"=="2" (
        git push -u origin main --force
    ) else (
        echo [INFO] Push cancelled by user.
    )
)

echo.
if %errorlevel% equ 0 (
    color 0a
    echo ================================================================
    echo    SUCCESS! All changes have been pushed to GitHub!
    echo    Repository: %REPO_URL%
    echo ================================================================
) else (
    echo [WARNING] Please review the git output above for any authentication or network issues.
)

echo.
pause
