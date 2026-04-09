const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project root (where package.json and node_modules are)
const projectRoot = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);

// 1. Watch all files within the monorepo root
config.watchFolders = [projectRoot];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

// 3. Force Metro to resolve shared packages correctly
config.resolver.disableHierarchicalLookup = true;

// 4. Ignore .next folders from the Next.js apps
config.resolver.blockList = [
  ...config.resolver.blockList,
  /.*\.next.*/,
];

module.exports = config;
