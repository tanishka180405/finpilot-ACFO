@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-Finova.ps1"
if errorlevel 1 pause
