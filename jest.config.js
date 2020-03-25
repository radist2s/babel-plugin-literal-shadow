const lib = '/lib/';

module.exports = {
  testPathIgnorePatterns: [lib],
  collectCoverageFrom: [
    'src/babel/*.js',
    '!src/babel/*.test.js'
  ],
  transform: {

  },
  projects: [
    {
      displayName: 'node',
      roots: ['<rootDir>/src/'],
      modulePathIgnorePatterns: [lib],
      testEnvironment: 'node',
    },
  ],
};
