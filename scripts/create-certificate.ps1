# Create Self-Signed Certificate for LoadMaster
# Run this script on Windows as Administrator

param(
    [string]$AppName = "LoadMaster",
    [string]$Publisher = "CN=omerhacohen"
)

Write-Host "Creating self-signed certificate for $AppName..." -ForegroundColor Green

# Create the certificate
$cert = New-SelfSignedCertificate -Type Custom -Subject $Publisher -KeyUsage DigitalSignature -FriendlyName $AppName -CertStoreLocation "Cert:\CurrentUser\My" -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}")

Write-Host "Certificate created with thumbprint: $($cert.Thumbprint)" -ForegroundColor Yellow

# Export the certificate
$certPath = "$env:USERPROFILE\Desktop\$AppName.cer"
Export-Certificate -Cert $cert -FilePath $certPath

Write-Host "Certificate exported to: $certPath" -ForegroundColor Green

# Install the certificate to Trusted Root
Write-Host "Installing certificate to Trusted Root Certification Authorities..." -ForegroundColor Yellow
Import-Certificate -FilePath $certPath -CertStoreLocation Cert:\LocalMachine\Root

Write-Host "Certificate installation complete!" -ForegroundColor Green
Write-Host "You can now install your .appx file by double-clicking it." -ForegroundColor Cyan

# Sign the package if it exists
$appxPath = Get-ChildItem -Path "." -Filter "*.appx" -Recurse | Select-Object -First 1
if ($appxPath) {
    Write-Host "Found .appx file: $($appxPath.FullName)" -ForegroundColor Yellow
    Write-Host "Signing the package..." -ForegroundColor Yellow
    
    # Sign the package
    $signedPath = $appxPath.FullName.Replace(".appx", "_signed.appx")
    Copy-Item $appxPath.FullName $signedPath
    
    # Use signtool to sign (if available)
    try {
        & "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe" sign /a /v /fd SHA256 $signedPath
        Write-Host "Package signed successfully: $signedPath" -ForegroundColor Green
    } catch {
        Write-Warning "Could not sign package automatically. You may need to install Windows SDK."
        Write-Host "The certificate is still installed and you can install the original .appx file." -ForegroundColor Cyan
    }
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Double-click your .appx file to install" -ForegroundColor White
Write-Host "2. If prompted, click 'Install' to proceed" -ForegroundColor White
Write-Host "3. The app will appear in your Start Menu" -ForegroundColor White 