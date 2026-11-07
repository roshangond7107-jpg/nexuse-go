// Expo SDK 52 auto-detects pnpm/npm workspaces. Kept explicit for clarity.
const { getDefaultConfig } = require('expo/metro-config');
module.exports = getDefaultConfig(__dirname);
