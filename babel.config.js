module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(!isTest);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@features': './src/features',
            '@shared': './src/shared',
            '@navigation': './src/navigation',
            '@store': './src/store',
            '@theme': './src/theme',
            '@assets': './assets',
            '@data': './src/data',
            '@config': './src/config',
            '@modules': './modules',
          },
        },
      ],
      ...(isTest
        ? []
        : ['react-native-reanimated/plugin']),
    ],
  };
};
