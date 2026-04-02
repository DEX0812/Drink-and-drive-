const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tell Metro to ignore .next folders from the Next.js apps in the monorepo
config.resolver.blockList = [
  ...config.resolver.blockList,
  /.*\.next.*/,
];

module.exports = config;
