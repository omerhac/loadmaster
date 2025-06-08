# Windows App Certificate Signing Guide

This guide explains how to sign your Windows app build using a certificate.

## Prerequisites

1. A valid code signing certificate in `.pfx` format
2. The certificate password (if applicable)
3. PowerShell (for Windows) or Node.js environment

## Setup Instructions

### 1. Prepare Your Certificate

First, you need to convert your certificate to a base64 encoded string:

#### On Windows (PowerShell):
```powershell
$cert = Get-Content -Path "path\to\your\certificate.pfx" -Encoding Byte
$encodedCert = [System.Convert]::ToBase64String($cert)
$encodedCert | Out-File -FilePath "encoded-certificate.txt"
```

#### On macOS/Linux:
```bash
base64 -i path/to/your/certificate.pfx > encoded-certificate.txt
```

### 2. Set Environment Variables

You need to set the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `LOADMASTER_ENCODED_CERTIFICATE` | Base64 encoded certificate string | Yes |
| `LOADMASTER_CERTIFICATE_PASSWORD` | Certificate password | If certificate has password |
| `BUILD_CONFIGURATION` | Build configuration (`Debug` or `Release`) | No (default: `Release`) |
| `BUILD_PLATFORM` | Build platform (`x86`, `x64`, `ARM`, `ARM64`) | No (default: `x64`) |
| `DEPLOY_OPTION` | Additional deploy options | No |
| `BUILD_LOG_DIRECTORY` | Directory for build logs | No (default: `./build-logs`) |

#### Setting Environment Variables

##### Windows (Command Prompt):
```cmd
set LOADMASTER_ENCODED_CERTIFICATE=<your-base64-encoded-certificate>
set LOADMASTER_CERTIFICATE_PASSWORD=<your-certificate-password>
set BUILD_CONFIGURATION=Release
set BUILD_PLATFORM=x64
```

##### Windows (PowerShell):
```powershell
$env:LOADMASTER_ENCODED_CERTIFICATE = "<your-base64-encoded-certificate>"
$env:LOADMASTER_CERTIFICATE_PASSWORD = "<your-certificate-password>"
$env:BUILD_CONFIGURATION = "Release"
$env:BUILD_PLATFORM = "x64"
```

##### macOS/Linux:
```bash
export LOADMASTER_ENCODED_CERTIFICATE="<your-base64-encoded-certificate>"
export LOADMASTER_CERTIFICATE_PASSWORD="<your-certificate-password>"
export BUILD_CONFIGURATION="Release"
export BUILD_PLATFORM="x64"
```

### 3. Build the Signed App

Run the build script:

```bash
npm run windows:build-signed
```

## Build Options

### Debug Build without Certificate
```bash
BUILD_CONFIGURATION=Debug npm run windows:build
```

### Release Build with Certificate
```bash
BUILD_CONFIGURATION=Release npm run windows:build-signed
```

### Different Architecture
```bash
BUILD_PLATFORM=ARM64 npm run windows:build-signed
```

## CI/CD Integration

For CI/CD pipelines (like Azure DevOps), store the encoded certificate as a secret variable:

1. In your pipeline, set the certificate as a secret variable (e.g., `loadmasterEncodedKey`)
2. Reference it in your pipeline script:

```yaml
- script: |
    echo "##vso[task.setvariable variable=LOADMASTER_ENCODED_CERTIFICATE]$(loadmasterEncodedKey)"
  displayName: "Set Certificate Variable"

- script: npm run windows:build-signed
  displayName: "Build Signed Windows App"
  env:
    LOADMASTER_CERTIFICATE_PASSWORD: $(certificatePassword)
```

## Troubleshooting

### Certificate Not Found
- Ensure the base64 encoded string is correct
- Check that the environment variable is properly set

### Invalid Certificate
- Verify the certificate is in `.pfx` format
- Ensure the certificate is valid for code signing
- Check the certificate hasn't expired

### Build Fails with Signing Error
- Verify the certificate password is correct
- Ensure the certificate has code signing capabilities
- Check that the certificate matches the app's publisher information in `Package.appxmanifest`

## Security Notes

1. **Never commit** the encoded certificate or password to version control
2. Use environment variables or secure secret management systems
3. The build script automatically cleans up the certificate file after use
4. For production builds, use a proper secret management system

## Manual Certificate Preparation (Alternative)

If you prefer to manually prepare the certificate:

```powershell
# Using PowerShell script
.\scripts\prepare-certificate.ps1 -EncodedCertificate $env:LOADMASTER_ENCODED_CERTIFICATE
```

Then build with:
```bash
npx react-native run-windows --release --msbuildprops "PackageCertificateKeyFile=.\EncodedKey.pfx"
``` 