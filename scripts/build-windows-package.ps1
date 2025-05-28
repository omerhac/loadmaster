#!/usr/bin/env pwsh

# Build Windows Package for Tablet Deployment
# This script creates a standalone package that can be transferred to a Windows tablet

param(
    [string]$Configuration = "Release",
    [string]$Platform = "x64",
    [switch]$Clean = $false
)

Write-Host "Building LoadMaster Windows Package for Tablet Deployment" -ForegroundColor Green
Write-Host "Configuration: $Configuration" -ForegroundColor Yellow
Write-Host "Platform: $Platform" -ForegroundColor Yellow

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Error "Please run this script from the project root directory"
    exit 1
}

# Clean previous builds if requested
if ($Clean) {
    Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
    if (Test-Path "windows/AppPackages") {
        Remove-Item -Recurse -Force "windows/AppPackages"
    }
    if (Test-Path "windows/loadmaster/bin") {
        Remove-Item -Recurse -Force "windows/loadmaster/bin"
    }
    if (Test-Path "windows/loadmaster/obj") {
        Remove-Item -Recurse -Force "windows/loadmaster/obj"
    }
}

# Install dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm ci

# Ensure react-native-windows is installed
Write-Host "Installing react-native-windows..." -ForegroundColor Yellow
npm install --save-dev react-native-windows@latest

# Update SQLitePlugin Platform Toolset to v143 (Visual Studio 2022)
Write-Host "Updating SQLitePlugin Platform Toolset..." -ForegroundColor Yellow
$projFile = "node_modules\react-native-sqlite-storage\platforms\windows\SQLitePlugin\SQLitePlugin.vcxproj"
if (Test-Path $projFile) {
    (Get-Content $projFile) -replace '<PlatformToolset>v140</PlatformToolset>','<PlatformToolset>v143</PlatformToolset>' -replace '<PlatformToolset>v141</PlatformToolset>','<PlatformToolset>v143</PlatformToolset>' | Set-Content $projFile
    Write-Host "Updated Platform Toolset in SQLitePlugin.vcxproj to v143" -ForegroundColor Green
}

# Update Windows SDK version for SQLitePlugin
Write-Host "Updating SQLite Windows SDK Version..." -ForegroundColor Yellow
if (Test-Path $projFile) {
    (Get-Content $projFile) -replace '10.0.18362.0','10.0.19041.0' -replace '10.0.16299.0','10.0.19041.0' | Set-Content $projFile
    Write-Host "Updated SQLite Windows SDK version to 10.0.19041.0" -ForegroundColor Green
}

# Install CppWinRT NuGet Package
Write-Host "Installing CppWinRT NuGet Package..." -ForegroundColor Yellow
$nugetDir = "$env:TEMP\NuGetPackages"
if (!(Test-Path $nugetDir)) {
    New-Item -ItemType Directory -Path $nugetDir -Force
}
nuget install Microsoft.Windows.CppWinRT -Version 2.0.230706.1 -OutputDirectory $nugetDir

# Update SQLitePlugin packages.config
$packagesConfig = "node_modules\react-native-sqlite-storage\platforms\windows\SQLitePlugin\packages.config"
if (Test-Path $packagesConfig) {
    (Get-Content $packagesConfig) -replace 'version="2.0.200615.7"', 'version="2.0.230706.1"' | Set-Content $packagesConfig
    Write-Host "Updated CppWinRT version in packages.config" -ForegroundColor Green
}

