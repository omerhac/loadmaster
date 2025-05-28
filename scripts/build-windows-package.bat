@echo off
echo Building LoadMaster Windows Package for Tablet Deployment
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: Please run this script from the project root directory
    pause
    exit /b 1
)

echo Installing Node.js dependencies...
call npm ci
if errorlevel 1 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo Installing react-native-windows...
call npm install --save-dev react-native-windows@latest
if errorlevel 1 (
    echo Failed to install react-native-windows
    pause
    exit /b 1
)

echo Building Windows package...
echo This may take several minutes...
call npx react-native run-windows --no-launch --no-deploy --release --bundle --arch x64 --logging
if errorlevel 1 (
    echo Build failed
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo Check the windows\AppPackages directory for the generated package.
echo.
echo To create a deployment package, run the PowerShell script:
echo   powershell -ExecutionPolicy Bypass -File scripts\build-windows-package.ps1
echo.
pause 