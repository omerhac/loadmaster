# LoadMaster Windows Dev Runner Scripts

Quick scripts to download and run the latest Windows build from GitHub Actions.

## 🚀 Quick Start (One-Click)

### On Windows Remote Machine:

1. **Download both files** to any folder:
   - `run-latest-windows-build.bat`
   - `run-latest-windows-build.ps1`

2. **Double-click** `run-latest-windows-build.bat`

That's it! The script will:
- Find the latest successful CI build
- Download the Windows package (MSIX or extracted exe)
- Extract the exe from MSIX if needed
- Run it immediately with all dependencies

## 📦 How It Works

React Native Windows apps build to **MSIX packages** (not raw exe files). The script intelligently handles this with a comprehensive approach:

1. **Multiple Extraction Methods**: 
   - Checks for pre-extracted exe from MSIX (CI does this)
   - Checks for exe from the actual build location
   - Falls back to extracting from MSIX locally

2. **Smart Dependency Collection**:
   - Copies DLLs from the exe's directory
   - Searches `deps` folder for additional dependencies
   - Checks multiple build output folders (`x64/Release`, `Release`, etc.)
   - Combines dependencies from all sources

3. **Intelligent Selection**:
   - Compares multiple exe versions if available
   - Chooses the one with the most DLL dependencies
   - Prefers the "alternative" build (from actual build location) over MSIX extraction

4. **One-Click Run**: Launches the best available version with all dependencies

## 🔧 Configuration

### For Public Repositories
No configuration needed - it just works!

### For Private Repositories
You'll need a GitHub token:

1. Create a token at https://github.com/settings/tokens
2. Set it as environment variable:
   ```powershell
   $env:GITHUB_TOKEN = "ghp_your_token_here"
   ```
3. Run the script

### Custom Parameters
You can also run with custom parameters:

```powershell
.\run-latest-windows-build.ps1 -Owner "your-username" -Repo "your-repo" -Branch "feature-branch"
```

## 📝 Parameters

- **GitHubToken**: GitHub personal access token (optional for public repos)
- **Owner**: GitHub username/organization (default: "omerhacohen")
- **Repo**: Repository name (default: "loadmaster")
- **Branch**: Branch to get builds from (default: "main")
- **ArtifactName**: Name of the artifact to download (default: "windows-dev-exe")
- **ExeName**: Name of the exe file (default: "loadmaster.exe")

## 🛠️ Troubleshooting

### "Cannot download artifact"
- For private repos: Set your GitHub token
- Check if the artifact has expired (90 days)
- Ensure the CI workflow has completed successfully

### "No runs found with artifact"
- Check that the CI workflow is uploading "windows-dev-exe" artifact
- Verify the branch name is correct
- Ensure recent builds have succeeded

### PowerShell Execution Policy Error
The .bat file bypasses this, but if running .ps1 directly:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

## 🔄 CI Integration

The CI workflow has been updated to handle React Native Windows MSIX packages:

```yaml
- name: Upload Windows exe for development
  uses: actions/upload-artifact@main
  with:
    name: windows-dev-exe
    path: |
      windows/dev_release/**/*
      windows/dev_release_alt/**/*
      windows/loadmaster/Bundle/**/*
      windows/AppPackages/**/*.msix
```

**What the CI does:**

1. **Builds the MSIX package** (standard React Native Windows output)
2. **Extracts exe from MSIX** and creates `dev_release/` folder
3. **Finds exe from build location** and creates `dev_release_alt/` folder  
4. **Comprehensive dependency collection** from multiple sources:
   - DLLs from exe directories
   - Dependencies from `deps/` folder
   - Files from build output folders
5. **Uploads everything**: Both extracted folders, Bundle, and original MSIX

**The script intelligently chooses the best option:**
- ✅ **Prefers**: `dev_release_alt` (from actual build location)
- 🔄 **Alternative**: `dev_release` (from MSIX extraction)
- 📊 **Decision criteria**: Most DLL dependencies + build source preference
- 🚨 **Fallback**: Extract from MSIX locally if needed

This comprehensive approach ensures maximum compatibility and the fastest possible dev experience. 