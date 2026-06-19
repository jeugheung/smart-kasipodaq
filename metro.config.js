const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Настройка трансформера для svg
defaultConfig.transformer = {
  ...defaultConfig.transformer, // сохраняем существующие настройки
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
  // ВАЖНО: фикс для Reanimated / Hermes
  unstable_enablePackageExports: false,
};

// Настройка резолвера для svg
defaultConfig.resolver = {
  ...defaultConfig.resolver,
  assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== "svg"),
  sourceExts: [...defaultConfig.resolver.sourceExts, "svg"],
};

module.exports = defaultConfig;