module.exports = {
  presets: [['@babel/preset-env']],
  overrides: [
    {
      test: 'src/**/*.test.js',
      presets: [
        [
          '@babel/preset-react',
          {
            throwIfNamespace: false,
          },
        ],
      ],
      plugins: [
        ['./lib/babel']
      ],
    },
    {
      test: [
        'src',
      ],
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 8,
            },
          },
        ],
      ],
    },
  ]
};
