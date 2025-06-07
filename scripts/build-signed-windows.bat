@echo off
REM Windows batch script for building signed Windows app

echo Windows App Build with Certificate Signing
echo ==========================================

REM Check if certificate is provided
if "%LOADMASTER_ENCODED_CERTIFICATE%"=="" (
    echo ERROR: LOADMASTER_ENCODED_CERTIFICATE environment variable is not set
    echo Please set the base64 encoded certificate before running this script
    exit /b 1
)

REM Set default values if not provided
if "%BUILD_CONFIGURATION%"=="" set BUILD_CONFIGURATION=Release
if "%BUILD_PLATFORM%"=="" set BUILD_PLATFORM=x64
if "%BUILD_LOG_DIRECTORY%"=="" set BUILD_LOG_DIRECTORY=./build-logs

echo.
echo Configuration: %BUILD_CONFIGURATION%
echo Platform: %BUILD_PLATFORM%
echo Certificate: Provided

REM Run the Node.js build script
node scripts\sign-windows-build.js

if %errorlevel% neq 0 (
    echo.
    echo Build failed with error code: %errorlevel%
    exit /b %errorlevel%
)

echo.
echo Build completed successfully!
echo Output location: windows\loadmaster\AppPackages\ 