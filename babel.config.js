module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            // Здесь указываем путь от корня проекта до папок
            '@shared': './src/shared', 
            '@views': './src/views',
            '@entities': './src/entities',
            '@features': './src/features',
            '@widgets': './src/widgets',
            '@navigation': './src/app/Navigation',
          },
        },
      ],
    ],
  };
};