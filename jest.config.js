/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  testMatch: ['**/*.test.(ts|js)'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['**/*.{ts,js}', '!**/node_modules/**', '!**/dist/**'],
};