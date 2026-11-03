module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  // Prefer .ts sources over stale compiled .js files produced by `npm run build`.
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  setupFiles: ['<rootDir>/test/setup-env.ts']
};
