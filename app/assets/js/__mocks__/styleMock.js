/**
 * CSS/SCSS Mock for Jest
 * 
 * This file is used by Jest to replace CSS imports during testing.
 * 
 * When a component imports a CSS file, Jest will use this empty object instead.
 * This prevents Jest from trying to parse CSS as JavaScript, which would cause errors.
 * 
 * Referenced in jest.config.json via moduleNameMapper:
 * "\.(css|less|scss|sass)$": "<rootDir>/assets/js/__mocks__/styleMock.js"
 * 
 * This approach is needed for TurboUI components that directly import CSS files,
 * such as the datepicker styles in turboui/src/styles/datepicker/index.ts.
 */
module.exports = {};
