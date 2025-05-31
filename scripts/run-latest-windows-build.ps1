# One-Click LoadMaster Windows Dev Runner
# Downloads and runs the latest Windows build from GitHub Actions

param(
    [string]$GitHubToken = $env:GITHUB_TOKEN,  # Optional: Set GITHUB_TOKEN env var or pass as param
    [string]$Owner = "omerhacohen",  # Update this to your GitHub username
    [string]$Repo = "loadmaster",
    [string]$Branch = "main",
    [string]$ArtifactName = "windows-dev-exe",
    [string]$ExeName = "loadmaster.exe"
)

Write-Host "🚀 LoadMaster Windows Dev Runner" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Create temp directory for download
$TempDir = Join-Path $env:TEMP "loadmaster-dev-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

try {
    # Build headers
    $Headers = @{
        "Accept" = "application/vnd.github.v3+json"
        "User-Agent" = "LoadMaster-Dev-Runner"
    }
    if ($GitHubToken) {
        $Headers["Authorization"] = "Bearer $GitHubToken"
    }

    Write-Host "📋 Finding latest successful build on branch: $Branch" -ForegroundColor Yellow
    
    # Get workflow runs
    $WorkflowsUrl = "https://api.github.com/repos/$Owner/$Repo/actions/runs?branch=$Branch&status=success&per_page=10"
    try {
        $Runs = Invoke-RestMethod -Uri $WorkflowsUrl -Headers $Headers -Method Get
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "❌ Repository not found or no access. Make sure the repo is public or provide a GitHub token." -ForegroundColor Red
            Write-Host "   Repo: https://github.com/$Owner/$Repo" -ForegroundColor Red
            exit 1
        }
        throw
    }

    if ($Runs.workflow_runs.Count -eq 0) {
        Write-Host "❌ No successful workflow runs found on branch: $Branch" -ForegroundColor Red
        exit 1
    }

    # Find the latest run with our artifact
    $LatestRun = $null
    foreach ($Run in $Runs.workflow_runs) {
        Write-Host "   Checking run #$($Run.run_number) from $($Run.created_at)..." -ForegroundColor Gray
        
        $ArtifactsUrl = $Run.artifacts_url
        $Artifacts = Invoke-RestMethod -Uri $ArtifactsUrl -Headers $Headers -Method Get
        
        $WindowsArtifact = $Artifacts.artifacts | Where-Object { $_.name -eq $ArtifactName }
        if ($WindowsArtifact) {
            $LatestRun = $Run
            $ArtifactInfo = $WindowsArtifact
            Write-Host "✅ Found artifact in run #$($Run.run_number)" -ForegroundColor Green
            break
        }
    }

    if (-not $LatestRun) {
        Write-Host "❌ No runs found with artifact: $ArtifactName" -ForegroundColor Red
        Write-Host "   Available artifacts in latest run:" -ForegroundColor Yellow
        $Artifacts.artifacts | ForEach-Object { Write-Host "   - $($_.name)" -ForegroundColor Gray }
        exit 1
    }

    Write-Host ""
    Write-Host "📦 Downloading artifact from run #$($LatestRun.run_number)" -ForegroundColor Yellow
    Write-Host "   Run date: $($LatestRun.created_at)" -ForegroundColor Gray
    Write-Host "   Commit: $($LatestRun.head_sha.Substring(0, 7))" -ForegroundColor Gray

    # Download artifact
    $DownloadUrl = $ArtifactInfo.archive_download_url
    $ZipPath = Join-Path $TempDir "artifact.zip"
    
    try {
        if ($GitHubToken) {
            # Use GitHub token for authenticated download
            Invoke-WebRequest -Uri $DownloadUrl -Headers $Headers -OutFile $ZipPath
        } else {
            # For public repos, we need to handle the redirect
            Write-Host "   Note: Downloading from public repo without auth token" -ForegroundColor Gray
            $Response = Invoke-WebRequest -Uri $DownloadUrl -Headers $Headers -MaximumRedirection 0 -ErrorAction SilentlyContinue
            if ($Response.StatusCode -eq 302) {
                $RedirectUrl = $Response.Headers.Location
                Invoke-WebRequest -Uri $RedirectUrl -OutFile $ZipPath
            }
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404 -or $_.Exception.Response.StatusCode -eq 403) {
            Write-Host "❌ Cannot download artifact. This usually means:" -ForegroundColor Red
            Write-Host "   - The repository is private and requires a GitHub token" -ForegroundColor Red
            Write-Host "   - The artifact has expired (artifacts expire after 90 days)" -ForegroundColor Red
            Write-Host "" -ForegroundColor Red
            Write-Host "To fix: Set GITHUB_TOKEN environment variable or pass -GitHubToken parameter" -ForegroundColor Yellow
            Write-Host 'Example: $env:GITHUB_TOKEN = "ghp_your_token_here"' -ForegroundColor Gray
            exit 1
        }
        throw
    }

    # Extract artifact
    Write-Host "📂 Extracting artifact..." -ForegroundColor Yellow
    Expand-Archive -Path $ZipPath -DestinationPath $TempDir -Force
    
    # Find the exe - check for extracted dev release folders first, then look in MSIX
    $ExePath = $null
    $DevReleasePaths = @()
    
    # Check for both dev_release folders
    $DevReleaseExe = Get-ChildItem -Path $TempDir -Recurse -Filter $ExeName | Where-Object { $_.DirectoryName -like "*dev_release*" }
    
    if ($DevReleaseExe) {
        foreach ($ExeFile in $DevReleaseExe) {
            $DllCount = (Get-ChildItem -Path $ExeFile.DirectoryName -Filter "*.dll" -ErrorAction SilentlyContinue).Count
            $DevReleasePaths += @{
                Path = $ExeFile
                Directory = $ExeFile.DirectoryName
                DllCount = $DllCount
                Type = if ($ExeFile.DirectoryName -like "*dev_release_alt*") { "Alternative (from found exe)" } else { "MSIX extraction" }
            }
        }
        
        # Sort by DLL count (descending) and prefer alt version if tie
        $BestDevRelease = $DevReleasePaths | Sort-Object DllCount -Descending | Sort-Object { $_.Type -eq "Alternative (from found exe)" ? 0 : 1 } | Select-Object -First 1
        
        $ExePath = $BestDevRelease.Path
        Write-Host "✅ Found extracted exe from $($BestDevRelease.Type)" -ForegroundColor Green
        Write-Host "   Location: $($BestDevRelease.Directory)" -ForegroundColor Gray
        Write-Host "   DLL Dependencies: $($BestDevRelease.DllCount)" -ForegroundColor Gray
        
        # Show other options if available
        if ($DevReleasePaths.Count -gt 1) {
            Write-Host "   Other options available:" -ForegroundColor Gray
            $DevReleasePaths | Where-Object { $_.Path -ne $ExePath } | ForEach-Object {
                Write-Host "     - $($_.Type): $($_.DllCount) DLLs" -ForegroundColor Gray
            }
        }
    } else {
        # Look for MSIX package and extract exe from it
        $MSIXPackage = Get-ChildItem -Path $TempDir -Recurse -Filter "*.msix" | Select-Object -First 1
        if ($MSIXPackage) {
            Write-Host "📦 Found MSIX package, extracting exe..." -ForegroundColor Yellow
            
            $MSIXExtractDir = Join-Path $TempDir "msix_extracted"
            New-Item -ItemType Directory -Path $MSIXExtractDir -Force | Out-Null
            
            try {
                # Extract MSIX (it's essentially a ZIP file)
                Add-Type -AssemblyName System.IO.Compression.FileSystem
                [System.IO.Compression.ZipFile]::ExtractToDirectory($MSIXPackage.FullName, $MSIXExtractDir)
                
                # Find exe in extracted MSIX
                $MSIXExe = Get-ChildItem -Path $MSIXExtractDir -Recurse -Filter "*.exe" | Where-Object { $_.Name -like "*loadmaster*" -or $_.Name -eq "app.exe" } | Select-Object -First 1
                if ($MSIXExe) {
                    # Create a dev folder and copy exe + dependencies
                    $DevDir = Join-Path $TempDir "dev_extracted"
                    New-Item -ItemType Directory -Path $DevDir -Force | Out-Null
                    
                    # Copy exe
                    Copy-Item -Path $MSIXExe.FullName -Destination (Join-Path $DevDir $ExeName)
                    
                    # Copy DLLs from same directory
                    $MSIXExeDir = $MSIXExe.DirectoryName
                    Get-ChildItem -Path $MSIXExeDir -Filter "*.dll" | ForEach-Object {
                        Copy-Item -Path $_.FullName -Destination $DevDir
                    }
                    
                    # Copy other important files
                    @("*.pri", "*.config", "*.manifest") | ForEach-Object {
                        Get-ChildItem -Path $MSIXExeDir -Filter $_ | ForEach-Object {
                            Copy-Item -Path $_.FullName -Destination $DevDir
                        }
                    }
                    
                    $ExePath = Get-ChildItem -Path $DevDir -Filter $ExeName | Select-Object -First 1
                    Write-Host "✅ Extracted exe from MSIX package" -ForegroundColor Green
                } else {
                    Write-Host "❌ No exe found in MSIX package" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ Failed to extract MSIX: $_" -ForegroundColor Red
            }
        } else {
            # Fallback: look for any exe in the artifact
            $ExePath = Get-ChildItem -Path $TempDir -Recurse -Filter $ExeName | Select-Object -First 1
        }
    }
    
    if (-not $ExePath) {
        Write-Host "❌ $ExeName not found in artifact!" -ForegroundColor Red
        Write-Host "   Contents of artifact:" -ForegroundColor Yellow
        Get-ChildItem -Path $TempDir -Recurse | ForEach-Object { 
            Write-Host "   - $($_.FullName.Replace($TempDir, ''))" -ForegroundColor Gray 
        }
        exit 1
    }

    # Get the directory containing the exe (where DLLs should be)
    $ExeDir = $ExePath.DirectoryName
    $ExeFullPath = $ExePath.FullName
    
    # Check for Bundle folder relative to exe
    $BundleDir = Join-Path (Split-Path -Parent (Split-Path -Parent $ExeDir)) "Bundle"
    if (-not (Test-Path $BundleDir)) {
        # Try to find Bundle folder anywhere in the artifact
        $BundleSearch = Get-ChildItem -Path $TempDir -Recurse -Directory -Filter "Bundle" | Select-Object -First 1
        if ($BundleSearch) {
            $BundleDir = $BundleSearch.FullName
        }
    }
    
    # Check for Resources.pri
    $ResourcesPri = Get-ChildItem -Path $TempDir -Recurse -Filter "Resources.pri" | Select-Object -First 1
    
    # Check for and install runtime dependencies
    Write-Host ""
    Write-Host "🔍 Checking for runtime dependencies..." -ForegroundColor Yellow
    $RuntimeDepsDir = Get-ChildItem -Path $TempDir -Recurse -Directory -Filter "*runtime_deps*" | Select-Object -First 1
    
    if ($RuntimeDepsDir) {
        Write-Host "📦 Found runtime dependencies folder" -ForegroundColor Green
        
        $AppxFiles = Get-ChildItem -Path $RuntimeDepsDir.FullName -Filter "*.appx" -ErrorAction SilentlyContinue
        if ($AppxFiles) {
            Write-Host "   Found $($AppxFiles.Count) APPX dependencies" -ForegroundColor Gray
            
            # Extract DLLs from APPX files to the exe directory
            foreach ($AppxFile in $AppxFiles) {
                Write-Host "   Processing: $($AppxFile.Name)" -ForegroundColor Gray
                
                try {
                    $AppxExtractDir = Join-Path $TempDir "appx_extract_$($AppxFile.BaseName)"
                    
                    # Extract APPX (it's a ZIP file)
                    Add-Type -AssemblyName System.IO.Compression.FileSystem
                    [System.IO.Compression.ZipFile]::ExtractToDirectory($AppxFile.FullName, $AppxExtractDir)
                    
                    # Copy DLLs to exe directory
                    Get-ChildItem -Path $AppxExtractDir -Recurse -Filter "*.dll" -ErrorAction SilentlyContinue | ForEach-Object {
                        $DestPath = Join-Path $ExeDir $_.Name
                        if (-not (Test-Path $DestPath)) {
                            Copy-Item -Path $_.FullName -Destination $DestPath -ErrorAction SilentlyContinue
                            Write-Host "     ✓ Added runtime DLL: $($_.Name)" -ForegroundColor Green
                        }
                    }
                    
                    # Also copy .winmd and .pri files
                    @("*.winmd", "*.pri") | ForEach-Object {
                        Get-ChildItem -Path $AppxExtractDir -Recurse -Filter $_ -ErrorAction SilentlyContinue | ForEach-Object {
                            $DestPath = Join-Path $ExeDir $_.Name
                            if (-not (Test-Path $DestPath)) {
                                Copy-Item -Path $_.FullName -Destination $DestPath -ErrorAction SilentlyContinue
                                Write-Host "     ✓ Added runtime file: $($_.Name)" -ForegroundColor Green
                            }
                        }
                    }
                    
                    # Cleanup
                    Remove-Item -Path $AppxExtractDir -Recurse -Force -ErrorAction SilentlyContinue
                    
                } catch {
                    Write-Host "     ❌ Failed to process $($AppxFile.Name): $_" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "   No APPX files found in runtime dependencies" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠ No runtime dependencies found in artifact" -ForegroundColor Yellow
        Write-Host "   If app fails to start, you may need to install Windows Runtime dependencies manually" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "🎯 Starting LoadMaster..." -ForegroundColor Green
    Write-Host "   Path: $ExeFullPath" -ForegroundColor Gray
    Write-Host "   Working Directory: $ExeDir" -ForegroundColor Gray
    
    # List important files found
    $DllCount = (Get-ChildItem -Path $ExeDir -Filter "*.dll" -ErrorAction SilentlyContinue).Count
    if ($DllCount -gt 0) {
        Write-Host "   Found $DllCount DLL dependencies" -ForegroundColor Gray
        
        # Show breakdown of DLL types
        $RuntimeDlls = Get-ChildItem -Path $ExeDir -Filter "*vclibs*" -ErrorAction SilentlyContinue
        $UiDlls = Get-ChildItem -Path $ExeDir -Filter "*ui.xaml*" -ErrorAction SilentlyContinue
        $OtherDlls = Get-ChildItem -Path $ExeDir -Filter "*.dll" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*vclibs*" -and $_.Name -notlike "*ui.xaml*" }
        
        if ($RuntimeDlls.Count -gt 0) {
            Write-Host "     ✓ Runtime DLLs: $($RuntimeDlls.Count)" -ForegroundColor Green
        }
        if ($UiDlls.Count -gt 0) {
            Write-Host "     ✓ UI Framework DLLs: $($UiDlls.Count)" -ForegroundColor Green
        }
        if ($OtherDlls.Count -gt 0) {
            Write-Host "     ✓ Other DLLs: $($OtherDlls.Count)" -ForegroundColor Green
        }
    }
    
    if (Test-Path $BundleDir) {
        $BundleFile = Join-Path $BundleDir "index.windows.bundle"
        if (Test-Path $BundleFile) {
            Write-Host "   ✓ JavaScript bundle found" -ForegroundColor Green
        }
        $AssetCount = (Get-ChildItem -Path $BundleDir -Recurse -File -Exclude "*.bundle" -ErrorAction SilentlyContinue).Count
        if ($AssetCount -gt 0) {
            Write-Host "   ✓ Found $AssetCount asset files" -ForegroundColor Green
        }
    } else {
        Write-Host "   ⚠ No Bundle folder found - app may not have JavaScript code" -ForegroundColor Yellow
    }
    
    if ($ResourcesPri) {
        Write-Host "   ✓ Resources.pri found" -ForegroundColor Green
        # Copy Resources.pri to exe directory if not already there
        $TargetPri = Join-Path $ExeDir "Resources.pri"
        if (-not (Test-Path $TargetPri)) {
            Copy-Item $ResourcesPri.FullName $TargetPri
        }
    }
    
    # Ensure Bundle folder is in the correct location
    # React Native Windows typically expects Bundle to be at ../Bundle relative to x64/Release/app.exe
    if (Test-Path $BundleDir) {
        $ExpectedBundleDir = Join-Path (Split-Path -Parent (Split-Path -Parent $ExeDir)) "Bundle"
        if ($BundleDir -ne $ExpectedBundleDir -and -not (Test-Path $ExpectedBundleDir)) {
            Write-Host "   📁 Moving Bundle folder to expected location..." -ForegroundColor Yellow
            $ParentDir = Split-Path -Parent $ExpectedBundleDir
            if (-not (Test-Path $ParentDir)) {
                New-Item -ItemType Directory -Path $ParentDir -Force | Out-Null
            }
            Copy-Item -Path $BundleDir -Destination $ExpectedBundleDir -Recurse -Force
            Write-Host "   ✓ Bundle folder relocated" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Cyan
    Write-Host ""

    # Run the exe from its directory (so it can find DLLs)
    Push-Location $ExeDir
    try {
        $Process = Start-Process -FilePath $ExeFullPath -PassThru
        
        # Wait for process to exit
        $Process.WaitForExit()
        
        Write-Host ""
        Write-Host "✅ LoadMaster exited with code: $($Process.ExitCode)" -ForegroundColor $(if ($Process.ExitCode -eq 0) { "Green" } else { "Red" })
    } finally {
        Pop-Location
    }

} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
} finally {
    # Cleanup
    if (Test-Path $TempDir) {
        Write-Host ""
        Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Gray
        Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
} 