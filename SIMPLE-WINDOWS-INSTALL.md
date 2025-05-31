# Simple LoadMaster Windows Installation

Super simple way to install LoadMaster on any Windows machine.

## 🚀 Installation (2 steps)

1. **Download** the `loadmaster-windows-simple` artifact from GitHub Actions
2. **Run** `install.bat` (double-click it)

That's it! ✅

## 📦 What's in the package

- `LoadMaster.msix` - Your app (signed)
- `LoadMaster.pfx` - Certificate for installation
- `install.bat` - One-click installer

## 🔧 Manual installation (if needed)

If the batch file doesn't work:

1. **Install certificate:**
   ```cmd
   certutil -user -p password123 -importpfx LoadMaster.pfx
   ```

2. **Install app:**
   ```powershell
   Add-AppxPackage LoadMaster.msix
   ```

## 🎯 Finding your app

After installation, find "LoadMaster" in your Start Menu.

## ⚠️ Security Note

This uses a self-signed certificate for development. Windows may show security warnings - just click "Install anyway" or "More info" → "Run anyway".

---

**That's it!** No complex setup, no dependency management, just install and run. 🎉 