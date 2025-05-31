@echo off
REM One-Click LoadMaster Windows Dev Runner
REM Downloads and runs the latest Windows build from GitHub Actions

powershell.exe -ExecutionPolicy Bypass -File "%~dp0run-latest-windows-build.ps1" %*

pause 