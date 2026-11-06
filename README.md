# Linkin KYC Mobile

Standalone Android-first React Native client for Linkin's identity-verification journey.

## Repository layout

- `mobile/` — React Native TypeScript app source, package configuration and design implementation.
- `.github/workflows/android-ci.yml` — free GitHub-hosted CI workflow. It generates the native Android project from the official React Native template, installs dependencies, type-checks, builds a debug APK, and uploads both the APK and complete generated Android project as workflow artifacts.
- `docs/IMPLEMENTATION_STATUS.md` — implemented features and integration blockers.

## Approved 14-screen flow

1. Splash
2. Welcome / Introduction
3. Permissions and Privacy
4. CNIC Front Capture
5. CNIC Back Capture
6. CNIC Details Review
7. Face Capture
8. Liveness Check
9. Face Verification
10. NADRA SMS Instructions
11. Fetch SMS
12. NADRA Response
13. Verification Processing
14. Completion

The app uses the supplied Linkin green-and-white design direction. It does not add Linkin registration, login, mobile OTP, provider tools, or unrelated app features.

## Run and download

Every push affecting `mobile/` or the Android workflow starts GitHub Actions.

Open the repository's **Actions → Linkin KYC Android CI → latest successful run → Artifacts**:
- `linkin-kyc-debug-apk` — installable debug APK for Android device testing.
- `linkin-kyc-android-project` — ZIP containing the generated native Android project and source; extract it locally, install Node.js/Java/Android SDK, then run `npm install` and `npm run android`.

GitHub-hosted `ubuntu-latest` runners are used. Public repositories currently receive free standard-runner usage, subject to GitHub's applicable Actions limits and artifact retention. The workflow does not require AWS or a self-hosted runner.

## Architecture and security boundaries

- This repository is the mobile client only. The existing Go KYC service and PostgreSQL remain in the separate `cognigatecloud/KYC` repository.
- Never embed the KYC service bearer secret in the Android app. The current KYC API is service-to-service authenticated; mobile integration requires a trusted Linkin backend/BFF or an explicitly approved user-authenticated contract.
- The backend is authoritative. The mobile client must never independently declare a user verified.
- Do not treat user-pasted SMS content as authenticated NADRA evidence.
- No fingerprint capture or matching is included.

## Current client capabilities

- 14-step navigable experience and green/white component system.
- Consent gate in the local UI.
- Camera capture for CNIC front, CNIC back and face using `react-native-image-picker`.
- Manual CNIC detail entry.
- Opens the user's SMS app with recipient 7000 and the entered CNIC number; the user reviews and sends the SMS.
- Development-only manual SMS response entry.
- Clear pending states where backend/provider integrations do not exist.

## Not production-ready

The following are still unimplemented: secure API/BFF integration, session creation and server consent recording, private evidence upload, OCR, CNIC consistency checks, face matching, liveness provider, Android SMS User Consent API bridge, NADRA response authenticity validation, backend evidence orchestration, verification polling, retention and deletion lifecycle.

The separate KYC backend README currently states that these evidence integrations are not yet operational. It also describes phone OTP as required evidence, which conflicts with the approved mobile workflow that excludes mobile OTP. Resolve this backend policy/contract discrepancy before production integration.

The OpenAPI server URL is a placeholder. Obtain the real environment URL from deployment configuration. Do not send real identity documents or CNIC data through this development build.

See [mobile/README.md](mobile/README.md) and [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).
