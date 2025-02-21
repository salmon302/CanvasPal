/** @type {import("ts-jest").JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1"
    },
    transform: {
        "^.+\\.tsx?$": ["ts-jest", {
            tsconfig: "tsconfig.json"
        }]
    },
    collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
        "!src/types/**",
        "!src/**/*.d.ts"
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    testMatch: [
        "<rootDir>/tests/**/*.test.ts"
    ],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    testEnvironmentOptions: {
        customExportConditions: ["node", "node-addons"]
    }
};
