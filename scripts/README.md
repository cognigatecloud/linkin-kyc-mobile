# Build and CI

GitHub Actions uses the free GitHub-hosted `ubuntu-latest` runner for this workflow, subject to the account's included Actions minutes and storage limits.

The Android workflow generates the official React Native 0.88.1 native project, overlays `mobile/`, installs dependencies, runs TypeScript checking, builds `assembleDebug`, and uploads both an APK and a ZIP of the generated Android project.

No AWS, paid runner, self-hosted runner, or app-store signing credentials are required for debug CI.
