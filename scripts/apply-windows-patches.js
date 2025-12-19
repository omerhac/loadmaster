/**
 * Apply Windows build patches that can't be handled by patch-package.
 * 
 * This creates node_modules/Directory.Build.props which is needed because
 * patch-package only works on individual packages, not the node_modules root.
 */

const fs = require('fs');
const path = require('path');

const nodeModulesDir = path.join(__dirname, '..', 'node_modules');
const targetFile = path.join(nodeModulesDir, 'Directory.Build.props');

const content = `<?xml version="1.0" encoding="utf-8"?>
<Project>
  <PropertyGroup>
    <!-- Override SDK version for third-party packages that default to uninstalled versions -->
    <WindowsTargetPlatformVersion Condition="'$(WindowsTargetPlatformVersion)' == ''">10.0.19041.0</WindowsTargetPlatformVersion>

    <!-- Fix JSI source path for RN 0.79 where jsi files are at ReactCommon\\jsi\\jsi\\jsi.cpp -->
    <ReactNativeDir Condition="'$(ReactNativeDir)' == ''">$(MSBuildThisFileDirectory)react-native\\</ReactNativeDir>
    <JSI_SourcePath Condition="'$(JSI_SourcePath)' == ''">$(ReactNativeDir)ReactCommon\\jsi</JSI_SourcePath>
  </PropertyGroup>
</Project>
`;

try {
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('✓ Created node_modules/Directory.Build.props');
} catch (err) {
  console.error('Failed to create Directory.Build.props:', err.message);
  process.exit(1);
}