# Fix SQLitePlugin Project to use global packages
Write-Host "Fixing SQLitePlugin project references..." -ForegroundColor Yellow
if (Test-Path $projFile) {
    $content = Get-Content $projFile
    $nugetPath = $nugetDir.Replace('\', '/')
    $content = $content -replace '<Import Project="\$\(SolutionDir\)\\packages\\Microsoft\.Windows\.CppWinRT\.2\.0\.[0-9.]+\\build\\native\\Microsoft\.Windows\.CppWinRT\.props"', "<Import Project=`"$nugetPath/Microsoft.Windows.CppWinRT.2.0.230706.1/build/native/Microsoft.Windows.CppWinRT.props`""
    $content = $content -replace '<Import Project="\$\(SolutionDir\)\\packages\\Microsoft\.Windows\.CppWinRT\.2\.0\.[0-9.]+\\build\\native\\Microsoft\.Windows\.CppWinRT\.targets"', "<Import Project=`"$nugetPath/Microsoft.Windows.CppWinRT.2.0.230706.1/build/native/Microsoft.Windows.CppWinRT.targets`""
    Set-Content $projFile $content
    Write-Host "Updated SQLitePlugin project references" -ForegroundColor Green
}

# Build the Windows package
Write-Host "Building Windows package..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Cyan

try {
    # Build with package creation
    npx react-native run-windows --no-launch --no-deploy --release --bundle --arch $Platform --logging
    
    Write-Host "Build completed successfully!" -ForegroundColor Green
    
    # Find the generated package
    $packageDir = "windows\AppPackages"
    if (Test-Path $packageDir) {
        Write-Host "Package created in: $packageDir" -ForegroundColor Green
        Get-ChildItem -Path $packageDir -Recurse -Include "*.appx", "*.msix", "*.appxbundle" | ForEach-Object {
            Write-Host "Package file: $($_.FullName)" -ForegroundColor Cyan
        }
    }
    
    # Create deployment package
    Write-Host "Creating deployment package..." -ForegroundColor Yellow
    $deploymentDir = "loadmaster-windows-tablet-package"
    if (Test-Path $deploymentDir) {
        Remove-Item -Recurse -Force $deploymentDir
    }
    New-Item -ItemType Directory -Path $deploymentDir -Force
    
    # Copy package files
    if (Test-Path $packageDir) {
        Copy-Item -Recurse -Path "$packageDir\*" -Destination $deploymentDir
    }
    
    # Create installation script
    $installScript = @"
@echo off
echo Installing LoadMaster for Windows Tablet
echo.

REM Enable developer mode (required for sideloading)
echo Enabling developer mode...
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /v AllowDevelopmentWithoutDevLicense /t REG_DWORD /d 1 /f

REM Find and install the package
for /r %%i in (*.appx *.msix *.appxbundle) do (
    echo Installing %%i...
    powershell -Command "Add-AppxPackage -Path '%%i'"
    if errorlevel 1 (
        echo Failed to install %%i
        pause
        exit /b 1
    )
)

echo.
echo Installation completed successfully!
echo You can now find LoadMaster in your Start Menu.
pause
"@
    
    Set-Content -Path "$deploymentDir\install.bat" -Value $installScript
    
    # Create PowerShell installation script (alternative)
    $psInstallScript = @"
# LoadMaster Windows Tablet Installation Script
Write-Host "Installing LoadMaster for Windows Tablet" -ForegroundColor Green

# Enable developer mode
Write-Host "Enabling developer mode..." -ForegroundColor Yellow
try {
    Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" -Name "AllowDevelopmentWithoutDevLicense" -Value 1 -Type DWord -Force
    Write-Host "Developer mode enabled" -ForegroundColor Green
} catch {
    Write-Warning "Could not enable developer mode. You may need to enable it manually in Windows Settings."
}

# Install the package
Write-Host "Installing LoadMaster package..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Include "*.appx", "*.msix", "*.appxbundle" | ForEach-Object {
    Write-Host "Installing $($_.Name)..." -ForegroundColor Cyan
    try {
        Add-AppxPackage -Path $_.FullName
        Write-Host "Successfully installed $($_.Name)" -ForegroundColor Green
    } catch {
        Write-Error "Failed to install $($_.Name): $($_.Exception.Message)"
    }
}

Write-Host "Installation completed!" -ForegroundColor Green
Write-Host "You can now find LoadMaster in your Start Menu." -ForegroundColor Cyan
Read-Host "Press Enter to exit"
"@
    
    Set-Content -Path "$deploymentDir\install.ps1" -Value $psInstallScript
    
    # Create README for deployment
    $readmeContent = @"
# LoadMaster Windows Tablet Deployment Package

This package contains everything needed to install LoadMaster on a Windows tablet without internet connection.

## Installation Instructions

### Method 1: Using Batch Script (Recommended)
1. Right-click on `install.bat` and select "Run as administrator"
2. Follow the prompts

### Method 2: Using PowerShell Script
1. Right-click on PowerShell and select "Run as administrator"
2. Navigate to this folder
3. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
4. Run: `.\install.ps1`

### Method 3: Manual Installation
1. Enable Developer Mode:
   - Go to Settings > Update & Security > For developers
   - Select "Developer mode"
2. Double-click on the .appx, .msix, or .appxbundle file
3. Click "Install"

## Requirements
- Windows 10 version 1903 or later
- x64 architecture
- Developer mode enabled (scripts will attempt to enable this)

## Troubleshooting
- If installation fails, ensure Windows is up to date
- Make sure no antivirus is blocking the installation
- Try running the installation script as administrator
- Check Windows Event Viewer for detailed error messages

## Package Contents
- Application package (.appx/.msix/.appxbundle)
- Dependencies (if any)
- Installation scripts
- This README file

Generated on: $(Get-Date)
"@
    
    Set-Content -Path "$deploymentDir\README.md" -Value $readmeContent
    
    Write-Host "Deployment package created: $deploymentDir" -ForegroundColor Green
    Write-Host "Transfer this entire folder to your Windows tablet and run install.bat" -ForegroundColor Cyan
    
} catch {
    Write-Error "Build failed: $($_.Exception.Message)"
    exit 1
}

Write-Host "Build process completed!" -ForegroundColor Green 