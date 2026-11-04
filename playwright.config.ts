import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:6006" },
  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"],
      testIgnore: /touch\.spec/,
    },
    {
      name: "firefox",
      use: devices["Desktop Firefox"],
      testIgnore: /touch\.spec/,
    },
    {
      name: "webkit",
      use: devices["Desktop Safari"],
      testIgnore: /touch\.spec/,
    },
    // Emulated phones: touch events and coarse-pointer CSS, not real hardware or assistive tech.
    { name: "phone-chrome", use: devices["Pixel 7"], testMatch: /touch\.spec/ },
    {
      name: "phone-safari",
      use: devices["iPhone 14"],
      testMatch: /touch\.spec/,
    },
  ],
  webServer: {
    command: "npm run storybook -- --ci --host 127.0.0.1",
    port: 6006,
    reuseExistingServer: !process.env.CI,
  },
});
