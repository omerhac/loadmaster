# PowerShell script to prepare certificate for Windows app signing
param(
    [Parameter(Mandatory=$true)]
    [string]$EncodedCertificate,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = ".\EncodedKey.pfx"
)

try {
    Write-Host "Preparing certificate for signing..." -ForegroundColor Green
    
    # Convert base64 string to bytes
    $PfxBytes = [System.Convert]::FromBase64String($EncodedCertificate)
    
    # Get full path for the certificate
    $PfxPath = [System.IO.Path]::GetFullPath($OutputPath)
    
    # Write bytes to file
    [System.IO.File]::WriteAllBytes($PfxPath, $PfxBytes)
    
    Write-Host "Certificate successfully written to: $PfxPath" -ForegroundColor Green
    
    # Return the path for use in build scripts
    return $PfxPath
    
} catch {
    Write-Host "Error preparing certificate: $_" -ForegroundColor Red
    exit 1
} 