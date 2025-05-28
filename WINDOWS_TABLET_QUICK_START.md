# Quick Start: Windows Tablet Deployment

## 🚀 Build the Package (5 minutes)

1. **Open PowerShell as Administrator** in your project directory
2. **Run the build command:**
   ```powershell
   npm run build-windows-package
   ```
3. **Wait for completion** (5-10 minutes)

## 📦 Transfer to Tablet

1. **Find the package:** Look for `loadmaster-windows-tablet-package` folder
2. **Copy to USB drive:** Copy the entire folder
3. **Transfer to tablet:** Plug USB into tablet and copy folder to desktop

## 🔧 Install on Tablet

1. **Navigate to the copied folder** on the tablet
2. **Right-click `install.bat`** → **"Run as administrator"**
3. **Follow prompts** and wait for installation
4. **Find LoadMaster** in Start Menu

## ✅ That's It!

Your app is now installed and ready to use offline on the tablet.

## 🆘 If Something Goes Wrong

- **Build fails?** Check you have Visual Studio 2022 installed
- **Installation fails?** Try enabling Developer Mode in Windows Settings
- **App won't start?** Check Windows Event Viewer for errors

For detailed troubleshooting, see `docs/WINDOWS_TABLET_DEPLOYMENT.md`

## 📋 Requirements Checklist

### Development Machine:
- [ ] Windows 10/11
- [ ] Visual Studio 2022 (with UWP development)
- [ ] Node.js 18+
- [ ] This project

### Target Tablet:
- [ ] Windows 10 version 1903+
- [ ] x64 architecture
- [ ] 4GB+ RAM
- [ ] 2GB+ free space

---

**Need help?** Check the detailed guide in `docs/WINDOWS_TABLET_DEPLOYMENT.md` 