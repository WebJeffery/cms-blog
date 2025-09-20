#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

// Package build order (dependencies first)
const packages = [
  {
    name: '@fecommunity/reactpress-config',
    path: 'config',
    description: 'Configuration management package'
  },
  {
    name: '@fecommunity/reactpress-server', 
    path: 'server',
    description: 'Backend API server package'
  },
  {
    name: '@fecommunity/reactpress-client',
    path: 'client', 
    description: 'Frontend application package'
  }
];

// Get current versions
function getCurrentVersion(packagePath) {
  try {
    const pkgPath = path.join(process.cwd(), packagePath, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version;
  } catch (error) {
    return 'unknown';
  }
}

// Increment version based on type
function incrementVersion(version, type) {
  const parts = version.split('-')[0].split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]);
  const patch = parseInt(parts[2]);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'beta':
      // For beta, we increment the beta number or add beta.1 if not present
      const match = version.match(/^(.*)-beta\.(\d+)$/);
      if (match) {
        const baseVersion = match[1];
        const betaNumber = parseInt(match[2]);
        return `${baseVersion}-beta.${betaNumber + 1}`;
      } else {
        // If no beta version exists, add beta.1
        return `${version}-beta.1`;
      }
    case 'alpha':
      // For alpha, we increment the alpha number or add alpha.1 if not present
      const alphaMatch = version.match(/^(.*)-alpha\.(\d+)$/);
      if (alphaMatch) {
        const baseVersion = alphaMatch[1];
        const alphaNumber = parseInt(alphaMatch[2]);
        return `${baseVersion}-alpha.${alphaNumber + 1}`;
      } else {
        // If no alpha version exists, add alpha.1
        return `${version}-alpha.1`;
      }
    default:
      return version;
  }
}

