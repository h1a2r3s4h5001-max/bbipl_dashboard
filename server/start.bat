@echo off
echo ============================================
echo   BBIPL CMS - SMTP Email Server
echo   Starting on http://localhost:3001
echo ============================================
echo.
echo Make sure you have configured:
echo   1. Your Gmail email address
echo   2. Your Gmail App Password
echo.
echo How to get App Password:
echo   https://support.google.com/accounts/answer/185833
echo.
echo ============================================
cd /d "%~dp0"
node server.js
pause

