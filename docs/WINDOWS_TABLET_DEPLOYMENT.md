# Windows Tablet Deployment Guide

This guide explains how to build and deploy LoadMaster to a Windows tablet that doesn't have internet connectivity.

## Prerequisites

### On Your Development Machine
- Windows 10/11 with Visual Studio 2022 or Visual Studio Build Tools
- Node.js 18 or later
- Git
- PowerShell 5.1 or later

### Required Visual Studio Components
Install Visual Studio 2022 with these workloads:
- **Universal Windows Platform development**
- **Desktop development with C++**

Or install Visual Studio Build Tools 2022 with:
- **C++ build tools**
- **Windows 10/11 SDK (latest version)**

### On Target Tablet
- Windows 10 version 1903 or later
- x64 architecture
- At least 4GB RAM
- 2GB free storage space

## Building the Package

### Method 1: Using NPM Script (Recommended)
```bash
npm run build-windows-package
```

### Method 2: Using PowerShell Script Directly
```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-windows-package.ps1
```

### Method 3: Using Batch Script
```cmd
scripts\build-windows-package.bat
```

### Method 4: Manual Build
```bash
# Install dependencies
npm ci

# Build for Windows
npx react-native run-windows --no-launch --no-deploy --release --bundle --arch x64
```

## Build Output

After a successful build, you'll find:

1. **Build artifacts** in `windows/AppPackages/`
2. **Deployment package** in `loadmaster-windows-tablet-package/` (if using PowerShell script)

The deployment package contains:
- Application package (.appx/.msix/.appxbundle)
- Installation scripts (`install.bat` and `install.ps1`)
- README with instructions
- Any required dependencies

## Transferring to Tablet

1. Copy the entire `loadmaster-windows-tablet-package` folder to a USB drive
2. Connect the USB drive to your Windows tablet
3. Copy the folder to the tablet's local storage

## Installing on Tablet

### Method 1: Automatic Installation (Recommended)
1. Navigate to the copied folder
2. Right-click on `install.bat`
3. Select "Run as administrator"
4. Follow the prompts

### Method 2: PowerShell Installation
1. Open PowerShell as administrator
2. Navigate to the folder: `cd path\to\loadmaster-windows-tablet-package`
3. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
4. Run: `.\install.ps1`

### Method 3: Manual Installation
1. **Enable Developer Mode:**
   - Open Settings → Update & Security → For developers
   - Select "Developer mode"
   - Confirm when prompted

2. **Install the package:**
   - Double-click the `.appx`, `.msix`, or `.appxbundle` file
   - Click "Install" when prompted
   - Wait for installation to complete

## Troubleshooting

### Build Issues

**Error: "Visual Studio not found"**
- Install Visual Studio 2022 with UWP development workload
- Or install Visual Studio Build Tools 2022

**Error: "Windows SDK not found"**
- Install Windows 10/11 SDK through Visual Studio Installer
- Ensure version 10.0.19041.0 or later is installed

**Error: "CppWinRT not found"**
- The build script should handle this automatically
- If it persists, manually install: `nuget install Microsoft.Windows.CppWinRT`

**Error: "SQLite build failed"**
- Ensure Visual Studio 2022 (v143) toolset is installed
- The build script updates the toolset automatically

### Installation Issues

**Error: "This app can't run on your PC"**
- Ensure the tablet is x64 architecture
- Check Windows version (must be 1903 or later)

**Error: "App installation failed"**
- Enable Developer Mode in Windows Settings
- Run installation script as administrator
- Check Windows Event Viewer for detailed errors

**Error: "Package is not trusted"**
- This is normal for sideloaded apps
- Enable Developer Mode to allow untrusted packages

### Runtime Issues

**App crashes on startup**
- Check if all dependencies are included in the package
- Verify the database file is properly bundled
- Check Windows Event Viewer for crash details

**Database not found**
- Ensure the database setup scripts ran during build
- Check if the database file exists in the app's local storage

## Advanced Configuration

### Building for Different Architectures
```powershell
# For ARM64 tablets
.\scripts\build-windows-package.ps1 -Platform ARM64

# For x86 tablets (rare)
.\scripts\build-windows-package.ps1 -Platform x86
```

### Clean Build
```powershell
# Clean previous builds before building
.\scripts\build-windows-package.ps1 -Clean
```

### Debug Build
```powershell
# Build debug version for troubleshooting
.\scripts\build-windows-package.ps1 -Configuration Debug
```

## Package Structure

```
loadmaster-windows-tablet-package/
├── loadmaster_1.0.0.0_x64.appx          # Main application package
├── Dependencies/                          # Runtime dependencies (if any)
├── install.bat                           # Batch installation script
├── install.ps1                          # PowerShell installation script
└── README.md                            # Installation instructions
```

## Security Considerations

- The app requires Developer Mode to be enabled for sideloading
- This is a security requirement by Microsoft for non-Store apps
- The app runs in a sandboxed environment like all UWP apps
- No special permissions are required beyond standard UWP capabilities

## Updating the App

To update the app on the tablet:
1. Build a new package with an incremented version number
2. Transfer the new package to the tablet
3. Run the installation script again
4. The new version will replace the old one

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Windows Event Viewer for detailed error messages
3. Ensure all prerequisites are met
4. Try a clean build with the `-Clean` parameter

## Technical Details

- **Platform**: Universal Windows Platform (UWP)
- **Architecture**: x64 (configurable)
- **Minimum Windows Version**: 1903 (Build 18362)
- **Framework**: React Native Windows 0.78
- **Database**: SQLite (bundled)
- **Package Format**: APPX/MSIX 