// Get next available version from npm registry
function getNextAvailableVersion(packageName, currentVersion, versionType) {
  try {
    // First, increment the version locally
    let nextVersion = incrementVersion(currentVersion, versionType);
    
    // Check if this version already exists on npm
    let versionExists = true;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop
    
    while (versionExists && attempts < maxAttempts) {
      try {
        execSync(`npm view ${packageName}@${nextVersion} version`, { stdio: 'ignore' });
        // If we get here, the version exists, so we need to increment again
        nextVersion = incrementVersion(nextVersion, versionType);
        attempts++;
      } catch (error) {
        // If we get an error, the version doesn't exist, which is what we want
        versionExists = false;
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Too many attempts to find available version');
    }
    
    return nextVersion;
  } catch (error) {
    // Fallback to simple increment if npm view fails
    console.log(chalk.yellow(`⚠️  Could not check npm registry, using local increment for ${packageName}`));
    return incrementVersion(currentVersion, versionType);
  }
}

// Update package version
function updateVersion(packagePath, newVersion) {
  console.log(chalk.blue(`\n✏️  Updating version to ${newVersion}...`));
  
  const pkgPath = path.join(process.cwd(), packagePath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  const oldVersion = pkg.version;
  pkg.version = newVersion;
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(chalk.green(`✅ Version updated from ${oldVersion} to ${newVersion}`));
}

// Fix workspace dependencies for publish
function fixWorkspaceDependencies(packagePath, packageVersions) {
  console.log(chalk.blue(`🔧 Fixing workspace dependencies for publish: ${packagePath}...`));
  
  const pkgPath = path.join(process.cwd(), packagePath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Fix dependencies
  const depTypes = ['dependencies', 'devDependencies', 'peerDependencies'];
  
  depTypes.forEach(depType => {
    if (pkg[depType]) {
      Object.keys(pkg[depType]).forEach(depName => {
        // Check if it's a workspace dependency
        if (pkg[depType][depName] === 'workspace:*' || pkg[depType][depName].startsWith('workspace:')) {
          // Replace with actual version
          const depPackage = packages.find(p => p.name === depName);
          if (depPackage && packageVersions[depName]) {
            console.log(chalk.gray(`  Replacing ${depName} workspace dependency with version ${packageVersions[depName]}`));
            pkg[depType][depName] = packageVersions[depName];
          }
        }
      });
    }
  });
  
  // Write the updated package.json
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(chalk.green(`✅ Workspace dependencies fixed for publish: ${packagePath}`));
}

// Restore workspace dependencies after publish
function restoreWorkspaceDependencies(packagePath) {
  console.log(chalk.blue(`🔄 Restoring workspace dependencies for ${packagePath}...`));
  
  const pkgPath = path.join(process.cwd(), packagePath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Restore dependencies
  const depTypes = ['dependencies', 'devDependencies', 'peerDependencies'];
  
  depTypes.forEach(depType => {
    if (pkg[depType]) {
      Object.keys(pkg[depType]).forEach(depName => {
        // Check if this is one of our internal packages
        const depPackage = packages.find(p => p.name === depName);
        if (depPackage) {
          console.log(chalk.gray(`  Restoring ${depName} to workspace dependency`));
          pkg[depType][depName] = 'workspace:*';
        }
      });
    }
  });
  
  // Write the updated package.json
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(chalk.green(`✅ Workspace dependencies restored for ${packagePath}`));
}

// Build package
function buildPackage(packagePath, packageName) {
  console.log(chalk.blue(`\n🔨 Building ${packageName}...`));
  
  try {
    if (packagePath === 'config') {
      execSync('pnpm run build', { cwd: path.join(process.cwd(), packagePath), stdio: 'inherit' });
    } else if (packagePath === 'server') {
      execSync('pnpm run prebuild && pnpm run build', { cwd: path.join(process.cwd(), packagePath), stdio: 'inherit' });
    } else if (packagePath === 'client') {
      execSync('pnpm run prebuild && pnpm run build', { cwd: path.join(process.cwd(), packagePath), stdio: 'inherit' });
    }
    console.log(chalk.green(`✅ ${packageName} built successfully`));
  } catch (error) {
    console.log(chalk.red(`❌ Failed to build ${packageName}`));
    throw error;
  }
}

// Publish package
function publishPackage(packagePath, packageName, tag = 'latest') {
  console.log(chalk.blue(`\n🚀 Publishing ${packageName} with tag ${tag}...`));
  
  try {
    const command = `pnpm publish --access public --tag ${tag} --registry https://registry.npmjs.org --no-git-checks`;
    execSync(command, { cwd: path.join(process.cwd(), packagePath), stdio: 'inherit' });
    console.log(chalk.green(`✅ ${packageName} published successfully!`));
  } catch (error) {
    console.log(chalk.red(`❌ Failed to publish ${packageName}`));
    throw error;
  }
}

// Create GitHub release
function createGitHubRelease(tagName, releaseNotes) {
  console.log(chalk.blue(`\n📝 Creating GitHub release ${tagName}...`));
  
  try {
    // Create release using GitHub CLI if available
    const command = `gh release create ${tagName} --title "${tagName}" --notes "${releaseNotes}"`;
    execSync(command, { stdio: 'inherit' });
    console.log(chalk.green(`✅ GitHub release ${tagName} created successfully!`));
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Failed to create GitHub release (GitHub CLI may not be installed or configured)`));
    console.log(chalk.gray('You can manually create the release at: https://github.com/fecommunity/reactpress/releases/new'));
  }
}

// Check environment
function checkEnvironment() {
  // Check if pnpm is installed
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
  } catch (error) {
    console.log(chalk.red('❌ pnpm is not installed. Please install pnpm first.'));
    return false;
  }
  
  // Check if logged in to npm
  try {
    execSync('pnpm whoami --registry https://registry.npmjs.org', { stdio: 'ignore' });
  } catch (error) {
    console.log(chalk.red('❌ Not logged in to npm. Please run "pnpm login --registry https://registry.npmjs.org" first.'));
    return false;
  }
  
  return true;
}

// Main function
async function main() {
  // Check if called with --no-build flag
  const noBuild = process.argv.includes('--no-build');
  
  console.log(chalk.blue('📦 ReactPress Package Publisher\n'));
  
  // Run environment checks
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  // Show current versions
  console.log(chalk.cyan('📋 Current package versions:'));
  packages.forEach(pkg => {
    const version = getCurrentVersion(pkg.path);
    console.log(chalk.gray(`  ${pkg.name}: ${version}`));
  });
  console.log();
  
  // Ask for publishing options
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '🚀 Publish all packages with version bump', value: 'publish-all' },
        { name: '📦 Publish specific package', value: 'publish-one' },
        { name: '🔨 Build all packages only', value: 'build-all' },
        { name: '🏷️  Publish as beta/alpha', value: 'publish-prerelease' },
        { name: '❌ Cancel', value: 'cancel' }
      ]
    }
  ]);
  
  if (action === 'cancel') {
    console.log(chalk.yellow('Operation cancelled.'));
    return;
  }
  
  if (action === 'build-all') {
    console.log(chalk.blue('🔨 Building all packages...\n'));
    for (const pkg of packages) {
      if (fs.existsSync(path.join(process.cwd(), pkg.path))) {
        buildPackage(pkg.path, pkg.name);
      } else {
        console.log(chalk.yellow(`⚠️  Package ${pkg.name} directory not found, skipping...`));
      }
    }
    console.log(chalk.green('\n🎉 All packages built successfully!'));
    return;
  }
  
  if (action === 'publish-one') {
    const { selectedPackage } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPackage',
        message: 'Which package would you like to publish?',
        choices: packages.map(pkg => ({
          name: `${pkg.name} (${pkg.description})`,
          value: pkg
        }))
      }
    ]);
    
    const { versionType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'versionType',
        message: 'Version bump type:',
        choices: [
          { name: 'Beta (1.0.0-beta.1 -> 1.0.0-beta.2)', value: 'beta' },
          { name: 'Patch (1.0.0 -> 1.0.1)', value: 'patch' },
          { name: 'Minor (1.0.0 -> 1.1.0)', value: 'minor' },
          { name: 'Major (1.0.0 -> 2.0.0)', value: 'major' },
          { name: 'Custom version', value: 'custom' }
        ]
      }
    ]);
    
    let newVersion;
    const currentVersion = getCurrentVersion(selectedPackage.path);
    
    if (versionType === 'custom') {
      const { customVersion } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customVersion',
          message: `Enter new version for ${selectedPackage.name} (current: ${currentVersion}):`,
          validate: (input) => {
            const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
            return semverRegex.test(input) || 'Please enter a valid semver version (e.g., 1.0.0)';
          }
        }
      ]);
      newVersion = customVersion;
    } else {
      newVersion = getNextAvailableVersion(selectedPackage.name, currentVersion, versionType);
    }
    
    // Get all package versions for dependency resolution
    const packageVersions = {};
    packages.forEach(pkg => {
      packageVersions[pkg.name] = getCurrentVersion(pkg.path);
    });
    // Update the selected package version
    packageVersions[selectedPackage.name] = newVersion;
    
    // Fix workspace dependencies before publishing
    fixWorkspaceDependencies(selectedPackage.path, packageVersions);
    
    try {
      updateVersion(selectedPackage.path, newVersion);
      // Only build if not disabled
      if (!noBuild) {
        buildPackage(selectedPackage.path, selectedPackage.name);
      }
      
      // Determine tag based on version type
      const tag = versionType === 'beta' ? 'beta' : 'latest';
      publishPackage(selectedPackage.path, selectedPackage.name, tag);
      
      console.log(chalk.green(`\n🎉 ${selectedPackage.name} v${newVersion} published successfully!`));
    } finally {
      // Always restore workspace dependencies
      restoreWorkspaceDependencies(selectedPackage.path);
    }
    
    return;
  }
  
  if (action === 'publish-prerelease') {
    const { tag } = await inquirer.prompt([
      {
        type: 'list',
        name: 'tag',
        message: 'Select prerelease tag:',
        choices: ['beta', 'alpha', 'rc', 'next']
      }
    ]);
    
    const { versionType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'versionType',
        message: 'Version bump type:',
        choices: [
          { name: `Prerelease (${tag})`, value: tag },
          { name: 'Patch (1.0.0 -> 1.0.1)', value: 'patch' },
          { name: 'Minor (1.0.0 -> 1.1.0)', value: 'minor' },
          { name: 'Major (1.0.0 -> 2.0.0)', value: 'major' },
          { name: 'Custom version', value: 'custom' }
        ]
      }
    ]);
    
    // Get all package versions for dependency resolution
    const packageVersions = {};
    packages.forEach(pkg => {
      const currentVersion = getCurrentVersion(pkg.path);
      packageVersions[pkg.name] = currentVersion;
    });
    
    // Process each package
    for (const pkg of packages) {
      if (!fs.existsSync(path.join(process.cwd(), pkg.path))) {
        console.log(chalk.yellow(`⚠️  Package ${pkg.name} directory not found, skipping...`));
        continue;
      }
      
      let newVersion;
      const currentVersion = getCurrentVersion(pkg.path);
      
      if (versionType === 'custom') {
        const { customVersion } = await inquirer.prompt([
          {
            type: 'input',
            name: 'customVersion',
            message: `Enter version for ${pkg.name} (current: ${currentVersion}):`,
            default: currentVersion
          }
        ]);
        newVersion = customVersion;
      } else {
        newVersion = getNextAvailableVersion(pkg.name, currentVersion, versionType);
      }
      
      // Update package version in our tracking
      packageVersions[pkg.name] = newVersion;
      
      // Fix workspace dependencies before publishing
      fixWorkspaceDependencies(pkg.path, packageVersions);
      
      try {
        updateVersion(pkg.path, newVersion);
        // Only build if not disabled
        if (!noBuild) {
          buildPackage(pkg.path, pkg.name);
        }
        publishPackage(pkg.path, pkg.name, tag);
      } finally {
        // Always restore workspace dependencies
        restoreWorkspaceDependencies(pkg.path);
      }
    }
    
    console.log(chalk.green(`\n🎉 All packages published with ${tag} tag!`));
    return;
  }
  
  if (action === 'publish-all') {
    // Check if we're on master branch for final release
    let isMasterBranch = false;
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      isMasterBranch = branch === 'master' || branch === 'main';
    } catch (error) {
      console.log(chalk.yellow('⚠️  Unable to determine current branch'));
    }
    
    const { versionType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'versionType',
        message: 'Version bump type:',
        choices: [
          { name: `Beta ${isMasterBranch ? '(will publish as final)' : '(will publish as beta)'}`, value: 'beta' },
          { name: 'Patch (1.0.0 -> 1.0.1)', value: 'patch' },
          { name: 'Minor (1.0.0 -> 1.1.0)', value: 'minor' },
          { name: 'Major (1.0.0 -> 2.0.0)', value: 'major' },
          { name: 'Custom version', value: 'custom' }
        ]
      }
    ]);
    
    // Get all package versions for dependency resolution
    const packageVersions = {};
    const originalVersions = {};
    
    packages.forEach(pkg => {
      const currentVersion = getCurrentVersion(pkg.path);
      originalVersions[pkg.name] = currentVersion;
      packageVersions[pkg.name] = currentVersion;
    });
    
    let baseVersion;
    if (versionType === 'custom') {
      const { customVersion } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customVersion',
          message: 'Enter new version for all packages:',
          validate: (input) => {
            const semverRegex = /^\d+\.\d+\.\d+$/;
            return semverRegex.test(input) || 'Please enter a valid semver version (e.g., 1.0.0)';
          }
        }
      ]);
      baseVersion = customVersion;
    } else {
      // Use the highest current version as base and increment
      const nextVersion = getNextAvailableVersion(packages[0].name, originalVersions[packages[0].name], versionType);
      baseVersion = nextVersion;
    }
    
    console.log(chalk.cyan(`\n📋 Will publish all packages with version: ${baseVersion}\n`));
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to proceed?',
        default: false
      }
    ]);
    
    if (!confirm) {
      console.log(chalk.yellow('Operation cancelled.'));
      return;
    }
    
    // Update versions, build and publish
    for (const pkg of packages) {
      if (!fs.existsSync(path.join(process.cwd(), pkg.path))) {
        console.log(chalk.yellow(`⚠️  Package ${pkg.name} directory not found, skipping...`));
        continue;
      }
      
      console.log(chalk.blue(`\n📦 Processing ${pkg.name}...`));
      
      // For publish-all, we use the same version for all packages
      const pkgVersion = baseVersion;
      packageVersions[pkg.name] = pkgVersion;
      
      // Fix workspace dependencies before publishing
      fixWorkspaceDependencies(pkg.path, packageVersions);
      
      try {
        updateVersion(pkg.path, pkgVersion);
        // Only build if not disabled
        if (!noBuild) {
          buildPackage(pkg.path, pkg.name);
        }
        
        // Determine tag based on version type and branch
        const tag = (versionType === 'beta' && !isMasterBranch) ? 'beta' : 'latest';
        publishPackage(pkg.path, pkg.name, tag);
      } finally {
        // Always restore workspace dependencies
        restoreWorkspaceDependencies(pkg.path);
      }
    }
    
    // Create GitHub release if on master
    if (isMasterBranch) {
      const tagName = `v${baseVersion}`;
      const releaseNotes = `Release ${baseVersion}\n\nPackages released:\n${Object.entries(packageVersions).map(([name, version]) => `- ${name}@${version}`).join('\n')}`;
      createGitHubRelease(tagName, releaseNotes);
    }
    
    console.log(chalk.green(`\n🎉 All packages published successfully with version ${baseVersion}!`));
    console.log(chalk.cyan('\n📋 Next steps:'));
    console.log(chalk.gray('1. Create a git tag: git tag v' + baseVersion));
    console.log(chalk.gray('2. Push changes: git push && git push --tags'));
    console.log(chalk.gray('3. Create a GitHub release'));
  }
}

main().catch(error => {
  console.error(chalk.red('❌ Publishing failed:'), error);
  process.exit(1);
});