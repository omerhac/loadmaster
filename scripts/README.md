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
- Download the Windows exe
- Run it immediately

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

The CI workflow has been updated to upload the Windows exe as an artifact:

```yaml
- name: Upload Windows exe for development
  uses: actions/upload-artifact@main
  with:
    name: windows-dev-exe
    path: windows/loadmaster/x64/Release/loadmaster.exe
```

This makes the exe available for quick download and testing. 