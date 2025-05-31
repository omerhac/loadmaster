# Windows Code Signing Options

This document outlines the various options for signing your Windows application to make it easily deployable.

## ⚠️ MSIX Packaging Issue Fixed

**If you encountered "not in a supported format" error:** This was caused by the CI not properly creating MSIX packages. This has been fixed in the latest CI pipeline.

The CI now:
- ✅ Creates proper MSIX packages using MSBuild
- ✅ Signs them with certificates during the build process
- ✅ Searches multiple locations for generated packages
- ✅ Validates the package format before signing

## Option 1: Self-Signed Certificate (FREE)
**Best for:** Internal deployment, development, testing

**Pros:**
- Free
- Works immediately
- Good for internal/enterprise deployment

**Cons:**
- Users will see "Unknown Publisher" warning
- May be blocked by some antivirus software
- Not suitable for public distribution

**Already implemented in CI pipeline** - see the `Create Self-Signed Certificate` step.

## Option 2: Traditional Code Signing Certificate ($75-300/year)
**Best for:** Public distribution, professional applications

### Certificate Providers:
- **DigiCert** (~$474/year) - Most trusted, used by Microsoft
- **Sectigo/Comodo** (~$75-200/year) - Budget-friendly option
- **GlobalSign** (~$249/year) - Good reputation
- **SSL.com** (~$199/year) - Competitive pricing

### Setup Process:
1. Purchase certificate from CA
2. Verify your organization (may take 1-5 days)
3. Download certificate as .pfx file
4. Store in GitHub Secrets:
   ```bash
   # Convert certificate to base64
   certutil -encode mycert.pfx mycert.txt
   # Copy contents (without header/footer) to GitHub secret: WINDOWS_CERTIFICATE_BASE64
   ```
5. Uncomment the "Sign Windows Package (Production)" step in CI

## Option 3: Cloud-Based Signing Services ($10-50/month)
**Best for:** Teams wanting managed signing without certificate hassles

### SignPath (Recommended)
- **Free tier:** 5 signatures/month
- **Paid:** $29-99/month
- Integrates directly with GitHub Actions
- Manages certificates for you

### Setup with SignPath:
1. Sign up at signpath.io
2. Create a project and upload your app
3. Add GitHub Action:
```yaml
- name: Sign with SignPath
  uses: signpath/github-action-submit-signing-request@v1
  with:
    api-token: '${{ secrets.SIGNPATH_API_TOKEN }}'
    organization-id: 'your-org-id'
    project-slug: 'your-project'
    signing-policy-slug: 'release-signing'
    artifact-configuration-slug: 'windows-app'
    input-artifact-path: 'windows/AppPackages/loadmaster/**/*.msix'
```

### Azure SignTool (Microsoft)
- **Cost:** ~$10-30/month
- Uses Azure Key Vault for certificate storage
- Very secure, Microsoft's recommended approach

## Option 4: EV Code Signing Certificate ($300-800/year)
**Best for:** Maximum trust, immediate SmartScreen reputation

**Benefits:**
- Highest level of trust
- Bypasses Windows SmartScreen warnings immediately
- Required for some enterprise environments

**Popular Providers:**
- DigiCert EV (~$595/year)
- GlobalSign EV (~$379/year)
- Sectigo EV (~$299/year)

**Note:** Requires hardware token (USB) or cloud HSM for private key storage.

## Option 5: Microsoft Store Signing (FREE)
**Best for:** Consumer applications

If you distribute through Microsoft Store, Microsoft signs your app automatically.

### To enable Store distribution:
1. Create Microsoft Partner Center account ($19 one-time fee)
2. Package as MSIX for Store submission
3. Microsoft handles all signing

## Recommendations by Use Case

### Internal/Enterprise Use
- Use **self-signed certificate** (already in CI)
- Deploy via Group Policy or SCCM
- Users trust your internal CA

### Small Business/Indie Developer
- Start with **Sectigo/Comodo certificate** (~$75/year)
- Upgrade to **SignPath** for easier management

### Professional/Commercial
- Use **DigiCert certificate** for maximum trust
- Consider **EV certificate** for immediate reputation

### Consumer App
- Distribute via **Microsoft Store** (free signing)
- Or use **EV certificate** for direct distribution

## Security Best Practices

1. **Never commit certificates to code**
2. **Use GitHub Secrets** for certificate storage
3. **Rotate certificates** before expiration
4. **Use timestamping** (already configured in CI)
5. **Test signing** on different Windows versions

## Current CI Implementation

The CI pipeline now includes:
- ✅ Self-signed certificate creation and signing
- ✅ Production certificate signing (commented out - ready to use)
- ✅ Proper timestamping for long-term validity
- ✅ Secure certificate handling

To switch to production signing:
1. Purchase certificate from CA
2. Add to GitHub Secrets
3. Uncomment production signing step
4. Comment out self-signed step

## Cost Summary

| Option | Annual Cost | Setup Time | Trust Level |
|--------|-------------|------------|-------------|
| Self-signed | FREE | 5 minutes | Low |
| Basic Certificate | $75-300 | 1-5 days | Medium |
| EV Certificate | $300-800 | 3-10 days | High |
| SignPath | $348/year | 1 hour | Medium-High |
| Microsoft Store | $19 one-time | 1-2 weeks | High |

## Troubleshooting

### "Package is not in a supported format" Error
This error typically occurs when:
1. **MSIX not properly created** - Fixed in current CI pipeline
2. **Wrong file type being signed** - CI now searches for actual .msix files
3. **Corrupted package** - CI validates packages before signing

### "No .msix package found" Error
If the CI can't find your package:
1. Check the build logs for MSBuild errors
2. Verify the `windows/loadmaster.sln` file exists
3. Ensure React Native Windows is properly configured
4. The CI will list all build outputs to help locate files

### Certificate Trust Issues
**Self-signed certificates will show warnings** - this is expected:
- Users see "Unknown Publisher" 
- Windows SmartScreen may block installation
- For production, use a trusted certificate authority

### Installing Self-Signed Packages
To install packages signed with self-signed certificates:
1. Right-click the .msix file → Properties → Digital Signatures
2. Select the certificate → Details → View Certificate
3. Install Certificate → Local Machine → Trusted Root Certification Authorities
4. Now the package will install without warnings

### Enabling Developer Mode
If packages won't install:
1. Settings → Update & Security → For developers
2. Enable "Developer mode"
3. This allows sideloading of unsigned/self-signed packages

### Production Certificate Setup
1. **Store certificate securely in GitHub Secrets:**
   ```bash
   # Convert .pfx to base64
   certutil -encode certificate.pfx certificate.txt
   # Copy content (without BEGIN/END lines) to secret: WINDOWS_CERTIFICATE_BASE64
   ```
2. **Add certificate password to secrets:** `WINDOWS_CERTIFICATE_PASSWORD`
3. **Uncomment production signing step** in CI pipeline
4. **Comment out self-signed step** to avoid conflicts 