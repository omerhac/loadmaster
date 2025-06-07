const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Build configuration
const buildConfiguration = process.env.BUILD_CONFIGURATION || 'Release';
const buildPlatform = process.env.BUILD_PLATFORM || 'x64';
const deployOption = process.env.DEPLOY_OPTION || '';
const buildLogDirectory = process.env.BUILD_LOG_DIRECTORY || './build-logs';

// Certificate configuration
const encodedCertificate = process.env.LOADMASTER_ENCODED_CERTIFICATE;
const certificatePassword = process.env.LOADMASTER_CERTIFICATE_PASSWORD || '';

console.log('Windows Build with Certificate Signing');
console.log('=====================================');
console.log(`Configuration: ${buildConfiguration}`);
console.log(`Platform: ${buildPlatform}`);
console.log(`Certificate: ${encodedCertificate ? 'Provided' : 'Not provided'}`);

// Step 1: Set up certificate if provided
let certificatePath = '';
if (encodedCertificate) {
    try {
                console.log('\nSetting up certificate...');

        // Decode base64 certificate
        // eslint-disable-next-line no-undef
        const pfxBytes = Buffer.from(encodedCertificate, 'base64');
        certificatePath = path.join(process.cwd(), 'EncodedKey.pfx');

        // Write certificate to file
        fs.writeFileSync(certificatePath, pfxBytes);
        console.log(`Certificate written to: ${certificatePath}`);

    } catch (error) {
        console.error('Error setting up certificate:', error);
        process.exit(1);
    }
}

// Step 2: Build Windows app
try {
    console.log('\nBuilding Windows app...');

    let buildCommand = 'npx react-native run-windows --no-packager --no-launch';

    // Add deploy option if provided
    if (deployOption) {
        buildCommand += ` ${deployOption}`;
    }

    // Add architecture
    buildCommand += ` --arch ${buildPlatform}`;

    // Add logging
    buildCommand += ` --logging --buildLogDirectory ${buildLogDirectory}`;

    // Add release flag for Release build
    if (buildConfiguration === 'Release') {
        buildCommand += ' --release';
    }

    // Add MSBuild properties
    let msbuildProps = 'BaseIntDir=$(BaseIntDir)';

    if (certificatePath) {
        // Add certificate for signing
        msbuildProps += `,PackageCertificateKeyFile=${certificatePath}`;

        if (certificatePassword) {
            msbuildProps += `,PackageCertificatePassword=${certificatePassword}`;
        }
    } else {
        // Disable signing if no certificate
        msbuildProps += ',AppxPackageSigningEnabled=False';
    }

    buildCommand += ` --msbuildprops "${msbuildProps}"`;

    console.log(`Executing: ${buildCommand}`);

    // Execute build command
    execSync(buildCommand, {
        stdio: 'inherit',
        shell: true,
    });

    console.log('\nBuild completed successfully!');

} catch (error) {
    console.error('\nBuild failed:', error.message);
    process.exit(1);
} finally {
    // Step 3: Clean up certificate
    if (certificatePath && fs.existsSync(certificatePath)) {
        try {
            console.log('\nCleaning up certificate...');
            fs.unlinkSync(certificatePath);
            console.log('Certificate removed');
        } catch (error) {
            console.error('Warning: Could not remove certificate file:', error.message);
        }
    }
}
