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
    
    # Find the exe
    $ExePath = Join-Path $TempDir $ExeName
    if (-not (Test-Path $ExePath)) {
        Write-Host "❌ $ExeName not found in artifact!" -ForegroundColor Red
        Write-Host "   Contents of artifact:" -ForegroundColor Yellow
        Get-ChildItem -Path $TempDir -Recurse | ForEach-Object { 
            Write-Host "   - $($_.FullName.Replace($TempDir, ''))" -ForegroundColor Gray 
        }
        exit 1
    }

    Write-Host ""
    Write-Host "🎯 Starting LoadMaster..." -ForegroundColor Green
    Write-Host "   Path: $ExePath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Cyan
    Write-Host ""

    # Run the exe
    $Process = Start-Process -FilePath $ExePath -PassThru
    
    # Wait for process to exit
    $Process.WaitForExit()
    
    Write-Host ""
    Write-Host "✅ LoadMaster exited with code: $($Process.ExitCode)" -ForegroundColor $(if ($Process.ExitCode -eq 0) { "Green" } else { "Red" })

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