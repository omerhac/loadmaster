module.exports = (path, options) => {
  // Special handling for our test files
  // Call the default resolver, but add some special logic
  return options.defaultResolver(path, {
    ...options,
    // Don't mock these specific test files that need real implementation
    packageFilter: pkg => {
      // Handle special cases for tests that need real modules 
      if (path.includes('__tests__/services/DatabaseIntegrationTests.test.ts')) {
        // For these paths, we want to use the real implementations
        if (pkg.name === 'better-sqlite3') {
          return pkg;
        }
      }
      
      // For all other cases, use the default package
      return pkg;
    },
  });
}; 