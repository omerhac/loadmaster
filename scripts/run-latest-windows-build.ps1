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
    
    # Find the exe - it might be at different levels depending on the artifact structure
    $ExePath = Get-ChildItem -Path $TempDir -Recurse -Filter $ExeName | Select-Object -First 1
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

    Write-Host ""
    Write-Host "🎯 Starting LoadMaster..." -ForegroundColor Green
    Write-Host "   Path: $ExeFullPath" -ForegroundColor Gray
    Write-Host "   Working Directory: $ExeDir" -ForegroundColor Gray
    
    # List important files found
    $DllCount = (Get-ChildItem -Path $ExeDir -Filter "*.dll" -ErrorAction SilentlyContinue).Count
    if ($DllCount -gt 0) {
        Write-Host "   Found $DllCount DLL dependencies" -ForegroundColor Gray
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