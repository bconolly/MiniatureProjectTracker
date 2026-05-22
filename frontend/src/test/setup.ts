import '@testing-library/jest-dom'

// TZ is pinned to UTC by the npm test script so date assertions in tests
// (e.g. "1/1/2024", "December 25, 2023") are stable across dev machines.

// Default the locale so tests are stable on machines that aren't en-US.
const originalToLocaleDateString = Date.prototype.toLocaleDateString
Date.prototype.toLocaleDateString = function (
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions
) {
  return originalToLocaleDateString.call(this, locales ?? 'en-US', options)
}
