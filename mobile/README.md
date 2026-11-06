# Linkin KYC Mobile application source

This directory contains the React Native application source. The Android native project is generated from the official React Native 0.88.1 template by the repository bootstrap workflow, then the contents of this directory are overlaid into it.

## Local setup after native bootstrap

```bash
cd android-app
npm install
npm run typecheck
npm start
# In another terminal, with Android SDK/ADB and a device or emulator:
npm run android
```

The workflow produces:
- `linkin-kyc-debug-apk`: debug APK for device testing
- `linkin-kyc-android-project`: generated Android project source including Gradle wrapper

## Current functionality and explicit limitations

Implemented in this client:
- 14-step navigable KYC flow
- consent checkbox gate
- front/back CNIC and face photo capture using Android camera via react-native-image-picker
- manually entered CNIC details
- opens the user's SMS app addressed to 7000 with the CNIC number
- manual SMS text entry for development only
- explicit pending/not-verified states; no client-side approval claim

Not implemented / not production-ready:
- backend API integration and secure user-authenticated BFF route
- upload endpoints/private object storage
- OCR and CNIC field extraction
- face matching and liveness provider
- Google Play services SMS User Consent Kotlin bridge
- authenticated NADRA response validation
- policy-version retrieval and server-side consent recording
- secure encrypted evidence persistence and deletion lifecycle

Images and identity fields currently remain in app memory for the session. They are not uploaded. Avoid real identity data in development builds.
