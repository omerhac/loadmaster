# Building Windows Tablet Package from macOS

Since you're developing on macOS but need to create a Windows tablet package, here are your options:

## 🚀 Option 1: GitHub Actions (Recommended)

This is the easiest way since you already have GitHub Actions set up:

### Step 1: Push your code to GitHub
```bash
git add .
git commit -m "Add Windows tablet deployment setup"
git push
```

### Step 2: Trigger the build
1. Go to your GitHub repository
2. Click on **"Actions"** tab
3. Find **"Build Windows Tablet Package"** workflow
4. Click **"Run workflow"**
5. Select:
   - **Platform**: `x64` (for most tablets)
   - **Configuration**: `Release`
6. Click **"Run workflow"**

### Step 3: Download the package
1. Wait for the build to complete (5-10 minutes)
2. Click on the completed workflow run
3. Download the artifact: `loadmaster-windows-tablet-package-x64-Release`
4. Extract the ZIP file

### Step 4: Transfer to tablet
1. Copy the extracted folder to a USB drive
2. Transfer to your Windows tablet
3. Run `install.bat` as administrator

## 🖥️ Option 2: Use a Windows Machine

If you have access to a Windows machine:

### Requirements
- Windows 10/11
- Visual Studio 2022 with UWP development
- Node.js 18+

### Steps
1. Clone your repository on the Windows machine
2. Open PowerShell as Administrator
3. Navigate to your project directory
4. Run:
   ```powershell
   npm run build-windows-package
   ```

## ☁️ Option 3: Windows Virtual Machine

You can run Windows in a VM on your Mac:

### Using Parallels Desktop (Paid)
1. Install Parallels Desktop
2. Create a Windows 11 VM
3. Install Visual Studio 2022 in the VM
4. Follow Option 2 steps

### Using UTM (Free)
1. Install UTM from Mac App Store
2. Create a Windows 11 VM
3. Install development tools
4. Follow Option 2 steps

## 🔧 Option 4: Cross-platform Build Service

Use a cloud build service like:
- **GitHub Codespaces** (with Windows environment)
- **Azure DevOps** (hosted Windows agents)
- **AppCenter** (Microsoft's mobile DevOps)

## 📦 What You'll Get

Any of these methods will produce:
```
loadmaster-windows-tablet-package/
├── loadmaster_1.0.0.0_x64.appx     # Your app package
├── install.bat                      # Easy installer
├── install.ps1                     # PowerShell installer
└── README.md                       # Installation guide
```

## 🎯 Quick Test Command

To verify the GitHub Actions approach works, run:
```bash
npm run build-windows-package
```

This will show you the GitHub Actions URL and instructions.

## 🆘 Troubleshooting

**GitHub Actions build fails?**
- Check the Actions tab for error details
- Ensure all dependencies are in package.json
- Verify the workflow file is in `.github/workflows/`

**Can't access GitHub Actions?**
- Make sure your repository is public or you have GitHub Pro
- Check repository permissions

**Need a different architecture?**
- ARM64: For Surface Pro X or other ARM tablets
- x86: For older 32-bit tablets (rare)
- x64: For most modern tablets (default)

---

**Recommended**: Use GitHub Actions (Option 1) - it's free, automated, and uses the same environment as your CI pipeline. 